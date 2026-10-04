"""Source brand reference; functions only. Never used for production rendering."""
def new(id, title):
    p = Poster(HERE, id, 'BeKaPaKa — strój B: ' + title, D['_status'], bg=NAVY_D)
    p.layer('10-plyta'); mat.plate(p, 'plyta-granat.png')
    p.rect(0, 0, p.w, p.h, p.fade('g-v', 0, 0, 0, p.h, [(0, NAVY_D, .5), (.5, NAVY_D, .1), (1, NAVY_D, .65)]))
    m = el('mask', id='m-pek', maskUnits='userSpaceOnUse', x=0, y=0, width=1080, height=1350)       # pęknięcia stroju B tylko w dole
    m.append(el('rect', x=0, y=0, width=1080, height=1350, fill=p.fade('gm', 0, 820, 0, 1250, [(0, '#FFFFFF', 0), (1, '#FFFFFF', 1)])))
    p.defs.append(m); g = el('g', mask='url(#m-pek)', opacity=.35); p.g.append(g); prev, p.g = p.g, g
    sym.place(p, 'wzor-pekniecia-B', 0, 300, 1080); p.g = prev
    return p

def foot(p, note):
    p.layer('90-stopka'); y = p.h - 54
    sym.place(p, 'wordmark-negatyw', 72, y-40, h=50)
    p.text(note, 1008, y, 20, 'body', fill=MUTB, spacing=1, anchor='end', max_width=560)

def rival(p, cx, cy, h): return M.rival_c(p, cx, cy, h, MT['awayShort'], fill='#0A1A4A', line='#3A5BB8')

def dzien_meczu():
    p = new('01-dzien-meczu-B', 'dzień meczu'); ink = mat.ink(p)
    p.layer('20-wstega'); M.ribbon(p, 540, 74, 'DZIEŃ MECZU', 40, fill=ORANGE, ink=C['white'], tail=ORANGE_D)
    p.text(f"{MT['day']} · {MT['date']} · KALK", 540, 204, 26, 'label', spacing=4, anchor='middle', fill=MUTB)
    p.layer('30-druzyny'); cy = 470
    M.mark_c(p, 'herb2', 540-PAIR_D, cy, 330, pal='B'); rival(p, 540+PAIR_D, cy, 330*OPT)
    M.solid(p, 'VS', 540, cy+40, 120, C['white'], anchor='middle', fx=ink)
    M.chevrons(p, 540, cy+80, 110, colors=(ORANGE, ORANGE_D))
    p.text('BEKAPAKA', 540-PAIR_D, cy+165+64, 38, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 540+PAIR_D, cy+165+64, 38, 'label', spacing=4, anchor='middle', shadow=True, max_width=330)
    p.layer('40-panel'); M.panel_text(p, MT['time'], 160, 810, 760, 210, 190, C['white'], fx=ink, fill=NAVY_D, keyline=(10, 4, ORANGE))
    p.layer('50-info'); sym.icon_row_c(p, [('hala', VENUE)], 540, 1120, size=30, text_size=28, shadow=True)
    M.stripes(p, 72, 1170, 936, color=ORANGE)
    foot(p, 'GRAMY W STROJU B · ' + NOTE); p.save()

def wynik():
    R = D['result']; p = new('02-wynik-B', 'wynik'); ink = mat.ink(p)
    p.layer('20-wstega'); M.ribbon(p, 540, 74, R['label'], 40, fill=ORANGE, ink=C['white'], tail=ORANGE_D)
    p.text(f"{R['sub']} · {MT['date']} · {VENUE}", 540, 204, 26, 'label', spacing=4, anchor='middle', fill=MUTB)
    p.layer('30-znaki'); cy = 400
    M.mark_c(p, 'herb2', 540-PAIR_D, cy, 270, pal='B'); rival(p, 540+PAIR_D, cy, 270*OPT)
    p.layer('40-wynik'); home_wins = R['home'] > R['away']
    for val, cx, ours in ((R['home'], 540-PAIR_D, True), (R['away'], 540+PAIR_D, False)):
        if ours == home_wins: M.solid(p, str(val), cx, 880, 300, ORANGE if ours else C['white'], anchor='middle', fx=ink)
        else: M.outline(p, str(val), cx, 880, 300, C['white'], t=7, anchor='middle')
    M.solid(p, ':', 540, 820, 150, C['white'], anchor='middle', cut=False)
    p.text('BEKAPAKA', 540-PAIR_D, 950, 34, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 540+PAIR_D, 950, 34, 'label', spacing=4, anchor='middle', fill=MUTB, max_width=380)
    p.layer('50-dalej'); M.blade_panel(p, 72, 1030, 936, 110, NAVY_P)
    M.chevrons(p, 140, 1062, 50, colors=(ORANGE, ORANGE_D)); p.text(R['next'], 200, 1095, 28, 'body', max_width=780)
    M.stripes(p, 72, 1176, 936, color=ORANGE)
    foot(p, NOTE); p.save()

def matchday():
    P = D['player']; p = new('03-matchday-B', 'matchday'); ink = mat.ink(p)
    p.layer('20-naglowek'); M.mark_c(p, 'herb2mini', 132, 120, 116, pal='B')
    p.text('MATCHDAY', 210, 110, 30, 'label', spacing=3); p.text(f"vs {MT['away']} · {MT['date']}", 210, 146, 22, 'body', fill=MUTB, spacing=2)
    w1 = sym.lettering(p, 'GRAMY', 72, 330, 120, fill=C['white'], fx=ink)
    sym.lettering(p, 'W STROJU B', 72 + w1 + 30, 330, 120, fill=ORANGE, fx=ink)
    M.stripes(p, 72, 360, 936, color=ORANGE)
    p.layer('30-koszulka'); w = 520; x, y = 540 - w/2, 420; k = w/200
    prev = p.g; g = el('g', filter=f'url(#{ink})'); p.g.append(g); p.g = g
    kit.jersey(p, x, y, w, P['number'], P['last'], back_ink=NAVY, acc=ORANGE)
    zone_n = (x+40*k, y+30*k, x+160*k, y+120*k); NS = 44; capn = NS*.70; base = (zone_n[1]+zone_n[3])/2 + capn/2
    b = p.text(P['last'], x+w/2, base, NS, 'label', anchor='middle', max_width=120*k, spacing=2)
    M.register_pad(p, 'nazwisko na koszulce', zone_n, M.G.rect(b[0], base-capn, b[2]-b[0], capn), 'y')
    zone_v = (x+4*k, y+120*k, x+196*k, y+260*k)
    gnum = M.solid(p, P['number'], x+w/2, (zone_v[1]+zone_v[3])/2 + 230*.35, 230, C['white'], anchor='middle')
    M.register_pad(p, 'numer na koszulce', zone_v, gnum, 'y')
    p.g = prev
    p.layer('40-info'); sym.icon_row_c(p, [('godzina', MT['time']), ('hala', VENUE)], 540, 1150, size=30, text_size=28, shadow=True)
    foot(p, 'GRAFIKA KOSZULKI POGLĄDOWA · ' + NOTE); p.save()
