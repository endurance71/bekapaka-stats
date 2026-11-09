"""Announcement variants 4-10 (zapowiedź, dzień meczu, przełożony, odwołany).
Shared: brand material, stripes and footer (render_v3), the mark pair with the rival's shield or logo, the state label,
the time slot (kick-off / GODZINA TBC / ODWOŁANY), hall and confirmed entry information. They differ in hero, grid
and leading motif (see design-variants.js)."""
from poster import C
import motyw as M
from render import text, LayoutError
from render_v3 import rival, NAVY_D
from .common import (fmt, when, hero_time, muted, pair, team_names, letters, venue_block, postponed_lines, kicker, icon_line)

MONTHS=['STYCZNIA','LUTEGO','MARCA','KWIETNIA','MAJA','CZERWCA','LIPCA','SIERPNIA','WRZEŚNIA','PAŹDZIERNIKA','LISTOPADA','GRUDNIA']
TAN24=0.4452  # brand angle: edges at 66° to the horizontal (24° from the vertical)

def top_lines(p,x,y,anchor='start',maxw=None,color=None):
    """State label, then the date (or, when postponed, the struck original and the new date). Returns next baseline."""
    maxw=maxw or p.w-2*p.m;kicker(p,x,y,anchor,maxw,color);y+=46
    if p.variant=='postponed':return postponed_lines(p,x,y,anchor,maxw,24,color)
    day,_=when(p)
    if day:text(p,day,x,y,24,'label',color or muted(p),anchor,maxw);y+=46
    return y

# --- 4 · Nazwa rywala: headline column, wings, pair and time below -------------------------------------------
def v4(p):
    land=p.w>p.h;col=1000 if land else p.w-2*p.m
    ky=fmt(p,150,330,120,150)
    M.chevrons(p,p.w-p.m-75,fmt(p,96,300,70,96),150,colors=(p.accent,p.accent))
    y=top_lines(p,p.m,ky,maxw=col-200)
    size=fmt(p,170,200,120,170);y+=size*.78
    letters(p,'BEKAPAKA',p.m,y,size,C['white'],maxw=col)
    opp=(p.data.get('opponent') or 'RYWAL').upper();y+=size*.95
    letters(p,opp,p.m,y,size,p.accent,maxw=col,outline=True)
    y+=fmt(p,40,50,30,40);M.stripes(p,p.m,y,col,color=p.accent)
    if land:
        cx=1490;mh=210;pair(p,cx,300,mh,175)
        ty=letters(p,hero_time(p),cx,600,170,C['white'],'middle',600,cut=False)
        venue_block(p,cx,700,'middle',620,26,42);return
    mh=fmt(p,190,290,150,0);cy=y+fmt(p,90,180,30,0)+mh/2
    pair(p,p.w/2,cy,mh,fmt(p,300,270,330,0))
    ts=fmt(p,150,280,0,0)
    if p.format_name=='square':
        # Square: the time sits between the two marks.
        letters(p,hero_time(p),p.w/2,cy+38,96,C['white'],'middle',300,cut=False)
        venue_block(p,p.w/2,cy+mh/2+60,'middle',None,24,38);return
    letters(p,hero_time(p),p.w/2,cy+mh/2+fmt(p,40,90,0,0)+ts*.72,ts,C['white'],'middle',p.w-2*p.m,cut=False)
    venue_block(p,p.w/2,cy+mh/2+fmt(p,40,90,0,0)+ts*.72+fmt(p,70,100,0,0),'middle',None,fmt(p,28,32,0,0),fmt(p,44,50,0,0))

# --- 5 · Wielka godzina: full-bleed accent band with the time as hero -----------------------------------------
def v5(p):
    land=p.w>p.h
    if land:
        y=top_lines(p,p.w/2,150,'middle',700)
        mh=210;pair(p,p.w/2,360,mh,560)
        team_names(p,p.w/2,360+mh/2+60,560,32,400)
        by,bh=580,190
    else:
        y=top_lines(p,p.w/2,fmt(p,150,330,110,0),'middle')
        mh=fmt(p,220,290,160,0);cy=y+fmt(p,30,140,0,0)+mh/2
        pair(p,p.w/2,cy,mh,fmt(p,270,270,250,0))
        team_names(p,p.w/2,cy+mh/2+fmt(p,62,74,46,0),fmt(p,270,270,250,0),fmt(p,32,36,26,0),330)
        by=cy+mh/2+fmt(p,110,200,76,0);bh=fmt(p,280,420,190,0)
    label=hero_time(p);size=fmt(p,230,340,150,180) if label[0].isdigit() else fmt(p,120,150,90,120)
    # The band bleeds past both edges; its lettering stays inside the margins.
    M.blade_panel(p,-40,by,p.w+80,bh,p.accent)
    letters(p,label,p.w/2,by+bh/2+fit_half(label,size,p.w-2*p.m-40),size,C['white'],'middle',p.w-2*p.m-40,cut=label[0].isdigit())
    venue_block(p,p.w/2,by+bh+fmt(p,70,130,60,66),'middle',None,fmt(p,28,32,28,26),fmt(p,44,50,44,40))

def fit_half(s,size,maxw):
    """Half the cap height of fitted lettering: baseline offset that centres it vertically."""
    from .common import fit
    return fit(s,size,maxw,cut=s[0].isdigit())*.356

# --- 6 · Skrzydła V: the jersey V from the top edge, pair under the apex ---------------------------------------
def V(p,cx,top,apex,half_out,arm):
    dark='#AE1027' if p.kit=='A' else '#C85F0F'
    k=(apex-top)/half_out
    p.poly([(cx-half_out,top),(cx-half_out+arm,top),(cx,apex-arm*k),(cx+half_out-arm,top),(cx+half_out,top),(cx,apex)],p.accent)
    d=arm*.28
    p.poly([(cx-half_out+arm,top),(cx-half_out+arm+d,top),(cx,apex-(arm+d)*k),(cx+half_out-arm-d,top),(cx+half_out-arm,top),(cx,apex-arm*k)],dark)

def v6(p):
    land=p.w>p.h
    apex=fmt(p,470,740,320,430);V(p,p.w/2,0,apex,fmt(p,470,470,470,620),fmt(p,120,130,100,150))
    y=top_lines(p,p.w/2,fmt(p,150,330,105,150),'middle',fmt(p,520,520,560,760))
    if land:
        mh=240;cy=560;pair(p,p.w/2,cy,mh,560)
        letters(p,hero_time(p),p.w/2,cy+70,190,C['white'],'middle',520,cut=False)
        team_names(p,p.w/2,cy+mh/2+60,560,32,400)
        venue_block(p,p.w/2,cy+mh/2+130,'middle',900,26,40);return
    mh=fmt(p,230,290,170,0);cy=apex+fmt(p,40,120,10,0)+mh/2
    pair(p,p.w/2,cy,mh,fmt(p,270,270,250,0))
    ny=cy+mh/2+fmt(p,60,70,44,0);team_names(p,p.w/2,ny,fmt(p,270,270,250,0),fmt(p,32,36,26,0),330)
    ts=fmt(p,150,260,96,0);ty=ny+fmt(p,40,110,30,0)+ts*.72
    letters(p,hero_time(p),p.w/2,ty,ts,C['white'],'middle',p.w-2*p.m,cut=False)
    venue_block(p,p.w/2,ty+fmt(p,70,120,52,0),'middle',None,fmt(p,28,32,24,0),fmt(p,44,50,38,0))

# --- 7 · Podział 24°: the board split at the brand angle, our half in colour ----------------------------------
def mark_on(p,cx,cy,h,pal):
    """Our mark in a given palette (white on the colour half) with the usual minimum and protection zone."""
    b=M.mark_c(p,'herb2',cx,cy,h,pal=pal)
    if b[2]-b[0]<150:raise LayoutError('logo: Znak marki poniżej minimalnego rozmiaru')
    s=(b[2]-b[0])/8;p.protected.append([b[0]-s,b[1]-s,b[2]+s,b[3]+s])

def v7(p):
    off=p.h*TAN24;xt=p.w/2+off/2;xb=p.w/2-off/2
    p.layer('20-podzial');p.poly([(0,0),(xt,0),(xb,p.h),(0,p.h)],p.accent,opacity=.94)
    p.poly([(xt,0),(xt+14,0),(xb+14,p.h),(xb,p.h)],'#AE1027' if p.kit=='A' else '#C85F0F')
    p.layer('30-tresc')
    split=lambda y:xt-(xt-xb)*y/p.h
    y=top_lines(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,560,640,460,700),color=C['white'])
    land=p.w>p.h
    cy,mh,delta=fmt(p,(560,260,250),(880,280,250),(420,180,250),(430,260,440))
    mark_on(p,p.w/2-delta,cy,mh,'B' if p.kit=='B' else 'bialy');rival(p,p.w/2+delta,cy,mh*1.08)
    if split(cy+mh/2)<p.w/2-delta+mh*.55 or split(cy-mh/2)>p.w/2+delta-mh*.5:raise LayoutError('layout: Znaki nachodzą na linię podziału')
    team_names(p,p.w/2,cy+mh/2+fmt(p,64,70,46,64),delta,fmt(p,34,36,26,34),fmt(p,330,330,320,420),C['white'])
    ts=fmt(p,190,280,130,200)
    letters(p,hero_time(p),p.w-p.m,fmt(p,1010,1480,770,810),ts,C['white'],'end',fmt(p,520,560,420,640),cut=False)
    vy=fmt(p,1060,1600,820,770)
    if land:venue_block(p,p.m,vy-60,'start',640,26,42)
    else:venue_block(p,p.w-p.m,vy,'end',p.w-2*p.m,fmt(p,26,28,24,0),fmt(p,42,44,36,0))

# --- 8 · Rama stopniowana: pair inside the gold stepped frame, ribbon on its edge ------------------------------
def v8(p):
    land=p.w>p.h;gold=M.GOLD if p.kit=='A' else p.accent
    fx0,fy0,fx1,fy1=fmt(p,(p.m,170,p.w-p.m,760),(p.m,350,p.w-p.m,1180),(p.m,120,p.w-p.m,560),(p.m,170,1060,850))
    M.step_frame(p,fx0,fy0,fx1-fx0,fy1-fy0,t=6,color=gold,step=26)
    from render_v3 import ribbon
    cx=(fx0+fx1)/2;label={'standard':'ZAPOWIEDŹ','matchday':'DZIEŃ MECZU','postponed':'PRZEŁOŻONY','cancelled':'ODWOŁANY'}[p.variant]
    if land:M.ribbon(p,cx,fy0-26,label,36,fill=gold if p.kit=='A' else p.accent,ink=C['black'] if p.kit=='A' else C['white'],tail=M.GOLD_D if p.kit=='A' else '#E0600A')
    else:ribbon(p,label,fy0-fmt(p,26,28,22,0),grey=p.variant=='cancelled')
    mh,delta=fmt(p,(240,250),(320,250),(170,250),(250,230))
    cy=(fy0+fy1)/2-fmt(p,30,40,24,30)
    pair(p,cx,cy,mh,delta)
    team_names(p,cx,cy+mh/2+fmt(p,62,72,46,62),delta,fmt(p,32,36,26,32),fmt(p,330,330,320,380))
    if land:
        x=1150;y=top_lines(p,x,260,maxw=640)
        letters(p,hero_time(p),x,y+150,200,C['white'],maxw=640,cut=False)
        venue_block(p,x,y+240,'start',640,26,42);return
    day,_=when(p);y=fy1+fmt(p,70,90,56,0)
    if p.variant=='postponed':y=postponed_lines(p,p.w/2,y,'middle',None,24)
    elif day:text(p,day,p.w/2,y,26,'label',muted(p),'middle',p.w-2*p.m);y+=fmt(p,30,40,20,0)
    ts=fmt(p,150,280,100,0);y+=ts*.76
    letters(p,hero_time(p),p.w/2,y,ts,p.accent,'middle',p.w-2*p.m,cut=False)
    venue_block(p,p.w/2,y+fmt(p,64,90,50,0),'middle',None,fmt(p,26,28,24,0),fmt(p,42,44,36,0))

# --- 9 · Data w obrysie (papier): day of month in a giant outline, pair flanks the time -----------------------
def date_bits(p):
    d=p.data.get('date')
    if not d:return None
    from datetime import datetime
    from zoneinfo import ZoneInfo
    t=datetime.fromisoformat(d.replace('Z','+00:00'))
    if t.tzinfo:t=t.astimezone(ZoneInfo('Europe/Warsaw'))
    return str(t.day),MONTHS[t.month-1],str(t.year)

def v9(p):
    land=p.w>p.h;bits=date_bits(p)
    y=top_lines(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,560,640,500,700))
    ns=fmt(p,400,640,260,520);base=y+ns*.66
    if bits:
        b=letters(p,bits[0],p.m,base,ns,p.accent,outline=True,t=ns*.025,minimum=120)
        mx=b[2]+36
        text(p,bits[1],mx,base-ns*.36,fmt(p,52,60,40,60),'display',C['black'],maxw=(1000 if land else p.w-p.m)-mx,minimum=30)
        text(p,bits[2],mx,base-ns*.36+fmt(p,52,60,44,60),fmt(p,30,34,26,34),'label',muted(p),maxw=(1000 if land else p.w-p.m)-mx)
    else:letters(p,'TERMIN',p.m,base,ns*.5,p.accent,maxw=(860 if land else p.w-2*p.m),outline=True)
    y=base+fmt(p,40,50,30,50);M.stripes(p,p.m,y,(1000 if land else p.w)-2*p.m+(p.m if land else 0)-(0 if land else 0),color=p.accent)
    if land:
        x=1080;opp=(p.data.get('opponent') or 'RYWAL').upper()
        letters(p,'BEKAPAKA',x,260,96,C['black'],maxw=712);letters(p,opp,x,360,96,p.accent,maxw=712)
        cy=520;pair(p,1436,cy,170,260);letters(p,hero_time(p),1436,cy+40,100,C['black'],'middle',300,cut=False)
        venue_block(p,1436,cy+150,'middle',700,26,40);return
    opp=(p.data.get('opponent') or 'RYWAL').upper()
    y+=fmt(p,96,120,70,0)
    letters(p,'BEKAPAKA – '+opp,p.m,y,fmt(p,76,100,56,0),C['black'],maxw=p.w-2*p.m,minimum=34)
    mh=fmt(p,170,260,150,0);cy=y+fmt(p,50,150,26,0)+mh/2;delta=fmt(p,330,300,340,0)
    pair(p,p.w/2,cy,mh,delta)
    letters(p,hero_time(p),p.w/2,cy+fmt(p,40,60,36,0),fmt(p,120,170,100,0),C['black'],'middle',2*delta-mh*1.3,cut=False)
    venue_block(p,p.w/2,cy+mh/2+fmt(p,60,110,48,0),'middle',None,fmt(p,26,32,24,0),fmt(p,42,50,36,0))

# --- 10 · Karta meczu (papier): match facts in equal fields like a game sheet --------------------------------
def field(p,x,y,w,h,label,value):
    p.rect(x,y,w,h,'#FFFFFF',opacity=.72);p.rect(x,y,w,6,p.accent)
    text(p,label,x+24,y+46,22,'label',muted(p),maxw=w-48)
    vs=fmt(p,46,64,34,44)
    text(p,value,x+24,y+h-30,vs,'display',C['black'],maxw=w-48,minimum=24)

def v10(p):
    land=p.w>p.h;day,_=when(p);d=p.data
    y=top_lines(p,p.m,fmt(p,150,330,110,150),maxw=fmt(p,560,640,500,700)) if p.variant=='postponed' else (kicker(p,p.m,fmt(p,150,330,110,150)),fmt(p,150,330,110,150)+46)[1]
    if land:cx,cy,mh,delta=530,470,250,230
    else:mh=fmt(p,220,300,160,0);cy=y+fmt(p,40,110,10,0)+mh/2;cx=p.w/2;delta=fmt(p,260,270,250,0)
    pair(p,cx,cy,mh,delta);team_names(p,cx,cy+mh/2+fmt(p,62,70,44,62),delta,fmt(p,32,36,26,32),fmt(p,330,330,320,380))
    fields=[('DATA',day or 'DO USTALENIA'),('GODZINA',hero_time(p)),('HALA',(d.get('venue') or '').upper()),('WSTĘP',(d.get('entryInfo') or '').upper())]
    fields=[f for f in fields if f[1]]
    if land:x0,x1,gy,fh,gap=980,p.w-p.m,170,170,22
    else:x0,x1,gy,fh,gap=p.m,p.w-p.m,cy+mh/2+fmt(p,110,160,76,0),fmt(p,150,230,126,0),fmt(p,22,30,14,0)
    cols=2;fw=(x1-x0-gap)/cols
    for i,(label,value) in enumerate(fields):
        r,c=divmod(i,cols);field(p,x0+c*(fw+gap),gy+r*(fh+gap),fw,fh,label,value)
    rows=(len(fields)+cols-1)//cols;y=gy+rows*(fh+gap)

# Paper variants give the feed its black/paper rhythm (brandbook p.46).
v9.paper=v10.paper=True
LAYOUTS={4:v4,5:v5,6:v6,7:v7,8:v8,9:v9,10:v10}
