#!/usr/bin/env python3
"""Build monolith HTML from source files for Wassenaar."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "beleidswijzer-wassenaar.html")

def read(name):
    with open(os.path.join(BASE, name), "r", encoding="utf-8") as f:
        return f.read()

index_html = read("index.html")
css = read("styles.css")
data_js = read("data.js")
briefings_js = read("briefings.js")
coalitie_js = read("coalitieakkoord.js")
app_js = read("app.js")

html = index_html

html = html.replace(
    '    <link rel="stylesheet" href="styles.css">',
    f"    <style>\n{css}\n    </style>"
)

scripts_block = f"""    <script>
{data_js}

{briefings_js}

{coalitie_js}

{app_js}
    </script>"""

html = html.replace(
    '    <script src="data.js"></script>\n'
    '    <script src="briefings.js"></script>\n'
    '    <script src="coalitieakkoord.js"></script>\n'
    '    <script src="app.js"></script>',
    scripts_block
)

html = html.replace(
    '<a href="index.html" class="logo-link" aria-label="Gemeente Wassenaar">',
    '<a href="https://www.wassenaar.nl" class="logo-link" aria-label="Gemeente Wassenaar" target="_blank" rel="noopener">'
)

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

size_mb = os.path.getsize(OUT) / (1024 * 1024)
print(f"Monolith gebouwd: {OUT}")
print(f"Grootte: {size_mb:.1f} MB")
