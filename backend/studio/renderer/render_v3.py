"""Brandbook compositions, JSON data only. Feed geometry follows rdzen-v6/stroj-b.
Native Story/square/landscape coordinates are explicit adaptations requiring review.
References and their hashes live in references/; version 2 stays immutable.
"""
import math
from PIL import Image, ImageChops
from poster import C, el, width
import motyw as M, material as MAT, sym, kit
from render import text, wrap, display, mark, photo, date_parts, LayoutError
NAVY_D='#0B1E55'; NAVY_P='#0E2770'; MUT_B='#AFC0EE'

def grid(p):
    # (ribbon, metadata, mark centre, mark height, score, names, panel, stripes, footer)
    return {'feed':(74,204,400,270,880,950,1030,1176,1270),
            'story':(270,400,700,270,1180,1250,1330,1476,1560),
            'square':(74,180,330,220,670,730,805,905,990),
            'landscape':(74,190,350,270,725,790,860,924,990)}[p.format_name]

def ribbon(p,label,y,size=40,grey=False):
    M.ribbon(p,p.w/2,y,label,size,fill='#5C5852' if grey else p.accent if p.kit=='B' or p.variant=='live' else M.GOLD,
             ink=C['white'] if grey or p.kit=='B' or p.variant=='live' else C['black'],
             tail='#444444' if grey else '#E0600A' if p.kit=='B' else M.GOLD_D)

def rival(p,cx,cy,h):
    M.rival_c(p,cx,cy,h,p.data.get('opponentShort') or 'RYWAL',
              **({'fill':'#0A1A4A','line':'#3A5BB8'} if p.kit=='B' else {}))

def foundation(p):
    p.layer('10-material')
    if p.data.get('backgroundAssetId'):
        photo(p,p.data['backgroundAssetId'],0,0,p.w,p.h)
    else: MAT.plate(p,'lineup-paper.png' if p.paper else 'plyta-granat.png' if p.kit=='B' else 'plyta-czysta.png')
    if not p.paper:
        tone=NAVY_D if p.kit=='B' else C['black']
        p.rect(0,0,p.w,p.h,p.fade('brand-material',0,0,0,p.h,[(0,tone,.5 if p.kit=='B' else .55),(.5,tone,.1 if p.kit=='B' else .15),(1,tone,.65 if p.kit=='B' else .6)]))
        if p.kit=='B':
            mask=el('mask',id='kit-b-cracks-mask',maskUnits='userSpaceOnUse',x=0,y=0,width=p.w,height=p.h)
            mask.append(el('rect',x=0,y=0,width=p.w,height=p.h,fill=p.fade('kit-b-cracks-fade',0,p.h-530,0,p.h-100,[(0,'#FFFFFF',0),(1,'#FFFFFF',1)])))
            p.defs.append(mask); prev=p.g;p.g=el('g',mask='url(#kit-b-cracks-mask)',opacity=.35);prev.append(p.g)
            sym.place(p,'wzor-pekniecia-B',0,p.h-1050,p.w);p.g=prev
        elif p.family in ('announcement','result') and p.visual_style=='sport':
            M.seams(p,p.w/2,p.h*.46,470,t=2.5,color=C['red'],opacity=.18)
    p.fx=MAT.ink(p,shadow=not p.paper)

def foot(p,note=None):
    p.layer('90-stopka'); *_,sy,fy=grid(p)
    if p.family not in ('report','player') or p.variant=='mvp':
        M.stripes(p,p.m,sy,p.w-2*p.m,color=M.GOLD if p.family=='player' and p.variant=='mvp' else p.accent)
    sym.place(p,'wordmark-kolor' if p.paper else 'wordmark-negatyw',p.m,fy-40,h=50)
    note=note or ('PODGLĄD ROBOCZY' if p.mode=='preview' else 'ILUSTRACJA AI' if p.ai_scene else 'BEKAPAKA BOBOLICE')
    text(p,note,p.w-p.m,fy,20,'body',C['black'] if p.paper else MUT_B if p.kit=='B' else C['muted'],'end',p.w-2*p.m-260)

def mini_header(p,label):
    y=334 if p.story else 150
    mark(p,p.m+76,y,116,'herb2mini')
    text(p,label.upper(),p.m+168,y-10,30,'label',maxw=p.w-2*p.m-138,minimum=24)
    day,_=date_parts(p.data.get('date','')) if p.data.get('date') else ('','')
    text(p,day,p.m+168,y+26,22,'body',maxw=p.w-2*p.m-138)

def metadata(p,value,y):
    if width(value,26,'label',4)<=p.w-2*p.m:
        p.text(value,p.w/2,y,26,'label',spacing=4,anchor='middle',fill=MUT_B if p.kit=='B' else C['muted'])
    else:wrap(p,value,p.w/2,y,p.w-2*p.m,26,'label',maxlines=2,color=MUT_B if p.kit=='B' else p.ink,anchor='middle')

def result(p):
    d=p.data; ry,my,cy,mh,sy,ny,py,_,_=grid(p); delta=290 if p.w==1080 else 560
    us,them=d.get('scoreUs'),d.get('scoreThem'); final=p.variant=='final'
    label=('WYGRANA' if us>them else 'PORAŻKA' if us<them else 'WYNIK DO POTWIERDZENIA') if final and us is not None and them is not None else 'PRZERWA' if p.variant=='halftime' else 'NA ŻYWO' if p.variant=='live' else 'WYNIK'
    p.layer('20-wstega');ribbon(p,label,ry)
    day,_=date_parts(d.get('date',''));metadata(p,('KONIEC MECZU' if final else d.get('phase') or label)+' · '+(day.split(' · ')[-1] if d.get('date') else '—')+' · '+d.get('venue',''),my)
    if p.visual_style=='photo':
        # Separate player/score layout derived from 02B: vertical score on left, real portrait on right.
        p.layer('30-zawodnik')
        if d.get('number'):M.outline(p,d['number'],p.w*.68,sy,600,p.accent,t=6,anchor='middle',deco=True)
        photo(p,d.get('photoAssetId'),p.w*.36,cy-100,p.w*.64,py-cy+100,d['crop'])
        p.rect(p.m,sy-340,p.w-2*p.m,py-sy+340,p.fade('result-photo-shade',0,sy-340,0,py,[(0,C['black'],0),(1,C['black'],1)]))
        slots=[(us,p.m,sy-270,True),(them,p.m,sy,False)]; size=240
    else:
        p.layer('30-znaki');mark(p,p.w/2-delta,cy,mh);rival(p,p.w/2+delta,cy,mh*1.08)
        slots=[(us,p.w/2-delta,sy,True),(them,p.w/2+delta,sy,False)];size=300 if p.h>=1350 else 230
    p.layer('40-wynik')
    for val,cx,baseline,ours in slots:
        value='—' if val is None else str(val);anchor='start' if p.visual_style=='photo' else 'middle'
        g,_=M.Z.lettering(value,size);limit=380 if p.w==1080 else 500
        actual=min(size,size*limit/(g.bounds[2]-g.bounds[0]))
        lead=us is not None and them is not None and ((us>them and ours) or (them>us and not ours))
        if lead:display(p,value,cx,baseline,actual,p.accent if ours else C['white'],anchor,limit)
        else:M.outline(p,value,cx,baseline,actual,C['white'],t=7,anchor=anchor)
        if p.visual_style=='photo':text(p,'BEKAPAKA' if ours else d.get('opponent','').upper(),cx,baseline+55,30,'label',maxw=380,minimum=24)
    if p.visual_style!='photo':
        M.solid(p,':',p.w/2,sy-60,150,C['white'],anchor='middle',cut=False)
        p.text('BEKAPAKA',p.w/2-delta,ny,34,'label',spacing=4,anchor='middle',shadow=True)
        name=d.get('opponent','').upper();limit=min(380,2*(p.w/2-p.m-delta))
        if name:
            if width(name,34,'label',4)<=limit:p.text(name,p.w/2+delta,ny,34,'label',spacing=4,anchor='middle',fill=MUT_B if p.kit=='B' else C['muted'])
            else:wrap(p,name,p.w/2+delta,ny,limit,34,'label',maxlines=2,color=MUT_B if p.kit=='B' else C['muted'],anchor='middle')

def announcement(p):
    d=p.data;ry,my,_,_,_,_,_,_,_=grid(p);day,time=date_parts(d.get('date',''))
    if p.visual_style=='jersey':
        mini_header(p,'MATCHDAY')
        off=200 if p.story else 0
        advance=sym.lettering(p,'GRAMY',p.m,330+off,120,fill=C['white'],fx=p.fx)
        sym.lettering(p,'W STROJU '+p.kit,p.m+advance+30,330+off,120,fill=p.accent,fx=p.fx)
        M.stripes(p,p.m,360+off,p.w-2*p.m,color=p.accent)
        jersey(p,p.w/2-260,420+off,520,d)
        sym.icon_row_c(p,[('godzina',time),('hala',d.get('venue',''))],p.w/2,1150+off,size=30,text_size=28,shadow=True)
        return
    label={'standard':'ZAPOWIEDŹ MECZU','matchday':'DZIEŃ MECZU','postponed':'MECZ PRZEŁOŻONY','cancelled':'MECZ ODWOŁANY'}[p.variant]
    if p.visual_style=='editorial':
        # 01B is typographic, not a paper recolour of 01A.
        mark(p,p.w/2,445 if p.story else 260,290)
        date=day.split(' · ')[-1][:5];M.outline(p,date,p.w/2,960 if p.story else 730 if p.h==1350 else 650,260 if p.h<=1080 else 330,p.accent,t=7,anchor='middle')
        text(p,day.split(' · ')[0],p.w/2,1040 if p.story else 800 if p.h==1350 else 710,60,'label',anchor='middle',maxw=p.w-2*p.m,minimum=40)
        by=1130 if p.story else 860 if p.h==1350 else 760
        M.blade_panel(p,p.m,by,p.w-2*p.m,130,p.accent)
        wrap(p,'BEKAPAKA — '+d.get('opponent','').upper(),p.w/2,by+50,p.w-2*p.m-220,36,'label',maxlines=2,anchor='middle')
        metadata(p,time+' · '+d.get('venue',''),1400 if p.story else 1120 if p.h==1350 else 870)
        return
    p.layer('20-wstega');ribbon(p,label,ry,grey=p.variant=='cancelled')
    line=day
    if p.variant in ('postponed','cancelled') and d.get('originalDate'):
        line,_=date_parts(d['originalDate']);box=text(p,line,p.w/2,my,26,'label',anchor='middle',maxw=p.w-2*p.m)
        if box:p.rect(box[0]-6,(box[1]+box[3])/2-2,box[2]-box[0]+12,4,p.accent)
    else:metadata(p,line,my)
    cy=770 if p.story else 470 if p.h==1350 else 380 if p.w==1080 else 500
    mh=300 if p.h>=1350 else 270 if p.w==1080 else 300;delta=270 if p.w==1080 else 560
    p.layer('30-druzyny');mark(p,p.w/2-delta,cy,mh);rival(p,p.w/2+delta,cy,mh*1.08)
    if p.w==1080:
        display(p,'VS',p.w/2,cy+40,120 if p.h>=1350 else 110,anchor='middle');M.chevrons(p,p.w/2,cy+80,110,colors=(p.accent,p.accent))
    ny=cy+mh/2+78
    text(p,'BEKAPAKA',p.w/2-delta,ny+20 if p.w>p.h else ny,38,'label',anchor='middle',maxw=330,minimum=24)
    wrap(p,d.get('opponent','').upper(),p.w/2+delta,ny+20 if p.w>p.h else ny,330,38,'label',maxlines=2,anchor='middle')
    px,py,pw,ph,ps=(160,1110,760,210,190) if p.story else (160,810,760,210,190) if p.h==1350 else (200,650,680,170,150) if p.w==1080 else (660,450,600,220,190)
    panel_label='ODWOŁANY' if p.variant=='cancelled' else time or 'GODZINA TBC'
    panel_size=100 if p.variant=='cancelled' else ps
    glyphs,_=M.Z.lettering(panel_label,panel_size)
    # Fit the actual outlined lettering inside the rectangular part of the 24° panel.
    available=pw-ph*M.G.A24*1.6-74
    panel_size=min(panel_size,panel_size*available/(glyphs.bounds[2]-glyphs.bounds[0]))
    p.layer('40-panel');M.panel_text(p,panel_label,px,py,pw,ph,panel_size,p.ink,fx=p.fx,fill=NAVY_D if p.kit=='B' else C['black'],keyline=(10,4,p.accent if p.kit=='B' else M.GOLD))
    if p.variant=='postponed':text(p,'NOWY TERMIN: '+day,p.w/2,py+ph+45,26,'label',anchor='middle',maxw=p.w-2*p.m)
    vy=1420 if p.story else 1120 if p.h==1350 else 870 if p.w==1080 else 740
    if p.variant=='postponed':vy+=70 if p.h<=1080 else 25
    sym.icon_row_c(p,[('hala',d.get('venue',''))],p.w/2,vy,size=30,text_size=28,shadow=True)
    if d.get('entryInfo'):text(p,d['entryInfo'],p.w/2,vy+40,24,'label',anchor='middle',maxw=p.w-2*p.m)

def jersey(p,x,y,w,person):
    k=w/200;number_size=230 if w>=500 else 170 if w>=400 else 110;name_size=44 if w>=500 else 32 if w>=400 else 23;kit.jersey(p,x,y,w,person.get('number',''),person.get('lastName',''),back_ink='#173EA5' if p.kit=='B' else C['black'],acc=p.accent)
    text(p,person.get('lastName','').upper(),x+w/2,y+75*k+name_size*.35,name_size,'label',C['white'],'middle',120*k,minimum=20)
    display(p,person.get('number',''),x+w/2,y+190*k+number_size*.35,number_size,C['white'],'middle',192*k)

def lineup(p,items):
    mini_header(p,'SKŁAD MECZOWY');top=630 if p.story else 430
    if p.variant=='five':
        advance=sym.lettering(p,'PIERWSZA',p.m,top-100,120,fill=C['black'],fx=p.fx)
        sym.lettering(p,'PIĄTKA',p.m+advance+30,top-100,120,fill=p.accent,fx=p.fx)
    else:display(p,'SKŁAD MECZOWY',p.m,top-100,100,C['black'],maxw=p.w-2*p.m)
    M.stripes(p,p.m,top-70,p.w-2*p.m,color=p.accent)
    slots=[(72,top),(415,top),(758,top),(243,top+380),(586,top+380)]
    for (x,y),person in zip(slots,items):
        jersey(p,x,y,250,person);text(p,person.get('position','').upper(),x+125,y+357,20,'label',C['black'],'middle',330)

def player(p):
    d=p.data;off=200 if p.story else 0;mvp=p.variant=='mvp'
    if mvp:
        mvp_player(p);return
    p.layer('20-rama');M.step_frame(p,p.m,150+off,p.w-2*p.m,1000,t=6,color=M.GOLD,step=34,inner=(14,2))
    M.outline(p,d.get('number',''),p.w/2,960+off,860,p.accent,t=6,anchor='middle',deco=True)
    p.layer('40-zawodnik');fr=M.stepped(p.m,150+off,p.w-2*p.m,1000,34);p.clip('player-frame',('path',{'d':M.G.d(M.G.inset(fr,22))}))
    # photo() preserves source proportions and the selected focus; the group applies the stepped clip.
    prev=p.g;p.g=el('g',clip_path='url(#player-frame)');prev.append(p.g)
    if p.visual_style=='photo':photo(p,d.get('photoAssetId'),-40,230+off,1160,1160,d['crop'])
    else:jersey(p,p.w/2-200,390+off,400,d)
    p.g=prev;p.rect(p.m,860+off,p.w-2*p.m,290,p.fade('player-shade',0,860+off,0,1150+off,[(0,C['black'],0),(1,C['black'],.95)]))
    ribbon(p,'MVP MECZU' if mvp else 'NOWY ZAWODNIK' if p.variant=='new' else 'ZAWODNIK BKPK',270 if p.story else 90,34)
    text(p,(d.get('firstName','')+' · '+d.get('position','')).upper(),p.w/2,940+off,32,'label',anchor='middle',maxw=p.w-2*p.m)
    display(p,d.get('lastName',''),p.w/2,1105+off,140,M.GOLD if mvp else C['white'],'middle',p.w-2*p.m)
    if d.get('statistics'):
        cell=(p.w-2*p.m)/len(d['statistics'])
        for i,s in enumerate(d['statistics']):text(p,f"{s['label']} {s['value']}",p.m+cell*(i+.5),1190+off,28,'label',M.GOLD if mvp else p.accent,'middle',cell-20,minimum=24)

def mvp_player(p):
    d=p.data;off=200 if p.story else 0
    p.layer('20-zloto');M.seams(p,p.w/2,620+off,520,t=3,color=M.GOLD,opacity=.35)
    p.layer('30-zawodnik')
    if p.visual_style=='photo':photo(p,d.get('photoAssetId'),40,260+off,1000,1000,d['crop'])
    else:jersey(p,p.w/2-230,360+off,460,d)
    p.rect(0,880+off,p.w,470,p.fade('mvp-shade',0,880+off,0,1180+off,[(0,C['black'],0),(1,C['black'],1)]))
    p.layer('40-odznaka');mark(p,230,200+off,200,'mvp')
    text(p,'ZAWODNIK MECZU',p.w-p.m,150+off,30,'label',M.GOLD,'end',600)
    if d.get('date'):
        day,_=date_parts(d['date']);text(p,day,p.w-p.m,190+off,22,'body',C['muted'],'end',600)
    p.layer('50-nazwisko');display(p,d.get('lastName',''),p.w/2,1080+off,140,M.GOLD,'middle',p.w-2*p.m)
    text(p,(d.get('firstName','')+' · #'+d.get('number','')).upper(),p.w/2,1140+off,32,'label',anchor='middle',maxw=p.w-2*p.m)
    if d.get('statistics'):
        text(p,' · '.join(f"{s['label']} {s['value']}" for s in d['statistics']),p.w/2,1190+off,28,'label',M.GOLD,'middle',p.w-2*p.m,minimum=24)

def report(p,part,index):
    d=part if isinstance(part,dict) else p.data;top=360 if p.story else 150;fh=760
    p.layer('20-zdjecie');fr=M.stepped(p.m,top,p.w-2*p.m,fh,30);p.clip('report-frame',('path',{'d':M.G.d(M.G.inset(fr,14))}))
    prev=p.g;p.g=el('g',clip_path='url(#report-frame)');prev.append(p.g)
    photo(p,d.get('assetId') or p.data.get('photoAssetId'),p.m,top,p.w-2*p.m,fh,p.data['crop']);p.g=prev
    M.shape(p,fr.difference(M.G.inset(fr,8)),C['black'])
    ribbon(p,'RELACJA'+(f' · {index+1}/4' if p.variant=='carousel' else ''),top+730,34)
    wrap(p,d.get('title','').upper(),p.w/2,top+910,p.w-2*p.m,66,'display',maxlines=2,color=C['black'],anchor='middle')
    wrap(p,d.get('body',''),p.w/2,top+1040,p.w-2*p.m,24,'body',maxlines=2,color=C['black'],anchor='middle')

def partners(p,items):
    ribbon(p,'PARTNERZY KLUBU',270 if p.story else 74,34);title=p.data.get('title') or 'GRAJĄ Z NAMI'
    display(p,title,p.w/2,530 if p.story else 300,110,C['black'],'middle',p.w-2*p.m)
    start=680 if p.story else 500;cols=1 if p.variant=='spotlight' else 2;cw=(p.w-2*p.m-24*(cols-1))/cols;ch=190
    for i,item in enumerate(items):
        x=p.m+i%cols*(cw+24);y=start+i//cols*(ch+28);p.rect(x,y,cw,ch,'#FFFFFF')
        a=p.assets.get(item.get('assetId'));path=a['path'] if a else item.get('logoPath')
        if path:
            im=Image.open(path).convert('RGBA');diff=ImageChops.difference(im.convert('RGB'),Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>18 else 0);box=ImageChops.multiply(im.getchannel('A'),diff).getbbox() or im.getchannel('A').getbbox()
            if box:im=im.crop(box)
            out=p.out/f'optical-{i}.png';im.save(out);iw,ih=im.size;s=min(math.sqrt((cw-80)*(ch-70)*.48/(iw*ih)),(cw-80)/iw,(ch-70)/ih);p.image(out,x+(cw-iw*s)/2,y+(ch-ih*s)/2,iw*s,ih*s)
        else:wrap(p,item['name'],x+cw/2,y+80,cw-50,28,'label',maxlines=3,color=C['black'],anchor='middle')
    if p.variant=='thanks':wrap(p,p.data.get('body',''),p.m,start+math.ceil(len(items)/cols)*(ch+28)+30,p.w-2*p.m,28,'body',maxlines=2,color=C['black'])

def schedule(p,items):
    mini_header(p,'TERMINARZ');start=760 if p.story else 470 if p.h<=1080 else 560
    display(p,p.data.get('title','').upper(),p.m,350 if p.h<=1080 else start-230,100,C['black'],maxw=p.w-2*p.m);M.stripes(p,p.m,380 if p.h<=1080 else start-200,p.w-2*p.m,color=p.accent)
    for i,row in enumerate(items):
        y=start+i*(140 if p.h<=1080 else 160);M.blade_panel(p,p.m,y-120,p.w-2*p.m,140,'#FFFFFF' if i%2==0 else '#EFEBE3',left=False)
        day,time=date_parts(row['date']);date=day.split(' · ')[-1][:5]
        display(p,date,p.m+28,y-15,76,p.accent,maxw=220)
        text(p,row['opponent'].upper(),p.m+288,y-45,40,'label',C['black'],maxw=400,minimum=26)
        text(p,time,p.m+288,y,22,'body',C['black']);text(p,row.get('round',''),p.w-p.m-120,y-25,22,'label',C['black'],'end',130)

def tournament(p):
    d=p.data;off=200 if p.story else 0
    if p.h<=1080:
        tournament_compact(p);return
    if p.visual_style=='photo':photo(p,d.get('photoAssetId'),p.w*.40,200+off,p.w*.60,1000,d['crop'])
    else:M.seams(p,p.w*.75,700+off,350,t=3,color=p.accent,opacity=.18)
    p.rect(0,0,p.w,p.h,p.fade('tournament-shade',0,0,p.w*.8,0,[(0,C['black'],1),(.6,C['black'],.8),(1,C['black'],0)]))
    mini_header(p,'TURNIEJ · EDYCJA '+str(d.get('edition') or '—'))
    wrap(p,d.get('title','').upper(),p.m,560+off,p.w*.60,80 if p.variant=='summary' else 110,'display',maxlines=2)
    M.chevrons(p,p.m+68,800+off,110,colors=(p.accent,p.accent))
    if p.variant=='program':wrap(p,d.get('body',''),p.m,940+off,p.w-2*p.m,30,'body',maxlines=4)
    else:
        for value,label,x in [(d.get('teams'),'DRUŻYN',p.m),(d.get('days'),'DNI',p.m+230)]:
            display(p,str(value) if value is not None else '—',x,1010+off,150,maxw=200);text(p,label,x+4,1050+off,26,'label')
        if d.get('body'):wrap(p,d['body'],p.m,1110+off,p.w-2*p.m,24,'body',maxlines=1)
    text(p,d.get('venue',''),p.m,1150+off,28,'label',maxw=p.w-2*p.m)

def tournament_compact(p):
    d=p.data
    if p.visual_style=='photo':photo(p,d.get('photoAssetId'),p.w*.42,180,p.w*.58,690,d['crop'])
    else:M.seams(p,p.w*.72,550,300,t=3,color=p.accent,opacity=.18)
    p.rect(0,180,p.w,690,p.fade('compact-hero',0,0,p.w*.8,0,[(0,C['black'],1),(.6,C['black'],.8),(1,C['black'],0)]))
    mini_header(p,'TURNIEJ · EDYCJA '+str(d.get('edition') or '—'))
    wrap(p,d.get('title','').upper(),p.m,430,p.w*.60,72,'display',maxlines=2)
    M.chevrons(p,p.m+68,650,90,colors=(p.accent,p.accent))
    if p.variant=='program':wrap(p,d.get('body',''),p.m,750,p.w-2*p.m,30,'body',maxlines=3)
    else:
        for value,label,x in [(d.get('teams'),'DRUŻYN',p.m),(d.get('days'),'DNI',p.m+230)]:
            display(p,str(value) if value is not None else '—',x,825,140,maxw=200);text(p,label,x,865,26,'label')
    text(p,d.get('venue',''),p.w-p.m,875,28,'label',anchor='end',maxw=p.w-2*p.m-450)

def extension(p,part):
    # Explicit draft extensions: numerical tables, quote, photo story, information.
    from render_v2 import LABELS
    mini_header(p,LABELS[p.post_type]);y=p.top+260;w=p.w-2*p.m
    if p.family=='statistics':
        display(p,p.data.get('title',''),p.m,y,72,p.accent,maxw=w);y+=100
        for i,row in enumerate(part or []):
            M.blade_panel(p,p.m,y-40,w,100,'#FFFFFF' if p.paper else '#161616',left=False)
            text(p,row['label'],p.m+24,y,30,'label',maxw=w*.60,minimum=24);text(p,row['value'],p.w-p.m-80,y,38,'label',p.accent,'end',w*.25,minimum=24)
            if row.get('detail'):text(p,row['detail'],p.m+24,y+35,22,'body',maxw=w-120)
            y+=120
    else:
        if p.visual_style=='photo':photo(p,p.data.get('photoAssetId'),p.m,y,w,400,p.data['crop']);y+=470
        if p.variant=='quote':M.step_frame(p,p.m,y-80,w,500,t=6,color=p.accent,step=30)
        title=(p.data.get('firstName','')+' '+p.data.get('lastName','')).strip() if p.variant=='birthday' else p.data.get('title','')
        y=wrap(p,title.upper(),p.m,y,w,72,'display',maxlines=2,color=p.accent)+35
        maxlines=min(8,int((p.bottom-150-y)/45))
        if p.data.get('body') and maxlines<1:raise LayoutError('body: Brak miejsca na treść')
        y=wrap(p,p.data.get('body',''),p.m,y,w,30,'body',maxlines=maxlines)+30
        if p.variant=='quote':text(p,p.data.get('attribution',''),p.m,y,28,'label',p.accent,maxw=w)
        if p.data.get('venue'):text(p,p.data['venue'],p.m,p.bottom-130,28,'label',maxw=w)

def compose(p,part,index):
    foundation(p);p.layer('30-tresc')
    if p.family=='announcement':announcement(p)
    elif p.family=='result':result(p)
    elif p.family=='lineup':lineup(p,part or [])
    elif p.family=='player':player(p)
    elif p.family=='report':report(p,part,index)
    elif p.family=='partners':partners(p,part or [])
    elif p.family=='tournament':tournament(p)
    elif p.family=='schedule' and p.variant=='schedule':schedule(p,part or [])
    else:extension(p,part)
    foot(p)
