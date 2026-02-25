#!/bin/bash
# ============================================================
# BeleidsWijzer — Scraper V6 — DE DOORBRAAK
#
# V5 debug toonde de echte PDF-URL:
#   /Document/LoadAgendaItemDocument/{documentId}?agendaItemId={agendaItemId}
#
# V6: construeer die URL direct uit de bekende parameters.
# Gebruikt V4 GUID-cache (72 vergaderingen, 773 documenten).
# ============================================================
cd /root/beleidswijzer
source venv/bin/activate

rm -f raadsbesluiten.db
rm -f pdfs_raad/*.pdf

cat > scrape_v6.py << 'PYTHON_EOF'
import sqlite3, json, re, os, time, sys
from playwright.sync_api import sync_playwright
import pdfplumber

BASE  = "https://wassenaar.bestuurlijkeinformatie.nl"
DB    = "/root/beleidswijzer/raadsbesluiten.db"
PDFS  = "/root/beleidswijzer/pdfs_raad"
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
        print("FOUT: geen cache. Draai eerst V4.")
        sys.exit(1)
    with open(CACHE) as f:
        return json.load(f)

def make_pdf_url(viewer_url):
    """Converteer de viewer-URL naar de directe PDF-URL.
    
    Input:  /Agenda/Document/{guid}?documentId=XXX&agendaItemId=YYY
    Output: /Document/LoadAgendaItemDocument/XXX?agendaItemId=YYY
    """
    doc_id = re.search(r'documentId=([a-f0-9-]+)', viewer_url)
    item_id = re.search(r'agendaItemId=([a-f0-9-]+)', viewer_url)
    if not doc_id or not item_id:
        return None
    return f"{BASE}/Document/LoadAgendaItemDocument/{doc_id.group(1)}?agendaItemId={item_id.group(1)}"

def extract_text(fpath):
    try:
        parts = []
        with pdfplumber.open(fpath) as pdf:
            for pg in pdf.pages:
                t = pg.extract_text()
                if t:
                    parts.append(t)
        return "\n\n".join(parts)
    except Exception as e:
        print(f"      Extractie: {e}")
        return ""

def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper V6")
    print("Directe PDF-URL via /Document/LoadAgendaItemDocument/")
    print("=" * 60)

    conn = init_db()
    cur = conn.cursor()
    vergaderingen = load_vergaderingen()
    
    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"  {len(vergaderingen)} vergaderingen: {per_jaar}")

    totaal_docs = 0
    totaal_tekst = 0
    mislukt = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context()
        page = ctx.new_page()

        # Laad eerst een iBabs pagina om cookies te krijgen
        page.goto(BASE, timeout=30000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        for i, v in enumerate(vergaderingen):
            datum, guid, jaar = v["datum"], v["guid"], v["jaar"]

            cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum,))
            if cur.fetchone()[0] > 0:
                continue

            print(f"\n  [{i+1}/{len(vergaderingen)}] {datum}...")

            # Laad vergaderingpagina
            try:
                page.goto(f"{BASE}/Agenda/Index/{guid}", timeout=30000)
                page.wait_for_load_state("networkidle")
                time.sleep(1)
            except Exception as e:
                print(f"    FOUT: {e}")
                continue

            # Vind documenten via JavaScript
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

                viewer_url = (href if href.startswith("http") else BASE + href).replace("&amp;", "&")
                pdf_url = make_pdf_url(viewer_url)

                if not pdf_url:
                    print(f"    {dtype}: {naam[:55]}... SKIP (geen URL)")
                    continue

                # Extract document ID voor bestandsnaam
                doc_id = re.search(r'documentId=([a-f0-9-]+)', viewer_url).group(1)
                fpath = os.path.join(PDFS, f"{doc_id}.pdf")

                print(f"    {dtype}: {naam[:55]}...", end=" ", flush=True)

                # Download PDF via de directe URL
                try:
                    resp = ctx.request.get(pdf_url, timeout=60000)
                    body = resp.body()
                    ct = resp.headers.get("content-type", "")

                    if body[:5] == b'%PDF-' or "pdf" in ct:
                        with open(fpath, "wb") as f:
                            f.write(body)

                        tekst = extract_text(fpath)
                        status = f"OK {len(body)}b"
                        if tekst:
                            status += f" | {len(tekst)} chars"
                            totaal_tekst += 1
                    else:
                        tekst = ""
                        status = f"GEEN PDF: {ct[:30]}, {len(body)}b"
                        mislukt += 1
                except Exception as e:
                    tekst = ""
                    status = f"FOUT: {e}"
                    mislukt += 1

                print(status)

                try:
                    cur.execute("""INSERT OR IGNORE INTO raadsbesluiten
                        (vergaderdatum, jaar, vergadering_guid, agendapunt,
                         document_naam, document_url, document_type, tekst_volledig)
                        VALUES (?,?,?,?,?,?,?,?)""",
                        (datum, jaar, guid, "", naam, pdf_url, dtype, tekst))
                    conn.commit()
                    totaal_docs += 1
                except:
                    pass

            time.sleep(0.5)

        browser.close()

    # Rapport
    cur.execute("SELECT COUNT(*) FROM raadsbesluiten")
    db_totaal = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE tekst_volledig != '' AND tekst_volledig IS NOT NULL")
    db_tekst = cur.fetchone()[0]
    cur.execute("SELECT jaar, document_type, COUNT(*) FROM raadsbesluiten GROUP BY jaar, document_type ORDER BY jaar")
    stats = cur.fetchall()

    print("\n" + "=" * 60)
    print(f"RESULTAAT")
    print(f"  Documenten:    {db_totaal}")
    print(f"  Met tekst:     {db_tekst}")
    print(f"  Mislukt:       {mislukt}")
    print()
    for j, t, c in stats:
        print(f"  {j} {t}: {c}")
    print("=" * 60)
    conn.close()

if __name__ == "__main__":
    main()
PYTHON_EOF

echo "========================================"
echo "V6 starten..."
echo "========================================"
python3 scrape_v6.py 2>&1 | tee /root/beleidswijzer/v6_log.txt

echo ""
echo "========================================"
echo "V6 KLAAR!"
echo "  cat /root/beleidswijzer/v6_log.txt"
echo "========================================"
