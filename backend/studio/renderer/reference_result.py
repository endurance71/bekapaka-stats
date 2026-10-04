"""Independent execution of the frozen brand result reference for review/tests."""
import types
from pathlib import Path
from poster import Poster,C,el
import motyw as M,material as mat,sym,kit
from render_v3 import NAVY_D,NAVY_P,MUT_B

def reference(project,output):
    module=types.ModuleType('kit_b_reference')
    src=Path(__file__).parent/'references/kit_b.py'
    module.__dict__.update(Poster=Poster,C=C,el=el,M=M,mat=mat,sym=sym,kit=kit,HERE=Path(output),
                          NAVY='#173EA5',NAVY_D=NAVY_D,NAVY_P=NAVY_P,ORANGE='#FF7A18',ORANGE_D='#E0600A',MUTB=MUT_B,PAIR_D=290,OPT=1.08,NOTE='DANE PRZYKŁADOWE')
    exec(compile(src.read_text(),str(src),'exec'),module.__dict__)
    d=project['content'];mt={'date':d['date'][8:10]+'.'+d['date'][5:7]+'.'+d['date'][:4],'awayShort':d['opponentShort'],'away':d['opponent'],'venue':d['venue']}
    module.D={'_status':'Wzorzec do oceny','result':{'home':d['scoreUs'],'away':d['scoreThem'],'label':'WYGRANA' if d['scoreUs']>d['scoreThem'] else 'PORAŻKA','sub':'KONIEC MECZU','next':d['nextMatch']}}
    module.MT=mt;module.VENUE=d['venue']; captured=[];old_new=module.new
    def new(*args):
        p=old_new(*args);captured.append(p);p.save=lambda:None;return p
    module.new=new;module.wynik();return captured[0]
