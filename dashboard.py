#!/usr/bin/env python3
"""
BeleidsBibliotheek — Deploy Dashboard (in de documentatie: «Beheerpagina»)

Dick noemt dit de **Beheerpagina**: http://localhost:8800/ na `python3 dashboard.py` —
deploy-overzicht, backlog, vergelijker, en preview van `wassenaar/` onder /local-site/.
Niet te verwarren met de statische site-pagina `wassenaar/beheer.html`.

Start:
    python3 dashboard.py

Opent automatisch http://localhost:8800 in de browser.
Geen dependencies nodig — alleen Python 3.
"""

import http.server
import json
import mimetypes
import os
import re
import subprocess
import threading
import webbrowser
import urllib.parse

# Standaard 8800; als die bezet is: BELEIDS_DASHBOARD_PORT=8801 python3 dashboard.py
try:
    PORT = int(os.environ.get("BELEIDS_DASHBOARD_PORT", "8800"))
except ValueError:
    PORT = 8800
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
# Lokale BeleidsBibliotheek voor de vergelijker (zelfde map als ACC/PROD-deploy): geen aparte http.server nodig.
LOCAL_SITE_PREFIX = "/local-site"


def read_version():
    try:
        with open(os.path.join(PROJECT_DIR, "VERSION")) as f:
            return f.read().strip()
    except FileNotFoundError:
        return "?"


def read_deploy_log():
    path = os.path.join(PROJECT_DIR, "docs", "deploy-log.md")
    try:
        with open(path) as f:
            lines = f.readlines()
        entries = []
        for line in lines:
            if line.startswith("|") and not line.startswith("| Datum") and not line.startswith("|---"):
                cols = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cols) >= 5:
                    entries.append({
                        "datum": cols[0], "versie": cols[1],
                        "omgeving": cols[2], "door": cols[3],
                        "opmerking": cols[4]
                    })
        return entries
    except FileNotFoundError:
        return []


def read_backlog_top():
    path = os.path.join(PROJECT_DIR, "BACKLOG.md")
    try:
        with open(path) as f:
            content = f.read()
        items = []
        in_p0 = False
        for line in content.split("\n"):
            if "## P0" in line:
                in_p0 = True
                continue
            if in_p0 and line.startswith("## "):
                break
            if in_p0 and line.startswith("| B-"):
                cols = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cols) >= 3:
                    items.append({"id": cols[0], "item": cols[1], "status": cols[2]})
        return items
    except FileNotFoundError:
        return []


def list_backups():
    backup_dir = os.path.join(PROJECT_DIR, "backups")
    if not os.path.isdir(backup_dir):
        return []
    dirs = sorted(
        [d for d in os.listdir(backup_dir) if d.startswith("prod_")],
        reverse=True
    )
    result = []
    for d in dirs[:10]:
        full = os.path.join(backup_dir, d)
        count = sum(1 for _, _, files in os.walk(full) for _ in files)
        size_bytes = sum(
            os.path.getsize(os.path.join(dp, f))
            for dp, _, fns in os.walk(full) for f in fns
        )
        size_mb = round(size_bytes / 1024 / 1024, 1)
        result.append({"naam": d, "bestanden": count, "grootte_mb": size_mb})
    return result


def read_backup_log():
    log_path = os.path.join(PROJECT_DIR, "backups", "backup-daily.log")
    try:
        with open(log_path) as f:
            content = f.read()
        lines = content.strip().split("\n")
        return {"beschikbaar": True, "regels": lines[-30:]}
    except FileNotFoundError:
        return {"beschikbaar": False, "regels": []}


def get_schedule_status():
    try:
        result = subprocess.run(
            ["launchctl", "list", "nl.beleidsbibliotheek.backup"],
            capture_output=True, text=True
        )
        return result.returncode == 0
    except Exception:
        return False


def get_git_status():
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "wassenaar/"],
            capture_output=True, text=True, cwd=PROJECT_DIR
        )
        lines = [l for l in result.stdout.strip().split("\n") if l.strip()]
        return {"gewijzigd": len(lines), "bestanden": lines[:20]}
    except Exception:
        return {"gewijzigd": 0, "bestanden": []}


def stream_script(handler, script_name, notitie=""):
    """Run a script and stream output line by line via SSE."""
    script = os.path.join(PROJECT_DIR, script_name)
    if not os.path.isfile(script):
        handler.send_sse("error", f"Script niet gevonden: {script_name}")
        handler.send_sse("done", "mislukt")
        return

    if script_name.endswith(".py"):
        cmd = ["python3", "-u", script]
    else:
        cmd = ["bash", script]
    if notitie:
        cmd.append(notitie)

    handler.send_sse("info", f"$ ./{script_name} {notitie}".strip())

    try:
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1, cwd=PROJECT_DIR,
            env={**os.environ, "TERM": "dumb"}
        )
        ansi_re = re.compile(r'\x1b\[[0-9;]*m')
        for line in proc.stdout:
            clean = ansi_re.sub('', line.rstrip('\n'))
            if clean:
                handler.send_sse("log", clean)
        proc.wait(timeout=120)

        if proc.returncode == 0:
            handler.send_sse("info", "Klaar.")
            handler.send_sse("done", "gelukt")
        else:
            handler.send_sse("error", f"Script eindigde met code {proc.returncode}")
            handler.send_sse("done", "mislukt")
    except subprocess.TimeoutExpired:
        proc.kill()
        handler.send_sse("error", "Timeout — script duurde langer dan 2 minuten.")
        handler.send_sse("done", "mislukt")
    except Exception as e:
        handler.send_sse("error", str(e))
        handler.send_sse("done", "mislukt")


class DashboardHandler(http.server.SimpleHTTPRequestHandler):

    def _send_local_site_file(self, parsed):
        """Serve files from wassenaar/ under LOCAL_SITE_PREFIX (voor docs/vergelijk.html)."""
        raw = parsed.path
        if not (raw == LOCAL_SITE_PREFIX or raw.startswith(LOCAL_SITE_PREFIX + "/")):
            return False
        rel = raw[len(LOCAL_SITE_PREFIX):].lstrip("/")
        rel = os.path.normpath(rel) if rel else ""
        if rel.startswith(".."):
            self.send_error(403)
            return True
        base = os.path.abspath(os.path.join(PROJECT_DIR, "wassenaar"))
        full = os.path.join(base, rel) if rel else base
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            self.send_error(404)
            return True
        abs_full = os.path.abspath(full)
        try:
            if os.path.commonpath([base, abs_full]) != base:
                self.send_error(403)
                return True
        except ValueError:
            self.send_error(403)
            return True
        ctype, enc = mimetypes.guess_type(full)
        if ctype is None:
            ctype = "application/octet-stream"
        if ctype.startswith("text/") or ctype in (
            "application/javascript", "application/json", "application/manifest+json",
        ):
            ctype = ctype + "; charset=utf-8"
        try:
            with open(full, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(500)
            return True
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
        return True

    def _send_raad_opnames_file(self, parsed):
        """Serve files from raad-opnames/ (concept, verslagen, …)."""
        raw = parsed.path
        prefix = "/raad-opnames"
        if raw != prefix and not raw.startswith(prefix + "/"):
            return False
        if raw in (prefix, prefix + "/"):
            rel = "index.html"
        else:
            rel = raw[len(prefix):].lstrip("/")
            rel = os.path.normpath(rel) if rel else ""
        if rel.startswith(".."):
            self.send_error(403)
            return True
        base = os.path.abspath(os.path.join(PROJECT_DIR, "raad-opnames"))
        full = os.path.join(base, rel) if rel else base
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            self.send_error(404)
            return True
        abs_full = os.path.abspath(full)
        try:
            if os.path.commonpath([base, abs_full]) != base:
                self.send_error(403)
                return True
        except ValueError:
            self.send_error(403)
            return True
        ctype, _enc = mimetypes.guess_type(full)
        if ctype is None:
            ctype = "application/octet-stream"
        if ctype.startswith("text/") or ctype in (
            "application/javascript", "application/json", "application/manifest+json",
        ):
            ctype = ctype + "; charset=utf-8"
        try:
            with open(full, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(500)
            return True
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
        return True

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if self._send_local_site_file(parsed):
            return

        if self._send_raad_opnames_file(parsed):
            return

        if parsed.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html_path = os.path.join(PROJECT_DIR, "docs", "werkwijze-dashboard.html")
            with open(html_path, "rb") as f:
                self.wfile.write(f.read())
            return

        if parsed.path == "/vergelijk.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html_path = os.path.join(PROJECT_DIR, "docs", "vergelijk.html")
            with open(html_path, "rb") as f:
                self.wfile.write(f.read())
            return

        if parsed.path == "/api/status":
            data = {
                "versie": read_version(),
                "git": get_git_status(),
                "deploy_log": read_deploy_log()[-5:],
                "backlog": read_backlog_top(),
                "backups": list_backups(),
                "backup_log": read_backup_log(),
                "schedule_actief": get_schedule_status()
            }
            self.send_json(data)
            return

        if parsed.path == "/api/run":
            actie = params.get("actie", [""])[0]
            notitie = params.get("notitie", [""])[0]
            bevestiging = params.get("bevestiging", [""])[0]

            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            if actie == "backup":
                stream_script(self, "backup-prod.sh")
            elif actie == "backup-daily":
                stream_script(self, "backup-daily.py")
            elif actie == "deploy-acc":
                stream_script(self, "deploy.sh", notitie)
            elif actie == "promote-prod":
                if bevestiging != "PRODUCTIE":
                    self.send_sse("error", 'Typ exact "PRODUCTIE" om te bevestigen.')
                    self.send_sse("done", "mislukt")
                else:
                    stream_script(self, "promote-to-prod.sh", notitie)
            else:
                self.send_sse("error", f"Onbekende actie: {actie}")
                self.send_sse("done", "mislukt")
            return

        super().do_GET()

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def send_sse(self, event, data):
        try:
            msg = f"event: {event}\ndata: {data}\n\n"
            self.wfile.write(msg.encode())
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", PORT), DashboardHandler)
    print(f"Dashboard draait op http://localhost:{PORT}")
    print(f"  Lokale site (voor Omgevingen vergelijken): http://127.0.0.1:{PORT}{LOCAL_SITE_PREFIX}/")
    print(f"  Raadsopnames-aanpak (concept): http://127.0.0.1:{PORT}/raad-opnames/")
    print("Ctrl+C om te stoppen.\n")
    threading.Timer(0.5, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard gestopt.")
        server.server_close()
