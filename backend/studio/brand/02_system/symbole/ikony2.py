"""Ikony BeKaPaKa 2.0 — jedna rodzina: siatka 96, pole żywe 10–86, kontur 7, narożniki ścięte (kąt BKPK),
zakończenia proste. Zastępuje ikony v1 (różne style). Zapis: svg/ikona-*.svg (fill #0B0B0B; kolor podmienia sym.icon_row)."""
import math
from geo2 import *
from shapely.geometry import LineString
S = 7                                   # grubość konturu
def outline(g): return g.difference(g.buffer(-S, join_style='mitre', mitre_limit=4))
def line(*pts): return LineString(pts).buffer(S/2, cap_style='flat', join_style='mitre', mitre_limit=4)
def chamf(x, y, w, h, c=8): return poly((x+c, y), (x+w-c, y), (x+w, y+c), (x+w, y+h-c), (x+w-c, y+h), (x+c, y+h), (x, y+h-c), (x, y+c))
def arc(cx, cy, r, a0, a1, n=40):
    return LineString([(cx + r*math.cos(math.radians(a0 + (a1-a0)*i/n)), cy + r*math.sin(math.radians(a0 + (a1-a0)*i/n))) for i in range(n+1)]).buffer(S/2, cap_style='flat')

def icons():
    I = {}
    cal = chamf(12, 18, 72, 66)
    I['data'] = union(outline(cal), rect(12, 18, 72, 18), line((32, 10), (32, 26)), line((64, 10), (64, 26)),
                      rect(24, 46, 12, 10), rect(42, 46, 12, 10), rect(60, 46, 12, 10), rect(24, 63, 12, 10), rect(42, 63, 12, 10))
    I['godzina'] = union(ring(48, 48, 38, S), line((48, 48), (48, 24)), line((48, 48), (66, 58)), circle(48, 48, 5))
    pin = union(circle(48, 38, 28), poly((24, 52), (72, 52), (48, 88)))
    I['hala'] = union(outline(pin), circle(48, 38, 9))
    I['mecz'] = union(ring(48, 48, 38, S), line((48, 10), (48, 86)), line((10, 48), (86, 48)),
                      arc(10, 48, 30, -62, 62), arc(86, 48, 30, 118, 242))
    tank = poly((30, 10), (40, 10), (40, 14), (56, 14), (56, 10), (66, 10), (68, 30), (82, 40), (82, 86), (14, 86), (14, 40), (28, 30))
    neck = circle(48, 12, 13)
    I['sklad'] = union(outline(tank.difference(neck)), poly((34, 44), (44, 44), (48, 58), (52, 44), (62, 44), (48, 74)))
    bowl = poly((24, 12), (72, 12), (68, 40), (58, 52), (38, 52), (28, 40))
    I['turniej'] = union(outline(bowl), arc(24, 28, 12, 90, 270), arc(72, 28, 12, -90, 90), line((48, 52), (48, 70)), outline(chamf(28, 70, 40, 16, 4)))
    star = poly(*[(48 + (40 if k % 2 == 0 else 17)*math.cos(-math.pi/2 + k*math.pi/5), 52 + (40 if k % 2 == 0 else 17)*math.sin(-math.pi/2 + k*math.pi/5)) for k in range(10)])
    I['mvp'] = outline(star)
    I['kontakt'] = union(outline(chamf(26, 8, 44, 80, 7)), line((40, 74), (56, 74)))
    I['info'] = union(ring(48, 48, 38, S), rect(44, 40, 8, 28), circle(48, 28, 5))
    return I

if __name__ == '__main__':
    out = SYSTEM/'symbole'/'svg'
    for n, g in icons().items():
        (out/f'ikona-{n}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><path d="{d(g)}" fill="#0B0B0B" fill-rule="evenodd"/></svg>\n')
    print('ok', len(icons()))
