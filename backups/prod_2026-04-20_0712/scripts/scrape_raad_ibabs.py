"""
Scrape raadsbesluiten uit iBabs — stap voor stap.

Stap 1: Gebruik de Besluitenlijst-overzichtspagina om per vergaderdatum
        de individuele besluit-items te vinden.
Stap 2: Per besluit-item: haal documenten op.
Stap 3: Download relevante PDF's en extraheer tekst.
"""
import requests, re, time, json, os, sqlite3, sys

try:
    import pdfplumber
except ImportError:
    print("pip install pdfplumber")
    sys.exit(1)

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db_collegebesluiten.db")
PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pdfs_raad")
os.makedirs(PDF_DIR, exist_ok=True)

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (Macintosh) BeleidsWijzer/1.0"

RAADSVERGADERING_DATUMS = [
    "27-01-2026",
    "16-12-2025", "25-11-2025", "04-11-2025", "14-10-2025", "22-09-2025",
    "20-08-2025", "08-07-2025", "01-07-2025", "23-06-2025", "03-06-2025",
    "27-05-2025", "13-05-2025", "01-04-2025", "11-03-2025", "05-03-2025", "28-01-2025",
    "18-12-2024", "26-11-2024", "19-11-2024", "05-11-2024", "15-10-2024", "16-09-2024",
    "02-07-2024", "24-06-2024", "04-06-2024", "23-04-2024", "16-04-2024", "26-03-2024",
    "27-02-2024", "30-01-2024", "16-01-2024",
    "19-12-2023", "21-11-2023", "31-10-2023", "30-10-2023", "24-10-2023", "19-09-2023",
    "04-07-2023", "27-06-2023", "13-06-2023", "06-06-2023", "09-05-2023", "04-04-2023",
    "14-03-2023", "07-03-2023", "31-01-2023",
    "13-12-2022", "08-11-2022", "20-09-2022",
]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS raadsbesluiten (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vergaderdatum TEXT,
            jaar INTEGER,
            agendapunt TEXT,
            besluit_tekst TEXT,
            document_naam TEXT,
            document_url TEXT,
            document_type TEXT,
            tekst_volledig TEXT,
            thema TEXT,
            ibabs_item_id TEXT,
            UNIQUE(vergaderdatum, document_naam)
        )
    """)
    conn.commit()
    return conn


def get_page(url, retries=3):
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            print(f"    Poging {attempt+1} mislukt: {e}")
            time.sleep(2)
    return None


def scrape_vergadering_pagina(url):
    """Scrape een raadsvergadering-agenda en retourneer agendapunten + documenten."""
    html = get_page(url)
    if not html:
        return []

    resultaten = []

    # Zoek alle document-links met hun namen
    doc_pattern = re.compile(
        r'href="([^"]*(?:Agenda/Document|Document/View)[^"]*)"[^>]*>\s*([^<]+)',
        re.IGNORECASE
    )

    # Zoek agendapunten (h3 titels) en hun bijbehorende documenten
    # Split HTML op h3-niveau
    sections = re.split(r'(<h3[^>]*>.*?</h3>)', html, flags=re.DOTALL)

    current_titel = ""
    for i, section in enumerate(sections):
        h3_match = re.search(r'<h3[^>]*>(.*?)</h3>', section, re.DOTALL)
        if h3_match:
            current_titel = re.sub(r'<[^>]+>', '', h3_match.group(1)).strip()
            continue

        if not current_titel:
            continue

        docs = doc_pattern.findall(section)
        for href, naam in docs:
            naam = naam.strip()
            if is_relevant(naam):
                resultaten.append({
                    "agendapunt": current_titel,
                    "document_naam": naam,
                    "document_url": href if href.startswith("http") else BASE + href,
                    "document_type": classify_doc(naam),
                })

    return resultaten


def is_relevant(naam):
    naam_l = naam.lower()
    return any(t in naam_l for t in ["raadsbesluit", "raadsvoorstel"])


def classify_doc(naam):
    naam_l = naam.lower()
    if "raadsbesluit" in naam_l:
        return "raadsbesluit"
    if "raadsvoorstel" in naam_l:
        return "raadsvoorstel"
    return "overig"


def download_and_extract(url):
    """Download PDF en extraheer tekst."""
    doc_id = re.search(r'documentId=([a-f0-9-]+)', url)
    if not doc_id:
        doc_id = re.search(r'View/([a-f0-9-]+)', url)
    if not doc_id:
        return ""

    filepath = os.path.join(PDF_DIR, f"{doc_id.group(1)}.pdf")

    if not os.path.exists(filepath):
        try:
            resp = session.get(url, timeout=60, stream=True)
            ct = resp.headers.get("Content-Type", "")
            if resp.status_code != 200:
                return ""
            with open(filepath, "wb") as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
        except Exception as e:
            print(f"      Download mislukt: {e}")
            return ""

    try:
        parts = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    parts.append(t)
        return "\n\n".join(parts)
    except Exception as e:
        print(f"      PDF-extractie mislukt: {e}")
        return ""


def datum_to_iso(d):
    """dd-mm-yyyy -> yyyy-mm-dd"""
    parts = d.split("-")
    return f"{parts[2]}-{parts[1]}-{parts[0]}"


def find_vergadering_guid(datum_iso):
    """Zoek de vergadering-GUID via een zoektocht op de iBabs site."""
    dag, maand, jaar = datum_iso.split("-")
    maand_namen = {
        "01": "januari", "02": "februari", "03": "maart", "04": "april",
        "05": "mei", "06": "juni", "07": "juli", "08": "augustus",
        "09": "september", "10": "oktober", "11": "november", "12": "december"
    }

    # Haal de kalendermaand op
    url = f"{BASE}/Calendar?year={jaar}&month={int(maand)}"
    html = get_page(url)
    if not html:
        return None

    # Zoek alle agenda GUIDs op de pagina
    guids = set(re.findall(r'/Agenda/Index/([a-f0-9-]+)', html))

    # Probeer elke GUID — check of de pagina de juiste datum bevat
    dag_int = str(int(dag))
    maand_naam = maand_namen[maand]

    for guid in guids:
        agenda_url = f"{BASE}/Agenda/Index/{guid}"
        agenda_html = get_page(agenda_url)
        if not agenda_html:
            continue

        if "Raadsvergadering" in agenda_html and maand_naam in agenda_html.lower():
            if f"{dag_int} {maand_naam}" in agenda_html.lower() or f"{dag} {maand_naam}" in agenda_html.lower():
                return guid

        time.sleep(0.3)

    return None


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten scraper (iBabs)")
    print("=" * 60)

    conn = init_db()
    cursor = conn.cursor()

    totaal_nieuw = 0

    for i, datum in enumerate(RAADSVERGADERING_DATUMS):
        datum_iso = datum_to_iso(datum)
        jaar = int(datum_iso[:4])
        print(f"\n[{i+1}/{len(RAADSVERGADERING_DATUMS)}] Raadsvergadering {datum}")

        # Check hoeveel we al hebben voor deze datum
        cursor.execute("SELECT COUNT(*) FROM raadsbesluiten WHERE vergaderdatum=?", (datum_iso,))
        bestaand = cursor.fetchone()[0]
        if bestaand > 0:
            print(f"  Al in database ({bestaand} docs), overgeslagen")
            continue

        # Zoek de vergadering-pagina
        print(f"  Zoeken naar vergadering-GUID...")
        guid = find_vergadering_guid(datum_iso)

        if not guid:
            print(f"  GUID niet gevonden, overgeslagen")
            continue

        print(f"  GUID: {guid[:12]}...")
        agenda_url = f"{BASE}/Agenda/Index/{guid}"

        # Scrape agendapunten + documenten
        docs = scrape_vergadering_pagina(agenda_url)
        print(f"  {len(docs)} relevante documenten gevonden")

        for doc in docs:
            print(f"    {doc['document_type']}: {doc['document_naam'][:60]}...")

            tekst = download_and_extract(doc["document_url"])
            time.sleep(1)

            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO raadsbesluiten
                    (vergaderdatum, jaar, agendapunt, document_naam, document_url,
                     document_type, tekst_volledig, ibabs_item_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    datum_iso, jaar, doc["agendapunt"], doc["document_naam"],
                    doc["document_url"], doc["document_type"], tekst, guid
                ))
                conn.commit()
                totaal_nieuw += 1
            except Exception as e:
                print(f"      DB-fout: {e}")

        time.sleep(1)

    # Samenvatting
    cursor.execute("SELECT COUNT(*) FROM raadsbesluiten")
    totaal = cursor.fetchone()[0]

    cursor.execute("SELECT jaar, COUNT(*) FROM raadsbesluiten GROUP BY jaar ORDER BY jaar")
    per_jaar = cursor.fetchall()

    cursor.execute("SELECT document_type, COUNT(*) FROM raadsbesluiten GROUP BY document_type")
    per_type = cursor.fetchall()

    print("\n" + "=" * 60)
    print(f"KLAAR — {totaal_nieuw} nieuwe documenten")
    print(f"Totaal in database: {totaal}")
    if per_jaar:
        print("\nPer jaar:")
        for j, c in per_jaar:
            print(f"  {j}: {c}")
    if per_type:
        print("\nPer type:")
        for t, c in per_type:
            print(f"  {t}: {c}")

    conn.close()


if __name__ == "__main__":
    main()
