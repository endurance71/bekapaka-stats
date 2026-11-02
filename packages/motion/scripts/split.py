"""Tnie SVG zapowiedzi ze Studio (render_v3, styl „sport”, story 1080×1920) na części do animacji.

Warstwy rozpoznaje po identyfikatorach grup (`00-tlo`, `10-material`, `20-wstega`, `30-druzyny`,
`40-panel`, `90-stopka`), a elementy po treści (aria-label), filtrze i położeniu - nie po kolejności,
żeby logo rywala albo brak „Wstęp wolny” nie przesuwały części.
Użycie: python split.py <story.svg> <katalog_wyjściowy> <nazwa rywala>"""
import base64, json, re, sys
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
src, out, opponent = sys.argv[1], sys.argv[2], sys.argv[3]
root = ET.parse(src).getroot()
layers = {g.get('id'): list(g) for g in root if g.tag.endswith('}g')}


def s(nodes):
    return ''.join(ET.tostring(n, encoding='unicode') for n in nodes).replace(f' xmlns="{NS}"', '')


def tag(n):
    return n.tag.split('}')[1]


def cx(n):
    """Przybliżony środek elementu w poziomie (pierwszy punkt ścieżki albo ramka)."""
    if n.get('x') and n.get('width'):
        return float(n.get('x')) + float(n.get('width')) / 2
    for c in n.iter():
        m = re.match(r'\s*M\s*(-?[\d.]+)', c.get('d') or '')
        if m:
            return float(m.group(1))
    return 540.0


def need(cond, what):
    if not cond:
        raise SystemExit(f'split.py: nie znaleziono części „{what}” - czy szablon zapowiedzi w Studio się zmienił?')


# Tło: obraz materiału zapisujemy jako plik, żeby kompozycja nie niosła kilku MB base64.
material = layers['10-material']
img = next(n for n in material if tag(n) == 'image')
mime, b64 = re.match(r'data:image/(\w+);base64,(.*)', img.get('href'), re.S).groups()
open(f'{out}/material.{mime}', 'wb').write(base64.b64decode(b64))

ribbon = layers['20-wstega']
teams = layers['30-druzyny']
panel = layers['40-panel']
foot = layers['90-stopka']

label = lambda n: n.get('aria-label') or ''
name_us = [n for n in teams if label(n) == 'BEKAPAKA']
name_them = [n for n in teams if label(n) and label(n) != 'BEKAPAKA']
shapes = [n for n in teams if not label(n)]
vs = [n for n in shapes if 'nadruk' in (n.get('filter') or '') and 470 < cx(n) < 610]
chevrons = [n for n in shapes if n not in vs and 470 < cx(n) < 610]
crest = [n for n in shapes if cx(n) <= 470]
rival = [n for n in shapes if cx(n) >= 610]
for part, what in ((name_us, 'nazwa BEKAPAKA'), (name_them, 'nazwa rywala'), (vs, 'VS'), (crest, 'herb'), (rival, 'znak rywala')):
    need(part, what)

venue_icon = [n for n in panel if tag(n) == 'svg']
texts = [n for n in panel if tag(n) == 'g']
time = [n for n in panel if tag(n) == 'path' and 'nadruk' in (n.get('filter') or '')]
fill = [n for n in panel if tag(n) == 'path' and n.get('fill') == '#0B0B0B']
line = [n for n in panel if tag(n) == 'path' and n.get('fill') == '#F4A816']
need(time and fill and line and texts, 'panel godziny')

parts = {
    'defs': s([c for c in root if tag(c) == 'defs'][0]),
    'materialFile': f'material.{mime}',
    'materialTint': s([n for n in material if tag(n) == 'rect']),
    'seams': s([n for n in material if tag(n) == 'path']),
    'ribbon': s([n for n in ribbon if not label(n)]),
    'date': s([n for n in ribbon if label(n)]),
    'crest': s(crest), 'rival': s(rival), 'vs': s(vs), 'chevrons': [s([n]) for n in chevrons],
    'nameUs': s(name_us), 'nameThem': s(name_them),
    'panelFill': s(fill), 'panelLine': s(line), 'time': s(time),
    'venue': s(venue_icon + texts[:1]), 'entry': s(texts[1:]),
    'stripes': [s([n]) for n in foot if tag(n) == 'rect'],
    'foot': s([n for n in foot if tag(n) != 'rect']),
}
json.dump(parts, open(f'{out}/parts.json', 'w'), ensure_ascii=False)
print(json.dumps({k: len(v) for k, v in parts.items()}))
