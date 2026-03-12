#!/usr/bin/env python3
"""
Taakveld-clustering — Herclassificeert besluiten naar Iv3-taakvelden (48 taakvelden, 9 hoofdstukken).

Vervangt de portefeuille-gebaseerde domeinclustering door de landelijke Iv3-structuur.
Bron: Findo.nl Vraagbaak Iv3, Iv3-informatievoorschrift Gemeenten 2025.

Gebruik:
    python3 gemeente-x/scripts/taakveld_clustering.py              # output naar wassenaar
    python3 gemeente-x/scripts/taakveld_clustering.py --target gemeente-x  # output naar gemeente-x

Werkt op:
  - wassenaar/data.js (input) → classificeert, output naar --target
  - wassenaar/db_collegebesluiten.db → voegt kolom taakveld toe (alleen bij target wassenaar)
"""

import argparse
import json
import re
import sqlite3
from pathlib import Path

# Paden (script draait vanuit projectroot)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
GEMEENTE_X = PROJECT_ROOT / "gemeente-x"
WASSENAAR = PROJECT_ROOT / "wassenaar"
DB_PATH = WASSENAAR / "db_collegebesluiten.db"
TAAKVELDEN_JSON = GEMEENTE_X / "taakvelden_iv3.json"
PORTEFEUILLE_MAP_JSON = GEMEENTE_X / "portefeuille_naar_taakveld.json"

# Input altijd wassenaar (daar staan de besluiten)
INPUT_DATA_JS = WASSENAAR / "data.js"

# ─── Iv3-taakveld mapping (keyword regex → taakveld_code) ───────────────────
# Prioriteit: override > onderwerp > portefeuille/domein > trefwoord > fallback
# Fallback: 0.1 Bestuur

ONDERWERP_MAP = {
    "Economie": "3.1",
    "Afval": "7.3",
    "Vastgoed": "0.3",
    "Centrum Wassenaar": "3.4",
    "Sport": "5.1",
    "Sportaccommodaties": "5.2",
    "Internationals": "0.2",
    "Lokale Media": "5.6",
    "Lokale media": "5.6",
    "Lokale Inclusie": "6.1",
    "Lokale inclusie": "6.1",
    "Veiligheid": "1.2",
    "APV": "1.2",
    "Cultuurbeleid": "5.3",
    "Cultuur en Welzijn": "5.3",
    "Cultureel erfgoed": "5.5",
    "Warenar": "5.3",
    "Subsidies": "5.3",
    "Volksgezondheid": "7.1",
    "Huwelijken": "0.2",
    "Bestuur": "0.1",
    "P&C-cyclus": "0.4",
    "Riolering": "7.2",
    "Gemeentelijke huisvesting": "8.3",
    "Belastingen": "0.64",
    "Accommodaties": "5.2",
}

# Oude domein (iBabs/OB) → Iv3 taakveld
DOMEIN_MAP = {
    "Openbare orde en Veiligheid": "1.2",
    "Raad": "0.1",
    "Financiën": "0.4",
    "Dienstverlening": "0.2",
    "Fysiek Domein": "8.1",
    "Openbare ruimte": "5.7",
    "Sociaal Domein": "6.3",
    "Bedrijfsvoering": "0.4",
}

# Trefwoorden (regex) → taakveld_code. Volgorde telt: eerste match wint.
KEYWORD_MAP = [
    (r"bestuurscultuur|bestuurscultuuronderzoek", "0.1"),
    (r"veiligheid|politie|handhaving|apv|ondermijning|criminalit", "1.2"),
    (r"burgemeester|verkiezing|raadsvergadering|raadsvoorstel|griffi", "0.1"),
    (r"belasting|ozb|financie|begroting|jaarrekening|p&c|treasury", "0.4"),
    (r"duindigt|groen|natuur|duin|valkenhorst|groene zone|maaldrift|stedenbouwkundig kader", "5.7"),
    (r"sport|zwembad|sporthal|voetbal|tennis|scouting", "5.1"),
    (r"economis|winkel|horeca|strand|recreati|toerism", "3.4"),
    (r"afval", "7.3"),
    (r"bestemmingsplan|omgevingsw|omgevingsv|bouwplan|structuurvisie", "8.1"),
    (r"duurzaam|klimaat|energie|milieu|stikstof", "7.4"),
    (r"riole", "7.2"),
    (r"verkeer|mobiliteit|parkeer|fiets|n44|openbaar vervoer", "2.1"),
    (r"wonen|woningbouw|huurders|corporat|volkshuisvest", "8.3"),
    (r"openbare ruimte|beheer|gladheid|begraafplaats|kabels", "5.7"),
    (r"jeugd|wmo|maatschappelijke ondersteuning|schuldhulp|armoed", "6.6"),
    (r"onderwijs|school|kinderopvang|leerling|educati|inburger", "4.3"),
    (r"participatiewet|uitkering|bijstand|re-integrat|begeleid werk|werk en inkomen", "6.3"),
    (r"schooladvies|leerlingenvervoer|vve|voorschools|vroegschools|oab|rmc|leerplicht", "4.3"),
    (r"ouderen|dement|zorg|woonzorg|voedselbank", "6.6"),
    (r"cultuur|museum|bibliotheek|erfgoed|archeolog|warenar|kunst", "5.3"),
    (r"welzijn|vrijwillig|mantelzorg|eenzaamheid", "6.1"),
    (r"subsidie|volksgezondheid|ggd|preventie", "7.1"),
    (r"ict|informatie|dienstverlening|kcc|privacy|avg|archief", "0.4"),
    (r"personeel|organisatie|cao|inhuur|formatie|werkplekken", "0.4"),
]


def load_taakvelden():
    """Laad Iv3-taakvelden en bouw code→naam lookup."""
    with open(TAAKVELDEN_JSON, encoding="utf-8") as f:
        data = json.load(f)
    code_to_naam = {}
    for h in data["hoofdstukken"]:
        for tv in h["taakvelden"]:
            code_to_naam[tv["code"]] = tv["naam"]
    return data, code_to_naam


def load_portefeuille_map():
    """Laad primaire taakveld per oude portefeuille."""
    with open(PORTEFEUILLE_MAP_JSON, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("primaire_taakveld_per_portefeuille", {})


def classify_decision(decision, code_to_naam, portefeuille_map):
    """
    Classificeer een besluit naar een Iv3-taakveld.
    Retourneert (taakveld_code, taakveld_naam, methode).
    """
    portefeuille = (decision.get("portefeuille") or "").strip()
    domein = (decision.get("domein") or "").strip()
    onderwerp = (decision.get("onderwerp_begroting") or "").strip()
    naam = (decision.get("naam") or "").lower()
    besluit = (decision.get("besluit") or decision.get("besluit_kort") or "").lower()
    zoektekst = f"{naam} {besluit}"

    # 0. Override: omgevingsvergunningen → 8.1 Ruimte en leefomgeving
    if "omgevingsvergunning" in naam and "egalisatie" not in naam:
        return "8.1", code_to_naam.get("8.1", "Ruimte en leefomgeving"), "omgevingsvergunning"

    # 1. Onderwerp
    if onderwerp in ONDERWERP_MAP:
        code = ONDERWERP_MAP[onderwerp]
        return code, code_to_naam.get(code, code), "onderwerp"

    # 2. Portefeuille → primaire taakveld (voor migratie van bestaande data)
    for pf, code in portefeuille_map.items():
        if pf.lower() in portefeuille.lower():
            return code, code_to_naam.get(code, code), "portefeuille"

    # 3. Domein (oude iBabs/OB indeling)
    if domein in DOMEIN_MAP:
        code = DOMEIN_MAP[domein]
        return code, code_to_naam.get(code, code), "domein"

    # 4. Trefwoord
    for pattern, code in KEYWORD_MAP:
        if re.search(pattern, zoektekst, re.IGNORECASE):
            return code, code_to_naam.get(code, code), "trefwoord"

    # 5. Fallback
    return "0.1", code_to_naam.get("0.1", "Bestuur"), "fallback"


def is_portefeuille_header(decision):
    """Filter: portefeuille-kopjes zijn geen echte besluiten."""
    if decision.get("bron") != "college":
        return False
    besluit = (decision.get("besluit") or decision.get("besluit_kort") or "").strip()
    if len(besluit) > 50:
        return False
    naam = (decision.get("naam") or "").strip()
    headers = [
        "Financiën, Economie en Sport", "Financiën, Economie & Sport",
        "Sociaal Domein, Wonen en Onderwijs", "Sociaal Domein, Wonen & Onderwijs",
        "Ruimte, Duurzaamheid en Mobiliteit", "Ruimte, Duurzaamheid & Mobiliteit",
        "Cultuur en Welzijn", "Cultuur & Welzijn",
        "Bedrijfsvoering", "Portefeuille Burgemeester",
    ]
    return any(naam == h or naam.endswith(h) for h in headers)


# ─── Data.js herclassificeren ─────────────────────────────────────────────────

def update_datajs(iv3_data, code_to_naam, portefeuille_map, output_path):
    """Herclassificeer besluiten in data.js naar Iv3-taakvelden; bouw taakveld-boom.
    Lees van INPUT_DATA_JS, schrijf naar output_path."""
    if not INPUT_DATA_JS.exists():
        print(f"⚠ {INPUT_DATA_JS} niet gevonden, overslaan")
        return [], []

    text = INPUT_DATA_JS.read_text(encoding="utf-8")
    match = re.search(r"const\s+ALL_DECISIONS_DATA\s*=\s*(\[.*?\]);\s*$", text, re.DOTALL | re.MULTILINE)
    if not match:
        raise ValueError("Kan ALL_DECISIONS_DATA niet vinden")
    decisions = json.loads(match.group(1))

    # Filter portefeuille-kopjes
    decisions = [d for d in decisions if not is_portefeuille_header(d)]

    # Bouw hoofdstuk-lookup per taakveld
    code_to_hoofdstuk = {}
    for h in iv3_data["hoofdstukken"]:
        h_naam = f"{h['code']} {h['naam']}"
        for tv in h["taakvelden"]:
            code_to_hoofdstuk[tv["code"]] = h_naam

    # Classificeer
    stats = {}
    for d in decisions:
        code, naam, methode = classify_decision(d, code_to_naam, portefeuille_map)
        d["taakveld_code"] = code
        d["taakveld"] = naam
        d["hoofdstuk"] = code_to_hoofdstuk.get(code, "0 Bestuur en ondersteuning")
        # Behoud domein voor migratie/backward compatibility
        if "domein" not in d or not d["domein"]:
            d["domein"] = naam  # vul in als leeg
        stats[code] = stats.get(code, 0) + 1

    def _sort_code(c):
        p = c.split(".")
        return (int(p[0]), int(p[1]) if len(p) > 1 else 0)

    print("\n📊 Classificatie data.js (Iv3-taakvelden):")
    for code in sorted(stats.keys(), key=_sort_code):
        print(f"   {stats[code]:4d}  {code} {code_to_naam.get(code, '')}")
    print(f"   {'─' * 50}")
    print(f"   {sum(stats.values()):4d}  Totaal")

    # Bouw taakveld-boom (hoofdstuk → taakvelden → onderwerpen)
    tree = {}
    for d in decisions:
        code = d["taakveld_code"]
        hoofdstuk = code.split(".")[0]
        onderwerp = d.get("onderwerp_begroting") or "Overig"
        bron = d.get("bron", "raad")

        if hoofdstuk not in tree:
            tree[hoofdstuk] = {}
        if code not in tree[hoofdstuk]:
            tree[hoofdstuk][code] = {}
        if onderwerp not in tree[hoofdstuk][code]:
            tree[hoofdstuk][code][onderwerp] = {"raad": 0, "college": 0}
        tree[hoofdstuk][code][onderwerp][bron] = tree[hoofdstuk][code][onderwerp].get(bron, 0) + 1

    # Bouw THEMA_BOOM_DATA op HOOFDSTUK-niveau (9 gekleurde tegels)
    # Elk hoofdstuk heeft kinderen = ALLE taakvelden uit Iv3-informatievoorschrift (ook met 0 besluiten)
    thema_boom = []
    for h in iv3_data["hoofdstukken"]:
        h_code = h["code"]
        h_naam = f"{h_code} {h['naam']}"
        kinderen = []
        for tv in h["taakvelden"]:
            tv_code = tv["code"]
            tv_naam = f"{tv_code} {tv['naam']}"
            if h_code in tree and tv_code in tree[h_code]:
                subcounts = []
                for onderwerp, counts in tree[h_code][tv_code].items():
                    totaal = counts["raad"] + counts["college"]
                    subcounts.append({
                        "naam": onderwerp,
                        "aantal": totaal,
                        "raad": counts["raad"],
                        "college": counts["college"],
                    })
                totaal_tv = sum(s["aantal"] for s in subcounts)
                kinderen.append({
                    "naam": tv_naam,
                    "code": tv_code,
                    "aantal": totaal_tv,
                    "raad": sum(s["raad"] for s in subcounts),
                    "college": sum(s["college"] for s in subcounts),
                    "kinderen": sorted(subcounts, key=lambda k: -k["aantal"]),
                })
            else:
                # Taakveld uit Iv3-informatievoorschrift, nog geen besluiten
                kinderen.append({
                    "naam": tv_naam,
                    "code": tv_code,
                    "aantal": 0,
                    "raad": 0,
                    "college": 0,
                    "kinderen": [],
                })
        thema_boom.append({
            "naam": h_naam,
            "code": h_code,
            "kinderen": sorted(kinderen, key=lambda k: -k["aantal"]),
            "aantal": sum(k["aantal"] for k in kinderen),
        })

    # TAAKVELD_BOOM_DATA: zelfde structuur (voor compatibiliteit)
    boom = thema_boom

    # Schrijf data.js
    decisions_json = json.dumps(decisions, ensure_ascii=False, indent=2)
    boom_json = json.dumps(boom, ensure_ascii=False, indent=2)

    thema_boom_json = json.dumps(thema_boom, ensure_ascii=False, indent=2)
    new_content = f"""// Besluit-Wijzer — data.js · Iv3-taakvelden

const ALL_DECISIONS_DATA = {decisions_json};

const THEMA_BOOM_DATA = {thema_boom_json};

const TAAKVELD_BOOM_DATA = {boom_json};

// Export voor gebruik in app.js
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ ALL_DECISIONS_DATA, THEMA_BOOM_DATA, TAAKVELD_BOOM_DATA }};
}}
"""
    output_path.write_text(new_content, encoding="utf-8")
    print(f"\n✅ {output_path.name} bijgewerkt ({len(decisions)} besluiten, output: {output_path})")
    return decisions, boom


# ─── Database herclassificeren ────────────────────────────────────────────────

def update_database(code_to_naam, portefeuille_map):
    """Voeg taakveld-kolom toe aan DB en classificeer."""
    if not DB_PATH.exists():
        print("⚠ Database niet gevonden, overslaan")
        return

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # Kolom toevoegen
    for col in ["taakveld", "taakveld_code"]:
        try:
            c.execute(f"ALTER TABLE besluiten ADD COLUMN {col} TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass

    c.execute("SELECT id, naam, besluit_kort, portefeuille, domein, agendapunt FROM besluiten")
    rows = c.fetchall()

    stats = {}
    for row in rows:
        row_id, naam, besluit, portefeuille, domein, agendapunt = row
        decision = {
            "naam": naam, "besluit_kort": besluit, "portefeuille": portefeuille,
            "domein": domein, "agendapunt": agendapunt,
        }
        code, naam_tv, _ = classify_decision(decision, code_to_naam, portefeuille_map)
        c.execute("UPDATE besluiten SET taakveld = ?, taakveld_code = ? WHERE id = ?", (naam_tv, code, row_id))
        stats[code] = stats.get(code, 0) + 1

    conn.commit()
    c.execute("CREATE INDEX IF NOT EXISTS idx_besluiten_taakveld ON besluiten(taakveld_code)")
    conn.commit()
    conn.close()

    def _sort_code(c):
        p = c.split(".")
        return (int(p[0]), int(p[1]) if len(p) > 1 else 0)

    print("\n📊 Classificatie database:")
    for code in sorted(stats.keys(), key=_sort_code):
        print(f"   {stats[code]:4d}  {code} {code_to_naam.get(code, '')}")
    print(f"\n✅ Database bijgewerkt ({sum(stats.values())} besluiten)")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Taakveld-clustering naar Iv3")
    parser.add_argument("--target", choices=["wassenaar", "gemeente-x"], default="wassenaar",
                        help="Output: wassenaar (overschrijf wassenaar/data.js) of gemeente-x")
    args = parser.parse_args()

    output_data_js = GEMEENTE_X / "data.js" if args.target == "gemeente-x" else WASSENAAR / "data.js"

    print("=" * 60)
    print("Taakveld-clustering — Iv3 (48 taakvelden, 9 hoofdstukken)")
    print(f"Target: {args.target} → {output_data_js}")
    print("=" * 60)

    iv3_data, code_to_naam = load_taakvelden()
    portefeuille_map = load_portefeuille_map()

    print("\n── Data.js ──")
    update_datajs(iv3_data, code_to_naam, portefeuille_map, output_data_js)

    if args.target == "wassenaar":
        print("\n── Database ──")
        update_database(code_to_naam, portefeuille_map)
    else:
        print("\n── Database ── (overgeslagen voor gemeente-x)")

    print(f"\n{'=' * 60}")
    print("✅ Taakveld-clustering compleet!")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
