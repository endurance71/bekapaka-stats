"""Symbole BeKaPaKa. Każda funkcja zwraca listę warstw [(kształt, rola_koloru)] na własnej siatce.
Role kolorów: 'ink' (czerń / biel w negatywie), 'red', 'gold', 'paper'."""
import math
from geo import *

PAL = {  # role: shield (tarcza/szwy), red (V), gold (piłka), ink (litery), paper (tło w środku pieczęci), rim (obwódka)
    'kolor':   {'shield': '#0B0B0B', 'red': '#EF1734', 'gold': '#F4A816', 'ink': '#0B0B0B', 'paper': '#F7F6F2', 'rim': '#F4A816'},
    'negatyw': {'shield': '#0B0B0B', 'red': '#EF1734', 'gold': '#F4A816', 'ink': '#F7F6F2', 'paper': '#F7F6F2', 'rim': '#F7F6F2'},
    'czarny':  {'shield': '#0B0B0B', 'red': '#F7F6F2', 'gold': '#F7F6F2', 'ink': '#0B0B0B', 'paper': '#F7F6F2', 'rim': '#0B0B0B'},
    'bialy':   {'shield': '#F7F6F2', 'red': '#0B0B0B', 'gold': '#0B0B0B', 'ink': '#F7F6F2', 'paper': '#0B0B0B', 'rim': '#F7F6F2'}}
BAR = {'kolor': 'red', 'negatyw': 'red', 'czarny': 'ink', 'bialy': 'ink'}

# ---------- SYGNET (siatka 1000) : piłka z herbu + schodkowa tarcza z herbu + skrzydła V ze stroju
def ball(cx, cy, r, seam):
    b = circle(cx, cy, r)
    lines = union(rect(cx-seam/2, cy-r, seam, 2*r), rect(cx-r, cy-seam/2, 2*r, seam))
    side = union(ring(cx-r*1.62, cy, r*1.32+seam/2, seam), ring(cx+r*1.62, cy, r*1.32+seam/2, seam))
    return b, inter(union(lines, side), b)

def wing_left(top_x0, top_y0, tip_x, width, bottom_y, kink=True):
    """Lewe skrzydło-ramię V: górna krawędź 24° w dół do osi, krawędzie boczne 66°."""
    tip_y = top_y0 + (tip_x-top_x0)*A24
    k = 1/A66                                           # dx na dy dla krawędzi 66°
    inner_bot = (tip_x + (bottom_y-tip_y)*k, bottom_y)
    o_top = (tip_x-width, tip_y-width*A24)
    outer_bot = (o_top[0] + (bottom_y-o_top[1])*k, bottom_y)
    arm = poly(o_top, (tip_x, tip_y), inner_bot, outer_bot)
    if kink:                                            # wcięcie-błyskawica: pas 24° + ostrze 66°
        t = width*.13; y1 = tip_y + width*.42
        a = (o_top[0] + (y1-o_top[1])*k + width*.18, y1)
        b = (tip_x - width*.30 + (y1-tip_y)*k, y1 + (width*.70)*A24*0)
        s1 = poly(a, (b[0], a[1] + (b[0]-a[0])*A24), (b[0], a[1] + (b[0]-a[0])*A24 + t), (a[0], a[1]+t))
        bx, by = b[0], a[1] + (b[0]-a[0])*A24
        s2 = poly((bx, by), (bx+t*1.1, by), (bx + width*.22 + (width*.9)*k*.0, by + width*.95), )
        arm = diff(arm, union(s1, s2))
    return arm

def sygnet(slit=True):
    cx = 500; top = 470; bot = 1000
    rim = circle(cx, 330, 300)
    steps = poly((60, top+90), (60, top), (140, top), (140, top-70), (220, top-70), (220, top-140),
                 (780, top-140), (780, top-70), (860, top-70), (860, top), (940, top), (940, top+90))
    body = poly((60, top), (940, top), (940, 700), (cx, bot), (60, 700))
    shield = union(steps, body)
    silhouette = union(rim, shield)
    # ramiona V: pas wzdłuż boków tarczy; wewnętrzna krawędź 66°, górna krawędź 24° w dół do osi
    ix = 380; ky = 1/A66
    inner_l = poly((-200, top-40), (ix, top+(ix-60)*A24), (ix+(2000)*ky, top+(ix-60)*A24+2000), (-200, 3000))
    arm_top = poly((0, top+8-60*A24), (cx, top+8+(cx-60)*A24), (cx, 3000), (0, 3000))
    left = inter(inter(body, inner_l), arm_top)
    if slit:   # wcięcie-błyskawica: pas 24° równoległy do górnej krawędzi
        y0 = top+70; t = 20
        cut = poly((40, y0), (ix-48, y0+(ix-88)*A24), (ix-48, y0+(ix-88)*A24+t), (40, y0+t))
        left = diff(left, cut)
    right = mirror_x(left, cx)
    v = union(left, right)
    b, seams = ball(cx, 330, 255, 30)
    return [(silhouette, 'shield'), (v, 'red'), (circle(cx, 330, 300), 'shield'), (b, 'gold'), (seams, 'shield')]

# ---------- PRZECIĘCIA PASKAMI STROJU (wspólny motyw liter i cyfr)
SKEW = 9          # pochylenie w ruchu (stopnie)
def stripe_cut(shape, cap, base, n=1, t=.035, start=.66, gap=.10):
    """Odejmij n poziomych pasków (jak paski koszulki) w dolnej części znaków.
    start/gap: położenie od góry wersalika (0 = góra, 1 = linia bazowa)."""
    cuts = [rect(-5000, base - cap + cap*(start+i*gap), 20000, cap*t) for i in range(n)]
    return diff(shape, *cuts)

def lettering(s, size, tracking=-.01, cut=True, n=1):
    p, w = text(s, 'display', size, tracking*size)
    cap = size*.70
    if cut: p = stripe_cut(p, cap, 0, n=n)
    return skew(p, SKEW, 0), w

# ---------- WORDMARK
def wordmark(sub=True):
    W, w = lettering('BEKAPAKA', 300)
    W = move(W, 0, 300*.70)                 # linia bazowa na y = cap
    layers = [(W, 'ink')]
    if sub:
        cap = 300*.70; y = cap + 74
        S, sw = text('B O B O L I C E', 'label', 46, 6)
        S = move(S, (w - sw)/2 + 10, y)
        tick = lambda x0, flip: poly((x0, y-30), (x0+150, y-30), (x0+150+ (24 if not flip else -24), y-18), (x0+(24 if not flip else -24), y-18))
        bars = union(rect(14, y-30, (w-sw)/2-40, 10), rect((w+sw)/2+30, y-30, (w-sw)/2-40, 10))
        layers += [(S, 'ink'), (bars, 'bar')]
    return layers, w

# ---------- MONOGRAM BKPK (blok 2×2)
def monogram():
    size = 520; g = 18
    B, wb = text('B', 'display', size); K, wk = text('K', 'display', size); P, wp = text('P', 'display', size)
    cap = size*.70; col = max(wb, wk, wp)
    def cell(gl, w, cx, cy): return move(gl, cx + (col-w)/2, cy + cap)
    row1 = stripe_cut(union(cell(B, wb, 0, 0), cell(K, wk, col+g, 0)), cap, cap)
    row2 = stripe_cut(union(cell(P, wp, 0, cap+g), cell(K, wk, col+g, cap+g)), cap, 2*cap+g)
    m = union(row1, row2)
    m = skew(m, SKEW, (cap*2+g)/2)
    frame = diff(rect(-44, -44, 2*col+g+88, 2*cap+g+88), rect(-26, -26, 2*col+g+52, 2*cap+g+52))
    frame = skew(frame, SKEW, (cap*2+g)/2)
    return [(m, 'ink'), (frame, 'bar')], 2*col+g, 2*cap+g

# ---------- CYFRY BKPK
def numerals(s, size=400):
    p, w = lettering(s, size, tracking=.0)
    return move(p, 0, size*.70), w

# ---------- ZNAK V (czerwone skrzydła sygnetu jako samodzielny symbol)
def znak_v():
    L = sygnet(); v = L[1][0]
    v = diff(v, circle(500, 330, 300))
    x0, y0, x1, y1 = v.bounds
    return [(move(v, -x0, -y0), 'red')], x1-x0, y1-y0

def _old_skrzydlo():
    L = poly((0, 0), (260, 260*A24), (260+90, 260*A24 + 90*A66*0), (260+90-60, 260*A24+150), (0, 150))
    left = poly((0, 0), (300, 300*A24), (300 - 0, 300*A24 + 110), (0, 110))
    cut = poly((30, 52), (230, 52+200*A24), (230, 52+200*A24+16), (30, 68))
    left = diff(left, cut)
    right = mirror_x(left, 330)
    tip = poly((300, 300*A24), (360, 300*A24), (330, 300*A24+110/A66*0+68))
    return [(union(left, right), 'red')]

# ---------- PIECZĘĆ
def seal(r=500, txt='BEKAPAKA · BOBOLICE · KOSZYKÓWKA · '):
    outer = ring(r, r, r, 26); inner = ring(r, r, r-150, 8)
    band = diff(circle(r, r, r-36), circle(r, r, r-140))
    f = FONTS['label']; gs = f.getGlyphSet(); cm = f.getBestCmap(); upm = f['head'].unitsPerEm
    size = 70; sc = size/upm; rr = r-112
    base_adv = [f['hmtx'][cm[ord(c)]][0]*sc for c in txt]; extra = (2*math.pi*rr - sum(base_adv))/len(txt)
    adv = [a0 + extra for a0 in base_adv]; total = sum(adv)
    out = pathops.Path(); ang = -math.pi/2 - (total/rr)/2*0 
    a = -math.pi/2
    for ch, aw in zip(txt, adv):
        theta = a + (aw/2)/rr
        g = cm[ord(ch)]
        ca, sa = math.cos(theta + math.pi/2), math.sin(theta + math.pi/2)
        px, py = r + rr*math.cos(theta), r + rr*math.sin(theta)
        # glif: środek na okręgu, pionowo na zewnątrz
        gx = -(aw-extra)/2
        pen = TransformPen(out.getPen(glyphSet=gs), (sc*ca, sc*sa, sc*sa, -sc*ca, px + gx*ca, py + gx*sa))
        gs[g].draw(pen); a += aw/rr
    out.simplify()
    syg = sygnet(); inner_r = r-160; s = inner_r*1.55/1000
    syg = [(scale(move(pth, 0, 0), s, 0, 0), role) for pth, role in syg]
    syg = [(move(pth, r - 500*s, r - 520*s), role) for pth, role in syg]
    return [(circle(r, r, r), 'shield'), (outer, 'red'), (out, 'paper'), (inner, 'red')] + syg

# ---------- UKŁADY LOGO
def lockup_h():
    """Poziomy: sygnet | wordmark."""
    S = sygnet(); sc = 360/1000
    syg = [(scale(p, sc), r) for p, r in S]
    W, w = wordmark()
    wm = [(move(scale(p, .82), 420, 30), r) for p, r in W]
    return syg + wm, int(420 + w*.82 + 40), 360

def lockup_v():
    """Pionowy: sygnet nad wordmarkiem."""
    S = sygnet(); W, w = wordmark(); sc = .62
    syg = [(move(scale(p, sc), (w - 1000*sc)/2, 0), r) for p, r in S]
    wm = [(move(p, 0, 1000*sc + 70), r) for p, r in W]
    return syg + wm, int(w+60), int(1000*sc + 70 + 300)

# ---------- IKONY (siatka 96, wypełnione kształty, narożniki ścięte)
def chamf(x, y, w, h, c):
    return poly((x+c, y), (x+w, y), (x+w, y+h-c), (x+w-c, y+h), (x, y+h), (x, y+c))
def outline(x, y, w, h, t, c=10):
    return diff(chamf(x, y, w, h, c), chamf(x+t, y+t, w-2*t, h-2*t, max(c-t*.6, 2)))
def ikony():
    T = 9
    kal = union(outline(8, 18, 80, 70, T), rect(8, 18, 80, 22), rect(26, 8, 10, 20), rect(60, 8, 10, 20), rect(24, 52, 14, 12), rect(44, 52, 14, 12), rect(64, 52, 14, 12))
    zeg = union(ring(48, 48, 40, T), rect(44, 22, 9, 30), poly((48, 44), (70, 58), (66, 65), (44, 52)))
    pin = diff(union(circle(48, 38, 30), poly((22, 52), (74, 52), (48, 90))), circle(48, 38, 12))
    b, se = ball(48, 48, 40, 7); pil = diff(b, se)
    kosz = union(poly((14, 14), (30, 10), (40, 26), (56, 26), (66, 10), (82, 14), (78, 40), (76, 88), (20, 88), (18, 40)))
    kosz = diff(kosz, poly((34, 40), (48, 70), (62, 40), (54, 40), (48, 54), (42, 40)))
    puch = union(poly((22, 10), (74, 10), (68, 50), (48, 62), (28, 50)), ring(22, 28, 16, 7), ring(74, 28, 16, 7), rect(43, 60, 10, 16), rect(28, 76, 40, 12))
    puch = diff(puch, rect(22-16, 12, 16, 34), rect(74, 12, 16, 34))
    puch = union(puch, diff(ring(22, 28, 16, 7), rect(22, 0, 40, 96)), diff(ring(74, 28, 16, 7), rect(34, 0, 40, 96)))
    star = poly(*[(48 + (42 if i % 2 == 0 else 18)*math.cos(-math.pi/2 + i*math.pi/5), 50 + (42 if i % 2 == 0 else 18)*math.sin(-math.pi/2 + i*math.pi/5)) for i in range(10)])
    bil = diff(chamf(6, 24, 84, 48, 8), circle(6, 48, 10), circle(90, 48, 10), *[rect(60, 30+i*10, 4, 6) for i in range(4)])
    return [('data', kal), ('godzina', zeg), ('hala', pin), ('mecz', pil), ('sklad', kosz), ('turniej', puch), ('mvp', star)]

def export(name, layers, w, h, pal='kolor', bg=None, rim=0):
    P = dict(PAL[pal]); P['bar'] = P[BAR[pal]]; out = []
    body = (f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else '')
    for i, (p, role) in enumerate(layers):
        stroke = f' stroke="{P["rim"]}" stroke-width="{rim}" paint-order="stroke"' if rim and i == 0 else ''
        body += f'<path d="{d(p)}" fill="{P[role]}"{stroke}/>'
    pad = rim
    (SYSTEM/'symbole'/'svg').mkdir(exist_ok=True)
    (SYSTEM/'symbole'/'svg'/f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {w+2*pad} {h+2*pad}" width="{w+2*pad}" height="{h+2*pad}">{body}</svg>\n')

# ---------- WZORY
import random
def _svg_raw(name, w, h, body):
    (SYSTEM/'symbole'/'svg'/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')

def wzor_skrzydla(w=1080, h=1080, bg='#0B0B0B', fg='#3A0A12', step=150):
    v = znak_v()[0][0][0]; x0, y0, x1, y1 = v.bounds; sc = (step*.78)/(x1-x0)
    dv = d(scale(v, sc)); body = f'<rect width="100%" height="100%" fill="{bg}"/>'
    rows = int(h/(step*.55))+2
    for r in range(-1, rows):
        for c in range(-1, int(w/step)+2):
            x = c*step + (step/2 if r % 2 else 0); y = r*step*.55
            body += f'<path transform="translate({x:.0f} {y:.0f})" d="{dv}" fill="{fg}"/>'
    return body

def wzor_paski(w=1080, h=1080, bg='#0B0B0B', fg='#EF1734'):
    body = f'<rect width="100%" height="100%" fill="{bg}"/>'
    n = 16
    for i in range(n):
        y = h*.25 + i*(h*.75/n); a = .08 + .92*(i/(n-1))**1.6
        body += f'<rect x="0" y="{y:.0f}" width="{w}" height="{6+i*.5:.1f}" fill="{fg}" opacity="{a:.2f}"/>'
    return body

def wzor_pekniecia(w=1080, h=1080, bg='#173EA5', fg='#FF7A18', seed=24):
    """Strój B: pomarańczowe pęknięcia/błyskawice rozgałęziające się od dołu."""
    rnd = random.Random(seed); lines = []
    def grow(x, y, ang, width, depth):
        while width > .8 and y > -50:
            L = rnd.uniform(18, 46); ang += rnd.uniform(-.45, .45); ang = max(-2.6, min(-.55, ang))
            nx, ny = x + L*math.cos(ang), y + L*math.sin(ang)
            lines.append((x, y, nx, ny, width)); x, y = nx, ny; width *= .93
            if rnd.random() < .16 and depth < 6:
                grow(x, y, ang + rnd.choice([-1, 1])*rnd.uniform(.5, 1.0), width*.65, depth+1)
    for k in range(5):
        grow(rnd.uniform(.1, .9)*w, h+20, -math.pi/2 + rnd.uniform(-.35, .35), rnd.uniform(9, 14), 0)
    body = f'<rect width="100%" height="100%" fill="{bg}"/>'
    body += ''.join(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{e:.1f}" stroke="{fg}" stroke-width="{wd:.1f}" stroke-linecap="round"/>' for a, b, c, e, wd in lines)
    return body

def wzor_monogram(w=1080, h=1080, bg='#EF1734', fg='#D3122C'):
    MG, mw, mh = monogram(); m = scale(MG[0][0], .16); dm = d(m)
    body = f'<rect width="100%" height="100%" fill="{bg}"/>'
    sx, sy = mw*.16+70, mh*.16+60
    for r in range(-1, int(h/sy)+2):
        for c in range(-1, int(w/sx)+2):
            body += f'<path transform="translate({c*sx + (sx/2 if r % 2 else 0):.0f} {r*sy:.0f})" d="{dm}" fill="{fg}"/>'
    return body

if __name__ == '__main__':
    import shutil; shutil.rmtree(SYSTEM/'symbole'/'svg', ignore_errors=True)
    L = sygnet()
    for pal, rim in (('kolor', 0), ('negatyw', 16), ('czarny', 0), ('bialy', 0)):
        export(f'sygnet-{pal}', L, 1000, 1000, pal, rim=rim)
    WM, w = wordmark()
    for pal in PAL: export(f'wordmark-{pal}', WM, int(w+60), 300, pal)
    LH, w, h = lockup_h(); LV, wv, hv = lockup_v()
    for pal, rim in (('kolor', 0), ('negatyw', 7), ('czarny', 0), ('bialy', 0)):
        export(f'logo-poziome-{pal}', LH, w, h, pal, rim=rim); export(f'logo-pionowe-{pal}', LV, wv, hv, pal, rim=rim)
    MG, mw, mh = monogram()
    for pal in PAL: export(f'monogram-{pal}', [(move(p, 150, 70), r) for p, r in MG], int(mw+300), int(mh+140), pal)
    N, nw = numerals('0123456789'); export('cyfry', [(N, 'ink')], int(nw+80), 300)
    ZV, zw, zh = znak_v(); export('znak-v', ZV, int(zw), int(zh))
    SE = seal(); export('pieczec-kolor', SE, 1000, 1000)
    # ikony: patrz ikony2.py (rodzina 2.0)
    _svg_raw('wzor-skrzydla', 1080, 1080, wzor_skrzydla())
    _svg_raw('wzor-paski', 1080, 1080, wzor_paski())
    _svg_raw('wzor-pekniecia-B', 1080, 1080, wzor_pekniecia())
    _svg_raw('wzor-monogram', 1080, 1080, wzor_monogram())
