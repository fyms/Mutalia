import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import unicodedata
from harmonie_manifest import classify, generate, run, ROOT


class ManifestTests(unittest.TestCase):
    def test_repository_inventory_and_legacy(self):
        with contextlib.redirect_stdout(io.StringIO()):
            manifest = run(ROOT, True)
        self.assertEqual(manifest['pdfCount'], 45)
        self.assertEqual(len([s for s in manifest['sources'] if s['family'] != 'CCN']), 43)
        for code in ('405', '2691'):
            self.assertEqual(manifest[code]['reference'], 'IDCC ' + code)
            self.assertEqual(manifest[code]['status'], 'partially_transcribed')
        for s in manifest['sources']:
            self.assertEqual(s['sha256'], hashlib.sha256((ROOT / s['file']).read_bytes()).hexdigest())
            if s['family'] != 'CCN':
                self.assertEqual(s['status'], 'indexed_not_transcribed')

    def test_unicode_and_no_equivalence(self):
        for path in ['Régime général/PSI111.pdf', 'Régime Local/PLI211.pdf', 'Réflexe eco - Pharmacie/PSI114.pdf', 'Réflexe eco - Pharmacie et chambre particulière/PSI113.pdf']:
            self.assertEqual(classify(path), classify(unicodedata.normalize('NFD', path)))
        for path in ['Régime général/PLI111.pdf', 'Régime Local/PSI211.pdf', 'Réflexe eco - Pharmacie/PSI113.pdf', 'inconnu.pdf']:
            with self.assertRaises(ValueError):
                classify(path)

    def test_reproducible_missing_hash_and_duplicate(self):
        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temp)
            folder = root / 'Régime général'
            folder.mkdir()
            file = folder / 'PSI111.pdf'
            file.write_bytes(b'opaque PDF fixture, not parsed')
            run(root)
            original = (root / 'manifest.json').read_bytes()
            run(root)
            self.assertEqual(original, (root / 'manifest.json').read_bytes())
            run(root, True)
            file.write_bytes(b'changed')
            with self.assertRaises(ValueError):
                run(root, True)
            file.unlink()
            with self.assertRaisesRegex(ValueError, 'manquants'):
                run(root)
            file.write_bytes(b'PDF')
            (folder / 'PSI121.pdf').write_bytes(b'PDF')
            with patch('harmonie_manifest.classify', return_value=('Particuliers', 'Régime général', 'PSI111')):
                with self.assertRaisesRegex(ValueError, 'Doublon'):
                    generate(root, {})

    def test_reject_empty_and_tampered_metadata(self):
        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temp)
            folder = root / 'Régime général'
            folder.mkdir()
            file = folder / 'PSI111.pdf'
            file.touch()
            with self.assertRaisesRegex(ValueError, 'vide'):
                generate(root, {})
            file.write_bytes(b'PDF')
            result = run(root)
            result['sources'][0]['regime'] = 'Régime local'
            (root / 'manifest.json').write_text(json.dumps(result))
            with self.assertRaises(ValueError):
                run(root, True)


if __name__ == '__main__':
    unittest.main()
