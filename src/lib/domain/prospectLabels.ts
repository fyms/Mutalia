/** Display-only labels; pricing and persisted role keys remain unchanged. */
export function prospectRoleLabel(role:string,converted=false):string {
 return role==='adherent'?(converted?'Adhérent':'Prospect principal'):role==='conjoint'?'Conjoint / Conjointe':role==='enfant'?'Enfant':role;
}
export const COLLECTIVE_COVERAGE_LABEL='Complémentaire santé collective obligatoire via employeur';
/** Preserve free text and unknown values; translate only the known legacy wording. */
export function currentCoverageLabel(value:string):string {
 return value.replace(/\bmutuelle obligatoire\b/gi,COLLECTIVE_COVERAGE_LABEL);
}
