#!/usr/bin/env python3
"""
Update de thema_boom.json met collegebesluiten erbij.
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def build_combined_thema_boom():
    """Bouwt themaboom met zowel raads- als collegebesluiten."""
    raad = load_json('raadsbesluiten_verrijkt.json')
    college = load_json('collegebesluiten_2025.json')
    
    all_records = raad + college
    
    tree = {}
    for r in all_records:
        domein = r.get('domein') or 'Niet geclassificeerd'
        onderwerp = r.get('onderwerp_begroting') or r.get('portefeuille') or 'Overig'
        bron = r.get('bron', 'onbekend')
        
        if domein not in tree:
            tree[domein] = {}
        if onderwerp not in tree[domein]:
            tree[domein][onderwerp] = {'raad': 0, 'college': 0, 'totaal': 0}
        
        tree[domein][onderwerp][bron] += 1
        tree[domein][onderwerp]['totaal'] += 1
    
    result = []
    for domein in sorted(tree.keys()):
        children = []
        for onderwerp in sorted(tree[domein].keys()):
            stats = tree[domein][onderwerp]
            children.append({
                'naam': onderwerp,
                'aantal': stats['totaal'],
                'raad': stats['raad'],
                'college': stats['college']
            })
        result.append({
            'naam': domein,
            'kinderen': children,
            'aantal': sum(c['aantal'] for c in children)
        })
    return result

if __name__ == '__main__':
    boom = build_combined_thema_boom()
    save_json(boom, 'thema_boom.json')
    print(f"Themaboom bijgewerkt: {len(boom)} domeinen")
