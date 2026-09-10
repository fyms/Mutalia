/** Transcription ciblée des PDF du dépôt, édition au 01/01/2026, page 1.
 * Les options 405 incluent la Base : leurs taux ne s'additionnent jamais.
 * Périmètre volontairement limité aux lignes hospitalisation en % BR.
 */
export interface Convention {
  idcc: string;
  label: string;
  year: number;
  levels: readonly string[];
  file: string;
  conditions: string;
  benefits: readonly { id: string; label: string; rates: readonly number[] }[];
}
export const CONVENTIONS: readonly Convention[] = [
  {
    idcc: "405", label: "Sanitaire, social et médico-social", year: 2026,
    levels: ["Base", "Option 1", "Option 2"], file: "CCN 65 TG-TC 2026 v2.pdf",
    conditions: "Taux Sécurité sociale incluse ; les options incluent aussi la Base. Ne pas additionner Base et Option. Exclusions de séjour : cures médicales en établissements de personnes âgées, ateliers thérapeutiques, instituts ou centres médicaux éducatifs, psycho-pédagogiques et professionnels, centres de rééducation professionnelle, longs séjours et établissements pour personnes âgées (page 1). Consulter aussi les conditions générales du tableau avant application.",
    benefits: [
      {id: "sejour-conventionne", label: "Frais de séjour conventionnés", rates: [150,200,300]},
      {id: "sejour-non-conventionne", label: "Frais de séjour non conventionnés", rates: [100,100,100]},
      {id: "honoraires-dptm", label: "Honoraires hospitaliers — signataires DPTM", rates: [170,220,300]},
      {id: "honoraires-hors-dptm", label: "Honoraires hospitaliers — non signataires DPTM", rates: [150,200,200]},
      {id: "honoraires-non-conventionnes", label: "Honoraires hospitaliers non conventionnés", rates: [100,100,100]},
    ],
  },
  {
    idcc: "2691", label: "Enseignement privé indépendant", year: 2026,
    levels: ["A", "B", "C", "D"], file: "Tableau_garantie_CCN_EPI.pdf",
    conditions: "Taux Sécurité sociale incluse, limités aux frais engagés. Respect des contrats responsables et prise en charge minimale du ticket modérateur pour les actes remboursés. DPTM : OPTAM ou OPTAM-CO ; vérifier l'adhésion du praticien (notes page 3). Les autres postes, forfaits et exclusions ne sont pas calculés ici.",
    benefits: [
      {id: "sejour", label: "Frais de séjour conventionnés ou non", rates: [100,100,100,100]},
      {id: "honoraires-dptm", label: "Honoraires hospitaliers — adhérent DPTM", rates: [100,150,175,200]},
      {id: "honoraires-hors-dptm", label: "Honoraires hospitaliers — non adhérent DPTM", rates: [100,130,155,180]},
    ],
  },
];
export function getConvention(idcc: string) {
  return CONVENTIONS.find(c => c.idcc === idcc);
}
