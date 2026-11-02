"""Szerokości znaków fontów marki (Barlow Condensed ExtraBold, Barlow) do dopasowania tekstu
we wzorach filmów - ta sama metoda co `width()` w toolkicie Studio, bez pomiaru w DOM.
Uruchom: npm run metrics (zapisuje src/font-metrics.json)."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont

FONTS = Path(__file__).resolve().parents[3] / 'backend/studio/brand/02_system/fonts'
CHARS = [chr(c) for c in range(32, 383)] + list('–—·…„”’')
out = {}
for key, file in {'display': 'BarlowCondensed-ExtraBold.ttf', 'label': 'Barlow-SemiBold.ttf', 'body': 'Barlow-Regular.ttf'}.items():
    f = TTFont(FONTS / file); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    out[key] = {ch: round(f['hmtx'][cmap[ord(ch)]][0] / upm, 4) for ch in CHARS if ord(ch) in cmap}
Path(__file__).resolve().parents[1].joinpath('src/font-metrics.json').write_text(json.dumps(out, ensure_ascii=False))
print({k: len(v) for k, v in out.items()})
