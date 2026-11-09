"""Shared archetypes of layout variants for the non-match families.
A family adapter turns its data into one model; an archetype draws it. The same archetype looks the same in every
family (header, title, rows, hero, stripes), so variants stay consistent while each family gets ten different
compositions. Geometry is computed from the native format's free area; nothing is scaled from another format and
text below its minimum stops the export (LayoutError), as in render_v3."""
import math
from PIL import Image, ImageChops
from poster import C, el, width
import motyw as M, sym
from render import text, wrap, mark, photo, date_parts, LayoutError
from render_v3 import ribbon, grid, venue_caps, title_lines, lettering_width, MUT_B, NAVY_D
from .common import letters, fit

GREY_INK='#4B4741'; CREAM='#EFEBE3'

# --- frame of the free area ---------------------------------------------------------------------------------
def top(p):
    return 300 if p.story else 84
def bottom(p):
    """Last baseline above the footer stripes."""
    return grid(p)[7]-36
def ink(p):
    return C['black'] if p.paper else C['white']
def muted(p):
    return GREY_INK if p.paper else MUT_B if p.kit=='B' else C['muted']
def gold(p):
    """Gold accent on dark material (kit A); paper and kit B use the kit accent (no gold text on paper)."""
    return M.GOLD if p.kit=='A' and not p.paper else p.accent
def plate(p):
    return NAVY_D if p.kit=='B' else C['black']
def wide(p):
    return p.w>p.h

# --- headers --------------------------------------------------------------------------------------------------
def head(p,kind,label,sub=''):
    """'mini': mini mark, label and subline (brandbook p.30); 'ribbon': centred ribbon; 'kicker': label only.
    Returns the first free y below the header."""
    y=top(p)
    if kind=='mini':
        cy=y+(48 if p.story else 66)
        mark(p,p.m+76,cy,116,'herb2mini')
        text(p,label.upper(),p.m+168,cy-10,30,'label',ink(p),maxw=p.w-2*p.m-180,minimum=24)
        if sub:text(p,sub,p.m+168,cy+28,22,'body',muted(p),maxw=p.w-2*p.m-180)
        return cy+90
    if kind=='ribbon':
        ribbon(p,label.upper(),y-(10 if p.story else 0),34)
        if sub:text(p,sub,p.w/2,y+86,24,'label',muted(p),'middle',p.w-2*p.m)
        return y+(120 if sub else 80)
    text(p,label.upper(),p.m,y+40,30,'label',p.accent if p.paper else gold(p),maxw=p.w-2*p.m,minimum=24)
    if sub:text(p,sub,p.m,y+82,22,'body',muted(p),maxw=p.w-2*p.m)
    return y+(110 if sub else 70)

def title(p,s,x,y,size,color,maxw,anchor='start',maxlines=2,minimum=48):
    """Cut headline on up to `maxlines` lines, as large as fits (top at y). Returns the next free y."""
    s=str(s or '').strip()
    if not s:return y
    for sz in [size*k for k in (1,.9,.8,.7,.6,.5)]:
        lines=title_lines(s,sz,maxw)
        if len(lines)<=maxlines and all(lettering_width(l,sz)<=maxw for l in lines):break
    else:raise LayoutError(f'title: Tytuł „{s[:40]}” nie mieści się w układzie. Skróć go.')
    if sz<minimum:raise LayoutError(f'title: Tytuł „{s[:40]}” nie mieści się w układzie. Skróć go.')
    # The first baseline leaves room for Polish accents above capitals (Ż, Ó, Ś).
    for i,l in enumerate(lines):
        y+=sz*(.9 if i==0 else .74);M.solid(p,l,x,y,sz,color,anchor=anchor,fx=p.fx);p.boxes[-1]['size']=sz;y+=sz*.32
    return y

def body(p,s,x,y,maxw,limit,size=28,anchor='start',color=None):
    """Body paragraph within the space down to `limit`; too long stops the export. Returns next y."""
    if not s:return y
    lines=max(0,int((limit-y)/(size*1.5)))
    if lines<1:raise LayoutError('body: Brak miejsca na treść. Skróć opis.')
    return wrap(p,s,x,y+size*.8,maxw,size,'body',maxlines=min(lines,8),color=color or ink(p),anchor=anchor)

def facts(p,items,x,y,anchor='start',maxw=None,size=26):
    """Icon lines (hall, date, info), each fitted; returns next y."""
    maxw=maxw or p.w-2*p.m
    from .common import icon_line
    for icon,value in items:
        if value:icon_line(p,icon,value,x,y,size,anchor,maxw,ink(p),minimum=20);y+=size*1.7
    return y

def stripes(p,x,y,w):
    M.stripes(p,x,y,w,color=p.accent)

# --- V and the 24° split (core DNA) ------------------------------------------------------------------------
def V(p,apex,half=None,arm=None):
    half=half or p.w*.44;arm=arm or half*.26;cx=p.w/2;k=apex/half
    p.poly([(cx-half,0),(cx-half+arm,0),(cx,apex-arm*k),(cx+half-arm,0),(cx+half,0),(cx,apex)],p.accent)
    d=arm*.28;dark='#AE1027' if p.kit=='A' else '#C85F0F'
    p.poly([(cx-half+arm,0),(cx-half+arm+d,0),(cx,apex-(arm+d)*k),(cx+half-arm-d,0),(cx+half-arm,0),(cx,apex-arm*k)],dark)

def split(p,y0,y1,color=None):
    """Colour block from y0 to a 24°-cut lower edge (left y1, right y1-Δ). Returns the cut's lowest y."""
    dy=p.w*.4452*.35
    p.poly([(0,y0),(p.w,y0),(p.w,y1-dy),(0,y1)],color or p.accent,opacity=.95)
    p.poly([(0,y1),(p.w,y1-dy),(p.w,y1-dy+12),(0,y1+12)],M.GOLD_D if color==M.GOLD else '#AE1027' if p.kit=='A' else '#C85F0F')
    return y1+12

# --- rows (lineup, schedule, statistics) -------------------------------------------------------------------
def rows(p,items,x0,x1,y0,y1,kind='blade',minimum_h=86,max_h=None):
    """Rows of {lead, lead2, name, detail, tag} between y0 and y1.
    kind: 'blade' white/cream 24° panels (paper), 'line' separators (dark), 'band' alternating colour bands,
    'plain' bare rows."""
    n=max(1,len(items));gap=14 if kind in ('blade','band') else 0
    rh=min(max_h or (220 if p.story else 180),(y1-y0-gap*(n-1))/n)
    if rh<minimum_h:raise LayoutError('rows: Za dużo wierszy na tej stronie układu.')
    y0+=(y1-y0-n*rh-gap*(n-1))/2*0  # rows start at the top; the free space stays under them
    ls=min(rh*.6,112);lead_w=max([lettering_width(str(i.get('lead') or '—'),ls) for i in items]+[0])
    ns=min(rh*.32,56);ds=max(20,min(rh*.17,28))
    for i,it in enumerate(items):
        y=y0+i*(rh+gap);mid=y+rh/2;fg=ink(p);sub=muted(p);lc=p.accent
        if kind=='blade':M.blade_panel(p,x0,y,x1-x0,rh,'#FFFFFF' if i%2==0 else CREAM,left=False);fg=C['black'];sub=GREY_INK
        elif kind=='band':
            ours=i%2==0;p.rect(0,y,p.w,rh,p.accent if ours else plate(p),opacity=.92 if ours else .7)
            fg=C['white'];sub=C['white'] if ours else MUT_B if p.kit=='B' else C['muted'];lc=C['white'] if ours else p.accent
        elif kind=='line' and i:p.rect(x0,y-1,x1-x0,2,p.accent,opacity=.6)
        lx=x0+(28 if kind=='blade' else 0);right=x1-(rh*.45 if kind=='blade' else 0)
        lead=str(it.get('lead') or '')
        if lead:letters(p,lead,lx,mid+ls*.36,ls,lc,maxw=lead_w+4,minimum=30,cut=False)
        nx=lx+(lead_w+36 if lead_w else 0)
        tag=it.get('tag') or '';tw=min(220,width(tag,24,'label',2)+10) if tag else 0
        lead2=str(it.get('lead2') or '');l2w=lettering_width(lead2,ls*.6)+30 if lead2 else 0
        if lead2:letters(p,lead2,right-tw,mid+ls*.22,ls*.6,'#77726B' if p.paper or kind=='blade' else sub,'end',l2w,minimum=24,cut=False)
        nm=right-nx-tw-l2w-20
        has=bool(it.get('detail'))
        text(p,str(it.get('name','')).upper(),nx,mid+(ns*.36 if not has else -ds*.2),ns,'display',fg,maxw=nm,minimum=24)
        if has:text(p,it['detail'],nx,mid+ns*.36+ds*.9,ds,'body',sub,maxw=nm)
        if tag:text(p,tag,right,mid+9,22,'label',fg,'end',tw)
    return y0+n*(rh+gap)

def cards(p,items,x0,x1,y0,y1,cols=2,dark=False):
    """Grid of cards: accent top bar, lead (number/value) large, name and detail."""
    n=max(1,len(items));r=math.ceil(n/cols);gap=20
    cw=(x1-x0-gap*(cols-1))/cols;ch=min(320 if p.story else 260,(y1-y0-gap*(r-1))/r)
    if ch<120:raise LayoutError('rows: Za dużo pozycji na tej stronie układu.')
    for i,it in enumerate(items):
        rr,c=divmod(i,cols);x=x0+c*(cw+gap);y=y0+rr*(ch+gap)
        p.rect(x,y,cw,ch,plate(p) if dark else '#FFFFFF',opacity=.75 if dark else .82);p.rect(x,y,cw,6,p.accent)
        fg=C['white'] if dark else C['black'];sub=(MUT_B if p.kit=='B' else C['muted']) if dark else GREY_INK
        ls=min(ch*.4,120)
        if it.get('lead'):letters(p,str(it['lead']),x+24,y+30+ls*.74,ls,p.accent,maxw=cw-48,minimum=30,cut=False)
        ny=y+ch-(58 if it.get('detail') else 30)
        text(p,str(it.get('name','')).upper(),x+24,ny,min(46,ch*.17),'display',fg,maxw=cw-48,minimum=22)
        if it.get('detail'):text(p,it['detail'],x+24,ny+34,22,'body',sub,maxw=cw-48)
        if it.get('lead2'):letters(p,str(it['lead2']),x+cw-24,y+30+ls*.5,ls*.6,'#77726B','end',cw*.4,minimum=24,cut=False)
    return y0+r*(ch+gap)

def columns(p,items,x0,x1,y0,y1):
    """Items side by side: big lead on top, name and detail under it (up to five per row)."""
    n=max(1,len(items));per=min(n,5);r=math.ceil(n/per);gap=16
    cw=(x1-x0-gap*(per-1))/per;ch=min(620,(y1-y0-gap*(r-1))/r)
    if cw<150 or ch<200:raise LayoutError('rows: Za dużo pozycji na tej stronie układu.')
    for i,it in enumerate(items):
        rr,c=divmod(i,per);x=x0+c*(cw+gap);y=y0+rr*(ch+gap);cx=x+cw/2
        ls=min(cw*.95,ch*.5,260)
        p.rect(x,y+ch*.52+(130 if it.get('detail') else 90),cw,8,p.accent)
        letters(p,str(it.get('lead') or '—'),cx,y+ch*.52,ls,p.accent if i==0 else ink(p),'middle',cw-16,minimum=30,cut=False,outline=i!=0)
        text(p,str(it.get('name','')).upper(),cx,y+ch*.52+64,min(40,cw*.16),'display',ink(p),'middle',cw-12,minimum=20)
        if it.get('detail'):wrap(p,it['detail'],cx,y+ch*.52+108,cw-12,20,'body',maxlines=2,color=muted(p),anchor='middle')
    return y0+r*(ch+gap)

def typo(p,items,x0,x1,y0,y1):
    """Names as a stack of cut lettering, the lead in accent before each; long lists shrink evenly."""
    n=max(1,len(items));lh=min((y1-y0)/n,200 if p.story else 170);size=lh*.78
    lw=max([lettering_width(str(i.get('lead') or ''),size*.6) for i in items]+[0])
    for i,it in enumerate(items):
        base=y0+i*lh+size*.78
        if it.get('lead'):letters(p,str(it['lead']),x0,base,size*.6,p.accent,maxw=lw+4,minimum=24,cut=False)
        nx=x0+(lw+30 if lw else 0)
        letters(p,str(it.get('name','')),nx,base,size,ink(p) if i%2==0 else p.accent,maxw=x1-nx,minimum=30)
    return y0+n*lh

# --- single subject ----------------------------------------------------------------------------------------
def photo_or(p,key,x,y,w,h,crop=None,fallback=None):
    """Real photo when the project has one; else the fallback drawing (never an empty box in a preview)."""
    if key and p.assets.get(key):photo(p,key,x,y,w,h,crop);return True
    if fallback:fallback()
    return False

def stats_row(p,stats,x,y,maxw,size=110,color=None,anchor='start'):
    """Hero numbers (value + label); returns next y."""
    stats=[s for s in stats if s and str(s[0])!='']
    if not stats:return y
    cell=maxw/len(stats)
    for i,(v,l) in enumerate(stats):
        cx=x+i*cell+(cell/2 if anchor=='middle' else 0)
        letters(p,str(v),cx,y+size*.74,size,color or p.accent,anchor,cell-20,minimum=36,cut=False)
        text(p,str(l).upper(),cx,y+size*.74+40,22,'label',ink(p),anchor,cell-20,minimum=20)
    return y+size*.74+70

def stepped_photo(p,key,x,y,w,h,crop,color,fallback=None,step=30):
    fr=M.stepped(x,y,w,h,step);cid=f'frame-{len(p.assets_used)}-{int(y)}'
    p.clip(cid,('path',{'d':M.G.d(M.G.inset(fr,14))}))
    prev=p.g;p.g=el('g',clip_path=f'url(#{cid})');prev.append(p.g)
    ok=photo_or(p,key,x,y,w,h,crop)
    p.g=prev
    if not ok and fallback:fallback()
    M.shape(p,fr.difference(M.G.inset(fr,6)),color)
    return ok

# --- partner logos (equal exposure, white plates) ----------------------------------------------------------
def logo_tile(p,item,i,x,y,w,h):
    p.rect(x,y,w,h,'#FFFFFF')
    a=p.assets.get(item.get('assetId'));path=a['path'] if a else item.get('logoPath')
    if path:
        im=Image.open(path).convert('RGBA');diff=ImageChops.difference(im.convert('RGB'),Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>18 else 0)
        box=ImageChops.multiply(im.getchannel('A'),diff).getbbox() or im.getchannel('A').getbbox()
        if box:im=im.crop(box)
        out=p.out/f'optical-v-{i}.png';im.save(out);iw,ih=im.size
        # Same optical area √(w·h) for every logo; clear space 1/4 of the shorter side stays inside the plate.
        s=min(math.sqrt((w-80)*(h-70)*.48/(iw*ih)),(w-80)/iw,(h-70)/ih);p.image(out,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s)
    else:wrap(p,item['name'],x+w/2,y+h/2-6,w-50,28,'label',maxlines=2,color=C['black'],anchor='middle')

def logo_grid(p,items,x0,x1,y0,y1,cols=2,max_h=200):
    n=max(1,len(items));r=math.ceil(n/cols);gap=24;cw=(x1-x0-gap*(cols-1))/cols
    ch=min(max_h,(y1-y0-gap*(r-1))/r)
    if ch<110:raise LayoutError('partners: Za dużo partnerów na tej stronie układu.')
    for i,item in enumerate(items):
        rr,c=divmod(i,cols);logo_tile(p,item,i,x0+c*(cw+gap),y0+rr*(ch+gap),cw,ch)
    return y0+r*(ch+gap)
