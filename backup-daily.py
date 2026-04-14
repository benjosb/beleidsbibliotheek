#!/usr/bin/env python3
"""
BeleidsBibliotheek — Dagelijkse backup + integriteitscheck + e-mail

Draait via launchd (macOS) of handmatig:
    python3 backup-daily.py

Wat het doet:
  1. Download productie-site via FTP (backup-prod.sh)
  2. Integriteitscheck: bestaan kernbestanden? kloppen de groottes?
  3. Stuurt resultaat-email naar dickbraam@me.com

Vereist:
  - .env.prod (FTP-credentials)
  - .env.mail (SMTP-credentials, optioneel — zonder stuurt hij een macOS-notificatie)
  - lftp (brew install lftp)
"""

import hashlib
import os
import smtplib
import subprocess
import sys
from datetime import datetime
from email.mime.text import MIMEText
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
BACKUP_DIR = PROJECT_DIR / "backups"
ENV_MAIL = PROJECT_DIR / ".env.mail"
MAIL_TO = "dickbraam@me.com"

KERN_BESTANDEN = [
    "index.html", "app.js", "data.js", "styles.css",
    "beleidsnotas.js", "overdrachtsdossier.html",
    "overdrachtsdossier.js", "disclaimer.js"
]

MIN_GROOTTES = {
    "index.html": 30_000,
    "app.js": 200_000,
    "data.js": 4_000_000,
    "styles.css": 80_000,
}


def load_env(path):
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def run_backup():
    script = PROJECT_DIR / "backup-prod.sh"
    result = subprocess.run(
        ["bash", str(script)],
        capture_output=True, text=True, timeout=300,
        cwd=str(PROJECT_DIR), env={**os.environ, "TERM": "dumb"}
    )
    return result.returncode == 0, result.stdout + result.stderr


def find_latest_backup():
    if not BACKUP_DIR.exists():
        return None
    dirs = sorted(
        [d for d in BACKUP_DIR.iterdir() if d.is_dir() and d.name.startswith("prod_")],
        reverse=True
    )
    return dirs[0] if dirs else None


def integrity_check(backup_path):
    rapport = []
    fouten = 0

    for f in KERN_BESTANDEN:
        fp = backup_path / f
        if not fp.exists():
            rapport.append(f"  ONTBREEKT  {f}")
            fouten += 1
        else:
            size = fp.stat().st_size
            min_size = MIN_GROOTTES.get(f, 100)
            if size < min_size:
                rapport.append(f"  TE KLEIN   {f} ({size:,} bytes, verwacht >{min_size:,})")
                fouten += 1
            else:
                rapport.append(f"  OK         {f} ({size:,} bytes)")

    alle_bestanden = list(backup_path.rglob("*"))
    alle_files = [f for f in alle_bestanden if f.is_file()]
    totaal_bytes = sum(f.stat().st_size for f in alle_files)
    totaal_mb = round(totaal_bytes / 1024 / 1024, 1)

    checksums = {}
    for f in KERN_BESTANDEN:
        fp = backup_path / f
        if fp.exists():
            h = hashlib.md5(fp.read_bytes()).hexdigest()[:12]
            checksums[f] = h

    prev = find_previous_backup(backup_path)
    vergelijking = ""
    if prev:
        prev_files = list(prev.rglob("*"))
        prev_count = len([f for f in prev_files if f.is_file()])
        diff = len(alle_files) - prev_count
        if diff == 0:
            vergelijking = f"Ongewijzigd t.o.v. {prev.name}"
        else:
            vergelijking = f"{'+' if diff > 0 else ''}{diff} bestanden t.o.v. {prev.name}"

    return {
        "fouten": fouten,
        "rapport": "\n".join(rapport),
        "bestanden": len(alle_files),
        "grootte_mb": totaal_mb,
        "checksums": checksums,
        "vergelijking": vergelijking,
    }


def find_previous_backup(current):
    if not BACKUP_DIR.exists():
        return None
    dirs = sorted(
        [d for d in BACKUP_DIR.iterdir()
         if d.is_dir() and d.name.startswith("prod_") and d != current],
        reverse=True
    )
    return dirs[0] if dirs else None


def build_email(backup_name, check):
    nu = datetime.now().strftime("%Y-%m-%d %H:%M")
    ok = check["fouten"] == 0
    status = "OK" if ok else f"FOUT ({check['fouten']} probleem(en))"

    body = f"""BeleidsBibliotheek — Dagelijkse backup
{'=' * 44}

Datum:     {nu}
Backup:    {backup_name}
Status:    {status}
Bestanden: {check['bestanden']}
Grootte:   {check['grootte_mb']} MB
{f"Vergelijk: {check['vergelijking']}" if check['vergelijking'] else ""}

Integriteitscheck:
{check['rapport']}

Checksums (MD5, eerste 12 tekens):
{chr(10).join(f'  {k}: {v}' for k, v in check['checksums'].items())}
"""
    return status, body


def send_email(subject, body, env_mail):
    smtp_host = env_mail.get("SMTP_HOST", "smtp.mail.me.com")
    smtp_port = int(env_mail.get("SMTP_PORT", "587"))
    smtp_user = env_mail.get("SMTP_USER", "")
    smtp_pass = env_mail.get("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        return False, "SMTP-credentials niet ingevuld in .env.mail"

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = MAIL_TO

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as s:
            s.starttls()
            s.login(smtp_user, smtp_pass)
            s.send_message(msg)
        return True, "E-mail verzonden"
    except Exception as e:
        return False, str(e)


def send_notification(title, message):
    subprocess.run([
        "osascript", "-e",
        f'display notification "{message}" with title "{title}"'
    ], capture_output=True)


def main():
    nu = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"[{nu}] Dagelijkse backup gestart...")

    ok, output = run_backup()
    if not ok:
        print(f"Backup MISLUKT:\n{output}")
        send_notification("Backup MISLUKT", "BeleidsBibliotheek backup is mislukt.")
        env_mail = load_env(ENV_MAIL)
        if env_mail.get("SMTP_USER"):
            send_email(
                "BeleidsBibliotheek backup MISLUKT",
                f"De dagelijkse backup is mislukt.\n\nOutput:\n{output}",
                env_mail
            )
        sys.exit(1)

    backup_path = find_latest_backup()
    if not backup_path:
        print("Geen backup gevonden na uitvoering.")
        sys.exit(1)

    print(f"Backup gemaakt: {backup_path.name}")
    print("Integriteitscheck...")

    check = integrity_check(backup_path)
    status, body = build_email(backup_path.name, check)

    print(body)

    subject = f"Backup BeleidsBibliotheek {status} — {nu}"
    env_mail = load_env(ENV_MAIL)

    if env_mail.get("SMTP_USER"):
        ok_mail, msg = send_email(subject, body, env_mail)
        print(f"E-mail: {msg}")
    else:
        print("Geen SMTP-credentials in .env.mail — macOS-notificatie als fallback.")
        notif_msg = f"Backup {status}: {check['bestanden']} bestanden, {check['grootte_mb']} MB"
        send_notification("BeleidsBibliotheek Backup", notif_msg)

    sys.exit(0 if check["fouten"] == 0 else 1)


if __name__ == "__main__":
    main()
