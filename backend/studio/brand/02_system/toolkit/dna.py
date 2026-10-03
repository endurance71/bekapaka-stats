"""Elementy DNA BeKaPaKa (tokens.json → dna): nagłówek, stopka, klin V, paski stroju A."""
from poster import C

def top(p):  # górna krawędź strefy informacji: post 64, story 260
    return 64 if p.h == 1350 else 260

def bottom(p):  # linia bazowa stopki
    return p.h - 54 if p.h == 1350 else 1560

def header(p, label, sub, variant='kolor', ink=None):
    p.layer('10-naglowek'); y = top(p); h = p.crest(72, y, 120, variant)
    p.text(label, 222, y+h/2-4, 30, 'label', fill=ink or C['white'], spacing=2, max_width=780)
    p.text(sub, 222, y+h/2+34, 24, 'body', fill=C['muted'], spacing=1, max_width=780)
    return y + h

def footer(p, note, ink=None):
    p.layer('90-stopka'); y = bottom(p)
    p.text('bekapaka.pl', 72, y, 26, 'label', fill=ink or C['white'])
    p.text(note, 1008, y, 20, 'body', fill=C['muted'], spacing=1, anchor='end', max_width=640)

def V(p, top, apex, outer_l, inner_l, depth=40, opacity=1, cx=540):
    """Klin V stroju A; outer_l/inner_l = x krawędzi lewego ramienia na wysokości `top`."""
    ol, il = outer_l, inner_l; orr, ir = 2*cx-ol, 2*cx-il
    k = (apex-top)/(cx-il); oapex = top + (cx-ol)*k
    p.poly([(ol, top), (il, top), (cx, apex), (ir, top), (orr, top), (cx, oapex)], C['red'], opacity=opacity)
    p.poly([(il, top), (il+depth, top), (cx, apex-depth*k), (ir-depth, top), (ir, top), (cx, apex)], C['redDark'], opacity=opacity)

def jersey_stripes(p, y, n=7, step=28, opacity=.55):
    for i in range(n): p.rect(0, y+i*step, p.w, 5, C['red'], opacity=opacity)
