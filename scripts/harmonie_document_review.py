"""Deterministically apply explicit page-review decisions; never opens PDFs or infers approvals."""
import copy
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]/'data/references/harmonie/2026'

def encoded(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n'
def page(s):return s['sourceFile'],s['sourcePage'],s['sourceSha256']

def build(triage,ranking,decisions):
    result=copy.deepcopy(triage); lookup={u['reviewUnitId']:u for u in result['units']}
    def score(p):return sum(lookup[i]['triageClass'] in ('document_check_required','singleton_direct_check') for i in p['reviewUnitIds'])
    ranked=sorted(ranking['pageCoverage'],key=lambda p:(-score(p),p['sourceFile'],p['sourcePage']))
    selected=ranked[:20]; assert len(decisions['pages'])==20
    assert [page(p) for p in decisions['pages']]==[page(p) for p in selected]
    notes={page(p):p['visualReviewNote'] for p in decisions['pages']}
    accepted={a['reviewUnitId']:a for a in decisions['accepted']};assert len(accepted)==len(decisions['accepted'])
    verified=[];covered=[];own_covered=[]
    for u in result['units']:
        uid=u['reviewUnitId']; own=[s for s in u['sources'] if page(s) in notes]
        recommended=any(uid in p['reviewUnitIds'] for p in selected)
        if recommended:covered.append(uid)
        if own:own_covered.append(uid)
        rule=next(r for r in u['observedRules'] if r['reviewUnitId']==uid)
        if uid in accepted:
            a=accepted[uid]
            assert len(u['references'])==1 and u['references']==[a['reference']]
            assert a['reference'].startswith(('PSI','PLI')) and a['category']==u['semanticKey']['category']
            assert a['sources']==u['sources'] and len(own)==len(u['sources'])
            assert a['status']=='verified' and a['verifiedBy']=='document_review_2026' and not a['openDivergences']
            assert isinstance(a['value'],(int,float)) and a['unit'] and a['condition']
            verified.append({**a,'family':u['semanticKey']['family'],'regime':u['semanticKey']['regime'],
                             'candidateIds':u['candidateIds'],'originalObservedRule':rule})
            review=dict(status='verified',verifiedBy='document_review_2026',reason='Valeur, prestation et conditions confrontées à la page propre ; validation limitée à la référence indiquée.',sources=own)
        else:
            benefit=u['semanticKey']['benefit'].casefold()
            if not own:
                reason='Aucune occurrence propre contrôlée dans les 20 pages ; une éventuelle page comparatrice ne valide pas cette référence.'
            elif 'parodont' in benefit:
                reason='Forfait imprimé lisible, mais remboursement limité à des actes CCAM avec regroupement TDS ; liste externe non consultée, périmètre des actes non confirmé.'
            elif u['semanticKey']['category'] in ("services d'assistance",'accompagnement personnalisé affection longue durée'):
                reason='Cellules de services/plafonds partagées et conditions détaillées renvoyées à une notice non lue ; ne pas individualiser le montant.'
            elif 'optique'==u['semanticKey']['category'] and any(w in benefit for w in ('simple','complexe','verre')):
                reason='Distinction réseau/hors réseau et/ou classe de verre dépendante des renvois ; définition page suivante non lue. Ne pas valider le libellé incomplet.'
            elif rule['calculationMode']=='compound_or_ambiguous' or '%' in rule['rawValue']:
                reason='Le candidat fusionne composantes AMO/TM/dépassement, alternatives ou glyphes. La page distingue les composantes ; mode/valeur normalisés non corrigés dans cette unité, réserve maintenue.'
            elif 'remboursement intégral' in rule['rawValue']:
                reason='Mention imprimée conditionnelle au panier et limites réglementaires ; le champ valeur ne documente pas une garantie inconditionnelle.'
            elif len(own)<len(u['sources']):
                reason='Occurrence propre lisible, mais autres occurrences/références de cette unité non contrôlées ; aucune propagation autorisée.'
            else:
                reason='Montant ou service visible, mais réserve de contexte, plafond ou condition non levée pour cette unité ; aucune approbation explicite dans le registre documentaire.'
            review=dict(status='needs_review',verifiedBy=None,reason=reason,sources=own)
        review['pageFindings']=[dict(sourceFile=p[0],sourcePage=p[1],sourceSha256=p[2],observation=notes[p]) for p in sorted({page(s) for s in own})]
        u['documentReview']=review
    verified.sort(key=lambda a:a['reviewUnitId'])
    result['documentReviewLot']='2F1';result['verified']=len(verified)
    report=dict(lot='2F1',pagesReviewed=[dict(**p,targetYield=score(p),observation=notes[page(p)]) for p in selected],
                pageRanking=[dict(sourceFile=p['sourceFile'],sourcePage=p['sourcePage'],sourceSha256=p['sourceSha256'],targetYield=score(p)) for p in ranked],
                recommendedUnitsCovered=len(covered),ownSourceUnitsReviewed=len(own_covered),verifiedUnits=len(verified),
                ambiguousReviewedUnits=len(set(own_covered)-set(accepted)),remainingUnits=len(lookup)-len(verified),
                coveredUnitIds=sorted(covered),ownSourceUnitIds=sorted(own_covered),
                reviewCoveragePercent=round(100*len(own_covered)/len(lookup),2),
                validationCoveragePercent=round(100*len(verified)/len(lookup),2),
                notExtractedExcluded=560,scope='20 pages seulement ; aucune validation entre références ; les candidats sources restent inchangés.')
    return result,dict(lot='2F1',guarantees=verified,verified=len(verified)),report


def load():
    return [json.loads((ROOT/n).read_text()) for n in ('review-triage.json','review-triage-report.json','document-review-decisions.json')]

if __name__=='__main__':
    data,verified,report=build(*load())
    for name,value in [('review-triage.json',data),('verified-guarantees.json',verified),('document-review-report.json',report)]: (ROOT/name).write_text(encoded(value))
    print({k:report[k] for k in ('recommendedUnitsCovered','ownSourceUnitsReviewed','verifiedUnits','ambiguousReviewedUnits','remainingUnits')})
