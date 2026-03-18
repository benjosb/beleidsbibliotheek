#!/usr/bin/env python3
"""
Genereert overdrachtsdossier.html uit overdracht_raadsverkiezingen_2026.md.
Statische HTML — geen fetch nodig, werkt met file://.
"""
import re
import html
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
WASSENAAR_DIR = SCRIPT_DIR.parent
MD_PATH = WASSENAAR_DIR / "overdracht_raadsverkiezingen_2026.md"
OUT_PATH = WASSENAAR_DIR / "overdrachtsdossier.html"


def strip_page_num(s: str) -> str:
    return re.sub(r"\t\d+\s*$", "", s).strip()


def escape_html(s: str) -> str:
    return html.escape(str(s))


def inline_md(s: str) -> str:
    s = escape_html(s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", s)
    return s


def parse_md(md: str) -> list[dict]:
    lines = md.splitlines()
    chapters = []
    current_chapter = None
    current_content = []
    table_rows = []

    def flush_table():
        nonlocal table_rows
        if not table_rows:
            return
        out = ['<table class="overdracht-tabel"><tbody>']
        for i, row in enumerate(table_rows):
            tag = "th" if i == 0 else "td"
            cells = "".join(f"<{tag}>{inline_md(c.strip())}</{tag}>" for c in row)
            out.append(f"<tr>{cells}</tr>")
        out.append("</tbody></table>")
        current_content.append("\n".join(out))
        table_rows = []

    def flush_paragraph(text: str):
        t = text.strip()
        if not t or t == "---":
            return
        current_content.append(f"<p>{inline_md(t)}</p>")

    def flush_list(items: list):
        if not items:
            return
        current_content.append("<ul>")
        for item in items:
            current_content.append(f"<li>{inline_md(item)}</li>")
        current_content.append("</ul>")

    list_items = []

    def push_chapter(title: str, content: list):
        if not title:
            return
        body = "\n".join(content)
        if body:
            chapters.append({"title": strip_page_num(title), "body": body})

    for line in lines:
        h1 = re.match(r"^#\s+(.+)$", line)
        h2 = re.match(r"^##\s+(.+)$", line)
        h3 = re.match(r"^###\s+(.+)$", line)
        is_table = line.strip().startswith("|")

        if h1:
            flush_table()
            flush_list(list_items)
            list_items = []
            if current_chapter:
                push_chapter(current_chapter["title"], current_content)
            current_chapter = {"title": h1.group(1)}
            current_content = []
        elif h2:
            flush_table()
            flush_list(list_items)
            list_items = []
            current_content.append(f"<h2>{escape_html(strip_page_num(h2.group(1)))}</h2>")
        elif h3:
            flush_table()
            flush_list(list_items)
            list_items = []
            current_content.append(f"<h3>{escape_html(strip_page_num(h3.group(1)))}</h3>")
        elif is_table:
            flush_list(list_items)
            list_items = []
            cells = [c.strip() for c in line.split("|")[1:-1]]
            is_sep = all(not c or re.match(r"^-+$", c) for c in cells)
            if cells and not is_sep:
                table_rows.append(cells)
        else:
            ul_match = re.match(r"^(\s*)[-*]\s+(.+)$", line)
            if ul_match:
                if table_rows:
                    flush_table()
                list_items.append(ul_match.group(2).strip())
            else:
                if list_items:
                    flush_list(list_items)
                    list_items = []
                if table_rows:
                    flush_table()
                flush_paragraph(line)

    flush_table()
    flush_list(list_items)
    if current_chapter:
        push_chapter(current_chapter["title"], current_content)

    return chapters


def main():
    md = MD_PATH.read_text(encoding="utf-8")
    chapters = parse_md(md)
    skip = {"Inhoud", "Overdrachtsdossier raadsverkiezingen 2026 — Gemeente Wassenaar"}
    # Filter: skip TOC entries en hoofdstukken zonder echte inhoud (alleen h2/h3 uit inhoudsopgave)
    def has_real_content(c):
        body = c["body"]
        return "<p>" in body or "overdracht-tabel" in body or "<ul>" in body
    filtered = [
        c for c in chapters
        if c["title"] not in skip
        and len(c["title"]) > 2
        and has_real_content(c)
    ]

    details_html = []
    for i, ch in enumerate(filtered):
        open_attr = ' open' if i < 2 else ''
        deel_class = ' overdrachtsdossier-details-deel' if ch["title"].startswith("Deel ") else ''
        details_html.append(
            f'<details class="overdrachtsdossier-details{deel_class}" id="od-ch-{i}"{open_attr}>'
            f'<summary class="overdrachtsdossier-summary">{escape_html(ch["title"])}</summary>'
            f'<div class="overdrachtsdossier-details-inhoud">{ch["body"]}</div>'
            "</details>"
        )

    content_block = "\n".join(details_html)
    # Indent for embedding in HTML
    indented = "\n".join("                " + line for line in content_block.split("\n"))

    # Inhoudsopgave: links naar alle hoofdstukken
    toc_items = "\n".join(
        f'                <li><a href="#od-ch-{i}" class="overdrachtsdossier-toc-link">{escape_html(ch["title"])}</a></li>'
        for i, ch in enumerate(filtered)
    )
    toc_html = f"""
            <nav class="overdrachtsdossier-toc" aria-label="Inhoudsopgave">
                <h3 class="overdrachtsdossier-toc-titel">Inhoudsopgave</h3>
                <ol class="overdrachtsdossier-toc-lijst">
{toc_items}
                </ol>
            </nav>
"""

    html_page = f"""<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overdrachtsdossier · BeleidsBibliotheek Wassenaar</title>
    <link rel="stylesheet" href="https://fonts.bunny.net/css?family=roboto:300,400,500,700|open-sans:300,400,600,700">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <a href="#main" class="skip-link">Ga naar inhoud</a>
    <script src="disclaimer.js"></script>
    <header class="site-header" role="banner">
        <div class="container header-top">
            <a href="https://www.wassenaar.nl" class="logo-link" aria-label="Gemeente Wassenaar" target="_blank" rel="noopener">
                <img src="https://cuatro.sim-cdn.nl/wassenaar/uploads/2023-09/wassenaar_logo_fc.svg" alt="Gemeente Wassenaar" class="site-logo" width="200" height="35">
            </a>
            <div class="header-text">
                <h1><a href="index.html" class="header-title-link">BeleidsBibliotheek Wassenaar</a></h1>
                <p class="subtitle">Gemeente Wassenaar · Inzicht in beleid en besluitvorming</p>
            </div>
        </div>
        <div class="header-zoek">
            <div class="container">
                <div class="header-zoek-inner">
                    <input type="text" id="odSearchInput" placeholder="Zoek in overdrachtsdossier…" aria-label="Zoeken in overdrachtsdossier">
                    <button id="odSearchBtn" type="button">ZOEK</button>
                    <button id="odSearchWis" type="button" class="header-zoek-wis">WIS</button>
                </div>
            </div>
        </div>
        <nav class="site-nav-bar" aria-label="BeleidsBibliotheek">
            <div class="container site-nav-inner">
                <a href="index.html" class="site-nav-link">BeleidsBibliotheek</a>
                <a href="overdrachtsdossier.html" class="site-nav-link site-nav-actief">Overdrachtsdossier</a>
                <a href="index.html#compliance" class="site-nav-link">Compliance</a>
            </div>
        </nav>
    </header>

    <main class="container" id="main" role="main">
        <section class="overdrachtsdossier-sectie" id="overdrachtsdossier" aria-labelledby="overdrachtsdossier-titel">
            <h2 id="overdrachtsdossier-titel" class="overdrachtsdossier-pagina-titel">Overdrachtsdossier raadsverkiezingen 2026</h2>
            <p class="overdrachtsdossier-pagina-intro">Inhoud per hoofdstuk — klik om in te klappen of uit te klappen. Gebruik de zoekbalk om te zoeken in het overdrachtsdossier.</p>
            <p id="odNoResults" class="overdrachtsdossier-placeholder" hidden role="status">Geen resultaten voor deze zoekterm.</p>
{toc_html}
            <div id="overdrachtsdossierInhoudPagina" class="overdrachtsdossier-inhoud-pagina" role="region" aria-label="Inhoud overdrachtsdossier">
{indented}
            </div>
        </section>
    </main>

    <footer class="site-footer" role="contentinfo">
        <div class="container">
            <p>Besluit-Wijzer Wassenaar · Versie 5.3.0 (maart 2026) · <a href="https://www.wassenaar.nl" target="_blank" rel="noopener">wassenaar.nl</a> · <a href="index.html" class="footer-link-btn">Terug naar BeleidsBibliotheek</a> · <button type="button" id="disclaimerLink" class="footer-link-btn">Disclaimer</button></p>
            <p class="footer-contact">Contact: Dick Braam · Eenheid Informatie en Datamanagement</p>
        </div>
    </footer>
    <script src="overdrachtsdossier.js"></script>
</body>
</html>
"""

    OUT_PATH.write_text(html_page, encoding="utf-8")
    print(f"Gegenereerd: {OUT_PATH}")


if __name__ == "__main__":
    main()
