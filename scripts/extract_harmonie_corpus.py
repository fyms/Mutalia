"""Batch candidates only; reuse the Lot 2A parser without changing its fixture."""
import json
from collections import Counter, defaultdict
from extract_harmonie import ROOT, OUTPUT, extract_document, validate, pdfplumber


def build():
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    sources = [s for s in manifest['sources'] if s['family'].startswith('Particuliers')]
    if len(sources) != 43 or len({s['reference'] for s in sources}) != 43:
        raise ValueError('Expected 43 distinct individual references')
    result = dict(schemaVersion=1, year=2026, scope='particuliers_full_corpus',
                  extractorVersion='0.1.0', pdfplumberVersion=pdfplumber.__version__, documents=[], guarantees=[])
    for source in sources:
        doc, rows = extract_document(ROOT, source)
        result['documents'].append(doc)
        result['guarantees'].extend(rows)
        print(source['reference'], len(rows), flush=True)
    validate(result)
    return result


def report(data):
    rows = data['guarantees']
    counts = Counter(r['status'] for r in rows)
    if counts['verified']:
        raise ValueError('Automatic verification forbidden')
    groups = defaultdict(list)
    for r in rows:
        groups[(r['reference'], r['category'], r['rawLabel'], r['rawValue'])].append(r['id'])
    anomalies = []
    for d in data['documents']:
        usable = sum(r['status'] == 'needs_review' for r in rows if r['sourceFile'] == d['sourceFile'])
        if usable == 0 and not d['reference'].startswith('SYNTHESE'):
            anomalies.append(dict(reference=d['reference'], sourceFile=d['sourceFile'], reason='Aucune ligne interprétable : gabarit à revoir'))
        for p in d['pages']:
            if p['status'] == 'not_extracted' and 'exclue' not in p['reason']:
                anomalies.append(dict(reference=d['reference'], sourceFile=d['sourceFile'], sourcePage=p['page'], reason=p['reason']))
    for r in rows:
        if r['calculationMode'] == 'compound_or_ambiguous' or r['reference'].startswith('SYNTHESE'):
            anomalies.append(dict(id=r['id'], reference=r['reference'], sourceFile=r['sourceFile'], sourcePage=r['sourcePage'], reasons=r['reviewReasons']))
    return dict(pdfCount=len(data['documents']), candidateRows=len(rows), needs_review=counts['needs_review'],
                not_extracted=counts['not_extracted'], verified=counts['verified'],
                pdfByFamily=dict(Counter(d['family'] for d in data['documents'])),
                byFamily=dict(Counter(r['family'] for r in rows)),
                byReference=dict(Counter(r['reference'] for r in rows)),
                byCategory=dict(Counter(r['category'] for r in rows)),
                potentialDuplicates=[dict(reference=k[0], ids=v) for k,v in groups.items() if len(v)>1],
                anomalies=anomalies)


def encoded(data):
    return json.dumps(data, ensure_ascii=False, indent=2) + '\n'


if __name__ == '__main__':
    data = build()
    summary = report(data)
    OUTPUT.with_name('extraction-candidates.json').write_text(encoded(data))
    OUTPUT.with_name('extraction-report.json').write_text(encoded(summary))
    print({k: summary[k] for k in ('pdfCount', 'candidateRows', 'needs_review', 'not_extracted')})
