import copy
import unittest
from collections import Counter
from harmonie_review_units import ROOT, INPUTS, load, build, encoded, normalize, signature


class ReviewUnitsTests(unittest.TestCase):
    def test_coverage_provenance_and_reproducibility(self):
        before = {n:(ROOT/n).read_bytes() for n in INPUTS}
        data, audit, reliability = load()
        units, report = build(data,audit,reliability)
        second = build(data,audit,reliability)
        for name, result, repeated in zip(('review-units.json','review-reduction-report.json'),(units,report),second):
            self.assertEqual(encoded(result), encoded(repeated))
            self.assertEqual(encoded(result).encode(), (ROOT/name).read_bytes())
        expected = {r['id']:r for r in data['guarantees'] if r['status']=='needs_review'}
        ids = [i for u in units['units'] for i in u['candidateIds']]
        self.assertEqual(Counter(ids), Counter({i:1 for i in expected}))
        self.assertEqual(len(expected),3420)
        for unit in units['units']:
            self.assertEqual(unit['occurrenceCount'],len(unit['candidateIds']))
            self.assertEqual({s['id'] for s in unit['sources']},set(unit['candidateIds']))
            self.assertEqual(len({r[:3] for r in unit['references']}),1)
            self.assertTrue(all(f.startswith('Particuliers') for f in unit['families']))
            for source in unit['sources']:
                row = expected[source['id']]
                self.assertEqual(unit['normalizedSignature'],signature(row))
                self.assertEqual(source,{k:row[k] for k in source})
        excluded = {r['id'] for r in data['guarantees'] if r['status']=='not_extracted'}
        self.assertEqual({r['id'] for r in units['notExtracted']['occurrences']},excluded)
        self.assertEqual(len(excluded),560)
        self.assertFalse(excluded.intersection(ids))
        self.assertEqual(report['verified'],0)
        self.assertEqual(before,{n:(ROOT/n).read_bytes() for n in INPUTS})

    def test_normalization_preserves_meaning(self):
        self.assertEqual(normalize('  FRAIS  réels\n '),'frais réels')
        for a,b in [('10,5','105'),('10%','10'),('€/an','€ an'),('(1)','1')]:
            self.assertNotEqual(normalize(a),normalize(b))
        self.assertIsNone(normalize(None))
        self.assertEqual(normalize(10),10)

    def test_series_and_non_contractual_exclusions(self):
        row = copy.deepcopy(load()[0]['guarantees'][0])
        a=signature(row)
        row['reference']='PLI113'
        self.assertNotEqual(a,signature(row))
        for ref,family in [('IDCC 405','CCN'),('SYNTHESE-PARTICULIERS-2026','Particuliers')]:
            row.update(reference=ref,family=family)
            with self.assertRaises(ValueError): signature(row)

    def test_conflicts_stay_separate(self):
        data,audit,reliability=load()
        a=copy.deepcopy(data['guarantees'][0]); b=copy.deepcopy(a)
        b.update(id='test-distinct-id',value=123)
        data['guarantees']=[a,b]
        audit.update(needs_review=2,not_extracted=0)
        reliability.update(humanReviewRows=2,unresolvedExtractionRows=0)
        units,report=build(data,audit,reliability)
        self.assertEqual(report['reviewUnits'],2)
        self.assertEqual(report['structuralConflictUnits'],2)
        self.assertTrue(all(len(u['conflictUnitIds'])==1 for u in units['units']))
        b['value']=a['value']
        self.assertEqual(build(data,audit,reliability)[1]['reviewUnits'],1)

    def test_rejects_invalid_sources(self):
        for field,value in [('status','verified'),('sourcePage',0),('sourceSha256','incorrect')]:
            data,audit,reliability=load()
            data['guarantees'][0][field]=value
            with self.assertRaises(ValueError): build(data,audit,reliability)


if __name__ == '__main__':
    unittest.main()
