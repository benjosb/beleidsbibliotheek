#!/usr/bin/env python3
"""
Converteert JSON data bestanden naar JavaScript variabelen die inline geladen kunnen worden.
Dit maakt de applicatie volledig statisch - geen server nodig!
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def json_to_js_var(data, var_name):
    """Converteert JSON data naar een JavaScript variabele string."""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return f"const {var_name} = {json_str};"

def main():
    print("Converteer JSON naar JavaScript variabelen...")
    
    # Load data
    raad2025 = load_json('raadsbesluiten_2025.json')
    college2025 = load_json('collegebesluiten_2025.json')
    thema_boom = load_json('thema_boom.json')
    
    # Combine decisions
    all_decisions = raad2025 + college2025
    
    # Generate JS file
    js_content = f"""// Beleidsbibliotheek Wassenaar - Data
// Automatisch gegenereerd - niet handmatig bewerken!

{json_to_js_var(all_decisions, 'ALL_DECISIONS_DATA')}

{json_to_js_var(thema_boom, 'THEMA_BOOM_DATA')}

// Export voor gebruik in app.js
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ ALL_DECISIONS_DATA, THEMA_BOOM_DATA }};
}}
"""
    
    output_path = os.path.join(OUTPUT_DIR, 'data.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✓ data.js aangemaakt met {len(all_decisions)} besluiten en {len(thema_boom)} thema's")
    print(f"✓ Bestand: {output_path}")

if __name__ == '__main__':
    main()
