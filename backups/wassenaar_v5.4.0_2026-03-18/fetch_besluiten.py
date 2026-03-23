#!/usr/bin/env python3
"""
Haal alle Gemeenteblad-publicaties op voor Wassenaar
via de SRU API van repository.overheid.nl
"""

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import sys
import time

API = "https://repository.overheid.nl/sru"
YEARS = [2022, 2023, 2024, 2025]
PAGE_SIZE = 1000

NS = {
    'sru': 'http://docs.oasis-open.org/ns/search-ws/sruResponse',
    'gzd': 'http://standaarden.overheid.nl/sru',
    'dcterms': 'http://purl.org/dc/terms/',
    'overheidwetgeving': 'http://standaarden.overheid.nl/wetgeving/',
    'c': 'http://standaarden.overheid.nl/collectie/',
    'overheid': 'http://standaarden.overheid.nl/owms/terms/'
}

SKIP_TYPES = {
    'uitschrijving basisregistratie personen',
}

SUBJECT_TO_DOMEIN = {
    'Ruimte en infrastructuur': 'Ruimte, Duurzaamheid & Mobiliteit',
    'Verkeer': 'Ruimte, Duurzaamheid & Mobiliteit',
    'Natuur en milieu': 'Ruimte, Duurzaamheid & Mobiliteit',
    'Bestuur': 'Bestuur & Veiligheid',
    'Openbare orde en veiligheid': 'Bestuur & Veiligheid',
    'Recht': 'Bestuur & Veiligheid',
    'Financiën': 'Financiën, Economie & Sport',
    'Economie': 'Financiën, Economie & Sport',
    'Cultuur en recreatie': 'Cultuur & Welzijn',
    'Onderwijs en wetenschap': 'Sociaal Domein, Wonen & Onderwijs',
    'Zorg en gezondheid': 'Sociaal Domein, Wonen & Onderwijs',
    'Sociale zekerheid': 'Sociaal Domein, Wonen & Onderwijs',
    'Migratie en integratie': 'Bestuur & Veiligheid',
    'Werk': 'Sociaal Domein, Wonen & Onderwijs',
    'Internationaal': 'Bestuur & Veiligheid',
    'Landbouw': 'Ruimte, Duurzaamheid & Mobiliteit',
}

TYPE_LABELS = {
    'omgevingsvergunning': 'Omgevingsvergunning',
    'andere vergunning': 'Vergunning',
    'evenementenvergunning': 'Evenementenvergunning',
    'verkeersbesluit of -mededeling': 'Verkeersbesluit',
    'andere melding': 'Melding',
    'algemeen verbindend voorschrift (verordening)': 'Verordening',
    'ander besluit van algemene strekking': 'Besluit',
    'omgevingsmelding': 'Omgevingsmelding',
    'andere voorlichtingsinformatie': 'Voorlichting',
    'delegatie- of mandaatbesluit': 'Mandaatbesluit',
    'beleidsregel': 'Beleidsregel',
    'ruimtelijk plan of omgevingsdocument': 'Ruimtelijk plan',
    'andere beschikking': 'Beschikking',
    'gemeenschappelijke regeling': 'Gemeenschappelijke regeling',
    'verkiezingen': 'Verkiezingen',
    'participatie': 'Participatie',
    'overige overheidsinformatie': 'Overheidsinformatie',
    'exploitatievergunning': 'Exploitatievergunning',
}


def map_subject(subject_text):
    if not subject_text:
        return 'Bestuur & Veiligheid'
    base = subject_text.split('|')[0].strip()
    return SUBJECT_TO_DOMEIN.get(base, 'Bestuur & Veiligheid')


def fetch_year(year):
    query = f"(c.product-area==officielepublicaties AND dt.creator==Wassenaar AND w.publicatienaam==Gemeenteblad AND w.jaargang=={year})"
    records = []
    start = 1
    total = None

    while True:
        params = urllib.parse.urlencode({
            'query': query,
            'startRecord': start,
            'maximumRecords': PAGE_SIZE
        })
        url = f"{API}?{params}"
        print(f"  [{year}] Ophalen records {start}–{start + PAGE_SIZE - 1}...", file=sys.stderr)
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()

        root = ET.fromstring(content)

        if total is None:
            total_el = root.find('.//sru:numberOfRecords', NS)
            total = int(total_el.text) if total_el is not None else 0
            print(f"  [{year}] Totaal beschikbaar: {total}", file=sys.stderr)

        recs = root.findall('.//sru:record', NS)
        if not recs:
            break

        for rec in recs:
            parsed = parse_record(rec)
            if parsed:
                records.append(parsed)

        start += PAGE_SIZE
        if start > total:
            break
        time.sleep(0.5)

    return records


def fetch_all():
    all_records = []
    for year in YEARS:
        print(f"\n=== Jaar {year} ===", file=sys.stderr)
        year_records = fetch_year(year)
        print(f"  [{year}] Opgehaald: {len(year_records)} (na filtering)", file=sys.stderr)
        all_records.extend(year_records)
    return all_records


def parse_record(rec):
    def text(xpath):
        el = rec.find(xpath, NS)
        return el.text.strip() if el is not None and el.text else None

    dtype = text('.//dcterms:type[@scheme="OVERHEIDop.Rubriek"]')
    if dtype and dtype.lower() in SKIP_TYPES:
        return None

    identifier = text('.//dcterms:identifier')
    title = text('.//dcterms:title')
    date = text('.//dcterms:modified') or text('.//dcterms:available')
    abstract = text('.//dcterms:abstract')
    subject = text('.//dcterms:subject')
    url = text('.//gzd:preferredUrl')

    pdf_el = rec.find('.//gzd:itemUrl[@manifestation="pdf"]', NS)
    pdf_url = pdf_el.text.strip() if pdf_el is not None and pdf_el.text else None

    domein = map_subject(subject)
    type_label = TYPE_LABELS.get(dtype.lower(), dtype) if dtype else 'Bekendmaking'

    return {
        'naam': title or 'Zonder titel',
        'besluit': abstract or '',
        'datum': date or '',
        'bron': 'college',
        'type_besluit': type_label,
        'domein': domein,
        'portefeuille': '',
        'link': url or '',
        'pdf_url': pdf_url or '',
        'bron_systeem': 'Officiële Bekendmakingen',
        'identifier': identifier or '',
    }


def main():
    print("Ophalen besluiten Wassenaar...", file=sys.stderr)
    records = fetch_all()
    print(f"\nTotaal opgehaald: {len(records)} besluiten (na filtering)", file=sys.stderr)

    from collections import Counter
    domein_counts = Counter(r['domein'] for r in records)
    print("\nPer domein:", file=sys.stderr)
    for d, c in domein_counts.most_common():
        print(f"  {c:4d}  {d}", file=sys.stderr)

    records.sort(key=lambda r: r['datum'], reverse=True)
    print(json.dumps(records, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
