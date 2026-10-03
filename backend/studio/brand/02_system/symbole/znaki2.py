"""Znaki BeKaPaKa v2: herb 2.0 (pełny), sygnet 2.0 (bez tekstu), odznaka okrągła.
Konstrukcja na siatce 1000; obrysy i linie wewnętrzne przez dokładny offset (geo2)."""
import math
from geo2 import *

COL = {'ink': '#0B0B0B', 'red': '#EF1734', 'redMid': '#C8102E', 'redDark': '#A50F25', 'gold': '#F4A816', 'goldDark': '#B47A06', 'paper': '#F7F6F2'}
STRIPE_CUT = dict(start=.66, t=.035)

def lettering(s, size, tracking=-.01, cut=True, sk=9):
    g, w = text(s, 'display', size, tracking*size)
    cap = size*.70
    if cut: g = g.difference(rect(-5000, -cap + cap*STRIPE_CUT['start'], 20000, cap*STRIPE_CUT['t']))
    return skew(g, sk), w

def ball(cx, cy, r, seam):
    b = circle(cx, cy, r)
    lines = union(rect(cx-seam/2, cy-r, seam, 2*r), rect(cx-r, cy-seam/2, 2*r, seam))
    side = union(ring(cx-r*1.62, cy, r*1.32+seam/2, seam), ring(cx+r*1.62, cy, r*1.32+seam/2, seam))
    return b, lines.union(side).intersection(circle(cx, cy, r + 8))   # szwy wchodzą pod obręcz: bez nitek na krawędzi

def wings(cx, top, bottom_apex, half_w, arm, notch_top_w, region):
    """Skrzydła V ze stroju w obszarze `region`: górna krawędź 24° w dół do osi, wewnętrzne krawędzie 66°.
    Zwraca (ramiona, warstwa cienia przesunięta jak przezroczyste warstwy na koszulce, wcięcia)."""
    ix = cx - notch_top_w/2; iy = top + (ix-(cx-half_w))*A24
    k = 1/A66
    inner = poly((cx-half_w-400, top-400), (ix, iy), (ix + 4000*k, iy+4000), (cx-half_w-400, iy+4000))
    under_top = poly((cx-half_w-400, top - 400*A24), (cx, top + half_w*A24), (cx, 5000), (cx-half_w-400, 5000))
    left = inner.intersection(under_top).intersection(region)
    right = mirror_x(left, cx)
    v = union(left, right).intersection(region)
    # wcięcie-błyskawica (pas 24°) w każdym skrzydle
    y0 = top + 70; t = 16; x0 = cx-half_w-40; x1 = cx
    cutL = poly((x0, y0 + (x0-(cx-half_w))*A24), (x1, y0 + (x1-(cx-half_w))*A24), (x1, y0 + (x1-(cx-half_w))*A24 + t), (x0, y0 + (x0-(cx-half_w))*A24 + t))
    cuts = union(cutL, mirror_x(cutL, cx))
    # warstwa cienia: to samo V przesunięte w dół (jak druga, ciemniejsza warstwa na koszulce)
    shade = move(v, 0, 34).intersection(region).difference(v)
    pieces = v.difference(cuts)
    lineL = poly((x0-2000, y0 + (x0-2000-(cx-half_w))*A24), (cx, y0 + (cx-(cx-half_w))*A24), (cx, -5000), (x0-2000, -5000))
    upper_zone = union(lineL, mirror_x(lineL, cx))
    return pieces.intersection(upper_zone), pieces.difference(upper_zone), shade

def herb2(text_main='BEKAPAKA', text_sub='BOBOLICE', mini=False):
    """mini=True: wersja do 64–160 px — bez linii wewnętrznych, pasków, cienia i przecięć; grubsze szwy."""
    cx = 500
    ringo = circle(cx, 300, 285)
    step1 = rect(175, 205, 650, 200); step2 = rect(115, 265, 770, 150)
    band = rect(20, 335, 960, 190)
    shield = poly((115, 520), (885, 520), (885, 680), (cx, 945), (115, 680))
    sil = union(ringo, step1, step2, band, shield).buffer(1, **MITRE).buffer(-1, **MITRE)   # zamknij mikroszczeliny łączeń
    L = []
    L.append((outset(sil, 22 if mini else 16), 'gold'))                 # zewnętrzna złota obwódka
    L.append((sil, 'ink'))
    # piłka (widoczna nad pasem nazwy)
    b, seams = ball(cx, 300, 228, 36 if mini else 26)
    vis = rect(0, 0, 1000, 335 - 22)
    L += [(b.intersection(vis), 'gold'), (seams.intersection(vis), 'ink')]
    # skrzydła V + paski w tarczy
    region = inset(shield, 22)
    vu, vl, shade = wings(cx, 640, 900, 330, 120, 120, region); v = union(vu, vl)
    for i, y in enumerate(() if mini else (730, 768, 806, 844)):
        L.append((clean(rect(0, y, 1000, 7).intersection(region).difference(v)), 'redDark'))
    if mini:   # wcięcie zamknięte, jeden ton, bez cienia
        vu = union(vu, vl).buffer(10, **MITRE).buffer(-10, **MITRE).intersection(region); vl = Polygon(); shade = Polygon()
    L += [(clean(shade), 'redDark'), (clean(vl), 'redMid'), (clean(vu), 'red')]
    # wstęga BOBOLICE z zawiniętymi końcami
    RY = 515                                                                    # górna krawędź wstęgi
    tail = poly((168, RY+19), (232, RY+19), (232, RY+113), (168, RY+113), (190, RY+66))   # koniec wstęgi z wcięciem
    fold = poly((205, RY+95), (232, RY+113), (232, RY+95))                                # zagięcie (cień)
    tails = union(tail, mirror_x(tail, cx))
    rib = poly((205, RY), (795, RY), (795, RY+95), (205, RY+95))
    L += [(tails, 'goldDark'), (union(fold, mirror_x(fold, cx)), 'ink')]
    L += [(rib, 'gold')]
    st, sw = text(text_sub if not mini else '', 'display', 74, 10) if not mini else (Polygon(), 0)
    if not st.is_empty:
        L.append((center_in(st, 205, RY, 795, RY+95), 'ink'))                 # BOBOLICE: równe odstępy we wstędze
    # nazwa w pasie
    wm, ww = lettering(text_main, 164 if mini else 150, cut=not mini)
    # pole widoczne pasa: od dolnej krawędzi górnej linii (335+14+6) do górnej krawędzi wstęgi (RY)
    L.append((center_in(wm, 34, 335 + (0 if mini else 20), 966, RY), 'paper'))
    # linie wewnętrzne: wokół całości i pasa
    if not mini:
        L.append((keyline(sil, 14, 6), 'gold'))
        L.append((keyline(band, 14, 6).difference(outset(rib, 8)), 'gold'))
    return L, (-30, -30, 1060, 1020)

def raport_herbu(L):
    out = {}
    for g, r in L:
        if r == 'paper': out['BEKAPAKA w pasie'] = pads(g, 34, 355, 966, 515)
        if r == 'ink' and not g.is_empty and 525 < g.bounds[1] and g.bounds[3] < 610: out['BOBOLICE we wstędze'] = pads(g, 205, 515, 795, 610)
    return out

def sygnet2():
    cx = 500
    ringo = circle(cx, 330, 300)
    step1 = rect(205, 230, 590, 230); step2 = rect(130, 300, 740, 160)
    shield = poly((60, 440), (940, 440), (940, 660), (cx, 975), (60, 660))
    sil = union(ringo, step1, step2, shield).buffer(1, **MITRE).buffer(-1, **MITRE)
    L = [(outset(sil, 16), 'gold'), (sil, 'ink')]
    region = inset(shield, 24)
    vu, vl, shade = wings(cx, 470, 940, 440, 140, 240, region); v = union(vu, vl)
    for y in (620, 665, 710, 755, 800):
        L.append((clean(rect(0, y, 1000, 8).intersection(region).difference(v)), 'redDark'))
    hole = circle(cx, 330, 300)
    L += [(shade.difference(hole), 'redDark'), (vl.difference(hole), 'redMid'), (vu.difference(hole), 'red')]
    b, seams = ball(cx, 330, 250, 28)
    L += [(circle(cx, 330, 300), 'ink'), (b, 'gold'), (seams, 'ink')]
    L.append((keyline(sil, 14, 6), 'gold'))
    L.append((ring(cx, 330, 268, 6), 'gold'))
    return L, (-30, -30, 1060, 1040)

def lockup(mark=None, sub='KOSZYKÓWKA · BOBOLICE'):
    """Układ poziomy: herb 2.0 | BEKAPAKA (litery BKPK) / podtytuł między czerwonymi belkami."""
    H, vb = mark or herb2(); sc = 420/1060
    L = [(move(scale(g, sc, (0, 0)), 30*sc, 30*sc), r) for g, r in H]
    hb = union(*[g for g, r in L]).bounds; mid = (hb[1] + hb[3])/2          # oś pozioma herbu
    wm, ww = lettering('BEKAPAKA', 230); x0, y0, x1, y1 = wm.bounds; width = x1 - x0
    t, tw = text(sub, 'label', 40, 9); tx0, ty0, tx1, ty1 = t.bounds; th = ty1 - ty0
    gap = 44; block = (y1 - y0) + gap + th                                       # blok: napis + odstęp + podtytuł
    top = mid - block/2
    wm = move(wm, 480 - x0, top - y0); L.append((wm, 'ink'))
    ty = top + (y1 - y0) + gap
    t = move(t, 480 + (width - (tx1-tx0))/2 - tx0, ty - ty0); L.append((t, 'ink'))
    bw = (width - (tx1-tx0))/2 - 28; by = ty + th/2 - 4
    L += [(rect(480, by, bw, 8), 'red'), (rect(480 + width - bw, by, bw, 8), 'red')]
    return L, (0, 0, int(480 + width + 30), 430)

PALETY = {
    'kolor': {},
    'B': {'ink': '#102A73', 'red': '#FF7A18', 'redMid': '#E0600A', 'redDark': '#0B1E55'},
    'zloto': {'gold': '#D9A441', 'goldDark': '#8C6A26', 'red': '#D9A441', 'redMid': '#B88A33', 'redDark': '#6E5420', 'paper': '#D9A441'},
    'ton': {'gold': '#2E2B28', 'goldDark': '#1C1A18', 'red': '#3A1016', 'redMid': '#2C0C11', 'redDark': '#1A0A0C', 'paper': '#3A3632'},
    # 1 kolor: czarny znak, detale wybrane w kolorze podłoża (biel)
    'czarny': {'gold': 'paper', 'goldDark': 'ink', 'red': 'paper', 'redMid': 'paper', 'redDark': 'ink', 'paper': 'paper'},
    # negatyw na czerwieni: biały znak, detale wybrane w kolorze podłoża (czerwień)
    'bialy': {'ink': 'paper', 'gold': '#EF1734', 'goldDark': 'paper', 'red': '#EF1734', 'redMid': '#EF1734', 'redDark': 'paper', 'paper': '#EF1734'}}

def odznaka(top='BEKAPAKA', bot='BOBOLICE', inner=None, accent='red', top_size=92, bot_size=76):
    cx = cy = 500
    L = [(circle(cx, cy, 500), 'gold'), (circle(cx, cy, 484), 'ink'), (ring(cx, cy, 470, 6), 'gold'), (ring(cx, cy, 318, 6), 'gold')]
    r_in, r_out = 324, 464                      # pierścień na napisy (między liniami)
    def radial(g):
        pts = [pt for poly_ in (g.geoms if hasattr(g, 'geoms') else [g]) for pt in poly_.exterior.coords]
        ds = [((x-cx)**2 + (y-cy)**2) ** .5 for x, y in pts]; return min(ds), max(ds)
    t = arc_text(top, cx, cy, 362, -90, top_size, 'display', 14); a, b = radial(t)
    t = arc_text(top, cx, cy, 362 + ((r_in+r_out)/2 - (a+b)/2), -90, top_size, 'display', 14)
    u = arc_text(bot, cx, cy, 438, 90, bot_size, 'display', 18, bottom=True); a, b = radial(u)
    u = arc_text(bot, cx, cy, 438 + ((r_in+r_out)/2 - (a+b)/2), 90, bot_size, 'display', 18, bottom=True)
    L.append((t, 'paper')); L.append((u, 'gold'))
    for sgn in (-1, 1):
        px, py = cx + sgn*400, cy
        w2 = 34; L.append((poly((px-w2, py-22), (px-w2+18, py-22), (px, py+4), (px+w2-18, py-22), (px+w2, py-22), (px, py+26)), accent))
    S, vb = inner or sygnet2()
    sc = 600/1060
    for g, r in S:
        L.append((move(scale(g, sc, (0, 0)), cx - 500*sc, cy - 500*sc + 4), r))
    return L, (0, 0, 1000, 1000)

def odznaka_mvp():
    cx = 500
    sh = union(rect(150, 120, 700, 420), poly((150, 540), (850, 540), (cx, 900)))
    L = [(outset(sh, 18), 'ink'), (sh, 'gold'), (keyline(sh, 16, 8), 'ink')]
    star = poly(*[(cx + (120 if i % 2 == 0 else 50)*math.cos(-math.pi/2 + i*math.pi/5), 280 + (120 if i % 2 == 0 else 50)*math.sin(-math.pi/2 + i*math.pi/5)) for i in range(10)])
    L.append((star, 'ink'))
    m, w = lettering('MVP', 230); x0, y0, x1, y1 = m.bounds
    L.append((move(m, cx-(x0+x1)/2, 590), 'ink'))
    L.append((rect(250, 628, 500, 10), 'red'))
    t, w = text('BEKAPAKA', 'display', 54, 8); x0, y0, x1, y1 = t.bounds
    L.append((move(t, cx-(x0+x1)/2, 712), 'ink'))
    return L, (100, 70, 800, 880)

def export(name, layers, vb, pal='kolor'):
    m = PALETY[pal]
    def col(r):
        v = m.get(r, r)
        return v if v.startswith('#') else COL[v]
    (SYSTEM/'symbole'/'svg'/f'{name}.svg').write_text(svg([(g, col(r)) for g, r in layers], *vb))

if __name__ == '__main__':
    (SYSTEM/'symbole'/'svg').mkdir(exist_ok=True)
    H, vb = herb2()
    print('herb 2.0 — odstępy:', raport_herbu(H))
    for pal in ('kolor', 'czarny', 'bialy', 'zloto', 'ton'): export(f'herb2-{pal}', H, vb, pal)
    HM, vbm = herb2(mini=True)
    for pal in ('kolor', 'czarny', 'bialy'): export(f'herb2-mini-{pal}', HM, vbm, pal)
    LK, vbl = lockup()
    for pal in ('kolor', 'czarny'): export(f'herb2-poziome-{pal}', LK, vbl, pal)
    export('herb2-poziome-negatyw', [(g, 'paper' if r == 'ink' and g.bounds[0] > 400 else r) for g, r in LK], vbl, 'kolor')
    S, vb = sygnet2()
    for pal in ('kolor', 'B', 'czarny', 'bialy'): export(f'sygnet2-{pal}', S, vb, pal)
    export('herb2-B', H, (-30, -30, 1060, 1020), 'B')
    O, vb = odznaka()
    for pal in ('kolor', 'B', 'czarny', 'bialy'): export(f'odznaka-{pal}', O, vb, pal)
    T, vb = odznaka('III TURNIEJ', 'PUCHAR BURMISTRZA', bot_size=62); export('odznaka-turniej', T, vb)
    MV, vb = odznaka_mvp(); export('odznaka-mvp', MV, vb)
    print('ok')
