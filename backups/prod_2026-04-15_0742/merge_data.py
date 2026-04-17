#!/usr/bin/env python3
"""
Merge iBabs data with Officiële Bekendmakingen data for Wassenaar.
Produces updated data.js with both sources.
"""

import json
import re
import os
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))


def load_ibabs_data():
    with open(os.path.join(BASE, 'data.js'), 'r') as f:
        content = f.read()

    start = content.find('const ALL_DECISIONS_DATA')
    arr_start = content.find('[', start)
    depth = 0
    for i in range(arr_start, len(content)):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
        if depth == 0:
            break
    decisions = json.loads(content[arr_start:i+1])

    tree_start = content.find('const THEMA_BOOM_DATA')
    tree_arr_start = content.find('[', tree_start)
    depth = 0
    for i in range(tree_arr_start, len(content)):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
        if depth == 0:
            break
    tree = json.loads(content[tree_arr_start:i+1])

    for d in decisions:
        if 'bron_systeem' not in d:
            d['bron_systeem'] = 'iBabs'

    return decisions, tree


def load_ob_data():
    with open(os.path.join(BASE, 'besluiten_ob.json'), 'r') as f:
        return json.loads(f.read())


def normalize(text):
    return re.sub(r'[^a-z0-9]', '', text.lower()) if text else ''


def is_duplicate(ob_record, ibabs_set):
    """Check if an OB record likely duplicates an iBabs record."""
    key = normalize(ob_record['naam'])[:60] + (ob_record['datum'] or '')[:10]
    return key in ibabs_set


def build_dedup_set(ibabs_data):
    s = set()
    for d in ibabs_data:
        key = normalize(d.get('naam', ''))[:60] + (d.get('datum', '') or '')[:10]
        s.add(key)
    return s


def update_tree(tree, all_decisions):
    domein_counts = Counter(d.get('domein', 'Niet geclassificeerd') for d in all_decisions)

    for node in tree:
        naam = node['naam']
        node['aantal'] = domein_counts.get(naam, 0)

        if 'kinderen' in node:
            node_decisions = [d for d in all_decisions if d.get('domein') == naam]
            raad_count = sum(1 for d in node_decisions if d.get('bron') == 'raad')
            college_count = sum(1 for d in node_decisions if d.get('bron') != 'raad')

            for kind in node['kinderen']:
                if kind['naam'] == 'Overig':
                    specific_count = sum(
                        k['aantal'] for k in node['kinderen'] if k['naam'] != 'Overig'
                    )
                    kind['aantal'] = max(0, node['aantal'] - specific_count)
                    kind['raad'] = kind.get('raad', 0)
                    kind['college'] = max(0, kind['aantal'] - kind['raad'])

    return tree


def main():
    print("Loading iBabs data...")
    ibabs_data, tree = load_ibabs_data()
    print(f"  iBabs: {len(ibabs_data)} records")

    print("Loading Officiële Bekendmakingen data...")
    ob_data = load_ob_data()
    print(f"  OB: {len(ob_data)} records")

    print("Deduplicating...")
    dedup_set = build_dedup_set(ibabs_data)
    new_records = []
    dupes = 0
    for rec in ob_data:
        if is_duplicate(rec, dedup_set):
            dupes += 1
        else:
            new_records.append(rec)

    print(f"  Duplicaten overgeslagen: {dupes}")
    print(f"  Nieuwe records: {len(new_records)}")

    all_decisions = ibabs_data + new_records
    all_decisions.sort(key=lambda d: d.get('datum', ''), reverse=True)
    print(f"  Totaal: {len(all_decisions)}")

    domein_counts = Counter(d.get('domein', '?') for d in all_decisions)
    print("\n  Per domein:")
    for d, c in domein_counts.most_common():
        print(f"    {c:5d}  {d}")

    bron_counts = Counter(d.get('bron_systeem', '?') for d in all_decisions)
    print("\n  Per bronsysteem:")
    for b, c in bron_counts.most_common():
        print(f"    {c:5d}  {b}")

    tree = update_tree(tree, all_decisions)

    out_path = os.path.join(BASE, 'data.js')
    decisions_json = json.dumps(all_decisions, ensure_ascii=False, indent=2)
    tree_json = json.dumps(tree, ensure_ascii=False, indent=2)

    js = f"""// Besluit-Wijzer Wassenaar — data.js
// Versie 5.2.0 — iBabs + Officiële Bekendmakingen 2022–2025
// iBabs: {len(ibabs_data)} records, OB: {len(new_records)} records, Totaal: {len(all_decisions)}
// Gegenereerd door merge_data.py

const ALL_DECISIONS_DATA = {decisions_json};

const THEMA_BOOM_DATA = {tree_json};
"""

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"\ndata.js geschreven: {size_mb:.1f} MB")


if __name__ == '__main__':
    main()
