#!/usr/bin/env python3
"""
Downloadt alle B&W-besluitenlijst-PDF's van wassenaar.nl en parst ze naar JSON.
Extraheert individuele besluiten met metadata per portefeuille.
"""

import json
import os
import re
import time
import requests
import pdfplumber
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'pdfs')
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

PDF_URLS_2025 = [
    ("2025-01-07", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_7_januari_2025.pdf"),
    ("2025-01-14", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_14_januari_2025.pdf"),
    ("2025-01-21", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_21_januari_2025.pdf"),
    ("2025-01-28", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_28_januari_2025.pdf"),
    ("2025-02-04", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_4_februari_2025.pdf"),
    ("2025-02-11", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_11_februari_2025.pdf"),
    ("2025-02-18", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_18_februari_2025.pdf"),
    ("2025-03-04", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_4_maart_2025.pdf"),
    ("2025-03-11", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_11_maart_2025.pdf"),
    ("2025-03-18", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_18_maart_2025_0.pdf"),
    ("2025-03-25", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_25_maart_2025.pdf"),
    ("2025-04-01", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_1_april_2025.pdf"),
    ("2025-04-08", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_8_april_2025.pdf"),
    ("2025-04-15", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_15_april_2025.pdf"),
    ("2025-04-29", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_29_april_2025.pdf"),
    ("2025-05-06", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_6_mei_2025.pdf"),
    ("2025-05-13", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_13_mei_2025.pdf"),
    ("2025-05-20", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_20_mei_2025.pdf"),
    ("2025-05-27", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_27_mei_2025.pdf"),
    ("2025-06-03", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_3_juni_2025.pdf"),
    ("2025-06-10", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_10_juni_2025.pdf"),
    ("2025-06-16", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_16_juni_2025.pdf"),
    ("2025-06-24", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_24_juni_2025.pdf"),
    ("2025-07-01", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_1_juli_2025.pdf"),
    ("2025-07-03", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_3_juli_2025.pdf"),
    ("2025-07-08", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_8_juli_2025.pdf"),
    ("2025-07-15", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_15_juli_2025.pdf"),
    ("2025-08-19", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_19_augustus_2025.pdf"),
    ("2025-08-26", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_26_augustus_2025.pdf"),
    ("2025-09-02", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_2_september_2025.pdf"),
    ("2025-09-09", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_9_september_2025.pdf"),
    ("2025-09-16", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_16_september_2025.pdf"),
    ("2025-09-17", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_17_september_2025.pdf"),
    ("2025-09-23", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_23_september_2025.pdf"),
    ("2025-09-30", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_30_september_2025.pdf"),
    ("2025-10-07", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_7_oktober_2025.pdf"),
    ("2025-10-14", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_14_oktober_2025.pdf"),
    ("2025-10-28", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_28_oktober_2025.pdf"),
    ("2025-11-03", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_3_november_2025.pdf"),
    ("2025-11-11", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_11_november_2025.pdf"),
    ("2025-11-18", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_18_november_2025.pdf"),
    ("2025-11-25", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_25_november_2025.pdf"),
    ("2025-12-02", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_2_december_2025.pdf"),
    ("2025-12-09", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_9_december_2025.pdf"),
    ("2025-12-16", "https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_16_december_2025.pdf"),
]

PORTEFEUILLE_MAP = {
    '5.a': 'Financiën, Economie en Sport',
    '5.b': 'Sociaal Domein, Wonen en Onderwijs',
    '5.c': 'Ruimte, Duurzaamheid en Mobiliteit',
    '5.d': 'Cultuur en Welzijn',
    '5.e': 'Portefeuille Burgemeester',
}

PORTEFEUILLE_DOMEIN_MAP = {
    'Financiën, Economie en Sport': 'Financiën',
    'Sociaal Domein, Wonen en Onderwijs': 'Sociaal Domein',
    'Ruimte, Duurzaamheid en Mobiliteit': 'Fysiek Domein',
    'Cultuur en Welzijn': 'Sociaal Domein',
    'Portefeuille Burgemeester': 'Openbare orde en Veiligheid',
}

SKIP_ITEMS = {
    'opening', 'mededelingen', 'vooruitblik weekagenda', 'schorsing',
    'raad', 'vragen uit de raad', 'langetermijnagenda',
    'regionale samenwerking', 'uitnodigingenlijst', 'hamerstukken',
    'organisatieontwikkeling', 'sluiting', 'vooruitblik',
}


def download_pdf(url, date_str):
    filename = f"bw_{date_str}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    if os.path.exists(filepath):
        return filepath
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(resp.content)
        return filepath
    except Exception as e:
        print(f"  FOUT bij downloaden {url}: {e}")
        return None


def extract_text_from_pdf(filepath):
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"  FOUT bij lezen PDF {filepath}: {e}")
    return text


def parse_besluitenlijst(text, vergader_datum, pdf_url):
    """Parst de volledige tekst van een besluitenlijst en extraheert individuele besluiten."""
    besluiten = []

    current_portefeuille = None
    current_title = None
    current_besluit_lines = []
    in_besluit = False
    agendapunt = None

    lines = text.split('\n')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip page headers/footers
        if re.match(r'^Pagina \d+ van \d+$', stripped):
            continue
        if 'Besluitenlijst Openbaar B&W-vergadering' in stripped:
            continue

        # Detect portfolio headers (5.a, 5.b, etc.)
        port_match = re.match(r'^(5\.[a-e])\s+(.*)', stripped)
        if port_match:
            code = port_match.group(1)
            if code in PORTEFEUILLE_MAP:
                current_portefeuille = PORTEFEUILLE_MAP[code]
            continue

        # Also detect standalone portfolio references
        for code, name in PORTEFEUILLE_MAP.items():
            if stripped.startswith(code) and len(stripped) <= len(code) + 2:
                current_portefeuille = name
                break

        # Detect numbered agenda items (5.1, 5.a.1, 5.b.2, 10.b.1, etc.)
        item_match = re.match(r'^(\d+(?:\.[a-e])?\.?\d*)\s+(.*)', stripped)
        if item_match and not stripped.startswith('Besluit'):
            num = item_match.group(1)
            title_part = item_match.group(2).strip()

            # Skip procedural items
            if any(skip in title_part.lower() for skip in SKIP_ITEMS):
                continue
            if re.match(r'^B&W-Besluitenlijst', title_part):
                continue

            # Save previous besluit if exists
            if current_title and current_besluit_lines:
                besluit_text = ' '.join(current_besluit_lines).strip()
                if besluit_text and not besluit_text.startswith('B&W-Besluitenlijst'):
                    besluiten.append(_make_besluit(
                        vergader_datum, current_title, besluit_text,
                        current_portefeuille, agendapunt, pdf_url
                    ))

            agendapunt = num
            current_title = title_part
            current_besluit_lines = []
            in_besluit = False
            continue

        # Detect "Besluit:" marker
        if stripped == 'Besluit:' or stripped.startswith('Besluit:'):
            in_besluit = True
            rest = stripped[len('Besluit:'):].strip()
            if rest:
                current_besluit_lines.append(rest)
            continue

        # Accumulate besluit text
        if in_besluit and current_title:
            # Stop at next agenda item or section
            if re.match(r'^\d+\s+\w', stripped) and not stripped[0].isspace():
                next_item = re.match(r'^(\d+)\s+(.*)', stripped)
                if next_item:
                    num = next_item.group(1)
                    if num.isdigit() and int(num) <= 15:
                        # Save current and reset
                        if current_besluit_lines:
                            besluit_text = ' '.join(current_besluit_lines).strip()
                            if besluit_text:
                                besluiten.append(_make_besluit(
                                    vergader_datum, current_title, besluit_text,
                                    current_portefeuille, agendapunt, pdf_url
                                ))
                        current_title = None
                        current_besluit_lines = []
                        in_besluit = False
                        continue
            current_besluit_lines.append(stripped)

    # Don't forget the last one
    if current_title and current_besluit_lines:
        besluit_text = ' '.join(current_besluit_lines).strip()
        if besluit_text:
            besluiten.append(_make_besluit(
                vergader_datum, current_title, besluit_text,
                current_portefeuille, agendapunt, pdf_url
            ))

    return besluiten


def _make_besluit(datum, titel, besluit_text, portefeuille, agendapunt, pdf_url):
    # Clean up common artifacts
    besluit_text = re.sub(r'\s+', ' ', besluit_text).strip()
    besluit_text = re.sub(r'Vastgesteld in de vergadering gehouden op.*$', '', besluit_text).strip()
    besluit_text = re.sub(r'Het college van burgemeester en wethouders.*$', '', besluit_text).strip()
    besluit_text = re.sub(r'Deze besluitenlijst is digitaal vastgesteld.*$', '', besluit_text).strip()
    besluit_text = re.sub(r'Pagina \d+ van \d+.*$', '', besluit_text).strip()

    # Probeer alleen de eerste "besluit"-blok te houden (vaak zijn meerdere besluiten aan elkaar geplakt)
    # Splits op " Besluit:" of op volgnummers zoals " 1. " " 2. " die een volgend besluit inluiden
    first_part = besluit_text
    for sep in [r'\s+Besluit:\s*', r'\s+\d+\.\s+[A-Z][a-z]', r'\.\s+Overzicht is akkoord', r'\.\s+Uitnodigingenlijst is akkoord', r'\.\s+LTA-overzicht']:
        parts = re.split(sep, besluit_text, maxsplit=1)
        if len(parts) > 1 and len(parts[0].strip()) > 30:
            first_part = parts[0].strip()
            # Zorg dat we eindigen op een zin
            if not first_part.endswith('.'):
                last_dot = first_part.rfind('.')
                if last_dot > 20:
                    first_part = first_part[:last_dot + 1]
            break
    besluit_text = first_part if len(first_part) > 20 else besluit_text

    domein = PORTEFEUILLE_DOMEIN_MAP.get(portefeuille) if portefeuille else None

    return {
        'datum': datum,
        'naam': titel,
        'besluit': besluit_text if besluit_text else None,
        'portefeuille': portefeuille,
        'domein': domein,
        'agendapunt': agendapunt,
        'bron': 'college',
        'type_besluit': 'Collegebesluit (B&W)',
        'pdf_url': pdf_url,
        'jaar': 2025,
    }


def main():
    all_besluiten = []
    
    for datum, url in PDF_URLS_2025:
        print(f"Verwerken: {datum}...")
        filepath = download_pdf(url, datum)
        if not filepath:
            continue
        
        text = extract_text_from_pdf(filepath)
        if not text:
            print(f"  Geen tekst geëxtraheerd")
            continue
        
        besluiten = parse_besluitenlijst(text, datum, url)
        print(f"  {len(besluiten)} besluiten gevonden")
        all_besluiten.extend(besluiten)
        time.sleep(0.5)

    # Filter out empty/procedural decisions
    filtered = [b for b in all_besluiten if b['besluit'] and len(b['besluit']) > 20]
    
    output_path = os.path.join(OUTPUT_DIR, 'collegebesluiten_2025.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)
    
    print(f"\nTotaal: {len(filtered)} collegebesluiten opgeslagen in {output_path}")
    
    # Summary per portefeuille
    from collections import Counter
    port_counts = Counter(b.get('portefeuille', 'Onbekend') for b in filtered)
    print("\nPer portefeuille:")
    for port, count in port_counts.most_common():
        print(f"  {port or 'Niet geclassificeerd'}: {count}")


if __name__ == '__main__':
    main()
