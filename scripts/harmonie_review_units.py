"""JSON-only conservative review grouping. Never validates or changes source candidates."""
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'data/references/harmonie/2026'
INPUTS = ('extraction-candidates.json', 'extraction-report.json', 'reliability-report.json')
FIELDS = ('family', 'regime', 'category', 'benefit', 'subBenefit', 'calculationMode',
          'value', 'unit', 'limit', 'condition', 'rawLabel', 'rawValue')
VARIABLES = ('calculationMode', 'value', 'unit', 'limit', 'condition', 'rawValue')


def normalize(value):
    # Keep punctuation: %, decimal separators, slashes, parentheses and footnotes can carry meaning.
    return re.sub(r'\s+', ' ', value).strip().casefold() if isinstance(value, str) else value


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + '\n'


def key(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def signature(row):
    match = re.fullmatch(r'(PSI|PLI)\d+', row['reference'])
    if not match or not row['family'].startswith('Particuliers'):
        raise ValueError('Only individual PSI/PLI candidates may enter guarantee review')
    return {'referenceSeries': match.group(1), **{f: normalize(row[f]) for f in FIELDS}}


def build(data, audit, reliability):
    rows = data['guarantees']
    counts = Counter(r['status'] for r in rows)
    if counts['verified'] or any(r.get('verifiedBy') for r in rows):
        raise ValueError('Expected verified = 0')
    if set(counts) - {'needs_review', 'not_extracted'}:
        raise ValueError('Unexpected source status')
    if counts['needs_review'] != audit['needs_review'] or counts['needs_review'] != reliability['humanReviewRows'] or counts['not_extracted'] != audit['not_extracted'] or counts['not_extracted'] != reliability['unresolvedExtractionRows']:
        raise ValueError('Source reports disagree')
    if len({r['id'] for r in rows}) != len(rows):
        raise ValueError('Duplicate source IDs')
    documents = {d['sourceFile']: d for d in data['documents']}
    groups = defaultdict(list)
    for row in rows:
        doc = documents[row['sourceFile']]
        if any(row[f] != doc[f] for f in ('reference', 'family', 'regime')) or row['sourceSha256'] != doc['sha256'] or not 1 <= row['sourcePage'] <= doc['pageCount']:
            raise ValueError('Invalid provenance')
        if row['status'] == 'needs_review':
            groups[key(signature(row))].append(row)
    units = []
    for sig, occurrences in sorted(groups.items()):
        occurrences.sort(key=lambda r:r['id'])
        refs = sorted({r['reference'] for r in occurrences})
        units.append(dict(reviewUnitId=hashlib.sha256(sig.encode()).hexdigest(), normalizedSignature=json.loads(sig),
                          occurrenceCount=len(occurrences), references=refs,
                          families=sorted({r['family'] for r in occurrences}), regimes=sorted({r['regime'] for r in occurrences}),
                          candidateIds=[r['id'] for r in occurrences],
                          sources=[{f:r[f] for f in ('id','reference','sourceFile','sourcePage','sourceSha256','sourceBBox')} for r in occurrences],
                          reviewStatus='single_occurrence' if len(occurrences)==1 else 'repeated_cross_reference' if len(refs)>1 else 'repeated_same_reference',
                          remainingReviewReasons=sorted({reason for r in occurrences for reason in r['reviewReasons']} | {'Regroupement technique uniquement ; chaque occurrence et son contexte source restent à valider.'}),
                          conflictUnitIds=[]))
    # A coarser index flags variants; it NEVER merges different guarantees or conditions.
    contexts = defaultdict(list)
    for unit in units:
        contexts[key({f:v for f,v in unit['normalizedSignature'].items() if f not in VARIABLES})].append(unit)
    for variants in contexts.values():
        if len(variants) > 1:
            for unit in variants:
                unit['reviewStatus'] = 'structural_conflict'
                unit['conflictUnitIds'] = sorted(u['reviewUnitId'] for u in variants if u is not unit)
                unit['remainingReviewReasons'].append('Variantes de valeur/mode/unité/limite/condition ou texte brut pour un même libellé : vérifier séparément ; des niveaux contractuels distincts peuvent expliquer cet écart.')
    missing = [{f:r[f] for f in ('id','reference','sourceFile','sourcePage','sourceSha256')} for r in rows if r['status']=='not_extracted']
    result = dict(schemaVersion=1, policy='Comparison only: whitespace and case; punctuation preserved; PSI/PLI separated; no automatic verification.',
                  units=units, notExtracted=dict(count=len(missing), excludedFromGuaranteeValidation=True, occurrences=sorted(missing,key=lambda r:r['id'])), verified=0)
    report = dict(initialNeedsReview=counts['needs_review'], reviewUnits=len(units),
                  reductionPercent=round(100*(1-len(units)/counts['needs_review']),2) if counts['needs_review'] else 0,
                  crossReferenceUnits=sum(len(u['references'])>1 for u in units),
                  structuralConflictUnits=sum(u['reviewStatus']=='structural_conflict' for u in units),
                  singletonUnits=sum(u['occurrenceCount']==1 for u in units),
                  byFamily=dict(Counter(u['normalizedSignature']['family'] for u in units)),
                  byCategory=dict(Counter(u['normalizedSignature']['category'] for u in units)),
                  byStatus=dict(Counter(u['reviewStatus'] for u in units)),
                  notExtracted=len(missing), verified=0,
                  conflictMeaning='Potential structural variants, not proof of error; differences between formula levels are not merged or validated.',
                  validationScope='Review units share an identical normalized signature, not a contractual equivalence or shared approval.')
    return result, report


def load():
    return [json.loads((ROOT/name).read_text()) for name in INPUTS]


if __name__ == '__main__':
    units, report = build(*load())
    for name, result in [('review-units.json',units), ('review-reduction-report.json',report)]:
        (ROOT/name).write_text(encoded(result))
    print(encoded(report))
