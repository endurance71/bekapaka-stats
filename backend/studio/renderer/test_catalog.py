import unittest,tempfile,json,subprocess
from pathlib import Path
from PIL import Image
from render import render, LayoutError
ROOT=Path(__file__).resolve().parents[2]
class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog=json.loads(subprocess.check_output(['node','studio/catalog-fixtures.js'],cwd=ROOT,text=True))
    def test_all_publication_compositions_and_formats(self):
        with tempfile.TemporaryDirectory() as tmp:
            image=Path(tmp)/'court.png';Image.new('RGB',(1200,800),(75,65,50)).save(image)
            assets={'photo':{'path':str(image),'width':1200,'height':800}}
            partners=[{'id':str(i),'name':'Partner '+str(i)} for i in range(1,5)]
            for t in self.catalog:
                geometries=[]
                for p in t['projects']:
                    for uniform in ['A','B']:
                        p['content']['kit']=uniform
                        for fmt in (['feed','story'] if p['visualStyle']=='jersey' else t['formats']):
                            with self.subTest(publication=t['id'],style=p['visualStyle'],format=fmt,kit=uniform):
                                r=render({'project':p},fmt,tmp,'preview',assets,partners)
                                self.assertTrue(r['files'])
                                for f,qa in zip(r['files'],r['checks']):
                                    self.assertFalse(qa['errors']);self.assertNotIn('<text',Path(f['svg']).read_text())
                                    self.assertEqual((f['width'],f['height']),(1080,1920) if fmt=='story' else (1080,1350) if fmt=='feed' else (1080,1080) if fmt=='square' else (1920,1080))
                                    if fmt=='story':
                                        for element in qa['text']:
                                            self.assertGreaterEqual(element['bounds'][1],260)
                                            self.assertLessEqual(element['bounds'][3],1848)
                                        footer=next(element for element in qa['text'] if element['text']=='PODGLĄD ROBOCZY')
                                        self.assertGreater(footer['bounds'][1],1600)

                                if fmt=='feed' and uniform=='A':geometries.append(Path(r['files'][0]['svg']).read_text())
                with self.subTest(publication=t['id'],distinct_styles=True):
                    self.assertEqual(len({json.dumps(g) for g in geometries}),len(t['styles']),'Available compositions must differ')
    def test_long_lists_paginate_without_omitting_rows(self):
        t=next(t for t in self.catalog if t['id']=='standings')
        p=t['projects'][0];p['content']['tableRows']=[{'label':'Drużyna '+str(i),'value':str(i),'detail':'8 M · 4 W · 4 P'} for i in range(40)]
        with tempfile.TemporaryDirectory() as tmp:
            r=render({'project':p},'feed',tmp,'preview',{},[])
            self.assertGreater(len(r['files']),1)
            texts=[b['text'] for qa in r['checks'] for b in qa['text']]
            # Paper cards print row labels in capitals (reference publication 18.10.2026).
            for i in range(40):self.assertIn(('Drużyna '+str(i)).upper(),texts)
    def test_poster_and_paper_cards_follow_the_reference(self):
        # Reference publication 18.10.2026: score and numbers are never cut, comparison rows show both teams.
        poster=next(t for t in self.catalog if t['id']=='final')['projects'][2]
        self.assertEqual(poster['visualStyle'],'poster')
        poster['content'].update(scoreUs=56,scoreThem=54,venue='KOSiR Koszalin')
        team=next(t for t in self.catalog if t['id']=='team-stats')['projects'][0]
        team['content'].update(columns=['BKPK','GMVT'],tableRows=[{'label':'Zbiórki w ataku','value':'22','value2':'9','detail':'14 pkt drugiej szansy','unit':'','number':''},{'label':'Przechwyty','value':'13','value2':'6','detail':'','unit':'','number':''}])
        leaders=next(t for t in self.catalog if t['id']=='leaders')['projects'][0]
        leaders['content'].update(tableRows=[{'label':'Filip Karpiński','value':'20','unit':'PKT','detail':'7 zbiórek','number':'69','value2':''}])
        with tempfile.TemporaryDirectory() as tmp:
            for fmt in ['feed','story','landscape']:
                with self.subTest(format=fmt):
                    r=render({'project':poster},fmt,tmp,'preview',{},[])
                    texts=[b['text'] for b in r['checks'][0]['text']]
                    self.assertFalse(r['checks'][0]['errors'])
                    for value in ['WYGRANA','56:54','12:0','KOSiR KOSZALIN']:self.assertIn(value,texts)
            r=render({'project':team},'feed',tmp,'preview',{},[])
            texts=[b['text'] for b in r['checks'][0]['text']]
            for value in ['BKPK','GMVT','ZBIÓRKI W ATAKU','22','9','13','6']:self.assertIn(value,texts)
            r=render({'project':leaders},'feed',tmp,'preview',{},[])
            texts=[b['text'] for b in r['checks'][0]['text']]
            for value in ['FILIP KARPIŃSKI','20','PKT','NR','69']:self.assertIn(value,texts)
    def test_entry_information_remains_readable_in_compact_formats(self):
        p=next(t for t in self.catalog if t['id']=='preview')['projects'][0]
        p['content']['entryInfo']='WSTĘP WOLNY'
        with tempfile.TemporaryDirectory() as tmp:
            for fmt in ['square','landscape','feed','story']:
                r=render({'project':p},fmt,tmp,'export',{},[])
                self.assertFalse(r['checks'][0]['errors'])
                self.assertIn('WSTĘP WOLNY',[b['text'] for b in r['checks'][0]['text']])
    def test_overflow_blocks_export(self):
        p=next(t for t in self.catalog if t['id']=='club-statement')['projects'][0]
        p['content']['body']='BARDZODŁUGIEWYRAŻENIE'*150
        with tempfile.TemporaryDirectory() as tmp,self.assertRaises(LayoutError):render({'project':p},'feed',tmp,'export',{},[])

    def test_missing_time_fits_native_announcement_panels(self):
        with tempfile.TemporaryDirectory() as tmp:
            for purpose in ['preview','matchday','postponed','cancelled']:
                p=next(t for t in self.catalog if t['id']==purpose)['projects'][0]
                p['content'].update(date='',originalDate='',opponent='',opponentShort='')
                for uniform in ['A','B']:
                    p['content']['kit']=uniform
                    for fmt in ['feed','story','square','landscape']:
                        with self.subTest(purpose=purpose,kit=uniform,format=fmt):
                            r=render({'project':p},fmt,tmp,'preview',{},[])
                            self.assertFalse(r['checks'][0]['errors'])
                            self.assertIn('ODWOŁANY' if purpose=='cancelled' else 'GODZINA TBC',[b['text'] for b in r['checks'][0]['text']])

    def test_result_omits_next_match_even_when_saved_in_project(self):
        p=next(t for t in self.catalog if t['id']=='final')['projects'][0]
        p['content']['nextMatch']='Następny mecz: KS DRAWSKO · 16:00'
        with tempfile.TemporaryDirectory() as tmp:
            for fmt in ['feed','story','square','landscape']:
                r=render({'project':p},fmt,tmp,'preview',{},[])
                self.assertNotIn('50-dalej',Path(r['files'][0]['svg']).read_text())
                self.assertNotIn(p['content']['nextMatch'],[b['text'] for b in r['checks'][0]['text']])

    def test_result_preview_with_empty_form_and_partial_scores(self):
        from copy import deepcopy
        empty=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newPostProject} from './studio/contracts.js'; console.log(JSON.stringify(newPostProject('final')))"],cwd=ROOT,text=True))
        with tempfile.TemporaryDirectory() as tmp:
            for purpose in ['final','halftime','live']:
                t=next(t for t in self.catalog if t['id']==purpose)
                for style in t['styles']:
                    for uniform in ['A','B']:
                        for scores in [(None,None),(86,None),(None,20),(86,20)]:
                            p=deepcopy(empty);p.update(postType=purpose,variant=t['variant'],visualStyle=style)
                            p['content'].update(kit=uniform,scoreUs=scores[0],scoreThem=scores[1])
                            for fmt in t['formats']:
                                with self.subTest(purpose=purpose,style=style,kit=uniform,scores=scores,format=fmt):
                                    r=render({'project':p},fmt,tmp,'preview',{},[])
                                    self.assertFalse(r['checks'][0]['errors'])
                                    self.assertTrue(r['files'])

    def test_story_uses_bottom_margin_instead_of_320px_ui_reservation(self):
        p=next(t for t in self.catalog if t['id']=='final')['projects'][0]
        with tempfile.TemporaryDirectory() as tmp:
            r=render({'project':p},'story',tmp,'preview',{},[])
            self.assertEqual((r['files'][0]['width'],r['files'][0]['height']),(1080,1920))
            self.assertFalse(r['checks'][0]['errors'])
            footer=next(b for b in r['checks'][0]['text'] if b['text']=='PODGLĄD ROBOCZY')
            self.assertGreater(footer['bounds'][1],1600)
            self.assertLessEqual(footer['bounds'][3],1848)
