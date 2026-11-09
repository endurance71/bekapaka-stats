"""Layout variants of the non-match families, built from the archetypes in kit.py.
Adapters turn each family's data into one of three models:
- list: label, sub, title, items[{lead, lead2, name, detail, tag}], facts (lineup, schedule rows, statistics);
- hero: label, sub, name, first, number, photo, stats, body, facts, gold (player, tournament, report, notices, club);
- logos: label, title, items, body (partners).
Each family's variant table (design-variants.js) maps a number to one archetype and its material (paper or dark)."""
from poster import C
import motyw as M
from render import text, date_parts, mark, LayoutError
from render_v3 import venue_caps
from .common import letters
from . import kit as K

LABELS={'five':'PIERWSZA PIĄTKA','roster':'SKŁAD MECZOWY','profile':'ZAWODNIK BKPK','new-player':'NOWY ZAWODNIK','mvp':'MVP MECZU',
        'tournament-preview':'ZAPOWIEDŹ TURNIEJU','tournament-program':'PROGRAM TURNIEJU','tournament-summary':'PODSUMOWANIE TURNIEJU',
        'report-cover':'RELACJA','photo-post':'FOTORELACJA','carousel':'RELACJA','partner-wall':'PARTNERZY KLUBU','partner-profile':'PARTNER KLUBU',
        'partner-thanks':'DZIĘKUJEMY PARTNEROM','schedule':'TERMINARZ','notice':'OGŁOSZENIE','news':'AKTUALNOŚĆ','team-stats':'STATYSTYKI DRUŻYNY',
        'player-stats':'STATYSTYKI ZAWODNIKA','leaders':'LIDERZY MECZU','standings':'TABELA LIGI','round-summary':'PODSUMOWANIE KOLEJKI',
        'season-summary':'PODSUMOWANIE SEZONU','birthday':'URODZINY','training-preview':'TRENING','training-report':'Z TRENINGU','backstage':'KULISY',
        'quote':'CYTAT','anniversary':'JUBILEUSZ','fan-invitation':'ZAPRASZAMY','club-statement':'KOMUNIKAT KLUBU'}

class Model(dict):
    __getattr__=dict.get

def day_line(d):
    if not d.get('date'):return ''
    day,time=date_parts(d['date']);return day+(' · '+time if time and time!='00:00' else '')

# --- adapters -----------------------------------------------------------------------------------------------
def lineup_model(p,part):
    d=p.data
    items=[Model(lead=x.get('number',''),name=x.get('lastName',''),detail=' · '.join(v for v in [x.get('firstName',''),x.get('position','')] if v)) for x in (part or [])]
    return Model(label=LABELS[p.post_type],sub=day_line(d),title='PIERWSZA PIĄTKA' if p.variant=='five' else 'SKŁAD MECZOWY',items=items,facts=[])

def schedule_model(p,part):
    d=p.data;items=[]
    for row in part or []:
        day,time=date_parts(row['date']);weekday,_,full=day.partition(' · ')
        r=row.get('round','');items.append(Model(lead=full[:5],name=row['opponent'],detail=weekday.capitalize()+(' · '+time if time else ''),tag=(f'{r}. KOLEJKA' if r.isdigit() else r.upper())))
    return Model(label='TERMINARZ',sub='',title=d.get('title') or 'TERMINARZ',items=items,facts=[('hala',venue_caps(d.get('venue',''))),('info',d.get('entryInfo',''))])

def stats_model(p,part):
    d=p.data;rows=part or [];compare=any(r.get('value2') for r in rows)
    items=[Model(lead=(r.get('value','')+(' '+r['unit'] if r.get('unit') else '')).strip(),lead2=r.get('value2',''),name=r.get('label',''),detail=r.get('detail',''),tag=('NR '+r['number']) if r.get('number') else '') for r in rows]
    cols=[c for c in (d.get('columns') or []) if c]
    sub=d.get('subtitle') or (' · '.join(cols) if compare and cols else day_line(d))
    return Model(label=(d.get('kicker') or LABELS[p.post_type]),sub=sub,title=d.get('title',''),items=items,facts=[])

def hero_model(p,part):
    d=p.data;t=p.post_type;slide=part if isinstance(part,dict) else {}
    photo_key=slide.get('assetId') or d.get('photoAssetId')
    base=Model(label=LABELS[t],sub=day_line(d),photo=photo_key if (p.visual_style=='photo' or p.family=='report') else None,crop=d.get('crop'),facts=[],stats=[],gold=False,number='')
    if p.family=='player':
        base.update(name=d.get('lastName',''),first=' · '.join(v for v in [d.get('firstName',''),d.get('position','')] if v).upper(),number=d.get('number',''),
                    stats=[(s['value'],s['label']) for s in d.get('statistics') or []],gold=t=='mvp',sub='')
    elif p.family=='tournament':
        base.update(label=LABELS[t]+(f" · EDYCJA {d['edition']}" if d.get('edition') else ''),name=d.get('title',''),number=str(d.get('edition') or ''),
                    stats=[] if p.variant=='program' else [(d.get('teams') if d.get('teams') is not None else '—','DRUŻYN'),(d.get('days') if d.get('days') is not None else '—','DNI')],
                    body=d.get('body',''),facts=[('hala',venue_caps(d.get('venue','')))])
    elif p.family=='report':
        idx=(p.page_index+1) if p.variant=='carousel' else None
        base.update(label=LABELS[t]+(f' · {idx}/4' if idx else ''),name=slide.get('title') or d.get('title',''),body=slide.get('body') or d.get('body',''),number='')
    elif p.family=='schedule':
        base.update(name=d.get('title',''),body=d.get('body',''),facts=[('data',day_line(d)),('hala',venue_caps(d.get('venue',''))),('info',d.get('entryInfo',''))],sub='')
    else:  # club
        name=(d.get('firstName','')+' '+d.get('lastName','')).strip() if p.variant=='birthday' else d.get('title','')
        base.update(name=name,first=(d.get('attribution') or '').upper(),body=d.get('body',''),number=d.get('number','') if p.variant=='birthday' else '',
                    facts=[('hala',venue_caps(d.get('venue','')))] if d.get('venue') else [])
    return base

def logos_model(p,part):
    d=p.data
    return Model(label=LABELS[p.post_type],title=d.get('title') or ('GRAJĄ Z NAMI' if p.variant!='thanks' else 'DZIĘKUJEMY'),items=part or [],body=d.get('body','') if p.variant=='thanks' else '',spot=p.variant=='spotlight')

# --- list archetypes --------------------------------------------------------------------------------------
def list_head(p,m,kind):
    y=K.head(p,kind,m.label,m.sub)+20
    return y

def L_rows_paper(p,m):
    y=list_head(p,m,'mini');y=K.title(p,m.title,p.m,y,110,C['black'],p.w-2*p.m,maxlines=1)+10;K.stripes(p,p.m,y,p.w-2*p.m)
    end=list_bottom(p,m);K.rows(p,m['items'],p.m,p.w-p.m,y+50,end,'blade');list_facts(p,m)
def L_rows_dark(p,m):
    y=list_head(p,m,'kicker');y=K.title(p,m.title,p.m,y,120,C['white'],p.w-2*p.m,maxlines=1)+10;K.stripes(p,p.m,y,p.w-2*p.m)
    K.rows(p,m['items'],p.m,p.w-p.m,y+60,list_bottom(p,m),'line');list_facts(p,m)
def L_cards(p,m,dark=False):
    y=list_head(p,m,'ribbon');y=K.title(p,m.title,p.w/2,y,100,K.ink(p),p.w-2*p.m,'middle',maxlines=1)+30
    K.cards(p,m['items'],p.m,p.w-p.m,y,list_bottom(p,m),cols=2 if p.w<=p.h else 3,dark=dark);list_facts(p,m)
def L_cards_dark(p,m):L_cards(p,m,True)
def L_bands(p,m):
    y=list_head(p,m,'mini');y=K.title(p,m.title,p.m,y,110,C['white'],p.w-2*p.m,maxlines=1)+40
    K.rows(p,m['items'],p.m,p.w-p.m,y,list_bottom(p,m),'band');list_facts(p,m)
def L_split(p,m):
    y0=K.top(p)-(40 if p.story else 84);hh=(330 if p.story else 300) if p.h>p.w else 280
    end=K.split(p,y0 if p.story else 0,K.top(p)+hh)
    y=K.head(p,'kicker',m.label,'')
    K.title(p,m.title,p.m,y+10,110,C['white'],p.w-2*p.m,maxlines=1)
    K.rows(p,m['items'],p.m,p.w-p.m,end+40,list_bottom(p,m),'line');list_facts(p,m)
def L_typo(p,m):
    y=list_head(p,m,'kicker');y=K.title(p,m.title,p.m,y,64,C['black'],p.w-2*p.m,maxlines=1,minimum=40)+16;K.stripes(p,p.m,y,p.w-2*p.m)
    K.typo(p,m['items'],p.m,p.w-p.m,y+50,list_bottom(p,m));list_facts(p,m)
def L_frame(p,m):
    g=K.gold(p);x0,y0=p.m,K.top(p)+40;x1,y1=p.w-p.m,list_bottom(p,m)+10
    M.step_frame(p,x0,y0,x1-x0,y1-y0,t=6,color=g,step=28)
    from render_v3 import ribbon
    ribbon(p,m.label.upper(),y0-22,34)
    y=K.title(p,m.title,p.w/2,y0+70,96,C['white'],x1-x0-80,'middle',maxlines=1)+30
    K.rows(p,m['items'],x0+40,x1-40,y,y1-40,'line');list_facts(p,m)
def L_V(p,m):
    apex=(560 if p.story else 330) if p.h>p.w else 300
    K.V(p,apex)
    y=K.top(p)+40;text(p,m.label.upper(),p.w/2,y,30,'label',K.gold(p),'middle',p.w*.5,minimum=24)
    if m.sub:text(p,m.sub,p.w/2,y+38,22,'body',K.muted(p),'middle',p.w*.5)
    y=K.title(p,m.title,p.w/2,apex+30,110,C['white'],p.w-2*p.m,'middle',maxlines=1)+20
    K.rows(p,m['items'],p.m,p.w-p.m,y,list_bottom(p,m),'line');list_facts(p,m)
def L_columns(p,m):
    y=list_head(p,m,'mini');y=K.title(p,m.title,p.m,y,110,K.ink(p),p.w-2*p.m,maxlines=1)+10;K.stripes(p,p.m,y,p.w-2*p.m)
    K.columns(p,m['items'],p.m,p.w-p.m,y+50,list_bottom(p,m));list_facts(p,m)

def list_bottom(p,m):
    n=len([f for f in m.facts or [] if f[1]])
    return K.bottom(p)-(n*44+16 if n else 0)
def list_facts(p,m):
    items=[f for f in m.facts or [] if f[1]]
    if items:K.facts(p,items,p.m,K.bottom(p)-(len(items)-1)*44-8,'start',p.w-2*p.m,24)

# --- hero archetypes --------------------------------------------------------------------------------------
def accent(p,h):
    return K.gold(p) if h.gold else p.accent

def hero_text(p,h,x,y,maxw,lim,anchor='start',size=130,color=None,stats_color=None,maxlines=2):
    """First line, name, hero numbers, body and facts down to `lim`; in a short format the name and numbers
    step down in size before the body is refused (body text itself never shrinks). Returns next y."""
    for k in (1,.8,.65):
        g=len(p.g);b=len(p.boxes)
        try:return _hero_text(p,h,x,y,maxw,lim,anchor,size*k,color,stats_color,maxlines,k)
        except LayoutError as e:
            if k==.65 or not str(e).startswith(('body:','title:')):raise
            for n in list(p.g)[g:]:p.g.remove(n)
            del p.boxes[b:]

def _hero_text(p,h,x,y,maxw,lim,anchor,size,color,stats_color,maxlines,k):
    if h.first:text(p,h.first,x,y+26,28,'label',K.muted(p) if not h.gold else K.gold(p),anchor,maxw,minimum=20);y+=48
    y=K.title(p,h.name,x,y,size,color or K.ink(p),maxw,anchor,maxlines=maxlines)+12
    if h.stats:y=K.stats_row(p,h.stats,x if anchor=='start' else x-maxw/2,y+10,maxw,min(110*k,size*.8),stats_color or accent(p,h),anchor if anchor=='start' else 'middle')
    facts=[f for f in h.facts or [] if f[1]];fh=len(facts)*44
    if h.body:y=K.body(p,h.body,x,y,maxw,lim-fh,26,anchor)+10
    if facts:y=K.facts(p,facts,x,max(y+20,lim-fh+30),anchor,maxw,24)
    if y>lim+60:raise LayoutError('body: Treść nie mieści się w układzie. Skróć opis.')
    return y

def deco_number(p,h,cx,base,size):
    s=h.number or ''
    if s:M.outline(p,s,cx,base,size,accent(p,h),t=6,anchor='middle',deco=True)
    else:M.seams(p,cx,base-size*.36,size*.42,t=3,color=accent(p,h),opacity=.3)

def H_photo_full(p,h):
    K.photo_or(p,h.photo,0,0,p.w,p.h,h.crop,lambda:deco_number(p,h,p.w*.62,p.h*.6,p.h*.42))
    p.rect(0,0,p.w,p.h,p.fade('hero-shade',0,0,0,p.h,[(0,C['black'],.7),(.3,C['black'],.05),(.5,C['black'],.2),(.72,C['black'],.92),(1,C['black'],1)]))
    K.head(p,'kicker',h.label,h.sub)
    lim=K.bottom(p)-10;y=lim-(260+(190 if h.stats else 0)+(150 if h.body else 0)+(50*len([f for f in h.facts or [] if f[1]])))-(120 if p.story else 0)
    if K.wide(p):hero_text(p,h,p.m,y,p.w*.55,lim,size=110,color=C['white'])
    else:hero_text(p,h,p.m,y,p.w-2*p.m,lim,size=130,color=C['white'])

def H_photo_frame(p,h):
    y=K.head(p,'mini',h.label,h.sub)+20
    if K.wide(p):
        K.stepped_photo(p,h.photo,p.w*.55,y,p.w*.45-p.m,K.bottom(p)-y-20,h.crop,accent(p,h),lambda:deco_number(p,h,p.w*.77,K.bottom(p)-80,420))
        hero_text(p,h,p.m,y+20,p.w*.5-40,K.bottom(p),size=110);return
    fh=(K.bottom(p)-y)*(.58 if p.story else .56)-(120 if h.body or h.stats else 0)
    K.stepped_photo(p,h.photo,p.m,y,p.w-2*p.m,fh,h.crop,accent(p,h),lambda:deco_number(p,h,p.w/2,y+fh*.86,fh*.9))
    hero_text(p,h,p.w/2,y+fh+30,p.w-2*p.m,K.bottom(p),'middle',size=120)

def H_number(p,h):
    y=K.head(p,'mini',h.label,h.sub)+20
    if h.photo and p.assets.get(h.photo):
        K.photo_or(p,h.photo,p.w*.38,y,p.w*.62-p.m,(K.bottom(p)-y)*.62,h.crop)
        p.rect(0,y,p.w,p.h-y,p.fade('number-shade',0,0,p.w,0,[(0,C['black'],1),(.45,C['black'],.75),(1,C['black'],0)]))
    else:deco_number(p,h,p.w*(.7 if K.wide(p) else .62),y+(K.bottom(p)-y)*.66,(K.bottom(p)-y)*.78)
    lim=K.bottom(p);maxw=p.w*.6 if K.wide(p) else p.w-2*p.m
    hero_text(p,h,p.m,y+(K.bottom(p)-y)*(.42 if p.h>p.w else .2),maxw,lim,size=150 if p.h>p.w else 120)

def H_split(p,h):
    hh=(K.bottom(p)-K.top(p))*(.4 if p.h>p.w else .5)
    goldbg=h.gold and p.kit=='A'
    end=K.split(p,0,K.top(p)+hh,M.GOLD if goldbg else None)
    y=K.top(p);text(p,h.label.upper(),p.m,y+40,30,'label',C['black'] if goldbg else C['white'],maxw=p.w-2*p.m,minimum=24);y+=70
    maxw=p.w*.55 if K.wide(p) else p.w-2*p.m
    K.title(p,h.name,p.m,y+10,130,C['black'] if goldbg else C['white'],maxw,maxlines=2,minimum=48)
    vis=(end+20,K.bottom(p)-20)
    if h.photo and p.assets.get(h.photo):
        K.photo_or(p,h.photo,p.w*.5 if not K.wide(p) else p.w*.6,vis[0],p.w*.5-p.m if not K.wide(p) else p.w*.4-p.m,vis[1]-vis[0],h.crop)
    else:deco_number(p,h,p.w*.76,vis[1]-30,min(420,(vis[1]-vis[0])*.9))
    rest=Model(h);rest['name']='';hero_text(p,rest,p.m,end+30,p.w*.45 if not K.wide(p) else p.w*.5,K.bottom(p),size=100)

def H_paper(p,h):
    y=K.head(p,'mini',h.label,h.sub)+10
    if h.photo and p.assets.get(h.photo):
        ph=(K.bottom(p)-y)*(.36 if p.h>p.w else .5)
        if K.wide(p):K.photo_or(p,h.photo,p.w*.55,y,p.w*.45-p.m,K.bottom(p)-y,h.crop)
        else:K.photo_or(p,h.photo,p.m,y,p.w-2*p.m,ph,h.crop);y+=ph+20
    maxw=p.w*.5 if K.wide(p) else p.w-2*p.m
    y=K.title(p,h.name,p.m,y+10,110,C['black'],maxw,maxlines=2)+6;K.stripes(p,p.m,y,maxw);y+=40
    rest=Model(h);rest['name']='';rest['first']=h.first
    hero_text(p,rest,p.m,y,maxw,K.bottom(p),size=90)

def H_V(p,h):
    apex=(640 if p.story else 420) if p.h>p.w else 360;K.V(p,apex)
    y=K.top(p)+40;text(p,h.label.upper(),p.w/2,y,30,'label',K.gold(p),'middle',p.w*.5,minimum=24)
    if h.sub:text(p,h.sub,p.w/2,y+38,22,'body',K.muted(p),'middle',p.w*.5)
    if h.photo and p.assets.get(h.photo):
        ph=(K.bottom(p)-apex)*.4;K.photo_or(p,h.photo,p.m,apex+20,p.w-2*p.m,ph,h.crop);y=apex+ph+40
    else:
        if not (h.stats or h.body):deco_number(p,h,p.w/2,K.bottom(p)-40,(K.bottom(p)-apex)*.6)
        y=apex+30
    hero_text(p,h,p.w/2,y,p.w-2*p.m,K.bottom(p),'middle',size=130)

def H_band(p,h):
    y=K.head(p,'kicker',h.label,h.sub)
    if h.photo and p.assets.get(h.photo):
        K.photo_or(p,h.photo,0,y+10,p.w,(K.bottom(p)-y)*.45,h.crop);by=y+10+(K.bottom(p)-y)*.45-40
    elif p.h<=1080:by=y+30  # square and landscape: the band opens the composition, the numbers follow
    else:
        deco_number(p,h,p.w/2,y+(K.bottom(p)-y)*.4-30,(K.bottom(p)-y)*.36);by=y+(K.bottom(p)-y)*.42
    bh=(250 if p.story else 210) if p.h>p.w else 170 if p.h<=1080 else 190
    M.blade_panel(p,-40,by,p.w+80,bh,accent(p,h) if not h.gold else K.gold(p))
    from .common import fit
    s=h.name.upper() if h.name else '—';size=fit(s,170,p.w-2*p.m-60)
    if size<44:raise LayoutError(f'title: Tytuł „{s[:40]}” nie mieści się w pasie. Skróć go.')
    letters(p,s,p.w/2,by+bh/2+size*.356,size,C['black'] if h.gold and p.kit=='A' else C['white'],'middle',p.w-2*p.m-60,minimum=44)
    rest=Model(h);rest['name']=''
    hero_text(p,rest,p.w/2,by+bh+20,p.w-2*p.m,K.bottom(p),'middle',size=100)

def H_card(p,h):
    g=K.gold(p) if h.gold or not p.paper else p.accent
    x0,y0,x1,y1=p.m,K.top(p)+40,p.w-p.m,K.bottom(p)+6
    M.step_frame(p,x0,y0,x1-x0,y1-y0,t=6,color=g,step=30)
    from render_v3 import ribbon
    ribbon(p,h.label.upper(),y0-22,34)
    inner=x1-x0-80
    est=(300 if h.number and not h.photo else 0)+260+(190 if h.stats else 0)+(150 if h.body else 0)
    y=y0+70+max(0,(y1-y0-100-est)/3) if not h.photo else y0+70
    if h.photo and p.assets.get(h.photo):
        ph=(y1-y0)*(.4 if p.h>p.w else .45);K.photo_or(p,h.photo,x0+40,y,inner,ph,h.crop);y+=ph+20
    elif h.number:
        letters(p,h.number,p.w/2,y+260,300,accent(p,h),'middle',inner,minimum=80,cut=False,outline=True);y+=300
    hero_text(p,h,p.w/2,y,inner,y1-30,'middle',size=110)

def H_poster(p,h):
    y=K.head(p,'mini',h.label,h.sub)+30
    words=(h.name or '—').upper().split();first=words[0];rest=' '.join(words[1:])
    maxw=p.w*.62 if K.wide(p) else p.w-2*p.m
    from .common import fit
    s1=fit(first,260 if p.h>p.w else 200 if p.h>1080 else 150,maxw)
    if s1<60:raise LayoutError(f'title: Słowo „{first[:30]}” nie mieści się na plakacie.')
    letters(p,first,p.m,y+s1*.74,s1,K.ink(p),maxw=maxw,minimum=60);y+=s1*.74+30
    if rest:y=K.title(p,rest,p.m,y,s1*.7,accent(p,h),maxw,maxlines=2,minimum=44)+20
    M.chevrons(p,p.w-p.m-70,K.top(p)+40,120,colors=(p.accent,p.accent))
    if h.photo and p.assets.get(h.photo) and not K.wide(p):
        ph=min(360,(K.bottom(p)-y)*.4);K.photo_or(p,h.photo,p.m,y,p.w-2*p.m,ph,h.crop);y+=ph+20
    rest_m=Model(h);rest_m['name']='';hero_text(p,rest_m,p.m,y,maxw,K.bottom(p),size=90)

def H_side(p,h):
    y=K.head(p,'mini',h.label,h.sub)+20;lim=K.bottom(p)
    pw=(p.w-2*p.m)*(.46 if not K.wide(p) else .4)
    K.stepped_photo(p,h.photo,p.m,y,pw,lim-y,h.crop,accent(p,h),lambda:deco_number(p,h,p.m+pw/2,lim-60,min(pw*1.1,lim-y)))
    x=p.m+pw+36;hero_text(p,h,x,y+20,p.w-p.m-x,lim,size=110,maxlines=3)

# --- partner archetypes -----------------------------------------------------------------------------------
def P_grid(p,m,head='mini',cols=2,title_color=None,dark_band=False):
    y=K.head(p,head,m.label,'')+20
    y=K.title(p,m.title,p.m if head!='ribbon' else p.w/2,y,100,title_color or K.ink(p),p.w-2*p.m,'start' if head!='ribbon' else 'middle',maxlines=1)+30
    end=K.bottom(p)-(130 if m.body else 0)
    cols=1 if m.spot else cols
    y=K.logo_grid(p,m['items'],p.m,p.w-p.m,y,end,cols,max_h=420 if m.spot else 220)
    if m.body:K.body(p,m.body,p.m,y,p.w-2*p.m,K.bottom(p),26)
def P_split(p,m):
    hh=280 if p.h>p.w else 260;end=K.split(p,0,K.top(p)+hh)
    y=K.head(p,'kicker',m.label,'');K.title(p,m.title,p.m,y+10,110,C['white'],p.w-2*p.m,maxlines=1)
    lim=K.bottom(p)-(130 if m.body else 0)
    y=K.logo_grid(p,m['items'],p.m,p.w-p.m,end+40,lim,1 if m.spot else 2,max_h=420 if m.spot else 220)
    if m.body:K.body(p,m.body,p.m,y,p.w-2*p.m,K.bottom(p),26)
def P_V(p,m):
    apex=(560 if p.story else 330);K.V(p,apex)
    text(p,m.label.upper(),p.w/2,K.top(p)+40,30,'label',K.gold(p),'middle',p.w*.5,minimum=24)
    y=K.title(p,m.title,p.w/2,apex+20,100,C['white'],p.w-2*p.m,'middle',maxlines=1)+30
    lim=K.bottom(p)-(130 if m.body else 0)
    y=K.logo_grid(p,m['items'],p.m,p.w-p.m,y,lim,1 if m.spot else 3,max_h=420 if m.spot else 200)
    if m.body:K.body(p,m.body,p.m,y,p.w-2*p.m,K.bottom(p),26)
def P_frame(p,m):
    g=K.gold(p);x0,y0,x1,y1=p.m,K.top(p)+40,p.w-p.m,K.bottom(p)+6
    M.step_frame(p,x0,y0,x1-x0,y1-y0,t=6,color=g,step=30)
    from render_v3 import ribbon
    ribbon(p,m.label.upper(),y0-22,34)
    y=K.title(p,m.title,p.w/2,y0+70,96,K.ink(p),x1-x0-80,'middle',maxlines=1)+30
    lim=y1-30-(130 if m.body else 0)
    y=K.logo_grid(p,m['items'],x0+40,x1-40,y,lim,1 if m.spot else 2,max_h=420 if m.spot else 200)
    if m.body:K.body(p,m.body,x0+40,y,x1-x0-80,y1-30,26)
def P_list(p,m):
    y=K.head(p,'kicker',m.label,'')+10
    y=K.title(p,m.title,p.m,y,120,K.ink(p),p.w-2*p.m,maxlines=2)+30
    lim=K.bottom(p)-(130 if m.body else 0)
    y=K.logo_grid(p,m['items'],p.m,p.w-p.m,y,lim,1,max_h=420 if m.spot else 150)
    if m.body:K.body(p,m.body,p.m,y,p.w-2*p.m,K.bottom(p),26)

# --- tables -----------------------------------------------------------------------------------------------
def as_layout(fn,surface,model):
    def layout(p,part=None):
        fn(p,model(p,part))
    layout.surface=surface;layout.wants_part=True
    return layout

LIST={'rows-paper':(L_rows_paper,'paper'),'rows-dark':(L_rows_dark,'dark'),'cards':(L_cards,'paper'),'bands':(L_bands,'dark'),
      'split':(L_split,'dark'),'typo':(L_typo,'paper'),'frame':(L_frame,'dark'),'V':(L_V,'dark'),'columns':(L_columns,'paper'),'cards-dark':(L_cards_dark,'dark')}
HERO={'photo-full':(H_photo_full,'dark'),'photo-frame':(H_photo_frame,'dark'),'number':(H_number,'dark'),'split':(H_split,'dark'),
      'paper':(H_paper,'paper'),'V':(H_V,'dark'),'band':(H_band,'dark'),'card':(H_card,'paper'),'card-dark':(H_card,'dark'),
      'poster':(H_poster,'dark'),'side':(H_side,'dark'),'side-paper':(H_side,'paper')}
LOGOS={'dark-grid':(lambda p,m:P_grid(p,m,'mini',2),'dark'),'paper-3':(lambda p,m:P_grid(p,m,'mini',3),'paper'),'split':(P_split,'dark'),
       'V':(P_V,'dark'),'frame':(P_frame,'paper'),'frame-dark':(P_frame,'dark'),'list':(P_list,'paper'),'list-dark':(P_list,'dark'),
       'ribbon-3':(lambda p,m:P_grid(p,m,'ribbon',3),'paper')}

# Archetype per variant number (legacy numbers are drawn by render_v3). Mirrors design-variants.js.
LIST_SET={2:'rows-paper',3:'rows-dark',4:'cards',5:'bands',6:'split',7:'typo',8:'frame',9:'V',10:'columns'}
STATS_SET={2:'rows-dark',3:'cards',4:'bands',5:'split',6:'typo',7:'frame',8:'V',9:'columns',10:'cards-dark'}
NOTICE_SET={2:'paper',3:'number',4:'photo-frame',5:'band',6:'split',7:'poster',8:'card',9:'V',10:'side-paper'}
PERSON_SET={3:'photo-full',4:'photo-frame',5:'side',6:'number',7:'split',8:'V',9:'band',10:'card'}
TOURNAMENT_SET={3:'photo-full',4:'photo-frame',5:'side',6:'number',7:'split',8:'V',9:'band',10:'poster'}
REPORT_SET={2:'photo-full',3:'side',4:'split',5:'band',6:'paper',7:'V',8:'poster',9:'card',10:'number'}
CLUB_SET={3:'photo-full',4:'photo-frame',5:'side',6:'paper',7:'split',8:'V',9:'poster',10:'card'}
PARTNER_SET={2:'dark-grid',3:'paper-3',4:'split',5:'V',6:'frame',7:'list-dark',8:'list',9:'frame-dark',10:'ribbon-3'}

def layouts(family,post_type):
    if family=='lineup':return {n:as_layout(*LIST[k],lineup_model) for n,k in LIST_SET.items()}
    if family=='statistics':return {n:as_layout(*LIST[k],stats_model) for n,k in STATS_SET.items()}
    if family=='schedule':
        if post_type=='schedule':return {n:as_layout(*LIST[k],schedule_model) for n,k in LIST_SET.items()}
        return {n:as_layout(*HERO[k],hero_model) for n,k in NOTICE_SET.items()}
    if family=='player':return {n:as_layout(*HERO[k],hero_model) for n,k in PERSON_SET.items()}
    if family=='tournament':return {n:as_layout(*HERO[k],hero_model) for n,k in TOURNAMENT_SET.items()}
    if family=='report':return {n:as_layout(*HERO[k],hero_model) for n,k in REPORT_SET.items()}
    if family=='club':return {n:as_layout(*HERO[k],hero_model) for n,k in CLUB_SET.items()}
    if family=='partners':return {n:as_layout(*LOGOS[k],logos_model) for n,k in PARTNER_SET.items()}
    return {}
