"""Diagnose recorded reservations only; never reads documents or modifies guarantees."""
import json
import re
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'data/references/harmonie/2026'
INPUTS=('document-review-report.json','verified-guarantees.json','review-triage.json','extraction-candidates.json')
CAUSES=('extraction_mismatch','compound_value','condition_or_limit_ambiguous','label_mapping_issue','multiple_values_on_same_line','insufficient_source_context','genuine_contractual_ambiguity','other')
def encoded(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n'
def load():return [json.loads((ROOT/n).read_text()) for n in INPUTS]

def build(report,verified,triage,candidates):
    approved={g['reviewUnitId'] for g in verified['guarantees']}
    assert len(approved)==17 and verified['verified']==17
    lookup={r['id']:r for r in candidates['guarantees']}
    reservations=[]
    for u in triage['units']:
        review=u['documentReview']
        if review['status']!='needs_review' or not review['sources']:continue
        assert u['reviewUnitId'] not in approved
        raw='\n'.join(lookup[s['id']]['rawValue'] for s in review['sources'])
        reason=review['reason'];benefit=u['semanticKey']['benefit']
        if 'glyphes' in reason:
            if re.search(r'%%|\d{4,}\s*%',raw):
                cause='extraction_mismatch'; detail='Glyphes/taux superposés dans le texte extrait, confirmés comme composantes séparées par le compte rendu de page.'
            elif len(benefit)<65 and ('non adhérents' in benefit or '• adhérents' in benefit):
                cause='label_mapping_issue';detail='Libellé OPTAM incomplet : rattachement à l’acte parent absent ou insuffisant ; plusieurs actes possibles.'
            elif re.search(r'\bou\b',raw,re.I) or ('%' in raw and '€' in raw):
                cause='multiple_values_on_same_line';detail='Alternatives ou unités hétérogènes sur une ligne ; une valeur scalaire ne représente pas la règle.'
            else:
                cause='compound_value';detail='Parts AMO/TM/dépassement ou prise en charge AMO seule non représentées séparément.'
        elif 'classe de verre' in reason:
            cause='label_mapping_issue';detail='Classe de verre et réseau nécessitent le parent exact et les définitions renvoyées à une page non lue.'
        elif 'CCAM' in reason or 'notice' in reason:
            cause='insufficient_source_context';detail='Périmètre des actes ou conditions détaillées dans une source externe non consultée ; montant seul insuffisant.'
        elif 'conditionnelle au panier' in reason:
            cause='condition_or_limit_ambiguous';detail='Remboursement intégral soumis au panier et aux limites réglementaires ; absence de règle inconditionnelle confirmée.'
        elif 'autres occurrences' in reason:
            cause='insufficient_source_context';detail='Une partie seulement des références/occurrences a été lue ; interdiction de validation croisée.'
        else:
            cause='other';detail=reason
        complete={s['id'] for s in review['sources']}==set(u['candidateIds'])
        technical=cause in ('extraction_mismatch','compound_value','multiple_values_on_same_line')
        # Page notes can support targeted restructuring, never automatic verification.
        possible=technical and complete and bool(review['pageFindings'])
        reservations.append(dict(reviewUnitId=u['reviewUnitId'],cause=cause,explanation=detail,
            originalReservation=reason,category=u['semanticKey']['category'],benefit=benefit,
            references=u['references'],candidateIds=u['candidateIds'],reviewedSources=review['sources'],
            recordedEvidence=review['pageFindings'],allOccurrencesReviewed=complete,
            technicalCorrectionPossible=technical, potentiallyResolvableWithoutPdf=possible,
            newDocumentaryEvidenceRequired=not possible,
            potentiallyVerifiableAfterCorrection=possible,
            assessmentLimit='Potentiel à confirmer après correction et contrôle des conditions enregistrées ; aucune validation accordée.',
            remainingBlocker=None if possible else 'Contexte ou référence non contrôlé ; les résultats enregistrés ne suffisent pas à lever toute la réserve.'))
    assert len(reservations)==report['ambiguousReviewedUnits']==287
    assert len({r['reviewUnitId'] for r in reservations})==287
    pages=defaultdict(set)
    for r in reservations:
        for s in r['reviewedSources']:pages[(s['sourceFile'],s['sourcePage'],s['sourceSha256'])].add(r['reviewUnitId'])
    counts=Counter(r['cause'] for r in reservations)
    summary=dict(total=287,byCause={c:counts[c] for c in CAUSES},
        potentiallyResolvableWithoutPdf=sum(r['potentiallyResolvableWithoutPdf'] for r in reservations),
        newDocumentaryEvidenceRequired=sum(r['newDocumentaryEvidenceRequired'] for r in reservations),
        technicalCorrectionCandidates=sum(r['technicalCorrectionPossible'] for r in reservations),
        potentiallyNewVerifiedUnits=sum(r['potentiallyVerifiableAfterCorrection'] for r in reservations),
        potentialMeaning='Plafond de candidats techniques à réévaluer, pas une promesse de validation. Une note de page ne remplace pas une preuve absente.',
        documentaryMeaning='Besoin de preuve supplémentaire : page propre d’une référence non contrôlée, définition, liste CCAM ou notice ; pas nécessairement relecture des mêmes pages.',
        byCategory=dict(Counter(r['category'] for r in reservations)),
        problematicBenefits=[dict(benefit=b,reservations=n) for b,n in Counter(r['benefit'] for r in reservations).most_common(15)],
        problematicPages=[dict(sourceFile=p[0],sourcePage=p[1],sourceSha256=p[2],reservations=len(ids)) for p,ids in sorted(pages.items(),key=lambda item:(-len(item[1]),item[0]))],
        minimalTechnicalCorrections=[
            'Pour les seuls glyphes superposés documentés : conserver le brut et créer des composantes explicites à partir des observations déjà enregistrées ; ne jamais corriger les chiffres par simple suppression de caractères.',
            'Séparer AMO, TM et dépassement/forfait ; représenter explicitement les alternatives au lieu de les additionner ; conserver unités, plafonds et conditions.',
            'Limiter la reprise aux occurrences dont toutes les pages ont été contrôlées ; bloquer tout transfert PSI/PLI ou entre références.',
            'Ne pas tenter de résoudre par normalisation les libellés sans parent, les définitions optiques, notices et listes CCAM absentes.'],
        verifiedUnchanged=17,newVerified=0)
    return dict(reservations=reservations,newVerified=0),summary

if __name__=='__main__':
    data,report=build(*load())
    for n,x in [('review-reservations-analysis.json',data),('review-reservations-report.json',report)]: (ROOT/n).write_text(encoded(x))
    print({k:report[k] for k in ('byCause','potentiallyResolvableWithoutPdf','newDocumentaryEvidenceRequired','potentiallyNewVerifiedUnits')})
