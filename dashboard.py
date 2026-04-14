#!/usr/bin/env python3
"""
BeleidsBibliotheek — Deploy Dashboard

Start:
    python3 dashboard.py

Opent automatisch http://localhost:8800 in de browser.
Geen dependencies nodig — alleen Python 3.
"""

import http.server
import json
import os
import re
import subprocess
import threading
import webbrowser
import urllib.parse

PORT = 8800
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


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

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

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
    print("Ctrl+C om te stoppen.\n")
    threading.Timer(0.5, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard gestopt.")
        server.server_close()
