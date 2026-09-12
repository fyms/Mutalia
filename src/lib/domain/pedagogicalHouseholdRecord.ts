import { getAllCases, getHarmonieReferential } from "@/lib/data/loaders";
import type { ManualHousehold } from "./manualHouseholds";
export function pedagogicalFormula(id: string) {
 let hash = 0;
 for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
 const formulas = getHarmonieReferential().canonical_2026_architecture.regime_general;
 return formulas[hash % formulas.length];
}
/** Form seed only: missing source coordinates remain empty, never fabricated. */
export function pedagogicalHouseholdRecord(id: string): ManualHousehold | undefined {
 const seed = getAllCases().find(c => c.household.household_id === id);
 const holder = seed?.household.members.find(m => m.role === "adherent");
 if (!seed || !holder) return;
 return {id, memberId:holder.member_id, source:"pedagogical", referenceYear:2026, revision:0,
  createdAt:"", updatedAt:"", deletedAt:null, firstName:holder.first_name,lastName:holder.last_name,birthDate:holder.birth_date,
  email:"",phone:"",address:"",postalCode:"",city:"",effectiveDate:"",formulaKey:`regime_general:${pedagogicalFormula(id).formula}`,
  beneficiaries:seed.household.members.filter(m=>m.role!=="adherent").map(m=>({id:m.member_id,firstName:m.first_name,lastName:m.last_name,birthDate:m.birth_date,role:m.role as "conjoint"|"enfant"}))};
}
