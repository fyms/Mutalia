import json
import unittest
from harmonie_application_catalog import DATA,OUTPUT,build

class CatalogTests(unittest.TestCase):
    def test_reproducibility_and_partition(self):
        names=('extraction-candidates.json','verified-guarantees.json')
        before={n:(DATA/n).read_bytes() for n in names}
        data=build()
        self.assertEqual(data,build())
        self.assertEqual(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',OUTPUT.read_text())
        source=json.loads(before['extraction-candidates.json'])['guarantees']
        self.assertEqual(len(data['entries'])+data['excludedSynthesisRecords'],len(source))
        self.assertEqual(sum(e['status']=='not_extracted' for e in data['entries'])+data['excludedSynthesisRecords'],560)
        for e in data['entries']:
            if e['status']!='verified':self.assertFalse({'value','unit','calculationMode','verifiedBy'} & e.keys())
        self.assertEqual(before,{n:(DATA/n).read_bytes() for n in names})

if __name__=='__main__':unittest.main()
