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
            for i in range(40):self.assertIn('Drużyna '+str(i),texts)
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

class OpponentLogoTests(unittest.TestCase):
    """Brand rule M8: the owner's opponent logo replaces the neutral shield on a legible plate."""
    @classmethod
    def setUpClass(cls):
        cls.catalog=json.loads(subprocess.check_output(['node','studio/catalog-fixtures.js'],cwd=ROOT,text=True))
    def logos(self,tmp):
        from PIL import ImageDraw
        flat=Image.new('RGB',(469,351),(140,180,230));ImageDraw.Draw(flat).ellipse((90,40,330,280),fill=(250,130,20));flat.save(Path(tmp)/'flat.jpg',quality=85)
        clear=Image.new('RGBA',(300,300),(0,0,0,0));ImageDraw.Draw(clear).rectangle((60,60,240,240),fill=(20,20,20,255));clear.save(Path(tmp)/'clear.png')
        tiny=Image.new('RGB',(40,30),(10,90,10));tiny.save(Path(tmp)/'tiny.png')
        assets={}
        for k,f in [('flat','flat.jpg'),('clear','clear.png'),('tiny','tiny.png')]:
            with Image.open(Path(tmp)/f) as im:assets[k]={'path':str(Path(tmp)/f),'width':im.width,'height':im.height}
        return assets
    def test_plate_takes_flat_background_or_white(self):
        from render_v3 import logo_ground
        with tempfile.TemporaryDirectory() as tmp:
            a=self.logos(tmp)
            with Image.open(a['flat']['path']) as im:fill,box=logo_ground(im.convert('RGBA'))
            self.assertLess(sum(abs(c-e) for c,e in zip(fill,(140,180,230))),12);self.assertLess(box[2]-box[0],300)
            with Image.open(a['clear']['path']) as im:self.assertEqual(logo_ground(im.convert('RGBA')),((255,255,255),(60,60,241,241)))
    def test_logo_replaces_shield_in_every_match_composition(self):
        from copy import deepcopy
        with tempfile.TemporaryDirectory() as tmp:
            assets=self.logos(tmp)
            for purpose in ['final','halftime','preview','postponed','cancelled']:
                t=next(t for t in self.catalog if t['id']==purpose);p=deepcopy(next(x for x in t['projects'] if x['visualStyle']=='sport'))
                for logo in ['flat','clear']:
                    for uniform in ['A','B']:
                        for fmt in t['formats']:
                            with self.subTest(purpose=purpose,logo=logo,kit=uniform,format=fmt):
                                p['content'].update(kit=uniform,opponentLogoAssetId=None)
                                plain=Path(render({'project':p},fmt,tmp,'preview',assets,[])['files'][0]['svg']).read_text().count('<image')
                                p['content']['opponentLogoAssetId']=logo
                                r=render({'project':p},fmt,tmp,'export',assets,[])
                                self.assertFalse(r['checks'][0]['errors'])
                                svg=Path(r['files'][0]['svg']).read_text()
                                self.assertEqual(svg.count('<image'),plain+1)
                                if logo=='clear':self.assertIn('fill="#FFFFFF"',svg)
    def test_missing_or_tiny_logo(self):
        p=next(t for t in self.catalog if t['id']=='final')['projects'][0]
        with tempfile.TemporaryDirectory() as tmp:
            assets=self.logos(tmp)
            p['content']['opponentLogoAssetId']='retired-or-unknown'
            self.assertTrue(render({'project':p},'feed',tmp,'preview',assets,[])['files'])
            p['content']['opponentLogoAssetId']='tiny'
            with self.assertRaisesRegex(LayoutError,'opponentLogoAssetId'):render({'project':p},'feed',tmp,'preview',assets,[])
