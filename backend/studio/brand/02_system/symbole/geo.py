"""Geometria symboli BeKaPaKa: operacje logiczne na kształtach (skia-pathops), glify Barlow,
transformacje i zapis do SVG. Reguła: kąt BKPK = 24° (skrzydło) ⟂ 66° (ramię V)."""
import math
from pathlib import Path
import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen

SYSTEM = Path(__file__).resolve().parents[1]
A24 = math.tan(math.radians(24)); A66 = math.tan(math.radians(66))
FONTS = {k: TTFont(SYSTEM/'fonts'/f) for k, f in
         {'display': 'BarlowCondensed-ExtraBold.ttf', 'label': 'Barlow-SemiBold.ttf', 'body': 'Barlow-Regular.ttf'}.items()}

def poly(*pts):
    p = pathops.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p

def rect(x, y, w, h): return poly((x, y), (x+w, y), (x+w, y+h), (x, y+h))

def circle(cx, cy, r, n=180):
    return poly(*[(cx+r*math.cos(2*math.pi*i/n), cy+r*math.sin(2*math.pi*i/n)) for i in range(n)])

def ring(cx, cy, r, t): return diff(circle(cx, cy, r), circle(cx, cy, r-t))

def op(a, b, kind):
    return pathops.op(a, b, kind)
def union(*ps):
    out = ps[0]
    for p in ps[1:]: out = pathops.op(out, p, pathops.PathOp.UNION)
    return out
def diff(a, *bs):
    for b in bs: a = pathops.op(a, b, pathops.PathOp.DIFFERENCE)
    return a
def inter(a, b): return pathops.op(a, b, pathops.PathOp.INTERSECTION)

def tf(p, xx=1, xy=0, yx=0, yy=1, dx=0, dy=0):
    """Macierz afiniczna (x' = xx*x + yx*y + dx, y' = xy*x + yy*y + dy)."""
    out = pathops.Path(); pen = TransformPen(out.getPen(), (xx, xy, yx, yy, dx, dy)); p.draw(pen); return out

def move(p, dx, dy): return tf(p, dx=dx, dy=dy)
def scale(p, s, cx=0, cy=0): return tf(p, s, 0, 0, s, cx-cx*s, cy-cy*s)
def mirror_x(p, axis): return tf(p, -1, 0, 0, 1, 2*axis, 0)
def skew(p, deg, base_y=0):
    """Pochylenie do przodu (y w dół): x' = x + (base_y - y)*tan."""
    t = math.tan(math.radians(deg)); return tf(p, 1, 0, -t, 1, base_y*t, 0)

def text(s, role='display', size=100, tracking=0, x=0, y=0):
    """Napis jako kształt (y w dół, linia bazowa = y). Zwraca (ścieżka, szerokość)."""
    f = FONTS[role]; gs = f.getGlyphSet(); cm = f.getBestCmap(); upm = f['head'].unitsPerEm; sc = size/upm
    out = pathops.Path(); cur = 0
    for ch in s:
        g = cm[ord(ch)]; pen = TransformPen(out.getPen(glyphSet=gs), (sc, 0, 0, -sc, x+cur, y)); gs[g].draw(pen)
        cur += f['hmtx'][g][0]*sc + tracking
    out.simplify(); return out, cur - tracking

def bounds(p): return p.bounds

def d(p):
    """Ścieżka SVG z konturów pathops."""
    out = []
    for contour in p.contours:
        segs = list(contour.segments)
        first = True
        for verb, pts in segs:
            if verb == 'moveTo': out.append('M %.1f %.1f' % pts[0])
            elif verb == 'lineTo': out.append('L %.1f %.1f' % pts[0])
            elif verb == 'qCurveTo':
                pts = list(pts)
                # rozbij ciąg kwadratowy na pojedyncze segmenty Q
                for i in range(len(pts)-1):
                    c = pts[i]; e = pts[i+1] if i == len(pts)-2 else ((pts[i][0]+pts[i+1][0])/2, (pts[i][1]+pts[i+1][1])/2)
                    out.append('Q %.1f %.1f %.1f %.1f' % (c[0], c[1], e[0], e[1]))
            elif verb == 'curveTo': out.append('C ' + ' '.join('%.1f %.1f' % q for q in pts))
            elif verb == 'closePath': out.append('Z')
            elif verb == 'endPath': pass
    return ' '.join(out)

def svg(layers, w, h, bg=None, vb=None):
    """layers: [(ścieżka, kolor)]."""
    body = (f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else '') + ''.join(
        f'<path d="{d(p)}" fill="{c}" fill-rule="nonzero"/>' for p, c in layers)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}" width="{w}" height="{h}">{body}</svg>\n'
