"""Build an application-only individual catalogue; audit files and CCN stay separate."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/references/harmonie/2026'
OUTPUT=ROOT/'src/lib/data/harmonie/individualCatalog2026.json'

def build():
    candidates=json.loads((DATA/'extraction-candidates.json').read_text())
    verified=json.loads((DATA/'verified-guarantees.json').read_text())['guarantees']
    rows={r['id']:r for r in candidates['guarantees']}
    approvals={}
    for g in verified:
        assert g['status']=='verified' and g['verifiedBy']=='document_review_2026' and not g['openDivergences']
        assert g['reference'].startswith(('PSI','PLI')) and g['family'].startswith('particuliers')
        for cid in g['candidateIds']:
            assert cid not in approvals and rows[cid]['reference']==g['reference']
            assert any(s['id']==cid and all(s[k]==rows[cid][k] for k in ('sourceFile','sourcePage','sourceSha256','reference')) for s in g['sources'])
            approvals[cid]=g
    products={d['reference']:dict(reference=d['reference'],family=d['family'],regime=d['regime'],sourceFile=d['sourceFile'],sourceSha256=d['sha256']) for d in candidates['documents']}
    entries=[]
    for r in candidates['guarantees']:
        # The descriptive synthesis is not an application guarantee/product.
        if not r['reference'].startswith(('PSI','PLI')):
            assert r['status']=='not_extracted'
            continue
        e=dict(id=r['id'],reference=r['reference'],category=r['category'],benefit=r['benefit'],sourcePage=r['sourcePage'])
        if r['id'] in approvals:
            g=approvals[r['id']]
            e.update({k:g[k] for k in ('category','benefit','calculationMode','value','unit','condition','limit','verifiedBy')})
            e.update(status='verified',reviewUnitId=g['reviewUnitId'])
        else:
            e.update(status=r['status'],notice='Donnée 2026 à vérifier')
            # No unverified numerical fields are exposed through the application catalogue.
        entries.append(e)
    return dict(year=2026,scope='particuliers',products=[p for ref,p in sorted(products.items()) if ref.startswith(('PSI','PLI'))],entries=entries,
                excludedSynthesisRecords=sum(not r['reference'].startswith(('PSI','PLI')) for r in candidates['guarantees']))

if __name__=='__main__':
    data=build();OUTPUT.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    from collections import Counter
    print(Counter(e['status'] for e in data['entries']))
