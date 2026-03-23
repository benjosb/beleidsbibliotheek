#!/usr/bin/env python3
"""
Download alle collegebesluiten-PDF's (2024 + 2025), extraheer de volledige tekst,
en sla alles op in een SQLite-database.

Gebruik:
    python3 scripts/download_collegebesluiten.py

Output:
    - pdf_downloads/              → gedownloade PDF-bestanden
    - db_collegebesluiten.db      → SQLite-database met metadata + volledige tekst
"""

import json
import re
import sqlite3
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import pdfplumber
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_JS = BASE_DIR / "data.js"
PDF_DIR = BASE_DIR / "pdf_downloads"
DB_PATH = BASE_DIR / "db_collegebesluiten.db"

PDF_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "BeleidsbibliotheekWassenaar/2.0 (intern gebruik gemeente)"
}

CDN_BASE = "https://cuatro.sim-cdn.nl/wassenaar/uploads"

PORTEFEUILLE_HEADERS = [
    'Financiën, Economie en Sport', 'Financiën, Economie & Sport',
    'Sociaal Domein, Wonen en Onderwijs', 'Sociaal Domein, Wonen & Onderwijs',
    'Ruimte, Duurzaamheid en Mobiliteit', 'Ruimte, Duurzaamheid & Mobiliteit',
    'Cultuur en Welzijn', 'Cultuur & Welzijn',
    'Bedrijfsvoering', 'Portefeuille Burgemeester',
]

MAANDEN_NL = {
    1: "januari", 2: "februari", 3: "maart", 4: "april",
    5: "mei", 6: "juni", 7: "juli", 8: "augustus",
    9: "september", 10: "oktober", 11: "november", 12: "december",
}
MAANDEN_NR = {v: f"{k:02d}" for k, v in MAANDEN_NL.items()}


# ─── Data uit data.js (voor 2025 metadata) ────────────────────────────────────

def load_decisions_from_datajs():
    """Parse ALL_DECISIONS_DATA uit data.js."""
    text = DATA_JS.read_text(encoding="utf-8")
    match = re.search(
        r"const\s+ALL_DECISIONS_DATA\s*=\s*(\[.*?\]);\s*$",
        text, re.DOTALL | re.MULTILINE,
    )
    if not match:
        raise ValueError("Kan ALL_DECISIONS_DATA niet vinden in data.js")
    return json.loads(match.group(1))


def filter_college_year(decisions, year):
    """Filter collegebesluiten voor een specifiek jaar."""
    return [
        d for d in decisions
        if d.get("bron") == "college"
        and (d.get("jaar") == year or (d.get("datum") or "").startswith(str(year)))
    ]


# ─── PDF-URL discovery voor jaren zonder data.js ──────────────────────────────

def discover_pdf_urls(year):
    """
    Ontdek welke B&W-besluitenlijst-PDF's bestaan voor een gegeven jaar
    door alle mogelijke datums te proberen via HEAD requests.
    """
    print(f"\n🔍 PDF-URLs ontdekken voor {year} …")

    found = []
    d = date(year, 1, 1)
    end = date(year, 12, 31)
    checked = 0

    while d <= end:
        dag = d.day
        maand = MAANDEN_NL[d.month]
        # Probeer standaard patroon
        url = f"{CDN_BASE}/besluitenlijst_bw_vergadering_{dag}_{maand}_{year}.pdf"

        try:
            resp = requests.head(url, headers=HEADERS, timeout=10, allow_redirects=True)
            if resp.status_code == 200:
                found.append(url)
                print(f"  ✓ {dag} {maand} {year}")
        except requests.RequestException:
            pass

        checked += 1
        if checked % 30 == 0:
            print(f"  … {checked} datums gecontroleerd, {len(found)} gevonden", flush=True)

        d += timedelta(days=1)
        time.sleep(0.1)

    # Probeer ook varianten met _0 suffix (zoals 18_maart_2025_0)
    for url_base in list(found):
        url_0 = url_base.replace(".pdf", "_0.pdf")
        try:
            resp = requests.head(url_0, headers=HEADERS, timeout=10, allow_redirects=True)
            if resp.status_code == 200:
                found.append(url_0)
                print(f"  ✓ (variant _0) {url_0.split('/')[-1]}")
        except requests.RequestException:
            pass

    print(f"  → {len(found)} PDF's gevonden voor {year}")
    return sorted(set(found))


# ─── PDF downloaden ───────────────────────────────────────────────────────────

def download_pdf(url):
    """Download een PDF en sla op in pdf_downloads/."""
    filename = url.split("/")[-1]
    filepath = PDF_DIR / filename

    if filepath.exists():
        print(f"  ✓ Bestaat al: {filename}")
        return filepath

    print(f"  ↓ Downloaden: {filename} …", end=" ", flush=True)
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    filepath.write_bytes(resp.content)
    size_kb = len(resp.content) / 1024
    print(f"{size_kb:.0f} KB")

    time.sleep(0.5)
    return filepath


# ─── Tekst uit PDF extraheren ─────────────────────────────────────────────────

def extract_text_from_pdf(filepath):
    """Extraheer alle tekst uit een PDF met pdfplumber."""
    pages_text = []
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
    return "\n\n".join(pages_text)


def count_pages(filepath):
    with pdfplumber.open(filepath) as pdf:
        return len(pdf.pages)


def parse_agendapunten(full_text):
    """
    Probeer de volledige PDF-tekst te splitsen in individuele agendapunten.
    Retourneert dict: agendapunt_nr → tekst_sectie
    """
    sections = {}

    patterns = [
        r"(?:^|\n)\s*(\d+(?:\.[a-z](?:\.\d+)?)?)\s*[\.)\s]+(.+?)(?=\n\s*\d+(?:\.[a-z])?[\.)\s]+|\Z)",
        r"(?:^|\n)\s*Agendapunt\s+(\d+[a-z0-9.]*)\s*[:\-]?\s*(.+?)(?=\nAgendapunt\s+\d+|\Z)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, full_text, re.DOTALL | re.IGNORECASE)
        if len(matches) >= 3:
            for nr, content in matches:
                sections[nr.strip()] = content.strip()
            break

    return sections


def extract_decisions_from_pdf(full_text, pdf_url, vergadering_datum, year):
    """
    Extraheer individuele besluiten uit PDF-tekst als er geen data.js-data is.
    Retourneert lijst van dicts met besluit-metadata.
    """
    sections = parse_agendapunten(full_text)
    decisions = []

    for nr, content in sections.items():
        lines = content.strip().split("\n")
        naam = lines[0].strip() if lines else f"Agendapunt {nr}"
        # Zoek naar "Besluit:" in de tekst
        besluit_tekst = None
        for i, line in enumerate(lines):
            if re.match(r"^\s*Besluit\s*:", line, re.IGNORECASE):
                besluit_tekst = "\n".join(lines[i:]).strip()
                break

        if not besluit_tekst and len(lines) > 1:
            besluit_tekst = "\n".join(lines[1:]).strip()

        # Skip portefeuille-kopjes (5.a, 5.b, 5.c etc.) — die zijn geen besluiten
        if not besluit_tekst or len(besluit_tekst) < 20:
            if re.match(r"^\d+\.[a-z]$", str(nr).strip()):
                continue  # 5.a, 5.b, 5.c = alleen header, geen besluit
        if naam.strip() in PORTEFEUILLE_HEADERS and (not besluit_tekst or len(besluit_tekst) < 50):
            continue  # portefeuillenaam als kopje, geen echte besluittekst

        # Probeer portefeuille te herkennen
        portefeuille = None
        for line in lines:
            if "portefeuille" in line.lower():
                portefeuille = line.strip()
                break

        decisions.append({
            "datum": vergadering_datum,
            "naam": naam[:500],
            "besluit": (besluit_tekst or "")[:1000],
            "portefeuille": portefeuille,
            "domein": None,
            "agendapunt": nr,
            "pdf_url": pdf_url,
            "jaar": year,
            "volledige_tekst": content,
        })

    return decisions


# ─── SQLite-database ──────────────────────────────────────────────────────────

def cleanup_portefeuille_headers(conn):
    """Verwijder bestaande portefeuille-kopjes uit de database."""
    c = conn.cursor()
    placeholders = ",".join("?" * len(PORTEFEUILLE_HEADERS))
    c.execute(
        f"""DELETE FROM besluiten WHERE naam IN ({placeholders})
           AND (besluit_kort IS NULL OR LENGTH(TRIM(COALESCE(besluit_kort,''))) < 50)""",
        PORTEFEUILLE_HEADERS,
    )
    deleted = c.rowcount
    conn.commit()
    return deleted


def create_database():
    """Maak de SQLite-database met het juiste schema."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS vergaderingen (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            datum           TEXT,
            jaar            INTEGER,
            pdf_url         TEXT UNIQUE,
            pdf_bestand     TEXT,
            volledige_tekst TEXT,
            aantal_paginas  INTEGER,
            download_datum  TEXT
        );

        CREATE TABLE IF NOT EXISTS besluiten (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            vergadering_id  INTEGER REFERENCES vergaderingen(id),
            datum           TEXT,
            naam            TEXT,
            besluit_kort    TEXT,
            besluit_volledig TEXT,
            portefeuille    TEXT,
            domein          TEXT,
            agendapunt      TEXT,
            pdf_url         TEXT,
            jaar            INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_besluiten_domein ON besluiten(domein);
        CREATE INDEX IF NOT EXISTS idx_besluiten_datum ON besluiten(datum);
        CREATE INDEX IF NOT EXISTS idx_besluiten_naam ON besluiten(naam);
        CREATE INDEX IF NOT EXISTS idx_besluiten_jaar ON besluiten(jaar);
        CREATE INDEX IF NOT EXISTS idx_besluiten_vergadering ON besluiten(vergadering_id);
        CREATE INDEX IF NOT EXISTS idx_vergaderingen_jaar ON vergaderingen(jaar);
    """)

    conn.commit()
    return conn


def url_to_datum(url):
    """Haal de vergaderdatum uit de PDF-URL."""
    match = re.search(r"(\d+)_(\w+)_(\d{4})", url)
    if match:
        dag, maand_nl, jaar = match.groups()
        maand_nr = MAANDEN_NR.get(maand_nl.lower(), "01")
        return f"{jaar}-{maand_nr}-{dag.zfill(2)}"
    return None


def insert_vergadering(conn, datum, jaar, pdf_url, pdf_bestand, full_text, num_pages):
    c = conn.cursor()
    c.execute(
        """INSERT OR REPLACE INTO vergaderingen
           (datum, jaar, pdf_url, pdf_bestand, volledige_tekst, aantal_paginas, download_datum)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (datum, jaar, pdf_url, pdf_bestand, full_text, num_pages, datetime.now().isoformat()),
    )
    conn.commit()
    return c.lastrowid


def insert_besluit(conn, vergadering_id, decision, full_text_section=None):
    c = conn.cursor()
    volledig = full_text_section or decision.get("volledige_tekst")
    c.execute(
        """INSERT INTO besluiten
           (vergadering_id, datum, naam, besluit_kort, besluit_volledig,
            portefeuille, domein, agendapunt, pdf_url, jaar)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            vergadering_id,
            decision.get("datum"),
            decision.get("naam"),
            decision.get("besluit"),
            volledig,
            decision.get("portefeuille"),
            decision.get("domein"),
            decision.get("agendapunt"),
            decision.get("pdf_url"),
            decision.get("jaar"),
        ),
    )
    conn.commit()
    return c.lastrowid


def match_besluit_to_section(decision, sections):
    """Probeer een besluit te matchen aan een sectie in de PDF-tekst."""
    agendapunt = decision.get("agendapunt", "")
    if agendapunt and agendapunt in sections:
        return sections[agendapunt]

    naam = (decision.get("naam") or "").lower()
    if not naam:
        return None

    best_match = None
    best_score = 0
    for nr, text in sections.items():
        text_lower = text.lower()
        words = naam.split()
        matching_words = sum(1 for w in words if w in text_lower)
        score = matching_words / max(len(words), 1)
        if score > best_score and score > 0.4:
            best_score = score
            best_match = text

    return best_match


# ─── Verwerk één jaar ─────────────────────────────────────────────────────────

def process_year(conn, year, datajs_decisions=None):
    """
    Verwerk alle collegebesluiten voor een jaar.
    Altijd: ontdek PDF's en extraheer alle agendapunten uit de PDF-tekst.
    Als datajs_decisions beschikbaar is, verrijk de geëxtraheerde besluiten
    met metadata (domein, portefeuille etc.) via naam-matching.
    """
    print(f"\n{'─' * 60}")
    print(f"📅 Jaar {year}")
    print(f"{'─' * 60}")

    has_enrichment = datajs_decisions is not None and len(datajs_decisions) > 0
    if has_enrichment:
        print(f"   {len(datajs_decisions)} besluiten in data.js (voor verrijking)")

    # Altijd: ontdek PDF's via URL-scan
    pdf_urls = discover_pdf_urls(year)

    # Download en verwerk PDFs
    print(f"\n📥 PDF's downloaden …")
    pdf_data = {}
    for url in pdf_urls:
        try:
            filepath = download_pdf(url)
            full_text = extract_text_from_pdf(filepath)
            num_pages = count_pages(filepath)
            sections = parse_agendapunten(full_text)
            pdf_data[url] = {
                "text": full_text,
                "file": filepath.name,
                "pages": num_pages,
                "sections": sections,
            }
        except Exception as e:
            print(f"  ✗ FOUT bij {url}: {e}")
            pdf_data[url] = {"text": None, "file": None, "pages": 0, "sections": {}}

    # Vergaderingen in DB
    vergadering_ids = {}
    for url in pdf_urls:
        info = pdf_data.get(url, {})
        datum_str = url_to_datum(url)
        vid = insert_vergadering(
            conn, datum_str, year, url,
            info.get("file"), info.get("text"), info.get("pages", 0)
        )
        vergadering_ids[url] = vid

    # Bouw verrijkings-index op basis van naam-matching
    enrichment_index = {}
    if has_enrichment:
        for d in datajs_decisions:
            naam = (d.get("naam") or "").lower().strip()
            if naam:
                enrichment_index[naam] = d

    # Besluiten in DB — altijd via PDF-extractie
    total = 0
    enriched = 0
    for url in pdf_urls:
        info = pdf_data.get(url, {})
        if not info.get("text"):
            continue
        datum_str = url_to_datum(url)
        vid = vergadering_ids[url]
        decisions = extract_decisions_from_pdf(
            info["text"], url, datum_str, year
        )
        for d in decisions:
            # Verrijk met data.js-metadata als beschikbaar
            if enrichment_index:
                naam_lower = (d.get("naam") or "").lower().strip()
                # Probeer exacte match of gedeeltelijke match
                match = enrichment_index.get(naam_lower)
                if not match:
                    for key, val in enrichment_index.items():
                        if key in naam_lower or naam_lower in key:
                            match = val
                            break
                if match:
                    for field in ["domein", "portefeuille", "onderwerp_begroting"]:
                        if match.get(field) and not d.get(field):
                            d[field] = match[field]
                    enriched += 1

            total += 1
            insert_besluit(conn, vid, d)

    downloaded = sum(1 for v in pdf_data.values() if v.get("text"))
    total_pages = sum(v.get("pages", 0) for v in pdf_data.values())

    print(f"\n   Resultaat {year}:")
    print(f"   PDF's:      {downloaded}/{len(pdf_urls)}")
    print(f"   Pagina's:   {total_pages}")
    print(f"   Besluiten:  {total}")
    if has_enrichment:
        print(f"   Verrijkt:   {enriched}/{total} ({enriched/max(total,1)*100:.0f}%)")

    return {"pdfs": downloaded, "pages": total_pages, "besluiten": total, "enriched": enriched}


# ─── Hoofdprogramma ───────────────────────────────────────────────────────────

def main():
    YEARS = [2022, 2023, 2024, 2025]

    print("=" * 60)
    print("Beleidsbibliotheek — Collegebesluiten downloader")
    print(f"  Jaren: {', '.join(str(y) for y in YEARS)}")
    print("=" * 60)

    # Data laden uit data.js (voor 2025)
    print("\n📂 Data laden uit data.js …")
    all_decisions = load_decisions_from_datajs()

    college_by_year = {}
    for year in YEARS:
        college_by_year[year] = filter_college_year(all_decisions, year)
        n = len(college_by_year[year])
        print(f"   {year}: {n} besluiten in data.js")

    # Database aanmaken
    conn = create_database()
    print(f"\n🗄️  Database: {DB_PATH.name}")

    # Verwijder bestaande portefeuille-kopjes
    n_cleaned = cleanup_portefeuille_headers(conn)
    if n_cleaned:
        print(f"   🧹 {n_cleaned} portefeuille-kopjes uit DB verwijderd")

    # Verwerk elk jaar
    all_stats = {}
    for year in YEARS:
        data_js = college_by_year[year]
        all_stats[year] = process_year(
            conn, year,
            datajs_decisions=data_js if data_js else None
        )

    conn.close()

    # Samenvatting
    db_size = DB_PATH.stat().st_size / 1024
    total_pdfs = sum(s["pdfs"] for s in all_stats.values())
    total_pages = sum(s["pages"] for s in all_stats.values())
    total_besluiten = sum(s["besluiten"] for s in all_stats.values())

    print(f"\n{'=' * 60}")
    print(f"✅ Klaar!")
    print(f"   PDF's gedownload:     {total_pdfs}")
    print(f"   Totaal pagina's:      {total_pages}")
    print(f"   Besluiten opgeslagen: {total_besluiten}")
    for year in YEARS:
        prefix = "├─" if year != YEARS[-1] else "└─"
        print(f"     {prefix} {year}: {all_stats[year]['besluiten']}")
    print(f"   Database:             {DB_PATH.name} ({db_size:.0f} KB)")
    print(f"\nVoorbeeld queries:")
    print(f"   sqlite3 {DB_PATH.name}")
    print(f'   SELECT jaar, COUNT(*) FROM besluiten GROUP BY jaar;')
    print(f'   SELECT naam, datum FROM besluiten WHERE jaar = 2024 LIMIT 10;')
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
