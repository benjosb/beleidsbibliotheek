#!/usr/bin/env python3
"""
Haalt aanvullende metadata op van officielebekendmakingen.nl (SRU API)
voor alle Wassenaar-publicaties, en slaat deze op als ob_metadata.json.

Bron: KOOP SRU webservice
Rate limit: max 1 request/sec (conform workspace-regels)

Gebruik:
    python3 scripts/enrich_ob_metadata.py
"""

import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WASSENAAR_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(WASSENAAR_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "ob_metadata.json")

SRU_BASE = "https://zoek.officielebekendmakingen.nl/sru/Search"
BATCH_SIZE = 100

NS = {
    "srw": "http://www.loc.gov/zing/srw/",
    "gzd": "http://standaarden.overheid.nl/sru",
    "op": "http://standaarden.overheid.nl/product/terms/",
    "dc": "http://purl.org/dc/terms/",
    "ov": "http://standaarden.overheid.nl/owms/terms/",
    "vb": "http://standaarden.overheid.nl/vb/terms",
}


def fetch_page(start_record: int) -> ET.Element:
    """Haal één pagina op van de SRU API."""
    query = "creator=Wassenaar"
    url = (
        f"{SRU_BASE}?version=2.0&operation=searchRetrieve"
        f"&query={urllib.parse.quote(query)}"
        f"&maximumRecords={BATCH_SIZE}&startRecord={start_record}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "BeleidsBibliotheek/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return ET.fromstring(resp.read())


def extract_text(el, xpath, ns=NS):
    """Haal tekst op uit een XML-element via XPath, of ''."""
    found = el.find(xpath, ns)
    return (found.text or "").strip() if found is not None else ""


def parse_record(record_el) -> dict:
    """Parse één SRU record naar een plat dict."""
    rd = record_el.find("srw:recordData/gzd:gzd", NS)
    if rd is None:
        return None

    kern = rd.find("gzd:originalData/op:meta/op:owmskern", NS)
    mantel = rd.find("gzd:originalData/op:meta/op:owmsmantel", NS)
    opmeta = rd.find("gzd:originalData/op:meta/op:opmeta", NS)

    if kern is None:
        return None

    identifier = extract_text(kern, "dc:identifier")
    if not identifier:
        return None

    result = {
        "identifier": identifier,
        "title": extract_text(kern, "dc:title"),
        "type": extract_text(kern, "dc:type"),
        "creator": extract_text(kern, "dc:creator"),
        "modified": extract_text(kern, "dc:modified"),
    }

    if mantel is not None:
        result["subject"] = extract_text(mantel, "dc:subject")
        result["source"] = extract_text(mantel, "dc:source")
        result["alternative"] = extract_text(mantel, "dc:alternative")

    if opmeta is not None:
        result["publicationname"] = extract_text(opmeta, "op:publicationname")
        result["typeverkeersbesluit"] = extract_text(opmeta, "vb:typeverkeersbesluit")

    return result


import urllib.parse


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Laad eventueel bestaande resultaten (voor herstart na onderbreking)
    existing = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for item in json.load(f):
                existing[item["identifier"]] = item
        print(f"  Bestaand bestand geladen: {len(existing)} records")

    all_records = dict(existing)
    start = 1
    total = None

    print(f"=== OB Metadata ophalen voor Wassenaar ===\n")

    while True:
        try:
            root = fetch_page(start)
        except Exception as e:
            print(f"  FOUT bij startRecord={start}: {e}")
            print(f"  Wacht 5s en probeer opnieuw...")
            time.sleep(5)
            try:
                root = fetch_page(start)
            except Exception as e2:
                print(f"  Opnieuw gefaald: {e2}. Sla batch over.")
                start += BATCH_SIZE
                if total and start > total:
                    break
                continue

        if total is None:
            nr_el = root.find("srw:numberOfRecords", NS)
            total = int(nr_el.text) if nr_el is not None else 0
            print(f"  Totaal records in SRU: {total}")

        records = root.findall("srw:records/srw:record", NS)
        if not records:
            break

        for rec in records:
            parsed = parse_record(rec)
            if parsed:
                all_records[parsed["identifier"]] = parsed

        fetched = start + len(records) - 1
        pct = (fetched / total * 100) if total else 0
        print(f"  {fetched:,} / {total:,} ({pct:.0f}%) — batch {len(records)} records")

        # Tussentijds opslaan elke 1000 records
        if fetched % 1000 < BATCH_SIZE:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(list(all_records.values()), f, ensure_ascii=False, indent=1)

        next_pos = root.find("srw:nextRecordPosition", NS)
        if next_pos is None or not next_pos.text:
            break
        start = int(next_pos.text)

        time.sleep(1)  # rate limit

    # Eindresultaat opslaan
    result_list = list(all_records.values())
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result_list, f, ensure_ascii=False, indent=1)

    # Statistieken
    gmb_count = sum(1 for r in result_list if r["identifier"].startswith("gmb-"))
    subjects = {}
    for r in result_list:
        s = r.get("subject", "")
        if s:
            subjects[s] = subjects.get(s, 0) + 1

    print(f"\n=== Klaar ===")
    print(f"  Totaal opgeslagen: {len(result_list)} records")
    print(f"  Waarvan gmb-*: {gmb_count}")
    print(f"  Unieke subjects: {len(subjects)}")
    print(f"  Top-10 subjects:")
    for subj, cnt in sorted(subjects.items(), key=lambda x: -x[1])[:10]:
        print(f"    {cnt:>5}  {subj}")
    print(f"\n  Opgeslagen in: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
