"""Świat materiałowy (kierunek v9): czarna płyta z parkietem, wzór stroju malowany zużytą farbą,
przecierane litery. Tekstury: 02_system/materialy/ (przygotuj.py, zuzycie.py)."""
import base64
from poster import el, C, SYSTEM
import kit
MAT = SYSTEM/'materialy'

def _uri(name):
    return 'data:image/png;base64,' + base64.b64encode((MAT/name).read_bytes()).decode()

def plate(p, name='plyta-czysta.png', y=0, h=None):
    p.image(MAT/name, 0, y, p.w, h or p.h)

def ink(p, shadow=True):
    """Filtr przetartego nadruku (+ cień pod literą na czerni; bez cienia na papierze). Zwraca id do Poster.text(fx=...)."""
    fid = 'nadruk' if shadow else 'nadruk-papier'
    if fid in getattr(p, '_inks', set()): return fid
    p._inks = getattr(p, '_inks', set()) | {fid}
    f = el('filter', id=fid, filterUnits='userSpaceOnUse', x=0, y=0, width=p.w, height=p.h, color_interpolation_filters='sRGB')
    f.append(el('feImage', href=_uri('przetarcia-liter.png'), x=0, y=0, width=1080, height=1920, preserveAspectRatio='none', result='tex'))
    f.append(el('feColorMatrix', in_='tex', type='matrix', values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0', result='zdarte'))
    f.append(el('feComposite', in_='SourceGraphic', in2='zdarte', operator='out', result='druk'))
    if not shadow: p.defs.append(f); return fid
    f.append(el('feGaussianBlur', in_='SourceAlpha', stdDeviation=9, result='b'))
    f.append(el('feOffset', in_='b', dx=0, dy=8, result='o'))
    f.append(el('feFlood', flood_color='#000000', flood_opacity=.8, result='k'))
    f.append(el('feComposite', in_='k', in2='o', operator='in', result='cien'))
    m = el('feMerge'); m.append(el('feMergeNode', in_='cien')); m.append(el('feMergeNode', in_='druk')); f.append(m)
    p.defs.append(f); return fid

def _layer_shadow(p):
    if getattr(p, '_lsh', None): return p._lsh
    f = el('filter', id='cien-warstwy', x='-20%', y='-20%', width='140%', height='140%')
    f.append(el('feGaussianBlur', in_='SourceAlpha', stdDeviation=16, result='b'))
    f.append(el('feOffset', in_='b', dx=6, dy=14, result='o'))
    f.append(el('feFlood', flood_color='#000000', flood_opacity=.85, result='k'))
    f.append(el('feComposite', in_='k', in2='o', operator='in', result='cien'))
    m = el('feMerge'); m.append(el('feMergeNode', in_='cien')); m.append(el('feMergeNode', in_='SourceGraphic')); f.append(m)
    p.defs.append(f); p._lsh = 'cien-warstwy'; return p._lsh

def _tex(p):
    if not getattr(p, '_tex', None):
        p.defs.append(el('image', id='zuzycie', href=_uri('zuzycie-farby.png'), x=0, y=0, width=1080, height=1920, preserveAspectRatio='none'))
        p._tex = 'zuzycie'
    return p._tex

_n = [0]
def paint(p, d, color=None, light=True):
    """Kształt (ścieżka d) jako zużyta farba: cień warstwy → kolor → przetarcia → światło z góry."""
    _n[0] += 1; cid = f'farba{_n[0]}'
    p.g.append(el('path', d=d, fill=color or C['red'], fill_rule='evenodd', filter=f'url(#{_layer_shadow(p)})'))
    p.clip(cid, ('path', dict(d=d, clip_rule='evenodd')))
    g = el('g', clip_path=f'url(#{cid})'); p.g.append(g)
    g.append(el('use', href='#'+_tex(p)))
    if light:
        gid = p.fade(cid+'-sw', 0, 0, 0, p.h, [(0, '#FFFFFF', .14), (.5, '#FFFFFF', 0), (1, '#000000', .45)])
        g.append(el('rect', x=0, y=0, width=p.w, height=p.h, fill=gid))

def kit_front(p, ox, oy, s, stripes=True, stripe_span=None):
    """Przód stroju A w zużytej farbie: paski (cieńsze, przetarte) → skrzydła/ramiona V z wcięciem."""
    if stripes:
        a, b = stripe_span or (ox, ox+1100*s)
        d = ''
        for i, y in enumerate(kit.STRIPES):
            yy = oy+y*s; t = 11*s
            d += f'M {a} {yy} L {b} {yy} L {b} {yy+t} L {a} {yy+t} Z '
        paint(p, d, light=False)
    d = kit._path([(kit.OUTER, False), (kit.KINK, False), (kit.OUTER, True), (kit.KINK, True)], ox, oy, s)
    paint(p, d)
    for mir in (False, True):
        p.g.append(el('polygon', points=kit._pts(kit.SHADE, ox, oy, s, mir), fill='#000000', opacity=.28))

def kit_back(p, ox, oy, s):
    L = [(0, 120), (250, 120), (550, 1000), (550, 1224), (300, 1224), (0, 480)]
    paint(p, kit._path([(L, False), (L, True)], ox, oy, s))

def stripes(p, x0, x1, ys, t=10, fade=(.25, 1)):
    for i, y in enumerate(ys):
        g = el('g', opacity=round(fade[0]+(fade[1]-fade[0])*i/max(1, len(ys)-1), 2)); p.g.append(g); prev, p.g = p.g, g
        paint(p, f'M {x0} {y} L {x1} {y} L {x1} {y+t} L {x0} {y+t} Z', light=False); p.g = prev
