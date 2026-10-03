"""Wzór stroju A (przód i plecy) jako wektor, odrysowany z 04_fotografia/.../stroj-A-przod.jpeg
(02_system/kit/source/trace_kit.py → maska-lewa.png). Układ kanoniczny: szerokość 1100
(oś x=550), wysokość 1224, y=0 = górny róg skrzydła przy szwie."""
from poster import el, C

# lewa połowa; prawa = lustro względem x=550
OUTER = [(20, 30), (330, 170), (372, 690), (550, 1100), (550, 1224), (340, 1224), (0, 500), (0, 250)]
KINK = [(84, 194), (220, 280), (366, 684), (205, 330), (130, 296)]          # wcięcie-błyskawica
SHADE = [(0, 250), (130, 296), (205, 330), (300, 560), (0, 520)]            # półprzezroczysta warstwa jak na tkaninie
STRIPES = [630, 717, 804, 891, 983, 1075, 1172]                            # paski stroju (rosnące krycie w dół)
NECK = 'M 330 -330 C 380 -150 720 -150 770 -330'                          # dekolt (nad skrzydłami)

def _pts(pts, ox, oy, s, mirror=False):
    return ' '.join(f'{ox+((1100-x) if mirror else x)*s:.1f},{oy+y*s:.1f}' for x, y in pts)

def _path(polys, ox, oy, s):
    d = ''
    for pts, mir in polys:
        d += 'M ' + ' L '.join(f'{ox+((1100-x) if mir else x)*s:.1f} {oy+y*s:.1f}' for x, y in pts) + ' Z '
    return d

def stripes(p, ox, oy, s, x0=None, x1=None, fade=(.18, 1), thick=11, ys=STRIPES, color=None):
    x0 = ox if x0 is None else x0; x1 = ox+1100*s if x1 is None else x1
    n = len(ys)
    for i, y in enumerate(ys):
        a = fade[0] + (fade[1]-fade[0])*i/max(1, n-1)
        p.rect(x0, oy+y*s, x1-x0, thick*s, color or C['red'], opacity=round(a, 2))

def front(p, ox, oy, s, with_stripes=True, stripe_span=None, shade=True, opacity=1):
    """Pełny przód stroju A: paski → czerwona masa z wcięciem → warstwa cienia."""
    if with_stripes:
        a, b = stripe_span or (ox, ox+1100*s); stripes(p, ox, oy, s, a, b)
    d = _path([(OUTER, False), (KINK, False), (OUTER, True), (KINK, True)], ox, oy, s)
    p.g.append(el('path', d=d, fill=C['red'], fill_rule='evenodd', opacity=opacity))
    if shade:
        for mir in (False, True):
            p.g.append(el('polygon', points=_pts(SHADE, ox, oy, s, mir), fill='#000000', opacity=.22))

def back(p, ox, oy, s, with_stripes=True, opacity=1):
    """Plecy: szerokie V od ramion + paski (bez skrzydeł)."""
    if with_stripes: stripes(p, ox, oy, s, ys=[300, 390, 480, 570, 660, 750, 840, 930, 1020, 1110], fade=(.1, 1))
    L = [(0, 120), (250, 120), (550, 1000), (550, 1224), (300, 1224), (0, 480)]
    d = _path([(L, False), (L, True)], ox, oy, s)
    p.g.append(el('path', d=d, fill=C['red'], opacity=opacity))

def piping(p, x, y, w, h, t=10):
    """Lamówka: czerwona krawędź jak przy podkroju i szwie."""
    p.rect(x, y, t, h, C['red']); p.rect(x+w-t, y, t, h, C['red'])

def neckline(p, cx, y, w, depth, t=16):
    p.g.append(el('path', d=f'M {cx-w/2} {y} C {cx-w/2+w*.08} {y+depth*1.3} {cx+w/2-w*.08} {y+depth*1.3} {cx+w/2} {y}',
                  fill='none', stroke=C['red'], stroke_width=t, stroke_linecap='butt'))

def fabric(p, id='fabric', opacity=.07, vignette=.55):
    """Faktura dzianiny (szum) + winieta; daje głębię zamiast płaskiej czerni."""
    f = el('filter', id=id, x=0, y=0, width='100%', height='100%')
    f.append(el('feTurbulence', type='fractalNoise', baseFrequency='0.85 0.55', numOctaves=2, seed=7, result='n'))
    f.append(el('feColorMatrix', type='saturate', values=0))
    p.defs.append(f)
    p.rect(0, 0, p.w, p.h, '#FFFFFF', filter=f'url(#{id})', opacity=opacity)
    r = el('radialGradient', id=id+'-v', cx='50%', cy='42%', r='75%')
    r.append(el('stop', offset='55%', stop_color='#000000', stop_opacity=0)); r.append(el('stop', offset='100%', stop_color='#000000', stop_opacity=vignette))
    p.defs.append(r); p.rect(0, 0, p.w, p.h, f'url(#{id}-v)')

def hem(p, y, h=None, color=None):
    """Dół koszulki: czarny pas z czerwoną lamówką — miejsce na stopkę."""
    h = h or p.h-y; p.rect(0, y, p.w, h, color or C['black']); p.rect(0, y, p.w, 6, C['red'])

JERSEY = ('M 44 0 L 72 0 C 80 34 120 34 128 0 L 156 0 C 158 42 170 70 196 86 L 196 260 L 4 260 L 4 86 '
          'C 30 70 42 42 44 0 Z')   # koszulka bez rękawów 200×260: ramiączka 44–72 / 128–156, dekolt do y≈26, podkroje do y=86

def jersey(p, x, y, w, number, name, back_ink=None, acc=None):
    """Mini koszulka (plecy): czarna, czerwone V i paski, nazwisko i numer (acc: kolor akcentu, np. strój B)."""
    acc = acc or C['red']
    s = w/200; cid = f'j{int(x)}{int(y)}'
    p.clip(cid, ('path', dict(d=JERSEY, transform=f'translate({x} {y}) scale({s})')))
    g = el('g', clip_path=f'url(#{cid})'); p.g.append(g); prev, p.g = p.g, g
    p.rect(x, y, w, 260*s, back_ink or C['black'])
    for i, yy in enumerate(range(150, 260, 22)): p.rect(x, y+yy*s, w, 4*s, acc, opacity=.35+.13*i)
    p.poly([(x+4*s, y+120*s), (x+56*s, y+120*s), (x+100*s, y+232*s), (x+144*s, y+120*s), (x+196*s, y+120*s), (x+100*s, y+300*s)], acc)
    p.g = prev
    p.g.append(el('path', d=JERSEY, transform=f'translate({x} {y}) scale({s})', fill='none', stroke=acc, stroke_width=6))
