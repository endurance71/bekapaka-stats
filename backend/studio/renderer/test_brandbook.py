import json,tempfile,subprocess,unittest,hashlib
from pathlib import Path
from unittest.mock import patch
import render,render_v3
from reference_result import reference
ROOT=Path(__file__).resolve().parents[2]
class BrandbookTests(unittest.TestCase):
    def project(self,us=71,them=65):
        p=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newPostProject} from './studio/contracts.js'; console.log(JSON.stringify(newPostProject('final')))"],cwd=ROOT,text=True))
        p['content'].update(kit='B',kitBConfirmed=True,scoreUs=us,scoreThem=them,opponent='KS DRAWSKO',opponentShort='DRA',date='2026-10-20T17:00:00+02:00',venue='KOSiR Koszalin',nextMatch='Następny mecz: 26.10 · KS DRAWSKO · 16:00')
        return p
    def layers(self,p):return {n.get('id'):n for n in p.root if n.get('id')}
    def actual(self,p,tmp):
        captured=[]; original=render.Poster
        def poster(*args,**kwargs):v=original(*args,**kwargs);captured.append(v);return v
        with patch.object(render,'Poster',poster):render.render({'project':p},'feed',tmp,'preview',{},[])
        return captured[0]
    def signature(self,n):
        def attrs(c):
            return {k:format(float(v),'g') if k in ('x','y','width','height') else v for k,v in c.attrib.items()}
        return [(c.tag.split('}')[-1],attrs(c)) for c in n]
    def test_score_and_crest_geometry_match_frozen_brand_reference(self):
        with tempfile.TemporaryDirectory() as tmp:
            for us,them in [(71,65),(86,20),(65,71)]:
                with self.subTest(score=(us,them)):
                    p=self.project(us,them);expected=self.layers(reference(p,tmp));actual=self.layers(self.actual(p,tmp))
                    for key in ['30-znaki','40-wynik']:
                        # Source labels follow the score in this layer; outlined paths are exact.
                        expected_paths=[a for a in self.signature(expected[key]) if a[0]=='path']
                        actual_paths=[a for a in self.signature(actual[key]) if a[0]=='path']
                        self.assertEqual(actual_paths,expected_paths)
                    self.assertEqual(self.signature(actual['20-wstega'])[:5],self.signature(expected['20-wstega'])[:5])
    def test_frozen_reference_functions_cannot_change_unnoticed(self):
        manifest=json.loads((Path(__file__).parent/'references/sources.json').read_text())
        for key,value in manifest.items():
            self.assertEqual(hashlib.sha256((Path(__file__).parent/f'references/{key}.py').read_bytes()).hexdigest(),value['functionsSha256'])
    def test_missing_ribbon_mutation_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            expected=self.signature(self.layers(reference(self.project(),tmp))['20-wstega'])[:5]
            with patch.object(render_v3,'ribbon',lambda *a,**k:None):actual=self.signature(self.layers(self.actual(self.project(),tmp))['20-wstega'])[:5]
            self.assertNotEqual(expected,actual)
    def test_kit_b_rival_and_outline_mutations_are_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=self.project();expected=self.signature(self.layers(reference(p,tmp))['30-znaki'])
            with patch.object(render_v3,'rival',lambda p,cx,cy,h:render.M.rival_c(p,cx,cy,h,p.data['opponentShort'])):
                actual=self.signature(self.layers(self.actual(p,tmp))['30-znaki'])
            self.assertNotEqual(expected,actual)
            expected_score=self.signature(self.layers(reference(p,tmp))['40-wynik'])
            with patch.object(render.M,'outline',lambda p,s,x,y,size,color,**k:render.M.solid(p,s,x,y,size,color,anchor=k.get('anchor','start'))):
                actual=self.signature(self.layers(self.actual(p,tmp))['40-wynik'])
            self.assertNotEqual(actual,expected_score)
    def test_historical_renderer_is_selected_by_revision_version(self):
        p=self.project();p['designVersion']='2.0.0'
        with tempfile.TemporaryDirectory() as tmp,patch.object(render_v3,'compose',side_effect=AssertionError('Historical revision must not use v3')):
            render.render({'project':p},'feed',tmp,'preview',{},[])
