"""Wspólny silnik grafik BeKaPaKa: tokeny, fonty Barlow, wektorowy herb, kontrola pól.
Każdy szablon: Poster(...) → warstwy → save() zapisuje templates/ (edytowalny tekst)
i render-source/ (tekst na krzywych do eksportu) oraz qa/<id>-layout.json."""
from pathlib import Path
import base64, copy, json, re
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen

SYSTEM = Path(__file__).resolve().parents[1]
BRAND = SYSTEM.parent
TOK = json.loads((SYSTEM/'tokens.json').read_text())
C = {k: v['hex'] for k, v in TOK['color'].items()}
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ROLES = {k: (v['family'], str(v['weight']), v['file']) for k, v in TOK['type'].items() if 'family' in v}
FONTS = {k: TTFont(SYSTEM/f) for k, (_, _, f) in ROLES.items()}

def el(tag, **a):
    return ET.Element('{'+NS+'}'+tag, {k.rstrip('_').replace('_', '-'): str(v) for k, v in a.items()})

def width(s, size, role='display', spacing=0):
    f = FONTS[role]; cm = f.getBestCmap()
    return sum(f['hmtx'][cm[ord(c)]][0]*size/f['head'].unitsPerEm + spacing for c in s) - spacing

class Poster:
    def __init__(self, out_dir, id, title, desc, w=1080, h=1350, bg=None):
        self.out = Path(out_dir); self.id = id; self.w, self.h = w, h
        self.m = TOK['grid']['post']['margin']; self.safe = (260, 1600) if h == 1920 else (30, h-30); self.boxes = []; self.protected = []
        self.root = el('svg', width=w, height=h, viewBox=f'0 0 {w} {h}')
        for tag, v in (('title', title), ('desc', desc)):
            n = el(tag); n.text = v; self.root.append(n)
        self.defs = el('defs'); self.root.append(self.defs)
        css = el('style'); css.text = '\n'.join(
            f'@font-face{{font-family:"{fam}";font-weight:{wt};src:url(data:font/ttf;base64,'
            + base64.b64encode((SYSTEM/f).read_bytes()).decode() + ')}' for fam, wt, f in ROLES.values())
        self.defs.append(css)
        self.layer('00-tlo'); self.rect(0, 0, w, h, bg or C['black'])

    def layer(self, name):
        self.g = el('g', id=name); self.root.append(self.g); return self.g
    def rect(self, x, y, w, h, fill, **a): self.g.append(el('rect', x=x, y=y, width=w, height=h, fill=fill, **a))
    def poly(self, pts, fill, **a): self.g.append(el('polygon', points=' '.join(f'{x},{y}' for x, y in pts), fill=fill, **a))
    def line(self, x1, y1, x2, y2, stroke, sw=2, **a): self.g.append(el('line', x1=x1, y1=y1, x2=x2, y2=y2, stroke=stroke, stroke_width=sw, **a))

    def text(self, s, x, y, size, role='display', fill=None, spacing=0, anchor='start', max_width=None, check=True, shadow=False, fx=None):
        fill = fill or C['white']; adv = width(s, size, role, spacing)
        if max_width and adv > max_width + .1: raise ValueError(f'Za długi tekst: {s} ({adv:.0f}>{max_width})')
        fam, wt, _ = ROLES[role]
        n = el('text', x=x, y=y, font_family=fam, font_weight=wt, font_size=round(size, 2), fill=fill,
               letter_spacing=spacing, text_anchor=anchor); n.text = s; self.g.append(n)
        if shadow: n.set('filter', f'url(#{self.shadow()})')
        if fx: n.set('filter', f'url(#{fx})')
        f = FONTS[role]; gs = f.getGlyphSet(); cm = f.getBestCmap(); sc = size/f['head'].unitsPerEm
        x0 = x - adv/2 if anchor == 'middle' else x - adv if anchor == 'end' else x; cur = 0; bb = []
        for ch in s:
            gl = cm[ord(ch)]; p = BoundsPen(gs); gs[gl].draw(p)
            if p.bounds:
                a, b, c, d = p.bounds; bb.append([x0+cur+a*sc, y-d*sc, x0+cur+c*sc, y-b*sc])
            cur += f['hmtx'][gl][0]*sc + spacing
        box = [min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb)]
        if check: self.boxes.append({'text': s, 'bounds': [round(v, 1) for v in box], 'anchor': anchor, 'x': x, 'size': size})
        return box

    def shadow(self):
        if not getattr(self, '_shadow', None):
            f = el('filter', id='cien', x='-10%', y='-10%', width='120%', height='130%')
            f.append(el('feGaussianBlur', in_='SourceAlpha', stdDeviation=10, result='b'))
            f.append(el('feOffset', in_='b', dx=0, dy=6, result='o'))
            ct = el('feComponentTransfer', in_='o', result='s'); ct.append(el('feFuncA', type='linear', slope=.75)); f.append(ct)
            m = el('feMerge'); m.append(el('feMergeNode', in_='s')); m.append(el('feMergeNode', in_='SourceGraphic')); f.append(m)
            self.defs.append(f); self._shadow = 'cien'
        return self._shadow

    def fit(self, s, x, y, size, w, **a):
        size = min(size, size*w/width(s, size, a.get('role', 'display'), a.get('spacing', 0)))
        return self.text(s, x, y, size, max_width=w, **a)

    def crest(self, x, y, w, variant='kolor'):
        src = (BRAND/'01_logo'/f'herb-{variant}.svg').read_text()
        vb = re.search(r'viewBox="([^"]+)"', src).group(1); vw, vh = map(float, vb.split()[2:])
        h = w*vh/vw; s = el('svg', x=x, y=y, width=w, height=round(h, 2), viewBox=vb)
        for g in ET.fromstring(src): s.append(g)
        self.g.append(s); cs = w/8
        self.protected.append([x-cs, y-cs, x+w+cs, y+h+cs]); return h

    def image(self, path, x, y, w, h, fit='slice', align='xMidYMid', opacity=1, clip=None):
        path = Path(path); mime = 'image/jpeg' if path.suffix.lower() in ('.jpg', '.jpeg') else 'image/png'
        n = el('image', href=f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode(), x=x, y=y, width=w, height=h,
               preserveAspectRatio=f'{align} {fit}', opacity=opacity)
        if clip: n.set('clip-path', f'url(#{clip})')
        self.g.append(n); return n

    def clip(self, id, *shapes):
        c = el('clipPath', id=id)
        for tag, a in shapes: c.append(el(tag, **a))
        self.defs.append(c); return id

    def fade(self, id, x1, y1, x2, y2, stops):
        """Liniowy gradient (stops: [(offset, kolor, krycie)]); zwraca url() do fill."""
        g = el('linearGradient', id=id, gradientUnits='userSpaceOnUse', x1=x1, y1=y1, x2=x2, y2=y2)
        for o, c, a in stops: g.append(el('stop', offset=o, stop_color=c, stop_opacity=a))
        self.defs.append(g); return f'url(#{id})'

    def stripes(self, x, y, w, n=3, gap=12, sw=5, color=None, opacity=1):
        for i in range(n): self.rect(x, y+i*gap, w, sw, color or C['red'], opacity=opacity)

    def save(self):
        def hit(a, b): return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]
        errs = []
        for i, it in enumerate(self.boxes):
            b = it['bounds']
            if b[0] < self.m-1 or b[2] > self.w-self.m+1 or b[1] < self.safe[0] or b[3] > self.safe[1]: errs.append('Poza marginesem: '+it['text'])
            errs += ['Pole ochronne herbu: '+it['text'] for p in self.protected if hit(b, p)]
            errs += [f'Kolizja: {it["text"]} / {o["text"]}' for o in self.boxes[i+1:] if hit(b, o['bounds'])]
        warn = []
        cxm = self.w/2
        for it in self.boxes:      # środek optyczny elementów kotwiczonych centralnie
            if it.get('anchor') == 'middle' and abs(it['x'] - cxm) < 2:
                off = (it['bounds'][0] + it['bounds'][2])/2 - cxm
                if abs(off) > 2: warn.append(f'Niewyśrodkowane o {off:.1f}px: ' + it['text'])
        marks = getattr(self, 'marks', [])
        for name, b in marks:      # znaki w polu informacji
            if b[0] < self.m-1 or b[2] > self.w-self.m+1: warn.append(f'Znak poza marginesem: {name}')
        if len(marks) == 2:        # para znaków (my / rywal) symetrycznie względem osi
            (n1, a), (n2, b) = marks
            d1 = cxm - (a[0]+a[2])/2; d2 = (b[0]+b[2])/2 - cxm
            if abs(d1 - d2) > 2 and min(d1, d2) > 0: warn.append(f'Para znaków asymetryczna: {d1:.0f} / {d2:.0f}px')
            if abs((a[3]-a[1]) / (b[3]-b[1]) - 1) > .10: warn.append('Para znaków: wysokości różnią się o więcej niż korekta optyczna (10%)')
            if abs((a[1]+a[3])/2 - (b[1]+b[3])/2) > 2: warn.append('Para znaków: różne osie poziome')
        for name, c, b, axes in getattr(self, 'pads', []):   # równe odstępy treści w kontenerach
            t, d_, l, r = b[1]-c[1], c[3]-b[3], b[0]-c[0], c[2]-b[2]
            if 'y' in axes and abs(t - d_) > 3: warn.append(f'Nierówne odstępy pion ({t:.0f}/{d_:.0f}): {name}')
            if 'x' in axes and abs(l - r) > 3: warn.append(f'Nierówne odstępy poziom ({l:.0f}/{r:.0f}): {name}')
            if min(t, d_, l, r) < 0: warn.append(f'Treść wychodzi z kontenera: {name} ({t:.0f}/{d_:.0f}/{l:.0f}/{r:.0f})')
        for i, a_ in enumerate(self.boxes):          # za mały odstęp między wierszami tekstu (< 10 px)
            for b_ in self.boxes[i+1:]:
                A, Bb = a_['bounds'], b_['bounds']
                ox = min(A[2], Bb[2]) - max(A[0], Bb[0]); dy = max(Bb[1]-A[3], A[1]-Bb[3])
                if ox > 0 and 0 <= dy < 10: warn.append(f'Za ciasno ({dy:.0f}px): {a_["text"][:20]} / {b_["text"][:20]}')
        if self.w == 1080:                           # czytelność na telefonie (~360 px): minimum 20 px w pliku 1080
            for it in self.boxes:
                if it.get('size') and it['size'] < 20: warn.append(f'Tekst poniżej minimum 20 px ({it["size"]:.0f}): {it["text"][:24]}')
        if warn: errs += warn
        for d in ('templates', 'render-source', 'qa'): (self.out/d).mkdir(parents=True, exist_ok=True)
        (self.out/'qa'/f'{self.id}-layout.json').write_text(json.dumps({'text': self.boxes, 'crest': self.protected, 'errors': errs}, ensure_ascii=False, indent=1))
        if errs: raise ValueError(errs)
        ET.ElementTree(self.root).write(self.out/'templates'/f'{self.id}.svg', encoding='utf-8', xml_declaration=True)
        out = copy.deepcopy(self.root)
        lookup = {(fam, wt): k for k, (fam, wt, _) in ROLES.items()}
        for parent in list(out.iter()):
            for idx, n in enumerate(list(parent)):
                if n.tag != '{'+NS+'}text': continue
                role = lookup[(n.get('font-family'), n.get('font-weight'))]
                f = FONTS[role]; gs = f.getGlyphSet(); cm = f.getBestCmap()
                size = float(n.get('font-size')); sc = size/f['head'].unitsPerEm; sp = float(n.get('letter-spacing', 0))
                x = float(n.get('x')); y = float(n.get('y')); adv = width(n.text, size, role, sp)
                x -= adv/2 if n.get('text-anchor') == 'middle' else adv if n.get('text-anchor') == 'end' else 0
                g = el('g', fill=n.get('fill'), aria_label=n.text); cur = 0
                if n.get('filter'): g.set('filter', n.get('filter'))
                for ch in n.text:
                    gl = cm[ord(ch)]; p = SVGPathPen(gs); gs[gl].draw(p)
                    g.append(el('path', d=p.getCommands(), transform=f'translate({x+cur:.2f} {y}) scale({sc:.5f} {-sc:.5f})'))
                    cur += f['hmtx'][gl][0]*sc + sp
                parent.remove(n); parent.insert(idx, g)
        ET.ElementTree(out).write(self.out/'render-source'/f'{self.id}.svg', encoding='utf-8', xml_declaration=True)
        return self.out/'render-source'/f'{self.id}.svg'
