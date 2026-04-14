#!/usr/bin/env python3
"""
BeleidsBibliotheek — Publiceer naar productie
Dubbelklik dit bestand of draai: python3 _publiceer.py
Opent automatisch een browserpagina op http://localhost:8890
"""

import http.server
import json
import os
import shutil
import webbrowser
import threading
import hashlib
from pathlib import Path
from datetime import datetime

PORT = 8890
WACHTWOORD_HASH = hashlib.sha256("wassenaar2026".encode()).hexdigest()

BASEDIR = Path(__file__).resolve().parent
BRON = BASEDIR / "wassenaar"
DOEL = BASEDIR / "_softlaunch_wo_8_april"

BESTANDEN = [
    "index.html", "app.js", "data.js", "styles.css", "disclaimer.js",
    "taakvelden_iv3.js", "stempel.svg", "wassenaar_logo_fc kopie.svg",
    "reactie.html", "werklijst-reacties.html", "werklijst-sociaal-domein.html",
    "beleidsnotas.html", "beleidsnotas.js",
    "overdrachtsdossier.html", "overdrachtsdossier.js",
    "roadmap.html", "verbeterpunten-beheer.html", "wijzigingen.html",
    "beheer.html", "viewer.html",
    "manifest.webmanifest", "sw.js", "pwa-register.js",
]

FAVICON_BESTANDEN = ["favicon.ico", "favicon.svg", "favicon-32.png"]

HTML_PAGE = """<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeleidsBibliotheek — Publiceer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f4f5f0;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,.1);
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }
  .logo { color: #55601c; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .sub { color: #888; font-size: 14px; margin-bottom: 32px; }
  label { display: block; text-align: left; font-size: 13px; color: #666; margin-bottom: 6px; }
  input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 24px;
    transition: border-color .2s;
  }
  input:focus { outline: none; border-color: #55601c; }
  button {
    width: 100%;
    padding: 14px;
    background: #55601c;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s;
  }
  button:hover { background: #6b7a24; }
  button:disabled { background: #bbb; cursor: wait; }
  .result {
    margin-top: 24px;
    padding: 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    text-align: left;
    display: none;
  }
  .result.ok { background: #eef6e6; border: 1px solid #b5d89a; color: #3a5a1c; }
  .result.fout { background: #fdecea; border: 1px solid #f5c6cb; color: #721c24; }
  .timestamp { color: #999; font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">BeleidsBibliotheek</div>
  <div class="sub">Publiceer naar productie-map</div>

  <label for="ww">Wachtwoord</label>
  <input type="password" id="ww" placeholder="Voer het wachtwoord in" autofocus
         onkeydown="if(event.key==='Enter') publiceer()">

  <button id="btn" onclick="publiceer()">Publiceer naar productie</button>

  <div class="result" id="result"></div>
  <div class="timestamp" id="ts"></div>
</div>
<script>
async function publiceer() {
  const btn = document.getElementById('btn');
  const res = document.getElementById('result');
  const ww = document.getElementById('ww').value;
  if (!ww) { alert('Vul het wachtwoord in.'); return; }

  btn.disabled = true;
  btn.textContent = 'Bezig...';
  res.style.display = 'none';

  try {
    const r = await fetch('/publiceer', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({wachtwoord: ww})
    });
    const data = await r.json();
    res.style.display = 'block';
    if (data.ok) {
      res.className = 'result ok';
      res.innerHTML = data.bericht;
    } else {
      res.className = 'result fout';
      res.innerHTML = data.bericht;
    }
    document.getElementById('ts').textContent = data.tijd || '';
  } catch(e) {
    res.style.display = 'block';
    res.className = 'result fout';
    res.innerHTML = 'Verbindingsfout: ' + e.message;
  }
  btn.disabled = false;
  btn.textContent = 'Publiceer naar productie';
}
</script>
</body>
</html>"""


class PubliceerHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode())

    def do_POST(self):
        if self.path != "/publiceer":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        ww_hash = hashlib.sha256(body.get("wachtwoord", "").encode()).hexdigest()

        if ww_hash != WACHTWOORD_HASH:
            self.respond({"ok": False, "bericht": "Onjuist wachtwoord.", "tijd": self.nu()})
            return

        try:
            result = kopieer_bestanden()
            self.respond({"ok": True, "bericht": result, "tijd": self.nu()})
        except Exception as e:
            self.respond({"ok": False, "bericht": f"Fout: {e}", "tijd": self.nu()})

    def respond(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def nu(self):
        return datetime.now().strftime("%d-%m-%Y %H:%M:%S")


def kopieer_bestanden():
    if not BRON.is_dir():
        raise FileNotFoundError(f"Bronmap niet gevonden: {BRON}")

    DOEL.mkdir(exist_ok=True)
    (DOEL / "pwa-icons").mkdir(exist_ok=True)
    (DOEL / "schrijf-wijzer").mkdir(exist_ok=True)
    (DOEL / "stats" / "data").mkdir(parents=True, exist_ok=True)

    teller = 0
    waarschuwingen = []

    for f in BESTANDEN:
        src = BRON / f
        if src.is_file():
            shutil.copy2(src, DOEL / f)
            teller += 1
        else:
            waarschuwingen.append(f)

    for fav in FAVICON_BESTANDEN:
        src = BRON / fav
        if src.is_file():
            shutil.copy2(src, DOEL / fav)

    icons_dir = BRON / "pwa-icons"
    icon_count = 0
    if icons_dir.is_dir():
        for png in icons_dir.glob("*.png"):
            shutil.copy2(png, DOEL / "pwa-icons" / png.name)
            icon_count += 1

    sw_dir = BRON / "schrijf-wijzer"
    sw_count = 0
    if sw_dir.is_dir():
        for item in sw_dir.iterdir():
            if item.is_file():
                shutil.copy2(item, DOEL / "schrijf-wijzer" / item.name)
                sw_count += 1

    stats_dir = BRON / "stats"
    stats_count = 0
    if stats_dir.is_dir():
        for item in stats_dir.rglob("*"):
            if item.is_file():
                rel = item.relative_to(stats_dir)
                dest = DOEL / "stats" / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest)
                stats_count += 1

    regels = [
        f"<strong>{teller}</strong> bestanden gekopieerd<br>",
        f"<strong>{icon_count}</strong> PWA-icons<br>",
        f"<strong>{sw_count}</strong> schrijfwijzer-bestanden<br>",
        f"<strong>{stats_count}</strong> stats (bezoekteller)<br><br>",
        f"Doelmap:<br><code>{DOEL}</code>",
    ]
    if waarschuwingen:
        regels.append(f"<br><br>Niet gevonden: {', '.join(waarschuwingen)}")

    return "".join(regels)


if __name__ == "__main__":
    print(f"\n  BeleidsBibliotheek — Publiceer-tool")
    print(f"  http://localhost:{PORT}")
    print(f"  Ctrl+C om te stoppen\n")

    threading.Timer(0.5, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()

    server = http.server.HTTPServer(("127.0.0.1", PORT), PubliceerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Gestopt.")
        server.server_close()
