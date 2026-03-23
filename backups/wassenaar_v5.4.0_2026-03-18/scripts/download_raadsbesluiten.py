"""
Download raadsbesluiten uit het iBabs publieksportaal van Wassenaar.

Stap 1: Scrape alle raadsvergaderingen van de kalender (2022-2026)
Stap 2: Per vergadering: scrape agendapunten + bijlagen
Stap 3: Download Raadsbesluit- en Raadsvoorstel-PDF's
Stap 4: Extraheer tekst met pdfplumber
Stap 5: Sla op in SQLite database

Gebruik:
    python download_raadsbesluiten.py
"""

import requests
import re
import sqlite3
import time
import os
import sys
from datetime import datetime
from urllib.parse import urljoin

try:
    import pdfplumber
except ImportError:
    print("Installeer pdfplumber: pip install pdfplumber")
    sys.exit(1)

from html.parser import HTMLParser

BASE_URL = "https://wassenaar.bestuurlijkeinformatie.nl"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db_collegebesluiten.db")
PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pdfs_raad")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) BeleidsWijzer Wassenaar/1.0"
}

JAREN = [2022, 2023, 2024, 2025, 2026]
MAANDEN = range(1, 13)


class CalendarParser(HTMLParser):
    """Extraheert vergadering-links uit de iBabs kalender HTML."""
    def __init__(self):
        super().__init__()
        self.meetings = []
        self._in_link = False
        self._current_href = None
        self._current_text = ""

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs_dict = dict(attrs)
            href = attrs_dict.get("href", "")
            if "/Agenda/Index/" in href:
                self._in_link = True
                self._current_href = href
                self._current_text = ""

    def handle_data(self, data):
        if self._in_link:
            self._current_text += data

    def handle_endtag(self, tag):
        if tag == "a" and self._in_link:
            self._in_link = False
            self.meetings.append({
                "url": self._current_href,
                "titel": self._current_text.strip()
            })


class AgendaParser(HTMLParser):
    """Extraheert agendapunten en document-links uit een vergaderingpagina."""
    def __init__(self):
        super().__init__()
        self.items = []
        self._in_heading = False
        self._heading_level = 0
        self._current_item = None
        self._in_link = False
        self._current_href = None
        self._current_link_text = ""
        self._in_vote = False
        self._vote_text = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag in ("h3",):
            self._in_heading = True
            self._current_item = {"titel": "", "documenten": [], "stemuitslag": ""}

        if tag == "a" and self._current_item is not None:
            href = attrs_dict.get("href", "")
            if "/Agenda/Document/" in href or "/Document/View/" in href:
                self._in_link = True
                self._current_href = href
                self._current_link_text = ""

    def handle_data(self, data):
        if self._in_heading and self._current_item is not None:
            self._current_item["titel"] += data
        if self._in_link:
            self._current_link_text += data

    def handle_endtag(self, tag):
        if tag in ("h3",) and self._in_heading:
            self._in_heading = False
            if self._current_item and self._current_item["titel"].strip():
                self.items.append(self._current_item)

        if tag == "a" and self._in_link:
            self._in_link = False
            if self._current_item is not None and self._current_href:
                self._current_item["documenten"].append({
                    "url": self._current_href,
                    "naam": self._current_link_text.strip()
                })


def get_page(url, retries=3):
    """Haal een pagina op met retries."""
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            print(f"  Poging {attempt+1}/{retries} mislukt: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return None


def get_raadsvergaderingen():
    """Haal alle raadsvergaderingen op uit de kalender."""
    alle_vergaderingen = []

    for jaar in JAREN:
        for maand in MAANDEN:
            if jaar == 2026 and maand > 2:
                break

            url = f"{BASE_URL}/Calendar?year={jaar}&month={maand}"
            print(f"Kalender {jaar}-{maand:02d}...", end=" ")

            html = get_page(url)
            if not html:
                print("FOUT")
                continue

            parser = CalendarParser()
            parser.feed(html)

            raad = [m for m in parser.meetings if "Raadsvergadering" in m["titel"]]
            print(f"{len(raad)} raadsvergadering(en)")

            for m in raad:
                guid = m["url"].split("/")[-1]
                alle_vergaderingen.append({
                    "guid": guid,
                    "url": m["url"],
                    "titel": m["titel"],
                    "jaar": jaar,
                    "maand": maand,
                })

            time.sleep(0.5)

    uniek = {v["guid"]: v for v in alle_vergaderingen}
    result = sorted(uniek.values(), key=lambda v: (v["jaar"], v["maand"]))
    print(f"\nTotaal: {len(result)} unieke raadsvergaderingen")
    return result


def scrape_vergadering(vergadering):
    """Scrape agendapunten en documenten van één vergadering."""
    url = vergadering["url"]
    if not url.startswith("http"):
        url = BASE_URL + url

    html = get_page(url)
    if not html:
        return []

    parser = AgendaParser()
    parser.feed(html)

    # Vind document-URLs via regex (betrouwbaarder dan HTML parser voor complexe pagina)
    doc_pattern = re.compile(
        r'href="(/Agenda/Document/[^"]+)"[^>]*>([^<]+)',
        re.IGNORECASE
    )
    matches = doc_pattern.findall(html)

    # Koppel documenten aan agendapunten via de agendaItemId in de URL
    agendapunt_docs = {}
    for href, naam in matches:
        naam = naam.strip()
        item_match = re.search(r'agendaItemId=([a-f0-9-]+)', href)
        if item_match:
            item_id = item_match.group(1)
            if item_id not in agendapunt_docs:
                agendapunt_docs[item_id] = []
            agendapunt_docs[item_id].append({
                "url": href,
                "naam": naam,
            })

    # Extraheer stemresultaten
    stem_blocks = re.findall(
        r'<h4[^>]*>Stemuitslag</h4>.*?(?=<h[34]|$)',
        html, re.DOTALL | re.IGNORECASE
    )

    # Extraheer agendapunttitels met hun sectie
    heading_pattern = re.compile(
        r'<h3[^>]*>\s*(.*?)\s*</h3>',
        re.DOTALL | re.IGNORECASE
    )
    headings = heading_pattern.findall(html)

    resultaten = []
    for item_id, docs in agendapunt_docs.items():
        raadsbesluit_docs = [d for d in docs if is_relevant_document(d["naam"])]
        if raadsbesluit_docs:
            titel = extract_titel_for_item(html, item_id)
            resultaten.append({
                "agendapunt_id": item_id,
                "titel": clean_html(titel),
                "documenten": raadsbesluit_docs,
            })

    return resultaten


def is_relevant_document(naam):
    """Bepaal of een document relevant is (raadsbesluit of raadsvoorstel)."""
    naam_lower = naam.lower()
    return any(term in naam_lower for term in [
        "raadsbesluit", "raadsvoorstel", "amendement", "motie"
    ])


def extract_titel_for_item(html, item_id):
    """Probeer de agendapunttitel te vinden die hoort bij een agendaItemId."""
    pattern = re.compile(
        r'<h3[^>]*>\s*(.*?)\s*</h3>.*?agendaItemId=' + re.escape(item_id),
        re.DOTALL | re.IGNORECASE
    )
    match = pattern.search(html)
    if match:
        return match.group(1)

    # Alternatief: zoek dichtst bij de document-link
    idx = html.find(item_id)
    if idx > 0:
        chunk = html[max(0, idx-2000):idx]
        headings = re.findall(r'<h3[^>]*>\s*(.*?)\s*</h3>', chunk, re.DOTALL)
        if headings:
            return headings[-1]

    return "Onbekend agendapunt"


def clean_html(text):
    """Verwijder HTML-tags uit tekst."""
    return re.sub(r'<[^>]+>', '', text).strip()


def download_pdf(doc_url, vergadering_guid):
    """Download een PDF en retourneer het lokale pad."""
    if not doc_url.startswith("http"):
        doc_url = BASE_URL + doc_url

    doc_id_match = re.search(r'documentId=([a-f0-9-]+)', doc_url)
    if not doc_id_match:
        return None

    doc_id = doc_id_match.group(1)
    os.makedirs(PDF_DIR, exist_ok=True)
    filepath = os.path.join(PDF_DIR, f"{doc_id}.pdf")

    if os.path.exists(filepath):
        return filepath

    try:
        resp = requests.get(doc_url, headers=HEADERS, timeout=60, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and "octet" not in content_type.lower():
            print(f"    Geen PDF ({content_type}), overgeslagen")
            return None

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        size_kb = os.path.getsize(filepath) // 1024
        print(f"    PDF gedownload: {size_kb} KB")
        return filepath

    except requests.RequestException as e:
        print(f"    Download mislukt: {e}")
        return None


def extract_text_from_pdf(filepath):
    """Extraheer tekst uit een PDF met pdfplumber."""
    if not filepath or not os.path.exists(filepath):
        return ""

    try:
        text_parts = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as e:
        print(f"    PDF-extractie mislukt: {e}")
        return ""


def init_database():
    """Maak de raadsbesluiten-tabel aan als die niet bestaat."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS raadsbesluiten (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vergadering_guid TEXT,
            vergadering_titel TEXT,
            agendapunt_id TEXT,
            agendapunt_titel TEXT,
            datum TEXT,
            jaar INTEGER,
            document_naam TEXT,
            document_url TEXT,
            document_type TEXT,
            tekst_volledig TEXT,
            thema TEXT,
            UNIQUE(vergadering_guid, agendapunt_id, document_naam)
        )
    """)

    conn.commit()
    return conn


def classify_document_type(naam):
    """Classificeer het type document."""
    naam_lower = naam.lower()
    if "raadsbesluit" in naam_lower:
        return "raadsbesluit"
    elif "raadsvoorstel" in naam_lower:
        return "raadsvoorstel"
    elif "amendement" in naam_lower:
        return "amendement"
    elif "motie" in naam_lower:
        return "motie"
    return "overig"


def extract_datum_from_titel(titel):
    """Probeer een datum te extraheren uit de vergaderingtitel."""
    match = re.search(r'(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})', titel, re.IGNORECASE)
    if match:
        dag = int(match.group(1))
        maand_namen = {
            'januari': 1, 'februari': 2, 'maart': 3, 'april': 4,
            'mei': 5, 'juni': 6, 'juli': 7, 'augustus': 8,
            'september': 9, 'oktober': 10, 'november': 11, 'december': 12
        }
        maand = maand_namen.get(match.group(2).lower(), 1)
        jaar = int(match.group(3))
        return f"{jaar}-{maand:02d}-{dag:02d}", jaar
    return None, None


def main():
    print("=" * 60)
    print("BeleidsWijzer — Raadsbesluiten downloader")
    print("=" * 60)

    conn = init_database()
    cursor = conn.cursor()

    # Stap 1: Vind alle raadsvergaderingen
    print("\n[1/4] Raadsvergaderingen ophalen uit kalender...")
    vergaderingen = get_raadsvergaderingen()

    # Stap 2: Per vergadering agendapunten + documenten scrapen
    print("\n[2/4] Agendapunten en documenten scrapen...")
    totaal_docs = 0

    for i, verg in enumerate(vergaderingen, 1):
        datum, jaar = extract_datum_from_titel(verg["titel"])
        print(f"\n  [{i}/{len(vergaderingen)}] {verg['titel']}")

        items = scrape_vergadering(verg)
        print(f"    {len(items)} agendapunten met relevante documenten")

        for item in items:
            for doc in item["documenten"]:
                doc_type = classify_document_type(doc["naam"])

                # Check of al in DB
                cursor.execute(
                    "SELECT id FROM raadsbesluiten WHERE vergadering_guid=? AND agendapunt_id=? AND document_naam=?",
                    (verg["guid"], item["agendapunt_id"], doc["naam"])
                )
                if cursor.fetchone():
                    print(f"    Al in DB: {doc['naam'][:60]}")
                    continue

                print(f"    Downloaden: {doc['naam'][:60]}...")

                # Download PDF
                filepath = download_pdf(doc["url"], verg["guid"])
                time.sleep(1)

                # Extraheer tekst
                tekst = extract_text_from_pdf(filepath) if filepath else ""

                # Opslaan
                cursor.execute("""
                    INSERT OR IGNORE INTO raadsbesluiten
                    (vergadering_guid, vergadering_titel, agendapunt_id, agendapunt_titel,
                     datum, jaar, document_naam, document_url, document_type, tekst_volledig)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    verg["guid"], verg["titel"], item["agendapunt_id"], item["titel"],
                    datum, jaar or verg["jaar"], doc["naam"], doc["url"],
                    doc_type, tekst
                ))
                conn.commit()
                totaal_docs += 1

        time.sleep(1)

    # Stap 3: Samenvatting
    cursor.execute("SELECT COUNT(*) FROM raadsbesluiten")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT jaar, COUNT(*) FROM raadsbesluiten GROUP BY jaar ORDER BY jaar")
    per_jaar = cursor.fetchall()

    cursor.execute("SELECT document_type, COUNT(*) FROM raadsbesluiten GROUP BY document_type")
    per_type = cursor.fetchall()

    print("\n" + "=" * 60)
    print(f"KLAAR — {totaal_docs} nieuwe documenten gedownload")
    print(f"Totaal in database: {total}")
    print("\nPer jaar:")
    for jaar, count in per_jaar:
        print(f"  {jaar}: {count}")
    print("\nPer type:")
    for doc_type, count in per_type:
        print(f"  {doc_type}: {count}")

    conn.close()
    print("\nDatabase: " + DB_PATH)


if __name__ == "__main__":
    main()
