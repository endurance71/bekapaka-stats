"""Shared pieces of match variants: facts, the mark pair, fitted lettering and info lines.
Sizes follow the brandbook role scale; nothing is squeezed below its minimum (LayoutError instead)."""
from poster import C, width
import motyw as M, sym
from render import text, wrap, mark, date_parts, LayoutError
from render_v3 import rival, venue_caps, MUT_B, NAVY_D

LABELS={'standard':'ZAPOWIEDŹ MECZU','matchday':'DZIEŃ MECZU','postponed':'MECZ PRZEŁOŻONY','cancelled':'MECZ ODWOŁANY'}

def fmt(p,feed,story,square,landscape):
    """Value for the native format (no scaling of another format)."""
    return {'feed':feed,'story':story,'square':square,'landscape':landscape}[p.format_name]

def when(p):
    d=p.data;day,time=date_parts(d.get('date','')) if d.get('date') else ('','')
    return day,time

def hero_time(p):
    """What the time slot says: the kick-off, ODWOŁANY for a cancelled match, GODZINA TBC without a time."""
    _,time=when(p)
    return 'ODWOŁANY' if p.variant=='cancelled' else time or 'GODZINA TBC'

def muted(p):
    return C['black'] if p.paper else MUT_B if p.kit=='B' else C['muted']

def plate(p):
    return NAVY_D if p.kit=='B' else C['black']

def pair(p,cx,cy,mh,delta):
    """Our mark and the rival's at the same height and axis, symmetric around cx (brandbook rdzen-v6)."""
    mark(p,cx-delta,cy,mh);rival(p,cx+delta,cy,mh*1.08)

def team_names(p,cx,y,delta,size,maxw,color=None):
    text(p,'BEKAPAKA',cx-delta,y,size,'label',color,'middle',maxw,minimum=24)
    name=(p.data.get('opponent') or '').upper()
    if not name:return
    # A long club name breaks into two lines under its mark instead of shrinking below the label minimum.
    if width(name,size,'label')*22/size>maxw:wrap(p,name,cx+delta,y,maxw,min(size,26),'label',maxlines=2,color=color or muted(p),anchor='middle')
    else:text(p,name,cx+delta,y,size,'label',color or muted(p),'middle',maxw,minimum=22)

def fit(s,size,maxw,cut=True):
    """Largest lettering size up to `size` whose real outline fits `maxw`."""
    g,_=M.Z.lettering(s,size,cut=cut);gw=g.bounds[2]-g.bounds[0]
    return size if gw<=maxw else size*maxw/gw

def letters(p,s,x,y,size,color,anchor='start',maxw=None,minimum=40,cut=True,outline=False,t=None):
    """Cut lettering (score, number, name, headline) fitted to maxw; outline for the trailing value."""
    s=str(s or '').upper()
    if not s:return None
    size=fit(s,size,maxw,cut) if maxw else size
    if size<minimum:raise LayoutError(f'title: Napis „{s[:40]}” nie mieści się w układzie.')
    if outline:g=M.outline(p,s,x,y,size,color,t=t or max(4,size*.03),anchor=anchor)
    else:g=M.solid(p,s,x,y,size,color,anchor=anchor,fx=p.fx,cut=cut)
    p.boxes[-1]['size']=size
    return g.bounds

def icon_line(p,icon,label,x,y,size=28,anchor='start',maxw=None,color=None,minimum=22):
    """One icon + label, fitted to maxw; anchors on the whole line."""
    label=str(label or '')
    if not label:return None
    icon_w=size*1.1+12;avail=(maxw or 10**6)-icon_w
    need=width(label,size,'label',2)
    if need>avail:size=size*avail/need
    if size<minimum:raise LayoutError(f'venue: „{label[:40]}” nie mieści się w układzie. Skróć nazwę.')
    total=icon_w+width(label,size,'label',2)
    x0=x-total/2 if anchor=='middle' else x-total if anchor=='end' else x
    sym.icon_row(p,[(icon,label)],x0,y,size=size*1.1,text_size=size,color=color or (C['black'] if p.paper else C['white']),shadow=not p.paper)
    return x0,x0+total

def venue_block(p,x,y,anchor='middle',maxw=None,size=28,gap=44):
    """Hall line, then entry information when confirmed; returns the next free baseline."""
    d=p.data;maxw=maxw or p.w-2*p.m
    if d.get('venue'):icon_line(p,'hala',venue_caps(d['venue']),x,y,size,anchor,maxw);y+=gap
    if d.get('entryInfo'):text(p,d['entryInfo'].upper(),x,y,24,'label',p.accent if p.paper else C['white'],anchor,maxw,minimum=22);y+=gap
    return y

def postponed_lines(p,x,y,anchor='middle',maxw=None,size=26,color=None):
    """Postponed: the struck-through original date and the new date. Returns the next free baseline."""
    d=p.data;maxw=maxw or p.w-2*p.m;day,_=when(p)
    if p.variant!='postponed':return y
    if d.get('originalDate'):
        old,_=date_parts(d['originalDate']);box=text(p,old,x,y,size,'label',color or muted(p),anchor,maxw)
        if box:p.rect(box[0]-6,(box[1]+box[3])/2-2,box[2]-box[0]+12,4,color or p.accent)
        y+=size+22
    if day:text(p,'NOWY TERMIN: '+day,x,y,size,'label',color,anchor,maxw);y+=size+22
    return y

def kicker(p,x,y,anchor='start',maxw=None,color=None):
    """State label in brand label type (capitals, tracking) with the accent bar below it."""
    label=LABELS.get(p.variant,'')
    box=text(p,label,x,y,30,'label',color or (p.accent if p.paper else M.GOLD if p.kit=='A' else p.accent),anchor,maxw,minimum=24)
    return box
