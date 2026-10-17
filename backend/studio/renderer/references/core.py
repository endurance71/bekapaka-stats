"""Source brand reference; functions only. Never used for production rendering."""
def new(id, title, h=1350, bg=None):
    return Poster(HERE, id, 'BeKaPaKa — '+title, D['_status'], h=h, bg=bg)

def foot(p, note, dark=True):
    p.layer('90-stopka'); y = p.h-54 if p.h == 1350 else 1560
    sym.place(p, 'wordmark-negatyw' if dark else 'wordmark-kolor', 72, y-40, h=50)
    p.text(note, 1008, y, 20, 'body', fill=C['muted'] if dark else MUT, spacing=1, anchor='end', max_width=560)

def plate(p, seams=True):
    p.layer('10-plyta'); mat.plate(p)
    p.rect(0, 0, p.w, p.h, p.fade('g-v', 0, 0, 0, p.h, [(0, C['black'], .55), (.5, C['black'], .15), (1, C['black'], .6)]))
    if seams: M.seams(p, 540, p.h*.46, 470, t=2.5, color=C['red'], opacity=.18)

def paper(p):
    p.layer('10-papier'); mat.plate(p, 'lineup-paper.png')

def top(p): return 64 if p.h == 1350 else 260

def zapowiedz_a(state='mecz', story=False):
    """Stany: mecz / przelozony / odwolany. BeKaPaKa zawsze po lewej; miejsce zawsze KOSiR Koszalin."""
    st = D['preview_states'][state]; h = 1920 if story else 1350; o = 300 if story else 0
    p = new('01a-zapowiedz-' + state + ('-story' if story else ''), 'zapowiedź ' + state, h); ink = mat.ink(p); plate(p)
    tone = {'gold': (GOLD, C['black']), 'red': (C['red'], C['white']), 'grey': ('#5C5852', C['white'])}[st['tone']]
    p.layer('20-wstega'); M.ribbon(p, 540, top(p)+10, st['ribbon'], 40, fill=tone[0], ink=tone[1])
    dline = f"{MT['day']} · {MT['date']}"
    b = p.text(dline, 540, top(p)+130, 28, 'label', spacing=5, anchor='middle', shadow=True,
               fill=C['muted'] if state in ('przelozony', 'odwolany') else C['white'])
    if state in ('przelozony', 'odwolany'):                      # stary termin przekreślony
        p.rect(b[0]-6, (b[1]+b[3])/2 - 2, b[2]-b[0]+12, 4, tone[0])
    p.layer('30-druzyny')
    cy = 470+o; dim = .45 if state == 'odwolany' else 1
    g = el('g', opacity=dim); p.g.append(g); prev, p.g = p.g, g
    M.mark_c(p, 'herb2', 540-PAIR_D, cy, MARK_H)
    M.rival_c(p, 540+PAIR_D, cy, MARK_H*OPT, MT['awayShort'])
    M.solid(p, 'VS', 540, cy+40, 120, C['white'], anchor='middle', fx=ink)
    M.chevrons(p, 540, cy+80, 110)
    p.g = prev
    p.text('BEKAPAKA', 540-PAIR_D, cy+MARK_H/2+64, 38, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 540+PAIR_D, cy+MARK_H/2+64, 38, 'label', spacing=4, anchor='middle', shadow=True, max_width=330)
    p.layer('40-panel')
    if state == 'przelozony':
        p.text('NOWY TERMIN', 540, 800+o, 26, 'label', spacing=6, anchor='middle', fill=C['red'])
        M.panel_text(p, st['new_time'], 160, 830+o, 760, 190, 170, C['white'], fx=ink, fill=C['black'], keyline=(10, 4, C['red']))
        p.text(st['new_date'], 540, 1072+o, 30, 'label', spacing=4, anchor='middle', shadow=True)
    elif state == 'odwolany':
        M.panel_text(p, 'ODWOŁANY', 160, 810+o, 760, 210, 120, C['white'], fx=ink, fill='#1C1C1C', keyline=(10, 4, '#5C5852'))
    else:
        M.panel_text(p, MT['time'], 160, 810+o, 760, 210, 190, C['white'], fx=ink, fill=C['black'], keyline=(10, 4, GOLD))
    p.layer('50-info'); sym.icon_row_c(p, [(st['icon'], st['venue'].upper() if state != 'odwolany' else st['venue'])], 540, 1120+o, size=30, text_size=28, shadow=True,
                                       role='label' if state != 'odwolany' else 'body')
    M.stripes(p, 72, 1170+o, 936, color=C['red'] if st['tone'] != 'grey' else '#5C5852')
    foot(p, NOTE); p.save()

def zapowiedz_b():
    p = new('01b-zapowiedz', 'zapowiedź meczu B'); ink = mat.ink(p); plate(p, seams=False)
    p.layer('20-herb'); M.mark_c(p, 'herb2', 540, 230, 290)
    p.layer('30-data'); M.outline(p, MT['date'][:5], 540, 690, 400, C['red'], t=7, anchor='middle')
    M.solid(p, MT['day'], 540, 770, 70, C['white'], anchor='middle', fx=ink)
    p.layer('40-mecz')
    M.blade_panel(p, 72, 830, 936, 150, C['red'], worn=True)
    M.panel_text(p, 'BEKAPAKA — ' + MT['away'], 72, 830, 936, 150, 84, C['white'], fx=ink)
    p.layer('50-info'); M.chevrons(p, 540, 1010, 80)
    sym.icon_row_c(p, [('godzina', MT['time']), ('hala', VENUE)], 540, 1150, size=34, text_size=32, shadow=True)
    foot(p, NOTE); p.save()

def wynik_a(state='wygrana', story=False):
    h = 1920 if story else 1350; o = 300 if story else 0
    st = D['states'][state]
    p = new('02a-wynik-' + state + ('-story' if story else ''), 'wynik A ' + state, h); ink = mat.ink(p); plate(p)
    live = state == 'live'
    p.layer('20-wstega'); M.ribbon(p, 540, top(p)+10, st['label'], 40, fill=C['red'] if live else GOLD, ink=C['white'] if live else C['black'])
    p.text(st['sub'] + ' · ' + MT['date'] + ' · ' + VENUE, 540, top(p)+130, 26, 'label', spacing=4, anchor='middle', fill=C['muted'])
    cy = 400+o
    p.layer('30-znaki'); M.mark_c(p, 'herb2', 540-PAIR_D, cy, 270); M.rival_c(p, 540+PAIR_D, cy, 270*OPT, MT['awayShort'])
    p.layer('40-wynik')
    home_wins = st['home'] > st['away']; final = state in ('wygrana', 'porazka')
    for val, cx, ours in ((st['home'], 540-PAIR_D, True), (st['away'], 540+PAIR_D, False)):
        lead = (ours == home_wins)
        if lead: M.solid(p, str(val), cx, 880+o, 300, C['red'] if ours else C['white'], anchor='middle', fx=ink)
        else: M.outline(p, str(val), cx, 880+o, 300, C['white'], t=7, anchor='middle')
    M.solid(p, ':', 540, 820+o, 150, C['white'], anchor='middle', cut=False)
    p.text('BEKAPAKA', 540-PAIR_D, 950+o, 34, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 540+PAIR_D, 950+o, 34, 'label', spacing=4, anchor='middle', fill=C['muted'], max_width=380)
    p.layer('50-dalej')
    M.blade_panel(p, 72, 1030+o, 936, 110, '#161616')
    M.chevrons(p, 140, 1062+o, 50)
    nxt = D['result']['next'] if final else ('Następna aktualizacja po 3. kwarcie' if live else 'Druga połowa za 15 minut')
    p.text(nxt, 200, 1095+o, 28, 'body', max_width=780)
    M.stripes(p, 72, 1176+o, 936)
    foot(p, NOTE); p.save()

def wynik_b():
    p = new('02b-wynik', 'wynik B'); ink = mat.ink(p); plate(p, seams=False); r = D['result']
    p.layer('20-numer'); M.outline(p, '24', 700, 1000, 900, C['red'], t=6, anchor='middle', deco=True)
    p.layer('30-zawodnik'); p.image(FOTO/'zawodnik-24-wyciecie.png', 300, 330, 1020, 1020)
    p.rect(0, 900, 1080, 450, p.fade('g', 0, 900, 0, 1250, [(0, C['black'], 0), (1, C['black'], 1)]))
    p.layer('40-wynik')
    M.ribbon(p, 300, 120, 'KONIEC MECZU', 36)
    M.solid(p, str(r['home']), 72, 520, 330, C['red'], fx=ink)
    M.outline(p, str(r['away']), 72, 840, 330, C['white'], t=7)
    p.text('BEKAPAKA', 76, 585, 34, 'label', spacing=4, shadow=True)
    p.text(MT['away'], 76, 905, 34, 'label', spacing=4, fill=C['muted'], shadow=True)
    p.layer('50-dol'); M.chevrons(p, 140, 1010, 90); M.stripes(p, 72, 1180, 936)
    foot(p, 'ZDJĘCIE TYMCZASOWE · ' + NOTE); p.save()

def sklad():
    p = new('03-sklad', 'pierwsza piątka', bg=C['paper']); ink = mat.ink(p, shadow=False); paper(p)
    p.layer('20-naglowek'); M.mark_c(p, 'herb2mini', 132, 120, 116)
    p.text('SKŁAD MECZOWY', 210, 110, 30, 'label', fill=C['black'], spacing=3)
    p.text(f"vs {MT['away']} · {MT['date']}", 210, 146, 22, 'body', fill=MUT, spacing=2)
    w1 = sym.lettering(p, 'PIERWSZA', 72, 330, 120, fill=C['black'], fx=ink)
    sym.lettering(p, 'PIĄTKA', 72 + w1 + 30, 330, 120, fill=C['red'], fx=ink)
    M.stripes(p, 72, 360, 936, color=C['red'])
    p.layer('30-koszulki'); w = 250; prev = p.g; g = el('g', filter=f'url(#{ink})'); p.g.append(g); p.g = g
    slots = [(72, 430), (415, 430), (758, 430), (243, 810), (586, 810)]
    for (x, y), (nr, name, pos) in zip(slots, D['lineup']):
        kit.jersey(p, x, y, w, nr, name); k = w/200                     # siatka koszulki 200×260
        zone_n = (x+40*k, y+30*k, x+160*k, y+120*k)                         # dekolt … górna krawędź V
        NS = 23; capn = NS*.70; base = (zone_n[1]+zone_n[3])/2 + capn/2       # środek optyczny = środek wersalika
        b = p.text(name, x+w/2, base, NS, 'label', anchor='middle', max_width=120*k, spacing=1)
        M.register_pad(p, 'nazwisko na koszulce: ' + name, zone_n, M.G.rect(b[0], base-capn, b[2]-b[0], capn), 'y')
        zone_v = (x+4*k, y+120*k, x+196*k, y+260*k)                         # plecy poniżej linii V
        gnum = M.solid(p, nr, x+w/2, (zone_v[1]+zone_v[3])/2 + 110*.35, 110, C['white'], anchor='middle')
        M.register_pad(p, 'numer na koszulce: ' + nr, zone_v, gnum, 'y')
    p.g = prev
    for (x, y), (nr, name, pos) in zip(slots, D['lineup']):
        p.text(pos.upper(), x+w/2, y+w*1.3+32, 20, 'label', fill=C['black'], spacing=1, anchor='middle', max_width=w+80)
    foot(p, NOTE, dark=False); p.save()

def zawodnik_a():
    P = D['player']; p = new('04a-zawodnik', 'zawodnik A'); ink = mat.ink(p); plate(p, seams=False)
    p.layer('20-rama'); M.step_frame(p, 72, 150, 936, 1000, t=6, color=GOLD, step=34, inner=(14, 2))
    p.layer('30-numer'); M.outline(p, P['number'], 540, 960, 860, C['red'], t=6, anchor='middle', deco=True)
    p.layer('40-zawodnik'); p.clip('c-r', ('path', dict(d=M.G.d(M.G.inset(M.stepped(72, 150, 936, 1000, 34), 22)))))
    p.image(FOTO/'zawodnik-24-wyciecie.png', -40, 230, 1160, 1160, clip='c-r')
    p.rect(72, 860, 936, 290, p.fade('g', 0, 860, 0, 1150, [(0, C['black'], 0), (1, C['black'], .95)]))
    p.layer('50-nazwisko'); M.ribbon(p, 540, 90, 'ZAWODNIK BKPK', 34)
    p.text(P['first'] + '  ·  ' + P['role'], 540, 965, 32, 'label', spacing=5, anchor='middle', shadow=True)
    M.solid(p, P['last'], 540, 1105, 140, C['white'], anchor='middle', fx=ink)      # 45 px nad dolną krawędzią ramy (1150)
    foot(p, 'ZDJĘCIE TYMCZASOWE · ' + NOTE); p.save()

def zawodnik_b():
    P = D['player']; p = new('04b-mvp', 'MVP'); ink = mat.ink(p); plate(p, seams=False)
    p.layer('20-zloto'); M.seams(p, 540, 620, 520, t=3, color=GOLD, opacity=.35)
    p.layer('30-zawodnik'); p.image(FOTO/'zawodnik-24-wyciecie.png', 40, 260, 1000, 1000)
    p.rect(0, 880, 1080, 470, p.fade('g', 0, 880, 0, 1180, [(0, C['black'], 0), (1, C['black'], 1)]))
    p.layer('40-odznaka'); M.mark(p, 'mvp', 72, 70, 250)
    p.text('ZAWODNIK MECZU', 1008, 120, 30, 'label', spacing=4, anchor='end', fill=GOLD, shadow=True)
    p.text(f"vs {MT['away']} · {MT['date']}", 1008, 158, 22, 'body', anchor='end', fill=C['muted'])
    p.layer('50-nazwisko'); M.solid(p, P['last'], 540, 1080, 140, GOLD, anchor='middle', fx=ink)
    p.text(P['first'] + '  ·  #' + P['number'], 540, 1140, 32, 'label', spacing=5, anchor='middle', shadow=True)
    M.stripes(p, 72, 1180, 936, color=GOLD)
    foot(p, 'MVP DO POTWIERDZENIA · ' + NOTE); p.save()

def turniej():
    T = D['tournament']; p = new('05-turniej', 'turniej'); ink = mat.ink(p)
    p.layer('10-AI'); p.image(FOTO/'ai-puchar-martwa-natura.png', 160, 0, 1080, 1350)
    p.rect(0, 0, 760, 1350, p.fade('g', 0, 0, 760, 0, [(0, C['black'], 1), (.6, C['black'], .8), (1, C['black'], 0)]))
    p.layer('20-odznaka'); M.mark(p, 'turniej', 72, 70, 280)
    p.layer('30-tytul'); M.solid(p, T['title'][0], 72, 560, 190, C['white'], fx=ink); M.solid(p, T['title'][1], 72, 730, 170, C['red'], fx=ink)
    M.chevrons(p, 140, 770, 110)
    p.layer('40-info')
    M.solid(p, T['teams'], 72, 1010, 150, C['white'], fx=ink); p.text('DRUŻYN', 76, 1050, 26, 'label', spacing=3, shadow=True)
    M.solid(p, T['days'], 262, 1010, 150, C['white'], fx=ink); p.text('DZIEŃ', 266, 1050, 26, 'label', spacing=3, shadow=True)
    sym.icon_row(p, [('data', T['date']), ('hala', VENUE)], 72, 1130, size=30, text_size=26, shadow=True)
    M.stripes(p, 72, 1180, 600)
    foot(p, 'PUCHAR: ILUSTRACJA AI · ' + NOTE); p.save()

def relacja():
    R = D['report']; p = new('06-relacja', 'relacja', bg=C['paper']); ink = mat.ink(p, shadow=False); paper(p)
    p.layer('20-zdjecie'); fr = M.stepped(72, 150, 936, 760, 30)
    p.clip('c-f', ('path', dict(d=M.G.d(M.G.inset(fr, 14)))))
    sc = 760/1150; p.image(FOTO/'turniej-foto.jpg', 540-1000*sc, 150-820*sc, 1800*sc, 2400*sc, clip='c-f')
    M.shape(p, fr.difference(M.G.inset(fr, 8)), C['black'])
    p.layer('30-wstega'); M.ribbon(p, 540, 880, R['kicker'], 34)
    p.layer('40-tytul')
    M.solid(p, R['title'][0], 540, 1060, 66, C['black'], anchor='middle', fx=ink)
    M.solid(p, R['title'][1], 540, 1130, 66, C['red'], anchor='middle', fx=ink)
    p.text(R['lead'][0] + ' ' + R['lead'][1], 540, 1190, 24, 'body', fill=C['black'], anchor='middle', max_width=936)
    foot(p, 'WIZERUNEK TYLKO ZA ZGODĄ', dark=False); p.save()

def partnerzy():
    import partnerzy as PZ
    p = new('07-partnerzy', 'partnerzy'); ink = mat.ink(p); plate(p, seams=False)
    p.layer('20-naglowek'); M.ribbon(p, 540, 64, 'PARTNERZY KLUBU', 34)
    M.solid(p, 'GRAJĄ Z NAMI', 540, 300, 140, C['white'], anchor='middle', fx=ink)
    p.text('Dzięki nim w Bobolicach gra się w koszykówkę. Dziękujemy!', 540, 356, 24, 'body', anchor='middle', fill='#DCD8D0', max_width=936)
    p.layer('30-partnerzy')                                   # jeden poziom: bez podziału na grupy
    ids = PZ.ids_all(); PZ.wall(p, 72, 1008, 500, 222, 168, 18, [ids[0:4], ids[4:8], ids[8:]], text_size=20)
    M.stripes(p, 72, 1190, 936)
    foot(p, 'TWOJA FIRMA TEŻ MOŻE GRAĆ Z NAMI'); p.save()

def terminarz():
    S = D['schedule']; p = new('08-terminarz', 'terminarz', bg=C['paper']); ink = mat.ink(p, shadow=False); paper(p)
    p.layer('20-naglowek'); M.mark_c(p, 'herb2mini', 132, 120, 116)
    p.text('TERMINARZ', 210, 110, 30, 'label', fill=C['black'], spacing=3); p.text('KALK · ' + VENUE, 210, 146, 22, 'body', fill=MUT, spacing=2)
    sym.lettering(p, S['month'], 72, 330, 110, fill=C['black'], fx=ink)
    M.stripes(p, 72, 360, 936)
    p.layer('30-wiersze'); y0, row = 560, 160
    for i, (date, when, rival, kol) in enumerate(S['rows']):
        y = y0 + i*row
        M.blade_panel(p, 72, y-120, 936, 140, '#FFFFFF' if i % 2 == 0 else '#EFEBE3', left=False)
        top_, bot_ = y-120, y+20; cy = (top_+bot_)/2
        slant = 140*M.G.A24*1.6; inner = (72+28, top_, 72+936-slant-28, bot_)   # część prostokątna belki, margines 28
        sym.lettering(p, date, 100, cy + 92*.70/2, 92, fill=C['red'], fx=ink)
        # blok: rywal (wersalik 0.70·54) + 14 + wiersz godziny (wersalik ~0.70·22)
        blk = 54*.70 + 22 + 22*.70; ty = cy - blk/2                      # 22 px: nawiasy [ ] schodzą pod linię bazową
        b1 = p.text(rival, 360, ty + 54*.70, 54, fill=C['black'], max_width=400, fx=ink)
        sym.icon_row(p, [('godzina', when)], 362, ty + blk, size=22, text_size=22, color=MUT)
        M.register_pad(p, 'blok rywala: ' + rival, inner, M.G.rect(360, ty, 10, blk), 'y')
        b = p.text(kol, inner[2], cy + 22*.70/2, 22, 'label', fill=MUT, spacing=3, anchor='end', max_width=150)
        sym.place(p, 'ikona-mecz', b[0] - 12 - 28, cy - 14, 28)
        M.register_pad(p, 'kolejka: ' + kol, inner, M.G.rect(b[0]-40, b[1], b[2]-b[0]+40, b[3]-b[1]), 'y')
    foot(p, NOTE, dark=False); p.save()

def zapowiedz_kwadrat():
    p = Poster(HERE, '01a-zapowiedz-kwadrat', 'BeKaPaKa — zapowiedź 1:1', D['_status'], w=1080, h=1080); ink = mat.ink(p)
    p.layer('10-plyta'); mat.plate(p); M.seams(p, 540, 500, 420, t=2.5, color=C['red'], opacity=.18)
    M.ribbon(p, 540, 60, 'DZIEŃ MECZU', 38)
    cy = 380; M.mark_c(p, 'herb2', 540-PAIR_D, cy, 280); M.rival_c(p, 540+PAIR_D, cy, 280*OPT, MT['awayShort'])
    M.solid(p, 'VS', 540, cy+40, 110, C['white'], anchor='middle', fx=ink)
    p.text('BEKAPAKA', 540-PAIR_D, cy+200, 34, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 540+PAIR_D, cy+200, 34, 'label', spacing=4, anchor='middle', shadow=True)
    M.panel_text(p, MT['time'], 200, 650, 680, 170, 150, C['white'], fx=ink, fill=C['black'], keyline=(9, 3, GOLD))
    p.text(f"{MT['day']} · {MT['date']} · {VENUE}", 540, 880, 26, 'label', spacing=3, anchor='middle', shadow=True)
    M.stripes(p, 72, 920, 936)
    sym.place(p, 'wordmark-negatyw', 72, 986, h=50); p.text(NOTE, 1008, 1026, 20, 'body', fill=C['muted'], anchor='end')
    p.save()

def zapowiedz_poziom():
    p = Poster(HERE, '01a-zapowiedz-poziom', 'BeKaPaKa — zapowiedź 16:9', D['_status'], w=1920, h=1080); ink = mat.ink(p)
    p.layer('10-plyta'); p.image(mat.MAT/'plyta-czysta.png', 0, -400, 1920, 2400)
    p.rect(0, 0, 1920, 1080, p.fade('g', 0, 0, 0, 1080, [(0, C['black'], .6), (.5, C['black'], .2), (1, C['black'], .7)]))
    M.seams(p, 960, 520, 480, t=2.5, color=C['red'], opacity=.18)
    M.ribbon(p, 960, 70, 'DZIEŃ MECZU', 40)
    p.text(f"{MT['day']} · {MT['date']}", 960, 190, 28, 'label', spacing=5, anchor='middle', shadow=True)
    cy = 500; d = 560
    M.mark_c(p, 'herb2', 960-d, cy, 400); M.rival_c(p, 960+d, cy, 400*OPT, MT['awayShort'])
    p.text('BEKAPAKA', 960-d, cy+260, 40, 'label', spacing=4, anchor='middle', shadow=True)
    p.text(MT['away'], 960+d, cy+260, 40, 'label', spacing=4, anchor='middle', shadow=True)
    M.solid(p, 'VS', 960, 380, 110, C['white'], anchor='middle', fx=ink)
    M.panel_text(p, MT['time'], 660, 450, 600, 220, 190, C['white'], fx=ink, fill=C['black'], keyline=(10, 4, GOLD))
    sym.icon_row_c(p, [('hala', VENUE)], 960, 740, size=30, text_size=28, shadow=True)
    M.stripes(p, 96, 900, 1728)
    sym.place(p, 'wordmark-negatyw', 96, 970, h=56); p.text(NOTE, 1824, 1014, 20, 'body', fill=C['muted'], anchor='end')
    p.m = 96; p.save()
