#!/usr/bin/env python3
"""
Genereer een kant-en-klare BEBISYN-prompt voor een specifiek portefeuille-thema.

Haalt alle relevante besluiten uit de database, combineert ze met het coalitieakkoord
en de systeemprompt, en schrijft het geheel naar een tekstbestand dat je direct in
een LLM kunt plakken.

Gebruik:
    python3 scripts/genereer_bebisyn_prompt.py "Sociaal Domein, Wonen & Onderwijs"
    python3 scripts/genereer_bebisyn_prompt.py --alle
    python3 scripts/genereer_bebisyn_prompt.py --lijst

Output:
    bebisyn_output/bebisyn_prompt_<thema>.txt
"""

import argparse
import json
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "db_collegebesluiten.db"
DATA_JS = BASE_DIR / "data.js"
PROMPT_MD = BASE_DIR / "prompts" / "prompt_bebisyn.md"
OUTPUT_DIR = BASE_DIR / "bebisyn_output"

OUTPUT_DIR.mkdir(exist_ok=True)

THEMAS = [
    "Bestuur & Veiligheid",
    "Financiën, Economie & Sport",
    "Ruimte, Duurzaamheid & Mobiliteit",
    "Sociaal Domein, Wonen & Onderwijs",
    "Cultuur & Welzijn",
    "Bedrijfsvoering",
]


def load_system_prompt():
    """Laad de systeemprompt uit prompt_bebisyn.md."""
    text = PROMPT_MD.read_text(encoding="utf-8")
    match = re.search(r"## SYSTEEMPROMPT\s*```(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    raise ValueError("Systeemprompt niet gevonden in prompt_bebisyn.md")


def load_coalitieakkoord():
    """Laad het coalitieakkoord uit de database."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT volledige_tekst FROM referentiedocumenten WHERE type = 'coalitieakkoord' LIMIT 1")
    row = c.fetchone()
    conn.close()
    return row[0] if row else None


def load_raadsbesluiten(thema):
    """Laad raadsbesluiten voor een thema uit data.js."""
    text = DATA_JS.read_text(encoding="utf-8")
    match = re.search(
        r"const\s+ALL_DECISIONS_DATA\s*=\s*(\[.*?\]);\s*$",
        text, re.DOTALL | re.MULTILINE,
    )
    if not match:
        return []
    decisions = json.loads(match.group(1))
    return [d for d in decisions if d.get("domein") == thema and d.get("bron") == "raad"]


def load_collegebesluiten(thema):
    """Laad collegebesluiten voor een thema uit de database."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT datum, naam, besluit_kort, besluit_volledig, portefeuille, 
               domein, agendapunt, pdf_url, jaar, thema
        FROM besluiten 
        WHERE thema = ?
        ORDER BY datum
    """, (thema,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def format_besluit(d, bron_type="raadsbesluit"):
    """Formatteer een besluit als tekst voor de prompt."""
    lines = [
        "---",
        f"Besluit: {d.get('naam', '?')}",
        f"Datum: {d.get('datum', '?')}",
        f"Type: {bron_type}",
    ]
    if d.get("domein"):
        lines.append(f"Domein: {d['domein']}")
    if d.get("onderwerp_begroting"):
        lines.append(f"Onderwerp: {d['onderwerp_begroting']}")
    if d.get("portefeuille"):
        lines.append(f"Portefeuille: {d['portefeuille']}")
    if d.get("pdf_url"):
        lines.append(f"Bron-PDF: {d['pdf_url']}")

    kort = d.get("besluit") or d.get("besluit_kort") or ""
    if kort:
        lines.append(f"\nBesluittekst (kort):\n{kort}")

    volledig = d.get("besluit_volledig") or ""
    if volledig and volledig != kort:
        lines.append(f"\nVolledige tekst:\n{volledig}")

    lines.append("---")
    return "\n".join(lines)


def generate_prompt(thema):
    """Genereer de complete prompt voor een thema."""
    print(f"\n📝 Genereer prompt voor: {thema}")

    system_prompt = load_system_prompt()
    coalitieakkoord = load_coalitieakkoord()
    raadsbesluiten = load_raadsbesluiten(thema)
    collegebesluiten = load_collegebesluiten(thema)

    print(f"   Raadsbesluiten:  {len(raadsbesluiten)}")
    print(f"   Collegebesluiten: {len(collegebesluiten)}")

    # Bouw de prompt op
    parts = []

    # Systeemprompt
    parts.append("═══════════════════════════════════════════════════════════════")
    parts.append("SYSTEEMPROMPT")
    parts.append("═══════════════════════════════════════════════════════════════")
    parts.append(system_prompt)

    # Gebruikersprompt
    parts.append("\n═══════════════════════════════════════════════════════════════")
    parts.append("GEBRUIKERSPROMPT")
    parts.append("═══════════════════════════════════════════════════════════════")

    parts.append(f"""
Hieronder vind je alle besluiten van de gemeente Wassenaar binnen het portefeuille-thema
"{thema}". De besluiten omvatten zowel raadsbesluiten (2019–2025) als 
collegebesluiten (2022–2025) uit de volledige huidige collegeperiode.

Aanvullend is het coalitieakkoord 2022–2026 "Samen voor Wassenaar" bijgevoegd 
als referentiekader.

Stel een beleidsbriefing op volgens de instructies in de systeemprompt.
""")

    # Coalitieakkoord
    if coalitieakkoord:
        parts.append("═══════════════════════════════════════════════════════════════")
        parts.append("COALITIEAKKOORD 2022–2026 — SAMEN VOOR WASSENAAR")
        parts.append("═══════════════════════════════════════════════════════════════")
        parts.append(coalitieakkoord)

    # Raadsbesluiten
    parts.append(f"\n═══════════════════════════════════════════════════════════════")
    parts.append(f"RAADSBESLUITEN — {thema.upper()} ({len(raadsbesluiten)} besluiten)")
    parts.append("═══════════════════════════════════════════════════════════════")
    for d in sorted(raadsbesluiten, key=lambda x: x.get("datum", "")):
        parts.append(format_besluit(d, "raadsbesluit"))

    # Collegebesluiten
    parts.append(f"\n═══════════════════════════════════════════════════════════════")
    parts.append(f"COLLEGEBESLUITEN — {thema.upper()} ({len(collegebesluiten)} besluiten)")
    parts.append("═══════════════════════════════════════════════════════════════")
    for d in sorted(collegebesluiten, key=lambda x: x.get("datum") or ""):
        parts.append(format_besluit(d, "collegebesluit"))

    full_prompt = "\n\n".join(parts)

    # Schrijf naar bestand
    safe_name = thema.lower().replace(" ", "_").replace(",", "").replace("&", "en")
    filepath = OUTPUT_DIR / f"bebisyn_prompt_{safe_name}.txt"
    filepath.write_text(full_prompt, encoding="utf-8")

    size_kb = filepath.stat().st_size / 1024
    print(f"   → {filepath.name} ({size_kb:.0f} KB)")

    return filepath


def main():
    parser = argparse.ArgumentParser(description="Genereer BEBISYN-prompt per thema")
    parser.add_argument("thema", nargs="?", help="Naam van het thema")
    parser.add_argument("--alle", action="store_true", help="Genereer voor alle thema's")
    parser.add_argument("--lijst", action="store_true", help="Toon beschikbare thema's")
    args = parser.parse_args()

    if args.lijst:
        print("Beschikbare thema's:")
        for t in THEMAS:
            print(f"  - {t}")
        return

    if args.alle:
        themas = THEMAS
    elif args.thema:
        if args.thema not in THEMAS:
            print(f"Onbekend thema: {args.thema}")
            print(f"Kies uit: {', '.join(THEMAS)}")
            return
        themas = [args.thema]
    else:
        parser.print_help()
        return

    print("=" * 60)
    print("BEBISYN — Prompt generator")
    print("=" * 60)

    for thema in themas:
        generate_prompt(thema)

    print(f"\n✅ Klaar! Output in {OUTPUT_DIR}/")
    print("   Plak de inhoud van het .txt-bestand in een LLM (Claude/GPT-4)")
    print("   met temperature 0 voor maximale precisie.")


if __name__ == "__main__":
    main()
