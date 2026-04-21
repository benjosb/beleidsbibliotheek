#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hulp: uit pdftotext-extract haalt per Iv3-code de Lasten uit Realisatie / Rekening-kolom
waar die als 3×(Baten,Lasten,Saldo)-blokken (primair | na wijziging / actueel | realisatie|rekening)
herhaald wordt — neemt het LAATSTE blok (index 'lasten' = middelste van elk triplet → positie 7 in 9-tallen).

Niet alle PDF's hebben dezelfde lay-out; bij afwijking handmatig controleren.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS_DATA = ROOT / "financieel-bbv-begroting-2026.js"

# Oudere splitsingen / regels die niet in 2026-JS staan maar wél in 2019–2022 jaarstukken
EXTRA_TAAKVELD_CODES = frozenset(
    {
        "0.10",
        "0.63",
        "3.2",
        "5.4",
        "6.2",
        "6.6",
        "6.71",
        "6.71b",
        "6.71c",
        "6.72",
        "6.72a",
        "6.72b",
        "6.72c",
        "6.72d",
        "6.73a",
        "6.73b",
        "6.73c",
        "6.74a",
        "6.74b",
        "6.74c",
        "6.81",
        "6.81a",
        "6.82",
        "6.82a",
        "6.82b",
    }
)


def load_canonical_taakveld_codes() -> frozenset[str]:
    text = JS_DATA.read_text(encoding="utf-8")
    codes = set(re.findall(r"'([0-8]\.[0-9A-Za-z.]+)'(?=\s*:\s*\{)", text))
    codes |= EXTRA_TAAKVELD_CODES
    return frozenset(codes)


# BBV-taakveldnaam: één hoofdstukcijfer 0-8, subcode zonder extra punten (geen 1.4.01-datums)
IV3_LINE = re.compile(
    r"^(?P<code>[0-8]\.\d+[a-z]?)(?=\s)(?:\s+)(?P<rest>.+)$"
)
# losse regel met alleen een bedrag (pdftotext zet vaak elke plek op een regel)
AMOUNT_LINE = re.compile(r"^-?(?:\d+\.)*\d+\s*$")


def parse_nl_int(s: str) -> int:
    s = s.strip().replace(".", "").replace("\u2212", "-")
    if not s or s == "-":
        return 0
    return int(s)


def split_amount_tokens(line: str) -> list[str]:
    """Splits een regel met bedragen als '-1.234.567' of '0'."""
    line = line.strip()
    if not line:
        return []
    parts = re.findall(r"-?(?:\d+\.)*\d+|-", line)
    out = []
    for p in parts:
        if p == "-":
            out.append("0")
        else:
            out.append(p)
    return out


def extract_triplet_last_from_nine(nums: list[int]) -> int | None:
    if len(nums) < 9:
        return None
    # laatste triplet: baten, lasten, saldo
    return nums[7]


def lasten_from_row(nums: list[int], cells_per_row: int) -> int | None:
    if len(nums) < cells_per_row:
        return None
    if cells_per_row == 9:
        return nums[7]
    if cells_per_row == 3:
        return nums[1]
    return None


def extract_ordered_in_programma(
    block: str, allowed: frozenset[str], cells_per_row: int = 9
) -> dict[str, int]:
    """
    Per 'Programma:...'-blok: verzamel taakveldcodes in volgorde (vóór 'Saldo van baten programma'),
    daarna alle groepen van precies 9 bedragen; koppel i‑de groep aan i‑de code (laatste groepen
    zijn vaak programma-saldo — overslaan als code ontbreekt).
    """
    codes: list[str] = []
    for line in block.splitlines():
        s = line.strip()
        m = IV3_LINE.match(s)
        if not m:
            continue
        c = m.group("code")
        if c not in allowed:
            continue
        if "Saldo" in s and "programma" in s.lower():
            continue
        codes.append(c)
    flat: list[int] = []
    for line in block.splitlines():
        t = line.strip()
        if not t or not AMOUNT_LINE.match(t):
            continue
        if "." not in t:
            try:
                v = int(t.replace("\u2212", "-"))
            except ValueError:
                continue
            # jaartallen als losse regel (2023) niet als bedrag
            if 1990 < abs(v) < 2100:
                continue
        flat.append(parse_nl_int(t))
    rows = [
        flat[i : i + cells_per_row]
        for i in range(0, len(flat) - (len(flat) % cells_per_row), cells_per_row)
    ]
    used = min(len(codes), len(rows))
    out: dict[str, int] = {}
    for idx in range(used):
        last = lasten_from_row(rows[idx], cells_per_row)
        if last is not None and last <= 0:
            out[codes[idx]] = last
    return out


def extract_from_js_triple_block(
    text: str, allowed: frozenset[str], cells_per_row: int = 9
) -> dict[str, int]:
    """Jaarstukken-tabel met programma-blokken: codes bovenaan, daarna rijen van 9 bedragen."""
    out: dict[str, int] = {}
    for part in re.split(r"(?=Programma:[P][0-9])", text):
        if "Programma:" not in part:
            continue
        out.update(extract_ordered_in_programma(part, allowed, cells_per_row=cells_per_row))
    return out


def pdftotext(pdf: Path) -> str:
    return subprocess.check_output(["pdftotext", str(pdf), "-"], text=True, stderr=subprocess.DEVNULL)


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "Usage: extract_taakveld_lasten.py <pdf> [--cells 9|3]",
            file=sys.stderr,
        )
        sys.exit(1)
    pdf = Path(sys.argv[1])
    cells = 9
    if "--cells" in sys.argv:
        i = sys.argv.index("--cells")
        cells = int(sys.argv[i + 1])
    text = pdftotext(pdf)
    block_start = text.find("Overzicht baten en lasten per taakveld")
    if block_start < 0:
        print("{}", end="")
        sys.exit(0)
    sub = text[block_start : block_start + 500000]
    allowed = load_canonical_taakveld_codes()
    data = extract_from_js_triple_block(sub, allowed, cells_per_row=cells)
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
