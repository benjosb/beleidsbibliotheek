#!/usr/bin/env python3
"""Generate PWA icons and favicon from favicon.svg."""
import os
import cairosvg
from PIL import Image
from io import BytesIO

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_PATH = os.path.join(BASE, 'wassenaar', 'favicon.svg')
ICON_DIR = os.path.join(BASE, 'wassenaar', 'pwa-icons')
FAVICON_DIR = os.path.join(BASE, 'wassenaar')

os.makedirs(ICON_DIR, exist_ok=True)

with open(SVG_PATH, 'r') as f:
    svg_data = f.read()

def svg_to_png(svg, size):
    png_bytes = cairosvg.svg2png(bytestring=svg.encode('utf-8'),
                                  output_width=size, output_height=size)
    return Image.open(BytesIO(png_bytes)).convert('RGBA')

# icon-192.png and icon-512.png (standard)
for size in (192, 512):
    img = svg_to_png(svg_data, size)
    path = os.path.join(ICON_DIR, f'icon-{size}.png')
    img.save(path, 'PNG', optimize=True)
    print(f'  -> {path} ({size}x{size})')

# icon-maskable-512.png: 20% safe-zone padding on each side
mask_size = 512
inner_size = int(mask_size * 0.7)
inner = svg_to_png(svg_data, inner_size)
maskable = Image.new('RGBA', (mask_size, mask_size), (85, 96, 28, 255))
offset = (mask_size - inner_size) // 2
maskable.paste(inner, (offset, offset), inner)
mask_path = os.path.join(ICON_DIR, f'icon-maskable-{mask_size}.png')
maskable.save(mask_path, 'PNG', optimize=True)
print(f'  -> {mask_path} (maskable {mask_size}x{mask_size})')

# favicon.ico (16, 32, 48)
ico_sizes = [16, 32, 48]
ico_images = [svg_to_png(svg_data, s) for s in ico_sizes]
ico_path = os.path.join(FAVICON_DIR, 'favicon.ico')
ico_images[0].save(ico_path, format='ICO',
                    sizes=[(s, s) for s in ico_sizes],
                    append_images=ico_images[1:])
print(f'  -> {ico_path} (ICO {ico_sizes})')

# favicon-32.png for <link> tag
fav32 = svg_to_png(svg_data, 32)
fav32_path = os.path.join(FAVICON_DIR, 'favicon-32.png')
fav32.save(fav32_path, 'PNG', optimize=True)
print(f'  -> {fav32_path} (32x32)')

print('\nDone!')
