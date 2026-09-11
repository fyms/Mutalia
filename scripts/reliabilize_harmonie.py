"""Lot 2C: re-extract only three sources; classify duplicates without business validation."""
import copy
import json
import subprocess
from collections import Counter
from extract_harmonie import ROOT, OUTPUT, REPO, extract_document, validate
from extract_harmonie_corpus import encoded, report

TARGETS = ('PSI321', 'PSI323', 'PSI324')
BASE = '918a6e1'


def baseline():
    def read(name):
        relative = OUTPUT.with_name(name).relative_to(REPO)
        return json.loads(subprocess.check_output(['git', 'show', f'{BASE}:{relative}'], cwd=REPO))
    return read('extraction-candidates.json'), read('extraction-report.json')


def classify_group(rows):
    context = lambda r: (r['sourceFile'], r['sourceSha256'], r['sourcePage'], r['category'],
                         r['benefit'], r['subBenefit'], r['condition'], r['limit'])
    contexts = [context(r) for r in rows]
    if len(set(contexts)) == 1:
        return 'exact_duplicate_candidate'
    if len(set(contexts)) == len(rows):
        return 'legitimate_repeat'
    return 'ambiguous_duplicate'


def classify_groups(data, groups):
    lookup = {r['id']: r for r in data['guarantees']}
    return [{**g, 'classification': classify_group([lookup[i] for i in g['ids']])} for g in groups]


def refine(original, original_report):
    data = copy.deepcopy(original)
    sources = {s['reference']: s for s in json.loads((ROOT / 'manifest.json').read_text())['sources']}
    recovered = {}
    for ref in TARGETS:
        doc, rows = extract_document(ROOT, sources[ref])
        data['documents'] = [doc if d['reference'] == ref else d for d in data['documents']]
        # Preserve the original order of references, replacing only the targeted rows.
        index = next(i for i,r in enumerate(data['guarantees']) if r['reference'] == ref)
        data['guarantees'] = [r for r in data['guarantees'] if r['reference'] != ref]
        data['guarantees'][index:index] = rows
        recovered[ref] = {'before': sum(r['status']=='needs_review' for r in original['guarantees'] if r['reference']==ref),
                          'after': sum(r['status']=='needs_review' for r in rows)}
    before_dedupe = report(data)
    classified = classify_groups(data, before_dedupe['potentialDuplicates'])
    # Remove only byte-equivalent record fields except generated identity. Coordinates are part of provenance.
    seen, kept, removed = {}, [], []
    for row in data['guarantees']:
        key = json.dumps({k:v for k,v in row.items() if k != 'id'}, sort_keys=True, ensure_ascii=False)
        if key in seen:
            removed.append({'removedId': row['id'], 'retainedId': seen[key]})
        else:
            seen[key] = row['id']
            kept.append(row)
    data['guarantees'] = kept
    for doc in data['documents']:
        for page in doc['pages']:
            page['recordCount'] = sum(r['sourceFile']==doc['sourceFile'] and r['sourcePage']==page['page'] for r in kept)
    final = report(data)
    original_groups = classify_groups(original, original_report['potentialDuplicates'])
    summary = dict(baselineCommit=BASE, recoveredRows=recovered,
                   notExtractedBefore=original_report['not_extracted'], notExtractedAfter=final['not_extracted'],
                   unrecognizedTargetPagesBefore=sum(r['reference'] in TARGETS and r['status']=='not_extracted' and r['sourceBBox'] is None for r in original['guarantees']),
                   unrecognizedTargetPagesAfter=sum(r['reference'] in TARGETS and r['status']=='not_extracted' and r['sourceBBox'] is None for r in kept),
                   notExtractedExplanation='La segmentation remplace des placeholders de pages par des lignes ; les cellules vides restent not_extracted, ce compteur de lignes ne mesure pas la couverture des pages.',
                   originalDuplicateGroups=original_groups,
                   originalDuplicateCounts=dict(Counter(g['classification'] for g in original_groups)),
                   finalDuplicateGroups=classified,
                   finalDuplicateCounts=dict(Counter(g['classification'] for g in classified)),
                   removedExactRecords=removed,
                   remainingAnomaliesByReference=dict(Counter(a['reference'] for a in final['anomalies'])),
                   humanReviewRows=final['needs_review'], unresolvedExtractionRows=final['not_extracted'],
                   reviewDefinition='Toutes les lignes needs_review conservées ; les placeholders not_extracted sont comptés séparément, sans validation métier.',
                   verified=final['verified'])
    validate(data)
    return data, final, summary


if __name__ == '__main__':
    data, audit, summary = refine(*baseline())
    for name, result in [('extraction-candidates.json', data), ('extraction-report.json', audit), ('reliability-report.json', summary)]:
        OUTPUT.with_name(name).write_text(encoded(result))
    print({k:summary[k] for k in ('recoveredRows','notExtractedBefore','notExtractedAfter','originalDuplicateCounts','finalDuplicateCounts','humanReviewRows')})
