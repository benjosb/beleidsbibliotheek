#!/usr/bin/env python3
"""
Scrape verkiezingsprogramma's van Wassenaarse partijen naar tekst.
"""
import re
import sys
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installeer: pip install requests beautifulsoup4")
    sys.exit(1)

OUT_DIR = Path(__file__).parent
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) BeleidsWijzer/1.0"}


def extract_text(soup):
    """Haal leesbare tekst uit HTML."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n\n".join(lines)


def fetch_and_save(name, url, filename):
    """Fetch URL en sla tekst op."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        text = extract_text(soup)
        out = OUT_DIR / filename
        out.write_text(f"Bron: {url}\nGedownload: 25 februari 2026\n\n---\n\n{text}", encoding="utf-8")
        print(f"OK: {name} -> {filename}")
        return True
    except Exception as e:
        print(f"FOUT {name}: {e}")
        return False


def main():
    urls = [
        ("GroenLinks-PvdA", "https://wassenaar.groenlinkspvda.nl/standpunten/", "GroenLinks_PvdA_Wassenaar_verkiezingsprogramma_2026.txt"),
        ("FvD", "https://fvd.nl/gemeentes/wassenaar", "FvD_Wassenaar_verkiezingsprogramma_2026.txt"),
        ("DLW", "https://www.democratischeliberalen.nl/", "DLW_Wassenaar_verkiezingsprogramma_2026.txt"),
        ("Hart voor Wassenaar", "https://hartvoorwassenaar.nl/", "Hart_voor_Wassenaar_verkiezingsprogramma_2026.txt"),
        ("VVD (wassenaarders)", "https://wassenaarders.nl/2026/02/23/wassenaarse-vvd-gezond-verstand-en-financien/", "VVD_Wassenaar_verkiezingsprogramma_2026.txt"),
    ]
    for name, url, fname in urls:
        fetch_and_save(name, url, fname)


if __name__ == "__main__":
    main()
