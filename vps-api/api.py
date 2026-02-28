"""
WIL Boardroom API
Flask API serving the boardroom agents on the VPS.
Runs behind Nginx reverse proxy on /api/
"""

import os
import json
import threading
import uuid
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

from find_secretaris import search_gemeente

app = Flask(__name__)
CORS(app, origins=[
    'https://boardroom.braamenco.nl',
    'https://boardroom.besluit-wijzer.nl',
    'http://localhost:*',
])

RESULTS_DIR = '/opt/wil-api/results'
os.makedirs(RESULTS_DIR, exist_ok=True)

jobs = {}


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
    Body: { "gemeente": "Groningen" }
    Returns the full result directly.
    """
    data = request.get_json()
    if not data or 'gemeente' not in data:
        return jsonify({'error': 'gemeente parameter is required'}), 400

    gemeente = data['gemeente'].strip()
    if not gemeente:
        return jsonify({'error': 'gemeente cannot be empty'}), 400

    try:
        result = search_gemeente(gemeente)
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
