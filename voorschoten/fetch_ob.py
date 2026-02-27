"""Fetch Officiële Bekendmakingen for Voorschoten — all years, no type filter"""
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json

SRU_BASE = 'https://repository.overheid.nl/sru'

def fetch_all(gemeente):
    query = f'dt.creator="{gemeente}"'
    start = 1
    records = []
    total = None

    while True:
        params = urllib.parse.urlencode({
            'operation': 'searchRetrieve',
            'version': '2.0',
            'query': query,
            'startRecord': start,
            'maximumRecords': 100,
        })
        url = f'{SRU_BASE}?{params}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            xml_data = resp.read().decode('utf-8')

        root = ET.fromstring(xml_data)
        ns = {'sru': 'http://docs.oasis-open.org/ns/search-ws/sruResponse'}

        if total is None:
            total_el = root.find('.//sru:numberOfRecords', ns)
            total = int(total_el.text) if total_el is not None and total_el.text else 0
            print(f'Total records in API: {total}')

        recs = root.findall('.//sru:record', ns)
        if not recs:
            break

        for rec in recs:
            title = identifier = doc_type = date_mod = ''
            for child in rec.iter():
                tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                txt = (child.text or '').strip()
                if tag == 'title' and txt and not title:
                    title = txt
                elif tag == 'identifier' and txt:
                    if 'officielebekendmakingen' in txt or txt.startswith('gmb-'):
                        identifier = txt
                elif tag == 'type' and txt:
                    doc_type = txt
                elif tag == 'modified' and txt:
                    date_mod = txt

            if title and identifier and 'gmb-' in identifier:
                year = ''
                if date_mod and len(date_mod) >= 4:
                    year = date_mod[:4]
                elif 'gmb-' in identifier:
                    parts = identifier.split('-')
                    if len(parts) >= 2:
                        year = parts[1][:4]

                records.append({
                    'title': title,
                    'identifier': identifier,
                    'date': date_mod,
                    'type': doc_type,
                    'year': year,
                })

        start += len(recs)
        print(f'  Progress: {start-1}/{total} ({len(records)} gmb records)', flush=True)
        if start > total:
            break

    return records

print('Fetching all Voorschoten records...', flush=True)
all_records = fetch_all('Voorschoten')
print(f'\nTotal GMB records: {len(all_records)}')

by_year = {}
for r in all_records:
    y = r.get('year', 'unknown')
    by_year.setdefault(y, []).append(r)

for y in sorted(by_year.keys()):
    print(f'  {y}: {len(by_year[y])} records')

# Filter to 2022-2025 and exclude BRP-uitschrijvingen
filtered = [r for r in all_records
            if r.get('year', '') in ('2022','2023','2024','2025')
            and 'uitschrijving basisregistratie' not in r['type'].lower()
            and 'uitschrijving basisregistratie' not in r['title'].lower()]

print(f'\nFiltered (2022-2025, excl BRP): {len(filtered)} records')

with open('voorschoten_ob_raw.json', 'w') as f:
    json.dump(filtered, f, ensure_ascii=False, indent=2)
print('Saved: voorschoten_ob_raw.json')
