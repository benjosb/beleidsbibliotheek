#!/usr/bin/env python3
"""Build monolith HTML from source files."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "beleidswijzer-geldrop-mierlo.html")

def read(name):
    with open(os.path.join(BASE, name), "r", encoding="utf-8") as f:
        return f.read()

index_html = read("index.html")
css = read("styles.css")
data_js = read("data.js")
briefings_js = read("briefings.js")
coalitie_js = read("coalitieakkoord.js")
app_js = read("app.js")

logo_path = os.path.join(BASE, "logo-geldrop-mierlo.svg")
if os.path.exists(logo_path):
    with open(logo_path, "r", encoding="utf-8") as f:
        logo_svg = f.read().strip()
else:
    logo_svg = None

html = index_html

# Replace stylesheet link with inline CSS
html = html.replace(
    '    <link rel="stylesheet" href="styles.css">',
    f"    <style>\n{css}\n    </style>"
)

# Replace script tags with inline JS
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

# Replace logo text with inline SVG if available
if logo_svg:
    html = html.replace(
        '<a href="index.html" class="logo-link" aria-label="Gemeente Geldrop-Mierlo">',
        '<a href="https://www.geldrop-mierlo.nl" class="logo-link" aria-label="Gemeente Geldrop-Mierlo" target="_blank" rel="noopener">'
    )
    html = html.replace(
        '<span class="site-logo-text">Gemeente Geldrop-Mierlo</span>',
        logo_svg.replace('class="', 'class="site-logo ')
        if 'class="' in logo_svg
        else logo_svg.replace('<svg', '<svg class="site-logo"')
    )

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

size_mb = os.path.getsize(OUT) / (1024 * 1024)
print(f"Monolith gebouwd: {OUT}")
print(f"Grootte: {size_mb:.1f} MB")
