#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bouwt een staat (CSV + Markdown) van lasten per Iv3-taakveld × jaren 2020–2025,
uitgelijnd op de codes in financieel-bbv-begroting-2026.js.

Bronnen (stand april 2026):
  2020 — jaarrekening-2020-wassenaar.pdf (tekstextract)
  2021 — geen betrouwbare automatische bron in deze repo (zie rapport)
  2022–2024 — officiële jaarstukken-PDF’s van Cuatro (ge-download naar _fetched/)
  2025 — begroting_2025.pdf (raming; geen volledige jaarrekening 2025 als fallback)

Let op: de in analyse-begrotingen/ geplaatste bestanden Jaarstukken_2021.pdf … Jaarstukken_2025.pdf
met elk 1 pagina en vrij geen tekst zijn **niet** bruikbaar voor pdftotext — gebruik de _fetched/-PDF’s.
"""
from __future__ import annotations

import csv
import json
import re
import subprocess
from pathlib import Path

WASSENAAR = Path(__file__).resolve().parents[2]
AB = WASSENAAR / "analyse-begrotingen"
FETCHED = AB / "_fetched"
EXTRACT = AB / "scripts" / "extract_taakveld_lasten.py"
JS_BEGROTING = WASSENAAR / "financieel-bbv-begroting-2026.js"
OUT_CSV = WASSENAAR / "data" / "taakveld-lasten-staat-2020-2025.csv"
OUT_MD = AB / "taakveld-lasten-staat-2020-2025.md"
OUT_RAPPORT = AB / "taakveld-lasten-staat-LEGE_CELLEN.md"

# Bedragen ruimer dan dit (abs) worden als extractiefout beschouwd en leeg gelaten (zie rapport).
MAX_PLAUSIBLE_ABS_LASTEN = 50_000_000

JAAR_PDF: dict[int, tuple[Path, int, str]] = {
    2020: (AB / "jaarrekening-2020-wassenaar.pdf", 9, "Jaarrekening 2020 (lokaal)"),
    2021: (AB / "_geen_bron_2021", 9, "— (geen automatische extract in dit script)"),
    2022: (FETCHED / "jaarstukken-2022__0.pdf", 9, "Jaarstukken 2022 (Cuatro, _fetched)"),
    2023: (FETCHED / "Jaarstukken_2023.pdf", 9, "Jaarstukken 2023 (Cuatro, _fetched)"),
    2024: (FETCHED / "Jaarstukken_2024.pdf", 9, "Jaarstukken 2024 (Cuatro, _fetched)"),
    2025: (AB / "begroting_2025.pdf", 9, "Programmabegroting 2025 (lokaal; raming)"),
}


def load_canonical_codes_ordered() -> list[str]:
    text = JS_BEGROTING.read_text(encoding="utf-8")
    ordered: list[str] = []
    seen: set[str] = set()
    for m in re.finditer(r"'([0-8]\.[0-9A-Za-z.]+)'(?=\s*:\s*\{)", text):
        c = m.group(1)
        if c not in seen:
            seen.add(c)
            ordered.append(c)
    return ordered


def run_extract(pdf: Path, cells: int) -> dict[str, int]:
    if not pdf.exists():
        return {}
    raw = subprocess.check_output(
        ["python3", str(EXTRACT), str(pdf), "--cells", str(cells)],
        text=True,
        stderr=subprocess.DEVNULL,
    )
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def filter_plausible(v: int | None) -> int | None:
    if v is None:
        return None
    if abs(v) > MAX_PLAUSIBLE_ABS_LASTEN:
        return None
    return v


def main() -> None:
    codes = load_canonical_codes_ordered()
    jaren = [2020, 2021, 2022, 2023, 2024, 2025]
    per_jaar: dict[int, dict[str, int]] = {}
    bronnen: dict[int, str] = {}

    for jaar in jaren:
        pdf, cells, label = JAAR_PDF[jaar]
        bronnen[jaar] = label
        if jaar == 2021:
            per_jaar[jaar] = {}
            continue
        per_jaar[jaar] = run_extract(pdf, cells)

    leeg: list[tuple[str, int, str]] = []
    verdacht: list[tuple[str, int, int, str]] = []

    rows: list[dict[str, str]] = []
    for code in codes:
        row: dict[str, str] = {"taakveld": code}
        for jaar in jaren:
            d = per_jaar.get(jaar, {})
            raw_v = d.get(code)
            v = filter_plausible(raw_v)
            if raw_v is not None and v is None and abs(raw_v) > MAX_PLAUSIBLE_ABS_LASTEN:
                verdacht.append(
                    (
                        code,
                        jaar,
                        raw_v,
                        f"abs({raw_v}) > {MAX_PLAUSIBLE_ABS_LASTEN} (waarschijnlijk verkeerde koppeling kolom/rij in pdftotext).",
                    )
                )
            if v is None:
                leeg.append(
                    (
                        code,
                        jaar,
                        "geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).",
                    )
                )
                row[str(jaar)] = ""
            else:
                row[str(jaar)] = str(v)
        rows.append(row)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["taakveld"] + [str(y) for y in jaren])
        w.writeheader()
        w.writerows(rows)

    # Markdown (compact: geen duizendscheiding in MD om breedte te beperken)
    lines: list[str] = []
    lines.append("# Lasten per taakveld 2020–2025 (staat)\n")
    lines.append("\n**Eenheid:** euro, zoals in brondocument (lasten negatief).\n")
    lines.append("\n**Bronnen per kolom**\n")
    for y in jaren:
        lines.append(f"- **{y}:** {bronnen[y]}\n")
    lines.append(
        "\n> **Let op:** de bestanden `Jaarstukken_2021.pdf` … `Jaarstukken_2025.pdf` in `analyse-begrotingen/` "
        "zijn in deze omgeving **1 pagina** en vrij **zonder tekstlaag** — `pdftotext` kan daar geen tabel uithalen. "
        "Voor 2022–2024 zijn daarom de **volledige** PDF’s van Cuatro gebruikt (`analyse-begrotingen/_fetched/`).\n\n"
        "**PDF’s opnieuw binnenhalen (Cuatro):**\n\n"
        "```bash\n"
        "mkdir -p analyse-begrotingen/_fetched && cd analyse-begrotingen/_fetched\n"
        'curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/jaarstukken-2022__0.pdf"\n'
        'curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/Jaarstukken%202023.pdf"\n'
        'curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/Jaarstukken%202024.pdf"\n'
        "```\n"
    )
    lines.append("\n## Tabel\n")
    header = "| Taakveld | " + " | ".join(str(y) for y in jaren) + " |\n"
    sep = "|" + "|".join(["---"] * (1 + len(jaren))) + "|\n"
    lines.append(header)
    lines.append(sep)
    for code in codes:
        cells = [code]
        for jaar in jaren:
            raw_v = per_jaar.get(jaar, {}).get(code)
            v = filter_plausible(raw_v)
            cells.append("—" if v is None else str(v))
        lines.append("| " + " | ".join(cells) + " |\n")

    lines.append("\n---\n\n## Lege cellen (code × jaar)\n\n")
    lines.append(
        "Onderstaande combinaties hebben **geen** waarde in het gebruikte extract "
        "(lege string in CSV). Dat hoeft niet altijd een fout in de bron te zijn: "
        "jaarstukken gebruiken soms **andere Iv3-splitsingen** dan de begroting 2026 "
        "(bijv. `6.71`/`6.72` vs `6.711`/`6.712`).\n\n"
    )
    for code, jaar, reden in leeg:
        if jaar == 2021:
            reden = (
                "2021: geen automatische extract in dit script — multi-kolom begroting-PDF "
                "of aparte volledige jaarstukken-PDF nodig."
            )
        lines.append(f"- **{code}** × **{jaar}** — {reden}\n")

    if verdacht:
        lines.append("\n## Verdachte extracties (bewust leeg gelaten in tabel)\n\n")
        for code, jaar, v, reden in verdacht:
            lines.append(f"- **{code}** × **{jaar}** — ruwe waarde `{v}` — {reden}\n")

    OUT_MD.write_text("".join(lines), encoding="utf-8")

    # apart kort rapport alleen lege cellen
    rep = (
        "# Rapport lege cellen — taakveld × jaar (2020–2025)\n\n"
        + f"Totaal lege cellen: **{len(leeg)}** van {len(codes) * len(jaren)}.\n\n"
    )
    if verdacht:
        rep += "## Verdachte ruwe waarden (uit tabel gehaald)\n\n"
        rep += "\n".join(f"- `{c}` | {j} | ruw={v} | {r}" for c, j, v, r in verdacht) + "\n\n"
    rep += "## Alle lege cellen\n\n" + "\n".join(f"- `{c}` | {j} | {r}" for c, j, r in leeg) + "\n"
    OUT_RAPPORT.write_text(rep, encoding="utf-8")

    print("Geschreven:")
    print(" ", OUT_CSV)
    print(" ", OUT_MD)
    print(" ", OUT_RAPPORT)
    print("Lege cellen:", len(leeg))


if __name__ == "__main__":
    main()
