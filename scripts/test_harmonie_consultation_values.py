import copy
import json
import unittest
from harmonie_consultation_values import build, ROOT, OUTPUT

class ConsultationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog=json.loads((ROOT/'src/lib/data/harmonie/individualCatalog2026.json').read_text())
        cls.candidates=json.loads((ROOT/'data/references/harmonie/2026/extraction-candidates.json').read_text())
        cls.rows=build(cls.catalog,cls.candidates)

    def test_reproducible_exact_candidates_and_unchanged_sources(self):
        before=json.dumps(self.candidates,sort_keys=True)
        self.assertEqual(self.rows,build(self.catalog,self.candidates))
        self.assertEqual(self.rows,json.loads(OUTPUT.read_text()))
        ids={c['id']:c for c in self.candidates['guarantees']}
        verified={e['id'] for e in self.catalog['entries'] if e['status']=='verified'}
        self.assertEqual(len(verified),17)
        for row in self.rows:
            source=ids[row['id']]
            self.assertNotIn(row['id'],verified)
            self.assertEqual(row['documentValue'],source['rawValue'].strip())
            for key in ('reference','sourceFile','sourcePage','sourceSha256','status'):
                self.assertEqual(row[key],source[key])
        self.assertEqual(before,json.dumps(self.candidates,sort_keys=True))

    def test_no_conflicts_or_cross_reference_page_file_hash_label_matches(self):
        target=self.rows[0]
        for key,value in [('reference','PLI321'),('reference','PSI999'),('sourcePage',999),('sourceFile','other.pdf'),('sourceSha256','0'*64),('benefit','Similar benefit')]:
            data=copy.deepcopy(self.candidates)
            next(c for c in data['guarantees'] if c['id']==target['id'])[key]=value
            self.assertNotIn(target['id'],{r['id'] for r in build(self.catalog,data)})
        data=copy.deepcopy(self.candidates)
        conflict=copy.deepcopy(next(c for c in data['guarantees'] if c['id']==target['id']))
        conflict.update(id='another-candidate',rawValue='999 €/An',value=999)
        data['guarantees'].append(conflict)
        self.assertNotIn(target['id'],{r['id'] for r in build(self.catalog,data)})

if __name__=='__main__':unittest.main()
