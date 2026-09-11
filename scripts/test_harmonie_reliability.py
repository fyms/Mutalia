import copy
import json
import unittest
from unittest.mock import patch
from extract_harmonie import ROOT, OUTPUT, pdfplumber
from extract_harmonie_corpus import encoded
from reliabilize_harmonie import TARGETS, baseline, refine, classify_group


class ReliabilityTests(unittest.TestCase):
    def test_duplicate_contexts(self):
        row = json.loads(OUTPUT.read_text())['guarantees'][0]
        other = copy.deepcopy(row)
        self.assertEqual(classify_group([row, other]), 'exact_duplicate_candidate')
        other['sourcePage'] += 1
        self.assertEqual(classify_group([row, other]), 'legitimate_repeat')
        self.assertEqual(classify_group([row, row, other]), 'ambiguous_duplicate')

    def test_reproduction_and_scope(self):
        original, audit = baseline()
        fixture = OUTPUT.read_bytes()
        opened = []
        actual_open = pdfplumber.open
        def track(path, *args, **kwargs):
            opened.append(path.stem)
            return actual_open(path, *args, **kwargs)
        with patch('extract_harmonie.pdfplumber.open', side_effect=track):
            data, final, summary = refine(original, audit)
        self.assertEqual(opened, list(TARGETS))
        for name, result in [('extraction-candidates.json', data), ('extraction-report.json', final), ('reliability-report.json', summary)]:
            self.assertEqual(encoded(result).encode(), OUTPUT.with_name(name).read_bytes())
        expected = {s['reference']:s for s in json.loads((ROOT/'manifest.json').read_text())['sources'] if s['family'].startswith('Particuliers')}
        self.assertEqual({d['reference'] for d in data['documents']}, set(expected))
        self.assertEqual(len(data['documents']), 43)
        for r in data['guarantees']:
            src = expected[r['reference']]
            self.assertEqual((r['family'],r['regime'],r['sourceFile'],r['sourceSha256']), tuple(src[k] for k in ('family','regime','file','sha256')))
            self.assertGreater(r['sourcePage'], 0)
            self.assertIn(r['status'], ('needs_review','not_extracted'))
        self.assertEqual(summary['verified'], 0)
        self.assertEqual(len(summary['originalDuplicateGroups']), 367)
        self.assertLess(summary['unrecognizedTargetPagesAfter'], summary['unrecognizedTargetPagesBefore'])
        self.assertTrue(all(v['after']>v['before'] for v in summary['recoveredRows'].values()))
        removed = {r['removedId'] for r in summary['removedExactRecords']}
        self.assertEqual([r for r in data['guarantees'] if r['reference'] not in TARGETS],
                         [r for r in original['guarantees'] if r['reference'] not in TARGETS and r['id'] not in removed])
        self.assertEqual(OUTPUT.read_bytes(), fixture)


if __name__ == '__main__':
    unittest.main()
