import unittest
from collections import Counter
from harmonie_reservations import ROOT,INPUTS,CAUSES,build,load,encoded

class ReservationTests(unittest.TestCase):
    def test_partition_and_source_integrity(self):
        before={n:(ROOT/n).read_bytes() for n in INPUTS}
        args=load();data,report=build(*args)
        expected={u['reviewUnitId'] for u in args[2]['units'] if u['documentReview']['status']=='needs_review' and u['documentReview']['sources']}
        self.assertEqual(Counter(r['reviewUnitId'] for r in data['reservations']),Counter({i:1 for i in expected}))
        self.assertEqual(len(expected),287)
        self.assertEqual(sum(report['byCause'].values()),287)
        self.assertEqual(report['potentiallyResolvableWithoutPdf']+report['newDocumentaryEvidenceRequired'],287)
        verified={u['reviewUnitId'] for u in args[1]['guarantees']}
        self.assertFalse(verified & expected)
        self.assertEqual(len(verified),17)
        for row in data['reservations']:
            self.assertIn(row['cause'],CAUSES)
            if row['potentiallyResolvableWithoutPdf']:
                self.assertTrue(row['allOccurrencesReviewed'] and row['technicalCorrectionPossible'] and row['recordedEvidence'])
        self.assertEqual(before,{n:(ROOT/n).read_bytes() for n in INPUTS})

    def test_deterministic_outputs(self):
        first=build(*load());second=build(*load())
        for name,a,b in zip(('review-reservations-analysis.json','review-reservations-report.json'),first,second):
            self.assertEqual(encoded(a),encoded(b))
            self.assertEqual(encoded(a).encode(),(ROOT/name).read_bytes())
        self.assertEqual(first[1]['newVerified'],0)

if __name__=='__main__':unittest.main()
