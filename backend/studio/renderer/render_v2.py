"""Versioned publication compositions. Legacy renderer remains unchanged."""
import math
from PIL import Image, ImageChops
LABELS={'preview':'Zapowiedź meczu','matchday':'Dzień meczu','postponed':'Mecz przełożony','cancelled':'Mecz odwołany','final':'Wynik końcowy','halftime':'Wynik w przerwie','live':'Na żywo','five':'Pierwsza piątka','roster':'Pełny skład','profile':'Prezentacja zawodnika','new-player':'Nowy zawodnik','mvp':'MVP meczu','tournament-preview':'Zapowiedź turnieju','tournament-program':'Program turnieju','tournament-summary':'Podsumowanie turnieju','report-cover':'Okładka relacji','photo-post':'Post fotograficzny','carousel':'Relacja','partner-wall':'Partnerzy klubu','partner-profile':'Przedstawienie partnera','partner-thanks':'Dziękujemy partnerom','schedule':'Terminarz','notice':'Ogłoszenie','news':'Aktualność','team-stats':'Statystyki drużyny','player-stats':'Statystyki zawodnika','leaders':'Liderzy meczu','standings':'Tabela ligi','round-summary':'Podsumowanie kolejki','season-summary':'Podsumowanie sezonu','birthday':'Urodziny','training-preview':'Zapowiedź treningu','training-report':'Relacja z treningu','backstage':'Kulisy klubu','quote':'Cytat','anniversary':'Jubileusz','fan-invitation':'Zaproszenie dla kibiców','club-statement':'Komunikat klubu'}

def compose(p, part, index, api):
    text,wrap,display,mark,photo,header,date_parts,M,C,LayoutError=[api[k] for k in ('text','wrap','display','mark','photo','header','date_parts','M','C','LayoutError')]
    d=p.data; style=p.visual_style; family=p.family; label=LABELS[p.post_type]
    header(p,label + (f' · {index+1}/4' if p.post_type=='carousel' else ''))
    x=p.m; y=p.top+175; w=p.w-2*p.m; end=p.bottom-135
    # Three distinct geometries, with no alteration of source image proportions.
    if style=='photo':
        key=(part or {}).get('assetId') if isinstance(part,dict) else None
        key=key or d.get('photoAssetId')
        if p.w>p.h:
            pw=w*.44; photo(p,key,x,y,pw,end-y,d['crop']); x+=pw+40; w-=pw+40
        else:
            ph=(end-y)*(.18 if family=='lineup' and p.variant=='five' else .20 if p.h<=1080 else .28); photo(p,key,x,y,w,ph,d['crop']); y+=ph+55
        if not key and p.mode=='preview': text(p,'WYBIERZ PRAWDZIWE ZDJĘCIE',x,y-35,24,'label',p.accent,maxw=w)
    elif style=='editorial':
        p.rect(x,y,9,end-y,p.accent); x+=40; w-=40
        text(p,f'{index+1:02d} / BEKAPAKA',x,y+20,24,'label',p.accent,maxw=w); y+=80
    else:
        M.chevrons(p,p.w-p.m-70,p.top+195,60,colors=(p.accent,p.accent))
        y+=35
    if family=='report' and style!='photo':
        key=(part or {}).get('assetId') if isinstance(part,dict) else None
        key=key or d.get('photoAssetId')
        ph=(end-y)*(.42 if style=='sport' else .30)
        photo(p,key,x,y,w,ph,d['crop']); y+=ph+50
    center=style=='sport'; anchor='middle' if center else 'start'; tx=x+w/2 if center else x
    available=end-y
    if family in ('announcement','result'):
        # Signs are always paired, BeKaPaKa first; editorial/photo use a type-led pairing.
        if style=='sport':
            cy=y+min(140,available*.20); mh=min(200,available*.30)
            mark(p,x+w*.25,cy,mh); M.rival_c(p,x+w*.75,cy,mh,d['opponentShort'] or 'RYWAL')
            display(p,'VS',x+w/2,cy+25,65,anchor='middle',cut=False)
            y=cy+mh/2+55
            text(p,'BEKAPAKA',x+w*.25,y,30,'label',anchor='middle',maxw=w*.40,minimum=24)
            wrap(p,d['opponent'].upper() or 'RYWAL',x+w*.75,y,w*.40,30,'label',maxlines=2,anchor='middle')
            y+=65
        else:
            y=wrap(p,'BEKAPAKA',x,y+35,w,60,'display',maxlines=1)
            y=wrap(p,'VS '+(d['opponent'] or 'RYWAL').upper(),x,y+18,w,38,'label',maxlines=2,color=p.accent)+35
        _,time=date_parts(d.get('date',''))
        value=('ODWOŁANY' if p.variant=='cancelled' else time or 'GODZINA TBC') if family=='announcement' else f"{d['scoreUs'] if d['scoreUs'] is not None else '—'} : {d['scoreThem'] if d['scoreThem'] is not None else '—'}"
        size=min(145,max(56,(end-y-115)*.58)); baseline=y+size
        display(p,value,tx,baseline,size,anchor=anchor,maxw=w,cut=False); y=baseline+45
        if family=='result':
            us,them=d['scoreUs'],d['scoreThem']; status=('WYGRANA' if us>them else 'PORAŻKA' if us<them else 'WYNIK DO POTWIERDZENIA') if p.variant=='final' and us is not None and them is not None else d.get('phase','')
            text(p,status,tx,y,24,'label',p.accent,anchor,maxw=w); y+=60
        elif p.variant=='postponed' and d.get('originalDate'):
            day,_=date_parts(d['originalDate']); text(p,'POPRZEDNIO: '+day,tx,y,24,'label',anchor=anchor,maxw=w); y+=50
        venue_y=max(end-10,y+45)
        if style=='editorial': text(p,d.get('venue',''),tx,venue_y,38,'label',anchor=anchor,maxw=w,minimum=32)
        else: api['venue_label'](p,d.get('venue',''),anchor,x=tx,y=venue_y,maxw=w)
        if d.get('entryInfo'): text(p,d['entryInfo'],tx,venue_y+55,24,'label',anchor=anchor,maxw=w)
    elif family=='player':
        if style=='sport':
            display(p,'#'+(d['number'] or '—'),tx,y+135,155,color=C['gold'] if p.variant=='mvp' else p.accent,anchor=anchor,cut=False); y+=200
        y=wrap(p,d['lastName'].upper() or 'NAZWISKO',tx,y+50,w,72,'display',maxlines=2,anchor=anchor,color=C['gold'] if p.variant=='mvp' else p.ink)
        text(p,(d['firstName']+' · #'+d['number']).upper(),tx,y+35,32,'label',anchor=anchor,maxw=w);y+=100
        text(p,d.get('position','').upper(),tx,y,24,'label',p.accent,anchor,maxw=w);y+=60
        for stat in d.get('statistics',[]): text(p,f"{stat['label']}  {stat['value']}",tx,y,36,'label',anchor=anchor,maxw=w);y+=60
    else:
        title=(part or {}).get('title') if isinstance(part,dict) else None
        title=title or d.get('title') or label
        if family=='club' and p.variant=='birthday': title=d.get('title') or 'WSZYSTKIEGO NAJLEPSZEGO'
        if family=='club' and p.variant=='birthday': title=(d['firstName']+' '+d['lastName']).strip() or title
        y=wrap(p,title.upper(),tx,y+45,w,56 if style=='photo' else 64,'display',maxlines=2,anchor=anchor,color=C['gold'] if family=='tournament' and p.variant=='summary' else p.ink)+35
        rows=[]
        if family=='lineup': rows=[{'label':(v['firstName']+' '+v['lastName']).strip().upper(),'value':'#'+v['number'],'detail':v.get('position','')} for v in (part or [])]
        elif family=='statistics': rows=part or []
        elif family=='schedule' and p.variant=='schedule':
            rows=[{'label':r['opponent'].upper(),'value':date_parts(r['date'])[1],'detail':date_parts(r['date'])[0]} for r in (part or [])]
        elif family=='partners':
            items=part or []; cols=1 if p.variant=='spotlight' else 2
            cellw=(w-28*(cols-1))/cols; rowcount=max(1,math.ceil(len(items)/cols)); ch=min(220,(end-y-(120 if p.variant=='thanks' else 0))/rowcount-24)
            if ch<90: raise LayoutError('partnerIds: Za dużo partnerów na planszy')
            for i,item in enumerate(items):
                cx=x+(i%cols)*(cellw+28);cy=y+(i//cols)*(ch+24)
                p.rect(cx,cy,cellw,ch,C['white'])
                a=p.assets.get(item.get('assetId')); path=a['path'] if a else item.get('logoPath')
                if path:
                    im=Image.open(path).convert('RGBA'); diff=ImageChops.difference(im.convert('RGB'),Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>18 else 0);mask=ImageChops.multiply(im.getchannel('A'),diff);box=mask.getbbox() or im.getchannel('A').getbbox()
                    if box:im=im.crop(box)
                    path=p.out/f'optical-{index}-{i}.png';im.save(path);iw,ih=im.size;scale=min(math.sqrt((cellw-70)*(ch-50)*.48/(iw*ih)),(cellw-70)/iw,(ch-50)/ih);pw,ph=iw*scale,ih*scale;p.image(path,cx+(cellw-pw)/2,cy+(ch-ph)/2,pw,ph)
                else:wrap(p,item['name'],cx+cellw/2,cy+ch/2-10,cellw-50,28,'label',maxlines=2,color=C['black'],anchor='middle')
            y+=rowcount*(ch+24)
        if rows:
            gap=72 if family=='lineup' and p.variant=='five' else 110 if any(r.get('detail') for r in rows) else 88
            if y+len(rows)*gap>end+35: raise LayoutError('tableRows: Wiersze nie mieszczą się w tej kompozycji')
            for i,r in enumerate(rows):
                if style=='sport':
                    p.rect(x,y-30,w,gap-15,C['black'],opacity=.75)
                    text(p,r['label'],x+18,y+8,32,'label',maxw=w*.66,minimum=24);text(p,r['value'],x+w-18,y+8,38,'label',p.accent,'end',maxw=w*.27,minimum=24)
                else:
                    text(p,r['label'],x,y+8,30,'label',maxw=w*.68,minimum=24);text(p,r['value'],x+w,y+8,34,'label',p.accent,'end',maxw=w*.27,minimum=24)
                if r.get('detail'): text(p,r['detail'],x+18 if style=='sport' else x,y+(40 if gap==72 else 53),20 if gap==72 else 22,'body',maxw=w-36)
                y+=gap
        body=(part or {}).get('body') if isinstance(part,dict) else d.get('body','')
        body=body or ''
        if family=='lineup' or (family=='schedule' and p.variant=='schedule'): body=''
        if family=='tournament':
            if p.variant!='program': body=f"EDYCJA {d.get('edition') or '—'} · {d.get('teams') or '—'} DRUŻYN · {d.get('days') or '—'} DNI. "+body
        if family=='partners' and p.variant!='thanks': body=''
        if family=='club' and p.variant in ('training','invitation'):
            _,time=date_parts(d.get('date','')); display(p,time or 'GODZINA TBC',tx,y+100,105,anchor=anchor,maxw=w,cut=False); y+=145
        if body:
            body_size=44 if family=='club' and p.variant in ('quote','birthday','anniversary') else 36 if family=='club' else 30
            y+=10; maxlines=int((end-y)/(body_size*1.5))
            if maxlines<1: raise LayoutError('body: Brak miejsca na opis. Skróć listę lub opis.')
            y=wrap(p,body,tx,y+20,w,body_size,'body',maxlines=min(8,maxlines),anchor=anchor)+25
        if family=='club' and p.variant=='quote':text(p,d.get('attribution',''),tx,y+15,28,'label',p.accent,anchor,maxw=w)
        if family in ('club','tournament') and d.get('venue'):text(p,d['venue'],tx,end+10,32,'label',anchor=anchor,maxw=w,minimum=32)
    # Core DNA also appears on light and photographic compositions.
    p.layer('80-dna');M.stripes(p,p.m,p.bottom-95,p.w-2*p.m,color=p.accent)
