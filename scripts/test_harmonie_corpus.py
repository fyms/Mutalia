import json
import unittest
from extract_harmonie import ROOT, OUTPUT, validate
from extract_harmonie_corpus import build, report, encoded


class CorpusTests(unittest.TestCase):
    def test_full_corpus_and_reproduction(self):
        fixture = OUTPUT.read_bytes()
        manifest_bytes = (ROOT / 'manifest.json').read_bytes()
        data = json.loads(OUTPUT.with_name('extraction-candidates.json').read_text())
        expected = {s['file']: s for s in json.loads(manifest_bytes)['sources'] if s['family'].startswith('Particuliers')}
        self.assertEqual(len(data['documents']), 43)
        self.assertEqual({d['sourceFile'] for d in data['documents']}, set(expected))
        for row in data['guarantees']:
            source = expected[row['sourceFile']]
            for key in ('reference', 'family', 'regime'):
                self.assertEqual(row[key], source[key])
            self.assertGreaterEqual(row['sourcePage'], 1)
            self.assertEqual(row['sourceSha256'], source['sha256'])
            self.assertIn(row['status'], ('needs_review', 'not_extracted'))
        validate(data)
        self.assertEqual(report(data), json.loads(OUTPUT.with_name('extraction-report.json').read_text()))
        # Second real batch, same source files: compare every field including provenance and raw text.
        second = build()
        self.assertEqual(encoded(second).encode(), OUTPUT.with_name('extraction-candidates.json').read_bytes())
        self.assertEqual(encoded(report(second)).encode(), OUTPUT.with_name('extraction-report.json').read_bytes())
        self.assertEqual(OUTPUT.read_bytes(), fixture)
        self.assertEqual((ROOT / 'manifest.json').read_bytes(), manifest_bytes)


if __name__ == '__main__':
    unittest.main()
