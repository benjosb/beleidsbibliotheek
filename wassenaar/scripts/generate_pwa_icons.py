#!/usr/bin/env python3
"""Genereer eenvoudige PWA-pictogrammen (PNG) voor BeleidsBibliotheek Wassenaar."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Installeer Pillow: pip install Pillow")

# Gemeente Wassenaar primair groen (styles.css --primary)
BG = (85, 96, 28)
WHITE = (255, 255, 255)
OUT = Path(__file__).resolve().parent.parent / "pwa-icons"
OUT.mkdir(parents=True, exist_ok=True)


def draw_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(img)
    if maskable:
        # Maskable safe zone ~80% — kleinere letter
        pad = int(size * 0.14)
        inner = size - 2 * pad
        font_size = max(inner // 2, 24)
    else:
        pad = int(size * 0.08)
        font_size = max(size // 2, 32)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

    text = "B"
    if hasattr(draw, "textbbox"):
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    else:
        tw, th = draw.textsize(text, font=font)
    x = (size - tw) // 2
    y = (size - th) // 2 - int(size * 0.04)
    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def main():
    for name, sz, mask in [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-512.png", 512, True),
    ]:
        im = draw_icon(sz, mask)
        path = OUT / name
        im.save(path, "PNG")
        print("geschreven:", path)


if __name__ == "__main__":
    main()
