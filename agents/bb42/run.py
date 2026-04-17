#!/usr/bin/env python3
"""
Agent BB42 — BeleidsBibliotheek Wassenaar · taakveld 4.2 (Onderwijshuisvesting)

Periodieke run: publieke bronnen doorzoeken met trefwoorden, output als JSON voor human review.
Geen automatische schrijfacties naar de site — altijd human-in-the-loop (GO Yvonne → ACC → Ricardo PROD).

TODO: vul KOOP SRU en/of data.overheid.nl dataset-URL in README; koppel echte HTTP-calls in fetch_hits_*().
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# Projectroot: agents/bb42/ → agents/ → repo-root
AGENT_DIR = Path(__file__).resolve().parent
DEFAULT_KEYWORDS = AGENT_DIR / "keywords-4.2.json"


def load_keywords(path: Path) -> dict:
    if not path.is_file():
        print(
            f"Geen keywords-bestand: {path}\n"
            f"Kopieer keywords-4.2.example.json naar keywords-4.2.json en pas aan.",
            file=sys.stderr,
        )
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def fetch_hits_officiele_bekendmakingen(term: str, gemeente: str) -> list[dict]:
    """
    Placeholder: SRU-ws officielebekendmakingen.nl (registratie KOOP, fair use).
    Vervang door echte request + XML-parse wanneer endpoint en query bekend zijn.
    """
    return []


def fetch_hits_lokale_regelgeving(term: str, gemeente: str) -> list[dict]:
    """
    Placeholder: zoeken in LOV/CVDR — via dataset data.overheid.nl of documenteerde API.
    """
    return []


def run_scan(cfg: dict, dry_run: bool) -> dict:
    gemeente = cfg.get("gemeente", "Wassenaar")
    terms = cfg.get("zoektermen", [])
    run_id = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    all_hits: list[dict] = []
    for term in terms:
        if dry_run:
            all_hits.append(
                {
                    "bron": "dry-run",
                    "zoekterm": term,
                    "titel": f"[placeholder] Treffer voor '{term}'",
                    "url": None,
                    "gemeente": gemeente,
                }
            )
            continue
        # Echte integratie: uncomment wanneer API’s gekoppeld zijn
        # all_hits.extend(fetch_hits_officiele_bekendmakingen(term, gemeente))
        # all_hits.extend(fetch_hits_lokale_regelgeving(term, gemeente))
        all_hits.append(
            {
                "bron": "nog-niet-gekoppeld",
                "zoekterm": term,
                "titel": None,
                "url": None,
                "gemeente": gemeente,
                "notitie": "Koppel fetch_hits_* in run.py na invullen KOOP/dataset-URL’s",
            }
        )

    return {
        "agent": "BB42",
        "taakveld": cfg.get("taakveld", "4.2"),
        "run_id": run_id,
        "gemeente": gemeente,
        "aantal_termen": len(terms),
        "hits": all_hits,
        "volgende_stap": "Review door Yvonne; daarna handmatig opnemen in beleidsnota-per-taakveld-data.js en deploy ACC.",
    }


def main() -> None:
    if load_dotenv:
        load_dotenv(AGENT_DIR / ".env")

    parser = argparse.ArgumentParser(description="Agent BB42 — scan publieke bronnen (4.2)")
    parser.add_argument(
        "--keywords",
        type=Path,
        default=DEFAULT_KEYWORDS,
        help="Pad naar keywords JSON (default: keywords-4.2.json)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Schrijf JSON ook naar dit bestand (bv. /var/log/bb42-last.json)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Test zonder externe calls; één placeholder-hit per term",
    )
    args = parser.parse_args()

    cfg = load_keywords(args.keywords)
    report = run_scan(cfg, dry_run=args.dry_run)

    text = json.dumps(report, ensure_ascii=False, indent=2)
    print(text)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)


if __name__ == "__main__":
    main()
