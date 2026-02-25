#!/bin/bash
# ============================================================
# BeleidsWijzer — Scraper V4
#
# Fundamenteel andere aanpak:
# - JavaScript evaluate() voor ALLE DOM-interactie
# - Geen CSS-selectors, geen Playwright-locators
# - PDF download via Playwright context.request (met cookies)
# ============================================================
cd /root/beleidswijzer
source venv/bin/activate

rm -f vergadering_guids.json raadsbesluiten.db
rm -f pdfs_raad/*.pdf

cat > scrape_v4.py << 'PYTHON_EOF'
import sqlite3, json, re, os, time, sys
from playwright.sync_api import sync_playwright
import pdfplumber

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
DB   = "/root/beleidswijzer/raadsbesluiten.db"
PDFS = "/root/beleidswijzer/pdfs_raad"
CACHE = "/root/beleidswijzer/vergadering_guids.json"
os.makedirs(PDFS, exist_ok=True)

# ── Database ─────────────────────────────────────────────
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

# ── Stap 1: Vergadering-GUIDs ophalen ───────────────────
def find_vergaderingen(playwright):
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            data = json.load(f)
        if len(data) > 10:
            print(f"  Cache: {len(data)} vergaderingen")
            return data

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    print("  Laden: raadsvergaderingen-pagina...")
    page.goto(f"{BASE}/Calendar/OpenCategory/10000000", timeout=60000)
    page.wait_for_load_state("networkidle")
    time.sleep(4)

    # Debug: wat ziet Playwright?
    initial = page.evaluate("""() => {
        const links = document.querySelectorAll('a[href*="/Agenda/Index/"]');
        return { linkCount: links.length, url: location.href };
    }""")
    print(f"  Na laden: {initial['linkCount']} links, URL={initial['url']}")
    page.screenshot(path="/root/beleidswijzer/v4_debug_01_initial.png")

    # Zoek en klik ALLE jaar-elementen via JavaScript
    for jaar in [2025, 2024, 2023, 2022]:
        result = page.evaluate(f"""(targetYear) => {{
            // Strategie 1: zoek leaf-nodes met exact het jaartal als tekst
            const walker = document.createTreeWalker(
                document.body, NodeFilter.SHOW_ELEMENT, null
            );
            let node;
            let found = false;
            while (node = walker.nextNode()) {{
                const text = node.textContent.trim();
                const ownText = Array.from(node.childNodes)
                    .filter(n => n.nodeType === 3)
                    .map(n => n.textContent.trim())
                    .join('');
                
                if (ownText === String(targetYear) || text === String(targetYear)) {{
                    // Check of dit element klikbaar lijkt
                    const tag = node.tagName.toLowerCase();
                    const role = node.getAttribute('role');
                    const cls = node.className || '';
                    
                    if (tag === 'button' || tag === 'a' || role === 'button' 
                        || cls.includes('toggle') || cls.includes('collap')
                        || cls.includes('tree') || cls.includes('accordion')
                        || node.onclick || node.style.cursor === 'pointer') {{
                        
                        node.scrollIntoView({{ block: 'center' }});
                        node.click();
                        found = true;
                        return {{ 
                            status: 'clicked', 
                            tag: tag, 
                            cls: cls.substring(0, 80),
                            role: role 
                        }};
                    }}
                }}
            }}
            
            // Strategie 2: als geen klikbaar element gevonden, klik het eerste element
            // dat het jaartal bevat en een interactief element is
            const all = document.querySelectorAll('button, [role="button"], a, [onclick]');
            for (const el of all) {{
                if (el.textContent.trim() === String(targetYear)) {{
                    el.scrollIntoView({{ block: 'center' }});
                    el.click();
                    return {{ 
                        status: 'clicked_fallback', 
                        tag: el.tagName.toLowerCase(),
                        cls: (el.className || '').substring(0, 80)
                    }};
                }}
            }}
            
            return {{ status: 'not_found' }};
        }}""", jaar)

        print(f"  Jaar {jaar}: {result}")
        time.sleep(3)

        # Tel links na elke klik
        count = page.evaluate("""() => document.querySelectorAll('a[href*="/Agenda/Index/"]').length""")
        print(f"    Links nu: {count}")

    page.screenshot(path="/root/beleidswijzer/v4_debug_02_after_clicks.png")
    time.sleep(2)

    # Extraheer ALLE vergadering-links via JavaScript
    raw_links = page.evaluate("""() => {
        const links = document.querySelectorAll('a[href*="/Agenda/Index/"]');
        return Array.from(links).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim().replace(/\\s+/g, ' ')
        }));
    }""")

    print(f"\n  Ruwe links: {len(raw_links)}")

    maand_map = {
        'januari':1,'februari':2,'maart':3,'april':4,'mei':5,'juni':6,
        'juli':7,'augustus':8,'september':9,'oktober':10,'november':11,'december':12
    }

    vergaderingen = []
    seen = set()
    for item in raw_links:
        href = item.get("href", "")
        text = item.get("text", "")
        if "/Agenda/Index/" not in href:
            continue
        guid = href.split("/Agenda/Index/")[-1].split("?")[0]
        if guid in seen or len(guid) < 30:
            continue
        seen.add(guid)

        m = re.search(
            r'(\d+)\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})',
            text, re.IGNORECASE
        )
        if m:
            d, mn, y = int(m.group(1)), maand_map[m.group(2).lower()], int(m.group(3))
            if 2022 <= y <= 2026:
                vergaderingen.append({"guid": guid, "datum": f"{y}-{mn:02d}-{d:02d}", "jaar": y, "titel": text[:100]})

    # Als we te weinig hebben: DUMP de hele pagina HTML voor debug
    if len(vergaderingen) < 10:
        print(f"\n  WAARSCHUWING: slechts {len(vergaderingen)} vergaderingen!")
        html_dump = page.content()
        with open("/root/beleidswijzer/v4_debug_page.html", "w") as f:
            f.write(html_dump)
        print("  HTML dump opgeslagen als v4_debug_page.html")

    browser.close()

    vergaderingen.sort(key=lambda v: v["datum"])
    with open(CACHE, "w") as f:
        json.dump(vergaderingen, f, indent=2, ensure_ascii=False)

    per_jaar = {}
    for v in vergaderingen:
        per_jaar[v["jaar"]] = per_jaar.get(v["jaar"], 0) + 1
    print(f"\n  Resultaat: {len(vergaderingen)} vergaderingen")
    print(f"  Per jaar: {per_jaar}")

    return vergaderingen

# ── Stap 2: Documenten scrapen + PDF's downloaden ───────
def scrape_documenten(playwright, vergaderingen, conn):
    cur = conn.cursor()
    totaal = 0

    browser = playwright.chromium.launch(headless=True)
    ctx = browser.new_context(accept_downloads=True)
    page = ctx.new_page()

    for i, v in enumerate(vergaderingen):
        datum, guid, jaar = v["datum"], v["guid"], v["jaar"]

        cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum,))
        if cur.fetchone()[0] > 0:
            print(f"  [{i+1}/{len(vergaderingen)}] {datum} — skip (in DB)")
            continue

        print(f"  [{i+1}/{len(vergaderingen)}] {datum}...")

        try:
            page.goto(f"{BASE}/Agenda/Index/{guid}", timeout=30000)
            page.wait_for_load_state("networkidle")
            time.sleep(1)
        except Exception as e:
            print(f"    FOUT laden: {e}")
            continue

        # Zoek document-links via JavaScript
        docs = page.evaluate("""() => {
            const links = document.querySelectorAll('a[href*="Agenda/Document"]');
            return Array.from(links).map(a => ({
                href: a.getAttribute('href'),
                text: a.textContent.trim().replace(/\\s+/g, ' '),
                docId: a.getAttribute('data-document-id') || ''
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
            print(f"    {dtype}: {naam[:60]}...")

            tekst = download_pdf(ctx, full_url)

            try:
                cur.execute("""INSERT OR IGNORE INTO raadsbesluiten
                    (vergaderdatum, jaar, vergadering_guid, agendapunt,
                     document_naam, document_url, document_type, tekst_volledig)
                    VALUES (?,?,?,?,?,?,?,?)""",
                    (datum, jaar, guid, "", naam, full_url, dtype, tekst))
                conn.commit()
                totaal += 1
            except Exception as e:
                print(f"      DB: {e}")

        time.sleep(1)

    browser.close()
    return totaal

# ── PDF download + tekst extractie ───────────────────────
def download_pdf(ctx, url):
    doc_id_m = re.search(r'documentId=([a-f0-9-]+)', url)
    if not doc_id_m:
        doc_id_m = re.search(r'Document/([a-f0-9-]+)', url)
    if not doc_id_m:
        return ""

    fpath = os.path.join(PDFS, f"{doc_id_m.group(1)}.pdf")

    # Check bestaand geldig PDF
    if os.path.exists(fpath) and os.path.getsize(fpath) > 500:
        with open(fpath, 'rb') as f:
            if f.read(5) == b'%PDF-':
                return extract_text(fpath)

    # Download via Playwright API request (draagt browsercookies mee)
    try:
        resp = ctx.request.get(url, timeout=60000)
        body = resp.body()
        ct = resp.headers.get("content-type", "")

        if body[:5] == b'%PDF-':
            with open(fpath, "wb") as f:
                f.write(body)
            print(f"      OK: {len(body)} bytes (API)")
            return extract_text(fpath)

        # Soms redirect iBabs naar een andere URL
        # Check of er een redirect-URL in de HTML zit
        if b'<meta http-equiv="refresh"' in body[:2000]:
            redirect_m = re.search(rb'url=([^"\'>\s]+)', body[:2000])
            if redirect_m:
                redir_url = redirect_m.group(1).decode()
                if not redir_url.startswith("http"):
                    redir_url = BASE + redir_url
                resp2 = ctx.request.get(redir_url, timeout=60000)
                body2 = resp2.body()
                if body2[:5] == b'%PDF-':
                    with open(fpath, "wb") as f:
                        f.write(body2)
                    print(f"      OK: {len(body2)} bytes (redirect)")
                    return extract_text(fpath)

        print(f"      GEEN PDF: {ct[:40]}, {len(body)}b, start={body[:20]}")
        # Sla de response op voor debug (eerste keer)
        debug_path = "/root/beleidswijzer/v4_debug_response.html"
        if not os.path.exists(debug_path):
            with open(debug_path, "wb") as f:
                f.write(body[:5000])
        return ""

    except Exception as e:
        print(f"      FOUT: {e}")
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

# ── Main ─────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten Scraper V4")
    print("JavaScript DOM-aanpak + Playwright API downloads")
    print("=" * 60)

    conn = init_db()

    with sync_playwright() as pw:
        print("\nSTAP 1: Vergaderingen ophalen...")
        verg = find_vergaderingen(pw)

        if len(verg) < 5:
            print("\nTE WEINIG. Debug bestanden:")
            print("  v4_debug_01_initial.png")
            print("  v4_debug_02_after_clicks.png")
            print("  v4_debug_page.html")
            print("\nGa toch door...")

        print(f"\nSTAP 2: {len(verg)} vergaderingen scrapen...")
        nieuw = scrape_documenten(pw, verg, conn)

    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM raadsbesluiten")
    totaal = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE tekst_volledig != '' AND tekst_volledig IS NOT NULL")
    met_tekst = cur.fetchone()[0]
    cur.execute("SELECT jaar, document_type, COUNT(*) FROM raadsbesluiten GROUP BY jaar, document_type ORDER BY jaar")
    stats = cur.fetchall()

    print("\n" + "=" * 60)
    print(f"Nieuw: {nieuw} | Totaal: {totaal} | Met tekst: {met_tekst}")
    for j, t, c in stats:
        print(f"  {j} {t}: {c}")
    print("=" * 60)
    conn.close()

if __name__ == "__main__":
    main()
PYTHON_EOF

echo "========================================"
echo "V4 starten..."
echo "========================================"
python3 scrape_v4.py 2>&1 | tee /root/beleidswijzer/v4_log.txt

echo ""
echo "========================================"
echo "V4 KLAAR!"
echo "  Log:    cat /root/beleidswijzer/v4_log.txt"
echo "  Debug:  ls /root/beleidswijzer/v4_debug_*"
echo "========================================"
