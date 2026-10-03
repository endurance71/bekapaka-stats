"""Geometria v2 (shapely): obrysy i wewnętrzne linie z dokładnym offsetem (mitre), glify jako wielokąty,
operacje logiczne, eksport warstw do SVG. Reguła kątów: 24° / 66°."""
import math
from pathlib import Path
from shapely.geometry import Polygon, MultiPolygon, Point, box
from shapely.ops import unary_union
from shapely import affinity
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

SYSTEM = Path(__file__).resolve().parents[1]
A24 = math.tan(math.radians(24)); A66 = math.tan(math.radians(66))
FONTS = {k: TTFont(SYSTEM/'fonts'/f) for k, f in
         {'display': 'BarlowCondensed-ExtraBold.ttf', 'label': 'Barlow-SemiBold.ttf', 'body': 'Barlow-Regular.ttf'}.items()}
MITRE = dict(join_style='mitre', mitre_limit=4)

def poly(*pts): return Polygon(pts)
def rect(x, y, w, h): return box(x, y, x+w, y+h)
def circle(cx, cy, r, res=128): return Point(cx, cy).buffer(r, resolution=res)
def ring(cx, cy, r, t): return circle(cx, cy, r).difference(circle(cx, cy, r-t))
def union(*g): return unary_union([x for x in g if x is not None and not x.is_empty])
def inset(g, t): return g.buffer(-t, **MITRE)
def outset(g, t): return g.buffer(t, **MITRE)
def keyline(g, offset, width):
    """Linia wewnętrzna równoległa do krawędzi kształtu (offset od krawędzi, szerokość)."""
    a = inset(g, offset); return a.difference(inset(a, width))
def move(g, dx, dy): return affinity.translate(g, dx, dy)
def scale(g, s, origin=(0, 0)): return affinity.scale(g, s, s, origin=origin)
def mirror_x(g, axis): return affinity.scale(g, -1, 1, origin=(axis, 0))
def skew(g, deg, base_y=0): return affinity.skew(g, xs=-deg, origin=(0, base_y))

def _flatten(rec, steps=10):
    contours, cur, start = [], [], None
    for op, args in rec.value:
        if op == 'moveTo': cur = [args[0]]; start = args[0]
        elif op == 'lineTo': cur.append(args[0])
        elif op == 'qCurveTo':
            pts = list(args); p0 = cur[-1]
            ons = []
            for i in range(len(pts)-1):
                c = pts[i]; e = pts[i+1] if i == len(pts)-2 else ((pts[i][0]+pts[i+1][0])/2, (pts[i][1]+pts[i+1][1])/2)
                for t in range(1, steps+1):
                    t /= steps; cur.append(((1-t)**2*p0[0]+2*(1-t)*t*c[0]+t*t*e[0], (1-t)**2*p0[1]+2*(1-t)*t*c[1]+t*t*e[1]))
                p0 = e
        elif op == 'curveTo':
            p0 = cur[-1]; c1, c2, e = args
            for t in range(1, steps+1):
                t /= steps; mt = 1-t
                cur.append((mt**3*p0[0]+3*mt*mt*t*c1[0]+3*mt*t*t*c2[0]+t**3*e[0], mt**3*p0[1]+3*mt*mt*t*c1[1]+3*mt*t*t*c2[1]+t**3*e[1]))
        elif op in ('closePath', 'endPath'):
            if len(cur) > 2: contours.append(cur)
            cur = []
    return contours

def text(s, role='display', size=100, tracking=0):
    """Napis jako wielokąt (y w dół, linia bazowa y=0). Zwraca (kształt, szerokość)."""
    f = FONTS[role]; gs = f.getGlyphSet(); cm = f.getBestCmap(); sc = size/f['head'].unitsPerEm
    shapes = []; cur = 0
    for ch in s:
        g = cm[ord(ch)]; rec = DecomposingRecordingPen(gs); gs[g].draw(rec)
        geom = None
        for c in _flatten(rec):
            p = Polygon([(cur + x*sc, -y*sc) for x, y in c]).buffer(0)
            geom = p if geom is None else geom.symmetric_difference(p)
        if geom is not None: shapes.append(geom)
        cur += f['hmtx'][g][0]*sc + tracking
    return union(*shapes), cur - tracking

def d(g):
    if g.is_empty: return ''
    polys = [g] if isinstance(g, Polygon) else [p for p in getattr(g, 'geoms', []) if isinstance(p, Polygon)]
    out = []
    for p in polys:
        for r in [p.exterior, *p.interiors]:
            c = list(r.coords); out.append('M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in c[:-1]) + ' Z')
    return ' '.join(out)

def svg(layers, x0, y0, w, h):
    body = ''.join(f'<path d="{d(g)}" fill="{c}" fill-rule="evenodd"/>' for g, c in layers if not g.is_empty)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">{body}</svg>\n'

def arc_text(s, cx, cy, r, center_deg, size, role='display', tracking=0, bottom=False):
    """Napis po łuku. Góra: litery na zewnątrz, czytane zgodnie z ruchem wskazówek.
    Dół (bottom=True): litery czytelne od lewej do prawej, wierzchołkami do środka; r = linia bazowa."""
    f = FONTS[role]; gs = f.getGlyphSet(); cm = f.getBestCmap(); sc = size/f['head'].unitsPerEm
    advs = [f['hmtx'][cm[ord(ch)]][0]*sc + tracking for ch in s]; span = (sum(advs) - tracking)/r
    th = math.radians(center_deg) + (span/2 if bottom else -span/2)
    out = []
    for ch, a in zip(s, advs):
        g, _ = text(ch, role, size)
        mid = th + ((-1 if bottom else 1) * (a - tracking)/2/r)
        px, py = cx + r*math.cos(mid), cy + r*math.sin(mid)
        if not bottom: T = (-math.sin(mid), math.cos(mid)); U = (math.cos(mid), math.sin(mid))
        else: T = (math.sin(mid), -math.cos(mid)); U = (-math.cos(mid), -math.sin(mid))
        w = (a - tracking)
        # (gx, gy) → p + (gx - w/2)*T + (-gy)*U
        m = [T[0], -U[0], T[1], -U[1], px - (w/2)*T[0], py - (w/2)*T[1]]
        out.append(affinity.affine_transform(g, m))
        th += (-1 if bottom else 1) * a/r
    return union(*out)

def center_in(g, x0, y0, x1, y1, axis='xy'):
    """Wyśrodkuj kształt w prostokącie po rzeczywistych granicach (równe odstępy)."""
    bx0, by0, bx1, by1 = g.bounds
    dx = (x0+x1)/2 - (bx0+bx1)/2 if 'x' in axis else 0
    dy = (y0+y1)/2 - (by0+by1)/2 if 'y' in axis else 0
    return move(g, dx, dy)

def pads(g, x0, y0, x1, y1):
    bx0, by0, bx1, by1 = g.bounds
    return dict(gora=round(by0-y0, 1), dol=round(y1-by1, 1), lewo=round(bx0-x0, 1), prawo=round(x1-bx1, 1))

def clean(g, min_area=120):
    """Usuń mikroskrawki (resztki po operacjach logicznych), które w druku dają zadziory."""
    if g.is_empty: return g
    parts = [q for q in getattr(g, 'geoms', [g]) if q.area >= min_area]
    return union(*parts) if parts else Polygon()
