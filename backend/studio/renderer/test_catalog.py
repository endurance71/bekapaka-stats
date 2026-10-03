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
                    for fmt in t['formats']:
                        with self.subTest(publication=t['id'],style=p['visualStyle'],format=fmt):
                            r=render({'project':p},fmt,tmp,'preview',assets,partners)
                            self.assertTrue(r['files'])
                            for f,qa in zip(r['files'],r['checks']):
                                self.assertFalse(qa['errors']);self.assertNotIn('<text',Path(f['svg']).read_text())
                                self.assertEqual((f['width'],f['height']),(1080,1920) if fmt=='story' else (1080,1350) if fmt=='feed' else (1080,1080) if fmt=='square' else (1920,1080))
                            if fmt=='feed':geometries.append([(b['text'],b['x'],b['bounds']) for b in r['checks'][0]['text']])
                with self.subTest(publication=t['id'],distinct_styles=True):
                    self.assertEqual(len({json.dumps(g) for g in geometries}),3,'Every style must change geometry')
    def test_long_lists_paginate_without_omitting_rows(self):
        t=next(t for t in self.catalog if t['id']=='standings')
        p=t['projects'][2];p['content']['tableRows']=[{'label':'Drużyna '+str(i),'value':str(i),'detail':'8 M · 4 W · 4 P'} for i in range(40)]
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
