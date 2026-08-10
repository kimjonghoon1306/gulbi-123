#!/usr/bin/env python3
# 카테고리 아이콘 누끼: public/category-icons/raw/*.webp (배경 있음) → 투명+여백크롭 → public/category-icons/*.webp
# 노하우 출처: oncatch/scripts/cutout.py (rembg remove + getbbox crop)
import glob, os
from rembg import remove
from PIL import Image

RAW = "public/category-icons/raw"
OUT = "public/category-icons"
os.makedirs(OUT, exist_ok=True)

for f in sorted(glob.glob(f"{RAW}/*.webp")):
    name = os.path.basename(f)
    dest = os.path.join(OUT, name)
    im = Image.open(f).convert("RGBA")
    cut = remove(im)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    cut.save(dest, "WEBP", quality=92)
    print("cut", name, cut.size)

print("=== CUTOUT DONE ===")
