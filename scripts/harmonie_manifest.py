#!/usr/bin/env python3
"""Indexation des noms/métadonnées uniquement. Aucun décodage PDF.
Usage : python3 scripts/harmonie_manifest.py [--check] [--root DOSSIER]
Les classifications sont déduites du chemin, sans équivalence PSI/PLI.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1] / 'data/sources/harmonie/2026'
CCN = {'CCN 65 TG-TC 2026 v2.pdf': '405', 'Tableau_garantie_CCN_EPI.pdf': '2691'}
SYNTHESIS = 'SYNTHESE-GARANTIES-PROTECTION-SANTE-PARTICULIERS-DEC-2026_VF.pdf'
FOLDERS = {
    'Régime général': ('Particuliers', 'Régime général', r'PSI[1-5][1-3]1'),
    'Régime Local': ('Particuliers', 'Régime local', r'PLI[1-5][1-3]1'),
    'Réflexe eco - Pharmacie': ('Particuliers — Réflexe eco Pharmacie', 'Non déterminé par le dossier', r'PSI[1-5][1-3]4'),
    'Réflexe eco - Pharmacie et chambre particulière': ('Particuliers — Réflexe eco Pharmacie + chambre particulière', 'Non déterminé par le dossier', r'PSI[1-5][1-3]3'),
}


def classify(relative):
    parts = unicodedata.normalize('NFC', relative).split('/')
    if len(parts) == 1 and parts[0] in CCN:
        return 'CCN', 'Non déterminé par le dossier', 'IDCC ' + CCN[parts[0]]
    if parts == [SYNTHESIS]:
        return 'Particuliers — Synthèse garanties 2026', 'Non déterminé par le dossier', 'SYNTHESE-PARTICULIERS-2026'
    if len(parts) == 2 and parts[0] in FOLDERS:
        family, regime, pattern = FOLDERS[parts[0]]
        code = Path(parts[1]).stem
        if re.fullmatch(pattern, code):
            return family, regime, code
    raise ValueError('Incohérence dossier/code ou source inconnue : ' + relative)


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def generate(root, previous):
    sources = []
    references = set()
    for path in sorted(root.rglob('*'), key=lambda p: p.as_posix()):
        if not path.is_file() or path.suffix.lower() != '.pdf':
            continue
        relative = path.relative_to(root).as_posix()
        family, regime, reference = classify(relative)
        if reference in references:
            raise ValueError('Doublon de référence : ' + reference)
        references.add(reference)
        size = path.stat().st_size
        if not size:
            raise ValueError('PDF vide : ' + relative)
        legacy = previous.get(reference.removeprefix('IDCC '), {}) if family == 'CCN' else {}
        # Preserve existing CCN transcription metadata; this script does not extract guarantees.
        metadata = {k: legacy[k] for k in ('effectiveDate', 'transcribedPages', 'notesPages', 'scope') if k in legacy}
        sources.append({**metadata, 'file': relative, 'family': family, 'regime': regime,
                        'reference': reference, 'year': 2026, 'sizeBytes': size, 'sha256': digest(path),
                        'status': 'partially_transcribed' if legacy.get('transcribedPages') else 'indexed_not_transcribed',
                        'classificationBasis': 'folder_and_filename_only'})
    actual = {s['file'] for s in sources}
    previous_files = {s['file'] for s in previous.get('sources', [])}
    previous_files.update(previous[k]['file'] for k in ('405', '2691') if k in previous)
    missing = previous_files - actual
    if missing:
        raise ValueError('Fichiers manquants : ' + ', '.join(sorted(missing)))
    manifest = {'schemaVersion': 2, 'year': 2026,
                'statusDefinitions': {'indexed_not_transcribed': 'Indexé mais pas encore transcrit : aucun contenu métier extrait par ce lot.',
                                      'partially_transcribed': 'Transcription partielle antérieure conservée ; aucune nouvelle extraction par ce lot.'},
                'pdfCount': len(sources), 'sources': sources}
    for s in sources:
        if s['family'] == 'CCN':
            manifest[s['reference'].removeprefix('IDCC ')] = s.copy()
    return manifest


def run(root, check=False):
    manifest_path = root / 'manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    result = generate(root, previous)
    if check:
        if result != previous:
            raise ValueError('Manifest différent de l’inventaire : vérifier fichiers, tailles, SHA256, références, statuts et classification ; relancer la génération après contrôle.')
    else:
        manifest_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"{result['pdfCount']} PDF ; références uniques, fichiers présents, tailles, SHA256 et dossier/code vérifiés.")
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        run(args.root, args.check)
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + '\n')
