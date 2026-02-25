#!/bin/bash
# ============================================================
# BeleidsWijzer — Scraper V2 (fixes: jaarselectie + PDF download)
# Draaien op de VPS waar V1 al is geinstalleerd.
# ============================================================
cd /root/beleidswijzer
source venv/bin/activate

# Verwijder de oude cache zodat we opnieuw zoeken
rm -f vergadering_guids.json

# Wis de oude DB zodat we schoon beginnen
rm -f raadsbesluiten.db

cat > scrape_raad_v2.py << 'PYTHON_EOF'
"""
BeleidsWijzer — Raadsbesluiten Scraper V2.
Fix 1: Elk jaar apart openklikken + wachten + tellen.
Fix 2: PDF's downloaden via Playwright-sessie (cookies).
"""
import sqlite3, json, re, os, time, sys, tempfile, shutil

from playwright.sync_api import sync_playwright
import pdfplumber

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

        print("  Navigeren naar raadsvergaderingen...")
        page.goto(f"{BASE}/Calendar/OpenCategory/10000000", timeout=60000)
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # Tel links voor we beginnen
        links_voor = page.locator("a[href*='/Agenda/Index/']").count()
        print(f"  Links na laden: {links_voor}")

        # Klik elk jaar open, één voor één, met verificatie
        for jaar in [2025, 2024, 2023, 2022]:
            print(f"  Jaar {jaar} openen...")

            # Zoek de button met EXACT de jaartekst
            buttons = page.locator("button")
            btn_count = buttons.count()
            clicked = False

            for b in range(btn_count):
                try:
                    btn_text = buttons.nth(b).inner_text().strip()
                    if btn_text == str(jaar):
                        # Check of het al expanded is
                        aria = buttons.nth(b).get_attribute("aria-expanded")
                        if aria == "true":
                            print(f"    {jaar} is al open")
                            clicked = True
                            break

                        buttons.nth(b).click()
                        clicked = True
                        print(f"    Geklikt op {jaar}")
                        time.sleep(3)

                        # Wacht tot nieuwe links verschijnen
                        for _ in range(10):
                            nieuwe_count = page.locator("a[href*='/Agenda/Index/']").count()
                            if nieuwe_count > links_voor:
                                break
                            time.sleep(1)

                        links_na = page.locator("a[href*='/Agenda/Index/']").count()
                        print(f"    Links: {links_voor} -> {links_na} (+{links_na - links_voor})")
                        links_voor = links_na
                        break
                except Exception as e:
                    continue

            if not clicked:
                print(f"    WAARSCHUWING: Button {jaar} niet gevonden!")

        time.sleep(2)

        # Haal nu ALLE links op
        links = page.locator("a[href*='/Agenda/Index/']")
        count = links.count()
        print(f"\n  Totaal links gevonden: {count}")

        maand_map = {
            'januari':1,'februari':2,'maart':3,'april':4,
            'mei':5,'juni':6,'juli':7,'augustus':8,
            'september':9,'oktober':10,'november':11,'december':12
        }

        seen = set()
        for i in range(count):
            try:
                href = links.nth(i).get_attribute("href")
                tekst = links.nth(i).inner_text().strip()
                if not href or "/Agenda/Index/" not in href:
                    continue

                guid = href.split("/Agenda/Index/")[-1].split("?")[0]
                if guid in seen or len(guid) < 30:
                    continue
                seen.add(guid)

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
                        print(f"    {jaar_nr}-{maand:02d}-{dag:02d}  {tekst[:60]}")
            except Exception as e:
                pass

        browser.close()

    vergaderingen.sort(key=lambda v: v["datum"])

    with open(GUID_CACHE, "w") as f:
        json.dump(vergaderingen, f, indent=2, ensure_ascii=False)

    print(f"\n  Totaal: {len(vergaderingen)} raadsvergaderingen")
    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"  Per jaar: {per_jaar}")

    return vergaderingen


def stap2_documenten_scrapen(vergaderingen, conn):
    """Per vergadering: gebruik Playwright om pagina + PDF's te downloaden."""
    cursor = conn.cursor()
    totaal_nieuw = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()

        for i, v in enumerate(vergaderingen):
            datum = v["datum"]
            guid = v["guid"]
            jaar = v["jaar"]

            cursor.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum,))
            bestaand = cursor.fetchone()[0]
            if bestaand > 0:
                print(f"  [{i+1}/{len(vergaderingen)}] {datum} — al in DB ({bestaand}), skip")
                continue

            print(f"  [{i+1}/{len(vergaderingen)}] {datum} laden...")

            url = f"{BASE}/Agenda/Index/{guid}"
            try:
                page.goto(url, timeout=30000)
                page.wait_for_load_state("networkidle")
                time.sleep(1)
            except Exception as e:
                print(f"    Laden mislukt: {e}")
                continue

            html = page.content()

            # Zoek documenten via regex op de HTML
            doc_pattern = re.compile(
                r'<a\s+href="([^"]*(?:Agenda/Document)[^"]*)"[^>]*data-document-id="([^"]*)"[^>]*>'
                r'(.*?)</a>',
                re.DOTALL
            )
            docs = doc_pattern.findall(html)

            if not docs:
                # Fallback regex zonder data-document-id
                doc_pattern2 = re.compile(
                    r'<a\s+href="([^"]*Agenda/Document[^"]*)"[^>]*>'
                    r'\s*(?:<span[^>]*>[^<]*</span>\s*)*\s*()(.*?)\s*'
                    r'(?:<span[^>]*>[^<]*</span>\s*)*</a>',
                    re.DOTALL
                )
                docs = doc_pattern2.findall(html)

            for match in docs:
                if len(match) == 3:
                    href, doc_id_attr, naam_raw = match
                else:
                    href, naam_raw = match[0], match[-1]
                    doc_id_attr = ""

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
                full_url = full_url.replace("&amp;", "&")

                print(f"    {doc_type}: {naam[:65]}...")

                # Download PDF via Playwright (met cookies)
                tekst = download_pdf_playwright(page, full_url)

                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO raadsbesluiten
                        (vergaderdatum, jaar, vergadering_guid, agendapunt,
                         document_naam, document_url, document_type, tekst_volledig)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (datum, jaar, guid, "", naam, full_url, doc_type, tekst))
                    conn.commit()
                    totaal_nieuw += 1
                except Exception as e:
                    print(f"      DB fout: {e}")

            time.sleep(1)

        browser.close()

    return totaal_nieuw


def download_pdf_playwright(page, url):
    """Download PDF via Playwright-sessie en extraheer tekst."""
    doc_id = re.search(r'documentId=([a-f0-9-]+)', url)
    if not doc_id:
        doc_id = re.search(r'Document/([a-f0-9-]+)', url)
    if not doc_id:
        return ""

    filepath = os.path.join(PDF_DIR, f"{doc_id.group(1)}.pdf")

    if not os.path.exists(filepath):
        try:
            # Gebruik Playwright om het bestand te downloaden
            with page.expect_download(timeout=60000) as download_info:
                page.evaluate(f"""() => {{
                    const a = document.createElement('a');
                    a.href = '{url.replace("'", "\\'")}';
                    a.download = 'doc.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }}""")
            download = download_info.value
            download.save_as(filepath)
            print(f"      PDF gedownload ({os.path.getsize(filepath)} bytes)")
            time.sleep(0.5)
        except Exception as e:
            # Fallback: directe navigatie
            try:
                resp = page.context.request.get(url)
                ct = resp.headers.get("content-type", "")
                if "pdf" in ct or "octet" in ct:
                    with open(filepath, "wb") as f:
                        f.write(resp.body())
                    print(f"      PDF via API ({os.path.getsize(filepath)} bytes)")
                else:
                    print(f"      Geen PDF: {ct[:50]}")
                    return ""
            except Exception as e2:
                print(f"      Download mislukt: {e2}")
                return ""

    try:
        parts = []
        with pdfplumber.open(filepath) as pdf:
            for pg in pdf.pages:
                t = pg.extract_text()
                if t:
                    parts.append(t)
        tekst = "\n\n".join(parts)
        if tekst:
            print(f"      Tekst: {len(tekst)} karakters")
        return tekst
    except Exception as e:
        print(f"      PDF extractie fout: {e}")
        return ""


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper V2")
    print("=" * 60)

    conn = init_db()

    print("\nSTAP 1: Vergaderingen ophalen via Playwright...")
    vergaderingen = stap1_vergaderingen_ophalen()

    if len(vergaderingen) < 5:
        print("\nWAARSCHUWING: Minder dan 5 vergaderingen gevonden!")
        print("Check de log en probeer opnieuw.")

    print(f"\nSTAP 2: {len(vergaderingen)} vergaderingen scrapen...")
    nieuw = stap2_documenten_scrapen(vergaderingen, conn)

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM raadsbesluiten")
    totaal = cursor.fetchone()[0]

    cursor.execute("""SELECT jaar, document_type, COUNT(*)
                      FROM raadsbesluiten GROUP BY jaar, document_type ORDER BY jaar""")
    stats = cursor.fetchall()

    cursor.execute("""SELECT COUNT(*) FROM raadsbesluiten
                      WHERE tekst_volledig != '' AND tekst_volledig IS NOT NULL""")
    met_tekst = cursor.fetchone()[0]

    print("\n" + "=" * 60)
    print(f"KLAAR!")
    print(f"Nieuw toegevoegd:  {nieuw}")
    print(f"Totaal in database: {totaal}")
    print(f"Met volledige tekst: {met_tekst}")
    if stats:
        print("\nPer jaar en type:")
        for jaar, dtype, cnt in stats:
            print(f"  {jaar} {dtype}: {cnt}")
    print("=" * 60)
    print(f"\nDatabase: {DB_PATH}")

    conn.close()


if __name__ == "__main__":
    main()
PYTHON_EOF

echo "========================================"
echo "Scraper V2 starten..."
echo "========================================"
python3 scrape_raad_v2.py 2>&1 | tee /root/beleidswijzer/scraper_v2_log.txt

echo ""
echo "========================================"
echo "KLAAR! Check:"
echo "  cat /root/beleidswijzer/scraper_v2_log.txt"
echo "========================================"
