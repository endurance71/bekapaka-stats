"""Biblioteka motywów BeKaPaKa (z herbu i stroju) do składu grafik — mniejsze, precyzyjne elementy
zamiast wielkich teł. Geometria: 02_system/symbole/geo2.py (shapely)."""
import sys, math
from poster import el, C, SYSTEM
sys.path.insert(0, str(SYSTEM/'symbole'))
import geo2 as G
import znaki2 as Z
import material as mat

GOLD = '#F4A816'; GOLD_D = '#B47A06'; RED_M = '#C8102E'; RED_D = '#A50F25'

def shape(p, g, fill, opacity=1, fx=None, worn=False):
    if g.is_empty: return
    if worn: mat.paint(p, G.d(g), color=fill); return
    n = el('path', d=G.d(g), fill=fill, fill_rule='evenodd', opacity=opacity)
    if fx: n.set('filter', f'url(#{fx})')
    p.g.append(n)

# --- M1 podwójny szewron (skrzydła sygnetu) — akcent kierunku, separator
def chevron(cx, y, w, t=None, gap=None, n=2):
    t = t or w*.16; gap = gap or w*.08; out = []
    for i in range(n):
        yy = y + i*(t+gap); h = (w/2)*G.A24*2.2
        o = G.poly((cx-w/2, yy), (cx, yy+h), (cx+w/2, yy), (cx+w/2, yy+t), (cx, yy+h+t*1.15), (cx-w/2, yy+t))
        out.append(o)
    return out

def chevrons(p, cx, y, w, colors=(C['red'], RED_M), n=2):
    for g, c in zip(chevron(cx, y, w, n=n), colors*3): shape(p, g, c)

# --- M2 rama ze stopniami (rama herbu)
def stepped(x, y, w, h, step=None):
    s = step or min(w, h)*.06
    return G.poly((x, y+2*s), (x+s, y+2*s), (x+s, y+s), (x+2*s, y+s), (x+2*s, y), (x+w-2*s, y), (x+w-2*s, y+s), (x+w-s, y+s),
                  (x+w-s, y+2*s), (x+w, y+2*s), (x+w, y+h), (x, y+h))

def step_frame(p, x, y, w, h, t=6, color=GOLD, step=None, inner=None):
    g = stepped(x, y, w, h, step); shape(p, g.difference(G.inset(g, t)), color)
    if inner: shape(p, G.keyline(g, t+inner[0], inner[1]), color)
    return g

# --- M3 szwy piłki jako cienka linia (zamiast pełnych wielkich kształtów)
def seams(p, cx, cy, r, t=3, color=C['red'], opacity=.5):
    b = G.circle(cx, cy, r)
    lines = G.union(G.ring(cx, cy, r, t), G.rect(cx-t/2, cy-r, t, 2*r), G.rect(cx-r, cy-t/2, 2*r, t),
                    G.ring(cx-r*1.62, cy, r*1.32+t/2, t).intersection(b), G.ring(cx+r*1.62, cy, r*1.32+t/2, t).intersection(b))
    shape(p, lines, color, opacity)

# --- M4 paski stroju (grupa 3)
def stripes(p, x, y, w, n=3, t=6, gap=10, color=C['red'], fade=True):
    for i in range(n): p.rect(x, y+i*(t+gap), w, t, color, opacity=round((.45 + .55*i/max(1, n-1)) if fade else 1, 2))

def register_pad(p, name, box, g, axes='xy'):
    """Zarejestruj parę kontener–treść do kontroli równych odstępów (Poster.save)."""
    p.pads = getattr(p, 'pads', []) + [(name, tuple(box), tuple(g.bounds), axes)]

# --- M5 panel ze ściętymi końcami 24°
def blade(x, y, w, h, left=True, right=True):
    dx = h*G.A24*1.6
    return G.poly((x + (dx if left else 0), y), (x+w, y), (x+w - (dx if right else 0), y+h), (x, y+h))

def blade_panel(p, x, y, w, h, fill, left=True, right=True, worn=False):
    g = blade(x, y, w, h, left, right); shape(p, g, fill, worn=worn); return g

def panel_text(p, s, x, y, w, h, size, color, fx=None, left=True, right=True, keyline=None, fill=None, cut=True):
    """Panel 24° z napisem BKPK wyśrodkowanym po rzeczywistych granicach w części prostokątnej panelu."""
    if fill: blade_panel(p, x, y, w, h, fill, left, right)
    if keyline: shape(p, G.keyline(blade(x, y, w, h, left, right), keyline[0], keyline[1]), keyline[2])
    dx = h*G.A24*1.6
    bx0 = x + (dx/2 if left else 0); bx1 = x + w - (dx/2 if right else 0)
    g, _ = Z.lettering(s, size, cut=cut); g = G.center_in(g, bx0, y, bx1, y+h)
    shape(p, g, color, fx=fx)
    p.boxes.append({'text': s, 'bounds': [round(v, 1) for v in g.bounds], 'anchor': 'middle', 'x': (bx0+bx1)/2})
    register_pad(p, 'panel: ' + s, (bx0, y, bx1, y+h), g)
    return g

# --- M6 wstęga (z herbu) z napisem
def ribbon(p, cx, y, label, size=34, pad=36, fill=GOLD, ink=C['black'], tail=None):
    tail_c = tail or GOLD_D
    t, w = G.text(label, 'display', size, size*.12); x0, y0, x1, y1 = t.bounds
    W = (x1-x0) + 2*pad; H = size*1.25
    tail = G.poly((cx-W/2-46, y+10), (cx-W/2+8, y+10), (cx-W/2+8, y+H+10), (cx-W/2-46, y+H+10), (cx-W/2-28, y+H/2+10))
    fold = G.poly((cx-W/2, y+H), (cx-W/2+8, y+H+10), (cx-W/2+8, y+H))
    shape(p, G.union(tail, G.mirror_x(tail, cx)), tail_c); shape(p, G.union(fold, G.mirror_x(fold, cx)), C['black'])
    shape(p, G.rect(cx-W/2, y, W, H), fill)
    t = G.center_in(t, cx-W/2, y, cx+W/2, y+H); shape(p, t, ink)
    register_pad(p, 'wstęga: ' + label, (cx-W/2, y, cx+W/2, y+H), t)
    return W, H

# --- M7 cyfry/litery konturowe BKPK
def _place(g, x, y, anchor):
    """Kotwica po rzeczywistych granicach kształtu: start = lewa krawędź, middle = środek optyczny, end = prawa."""
    x0, y0, x1, y1 = g.bounds
    dx = {'start': x - x0, 'middle': x - (x0+x1)/2, 'end': x - x1}[anchor]
    return G.move(g, dx, y)

def outline(p, s, x, y, size, color, t=None, anchor='start', fill=None, worn_fx=None, deco=False):
    g, w = Z.lettering(s, size); t = t or size*.035
    g = _place(g, x, y, anchor)
    if not deco: p.boxes.append({'text': s, 'bounds': [round(v, 1) for v in g.bounds], 'anchor': anchor, 'x': x})
    if fill: shape(p, g, fill, fx=worn_fx)
    shape(p, g.difference(G.inset(g, t)), color, fx=worn_fx)
    return g

def solid(p, s, x, y, size, color, anchor='start', fx=None, cut=True):
    g, w = Z.lettering(s, size, cut=cut); g = _place(g, x, y, anchor); shape(p, g, color, fx=fx)
    p.boxes.append({'text': s, 'bounds': [round(v, 1) for v in g.bounds], 'anchor': anchor, 'x': x}); return g

# --- M8 znak rywala: neutralna tarcza + skrót (bez naśladowania cudzego herbu)
def rival(p, x, y, w, short, fill='#1C1C1C', line='#5C5852', ink=C['white']):
    sh = G.union(G.rect(x, y, w, w*.62), G.poly((x, y+w*.62), (x+w, y+w*.62), (x+w/2, y+w*1.12)))
    shape(p, sh, fill); shape(p, G.keyline(sh, w*.04, w*.02), line)
    t, tw = G.text(short, 'display', w*.36, w*.01); x0, y0, x1, y1 = t.bounds
    shape(p, G.move(t, x+w/2-(x0+x1)/2, y+w*.55), ink)

def mark_c(p, name, cx, cy, h, pal='kolor'):
    """Znak wyśrodkowany optycznie (po rzeczywistym obrysie) w (cx, cy), o wysokości h."""
    fn = {'sygnet2': Z.sygnet2, 'herb2': Z.herb2, 'herb2mini': lambda: Z.herb2(mini=True), 'odznaka': Z.odznaka, 'mvp': Z.odznaka_mvp,
          'turniej': lambda: Z.odznaka('III TURNIEJ', 'PUCHAR BURMISTRZA', bot_size=62)}[name]
    L, vb = fn(); allg = G.union(*[g for g, r in L]); x0, y0, x1, y1 = allg.bounds; sc = h/(y1-y0)
    m = Z.PALETY[pal]
    for g, r in L:
        c = m.get(r, r); c = c if c.startswith('#') else Z.COL[c]
        shape(p, G.move(G.scale(g, sc, (0, 0)), cx - (x0+x1)/2*sc, cy - (y0+y1)/2*sc), c)
    box = [cx - (x1-x0)*sc/2, cy - h/2, cx + (x1-x0)*sc/2, cy + h/2]
    p.marks = getattr(p, 'marks', []) + [(name, box)]; return box

def rival_c(p, cx, cy, h, short, **k):
    """Znak rywala wyśrodkowany w (cx, cy), wysokość h (tarcza: szer./wys. = 1/1.12)."""
    w = h/1.12; rival(p, cx - w/2, cy - h/2, w, short, **k)
    box = [cx - w/2, cy - h/2, cx + w/2, cy + h/2]; p.marks = getattr(p, 'marks', []) + [('rywal', box)]; return box

def mark(p, name, x, y, w):
    """Znak marki z znaki2 (herb2/sygnet2/odznaka...) narysowany warstwami."""
    fn = {'sygnet2': Z.sygnet2, 'herb2': Z.herb2, 'odznaka': Z.odznaka, 'mvp': Z.odznaka_mvp,
          'turniej': lambda: Z.odznaka('III TURNIEJ', 'PUCHAR BURMISTRZA', bot_size=62)}[name]
    L, vb = fn(); sc = w/vb[2]
    for g, r in L:
        shape(p, G.move(G.scale(g, sc, (0, 0)), x - vb[0]*sc, y - vb[1]*sc), Z.COL.get(r, r))
    return w, vb[3]*sc
