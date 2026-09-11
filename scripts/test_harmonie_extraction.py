import copy
import json
import subprocess
import unittest
from unittest.mock import patch

from extract_harmonie import OUTPUT, REPO, ROOT, SAMPLE, extract, parse_value
from harmonie_manifest import digest


class ExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(OUTPUT.read_text())

    def schema(self, data):
        return subprocess.run(['node', str(REPO / 'scripts/validate_harmonie_extraction.cjs')],
                              input=json.dumps(data), text=True, capture_output=True).returncode

    def test_schema_and_provenance(self):
        self.assertEqual(self.schema(self.data), 0)
        for doc in self.data['documents']:
            self.assertEqual(digest(ROOT / doc['sourceFile']), doc['sha256'])

    def test_invalid_records_rejected(self):
        for field, value in [('status', 'indexed'), ('sourcePage', 0), ('sourcePage', 99),
                             ('family', 'CCN'), ('reference', 'PSI999'), ('status', 'verified')]:
            data = copy.deepcopy(self.data)
            data['guarantees'][0][field] = value
            self.assertNotEqual(self.schema(data), 0, (field, value))

    def test_four_samples_separate(self):
        manifest = {s['reference']: s for s in json.loads((ROOT / 'manifest.json').read_text())['sources']}
        self.assertEqual([d['reference'] for d in self.data['documents']], SAMPLE)
        for ref in SAMPLE[:4]:
            rows = [r for r in self.data['guarantees'] if r['reference'] == ref]
            self.assertTrue(any(r['rawValue'] for r in rows))
            for row in rows:
                self.assertEqual((row['family'], row['regime'], row['sourceFile']),
                                 tuple(manifest[ref][k] for k in ('family', 'regime', 'file')))
                if row['rawValue']:
                    self.assertTrue(3 <= row['sourcePage'] <= 11)
                else:
                    self.assertEqual(row['status'], 'not_extracted')
                self.assertNotEqual(row['status'], 'verified')

    def test_ambiguous_values(self):
        for raw in ['6700%% 4300%% 50%', '90% 10% 50%', '60%40% ou100%', '40€/Séance 5 séances/An']:
            parsed = parse_value(raw)
            self.assertEqual(parsed['status'], 'needs_review')
            self.assertIsNone(parsed['value'])
        self.assertEqual(parse_value('200€/An')['value'], 200)
        self.assertEqual(parse_value('200€/An')['status'], 'needs_review')
        self.assertEqual(parse_value('')['status'], 'not_extracted')

    def test_synthesis_does_not_map_codes(self):
        doc = self.data['documents'][-1]
        self.assertTrue(any('PSI' in r for r in doc['pages'][3]['observedReferences']))
        rows = [r for r in self.data['guarantees'] if r['reference'] == SAMPLE[-1]]
        self.assertTrue(all(r['value'] is None and r['status'] == 'not_extracted' for r in rows))

    def test_scope_guards(self):
        with patch('extract_harmonie.pdfplumber.open') as opened:
            for refs in [[], SAMPLE + ['extra'], ['unknown'], ['IDCC 405']]:
                with self.assertRaises(ValueError):
                    extract(references=refs)
            opened.assert_not_called()

    def test_reproducible_five_pdf_extraction(self):
        before = (ROOT / 'manifest.json').read_bytes()
        self.assertEqual(extract(), self.data)
        self.assertEqual((ROOT / 'manifest.json').read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
