import copy
import unittest
from harmonie_document_review import ROOT,load,build,encoded,page


class DocumentReviewTests(unittest.TestCase):
    def test_determinism_and_provenance(self):
        args=load(); output=build(*args)
        self.assertEqual(output,build(*args))
        self.assertEqual(output,build(output[0],args[1],args[2]))
        for name,result in zip(('review-triage.json','verified-guarantees.json','document-review-report.json'),output):
            self.assertEqual(encoded(result).encode(),(ROOT/name).read_bytes())
        triage,verified,report=output
        self.assertEqual(len(report['pagesReviewed']),20)
        self.assertEqual(report['pageRanking'][:20],[{k:p[k] for k in ('sourceFile','sourcePage','sourceSha256','targetYield')} for p in report['pagesReviewed']])
        allowed={page(p) for p in report['pagesReviewed']}
        self.assertEqual(len(allowed),20)
        units={u['reviewUnitId']:u for u in triage['units']}
        self.assertEqual(len(units),992)
        for g in verified['guarantees']:
            u=units[g['reviewUnitId']]
            self.assertEqual(u['references'],[g['reference']])
            self.assertTrue(g['reference'].startswith(('PSI','PLI')))
            self.assertTrue(g['family'].startswith('particuliers'))
            self.assertEqual(g['sources'],u['sources'])
            self.assertTrue(all(page(s) in allowed for s in g['sources']))
            self.assertEqual(g['verifiedBy'],'document_review_2026')
            self.assertEqual(g['openDivergences'],[])
            self.assertTrue(g['condition'] and g['unit'])
        self.assertEqual(verified['verified'],17)
        self.assertEqual(report['remainingUnits'],975)

    def test_rejects_cross_reference_approval(self):
        args=load();g=args[2]['accepted'][0];g['reference']='PSI999'
        with self.assertRaises(AssertionError):build(*args)

    def test_rejects_page_substitution(self):
        args=load();args[2]['pages'][0]['sourcePage']+=1
        with self.assertRaises(AssertionError):build(*args)

    def test_rejects_unresolved_approval(self):
        args=load();args[2]['accepted'][0]['openDivergences']=['condition missing']
        with self.assertRaises(AssertionError):build(*args)


if __name__=='__main__':unittest.main()
