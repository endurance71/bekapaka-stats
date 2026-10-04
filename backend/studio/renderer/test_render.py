import unittest, tempfile, json
from pathlib import Path
from render import render, date_parts, LayoutError
ROOT=Path(__file__).resolve().parents[1]
class RendererTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import subprocess
        cls.templates=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {templates,newProject} from './contracts.js'; console.log(JSON.stringify(templates.map(t=>({...t,project:newProject(t.id)}))))"],cwd=ROOT,text=True))
    def project(self,t):
        p=json.loads(json.dumps(t['project'])); p['content'].update(opponent='Koszalin Basketball',opponentShort='KBS',date='2026-10-11T14:30:00+02:00',title='PUCHAR BOBOLIC',body='Gramy razem. Widzimy się na parkiecie.',scoreUs=108,scoreThem=97,edition=3,teams=8,days=1,firstName='Paweł',lastName='Żółkiewicz',number='24',position='Rozgrywający')
        p['content']['lineup']=[dict(id=str(i),firstName='Paweł',lastName='Żółkiewicz',number=str(i+1),position='PG') for i in range(6)]
        p['content']['schedule']=[dict(date='2026-10-11T14:30:00+02:00',opponent='Koszalin Basketball',round=str(i+1)) for i in range(8)]
        p['content']['slides']=[dict(title='GRAMY RAZEM',body='Energia zespołu na parkiecie.',assetId=None) for i in range(4)]
        return p
    def test_every_family_variant_and_native_format(self):
        for t in self.templates:
            for variant in t['variants']:
                for fmt in t['formats']:
                    with self.subTest(family=t['id'],variant=variant,format=fmt),tempfile.TemporaryDirectory() as tmp:
                        p=self.project(t);p['variant']=variant
                        if t['id']=='player': p['layout']='type'
                        result=render({'project':p},fmt,tmp,'preview',{},[])
                        self.assertTrue(result['files'])
                        for f,qa in zip(result['files'],result['checks']):
                            self.assertFalse(qa['errors']);self.assertNotIn('<text',Path(f['svg']).read_text())
                            if fmt=='story':
                                for text in qa['text']:
                                    self.assertGreaterEqual(text['bounds'][1],260);self.assertLessEqual(text['bounds'][3],1848 if p.get('designVersion')=='3.0.0' else 1600)
    def test_alternate_compositions_kit_b_and_photo_crop(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as tmp:
            photo=Path(tmp)/'photo.png'; Image.new('RGBA',(600,900),(240,180,80,255)).save(photo)
            assets={'photo':dict(path=str(photo),width=600,height=900)}
            for family in ('announcement','result','player'):
                t=next(t for t in self.templates if t['id']==family)
                for fmt in t['formats']:
                    with self.subTest(family=family,format=fmt):
                        p=self.project(t);p['layout']=t['layouts'][-1];p['content']['kit']='B';p['content']['photoAssetId']='photo';p['content']['crop']=dict(x=.2,y=.8,zoom=1.7)
                        if family=='player': p['content']['statistics']=[dict(label='PTS',value=24),dict(label='REB',value=8),dict(label='AST',value=4)]
                        r=render({'project':p},fmt,tmp,'preview',assets,[]);self.assertFalse(r['checks'][0]['errors'])
    def test_pagination_and_dates(self):
        self.assertEqual(date_parts('2026-10-11T22:30:00Z')[0],'PONIEDZIAŁEK · 12.10.2026')
        p=self.project(next(t for t in self.templates if t['id']=='schedule'))
        with tempfile.TemporaryDirectory() as tmp:
            r=render({'project':p},'square',tmp,'preview',{},[]);self.assertEqual(len(r['files']),3)
    def test_venue_is_large_and_has_feathered_shadow_in_every_format(self):
        import xml.etree.ElementTree as ET
        for family in ('announcement','result','tournament'):
            t=next(t for t in self.templates if t['id']==family)
            for fmt in t['formats']:
                with self.subTest(family=family,format=fmt),tempfile.TemporaryDirectory() as tmp:
                    p=self.project(t)
                    r=render({'project':p},fmt,tmp,'preview',{},[])
                    venue=next(b for b in r['checks'][0]['text'] if b['text']==p['content']['venue'])
                    self.assertEqual(venue['size'],40)
                    root=ET.parse(r['files'][0]['svg']).getroot()
                    self.assertFalse(any(e.get('id')=='venue-backing' for e in root.iter()))
                    shadow=next(e for e in root.iter() if e.get('id')=='venue-shadow')
                    self.assertEqual(shadow.get('fill'),'url(#venue-shade)')
                    gradient=next(e for e in root.iter() if e.get('id')=='venue-shade')
                    self.assertEqual(list(gradient)[-1].get('stop-opacity'),'0')
                    glyphs=next(e for e in root.iter() if e.get('aria-label')==p['content']['venue'])
                    self.assertEqual(glyphs.get('filter'),'url(#venue-contrast)')
                    self.assertFalse(r['checks'][0]['errors'])
    def test_story_announcement_reflows_teams_and_keeps_confirmed_date_clear(self):
        p=self.project(next(t for t in self.templates if t['id']=='announcement'))
        with tempfile.TemporaryDirectory() as tmp:
            feed=render({'project':p},'feed',tmp,'preview',{},[])['checks'][0]
            story=render({'project':p},'story',tmp,'preview',{},[])['checks'][0]
            a=next(b for b in feed['text'] if b['text']=='BEKAPAKA')
            b=next(b for b in story['text'] if b['text']=='BEKAPAKA')
            self.assertEqual(a['x'],b['x'])
            self.assertLess(b['x'],540)
            self.assertGreater(b['size'],a['size'])
            self.assertGreater(story['crest'][-1][3]-story['crest'][-1][1],feed['crest'][-1][3]-feed['crest'][-1][1])
            p['variant']='postponed';p['content']['originalDate']='2026-10-04T12:00:00+02:00'
            updated=render({'project':p},'story',tmp,'preview',{},[])['checks'][0]
            self.assertFalse(updated['errors'])
    def test_long_text_is_blocked_instead_of_tiny_type(self):
        p=self.project(self.templates[0]);p['content']['opponent']='BARDZODŁUGANAZWADRUŻYNY'*8;p['layout']='type'
        with tempfile.TemporaryDirectory() as tmp,self.assertRaises(LayoutError):render({'project':p},'feed',tmp,'preview',{},[])
    def test_partner_optical_fields_and_alphabetical_pagination(self):
        p=self.project(next(t for t in self.templates if t['id']=='partners'))
        partners=[dict(id=str(i),name='Partner '+str(i)) for i in range(11)]
        p['content']['partnerIds']=[str(i) for i in range(11)]
        with tempfile.TemporaryDirectory() as tmp:
            r=render({'project':p},'feed',tmp,'preview',{},partners);self.assertEqual(len(r['files']),2)
if __name__=='__main__':unittest.main()
