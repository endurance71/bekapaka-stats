#!/usr/bin/env python3
"""JSON-in, outlined SVG-out. Uses the versioned club toolkit, never demo data."""
import json, math, sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
BRAND = Path(__file__).resolve().parents[1] / 'brand'
sys.path.insert(0, str(BRAND/'02_system/toolkit'))
from poster import Poster, C, width, el
import motyw as M, material as MAT, kit
FORMAT = {'feed': (1080,1350), 'story': (1080,1920), 'square': (1080,1080), 'landscape': (1920,1080)}
DAY = ['PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA','NIEDZIELA']

class LayoutError(Exception):
    pass

def date_parts(value):
    if not value: return ('TERMIN DO UZUPEŁNIENIA','')
    try:
        d = datetime.fromisoformat(value.replace('Z','+00:00'))
        if d.tzinfo: d = d.astimezone(ZoneInfo('Europe/Warsaw'))
        return (f'{DAY[d.weekday()]} · {d:%d.%m.%Y}', f'{d:%H:%M}')
    except ValueError: raise LayoutError('date: Nieprawidłowa data')

def text(p, s, x, y, size=28, role='label', color=None, anchor='start', maxw=None, minimum=20):
    s = str(s or '')
    if not s: return None
    try:
        if maxw:
            needed = width(s, size, role)
            if needed > maxw: size = size * maxw / needed
        if size < minimum: raise LayoutError(f'text: Tekst „{s[:45]}” nie mieści się w polu. Skróć go lub podziel na wiersze.')
        return p.text(s,x,y,size,role,fill=color or p.ink,anchor=anchor,max_width=maxw)
    except KeyError as e: raise LayoutError(f'text: Font marki nie obsługuje znaku {e}. Usuń emoji lub nietypowy znak.')

def display(p,s,x,y,size=130,color=None,anchor='start',maxw=None,cut=True):
    s = str(s or '').upper()
    if not s: return
    try:
        g,_ = M.Z.lettering(s,size,cut=cut)
        gw = g.bounds[2]-g.bounds[0]
        if maxw and gw > maxw: size *= maxw/gw
        if size < 40: raise LayoutError(f'title: Nagłówek „{s[:40]}” jest za długi.')
        M.solid(p,s,x,y,size,color or p.ink,anchor=anchor,fx=p.fx,cut=cut)
        p.boxes[-1]['size']=size
    except KeyError: raise LayoutError('title: Usuń znaki nieobsługiwane przez Barlow, np. emoji.')

def wrap(p,s,x,y,maxw,size=32,role='body',maxlines=5,color=None,anchor='start'):
    words=str(s or '').split(); lines=[]; line=''
    try:
        for word in words:
            candidate=(line+' '+word).strip()
            if width(candidate,size,role)>maxw:
                if not line: raise LayoutError('body: Pojedynczy wyraz jest za długi.')
                lines.append(line); line=word
            else: line=candidate
        if line: lines.append(line)
    except KeyError: raise LayoutError('body: Usuń emoji lub znak nieobsługiwany przez font marki.')
    if len(lines)>maxlines: raise LayoutError(f'body: Opis wymaga {len(lines)} wierszy; ten układ mieści {maxlines}. Skróć opis.')
    for i,line in enumerate(lines): text(p,line,x,y+i*size*1.5,size,role,color,anchor,maxw,minimum=20)
    return y+len(lines)*size*1.5

def mark(p,cx,cy,h,kind='herb2'):
    b=M.mark_c(p,kind,cx,cy,h,pal='B' if p.kit=='B' else ('czarny' if p.paper else 'kolor'))
    minimum={'herb2':150,'herb2mini':90,'sygnet2':24,'mvp':120,'turniej':120}.get(kind,24)
    if b[2]-b[0]<minimum: raise LayoutError('logo: Znak marki poniżej minimalnego rozmiaru')
    space=(b[2]-b[0])/8
    p.protected.append([b[0]-space,b[1]-space,b[2]+space,b[3]+space])

def photo(p,key,x,y,w,h,crop=None):
    a=p.assets.get(key)
    if not a: return False
    p.clip('photo-'+str(len(p.assets_used)),('rect',{'x':x,'y':y,'width':w,'height':h}))
    c=crop or {'x':.5,'y':.5,'zoom':1}; zoom=c.get('zoom',1)
    scale=max(w/a['width'],h/a['height'])*zoom
    iw,ih=a['width']*scale,a['height']*scale
    px=x-(iw-w)*c.get('x',.5); py=y-(ih-h)*c.get('y',.5)
    p.image(a['path'],px,py,iw,ih,clip='photo-'+str(len(p.assets_used)))
    p.assets_used.append(key)
    return True

def header(p,label):
    start=p.top
    mark(p,p.m+75,start+64,112,'herb2mini')
    text(p,label.upper(),p.m+180,start+40,36 if p.story else 30,'label',maxw=p.w-2*p.m-180,minimum=24)
    day,time=date_parts(p.data['date']) if p.data.get('date') else ('','')
    text(p,day,p.m+180,start+82,28 if p.story else 22,'body',maxw=p.w-2*p.m-180)
    return time

def footer(p):
    p.layer('90-stopka'); y=p.bottom
    M.stripes(p,p.m,y-80,p.w-2*p.m,color=p.accent)
    text(p,'bekapaka.pl',p.m,y,24,'label')
    note='PODGLĄD ROBOCZY' if p.mode=='preview' else ('ILUSTRACJA AI' if p.ai_scene else 'BEKAPAKA BOBOLICE')
    text(p,note,p.w-p.m,y,20,'body',anchor='end',maxw=p.w-2*p.m-220)

def venue_label(p, value, anchor='middle', x=None, y=None, maxw=None):
    # A feathered shade and glyph shadow retain contrast without a visible panel.
    position=len(p.g)
    x=x if x is not None else p.w/2 if anchor=='middle' else p.m+24
    box=text(p,value,x,y if y is not None else p.bottom-108,40,'label',C['white'],anchor,maxw if maxw is not None else p.w-2*p.m-48,minimum=32)
    if box:
        gradient=el('radialGradient',id='venue-shade')
        for offset,opacity in [('0%',.99),('70%',.98),('85%',.60),('100%',0)]:
            gradient.append(el('stop',offset=offset,stop_color=C['black'],stop_opacity=opacity))
        p.defs.append(gradient)
        contrast=el('filter',id='venue-contrast',x='-40%',y='-100%',width='180%',height='300%',color_interpolation_filters='sRGB')
        contrast.append(el('feMorphology',in_='SourceAlpha',operator='dilate',radius=3,result='edge'))
        contrast.append(el('feGaussianBlur',in_='edge',stdDeviation=3,result='blur'))
        contrast.append(el('feFlood',flood_color=C['black'],flood_opacity=1,result='black'))
        contrast.append(el('feComposite',in_='black',in2='blur',operator='in',result='shadow'))
        merge=el('feMerge');merge.append(el('feMergeNode',in_='shadow'));merge.append(el('feMergeNode',in_='SourceGraphic'));contrast.append(merge)
        p.defs.append(contrast)
        p.g[position].set('filter','url(#venue-contrast)')
        p.g.insert(position,el('ellipse',cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2+4,rx=(box[2]-box[0])/2+140,ry=74,fill='url(#venue-shade)',id='venue-shadow'))

def announcement(p):
    d=p.data; time=header(p,{'standard':'Zapowiedź meczu','matchday':'Dzień meczu','postponed':'Mecz przełożony','cancelled':'Mecz odwołany'}[p.variant])
    if p.story:
        announcement_story(p,time)
        return
    cy=p.top+(p.bottom-p.top)*.40
    if p.layout=='marks':
        mh=min(310,(p.bottom-p.top)*.30); delta=p.w*.24
        mark(p,p.w/2-delta,cy,mh)
        M.rival_c(p,p.w/2+delta,cy,mh*1.05,d['opponentShort'] or ''.join(x[0] for x in d['opponent'].split())[:5].upper() or 'RYWAL')
        display(p,'VS',p.w/2,cy+35,90,anchor='middle',maxw=150,cut=False)
        y=cy+mh*.5+90
        text(p,'BEKAPAKA',p.w/2-delta,y,34,maxw=350,anchor='middle',minimum=24)
        wrap(p,d['opponent'].upper() or 'RYWAL DO UZUPEŁNIENIA',p.w/2+delta,y,min(350,p.w*.30),30,'label',maxlines=2,anchor='middle')
    else:
        display(p,'BEKAPAKA',p.w/2,cy-45,170,anchor='middle',maxw=p.w-2*p.m)
        display(p,d['opponent'] or 'RYWAL',p.w/2,cy+85,120,p.accent,'middle',p.w-2*p.m)
    y=p.bottom-200
    value='ODWOŁANY' if p.variant=='cancelled' else (time or 'GODZINA TBC')
    display(p,value,p.w/2,y,155 if p.h>1080 else 125,anchor='middle',maxw=p.w-2*p.m)
    venue_label(p,d['venue']+(' · '+d.get('entryInfo','') if d.get('entryInfo') else ''))
    if p.variant=='postponed' and d['originalDate']:
        old,_=date_parts(d['originalDate']); text(p,'POPRZEDNI TERMIN: '+old,p.w/2,p.bottom-174,20,'body',anchor='middle',maxw=p.w-2*p.m)

def announcement_story(p,time):
    """Native story grid: paired crests, shared team baseline, prominent time."""
    d=p.data
    if p.layout=='marks':
        delta=p.w*.24
        M.chevrons(p,p.w/2,450,90,colors=(p.accent,p.accent))
        mark(p,p.w/2-delta,760,320)
        M.rival_c(p,p.w/2+delta,760,320,d['opponentShort'] or ''.join(x[0] for x in d['opponent'].split())[:5].upper() or 'RYWAL')
        display(p,'VS',p.w/2,795,88,anchor='middle',cut=False)
        text(p,'BEKAPAKA',p.w/2-delta,1040,44,'label',anchor='middle',maxw=380,minimum=36)
        wrap(p,d['opponent'].upper() or 'RYWAL DO UZUPEŁNIENIA',p.w/2+delta,1040,380,40,'label',maxlines=2,anchor='middle')
    else:
        display(p,'BEKAPAKA',p.w/2,650,180,anchor='middle',maxw=p.w-2*p.m)
        display(p,'VS',p.w/2,820,78,anchor='middle',cut=False)
        wrap(p,d['opponent'].upper() or 'RYWAL',p.w/2,1000,p.w-2*p.m,96,'display',maxlines=2,color=p.accent,anchor='middle')
    display(p,'ODWOŁANY' if p.variant=='cancelled' else time or 'GODZINA TBC',p.w/2,1330,220,anchor='middle',maxw=p.w-2*p.m)
    if p.variant=='postponed' and d['originalDate']:
        old,_=date_parts(d['originalDate']); text(p,'POPRZEDNI TERMIN: '+old,p.w/2,1386,20,'body',anchor='middle',maxw=p.w-2*p.m)
    venue_label(p,d['venue']+(' · '+d.get('entryInfo','') if d.get('entryInfo') else ''))

def result(p):
    header(p,{'final':'Koniec meczu','halftime':'Przerwa','live':'Na żywo'}[p.variant]); d=p.data
    if p.story:
        result_story(p)
        return
    if p.layout=='photo' and d.get('photoAssetId'):
        photo(p,d['photoAssetId'],p.m,p.top+140,p.w-2*p.m,p.bottom-p.top-280,d['crop'])
        p.rect(p.m,p.bottom-340,p.w-2*p.m,230,C['black'],opacity=.92)
    cy=p.top+(p.bottom-p.top)*.30
    if p.layout=='board':
        mark(p,p.w*.25,cy,210 if p.h<=1080 else 250)
        M.rival_c(p,p.w*.75,cy,220 if p.h<=1080 else 260,d['opponentShort'] or 'RYWAL')
    sy=p.bottom-290
    us=d['scoreUs']; them=d['scoreThem']
    display(p,'—' if us is None else str(us),p.w*.25,sy,min(290,(p.bottom-p.top)*.33),p.accent,'middle',p.w*.36)
    display(p,':',p.w/2,sy-20,100,anchor='middle',cut=False)
    display(p,'—' if them is None else str(them),p.w*.75,sy,min(290,(p.bottom-p.top)*.33),anchor='middle',maxw=p.w*.36)
    text(p,'BEKAPAKA',p.w*.25,sy+50,34,'label',anchor='middle',maxw=p.w*.35,minimum=24)
    wrap(p,d['opponent'].upper() or 'RYWAL',p.w*.75,sy+50,p.w*.35,30,'label',maxlines=2,anchor='middle')
    label=d['phase']
    if p.variant=='final' and us is not None and them is not None: label='WYGRANA' if us>them else ('PORAŻKA' if us<them else 'REMIS / DO POTWIERDZENIA')
    text(p,label,p.w/2,p.bottom-164,28,'label',p.accent,'middle',p.w-2*p.m,minimum=24)
    venue_label(p,d['venue'])

def result_story(p):
    d=p.data
    if p.layout=='photo' and d.get('photoAssetId'):
        photo(p,d['photoAssetId'],p.m,425,p.w-2*p.m,810,d['crop'])
        p.rect(p.m,850,p.w-2*p.m,430,C['black'],opacity=.94)
    elif p.layout=='board':
        mark(p,p.w*.25,650,260)
        M.rival_c(p,p.w*.75,650,260,d['opponentShort'] or 'RYWAL')
    us,them=d['scoreUs'],d['scoreThem']
    display(p,'—' if us is None else str(us),p.w*.25,1100,330,p.accent,'middle',p.w*.36)
    display(p,':',p.w/2,1080,110,anchor='middle',cut=False)
    display(p,'—' if them is None else str(them),p.w*.75,1100,330,anchor='middle',maxw=p.w*.36)
    text(p,'BEKAPAKA',p.w*.25,1180,40,'label',anchor='middle',maxw=p.w*.35,minimum=32)
    wrap(p,d['opponent'].upper() or 'RYWAL',p.w*.75,1180,p.w*.35,40,'label',maxlines=2,anchor='middle')
    label=d['phase']
    if p.variant=='final' and us is not None and them is not None: label='WYGRANA' if us>them else ('PORAŻKA' if us<them else 'REMIS / DO POTWIERDZENIA')
    text(p,label,p.w/2,1360,44,'label',p.accent,'middle',p.w-2*p.m,minimum=32)
    venue_label(p,d['venue'])

def lineup(p,items,index):
    header(p,'Pierwsza piątka' if p.variant=='five' else 'Skład meczowy')
    display(p,'NASZ SKŁAD',p.m,p.top+240,110,p.accent,maxw=p.w-2*p.m)
    cols=3; jw=200; start=p.top+310; rowgap=360 if p.h<1500 else 460
    for i,person in enumerate(items):
        col=i%3; row=i//3; x=p.m+col*(p.w-2*p.m-jw)/2; y=start+row*rowgap
        kit.jersey(p,x,y,jw,person['number'] or '00',person['lastName'],back_ink='#173EA5' if p.kit=='B' else C['black'],acc=p.accent)
        text(p,person['lastName'].upper(),x+jw/2,y+310,40,'display',p.ink,'middle',jw+20,minimum=40)
        display(p,person['number'] or '00',x+jw/2,y+255,130,C['white'],'middle',jw*.8)
        text(p,person['position'].upper(),x+jw/2,y+350,20,'body',anchor='middle',maxw=jw+20)

def player(p):
    d=p.data; mvp=p.variant=='mvp'; header(p,'MVP · zawodnik meczu' if mvp else ('Nowy zawodnik' if p.variant=='new' else 'Zawodnik BKPK'))
    area=(p.m,p.top+165,p.w-2*p.m,p.bottom-p.top-410)
    if p.layout=='photo': photo(p,d.get('photoAssetId'),*area,d['crop'])
    elif d['number']: display(p,d['number'],p.w/2,p.bottom-(510 if d.get('statistics') else 380),420,p.accent,'middle',p.w-2*p.m)
    if d.get('statistics'):
        stats=d['statistics']; cell=(p.w-2*p.m)/len(stats)
        if p.layout=='photo': p.rect(p.m,p.bottom-480,p.w-2*p.m,140,C['black'],opacity=.92)
        for i,item in enumerate(stats):
            cx=p.m+cell*(i+.5)
            text(p,item['label'],cx,p.bottom-435,24,'label',p.accent,'middle',cell-20,minimum=24)
            value=str(item['value']).replace('.',',')
            display(p,value,cx,p.bottom-360,64,p.ink,'middle',cell-20,cut=False)
    if mvp:
        text(p,'MVP',p.w-p.m,p.top+220,70,'display',C['gold'],'end',200,minimum=40)
    display(p,d['lastName'] or 'NAZWISKO',p.w/2,p.bottom-205,140,C['gold'] if mvp else p.ink,'middle',p.w-2*p.m)
    text(p,(d['firstName']+'  ·  #'+d['number']).upper(),p.w/2,p.bottom-135,32,anchor='middle',maxw=p.w-2*p.m,minimum=24)
    text(p,d['position'].upper(),p.w/2,p.bottom-85,26,'body',anchor='middle',maxw=p.w-2*p.m)

def tournament(p):
    header(p,{'announcement':'Turniej · zapowiedź','program':'Program turnieju','summary':'Podsumowanie turnieju'}[p.variant])
    y=p.top+240
    display(p,p.data['title'] or 'PUCHAR BOBOLIC',p.m,y,140,p.accent,maxw=p.w-2*p.m)
    roman=['','I','II','III','IV','V','VI','VII','VIII','IX','X']
    ed=p.data['edition']; text(p,(roman[ed] if ed is not None and ed<len(roman) else str(ed) if ed is not None else 'EDYCJA —')+' TURNIEJ KOSZYKÓWKI',p.m,y+65,30,maxw=p.w-2*p.m,minimum=24)
    if p.variant=='program':
        wrap(p,p.data['body'],p.m,y+160,p.w-2*p.m,34,maxlines=6)
    else:
        display(p,str(p.data['teams']) if p.data['teams'] is not None else '—',p.m,p.bottom-275,200,p.accent)
        text(p,'DRUŻYN',p.m,p.bottom-210,28)
        display(p,str(p.data['days']) if p.data['days'] is not None else '—',p.w*.55,p.bottom-275,200)
        text(p,'DNI',p.w*.55,p.bottom-210,28)
        if p.data['body']: wrap(p,p.data['body'],p.m,y+160,p.w-2*p.m,30,maxlines=3)
    venue_label(p,p.data['venue'],anchor='start')

def report(p,slide,index):
    header(p,'Relacja' if p.variant!='carousel' else f'Relacja · {index+1}/4')
    d=slide or p.data
    ay=p.top+150; ah=(p.bottom-p.top)*.48
    if d.get('assetId') or p.data.get('photoAssetId'): photo(p,d.get('assetId') or p.data['photoAssetId'],p.m,ay,p.w-2*p.m,ah,p.data['crop'])
    else:
        p.rect(p.m,ay,p.w-2*p.m,ah,'#D8D4CC')
        text(p,'WYBIERZ ZDJĘCIE',p.w/2,ay+ah/2,32,'label',C['black'],'middle')
    y=ay+ah+90
    wrap(p,d['title'].upper(),p.m,y,p.w-2*p.m,56,'display',maxlines=2)
    wrap(p,d.get('body',''),p.m,y+150,p.w-2*p.m,28,maxlines=3)

def partners(p,items,index):
    header(p,'Partnerzy klubu'); display(p,p.data['title'] or 'GRAJĄ Z NAMI',p.m,p.top+230,110,maxw=p.w-2*p.m)
    cols=2; cellw=(p.w-2*p.m-24)/cols; ch=190; top=p.top+300
    for i,partner in enumerate(items):
        x=p.m+(i%cols)*(cellw+24); y=top+(i//cols)*(ch+28)
        p.rect(x,y,cellw,ch,'#FFFFFF')
        a=p.assets.get(partner.get('assetId'))
        if a or partner.get('logoPath'):
            from PIL import Image, ImageChops
            path=a['path'] if a else partner['logoPath']; im=Image.open(path).convert('RGBA')
            difference=ImageChops.difference(im.convert('RGB'),Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>18 else 0)
            mask=ImageChops.multiply(im.getchannel('A'),difference)
            box=mask.getbbox() or im.getchannel('A').getbbox()
            if box: im=im.crop(box)
            path=p.out/f'partner-{index}-{i}.png'; im.save(path); iw,ih=im.size
            # Equal optical area; preserve aspect and reserve 1/4 shorter-side clear space.
            scale=min(math.sqrt((cellw-80)*(ch-70)*.48/(iw*ih)),(cellw-80)/iw,(ch-70)/ih)
            w,h=iw*scale,ih*scale; p.image(path,x+(cellw-w)/2,y+(ch-h)/2,w,h)
        else: wrap(p,partner['name'],x+cellw/2,y+80,cellw-50,28,'label',maxlines=3,color=C['black'],anchor='middle')

def schedule(p,items,index):
    header(p,'Terminarz' if p.variant=='schedule' else ('Aktualność' if p.variant=='news' else 'Ogłoszenie'))
    y=p.top+240; display(p,p.data['title'] or ('TERMINARZ' if p.variant=='schedule' else 'BEKAPAKA'),p.m,y,110,p.accent,maxw=p.w-2*p.m)
    if p.variant!='schedule': wrap(p,p.data['body'],p.m,y+120,p.w-2*p.m,38,maxlines=6); return
    y+=110
    for i,row in enumerate(items):
        day,time=date_parts(row['date']); base=y+i*150
        p.rect(p.m,base-35,p.w-2*p.m,128,'#FFFFFF' if i%2==0 else '#EFEBE3')
        text(p,day+' · '+time,p.m+24,base,24,'label',p.accent,maxw=p.w-2*p.m-48,minimum=24)
        text(p,row['opponent'].upper(),p.m+24,base+58,38,'display',maxw=p.w-2*p.m-190,minimum=26)
        text(p,row['round'],p.w-p.m-24,base+58,22,'body',anchor='end',maxw=140)

def validate_marks(p):
    for name,b in getattr(p,'marks',[]):
        if b[0]<p.m-1 or b[2]>p.w-p.m+1 or b[1]<p.safe[0] or b[3]>p.safe[1]:
            raise LayoutError('logo: Znak poza obszarem informacji')
    for b in p.protected:
        if b[0]<p.m-1 or b[2]>p.w-p.m+1 or b[1]<p.safe[0] or b[3]>p.safe[1]:
            raise LayoutError('logo: Pole ochronne znaku poza marginesem')
    marks=getattr(p,'marks',[])
    if p.data and len(marks)==3:
        a,b=marks[-2][1],marks[-1][1]
        if abs((a[0]+a[2])/2+(b[0]+b[2])/2-p.w)>2 or abs((a[1]+a[3])/2-(b[1]+b[3])/2)>2:
            raise LayoutError('logo: Para znaków ma różne osie lub nie jest symetryczna')

def render(payload,format_name,output,mode,assets,partners_list):
    project=payload['project']; d=project['content']; family=project['family']; variant=project['variant']; w,h=FORMAT[format_name]
    v2=bool(project.get('postType'))
    pages=[None]
    if family=='report' and variant=='carousel': pages=d['slides']
    if family=='lineup': pages=[d['lineup'][i:i+6] for i in range(0,len(d['lineup']),6)] or [[]]
    if family=='schedule' and variant=='schedule':
        count=3 if h<=1080 else 5
        pages=[d['schedule'][i:i+count] for i in range(0,len(d['schedule']),count)] or [[]]
    if family=='partners':
        selected=[x for x in partners_list if x['id'] in d['partnerIds']]
        selected=sorted(selected,key=lambda x:x['name'].casefold())
        count=6 if h<=1350 else 8
        pages=[selected[i:i+count] for i in range(0,len(selected),count)] or [[]]
    if v2 and family in ('statistics','lineup','schedule','partners'):
        if family=='statistics': items=d.get('tableRows',[])
        elif family=='lineup': items=d['lineup']
        elif family=='schedule' and variant=='schedule': items=d['schedule']
        elif family=='partners': items=selected
        else: items=None
        if items is not None:
            # Explicit pagination by native format and composition, never shrinking text.
            top=270 if format_name=='story' else 84
            bottom=1560 if format_name=='story' else h-80
            available=bottom-135-(top+175)
            offset=35
            if project.get('visualStyle')=='photo': offset=available*(.20 if h<=1080 else .28)+55
            if project.get('visualStyle')=='editorial': offset=80
            budget=available-offset-210
            if family=='statistics' and d.get('body'): budget-=60+45*math.ceil(len(d['body'])/45)
            count=max(1,int(budget/110))
            if family=='lineup' and variant=='five': count=5
            if family=='partners':count=max(1,count*2) if variant!='spotlight' else 1
            pages=[items[i:i+count] for i in range(0,len(items),count)] or [[]]
    files=[]; checks=[]
    for index,part in enumerate(pages):
        key=f'{format_name}-{index+1:02d}'; p=Poster(output,key,project['name'],'BeKaPaKa Studio',w=w,h=h)
        p.paper=(project.get('visualStyle')=='editorial') if v2 else family in ('lineup','report','schedule','partners'); p.ink=C['black'] if p.paper else C['white']; p.accent=C['red'] if d['kit']=='A' else '#FF7A18'
        p.mode=mode; p.data=d; p.variant=variant; p.layout=project['layout']; p.kit=d['kit']; p.assets=assets; p.assets_used=[]; p.ai_scene=any(a.get('provenance') for a in assets.values())
        p.story=format_name=='story'; p.family=family
        p.m=72 if w==1080 else 128; p.top=270 if format_name=='story' else 84; p.bottom=1560 if format_name=='story' else h-80
        p.safe=(260,1600) if format_name=='story' else (72,h-72)
        MAT.plate(p,'lineup-paper.png' if p.paper else ('plyta-granat.png' if p.kit=='B' else 'plyta-czysta.png'))
        if d.get('backgroundAssetId'):
            photo(p,d['backgroundAssetId'],0,0,w,h)
            p.rect(0,0,w,h,C['paper'] if p.paper else C['black'],opacity=.90 if p.paper else .80)
        p.layer('10-motyw')
        if not p.paper: M.seams(p,w/2,(p.top+p.bottom)/2,min(w,h)*.45,t=2,color=p.accent,opacity=.12)
        p.fx=MAT.ink(p,shadow=not p.paper); p.layer('30-tresc')
        if v2:
            from render_v2 import compose
            p.visual_style=project['visualStyle'];p.post_type=project['postType']
            compose(p,part,index,globals())
        else: {'announcement':lambda:announcement(p),'result':lambda:result(p),'lineup':lambda:lineup(p,part,index),'player':lambda:player(p),'tournament':lambda:tournament(p),'report':lambda:report(p,part,index),'partners':lambda:partners(p,part,index),'schedule':lambda:schedule(p,part,index)}[family]()
        footer(p)
        try:
            validate_marks(p)
            src=p.save(); files.append({'key':key,'svg':str(src),'width':w,'height':h}); checks.append(json.loads((Path(output)/'qa'/f'{key}-layout.json').read_text()))
        except ValueError as err: raise LayoutError('layout: '+str(err))
    return {'files':files,'checks':checks}

if __name__=='__main__':
    try:
        req=json.loads(Path(sys.argv[1]).read_text())
        result=render(req,req['format'],req['output'],req.get('mode','preview'),req.get('assets',{}),req.get('partners',[]))
        print(json.dumps(result,ensure_ascii=False))
    except (LayoutError,ValueError) as e:
        print(json.dumps({'error':str(e)},ensure_ascii=False)); sys.exit(2)
