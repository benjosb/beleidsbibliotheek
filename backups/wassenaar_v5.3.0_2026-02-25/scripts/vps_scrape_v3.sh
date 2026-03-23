#!/bin/bash
# ============================================================
# BeleidsWijzer — Scraper V3
# Andere aanpak: gebruik Besluitenlijst-pagina voor vergaderingen
# en Playwright request API voor PDF-downloads.
# ============================================================
cd /root/beleidswijzer
source venv/bin/activate

rm -f vergadering_guids.json raadsbesluiten.db

cat > scrape_raad_v3.py << 'PYTHON_EOF'
"""
BeleidsWijzer — Raadsbesluiten Scraper V3.

Aanpak:
- Stap 1: Gebruik Besluitenlijst-rapport om alle vergaderdatums te vinden,
  klik dan op elke datum om de vergadering-GUID uit de URL te halen.
- Stap 2: Per vergadering: laad de agenda, zoek documenten.
- Stap 3: Download PDF's via Playwright API request (met cookies).
"""
import sqlite3, json, re, os, time, sys

from playwright.sync_api import sync_playwright
import pdfplumber

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
DB_PATH = "/root/beleidswijzer/raadsbesluiten.db"
PDF_DIR = "/root/beleidswijzer/pdfs_raad"
GUID_CACHE = "/root/beleidswijzer/vergadering_guids.json"
os.makedirs(PDF_DIR, exist_ok=True)

BESLUITENLIJST_URL = f"{BASE}/Reports/Details/4a213a07-73db-484f-82c7-903e25d1639b"


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
    """Haal vergaderingen op via de Besluitenlijst + raadsvergadering-sidebar."""
    if os.path.exists(GUID_CACHE):
        with open(GUID_CACHE) as f:
            cached = json.load(f)
        if len(cached) > 10:
            print(f"  Cache: {len(cached)} vergaderingen")
            return cached

    print("  Playwright starten...")
    vergaderingen = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # ---- Methode: navigeer naar een raadsvergadering en klik jaren open ----
        print("  Navigeren naar raadsvergaderingen-categorie...")
        page.goto(f"{BASE}/Calendar/OpenCategory/10000000", timeout=60000)
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # Debug: maak screenshot
        page.screenshot(path="/root/beleidswijzer/debug_stap1a.png")

        # Print de volledige sidebar-structuur voor debugging
        sidebar = page.locator(".agenda-left, .sidebar, .aside, [class*='agenda-tree'], [class*='tree'], nav")
        print(f"  Sidebar-elementen gevonden: {sidebar.count()}")

        # Zoek ALLE klikbare elementen die jaartallen bevatten
        for jaar in [2025, 2024, 2023, 2022]:
            print(f"\n  === Jaar {jaar} zoeken ===")

            # Probeer verschillende selectors
            selectors = [
                f"button:has-text('{jaar}')",
                f"a:has-text('{jaar}')",
                f"[role='button']:has-text('{jaar}')",
                f".tree-toggle:has-text('{jaar}')",
                f"[data-year='{jaar}']",
                f"text='{jaar}'",
            ]

            clicked = False
            for sel in selectors:
                try:
                    el = page.locator(sel).first
                    if el.count() > 0 and el.is_visible():
                        el.scroll_into_view_if_needed()
                        el.click()
                        print(f"    Geklikt via: {sel}")
                        clicked = True
                        time.sleep(3)

                        # Screenshot na klik
                        page.screenshot(path=f"/root/beleidswijzer/debug_{jaar}.png")
                        break
                except Exception as e:
                    continue

            if not clicked:
                # Laatste poging: zoek via JavaScript
                try:
                    result = page.evaluate(f"""() => {{
                        const els = document.querySelectorAll('button, a, [role="button"], .toggle, [class*="collaps"]');
                        for (const el of els) {{
                            if (el.textContent.trim() === '{jaar}') {{
                                el.click();
                                return 'clicked ' + el.tagName;
                            }}
                        }}
                        return 'not found';
                    }}""")
                    print(f"    JS klik: {result}")
                    if "clicked" in result:
                        clicked = True
                        time.sleep(3)
                except Exception as e:
                    print(f"    JS fout: {e}")

            if not clicked:
                print(f"    WAARSCHUWING: {jaar} niet gevonden/geklikt")

        time.sleep(2)
        page.screenshot(path="/root/beleidswijzer/debug_na_klikken.png")

        # Haal alle Agenda/Index links op
        links = page.locator("a[href*='/Agenda/Index/']")
        count = links.count()
        print(f"\n  Vergadering-links na klikken: {count}")

        maand_map = {
            'januari':1,'februari':2,'maart':3,'april':4,
            'mei':5,'juni':6,'juli':7,'augustus':8,
            'september':9,'oktober':10,'november':11,'december':12
        }

        seen = set()
        for i in range(count):
            try:
                href = links.nth(i).get_attribute("href") or ""
                tekst = links.nth(i).inner_text().strip()
                if "/Agenda/Index/" not in href:
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
            except:
                pass

        # ---- Als we te weinig hebben: fallback via Besluitenlijst ----
        if len(vergaderingen) < 10:
            print(f"\n  Slechts {len(vergaderingen)} via sidebar, fallback naar Besluitenlijst...")
            extra = vergaderingen_via_besluitenlijst(page, seen, maand_map)
            vergaderingen.extend(extra)

        browser.close()

    vergaderingen.sort(key=lambda v: v["datum"])
    # Filter alleen 2022-2026
    vergaderingen = [v for v in vergaderingen if 2022 <= v["jaar"] <= 2026]

    with open(GUID_CACHE, "w") as f:
        json.dump(vergaderingen, f, indent=2, ensure_ascii=False)

    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"\n  Totaal: {len(vergaderingen)} vergaderingen")
    print(f"  Per jaar: {per_jaar}")

    return vergaderingen


def vergaderingen_via_besluitenlijst(page, seen, maand_map):
    """Fallback: gebruik de Besluitenlijst-pagina om datums te vinden,
    klik dan elke datum aan om de vergadering-GUID te achterhalen."""
    print("  Besluitenlijst laden...")
    extra = []

    page.goto(BESLUITENLIJST_URL, timeout=60000)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    # Verwerk alle pagina's van de besluitenlijst
    for pagina_nr in range(1, 5):
        print(f"  Besluitenlijst pagina {pagina_nr}...")

        # Vind alle datumlinks in de tabel
        datum_links = page.locator("table tbody tr td:first-child a")
        link_count = datum_links.count()
        print(f"    {link_count} datumlinks gevonden")

        for i in range(link_count):
            try:
                datum_tekst = datum_links.nth(i).inner_text().strip()
                # Formaat: dd-mm-yyyy
                datum_match = re.match(r'(\d{2})-(\d{2})-(\d{4})', datum_tekst)
                if not datum_match:
                    continue

                dag, maand, jaar = datum_match.groups()
                jaar_nr = int(jaar)
                if jaar_nr < 2022 or jaar_nr > 2026:
                    continue

                datum_iso = f"{jaar}-{maand}-{dag}"

                # Klik op de datumlink
                datum_links.nth(i).click()
                time.sleep(2)
                page.wait_for_load_state("networkidle")

                # Check of we nu op een Agenda-pagina zijn
                current_url = page.url
                guid_match = re.search(r'/Agenda/Index/([a-f0-9-]{36})', current_url)

                if guid_match and guid_match.group(1) not in seen:
                    guid = guid_match.group(1)
                    seen.add(guid)
                    extra.append({
                        "guid": guid,
                        "datum": datum_iso,
                        "jaar": jaar_nr,
                        "titel": f"Raadsvergadering {datum_tekst}"
                    })
                    print(f"    {datum_iso} -> GUID {guid[:12]}...")

                # Ga terug naar de besluitenlijst
                page.goto(BESLUITENLIJST_URL, timeout=30000)
                page.wait_for_load_state("networkidle")
                time.sleep(2)

                # Als we op een andere pagina waren, navigeer terug
                if pagina_nr > 1:
                    try:
                        page.locator(f"button:has-text('Toon pagina {pagina_nr}')").click()
                        time.sleep(2)
                    except:
                        pass

            except Exception as e:
                print(f"    Fout bij {i}: {e}")
                # Terug naar besluitenlijst
                try:
                    page.goto(BESLUITENLIJST_URL, timeout=30000)
                    page.wait_for_load_state("networkidle")
                    time.sleep(2)
                except:
                    pass

        # Ga naar volgende pagina
        try:
            next_btn = page.locator(f"button:has-text('Toon pagina {pagina_nr + 1}')")
            if next_btn.count() > 0:
                next_btn.click()
                time.sleep(3)
            else:
                break
        except:
            break

    print(f"  Besluitenlijst: {len(extra)} extra vergaderingen gevonden")
    return extra


def stap2_documenten_scrapen(vergaderingen, conn):
    """Per vergadering: laad de agenda in Playwright, vind docs, download PDF's."""
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
            if cursor.fetchone()[0] > 0:
                print(f"  [{i+1}/{len(vergaderingen)}] {datum} — al in DB, skip")
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

            # Zoek alle document-links op de pagina
            doc_links = page.locator("a[href*='Agenda/Document']")
            doc_count = doc_links.count()

            for d in range(doc_count):
                try:
                    naam = doc_links.nth(d).inner_text().strip()
                    naam = re.sub(r'\s+', ' ', naam)
                    href = doc_links.nth(d).get_attribute("href") or ""

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

                    print(f"    {doc_type}: {naam[:60]}...")

                    tekst = download_pdf(context, full_url)

                    cursor.execute("""
                        INSERT OR IGNORE INTO raadsbesluiten
                        (vergaderdatum, jaar, vergadering_guid, agendapunt,
                         document_naam, document_url, document_type, tekst_volledig)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (datum, jaar, guid, "", naam, full_url, doc_type, tekst))
                    conn.commit()
                    totaal_nieuw += 1

                except Exception as e:
                    print(f"    Doc fout: {e}")

            time.sleep(1)

        browser.close()

    return totaal_nieuw


def download_pdf(context, url):
    """Download PDF via Playwright API request (draagt cookies mee)."""
    doc_id = re.search(r'documentId=([a-f0-9-]+)', url)
    if not doc_id:
        doc_id = re.search(r'Document/([a-f0-9-]+)', url)
    if not doc_id:
        return ""

    filepath = os.path.join(PDF_DIR, f"{doc_id.group(1)}.pdf")

    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        # Check of het echt een PDF is
        with open(filepath, 'rb') as f:
            header = f.read(5)
        if header == b'%PDF-':
            return extract_text(filepath)

    try:
        # Methode: open een nieuwe pagina en navigeer naar de document-URL
        # iBabs stuurt een redirect die naar de echte PDF leidt
        dl_page = context.new_page()

        # Intercept de response om te checken of het PDF is
        pdf_data = None

        def handle_response(response):
            nonlocal pdf_data
            ct = response.headers.get("content-type", "")
            if "pdf" in ct or "octet-stream" in ct:
                try:
                    pdf_data = response.body()
                except:
                    pass

        dl_page.on("response", handle_response)

        try:
            dl_page.goto(url, timeout=30000, wait_until="networkidle")
        except:
            pass

        time.sleep(2)

        if pdf_data and len(pdf_data) > 500:
            with open(filepath, "wb") as f:
                f.write(pdf_data)
            print(f"      PDF via response: {len(pdf_data)} bytes")
            dl_page.close()
            return extract_text(filepath)

        # Fallback: probeer via context.request (API)
        try:
            api_resp = context.request.get(url)
            ct = api_resp.headers.get("content-type", "")
            body = api_resp.body()

            if body[:5] == b'%PDF-':
                with open(filepath, "wb") as f:
                    f.write(body)
                print(f"      PDF via API: {len(body)} bytes")
                dl_page.close()
                return extract_text(filepath)
            else:
                print(f"      Geen PDF ({ct[:40]}, {len(body)} bytes, header: {body[:20]})")
        except Exception as e:
            print(f"      API fout: {e}")

        dl_page.close()
        return ""

    except Exception as e:
        print(f"      Download fout: {e}")
        return ""


def extract_text(filepath):
    """Extraheer tekst uit PDF met pdfplumber."""
    try:
        parts = []
        with pdfplumber.open(filepath) as pdf:
            for pg in pdf.pages:
                t = pg.extract_text()
                if t:
                    parts.append(t)
        tekst = "\n\n".join(parts)
        if tekst:
            print(f"      Tekst: {len(tekst)} chars")
        return tekst
    except Exception as e:
        print(f"      Extractie fout: {e}")
        return ""


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper V3")
    print("=" * 60)

    conn = init_db()

    print("\nSTAP 1: Vergaderingen ophalen...")
    vergaderingen = stap1_vergaderingen_ophalen()

    if len(vergaderingen) < 5:
        print("\nTE WEINIG vergaderingen. Check debug screenshots:")
        print("  /root/beleidswijzer/debug_*.png")
        print("Ga toch door met wat we hebben...")

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
    print(f"Nieuw: {nieuw} | Totaal: {totaal} | Met tekst: {met_tekst}")
    if stats:
        print("\nPer jaar en type:")
        for j, t, c in stats:
            print(f"  {j} {t}: {c}")
    print("=" * 60)

    conn.close()


if __name__ == "__main__":
    main()
PYTHON_EOF

echo "========================================"
echo "Scraper V3 starten..."
echo "========================================"

# Verwijder oude corrupte PDF's
rm -f /root/beleidswijzer/pdfs_raad/*.pdf

python3 scrape_raad_v3.py 2>&1 | tee /root/beleidswijzer/scraper_v3_log.txt

echo ""
echo "========================================"
echo "V3 KLAAR! Check:"
echo "  cat /root/beleidswijzer/scraper_v3_log.txt"
echo "  ls /root/beleidswijzer/debug_*.png"
echo "========================================"
