"""System partnerów: poziomy, optyczne wyrównanie wielkości, pole ochronne, plakietki.
Zasada wielkości: logotypy różnych proporcji mają mieć tę samą wagę wizualną — skalujemy do równego
POLA (√(w·h)), z limitem szerokości i wysokości; poziom mnoży wielkość (główny 1.0, instytucje .62, partnerzy .5).
Obecnie wszyscy partnerzy mają jeden poziom → wall(): jednakowe kafle."""
import json, math
from pathlib import Path
from PIL import Image
from poster import el, C, SYSTEM
import motyw as M
DIR = SYSTEM/'partnerzy'; DATA = json.loads((DIR/'partnerzy.json').read_text())
BY_ID = {l['id']: l for l in DATA['logo']}

def size(lid, unit, maxw=None, maxh=None):
    """unit = bok kwadratu o tym samym polu dla poziomu 1.0. Zwraca (w, h)."""
    l = BY_ID[lid]; w0, h0 = Image.open(DIR/'logo-raster'/l['plik']).size
    k = DATA['poziomy'][l['poziom']]['skala']
    s = unit*k/math.sqrt(w0*h0); w, h = w0*s, h0*s
    if maxw and w > maxw: w, h = maxw, h*maxw/w
    if maxh and h > maxh: w, h = w*maxh/h, maxh
    return w, h

def plaque(p, x, y, w, h, pad, dark=True):
    """Plakietka pod logo (na ciemnym tle obowiązkowa): biel, narożniki ścięte."""
    g = M.G.poly((x-pad+pad*.6, y-pad), (x+w+pad, y-pad), (x+w+pad, y+h+pad-pad*.6), (x+w+pad-pad*.6, y+h+pad), (x-pad, y+h+pad), (x-pad, y-pad+pad*.6))
    M.shape(p, g, '#FFFFFF'); return g

def logo(p, lid, cx, cy, w, h, plate=True, pad=None):
    l = BY_ID[lid]; pad = pad if pad is not None else max(8, min(w, h)*.22)       # pole ochronne ≈ 1/4 krótszego boku
    if plate: plaque(p, cx-w/2, cy-h/2, w, h, pad)
    p.image(DIR/'logo-raster'/l['plik'], cx-w/2, cy-h/2, w, h, fit='meet')
    return (cx-w/2-pad, cy-h/2-pad, cx+w/2+pad, cy+h/2+pad)

def row(p, ids, x0, x1, cy, unit, maxh, plate=True, gap=None):
    """Wiersz logotypów wyśrodkowany w [x0, x1]; równe odstępy między polami ochronnymi."""
    sizes = [size(i, unit, maxh=maxh) for i in ids]; pads = [max(8, min(w, h)*.22) for w, h in sizes]
    tot = sum(w + 2*pd for (w, h), pd in zip(sizes, pads))
    gap = gap if gap is not None else max(16, (x1-x0-tot)/(len(ids)+1) if len(ids) > 1 else 0)
    gap = min(gap, 60); tot += gap*(len(ids)-1); x = (x0+x1)/2 - tot/2
    for i, (w, h), pd in zip(ids, sizes, pads):
        logo(p, i, x + pd + w/2, cy, w, h, plate, pd); x += w + 2*pd + gap
    return tot

def tier(name): return [l['id'] for l in DATA['logo'] if l['poziom'] == name]


# ===== Jeden poziom partnerstwa: ściana partnerów (jednakowe kafle) =====
def ids_all():
    """Wszyscy partnerzy, kolejność alfabetyczna (równy status — nikt nie jest wyróżniony kolejnością)."""
    return sorted([l['id'] for l in DATA['logo']], key=lambda i: BY_ID[i]['nazwa'].lower())

def wall(p, x0, x1, y0, tw, th, gap, rows, area=None, text_size=20, cut=None, fill='#FFFFFF', frame=None):
    """Jednakowe białe kafle; logo w każdym kaflu skalowane do tego samego pola optycznego (√(w·h) = const),
    w granicach 82% × 72% kafla. Partner bez aktualnego logo → nazwa (pole 'tekst'). rows = listy id."""
    area = area or tw*th*.265; cut = cut if cut is not None else max(8, th*.1); y = y0
    for row in rows:
        tot = len(row)*tw + (len(row)-1)*gap; x = (x0+x1)/2 - tot/2
        for i in row:
            M.shape(p, M.G.poly((x, y), (x+tw-cut, y), (x+tw, y+cut), (x+tw, y+th), (x, y+th)), fill)
            if frame: p.g.append(el('polygon', points=f'{x},{y} {x+tw-cut},{y} {x+tw},{y+cut} {x+tw},{y+th} {x},{y+th}', fill='none', stroke=frame, stroke_width=1.5))
            cx, cy = x + tw/2, y + th/2; l = BY_ID[i]
            if l.get('tekst'):
                n = len(l['tekst']); lh = text_size*1.6
                for k, s_ in enumerate(l['tekst']):
                    last = k == n-1 and n > 1
                    p.text(s_, cx, cy - (n-1)*lh/2 + k*lh + text_size*.35, text_size, 'body' if last else 'label', fill='#5C5852' if last else C['black'],
                           spacing=0 if last else text_size*.1, anchor='middle', max_width=tw*.9)
            else:
                w0, h0 = Image.open(DIR/'logo-raster'/l['plik']).size; r = w0/h0
                w, h = math.sqrt(area*r), math.sqrt(area/r); k = min(1, tw*.82/w, th*.72/h); w, h = w*k, h*k
                p.image(DIR/'logo-raster'/l['plik'], cx-w/2, cy-h/2, w, h, fit='meet')
            x += tw + gap
        y += th + gap
    return y - gap
