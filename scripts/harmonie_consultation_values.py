"""Derive display-only values from existing JSON; never extract PDFs or approve guarantees."""
import json
import re
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/lib/data/harmonie/individual-consultation-values.json'


def line_key(row):
    return tuple(row[k] for k in ('reference', 'sourceFile', 'sourcePage', 'category', 'benefit'))


def readable(row):
    # Keep the original text, not a reconstructed total/unit. Bare percentages can
    # be AMO/ticket-moderateur components and are deliberately not exposed.
    text = row.get('rawValue', '').strip()
    mode = row.get('calculationMode')
    if row.get('status') != 'needs_review' or row.get('confidence', 0) < .5:
        return None
    if mode == 'fixed_amount' and re.fullmatch(r'\d+(?:[.,]\d+)?\s*€\s*/\s*[A-Za-zÀ-ÿ]+', text):
        return text
    if mode == 'actual_cost_conditional' and text in ('Remboursement intégral', 'Frais réels'):
        return text
    if mode == 'percent_br' and re.fullmatch(r'\d+(?:[.,]\d+)?\s*%\s*BR(?:SS)?', text):
        return text
    return None


def build(catalog, candidates):
    products = {p['reference']: p for p in catalog['products']}
    ids, lines = defaultdict(list), defaultdict(list)
    for candidate in candidates['guarantees']:
        ids[candidate['id']].append(candidate)
        lines[line_key(candidate)].append(candidate)
    output = []
    for entry in catalog['entries']:
        if entry['status'] != 'needs_review':
            continue
        product = products[entry['reference']]
        matches = ids[entry['id']]
        expected = {**entry, **product}
        if not matches or any(any(c[k] != expected[k] for k in ('reference', 'sourceFile', 'sourcePage', 'sourceSha256', 'family', 'regime', 'category', 'benefit')) for c in matches):
            continue
        group = lines[line_key(matches[0])]
        signatures = {json.dumps({k: c.get(k) for k in ('rawValue', 'calculationMode', 'value', 'unit', 'limit', 'condition', 'sourceSha256')}, sort_keys=True) for c in group}
        if len(signatures) != 1:
            continue  # Incompatible alternatives on this exact page/benefit: choose none.
        value = readable(matches[0])
        if value:
            output.append(dict(id=entry['id'], reference=entry['reference'], documentValue=value,
                               sourceFile=product['sourceFile'], sourcePage=entry['sourcePage'],
                               sourceSha256=product['sourceSha256'], status='needs_review'))
    return sorted(output, key=lambda r: r['id'])


if __name__ == '__main__':
    catalog = json.loads((ROOT / 'src/lib/data/harmonie/individualCatalog2026.json').read_text())
    candidates = json.loads((ROOT / 'data/references/harmonie/2026/extraction-candidates.json').read_text())
    rows = build(catalog, candidates)
    OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{len(rows)} valeurs documentaires ; aucun statut métier modifié ; {OUTPUT.stat().st_size} octets')
