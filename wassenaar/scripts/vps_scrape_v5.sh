#!/bin/bash
# ============================================================
# BeleidsWijzer — Scraper V5
#
# V4 GUIDs werken (773 docs gevonden). PDF-download is het probleem.
# V5 fix: open document-URL in Playwright, intercept network
# responses, vang de PDF-data op die JavaScript laadt.
# ============================================================
cd /root/beleidswijzer
source venv/bin/activate

# Bewaar de werkende GUID-cache, wis alleen de DB en PDFs
rm -f raadsbesluiten.db
rm -f pdfs_raad/*.pdf

cat > scrape_v5.py << 'PYTHON_EOF'
import sqlite3, json, re, os, time, sys
from playwright.sync_api import sync_playwright
import pdfplumber

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
DB   = "/root/beleidswijzer/raadsbesluiten.db"
PDFS = "/root/beleidswijzer/pdfs_raad"
CACHE = "/root/beleidswijzer/vergadering_guids.json"
os.makedirs(PDFS, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB)
    conn.execute("""CREATE TABLE IF NOT EXISTS raadsbesluiten (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vergaderdatum TEXT, jaar INTEGER, vergadering_guid TEXT,
        agendapunt TEXT, document_naam TEXT, document_url TEXT,
        document_type TEXT, tekst_volledig TEXT,
        UNIQUE(vergaderdatum, document_naam))""")
    conn.commit()
    return conn

def load_vergaderingen():
    if not os.path.exists(CACHE):
        print("FOUT: geen vergadering_guids.json cache. Draai eerst V4.")
        sys.exit(1)
    with open(CACHE) as f:
        data = json.load(f)
    print(f"  {len(data)} vergaderingen uit cache")
    return data

def download_pdf_via_interception(ctx, doc_url):
    """Open de document-URL in een Playwright-pagina.
    iBabs laadt een viewer die de PDF via JS ophaalt.
    We intercepten die network response."""

    doc_id_m = re.search(r'documentId=([a-f0-9-]+)', doc_url)
    if not doc_id_m:
        doc_id_m = re.search(r'Document/([a-f0-9-]+)', doc_url)
    if not doc_id_m:
        return ""
    
    fpath = os.path.join(PDFS, f"{doc_id_m.group(1)}.pdf")

    # Check bestaand geldig PDF
    if os.path.exists(fpath) and os.path.getsize(fpath) > 500:
        with open(fpath, 'rb') as f:
            if f.read(5) == b'%PDF-':
                return extract_text(fpath)

    page = ctx.new_page()
    pdf_chunks = []

    def on_response(response):
        try:
            ct = response.headers.get("content-type", "")
            url = response.url
            if ("pdf" in ct or "octet-stream" in ct or 
                url.endswith(".pdf") or "GetDocumentContent" in url or
                "DocumentContent" in url or "Download" in url):
                body = response.body()
                if body and len(body) > 500:
                    pdf_chunks.append((url, body, ct))
        except:
            pass

    page.on("response", on_response)

    try:
        page.goto(doc_url, timeout=30000, wait_until="load")
        time.sleep(5)
        page.wait_for_load_state("networkidle")
        time.sleep(2)
    except Exception as e:
        pass

    # Als geen PDF via responses, probeer download-knop te vinden
    if not pdf_chunks:
        try:
            # Zoek download/bekijk knoppen
            dl_info = page.evaluate("""() => {
                const links = document.querySelectorAll('a, button');
                const results = [];
                for (const el of links) {
                    const text = el.textContent.trim().toLowerCase();
                    const href = el.getAttribute('href') || '';
                    if (text.includes('download') || text.includes('bekijk') || 
                        text.includes('openen') || href.includes('.pdf') ||
                        href.includes('Download') || href.includes('GetDocument')) {
                        results.push({tag: el.tagName, text: text.substring(0,50), href: href.substring(0,200)});
                    }
                }
                // Also check iframes
                const iframes = document.querySelectorAll('iframe');
                for (const f of iframes) {
                    results.push({tag: 'IFRAME', text: '', href: f.src || f.getAttribute('data-src') || ''});
                }
                // Check embed/object
                const embeds = document.querySelectorAll('embed, object');
                for (const e of embeds) {
                    results.push({tag: e.tagName, text: '', href: e.getAttribute('src') || e.getAttribute('data') || ''});
                }
                return results;
            }""")

            if dl_info:
                for item in dl_info:
                    href = item.get("href", "")
                    if href and ("pdf" in href.lower() or "document" in href.lower() or "download" in href.lower()):
                        full = href if href.startswith("http") else BASE + href
                        try:
                            resp = ctx.request.get(full, timeout=30000)
                            body = resp.body()
                            if body[:5] == b'%PDF-':
                                pdf_chunks.append((full, body, "found-via-button"))
                                break
                        except:
                            pass

                # Debug: sla de gevonden elementen op (eerste keer)
                debug_path = "/root/beleidswijzer/v5_debug_elements.json"
                if not os.path.exists(debug_path):
                    with open(debug_path, "w") as f:
                        json.dump(dl_info, f, indent=2)
                    # Ook de volledige HTML van de viewer-pagina
                    with open("/root/beleidswijzer/v5_debug_viewer.html", "w") as f:
                        f.write(page.content())
        except Exception as e:
            pass

    # Debug: log alle opgevangen responses (eerste keer)
    debug_resp = "/root/beleidswijzer/v5_debug_responses.json"
    if not os.path.exists(debug_resp) and not pdf_chunks:
        all_urls = []
        def log_all(response):
            all_urls.append({
                "url": response.url[:200],
                "status": response.status,
                "ct": response.headers.get("content-type", "")[:50]
            })
        # Dit is te laat, maar we loggen wat we al hebben
        with open(debug_resp, "w") as f:
            json.dump({"note": "No PDF captured", "doc_url": doc_url}, f, indent=2)

    page.close()

    # Verwerk gevangen PDF
    for url, body, ct in pdf_chunks:
        if body[:5] == b'%PDF-':
            with open(fpath, "wb") as f:
                f.write(body)
            print(f"      PDF: {len(body)} bytes via {ct[:30]}")
            return extract_text(fpath)

    # Laatste poging: alle responses loggen bij eerste mislukking
    if not pdf_chunks:
        print(f"      GEEN PDF gevangen")

    return ""


def download_pdf_via_full_interception(ctx, doc_url):
    """Alternatief: log ALLE network responses om te zien wat er binnenkomt."""
    doc_id_m = re.search(r'documentId=([a-f0-9-]+)', doc_url)
    if not doc_id_m:
        return ""
    
    fpath = os.path.join(PDFS, f"{doc_id_m.group(1)}.pdf")
    if os.path.exists(fpath) and os.path.getsize(fpath) > 500:
        with open(fpath, 'rb') as f:
            if f.read(5) == b'%PDF-':
                return extract_text(fpath)

    page = ctx.new_page()
    all_responses = []
    pdf_body = None

    def on_response(response):
        nonlocal pdf_body
        try:
            ct = response.headers.get("content-type", "")
            size = int(response.headers.get("content-length", "0") or "0")
            all_responses.append({
                "url": response.url[:150],
                "status": response.status,
                "ct": ct[:50],
                "size": size
            })
            
            # Vang alles wat geen HTML/CSS/JS/image is
            if (size > 1000 and 
                "html" not in ct and "css" not in ct and 
                "javascript" not in ct and "image" not in ct and
                "font" not in ct):
                body = response.body()
                if body[:5] == b'%PDF-':
                    pdf_body = body
                elif len(body) > 10000 and b'%PDF-' in body[:100]:
                    pdf_body = body
        except:
            pass

    page.on("response", on_response)

    try:
        page.goto(doc_url, timeout=30000, wait_until="load")
        time.sleep(8)
    except:
        pass

    page.close()

    # Sla debug-info op (eerste keer)
    debug_path = "/root/beleidswijzer/v5_all_responses.json"
    if not os.path.exists(debug_path):
        with open(debug_path, "w") as f:
            json.dump({"doc_url": doc_url, "responses": all_responses}, f, indent=2)
        print(f"      Debug: {len(all_responses)} responses gelogd")

    if pdf_body:
        with open(fpath, "wb") as f:
            f.write(pdf_body)
        print(f"      PDF: {len(pdf_body)} bytes")
        return extract_text(fpath)

    return ""


def extract_text(fpath):
    try:
        parts = []
        with pdfplumber.open(fpath) as pdf:
            for pg in pdf.pages:
                t = pg.extract_text()
                if t:
                    parts.append(t)
        tekst = "\n\n".join(parts)
        if tekst:
            print(f"      Tekst: {len(tekst)} chars")
        return tekst
    except Exception as e:
        print(f"      Extractie: {e}")
        return ""


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper V5")
    print("Network interception voor PDF-downloads")
    print("=" * 60)

    conn = init_db()
    cur = conn.cursor()
    vergaderingen = load_vergaderingen()

    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"  Per jaar: {per_jaar}")

    # Eerst 1 document testen met volledige response-logging
    print("\n--- TEST: eerste document met volledige logging ---")
    test_done = False

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(accept_downloads=True)
        page = ctx.new_page()

        totaal = 0

        for i, v in enumerate(vergaderingen):
            datum, guid, jaar = v["datum"], v["guid"], v["jaar"]

            cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum,))
            if cur.fetchone()[0] > 0:
                continue

            print(f"\n  [{i+1}/{len(vergaderingen)}] {datum}...")

            try:
                page.goto(f"{BASE}/Agenda/Index/{guid}", timeout=30000)
                page.wait_for_load_state("networkidle")
                time.sleep(1)
            except Exception as e:
                print(f"    FOUT: {e}")
                continue

            docs = page.evaluate("""() => {
                const links = document.querySelectorAll('a[href*="Agenda/Document"]');
                return Array.from(links).map(a => ({
                    href: a.getAttribute('href'),
                    text: a.textContent.trim().replace(/\\s+/g, ' ')
                }));
            }""")

            for doc in docs:
                naam = doc["text"]
                href = doc["href"] or ""
                if not naam:
                    continue

                naam_l = naam.lower()
                if 'raadsbesluit' in naam_l:
                    dtype = 'raadsbesluit'
                elif 'raadsvoorstel' in naam_l:
                    dtype = 'raadsvoorstel'
                else:
                    continue

                full_url = (href if href.startswith("http") else BASE + href).replace("&amp;", "&")
                print(f"    {dtype}: {naam[:55]}...")

                # Eerste document: gebruik volledige logging
                if not test_done:
                    tekst = download_pdf_via_full_interception(ctx, full_url)
                    test_done = True
                    if not tekst:
                        print("\n    === EERSTE TEST MISLUKT ===")
                        print("    Check: cat /root/beleidswijzer/v5_all_responses.json")
                        print("    Ga toch door met standaard methode...\n")
                else:
                    tekst = download_pdf_via_interception(ctx, full_url)

                try:
                    cur.execute("""INSERT OR IGNORE INTO raadsbesluiten
                        (vergaderdatum, jaar, vergadering_guid, agendapunt,
                         document_naam, document_url, document_type, tekst_volledig)
                        VALUES (?,?,?,?,?,?,?,?)""",
                        (datum, jaar, guid, "", naam, full_url, dtype, tekst))
                    conn.commit()
                    totaal += 1
                except:
                    pass

            time.sleep(1)

        browser.close()

    cur.execute("SELECT COUNT(*) FROM raadsbesluiten")
    db_totaal = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE tekst_volledig != '' AND tekst_volledig IS NOT NULL")
    met_tekst = cur.fetchone()[0]
    cur.execute("SELECT jaar, document_type, COUNT(*) FROM raadsbesluiten GROUP BY jaar, document_type ORDER BY jaar")
    stats = cur.fetchall()

    print("\n" + "=" * 60)
    print(f"Nieuw: {totaal} | Totaal: {db_totaal} | Met tekst: {met_tekst}")
    for j, t, c in stats:
        print(f"  {j} {t}: {c}")
    print("=" * 60)
    conn.close()

if __name__ == "__main__":
    main()
PYTHON_EOF

echo "========================================"
echo "V5 starten..."
echo "========================================"
python3 scrape_v5.py 2>&1 | tee /root/beleidswijzer/v5_log.txt

echo ""
echo "========================================"
echo "V5 KLAAR!"
echo "  Log:     cat /root/beleidswijzer/v5_log.txt"  
echo "  Debug:   cat /root/beleidswijzer/v5_all_responses.json"
echo "  Viewer:  cat /root/beleidswijzer/v5_debug_viewer.html | head -200"
echo "========================================"
