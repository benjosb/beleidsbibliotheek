"""
WIL Boardroom API
Flask API serving the boardroom agents on the VPS.
Runs behind Nginx reverse proxy on /api/
"""

import os
import json
import threading
import uuid
import fcntl
import time
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.utils import formataddr

from flask import Flask, request, jsonify
from flask_cors import CORS

from find_secretaris import search_gemeente

app = Flask(__name__)
CORS(app, origins=[
    'https://wassenaar.besluit-wijzer.nl',
    'https://besluit-wijzer.nl',
    'https://boardroom.besluit-wijzer.nl',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:8080',
    'http://localhost:8080',
], allow_headers=['Content-Type', 'Authorization'], methods=['GET', 'POST', 'DELETE', 'OPTIONS'])

RESULTS_DIR = os.environ.get('WIL_API_RESULTS_DIR', '/opt/wil-api/results')
os.makedirs(RESULTS_DIR, exist_ok=True)

# BeleidsBibliotheek Wassenaar — voorstellen (JSON op schijf)
BELEIDSNOTA_VOORSTELLEN_FILE = os.environ.get(
    'WASSENAAR_BELEIDSNOTA_VOORSTELLEN_FILE',
    '/opt/wil-api/beleidsnota_wassenaar_voorstellen.json',
)
WASSENAAR_BELEIDSNOTA_INGEST_SECRET = os.environ.get('WASSENAAR_BELEIDSNOTA_INGEST_SECRET', '')

# E-mail bij “één klik” (geen Bearer nodig) — vult SMTP + notify-adres in op de VPS
WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL = os.environ.get('WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL', '').strip()
WASSENAAR_SMTP_HOST = os.environ.get('WASSENAAR_SMTP_HOST', '').strip()
WASSENAAR_SMTP_PORT = int(os.environ.get('WASSENAAR_SMTP_PORT', '587') or '587')
WASSENAAR_SMTP_USER = os.environ.get('WASSENAAR_SMTP_USER', '').strip()
WASSENAAR_SMTP_PASSWORD = os.environ.get('WASSENAAR_SMTP_PASSWORD', '').strip()
WASSENAAR_SMTP_FROM = os.environ.get('WASSENAAR_SMTP_FROM', '').strip() or WASSENAAR_SMTP_USER

# simpele rate limit: per IP max N meldingen per uur
_MAIL_RATE_BUCKETS = {}
_MAIL_RATE_MAX = int(os.environ.get('WASSENAAR_BELEIDSNOTA_MAIL_RATE_MAX', '20'))
_MAIL_RATE_WINDOW = int(os.environ.get('WASSENAAR_BELEIDSNOTA_MAIL_RATE_WINDOW', '3600'))

jobs = {}


def _client_ip():
    xf = request.headers.get('X-Forwarded-For') or request.environ.get('HTTP_X_FORWARDED_FOR')
    if xf:
        return xf.split(',')[0].strip()[:64]
    return (request.remote_addr or 'unknown')[:64]


def _mail_rate_allow(ip):
    now = time.time()
    lst = [t for t in _MAIL_RATE_BUCKETS.get(ip, []) if now - t < _MAIL_RATE_WINDOW]
    if len(lst) >= _MAIL_RATE_MAX:
        return False
    lst.append(now)
    _MAIL_RATE_BUCKETS[ip] = lst
    return True


def _parse_beleidsnota_json(data):
    """Valideer body; return (None, dict) bij succes of (error_key, None) bij fout."""
    data = data if isinstance(data, dict) else {}
    titel = (data.get('titel') or '').strip()
    link = (data.get('link') or '').strip()
    extra = (data.get('extra') or '').strip()[:500]
    naam = (data.get('naam') or '').strip()[:100]
    scope = data.get('scope') or {}

    if not titel or len(titel) > 240:
        return 'invalid_titel', None
    if not link or not link.startswith(('http://', 'https://')):
        return 'invalid_link', None

    try:
        bbv_index = int(scope.get('bbvIndex'))
    except (TypeError, ValueError):
        return 'invalid_scope', None
    if bbv_index < 0 or bbv_index > 30:
        return 'invalid_scope', None

    tv = scope.get('taakveldCode')
    if tv is not None and tv != '':
        tv = str(tv).strip()[:40]
    else:
        tv = None

    return None, {
        'titel': titel,
        'link': link,
        'extra': extra,
        'naam': naam,
        'bbv_index': bbv_index,
        'taakveld_code': tv,
        'scope_out': {
            'bbvIndex': bbv_index,
            'taakveldCode': tv,
            'niveau': 'kindtegel' if tv else 'hoofdniveau',
        },
    }


def _send_beleidsnota_melding_email(parsed, client_ip):
    """Verstuur plain-text mail. Return (True, None) of (False, error_code)."""
    if not (WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL and WASSENAAR_SMTP_HOST and WASSENAAR_SMTP_USER and WASSENAAR_SMTP_PASSWORD):
        return False, 'mail_not_configured'

    tv = parsed['taakveld_code']
    tv_label = 'null (hoofdstuk)' if tv is None else tv
    body = (
        'Nieuwe aanvraag: document toevoegen aan BeleidsBibliotheek Wassenaar\n\n'
        f'Titel: {parsed["titel"]}\n'
        f'Link: {parsed["link"]}\n'
        f'Toelichting: {parsed["extra"] or "(geen)"}\n\n'
        f'BBV-index: {parsed["bbv_index"]}\n'
        f'Taakveldcode: {tv_label}\n\n'
        f'Client-IP: {client_ip}\n'
        f'Tijdstip server: {datetime.now().isoformat()}\n'
    )
    subject = f'[BeleidsBibliotheek] {parsed["titel"][:70]}'

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr(('BeleidsBibliotheek Wassenaar', WASSENAAR_SMTP_FROM))
    msg['To'] = WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL

    try:
        with smtplib.SMTP(WASSENAAR_SMTP_HOST, WASSENAAR_SMTP_PORT, timeout=45) as smtp:
            smtp.starttls()
            smtp.login(WASSENAAR_SMTP_USER, WASSENAAR_SMTP_PASSWORD)
            smtp.sendmail(WASSENAAR_SMTP_FROM, [WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL], msg.as_string())
        return True, None
    except OSError as e:
        return False, f'smtp_error:{e}'
    except smtplib.SMTPException as e:
        return False, f'smtp_error:{e}'


def _voorstellen_read_all():
    if not os.path.exists(BELEIDSNOTA_VOORSTELLEN_FILE):
        return []
    try:
        with open(BELEIDSNOTA_VOORSTELLEN_FILE, 'r', encoding='utf-8') as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                raw = f.read()
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        data = json.loads(raw or '[]')
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _voorstellen_write_all(items):
    os.makedirs(os.path.dirname(BELEIDSNOTA_VOORSTELLEN_FILE), exist_ok=True)
    with open(BELEIDSNOTA_VOORSTELLEN_FILE, 'w', encoding='utf-8') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            json.dump(items[:2000], f, indent=2, ensure_ascii=False)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def _voorstellen_append(item):
    items = _voorstellen_read_all()
    items.insert(0, item)
    _voorstellen_write_all(items)


def run_search(job_id, gemeente):
    """Run the search in a background thread."""
    jobs[job_id]['status'] = 'running'
    jobs[job_id]['started'] = datetime.now().isoformat()
    try:
        result = search_gemeente(gemeente)
        jobs[job_id]['result'] = result
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['completed'] = datetime.now().isoformat()

        filepath = os.path.join(RESULTS_DIR, f"{gemeente.lower().replace(' ', '-')}_{job_id[:8]}.json")
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        jobs[job_id]['result_file'] = filepath

    except Exception as e:
        jobs[job_id]['status'] = 'error'
        jobs[job_id]['error'] = str(e)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'WIL Boardroom API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
    })


@app.route('/api/search/secretaris', methods=['POST'])
def search_secretaris():
    """
    Start a gemeente secretaris search.
    Body: { "gemeente": "Groningen" }
    Returns: { "job_id": "...", "status": "queued" }
    """
    data = request.get_json()
    if not data or 'gemeente' not in data:
        return jsonify({'error': 'gemeente parameter is required'}), 400

    gemeente = data['gemeente'].strip()
    if not gemeente:
        return jsonify({'error': 'gemeente cannot be empty'}), 400

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        'id': job_id,
        'gemeente': gemeente,
        'status': 'queued',
        'queued': datetime.now().isoformat(),
        'result': None,
        'error': None,
    }

    thread = threading.Thread(target=run_search, args=(job_id, gemeente), daemon=True)
    thread.start()

    return jsonify({'job_id': job_id, 'status': 'queued', 'gemeente': gemeente})


@app.route('/api/search/secretaris/sync', methods=['POST'])
def search_secretaris_sync():
    """
    Synchronous version — waits for the result.
    Body: { "gemeente": "Groningen", "manual": { "website"?, "bestuur_url"?, "secretaris_naam"?, "email_convention"? } }
    Returns the full result. When stuck, includes stuck_at, prompt, prompt_field for manual retry.
    """
    data = request.get_json()
    if not data or 'gemeente' not in data:
        return jsonify({'error': 'gemeente parameter is required'}), 400

    gemeente = data['gemeente'].strip()
    if not gemeente:
        return jsonify({'error': 'gemeente cannot be empty'}), 400

    manual = data.get('manual') or {}

    try:
        result = search_gemeente(gemeente, manual=manual)
        filepath = os.path.join(RESULTS_DIR, f"{gemeente.lower().replace(' ', '-')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'gemeente': gemeente}), 500


@app.route('/api/search/status/<job_id>', methods=['GET'])
def search_status(job_id):
    """Check the status of an async search job."""
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(jobs[job_id])


def _check_bearer():
    """Return True als het Bearer-token klopt, anders False."""
    if not WASSENAAR_BELEIDSNOTA_INGEST_SECRET:
        return False
    auth = request.headers.get('Authorization', '') or ''
    token = auth[7:].strip() if auth.lower().startswith('bearer ') else ''
    return token == WASSENAAR_BELEIDSNOTA_INGEST_SECRET


@app.route('/api/beleidsbibliotheek/wassenaar/voorstellen', methods=['POST'])
def voorstellen_indienen():
    """
    Iedereen kan een voorstel indienen (geen Bearer nodig).
    Rate limit per IP. Stuurt SMTP-notificatie naar beheerder.
    """
    ip = _client_ip()
    if not _mail_rate_allow(ip):
        return jsonify({'error': 'rate_limited'}), 429

    err_key, parsed = _parse_beleidsnota_json(request.get_json(silent=True))
    if err_key:
        return jsonify({'error': err_key}), 400

    new_item = {
        'id': str(uuid.uuid4()),
        'status': 'voorstel',
        'scope': parsed['scope_out'],
        'titel': parsed['titel'],
        'link': parsed['link'],
        'extra': parsed['extra'],
        'naam': parsed['naam'],
        'ingediendOp': datetime.now().isoformat(),
        'clientIp': ip,
    }
    try:
        _voorstellen_append(new_item)
    except OSError as e:
        return jsonify({'error': 'write_failed', 'detail': str(e)}), 500

    _send_beleidsnota_melding_email(parsed, ip)

    return jsonify({'ok': True, 'id': new_item['id']}), 201


@app.route('/api/beleidsbibliotheek/wassenaar/voorstellen', methods=['GET'])
def voorstellen_publiek():
    """Publieke lijst — alleen goedgekeurde voorstellen."""
    items = [v for v in _voorstellen_read_all() if v.get('status') == 'goedgekeurd']
    for item in items:
        item.pop('clientIp', None)
    return jsonify({'items': items, 'count': len(items)})


@app.route('/api/beleidsbibliotheek/wassenaar/voorstellen/beheer', methods=['GET'])
def voorstellen_beheer():
    """Alle voorstellen — voor de beheerder. Vereist Bearer-token."""
    if not _check_bearer():
        return jsonify({'error': 'unauthorized'}), 401
    items = _voorstellen_read_all()
    return jsonify({'items': items, 'count': len(items)})


@app.route('/api/beleidsbibliotheek/wassenaar/voorstellen/<voorstel_id>/beoordeel', methods=['POST'])
def voorstellen_beoordeel(voorstel_id):
    """Keur een voorstel goed of af. Vereist Bearer-token."""
    if not _check_bearer():
        return jsonify({'error': 'unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    new_status = (data.get('status') or '').strip()
    if new_status not in ('goedgekeurd', 'afgewezen'):
        return jsonify({'error': 'invalid_status', 'hint': 'Gebruik "goedgekeurd" of "afgewezen".'}), 400

    items = _voorstellen_read_all()
    found = False
    for item in items:
        if item.get('id') == voorstel_id:
            item['status'] = new_status
            item['beoordeeldOp'] = datetime.now().isoformat()
            found = True
            break

    if not found:
        return jsonify({'error': 'not_found'}), 404

    try:
        _voorstellen_write_all(items)
    except OSError as e:
        return jsonify({'error': 'write_failed', 'detail': str(e)}), 500

    return jsonify({'ok': True, 'id': voorstel_id, 'status': new_status})


@app.route('/api/beleidsbibliotheek/wassenaar/voorstellen/<voorstel_id>', methods=['DELETE'])
def voorstellen_verwijder(voorstel_id):
    """Verwijder een voorstel volledig. Vereist Bearer-token."""
    if not _check_bearer():
        return jsonify({'error': 'unauthorized'}), 401

    items = _voorstellen_read_all()
    new_items = [i for i in items if i.get('id') != voorstel_id]

    if len(new_items) == len(items):
        return jsonify({'error': 'not_found'}), 404

    try:
        _voorstellen_write_all(new_items)
    except OSError as e:
        return jsonify({'error': 'write_failed', 'detail': str(e)}), 500

    return jsonify({'ok': True, 'id': voorstel_id})


@app.route('/api/search/results', methods=['GET'])
def search_results():
    """List all saved search results."""
    results = []
    if os.path.exists(RESULTS_DIR):
        for fname in sorted(os.listdir(RESULTS_DIR), reverse=True):
            if fname.endswith('.json'):
                filepath = os.path.join(RESULTS_DIR, fname)
                try:
                    with open(filepath) as f:
                        data = json.load(f)
                    results.append({
                        'file': fname,
                        'gemeente': data.get('gemeente', ''),
                        'status': data.get('status', ''),
                        'secretaris': data.get('secretaris_naam', ''),
                    })
                except Exception:
                    pass
    return jsonify(results)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)
