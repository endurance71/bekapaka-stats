#!/usr/bin/env python3
"""Import the reviewed 2.0 brand sources. No demo data or people are imported."""
import hashlib, json, shutil, sys
from pathlib import Path
root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / 'BeKaPaKa - brand'
target = root / 'backend/studio/brand'
if not (source / 'CURRENT.md').exists():
    raise SystemExit('Missing CURRENT.md in the supplied brand repository')
for folder, patterns in {'02_system/fonts': ['*.ttf', '*.txt'], '02_system/toolkit': ['*.py'], '02_system/symbole': ['*.py'], '02_system/symbole/svg': ['*.svg'], '02_system/materialy': ['*.png']}.items():
    for pattern in patterns:
        for src in (source / folder).glob(pattern):
            dst = target / folder / src.name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)
for relative in ['02_system/tokens.json', '02_system/partnerzy/partnerzy.json', 'CURRENT.md', '04_fotografia/zasady-ai.md']:
    dst = target / relative
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / relative, dst)
for f in (source / '02_system/partnerzy/logo-raster').glob('*.png'):
    dst = target / '02_system/partnerzy/logo-raster' / f.name
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(f, dst)
manifest = {'version': '2.0.2026-10-03', 'source': 'BeKaPaKa - brand', 'decisions': ['Brandbook 2.0: gold accents allowed, large areas only awards', 'Partner register 02.10.2026: one level, alphabetical order', 'All imported templates remain draft until owner approval'], 'files': {str(f.relative_to(target)): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(target.rglob('*')) if f.is_file() and f.name != 'manifest.json'}}
(target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
public = root / 'studio/public/brand'
public.mkdir(parents=True, exist_ok=True)
for f in (target / '02_system/fonts').glob('*'):
    shutil.copyfile(f, public / f.name)
for name in ['sygnet2-kolor.svg', 'herb2-kolor.svg', 'herb2-mini-kolor.svg', 'wordmark-negatyw.svg']:
    shutil.copyfile(target / '02_system/symbole/svg' / name, public / name)
print(f'Imported {len(manifest["files"])} brand files; no demo photographs or match data.')
