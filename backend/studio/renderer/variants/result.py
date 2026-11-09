"""Result variants 4-10 (wynik końcowy, przerwa, na żywo).
Score rules everywhere: BeKaPaKa first (left or on top), the leading score solid, the other outlined, no "VS",
a missing score is a dash, WYGRANA/PORAŻKA only from a confirmed final score, no triumphant effects for a loss."""
from poster import C, width
import motyw as M, sym
from render import text, photo, date_parts, LayoutError
from render_v3 import rival, venue_caps, POSTER_LAYOUT
from render import mark
from .common import fmt, muted, pair, team_names, letters, icon_line, fit
from .announcement import V as v_shape, mark_on, TAN24

def scores(p):
    d=p.data;return d.get('scoreUs'),d.get('scoreThem')

def label(p):
    us,them=scores(p)
    if p.variant=='final':
        if us is None or them is None:return 'WYNIK DO POTWIERDZENIA'
        return 'WYGRANA' if us>them else 'PORAŻKA' if us<them else 'WYNIK DO POTWIERDZENIA'
    return 'PRZERWA' if p.variant=='halftime' else 'NA ŻYWO'

def won(p):
    us,them=scores(p);return p.variant=='final' and us is not None and them is not None and us>them

def label_color(p):
    """Gold only for a confirmed win or a live state; a loss is reported in plain white."""
    if p.paper:return p.accent
    return (M.GOLD if p.kit=='A' else p.accent) if won(p) or p.variant!='final' else C['white']

def meta(p):
    d=p.data;day,_=date_parts(d.get('date','')) if d.get('date') else ('','')
    head='KONIEC MECZU' if p.variant=='final' else (d.get('phase') or label(p)).upper()
    return ' · '.join(x for x in [head,day.split(' · ')[-1] if day else '',venue_caps(d.get('venue',''))] if x)

def header(p,x,y,anchor='start',maxw=None,meta_color=None):
    maxw=maxw or p.w-2*p.m
    text(p,label(p),x,y,30,'label',label_color(p),anchor,maxw,minimum=24)
    text(p,meta(p),x,y+44,24,'label',meta_color or muted(p),anchor,maxw,minimum=20)
    return y+44

def score(p,ours,x,y,size,anchor='middle',maxw=None,ink=None,cut=True):
    """One team's score: solid when it leads (ours in the accent unless `ink`), outlined otherwise."""
    us,them=scores(p);val=us if ours else them;s='—' if val is None else str(val)
    lead=us is not None and them is not None and ((us>them and ours) or (them>us and not ours))
    color=ink or (p.accent if ours else C['white'])
    if lead:return letters(p,s,x,y,size,color,anchor,maxw,minimum=60,cut=cut)
    return letters(p,s,x,y,size,ink or C['white'],anchor,maxw,minimum=60,outline=True,t=max(5,size*.025))

# --- 4 · Wynik w pionie: two rows, team on the left and its score on the right -------------------------------
def v4(p):
    land=p.w>p.h
    if land:
        y=header(p,p.m,150,maxw=760)
        pair(p,p.w/2+420,300,200,170)
        x0,x1,r0,rh=p.m,p.w-p.m,520,190
    else:
        y=header(p,p.w/2,fmt(p,150,330,110,0),'middle')
        mh=fmt(p,200,290,150,0);cy=y+fmt(p,70,150,26,0)+mh/2
        pair(p,p.w/2,cy,mh,fmt(p,270,270,250,0))
        x0,x1=p.m,p.w-p.m;r0=cy+mh/2+fmt(p,250,380,150,0);rh=fmt(p,280,400,170,0)
    ss=fmt(p,230,340,150,190)
    opp=(p.data.get('opponent') or 'RYWAL').upper()
    for i,(name,ours) in enumerate([('BEKAPAKA',True),(opp,False)]):
        base=r0+i*rh
        letters(p,name,x0,base-ss*.12,fmt(p,70,84,54,70),C['white'] if ours else muted(p),'start',(x1-x0)-ss*1.3,minimum=28)
        score(p,ours,x1,base,ss,'end',ss*1.8)
        if i==0:M.stripes(p,x0,base+fmt(p,40,56,28,36),x1-x0,color=p.accent)

# --- 5 · Pas wyniku: the score on a full-bleed accent band under the wings -----------------------------------
def v5(p):
    land=p.w>p.h
    y=header(p,p.w/2,fmt(p,150,330,110,150),'middle',fmt(p,900,900,900,1000))
    mh,delta=fmt(p,(210,270),(290,270),(150,250),(220,560))
    cy=y+fmt(p,50,190,40,40)+mh/2
    pair(p,p.w/2,cy,mh,delta)
    team_names(p,p.w/2,cy+mh/2+fmt(p,58,70,42,56),delta,fmt(p,32,36,26,32),fmt(p,330,330,320,420))
    by=cy+mh/2+fmt(p,130,260,80,110);bh=fmt(p,300,460,210,250)
    M.chevrons(p,p.w/2,by-fmt(p,80,100,60,80),120 if p.h>p.w else 100,colors=(p.accent,p.accent))
    M.blade_panel(p,-40,by,p.w+80,bh,p.accent)
    ss=fmt(p,240,360,170,210);base=by+bh/2+ss*.356;gap=fmt(p,60,60,50,80)
    score(p,True,p.w/2-gap,base,ss,'end',p.w/2-p.m-gap-10,ink=C['white'])
    M.solid(p,':',p.w/2,base-ss*.06,ss*.5,C['white'],anchor='middle',cut=False)
    score(p,False,p.w/2+gap,base,ss,'start',p.w/2-p.m-gap-10,ink=C['white'])

# --- 6 · Podział 24°: each team's score on its half of the split board --------------------------------------
def v6(p):
    off=p.h*TAN24;xt=p.w/2+off/2;xb=p.w/2-off/2
    p.layer('20-podzial');p.poly([(0,0),(xt,0),(xb,p.h),(0,p.h)],p.accent,opacity=.94)
    p.poly([(xt,0),(xt+14,0),(xb+14,p.h),(xb,p.h)],'#AE1027' if p.kit=='A' else '#C85F0F')
    p.layer('30-tresc')
    text(p,label(p),p.m,fmt(p,150,330,110,150),30,'label',C['white'],maxw=fmt(p,520,600,460,700),minimum=24)
    text(p,meta(p),p.m,fmt(p,194,374,154,194),24,'label',C['white'],maxw=fmt(p,700,760,700,900))
    cy,mh,delta=fmt(p,(470,240,250),(800,280,250),(370,170,250),(420,240,440))
    mark_on(p,p.w/2-delta,cy,mh,'B' if p.kit=='B' else 'bialy');rival(p,p.w/2+delta,cy,mh*1.08)
    ny=cy+mh/2+fmt(p,60,70,44,60)
    team_names(p,p.w/2,ny,delta,fmt(p,32,36,26,32),fmt(p,330,330,320,420),C['white'])
    ss=fmt(p,260,320,170,260);base=ny+fmt(p,60,80,40,40)+ss*.72
    score(p,True,p.w/2-delta,base,ss,'middle',fmt(p,420,420,400,600),ink=C['white'])
    score(p,False,p.w/2+delta,base,ss,'middle',fmt(p,420,420,400,600),ink=C['white'])

# --- 7 · Pełne zdjęcie: full-bleed photo, score bar at the bottom --------------------------------------------
def v7(p):
    d=p.data
    p.layer('15-zdjecie');photo(p,d.get('photoAssetId'),0,0,p.w,p.h,d.get('crop'))
    p.rect(0,0,p.w,p.h,p.fade('v7-shade',0,0,0,p.h,[(0,C['black'],.75),(.3,C['black'],.1),(.55,C['black'],.25),(.8,C['black'],.95),(1,C['black'],1)]))
    p.layer('30-tresc')
    header(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,700,800,700,1100),meta_color=C['white'])
    # Score row over the darkened bottom of the photo, the mark pair and names under it.
    base=fmt(p,840,1250,640,640);ss=fmt(p,250,320,170,230)
    score(p,True,p.w/2-40,base,ss,'end',p.w/2-p.m-60)
    M.solid(p,':',p.w/2,base-ss*.06,ss*.5,C['white'],anchor='middle',cut=False)
    score(p,False,p.w/2+40,base,ss,'start',p.w/2-p.m-60)
    mh=fmt(p,150,190,0,150);delta=fmt(p,300,300,0,560)
    if p.format_name=='square':
        text(p,'BEKAPAKA – '+(d.get('opponent') or 'RYWAL').upper(),p.w/2,base+70,28,'label',C['white'],'middle',p.w-2*p.m,minimum=22);return
    cy=base+fmt(p,60,90,0,90)+mh/2 if p.h>p.w else base-ss*.36
    pair(p,p.w/2,cy,mh,delta)
    team_names(p,p.w/2,cy+mh/2+fmt(p,52,64,0,52),delta,fmt(p,28,32,0,28),fmt(p,330,330,0,420),C['white'])

# --- 8 · Zdjęcie w ramie: photo in the stepped frame, score column beside it ---------------------------------
def v8(p):
    d=p.data;land=p.w>p.h;gold=M.GOLD if p.kit=='A' else p.accent
    header(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,900,900,900,900))
    fx,fy,fw,fh=fmt(p,(p.m,230,560,620),(p.m,420,560,760),(p.m,190,500,420),(p.m,230,760,600))
    st=26;M.step_frame(p,fx,fy,fw,fh,t=6,color=gold,step=st)
    # The photo fills the frame below its steps; the frame stays visible around it.
    photo(p,d.get('photoAssetId'),fx+14,fy+2*st+14,fw-28,fh-2*st-28,d.get('crop'))
    cx=fx+fw+(p.w-p.m-fx-fw)/2;colw=p.w-p.m-fx-fw-40
    opp=(d.get('opponent') or 'RYWAL').upper()
    if land:
        # Landscape: both scores side by side in the column, the mark pair under them.
        ss=230;base=fy+300;dx=200
        score(p,True,cx-dx,base,ss,'middle',360);score(p,False,cx+dx,base,ss,'middle',360)
        team_names(p,cx,base+60,dx,30,360,C['white'])
        pair(p,cx,fy+fh-110,200,dx);return
    ss=fmt(p,210,240,150,0)
    y1=fy+fmt(p,240,280,170,0)
    score(p,True,cx,y1,ss,'middle',colw)
    text(p,'BEKAPAKA',cx,y1+fmt(p,54,60,42,0),30,'label',C['white'],'middle',colw,minimum=22)
    y2=y1+fmt(p,300,340,210,0)
    score(p,False,cx,y2,ss,'middle',colw)
    text(p,opp,cx,y2+fmt(p,54,60,42,0),26,'label',muted(p),'middle',colw,minimum=20)
    if p.format_name=='square':return  # no room under the frame; the column names both teams
    mh=fmt(p,170,220,0,0);cy=fy+fh+fmt(p,60,110,0,0)+mh/2
    pair(p,p.w/2,cy,mh,300)

# --- 9 · Plakat pionowy: scores stacked on the hall, headline above ------------------------------------------
def v9(p):
    d=p.data;land=p.w>p.h;us,them=scores(p)
    p.layer('15-cien')
    p.rect(0,0,p.w,p.h,p.fade('v9-shade',0,0,p.w,0,[(0,C['black'],.95),(.55,C['black'],.75),(1,C['black'],.25)]))
    p.layer('20-naglowek')
    hh=fmt(p,190,210,150,190);hy=fmt(p,200,400,170,200)
    mark(p,p.w-p.m-hh*.66,hy,hh)
    head=label(p) if p.variant!='final' or (us is not None and them is not None) else 'WYNIK'
    head='WYNIK' if head=='WYNIK DO POTWIERDZENIA' else head
    letters(p,head,p.m,hy+30,fmt(p,130,150,100,140),C['white'],maxw=p.w-2*p.m-hh*1.4,minimum=50)
    if d.get('kicker'):text(p,d['kicker'].upper(),p.m,hy+74,26,'label',M.GOLD,maxw=p.w-2*p.m-hh*1.4)
    p.layer('40-wynik')
    ss=fmt(p,330,420,250,270);opp=(d.get('opponent') or 'RYWAL').upper()
    rows=fmt(p,(560,880),(860,1260),(480,760),(500,760))
    for (base,ours) in zip(rows,[True,False]):
        b=score(p,ours,p.m,base,ss,'start',fmt(p,560,600,480,700),cut=False)
        x=(b[2] if b else p.m+300)+40
        text(p,'BEKAPAKA' if ours else opp,x,base-ss*.36+14,fmt(p,40,46,32,44),'label',C['white'] if ours else muted(p),maxw=p.w-p.m-x,minimum=22)
    M.chevrons(p,p.w-p.m-hh*.66,hy+hh/2+fmt(p,60,70,40,60),110,colors=(p.accent,p.accent))
    p.layer('50-meta')
    day,_=date_parts(d.get('date','')) if d.get('date') else ('','')
    items=[i for i in [('data',day.split(' · ')[-1]),('hala',venue_caps(d.get('venue','')))] if i[1]]
    if items:sym.icon_row(p,items,p.m,fmt(p,1010,1460,860,840),size=26,text_size=24,color=C['white'])

# --- 10 · Wynik i liczby: compact scoreboard and the match numbers -------------------------------------------
def v10(p):
    d=p.data;land=p.w>p.h
    y=header(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,900,900,900,1000))
    ss=fmt(p,230,300,150,220);base=y+fmt(p,60,110,30,60)+ss*.72;cx=p.w/2 if not land else 560
    half=(cx-p.m-60) if not land else 380
    score(p,True,cx-40,base,ss,'end',half)
    M.solid(p,':',cx,base-ss*.06,ss*.5,C['white'],anchor='middle',cut=False)
    score(p,False,cx+40,base,ss,'start',half)
    text(p,'BEKAPAKA – '+(d.get('opponent') or 'RYWAL').upper(),cx,base+fmt(p,64,80,48,64),fmt(p,30,34,24,30),'label',C['white'],'middle',(p.w-2*p.m) if not land else 860,minimum=22)
    # Match numbers: quarter scores when confirmed, else the two hero numbers; without them the section is omitted.
    gx0,gx1=(p.m,p.w-p.m) if not land else (1080,p.w-p.m)
    gy=base+fmt(p,130,170,80,0) if not land else 170
    qs=(d.get('quarters') or [])[:4];bottom=gy
    if qs:
        cols=len(qs) if not land and p.format_name!='story' else 2;gap=16;bw=(gx1-gx0-gap*(cols-1))/cols;bh=fmt(p,150,190,110,170)
        for i,q in enumerate(qs):
            r,c=divmod(i,cols);qx=gx0+c*(bw+gap);qy=gy+r*(bh+gap)
            p.rect(qx,qy,bw,bh,'#000000',opacity=.45,stroke=p.accent,**{'stroke-width':2})
            p.rect(qx,qy,bw,6,p.accent)
            text(p,q.get('label','').upper(),qx+bw/2,qy+fmt(p,44,50,36,46),22,'label',muted(p),'middle',bw-20)
            letters(p,f"{q['us']}:{q['them']}",qx+bw/2,qy+bh-fmt(p,28,34,20,30),fmt(p,64,96,46,72),C['white'],'middle',bw-24,minimum=34,cut=False)
        bottom=gy+((len(qs)+cols-1)//cols)*(bh+gap)
    else:
        stats=(d.get('heroStats') or [])[:2]
        for i,st in enumerate(stats):
            x=gx0+i*(gx1-gx0)/2;b=gy+fmt(p,110,140,80,110)
            letters(p,st['value'],x,b,fmt(p,120,150,90,120),p.accent if i==0 else C['white'],maxw=(gx1-gx0)/2-30,minimum=40,cut=False)
            text(p,st['label'].upper(),x,b+44,24,'label',C['white'],maxw=(gx1-gx0)/2-30,minimum=20)
        if stats:bottom=gy+fmt(p,180,220,130,180)
    # The mark pair closes the composition.
    mh=fmt(p,170,230,150,200)
    if land:pair(p,cx,base+260,mh,300);return
    cy=max(bottom+fmt(p,40,80,30,0)+mh/2,fmt(p,0,1500,0,0));pair(p,p.w/2,cy,mh,300)

v9.style='poster'
LAYOUTS={4:v4,5:v5,6:v6,7:v7,8:v8,9:v9,10:v10}
