#!/bin/bash
# ============================================================
# BeleidsWijzer — VPS Setup & iBabs Raadsbesluiten Scraper
# Plak dit HELE script in de Hostinger web-terminal.
# Het draait zelfstandig (~30-60 min) en slaat resultaten op.
# ============================================================
set -e

echo "========================================"
echo "BeleidsWijzer VPS Setup"
echo "========================================"

# 1. Systeem updaten + Python installeren
apt-get update -y
apt-get install -y python3 python3-pip python3-venv wget curl unzip

# 2. Werkmap aanmaken
mkdir -p /root/beleidswijzer/pdfs_raad
cd /root/beleidswijzer

# 3. Python venv + packages
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install requests pdfplumber playwright
playwright install --with-deps chromium

echo "========================================"
echo "Setup klaar. Start scraper..."
echo "========================================"

# 4. Python scraper schrijven
cat > scrape_raad.py << 'PYTHON_EOF'
"""
BeleidsWijzer — Raadsbesluiten scraper via Playwright (headless browser).
Haalt alle raadsvergaderingen 2022-2025 op uit iBabs Wassenaar,
downloadt raadsbesluiten + raadsvoorstellen PDF's,
extraheert tekst en slaat alles op in SQLite.
"""
import sqlite3, json, re, os, time, sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("FOUT: playwright niet geinstalleerd")
    sys.exit(1)

try:
    import pdfplumber
except ImportError:
    print("FOUT: pdfplumber niet geinstalleerd")
    sys.exit(1)

import requests

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
DB_PATH = "/root/beleidswijzer/raadsbesluiten.db"
PDF_DIR = "/root/beleidswijzer/pdfs_raad"
GUID_CACHE = "/root/beleidswijzer/vergadering_guids.json"
os.makedirs(PDF_DIR, exist_ok=True)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS raadsbesluiten (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vergaderdatum TEXT,
            jaar INTEGER,
            vergadering_guid TEXT,
            agendapunt TEXT,
            document_naam TEXT,
            document_url TEXT,
            document_type TEXT,
            tekst_volledig TEXT,
            UNIQUE(vergaderdatum, document_naam)
        )
    """)
    conn.commit()
    return conn


def stap1_vergaderingen_ophalen():
    """Gebruik Playwright om alle raadsvergadering-GUIDs op te halen."""
    if os.path.exists(GUID_CACHE):
        with open(GUID_CACHE) as f:
            cached = json.load(f)
        if len(cached) > 10:
            print(f"  Cache gevonden: {len(cached)} vergaderingen")
            return cached

    print("  Playwright starten...")
    vergaderingen = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(f"{BASE}/Calendar/OpenCategory/10000000", timeout=30000)
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        for jaar in range(2025, 2021, -1):
            print(f"  Jaar {jaar} openen...")
            try:
                knop = page.locator(f"button:has-text('{jaar}')")
                if knop.count() > 0:
                    knop.first.click()
                    time.sleep(1.5)
            except Exception as e:
                print(f"    Kon {jaar} niet openen: {e}")
                continue

        time.sleep(2)

        links = page.locator("a[href*='/Agenda/Index/']")
        count = links.count()
        print(f"  {count} vergadering-links gevonden")

        seen = set()
        for i in range(count):
            try:
                href = links.nth(i).get_attribute("href")
                tekst = links.nth(i).inner_text().strip()
                if not href:
                    continue
                guid = href.split("/Agenda/Index/")[-1]
                if guid in seen:
                    continue
                seen.add(guid)

                maand_map = {
                    'januari':1,'februari':2,'maart':3,'april':4,
                    'mei':5,'juni':6,'juli':7,'augustus':8,
                    'september':9,'oktober':10,'november':11,'december':12
                }
                datum_match = re.search(
                    r'(\d+)\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})',
                    tekst, re.IGNORECASE
                )
                if datum_match:
                    dag = int(datum_match.group(1))
                    maand = maand_map[datum_match.group(2).lower()]
                    jaar_nr = int(datum_match.group(3))
                    if 2022 <= jaar_nr <= 2026:
                        vergaderingen.append({
                            "guid": guid,
                            "datum": f"{jaar_nr}-{maand:02d}-{dag:02d}",
                            "jaar": jaar_nr,
                            "titel": tekst[:100]
                        })
            except Exception as e:
                print(f"    Link {i} fout: {e}")

        browser.close()

    vergaderingen.sort(key=lambda v: v["datum"])

    with open(GUID_CACHE, "w") as f:
        json.dump(vergaderingen, f, indent=2, ensure_ascii=False)

    print(f"  {len(vergaderingen)} raadsvergaderingen gevonden en gecacht")
    return vergaderingen


def stap2_documenten_scrapen(vergaderingen, conn):
    """Per vergadering: haal agenda op, vind raadsbesluiten/voorstellen."""
    cursor = conn.cursor()
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 BeleidsWijzer/1.0"

    doc_pattern = re.compile(
        r'<a\s+href="([^"]*(?:Agenda/Document|Document/View)[^"]*)"[^>]*>'
        r'\s*(?:<span[^>]*>[^<]*</span>\s*)*\s*(.*?)\s*'
        r'(?:<span[^>]*>[^<]*</span>\s*)*</a>',
        re.DOTALL
    )

    totaal_nieuw = 0

    for i, v in enumerate(vergaderingen):
        datum = v["datum"]
        guid = v["guid"]
        jaar = v["jaar"]

        cursor.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum,))
        bestaand = cursor.fetchone()[0]
        if bestaand > 0:
            print(f"  [{i+1}/{len(vergaderingen)}] {datum} — al in DB ({bestaand}), skip")
            continue

        print(f"  [{i+1}/{len(vergaderingen)}] {datum} scrapen...")

        url = f"{BASE}/Agenda/Index/{guid}"
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code != 200:
                print(f"    HTTP {resp.status_code}, skip")
                continue
        except Exception as e:
            print(f"    Fout bij ophalen: {e}")
            continue

        html = resp.text
        docs = doc_pattern.findall(html)

        for href, naam_raw in docs:
            naam = re.sub(r'<[^>]+>', '', naam_raw).strip()
            naam = re.sub(r'\s+', ' ', naam)

            if not naam:
                continue

            naam_l = naam.lower()
            if 'raadsbesluit' in naam_l:
                doc_type = 'raadsbesluit'
            elif 'raadsvoorstel' in naam_l:
                doc_type = 'raadsvoorstel'
            else:
                continue

            full_url = href if href.startswith("http") else BASE + href

            print(f"    {doc_type}: {naam[:70]}...")

            tekst = download_en_extraheer(session, full_url)

            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO raadsbesluiten
                    (vergaderdatum, jaar, vergadering_guid, agendapunt, document_naam,
                     document_url, document_type, tekst_volledig)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (datum, jaar, guid, "", naam, full_url, doc_type, tekst))
                conn.commit()
                totaal_nieuw += 1
            except Exception as e:
                print(f"    DB fout: {e}")

        time.sleep(1)

    return totaal_nieuw


def download_en_extraheer(session, url):
    """Download PDF en extraheer tekst met pdfplumber."""
    doc_id = re.search(r'documentId=([a-f0-9-]+)', url)
    if not doc_id:
        doc_id = re.search(r'Document/([a-f0-9-]+)', url)
    if not doc_id:
        return ""

    filepath = os.path.join(PDF_DIR, f"{doc_id.group(1)}.pdf")

    if not os.path.exists(filepath):
        try:
            resp = session.get(url, timeout=120, stream=True)
            if resp.status_code != 200:
                print(f"      Download HTTP {resp.status_code}")
                return ""
            ct = resp.headers.get("Content-Type", "")
            if "pdf" not in ct and "octet" not in ct:
                print(f"      Geen PDF: {ct[:50]}")
                return ""
            with open(filepath, "wb") as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            time.sleep(0.5)
        except Exception as e:
            print(f"      Download fout: {e}")
            return ""

    try:
        parts = []
        with pdfplumber.open(filepath) as pdf:
            for pg in pdf.pages:
                t = pg.extract_text()
                if t:
                    parts.append(t)
        return "\n\n".join(parts)
    except Exception as e:
        print(f"      PDF extractie fout: {e}")
        return ""


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper")
    print("=" * 60)

    conn = init_db()

    print("\nSTAP 1: Vergaderingen ophalen via Playwright...")
    vergaderingen = stap1_vergaderingen_ophalen()

    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"\nVergaderingen per jaar: {per_jaar}")

    print("\nSTAP 2: Documenten scrapen en tekst extraheren...")
    nieuw = stap2_documenten_scrapen(vergaderingen, conn)

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM raadsbesluiten")
    totaal = cursor.fetchone()[0]

    cursor.execute("SELECT jaar, document_type, COUNT(*) FROM raadsbesluiten GROUP BY jaar, document_type ORDER BY jaar")
    stats = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE tekst_volledig != '' AND tekst_volledig IS NOT NULL")
    met_tekst = cursor.fetchone()[0]

    print("\n" + "=" * 60)
    print(f"KLAAR!")
    print(f"Nieuw toegevoegd: {nieuw}")
    print(f"Totaal in database: {totaal}")
    print(f"Met volledige tekst: {met_tekst}")
    print("\nPer jaar en type:")
    for jaar, dtype, cnt in stats:
        print(f"  {jaar} {dtype}: {cnt}")
    print("=" * 60)
    print(f"\nDatabase: {DB_PATH}")
    print(f"PDF's: {PDF_DIR}")

    conn.close()


if __name__ == "__main__":
    main()
PYTHON_EOF

# 5. Script draaien
echo "========================================"
echo "Scraper starten... (dit duurt 30-60 min)"
echo "========================================"
python3 scrape_raad.py 2>&1 | tee /root/beleidswijzer/scraper_log.txt

echo ""
echo "========================================"
echo "KLAAR! Resultaten staan in:"
echo "  Database:  /root/beleidswijzer/raadsbesluiten.db"
echo "  Log:       /root/beleidswijzer/scraper_log.txt"
echo "  PDF's:     /root/beleidswijzer/pdfs_raad/"
echo "========================================"
