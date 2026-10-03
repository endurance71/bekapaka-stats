"""Symbole marki w szablonach: wstawianie plików z 02_system/symbole/svg, cyfry BKPK i napisy
z przecięciem paskiem stroju (jako kształty), ikony. Wymaga skia-pathops."""
import re, sys
import xml.etree.ElementTree as ET
from poster import el, NS, SYSTEM
sys.path.insert(0, str(SYSTEM/'symbole'))
import geo, symbole

def place(p, name, x, y, w=None, h=None, opacity=1):
    """Wstaw symbol (np. 'sygnet-negatyw', 'logo-poziome-kolor', 'ikona-data'); zwraca (w, h)."""
    src = (SYSTEM/'symbole'/'svg'/f'{name}.svg').read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
    if w and not h: h = w*vb[3]/vb[2]
    if h and not w: w = h*vb[2]/vb[3]
    s = el('svg', x=round(x, 1), y=round(y, 1), width=round(w, 1), height=round(h, 1), viewBox=' '.join(map(str, vb)), opacity=opacity)
    for child in ET.fromstring(src): s.append(child)
    p.g.append(s); return w, h

def lettering(p, s, x, y, size, fill='#F7F6F2', anchor='start', fx=None, cut=True, role='display'):
    """Napis/cyfry BKPK: Barlow Condensed EB, pochylenie 9°, przecięcie paskiem stroju. Linia bazowa = y."""
    shape, w = geo.text(s, role, size, -.01*size if role == 'display' else 0)
    if cut: shape = symbole.stripe_cut(shape, size*.70, 0)
    shape = geo.skew(shape, symbole.SKEW, 0)
    x0, _, x1, _ = shape.bounds
    dx = {'start': -x0, 'middle': -(x0+x1)/2, 'end': -x1}[anchor]          # kotwica po rzeczywistym kształcie
    n = el('path', d=geo.d(geo.move(shape, x+dx, y)), fill=fill)
    if fx: n.set('filter', f'url(#{fx})')
    p.g.append(n)
    b = geo.move(shape, x+dx, y).bounds
    p.boxes.append({'text': s, 'bounds': [round(v, 1) for v in b]})
    return w

def icon_row(p, items, x, y, size=34, gap=28, color='#F7F6F2', text_size=30, role='label', fx=None, shadow=False):
    """Wiersz: [ikona] tekst [ikona] tekst ... ; zwraca szerokość."""
    cx = x
    for icon, label in items:
        src = (SYSTEM/'symbole'/'svg'/f'ikona-{icon}.svg').read_text().replace('#0B0B0B', color)
        s = el('svg', x=cx, y=y-size*.86, width=size, height=size, viewBox='0 0 96 96')
        for child in ET.fromstring(src): s.append(child)
        p.g.append(s); cx += size + 12
        b = p.text(label, cx, y, text_size, role, fill=color, spacing=2, fx=fx, shadow=shadow)
        cx = b[2] + gap
    return cx - x

def icon_row_c(p, items, cx, y, size=34, gap=28, text_size=30, role='label', **k):
    """Wiersz ikon wyśrodkowany na osi cx: szerokość liczona z rzeczywistych advance'ów."""
    from poster import width as tw
    total = sum(size + 12 + tw(label, text_size, role, 2) for _, label in items) + gap*(len(items)-1)
    x0 = cx - total/2
    icon_row(p, items, x0, y, size=size, gap=gap, text_size=text_size, role=role, **k)
    p.pads = getattr(p, 'pads', []) + [('wiersz ikon', (cx - 540, 0, cx + 540, 1), (x0, 0, x0 + total, 1), 'x')]
    return total
