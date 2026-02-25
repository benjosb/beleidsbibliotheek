#!/usr/bin/env python3
import urllib.request
import re

url = "https://www.geldrop-mierlo.nl"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode("utf-8", errors="replace")

# CSS links
css_links = re.findall(r'href="([^"]*\.css[^"]*)"', html)
print("CSS files:")
for link in css_links[:10]:
    print(f"  {link}")

# Inline CSS variables
colors = re.findall(r'(--[a-zA-Z0-9-]+\s*:\s*#[0-9a-fA-F]{3,8})', html)
print(f"\nCSS color vars: {len(colors)}")
for c in colors[:30]:
    print(f"  {c}")

# Background/color hex values
bg_colors = re.findall(r'(?:background-color|background|color)\s*:\s*(#[0-9a-fA-F]{3,8})', html)
print(f"\nInline colors: {len(bg_colors)}")
for c in set(bg_colors):
    print(f"  {c}")

# Fonts
fonts = re.findall(r'font-family\s*:\s*([^;}{]+)', html)
print(f"\nFonts:")
for f in set(fonts):
    print(f"  {f.strip()}")

# Look for theme/brand classes
brand = re.findall(r'class="[^"]*(?:brand|theme|primary|header)[^"]*"', html)
print(f"\nBrand classes: {len(brand)}")
for b in brand[:10]:
    print(f"  {b}")
