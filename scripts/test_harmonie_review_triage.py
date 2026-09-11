import copy
import unittest
from collections import Counter
from harmonie_review_triage import ROOT,INPUTS,CLASSES,build,load,encode


class TriageTests(unittest.TestCase):
    def test_coverage_and_determinism(self):
        before={n:(ROOT/n).read_bytes() for n in INPUTS}
        args=load(); result,report=build(*args)
        second=build(*args)
        for name,value,again in zip(('review-triage.json','review-triage-report.json'),(result,report),second):
            self.assertEqual(encode(value),encode(again))
            self.assertEqual(encode(value).encode(),(ROOT/name).read_bytes())
        original={u['reviewUnitId']:u for u in args[0]['units']}
        self.assertEqual(Counter(u['reviewUnitId'] for u in result['units']),Counter({i:1 for i in original}))
        self.assertEqual(report['total'],992)
        for u in result['units']:
            source=original[u['reviewUnitId']]
            self.assertIn(u['triageClass'],CLASSES)
            for f in ('sources','references','candidateIds','occurrenceCount'):self.assertEqual(u[f],source[f])
            self.assertEqual(len({r[:3] for r in u['references']}),1)
            self.assertTrue(u['semanticKey']['family'].startswith('particuliers'))
            for rule in u['observedRules']:
                peer=original[rule['reviewUnitId']]
                self.assertEqual(peer['normalizedSignature']['referenceSeries'],u['semanticKey']['referenceSeries'])
                self.assertEqual(peer['normalizedSignature']['family'],u['semanticKey']['family'])
            own={(s['sourceFile'],s['sourcePage'],s['sourceSha256']) for s in u['sources']}
            chosen={(s['sourceFile'],s['sourcePage'],s['sourceSha256']) for s in u['recommendedEvidence']}
            self.assertTrue(own & chosen)
            self.assertTrue(1<=len(chosen)<=2)
            for evidence in u['recommendedEvidence']:
                self.assertTrue(any(all(s[k]==v for k,v in evidence.items()) for peer in u['observedRules'] for s in original[peer['reviewUnitId']]['sources']))
            if u['triageClass']=='strong_consensus_candidate':
                self.assertGreater(len(u['references']),1)
                self.assertEqual(len({p['sourceFile'] for p in u['recommendedEvidence']}),2)
            if u['triageClass']=='singleton_direct_check':self.assertEqual(u['occurrenceCount'],1)
        self.assertEqual(report['verified'],0)
        self.assertEqual(report['notExtractedExcluded'],560)
        self.assertEqual(report['singletonUnits'],297)
        self.assertEqual(report['uniqueRecommendedPages'],len(report['pageCoverage']))
        self.assertEqual(before,{n:(ROOT/n).read_bytes() for n in INPUTS})

    def test_rejects_broken_provenance(self):
        args=load();args[0]['units'][0]['sources'][0]['sourcePage']=999
        with self.assertRaises(AssertionError):build(*args)

    def test_rejects_verified(self):
        args=load();args[2]['guarantees'][0]['status']='verified'
        with self.assertRaises(AssertionError):build(*args)


if __name__=='__main__':unittest.main()
