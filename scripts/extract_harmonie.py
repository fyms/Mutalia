#!/usr/bin/env python3
"""Extract review candidates from at most five explicitly selected PDFs. No runtime integration."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

import pdfplumber
from harmonie_manifest import ROOT, classify, digest

REPO = Path(__file__).resolve().parents[1]
OUTPUT = REPO / 'data/references/harmonie/2026/extraction-sample.json'
SAMPLE = ['PSI111', 'PLI211', 'PSI114', 'PSI113', 'SYNTHESE-PARTICULIERS-2026']
CATEGORIES = ['Soins courants', 'Cures thermales', 'Hospitalisation', 'Maternité',
              'Médecines complémentaires', 'Prévention', 'Optique', 'Dentaire',
              'Aides auditives', "Services d'assistance", 'Accompagnement personnalisé Affection Longue Durée']


def clean(text):
    return unicodedata.normalize('NFC', re.sub(r'\s+', ' ', text or '').strip())


def parse_value(raw):
    """Parse a literal only, never infer a total AMC from juxtaposed AMO/TM values."""
    text = clean(raw)
    result = {'calculationMode': 'unknown', 'value': None, 'unit': None, 'limit': None,
              'confidence': 0.2, 'status': 'needs_review', 'reviewReasons': []}
    if not text:
        result.update(status='not_extracted', confidence=0)
        result['reviewReasons'] = ['Aucune valeur lisible ; absence de cellule ne signifie pas zéro.']
    elif re.fullmatch(r'\d{1,3}(?:[.,]\d+)?\s*%', text):
        result.update(calculationMode='percent_br', value=float(text.replace('%', '').replace(',', '.')), unit='% BR', confidence=0.6)
        result['reviewReasons'] = ['Composante AMO, ticket modérateur ou dépassement à identifier ; aucun total calculé.']
    elif re.fullmatch(r'\d+(?:[.,]\d+)?\s*€(?:\s*/\s*[\wÀ-ÿ]+)?', text):
        number = re.match(r'\d+(?:[.,]\d+)?', text).group()
        unit = 'EUR' + ('/' + text.split('/', 1)[1].strip() if '/' in text else '')
        result.update(calculationMode='fixed_amount', value=float(number.replace(',', '.')), unit=unit,
                      limit=text if '/' in text else None, confidence=0.6)
        result['reviewReasons'] = ['Unité, plafond partagé, ancienneté et conditions à contrôler.']
    elif text == 'Remboursement intégral':
        result.update(calculationMode='actual_cost_conditional', unit='frais réels', confidence=0.5)
        result['reviewReasons'] = ['Remboursement intégral conditionnel : panier, prix limites et renvois à contrôler.']
    else:
        result['calculationMode'] = 'compound_or_ambiguous' if re.search(r'%|€', text) else 'service_or_text'
        result['reviewReasons'] = ['Texte composé, colonnes fusionnées, alternatives ou superposition ; ne pas convertir en garantie totale.']
        if re.search(r'/An|/Séance|/Appareil|limite|plafond', text, re.I):
            result['limit'] = text
    return result


def record(source, page, label, raw, category, bbox=None, sub='', condition=''):
    parsed = parse_value(raw)
    identity = f"{source['reference']}:{page}:{bbox}:{label}:{raw}"
    return {'id': hashlib.sha256(identity.encode()).hexdigest()[:24],
            'reference': source['reference'], 'family': source['family'], 'regime': source['regime'],
            'category': category, 'benefit': clean(label) or 'Ligne sans libellé exploitable',
            'subBenefit': clean(sub) or None, **parsed,
            'condition': condition or 'Conditions et renvois de la page source à contrôler.',
            'sourceFile': source['file'], 'sourcePage': page, 'sourceSha256': source['sha256'],
            'sourceBBox': [round(v, 3) for v in bbox] if bbox else None,
            'rawLabel': label, 'rawValue': raw, 'verifiedBy': None}


def extract_document(root, source):
    path = root / source['file']
    if not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Source hors du répertoire autorisé')
    if source['family'] == 'CCN' or source['reference'].startswith('IDCC '):
        raise ValueError('CCN exclues de cet extracteur particuliers')
    if classify(source['file']) != (source['family'], source['regime'], source['reference']):
        raise ValueError('Classification du manifest incohérente')
    if digest(path) != source['sha256']:
        raise ValueError('SHA256 source différent du manifest')
    records, coverage = [], []
    synthesis = source['reference'].startswith('SYNTHESE-')
    with pdfplumber.open(path) as pdf:
        if not synthesis:
            header = '\n'.join((p.extract_text() or '')[:1500] for p in pdf.pages[:3])
            observed = set(re.findall(r'\b(?:PSI|PLI)\s*\d{3}\b', header))
            if source['reference'] not in {r.replace(' ', '') for r in observed}:
                raise ValueError('Code du PDF incompatible avec son nom : ' + source['reference'])
        for page_number, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ''
            item = {'page': page_number, 'status': 'not_extracted', 'reason': '', 'recordCount': 0}
            before = len(records)
            if synthesis:
                r = record(source, page_number, 'Architecture des formules — synthèse sans barème chiffré', '', 'Architecture')
                r['condition'] = 'Document de synthèse : aucune équivalence PSI/PLI et aucune garantie déduite des étoiles.'
                r['reviewReasons'] = ['Aucun barème chiffré extrait de la synthèse.']
                if page_number == 3:
                    r['reviewReasons'].append('Titre Pharmacie et Chambre particulière et contenu Pharmacie seuls discordants.')
                if page_number == 4:
                    r['reviewReasons'].append('La synthèse régime local mentionne PSI ; les fichiers locaux sont PLI. Aucune équivalence établie.')
                records.append(r)
                item.update(reason='Synthèse descriptive uniquement',
                            observedReferences=sorted(set(re.findall(r'\b(?:PSI|PLI)\s*\d{3}\b', text))),
                            sourceContext=text)
            elif 'Exemples de Remboursement' in text or 'COMPRENDRE VOS REMBOURSEMENTS' in text:
                item['reason'] = 'Page pédagogique ou exemples : exclue du barème'
            elif abs(page.width - 595) > 2 or 'Remboursements de la mutuelle' not in text or 'Votre remboursement' not in text:
                item['reason'] = 'Page descriptive ou structure non reconnue'
                records.append(record(source, page_number, 'Page sans tableau de garantie reconnu', '', 'Non déterminée'))
            else:
                # Find the main right-hand reimbursement column. Small nested tables are ignored.
                tables = [t for t in page.find_tables() if t.bbox[2] > page.width * .9
                          and 'Votre remboursement' in ' '.join(str(c or '') for row in t.extract() for c in row)]
                tables.sort(key=lambda t: t.bbox[1])
                seen = set()
                for table in tables:
                    parent = ''
                    for row in table.rows:
                        x0, top, x1, bottom = row.bbox
                        key = (round(top, 2), round(bottom, 2))
                        if key in seen:
                            continue
                        seen.add(key)
                        # This geometry is specific to the sampled 595-point individual sheets.
                        label_bbox = (123, top, 464, bottom)
                        value_bbox = (464, top, min(page.width, 579), bottom)
                        label = page.crop(label_bbox).extract_text() or ''
                        raw = page.crop(value_bbox).extract_text() or ''
                        if 'Votre remboursement' in raw or not clean(label):
                            continue
                        above = page.crop((0, 0, page.width, top)).extract_text() or ''
                        headings = [(m.start(), c) for c in CATEGORIES for m in re.finditer('^' + re.escape(c) + '$', above, re.M)]
                        category = max(headings)[1] if headings else 'Non déterminée'
                        # Preserve in-row parent headings and OPTAM distinctions instead of flattening them away.
                        lines = [line.strip() for line in label.splitlines() if line.strip()]
                        for line in lines:
                            if line.endswith(':') and not line.startswith('•'):
                                parent = line
                        sub = lines[-1] if len(lines) > 1 or lines[0].startswith('•') else ''
                        benefit = parent + ' ' + label if lines[0].startswith('•') and parent else label
                        r = record(source, page_number, benefit, raw, category, (123, top, 579, bottom), sub,
                                   f'Voir le contexte et les renvois conservés pour la page {page_number} ; aucune composante AMO/AMC fusionnée.')
                        r['rawLabel'] = label
                        records.append(r)
                item.update(status='needs_review' if len(records) > before else 'not_extracted',
                            reason='Candidats de lignes ; colonnes colorées et renvois non validés', sourceContext=text)
                if len(records) == before:
                    records.append(record(source, page_number, 'Tableau non segmentable', '', 'Non déterminée'))
            item['recordCount'] = len(records) - before
            coverage.append(item)
    return {'reference': source['reference'], 'family': source['family'], 'regime': source['regime'],
            'sourceFile': source['file'], 'sha256': source['sha256'], 'pageCount': len(coverage), 'pages': coverage}, records


def extract(root=ROOT, references=None):
    references = SAMPLE if references is None else references
    if not references or len(references) > 5 or len(set(references)) != len(references):
        raise ValueError('Sélection explicite de 1 à 5 PDF distincts uniquement pour le lot 2A')
    manifest = json.loads((root / 'manifest.json').read_text())
    sources = {s['reference']: s for s in manifest['sources']}
    if any(r not in sources for r in references):
        raise ValueError('Référence absente du manifest')
    result = {'schemaVersion': 1, 'year': 2026, 'scope': 'particuliers_sample_only',
              'extractorVersion': '0.1.0', 'pdfplumberVersion': pdfplumber.__version__, 'documents': [], 'guarantees': []}
    for reference in references:
        document, records = extract_document(root, sources[reference])
        result['documents'].append(document)
        result['guarantees'].extend(records)
    return result


def validate(result):
    subprocess.run(['node', str(REPO / 'scripts/validate_harmonie_extraction.cjs')],
                   input=json.dumps(result, ensure_ascii=False), text=True, check=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--references', nargs='+', default=SAMPLE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    result = extract(args.root, args.references)
    validate(result)
    if args.output.resolve().is_relative_to(args.root.resolve()):
        parser.error('Sortie interdite dans les sources : utiliser un référentiel séparé')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"{len(result['documents'])} PDF ; {len(result['guarantees'])} lignes candidates ; aucune garantie auto-vérifiée.")
