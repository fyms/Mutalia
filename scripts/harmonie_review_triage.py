"""Triage using only four Lot 2D JSON inputs; no document reading or verification."""
import itertools
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'data/references/harmonie/2026'
INPUTS = ('review-units.json','review-reduction-report.json','extraction-candidates.json','reliability-report.json')
CLASSES = ('strong_consensus_candidate','expected_product_variant','document_check_required','singleton_direct_check')
SEMANTIC = ('referenceSeries','family','regime','category','benefit','subBenefit')
RULE = ('calculationMode','value','unit','limit','condition','rawValue')


def encode(x):
    return json.dumps(x, ensure_ascii=False, sort_keys=True, indent=2)+'\n'


def key(x):
    return json.dumps(x,ensure_ascii=False,sort_keys=True)


def page(s):
    return s['sourceFile'],s['sourcePage'],s['sourceSha256']


def build(units, reduction, candidates, reliability):
    source = {r['id']:r for r in candidates['guarantees']}
    assert len(source)==len(candidates['guarantees'])
    assert reduction['reviewUnits']==len(units['units'])==992
    assert units['verified']==reliability['verified']==0
    assert all(r['status']!='verified' for r in source.values())
    groups=defaultdict(list)
    ids=[]
    for u in units['units']:
        sig=u['normalizedSignature']
        assert sig['referenceSeries'] in ('PSI','PLI') and sig['family'].startswith('particuliers')
        for s in u['sources']:
            row=source[s['id']]
            assert row['status']=='needs_review' and all(row[k]==v for k,v in s.items())
            assert row['reference'].startswith(sig['referenceSeries'])
        ids.extend(u['candidateIds'])
        groups[key({k:sig[k] for k in SEMANTIC})].append(u)
    assert Counter(ids)==Counter({i:1 for i,r in source.items() if r['status']=='needs_review'})
    results=[]; selected=set(); conflicts=[]
    for semantic, peers in sorted(groups.items()):
        patterns={u['reviewUnitId']:key({k:u['normalizedSignature'][k] for k in RULE}) for u in peers}
        per_ref=defaultdict(set)
        for u in peers:
            for ref in u['references']: per_ref[ref].add(patterns[u['reviewUnitId']])
        contradictory={r for r,p in per_ref.items() if len(p)>1}
        dimensions={
            'value':len({key((u['normalizedSignature']['value'],u['normalizedSignature']['unit'],u['normalizedSignature']['rawValue'])) for u in peers})>1,
            'mode':len({u['normalizedSignature']['calculationMode'] for u in peers})>1,
            'conditionLimit':len({key((u['normalizedSignature']['condition'],u['normalizedSignature']['limit'])) for u in peers})>1}
        if any(dimensions.values()): conflicts.append(dict(semanticKey=json.loads(semantic),dimensions=dimensions,contradictoryReferences=sorted(contradictory),reviewUnitIds=sorted(patterns)))
        for u in sorted(peers,key=lambda u:u['reviewUnitId']):
            sig=u['normalizedSignature']; uid=u['reviewUnitId']
            interpretable=(sig['calculationMode'] in ('percent_br','fixed_amount') and isinstance(sig['value'],(int,float)) and bool(sig['unit']))
            own_conflict=bool(set(u['references']) & contradictory)
            varied=len(set(patterns.values()))>1
            if own_conflict or not interpretable:
                cls=CLASSES[2]; reason='Contexte sémantique divergent dans une même référence ou règle non interprétable isolément ; contrôler la page et ses renvois.'
            elif u['occurrenceCount']==1:
                cls=CLASSES[3]; reason='Une seule occurrence exploitable ; contrôle direct sans confirmation croisée.'
            elif varied:
                cls=CLASSES[1]; reason='Règles distinctes portées par des références distinctes, sans divergence interne détectée ; variante de produit possible, non validée.'
            elif len(u['references'])>1:
                cls=CLASSES[0]; reason='Règle normalisée identique dans plusieurs références de même série/famille/régime ; confirmation documentaire encore requise.'
            else:
                cls=CLASSES[2]; reason='Répétitions dans une seule référence : confirmation indépendante insuffisante.'
            own=sorted({page(s) for s in u['sources']})
            choices=[(p,) for p in own]
            if cls==CLASSES[0]:
                choices=[tuple(sorted((a,b))) for a,b in itertools.combinations(own,2) if a[0]!=b[0]]
            elif own_conflict or cls==CLASSES[1]:
                opponents=[s for v in peers if patterns[v['reviewUnitId']]!=patterns[uid] for s in v['sources'] if not own_conflict or s['reference'] in set(u['references']) & contradictory]
                choices=[tuple(sorted(set((a,page(b))))) for a in own for b in opponents]
            assert choices
            # Exact minimum for this unit's evidence requirement (one occurrence + one comparator if needed).
            # Reuse already selected pages as a tie-breaker; no claim of global set-cover optimum.
            evidence=min(choices,key=lambda ps:(len(ps),len(set(ps)-selected),ps)); selected.update(evidence)
            evidence_rows=[dict(sourceFile=p[0],sourcePage=p[1],sourceSha256=p[2]) for p in evidence]
            results.append(dict(reviewUnitId=uid,triageClass=cls,justification=reason,
                semanticKey=json.loads(semantic),occurrenceCount=u['occurrenceCount'],candidateIds=u['candidateIds'],references=u['references'],
                referenceLevels=[dict(reference=r,level='not_inferred_from_code') for r in u['references']],sources=u['sources'],
                observedRules=[dict(reviewUnitId=v['reviewUnitId'],references=v['references'],**{k:v['normalizedSignature'][k] for k in RULE}) for v in sorted(peers,key=lambda v:v['reviewUnitId'])],
                recommendedEvidence=evidence_rows,
                evidenceScope='Contrôle représentatif de cette unité et, si nécessaire, d’un comparateur ; ne valide pas automatiquement toutes les références. Les autres variantes gardent leurs propres unités.'))
    results.sort(key=lambda u:u['reviewUnitId'])
    pages=defaultdict(list)
    for u in results:
        for p in u['recommendedEvidence']:pages[(p['sourceFile'],p['sourcePage'],p['sourceSha256'])].append(u['reviewUnitId'])
    report=dict(total=len(results),byClass={c:sum(u['triageClass']==c for u in results) for c in CLASSES},
        uniqueRecommendedPages=len(pages),evidenceOptimization='Minimum par unité selon les exigences annoncées ; mutualisation déterministe, optimum global non garanti.',
        byFamily=dict(Counter(u['semanticKey']['family'] for u in results)),byCategory=dict(Counter(u['semanticKey']['category'] for u in results)),
        pageCoverage=[dict(sourceFile=p[0],sourcePage=p[1],sourceSha256=p[2],reviewUnitIds=sorted(v)) for p,v in sorted(pages.items())],
        conflictSemanticGroups={d:sum(c['dimensions'][d] for c in conflicts) for d in ('value','mode','conditionLimit')},
        conflictDetails=conflicts,conflictMeaning='Divergences potentielles, y compris variantes entre produits et ambiguïtés du libellé ; pas des erreurs contractuelles établies.',
        singletonUnits=sum(u['occurrenceCount']==1 for u in results),notExtractedExcluded=units['notExtracted']['count'],verified=0)
    return dict(schemaVersion=1,units=results,verified=0),report


def load():
    return [json.loads((ROOT/n).read_text()) for n in INPUTS]


if __name__=='__main__':
    result,report=build(*load())
    for name,data in [('review-triage.json',result),('review-triage-report.json',report)]: (ROOT/name).write_text(encode(data))
    print({k:report[k] for k in ('total','byClass','uniqueRecommendedPages','conflictSemanticGroups','singletonUnits')})
