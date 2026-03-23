#!/usr/bin/env python3
"""
Domeinclustering — Herclassificeert alle besluiten naar 6 portefeuille-thema's.

Thema's (gebaseerd op college Wassenaar 2022–2026):
  1. Bestuur & Veiligheid          (Burgemeester De Lange)
  2. Financiën, Economie & Sport   (Weth. Van Doeveren)
  3. Ruimte, Duurzaamheid & Mob.   (Weth. Koetsier)
  4. Sociaal Domein, Wonen & Ondw. (Weth. Bloemendaal)
  5. Cultuur & Welzijn             (Weth. Zoutendijk)
  6. Bedrijfsvoering               (Ambtelijke organisatie)

Gebruik:
    python3 scripts/domeinclustering.py

Werkt op:
  - data.js (raads- + collegebesluiten) → herschrijft domein-velden + thema-boom
  - db_collegebesluiten.db → voegt kolom 'thema' toe aan besluiten-tabel
"""

import json
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_JS = BASE_DIR / "data.js"
DB_PATH = BASE_DIR / "db_collegebesluiten.db"

# ─── De 6 thema's ─────────────────────────────────────────────────────────────

THEMAS = {
    "Bestuur & Veiligheid": {
        "portefeuillehouder": "Burgemeester De Lange",
        "color": "#c8e6c9",
    },
    "Financiën, Economie & Sport": {
        "portefeuillehouder": "Wethouder Van Doeveren",
        "color": "#ce93d8",
    },
    "Ruimte, Duurzaamheid & Mobiliteit": {
        "portefeuillehouder": "Wethouder Koetsier",
        "color": "#90caf9",
    },
    "Sociaal Domein, Wonen & Onderwijs": {
        "portefeuillehouder": "Wethouder Bloemendaal",
        "color": "#80cbc4",
    },
    "Cultuur & Welzijn": {
        "portefeuillehouder": "Wethouder Zoutendijk",
        "color": "#ffb74d",
    },
    "Bedrijfsvoering": {
        "portefeuillehouder": "Ambtelijke organisatie",
        "color": "#b3e5fc",
    },
}

# ─── Mapping-regels ────────────────────────────────────────────────────────────
#
# Prioriteit: portefeuille > domein > onderwerp > trefwoord in naam/besluit
# Elke regel is (veld, patroon, thema). Eerste match wint.

PORTEFEUILLE_MAP = [
    ("Portefeuille Burgemeester", "Bestuur & Veiligheid"),
    ("Burgemeester", "Bestuur & Veiligheid"),
    ("Financiën, Economie en Sport", "Financiën, Economie & Sport"),
    ("Ruimte, Duurzaamheid en Mobiliteit", "Ruimte, Duurzaamheid & Mobiliteit"),
    ("Sociaal Domein, Wonen en Onderwijs", "Sociaal Domein, Wonen & Onderwijs"),
    ("Cultuur en Welzijn", "Cultuur & Welzijn"),
]

DOMEIN_MAP = {
    "Openbare orde en Veiligheid": "Bestuur & Veiligheid",
    "Raad": "Bestuur & Veiligheid",

    "Financiën": "Financiën, Economie & Sport",
    "Dienstverlening": "Financiën, Economie & Sport",

    "Fysiek Domein": "Ruimte, Duurzaamheid & Mobiliteit",
    "Openbare ruimte": "Ruimte, Duurzaamheid & Mobiliteit",

    "Sociaal Domein": "Sociaal Domein, Wonen & Onderwijs",

    "Bedrijfsvoering": "Bedrijfsvoering",
}

# Onderwerp-specifieke overrides (binnen een domein kan een onderwerp naar een ander thema)
ONDERWERP_MAP = {
    "Economie": "Financiën, Economie & Sport",
    "Afval": "Financiën, Economie & Sport",
    "Vastgoed": "Financiën, Economie & Sport",
    "Centrum Wassenaar": "Financiën, Economie & Sport",
    "Sport": "Financiën, Economie & Sport",
    "Sportaccommodaties": "Financiën, Economie & Sport",
    "Internationals": "Bestuur & Veiligheid",
    "Lokale Media": "Bestuur & Veiligheid",
    "Lokale media": "Bestuur & Veiligheid",
    "Lokale Inclusie": "Sociaal Domein, Wonen & Onderwijs",
    "Lokale inclusie": "Sociaal Domein, Wonen & Onderwijs",
    "Veiligheid": "Bestuur & Veiligheid",
    "APV": "Bestuur & Veiligheid",
    "Cultuurbeleid": "Cultuur & Welzijn",
    "Cultuur en Welzijn": "Cultuur & Welzijn",
    "Cultureel erfgoed": "Cultuur & Welzijn",
    "Warenar": "Cultuur & Welzijn",
    "Subsidies": "Cultuur & Welzijn",
    "Volksgezondheid": "Cultuur & Welzijn",
    "Huwelijken": "Bedrijfsvoering",
    "Bestuur": "Bestuur & Veiligheid",
    "P&C-cyclus": "Financiën, Economie & Sport",
    "Riolering": "Ruimte, Duurzaamheid & Mobiliteit",
    "Gemeentelijke huisvesting": "Financiën, Economie & Sport",
    "Belastingen": "Financiën, Economie & Sport",
    "Accommodaties": "Financiën, Economie & Sport",
}

# Trefwoorden als laatste vangnet (in naam of besluittekst). Volgorde telt: eerste match wint.
# bestuurscultuur vóór cultuur, anders matcht "cultuur" in bestuurscultuur → verkeerd thema
# (verbeterpunt #1: Beantwoording 101 schriftelijke vragen ex art. 37 RvO inzake bestuurscultuuronderzoek)
KEYWORD_MAP = [
    (r"bestuurscultuur|bestuurscultuuronderzoek", "Bestuur & Veiligheid"),
    (r"veiligheid|politie|handhaving|apv|ondermijning|criminalit", "Bestuur & Veiligheid"),
    (r"burgemeester|verkiezing|raadsvergadering|raadsvoorstel|griffi", "Bestuur & Veiligheid"),
    (r"belasting|ozb|financie|begroting|jaarrekening|p&c|treasury", "Financiën, Economie & Sport"),
    # Duindigt/ruimte vóór sport, zodat renbaan Duindigt bij Ruimte komt
    (r"duindigt|groen|natuur|duin|valkenhorst|groene zone|maaldrift|stedenbouwkundig kader", "Ruimte, Duurzaamheid & Mobiliteit"),
    (r"sport|zwembad|sporthal|voetbal|tennis|scouting", "Financiën, Economie & Sport"),
    (r"economis|winkel|horeca|strand|recreati|toerism|afval", "Financiën, Economie & Sport"),
    (r"bestemmingsplan|omgevingsw|omgevingsv|bouwplan|structuurvisie", "Ruimte, Duurzaamheid & Mobiliteit"),
    (r"duurzaam|klimaat|energie|milieu|stikstof|riole", "Ruimte, Duurzaamheid & Mobiliteit"),
    (r"verkeer|mobiliteit|parkeer|fiets|n44|openbaar vervoer", "Ruimte, Duurzaamheid & Mobiliteit"),
    (r"wonen|woningbouw|huurders|corporat|volkshuisvest", "Sociaal Domein, Wonen & Onderwijs"),
    (r"openbare ruimte|beheer|gladheid|begraafplaats|kabels", "Ruimte, Duurzaamheid & Mobiliteit"),
    (r"jeugd|wmo|maatschappelijke ondersteuning|schuldhulp|armoed", "Sociaal Domein, Wonen & Onderwijs"),
    (r"onderwijs|school|kinderopvang|leerling|educati|inburger", "Sociaal Domein, Wonen & Onderwijs"),
    (r"participatiewet|uitkering|bijstand|re-integrat|begeleid werk|werk en inkomen", "Sociaal Domein, Wonen & Onderwijs"),
    (r"schooladvies|leerlingenvervoer|vve|voorschools|vroegschools|oab|rmc|leerplicht", "Sociaal Domein, Wonen & Onderwijs"),
    (r"ouderen|dement|zorg|woonzorg|voedselbank", "Sociaal Domein, Wonen & Onderwijs"),
    (r"cultuur|museum|bibliotheek|erfgoed|archeolog|warenar|kunst", "Cultuur & Welzijn"),
    (r"welzijn|vrijwillig|mantelzorg|eenzaamheid", "Cultuur & Welzijn"),
    (r"subsidie|volksgezondheid|ggd|preventie", "Cultuur & Welzijn"),
    (r"ict|informatie|dienstverlening|kcc|privacy|avg|archief", "Bedrijfsvoering"),
    (r"personeel|organisatie|cao|inhuur|formatie|werkplekken", "Bedrijfsvoering"),
]


def classify_decision(decision):
    """
    Classificeer een besluit naar een van de 6 thema's.
    Retourneert (thema_naam, methode) — methode voor debugging.
    """
    portefeuille = (decision.get("portefeuille") or "").strip()
    domein = (decision.get("domein") or "").strip()
    onderwerp = (decision.get("onderwerp_begroting") or "").strip()
    naam = (decision.get("naam") or "").lower()
    besluit = (decision.get("besluit") or decision.get("besluit_kort") or "").lower()
    zoektekst = f"{naam} {besluit}"

    # 0. Inhoudelijke override: besluiten over omgevingsvergunningen → Ruimte
    # Alleen op naam/onderwerp, niet op besluittekst (niet voor budget-reserves)
    if "omgevingsvergunning" in naam and "egalisatie" not in naam:
        return "Ruimte, Duurzaamheid & Mobiliteit", "omgevingsvergunning"

    # 1. Onderwerp-specifieke override (o.a. Riolering → Ruimte, ondanks portefeuille Sociaal)
    if onderwerp in ONDERWERP_MAP:
        return ONDERWERP_MAP[onderwerp], "onderwerp"

    # 2. Portefeuille-match
    for pattern, thema in PORTEFEUILLE_MAP:
        if pattern.lower() in portefeuille.lower():
            return thema, "portefeuille"

    # 3. Domein-match
    if domein in DOMEIN_MAP:
        return DOMEIN_MAP[domein], "domein"

    # 4. Trefwoord-match in naam + besluittekst
    for pattern, thema in KEYWORD_MAP:
        if re.search(pattern, zoektekst, re.IGNORECASE):
            return thema, "trefwoord"

    # 5. Fallback
    return "Bestuur & Veiligheid", "fallback"


# ─── Data.js herclassificeren ─────────────────────────────────────────────────

def update_datajs():
    """Herclassificeer alle besluiten in data.js en herbouw de thema-boom."""
    text = DATA_JS.read_text(encoding="utf-8")

    # Parse ALL_DECISIONS_DATA
    match = re.search(
        r"const\s+ALL_DECISIONS_DATA\s*=\s*(\[.*?\]);\s*$",
        text, re.DOTALL | re.MULTILINE,
    )
    if not match:
        raise ValueError("Kan ALL_DECISIONS_DATA niet vinden")
    decisions = json.loads(match.group(1))

    # Filter portefeuille-kopjes (5.a, 5.b etc.) — geen echte besluiten
    PORTEFEUILLE_HEADERS = [
        'Financiën, Economie en Sport', 'Financiën, Economie & Sport',
        'Sociaal Domein, Wonen en Onderwijs', 'Sociaal Domein, Wonen & Onderwijs',
        'Ruimte, Duurzaamheid en Mobiliteit', 'Ruimte, Duurzaamheid & Mobiliteit',
        'Cultuur en Welzijn', 'Cultuur & Welzijn',
        'Bedrijfsvoering', 'Portefeuille Burgemeester',
    ]

    def is_portefeuille_header(d):
        if d.get('bron') != 'college':
            return False
        besluit = (d.get('besluit') or d.get('besluit_kort') or '').strip()
        if len(besluit) > 50:
            return False
        naam = (d.get('naam') or '').strip()
        return any(naam == h or naam.endswith(h) for h in PORTEFEUILLE_HEADERS)

    n_before = len(decisions)
    decisions = [d for d in decisions if not is_portefeuille_header(d)]
    n_filtered = n_before - len(decisions)
    if n_filtered:
        print(f"   {n_filtered} portefeuille-kopjes uitgefilterd")

    # Classificeer
    stats = {}
    for d in decisions:
        thema, methode = classify_decision(d)
        d["domein"] = thema
        stats[thema] = stats.get(thema, 0) + 1

    print("\n📊 Classificatie data.js:")
    for thema in sorted(stats.keys()):
        print(f"   {stats[thema]:4d}  {thema}")
    print(f"   {'─' * 40}")
    print(f"   {sum(stats.values()):4d}  Totaal")

    # Bouw nieuwe thema-boom
    tree = {}
    for d in decisions:
        thema = d["domein"]
        onderwerp = d.get("onderwerp_begroting") or "Overig"
        bron = d.get("bron", "raad")

        if thema not in tree:
            tree[thema] = {}
        if onderwerp not in tree[thema]:
            tree[thema][onderwerp] = {"raad": 0, "college": 0}
        tree[thema][onderwerp][bron] = tree[thema][onderwerp].get(bron, 0) + 1

    # Zorg dat vaste subtegels altijd in de boom staan (voor frontend SUBTHEMA_KEYWORDS)
    STANDARD_KINDEREN = {
        "Sociaal Domein, Wonen & Onderwijs": ["Werk en Inkomen", "Inburgering"],
        "Financiën, Economie & Sport": ["Sportaccommodaties"],
    }
    for thema, kind_namen in STANDARD_KINDEREN.items():
        if thema not in tree:
            tree[thema] = {}
        for naam in kind_namen:
            if naam not in tree[thema]:
                tree[thema][naam] = {"raad": 0, "college": 0}

    boom = []
    for thema in sorted(tree.keys()):
        kinderen = []
        for onderwerp in sorted(tree[thema].keys()):
            counts = tree[thema][onderwerp]
            kinderen.append({
                "naam": onderwerp,
                "aantal": counts["raad"] + counts["college"],
                "raad": counts["raad"],
                "college": counts["college"],
            })
        boom.append({
            "naam": thema,
            "kinderen": kinderen,
            "aantal": sum(k["aantal"] for k in kinderen),
        })

    # Schrijf data.js
    decisions_json = json.dumps(decisions, ensure_ascii=False, indent=2)
    boom_json = json.dumps(boom, ensure_ascii=False, indent=2)

    new_content = f"""// Besluit-Wijzer Wassenaar — data.js · 5.3.0 (7 mrt 2026) · domeinclustering

const ALL_DECISIONS_DATA = {decisions_json};

const THEMA_BOOM_DATA = {boom_json};

// Export voor gebruik in app.js
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ ALL_DECISIONS_DATA, THEMA_BOOM_DATA }};
}}
"""
    DATA_JS.write_text(new_content, encoding="utf-8")
    print(f"\n✅ data.js bijgewerkt ({len(decisions)} besluiten, {len(boom)} thema's)")
    return decisions, boom


# ─── Database herclassificeren ────────────────────────────────────────────────

def update_database():
    """Voeg thema-kolom toe aan DB en classificeer alle collegebesluiten."""
    if not DB_PATH.exists():
        print("⚠ Database niet gevonden, overslaan")
        return

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # Verwijder portefeuille-kopjes uit DB
    PORTEFEUILLE_HEADERS_DB = [
        'Financiën, Economie en Sport', 'Financiën, Economie & Sport',
        'Sociaal Domein, Wonen en Onderwijs', 'Sociaal Domein, Wonen & Onderwijs',
        'Ruimte, Duurzaamheid en Mobiliteit', 'Ruimte, Duurzaamheid & Mobiliteit',
        'Cultuur en Welzijn', 'Cultuur & Welzijn',
        'Bedrijfsvoering', 'Portefeuille Burgemeester',
    ]
    placeholders = ",".join("?" * len(PORTEFEUILLE_HEADERS_DB))
    c.execute(
        f"""DELETE FROM besluiten WHERE naam IN ({placeholders})
           AND (besluit_kort IS NULL OR LENGTH(TRIM(COALESCE(besluit_kort,''))) < 50)""",
        PORTEFEUILLE_HEADERS_DB,
    )
    n_cleaned = c.rowcount
    conn.commit()
    if n_cleaned:
        print(f"   🧹 {n_cleaned} portefeuille-kopjes uit DB verwijderd")

    # Kolom toevoegen als die er nog niet is
    try:
        c.execute("ALTER TABLE besluiten ADD COLUMN thema TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # kolom bestaat al

    # Alle besluiten ophalen en classificeren
    c.execute("SELECT id, naam, besluit_kort, portefeuille, domein, agendapunt FROM besluiten")
    rows = c.fetchall()

    stats = {}
    for row_id, naam, besluit, portefeuille, domein, agendapunt in rows:
        decision = {
            "naam": naam,
            "besluit_kort": besluit,
            "portefeuille": portefeuille,
            "domein": domein,
            "agendapunt": agendapunt,
        }
        thema, methode = classify_decision(decision)
        c.execute("UPDATE besluiten SET thema = ? WHERE id = ?", (thema, row_id))
        stats[thema] = stats.get(thema, 0) + 1

    conn.commit()

    # Index op thema
    c.execute("CREATE INDEX IF NOT EXISTS idx_besluiten_thema ON besluiten(thema)")
    conn.commit()
    conn.close()

    print("\n📊 Classificatie database:")
    for thema in sorted(stats.keys()):
        print(f"   {stats[thema]:4d}  {thema}")
    print(f"   {'─' * 40}")
    print(f"   {sum(stats.values()):4d}  Totaal")
    print(f"\n✅ Database bijgewerkt ({sum(stats.values())} besluiten geclassificeerd)")


# ─── Hoofdprogramma ───────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Domeinclustering — 6 portefeuille-thema's")
    print("=" * 60)

    print("\n── Data.js (raads- + collegebesluiten webinterface) ──")
    decisions, boom = update_datajs()

    print("\n── Database (collegebesluiten 2022–2025) ──")
    update_database()

    print(f"\n{'=' * 60}")
    print("✅ Clustering compleet!")
    print(f"   Thema's: {', '.join(sorted(THEMAS.keys()))}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
