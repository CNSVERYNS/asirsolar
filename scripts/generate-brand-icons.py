"""Generate checked-in website icons with Pillow; never runs during deployment.

Run: python scripts/generate-brand-icons.py
The tracked source is byte-identical to the supplied logo.jpeg. Preserve all
artwork and its white background; do not remove colors to fake transparency.
"""
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
with Image.open(ROOT / "public/images/brand/asir-logo.jpeg") as source:
    artwork = ImageOps.exif_transpose(source).convert("RGB")


def square(size):
    margin = max(1, round(size * 0.04))
    fitted = ImageOps.contain(artwork, (size - 2 * margin, size - 2 * margin), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), "white")
    canvas.paste(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return canvas


for relative, size in [("app/icon.png", 512), ("app/apple-icon.png", 180), ("public/icons/icon-192.png", 192)]:
    target = ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    square(size).save(target, format="PNG", optimize=True)

# ICO PNG frames require RGBA in Next/Turbopack; alpha stays fully opaque.
# The larger frame also serves favicon-only consumers.
square(256).convert("RGBA").save(ROOT / "app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
print("Generated company icons: ICO 16/32/48/256; PNG 180/192/512.")
