#!/usr/bin/env python3
"""Genereer FINANCIEEL_MEERJAREN_LASTEN_ABS + FINANCIEEL_MEERJAREN_FICTIEF
in wassenaar/financieel-taakveld-dashboard-meta.js op basis van:
  - wassenaar/data/taakveld-lasten-staat-2020-2025.csv  (realisatie 2020-2025; 2021 leeg)
  - wassenaar/financieel-bbv-begroting-2026.js          (begroting 2026 lasten)

Conventies:
  - CSV-waarden zijn negatieve lasten; we slaan absolute (positieve) waarde op.
  - "0" in CSV = behandeld als geen data (placeholder/extractie-onzeker).
  - 2021 staat in CSV altijd leeg → wordt fictief geinterpoleerd indien 2020 en 2022 bekend.
  - fictiefMap markeert élke jaar tussen min/max bekende jaar zonder eigen data.
  - 2026 komt uit FINANCIEEL_BEGROTING_2026_TAAKVELD (lasten); is 'begroting', niet fictief.
"""

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "taakveld-lasten-staat-2020-2025.csv"
BEGR_2026_JS = ROOT / "financieel-bbv-begroting-2026.js"
META_JS = ROOT / "financieel-taakveld-dashboard-meta.js"

JAREN_CSV = [2020, 2021, 2022, 2023, 2024, 2025]


def lees_csv():
    """code -> {jaar: abs_lasten} (alleen jaren met getal != 0)."""
    data: dict[str, dict[int, int]] = {}
    with CSV_PATH.open() as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            code = row[0].strip()
            data[code] = {}
            for i, jaar in enumerate(JAREN_CSV, start=1):
                cel = (row[i] if i < len(row) else "").strip()
                if not cel:
                    continue
                try:
                    n = int(cel)
                except ValueError:
                    continue
                if n == 0:
                    continue
                data[code][jaar] = abs(n)
    return data


def lees_2026_lasten():
    """code -> abs lasten 2026 uit FINANCIEEL_BEGROTING_2026_TAAKVELD."""
    txt = BEGR_2026_JS.read_text()
    m = re.search(r"FINANCIEEL_BEGROTING_2026_TAAKVELD\s*=\s*\{(.+?)\};", txt, re.S)
    if not m:
        raise RuntimeError("FINANCIEEL_BEGROTING_2026_TAAKVELD niet gevonden")
    blok = m.group(1)
    out: dict[str, int] = {}
    for line in blok.splitlines():
        mm = re.search(
            r"'([\d.]+)'\s*:\s*\{[^}]*lasten:\s*(-?\d+)", line
        )
        if not mm:
            continue
        code = mm.group(1)
        lasten = int(mm.group(2))
        if lasten == 0:
            continue
        out[code] = abs(lasten)
    return out


def bouw_blok():
    csv_data = lees_csv()
    lasten_2026 = lees_2026_lasten()
    alle_codes = sorted(set(csv_data.keys()) | set(lasten_2026.keys()),
                        key=lambda c: [int(x) for x in c.split('.')])

    abs_lines: list[str] = []
    fic_lines: list[str] = []

    voor_alleen_2026 = []
    geen_data = []

    for code in alle_codes:
        jaar_naar_abs: dict[int, int] = dict(csv_data.get(code, {}))
        if code in lasten_2026:
            jaar_naar_abs[2026] = lasten_2026[code]

        if not jaar_naar_abs:
            geen_data.append(code)
            continue
        if len(jaar_naar_abs) == 1:
            (j,) = jaar_naar_abs.keys()
            voor_alleen_2026.append(f"{code} (alleen {j})")
            continue

        jaren_sorted = sorted(jaar_naar_abs.keys())
        eerste, laatste = jaren_sorted[0], jaren_sorted[-1]
        fictieve = [j for j in range(eerste, laatste + 1)
                    if j not in jaar_naar_abs]

        paren = ", ".join(f"{j}: {jaar_naar_abs[j]}" for j in jaren_sorted)
        abs_lines.append(f"    '{code}': {{ {paren} }}")

        if fictieve:
            fic_paren = ", ".join(f"{j}: true" for j in fictieve)
            fic_lines.append(f"    '{code}': {{ {fic_paren} }}")

    return abs_lines, fic_lines, voor_alleen_2026, geen_data


HEADER_ABS = """/**
 * Meerjaren: absolute lasten per kalenderjaar (positief getal = bedrag lasten).
 * AUTO-GEGENEREERD door analyse-begrotingen/scripts/build_meerjaren_lasten_js.py
 *   Bron 2020-2025: data/taakveld-lasten-staat-2020-2025.csv (realisatie; 2021 leeg)
 *   Bron 2026:      financieel-bbv-begroting-2026.js (begroting)
 *   "0" in CSV is overgeslagen (placeholder); jaren tussen min/max zonder data
 *   staan in FINANCIEEL_MEERJAREN_FICTIEF en worden grijs/lineair geinterpoleerd.
 *
 * Handmatige aanpassingen blijven NIET behouden bij regenereren — corrigeer in CSV.
 */
var FINANCIEEL_MEERJAREN_LASTEN_ABS = {
"""

HEADER_FIC = """/**
 * Jaren die NIET als meting in de CSV stonden maar wel binnen de meetreeks van de
 * code vallen — lijngrafiek interpoleert lineair en kleurt het punt grijs.
 */
var FINANCIEEL_MEERJAREN_FICTIEF = {
"""


def main():
    abs_lines, fic_lines, alleen_eenjaar, geen_data = bouw_blok()

    blok_abs = HEADER_ABS + ",\n".join(abs_lines) + "\n};\n\n"
    blok_fic = HEADER_FIC + ",\n".join(fic_lines) + "\n};"

    nieuw = blok_abs + blok_fic

    huidig = META_JS.read_text()
    pattern = re.compile(
        r"/\*\*\s*\n \* Meerjaren: absolute lasten.+?var FINANCIEEL_MEERJAREN_FICTIEF = \{.+?\};",
        re.S,
    )
    if not pattern.search(huidig):
        raise SystemExit(
            "Kon bestaand meerjaren-blok niet vinden in meta.js — pas pattern aan."
        )
    nieuw_bestand = pattern.sub(nieuw, huidig)
    META_JS.write_text(nieuw_bestand)

    print(f"OK -> {META_JS.relative_to(ROOT.parent)}")
    print(f"  codes met >=2 jaren  : {len(abs_lines)}")
    print(f"  codes met 1 jaar     : {len(alleen_eenjaar)} (geen lijn, alleen KPI)")
    for c in alleen_eenjaar:
        print(f"     - {c}")
    print(f"  codes zonder data    : {len(geen_data)}")
    for c in geen_data:
        print(f"     - {c}")


if __name__ == "__main__":
    main()
