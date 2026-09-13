import { individualCatalog2026 as catalog } from "@/lib/data/harmonie/individualCatalog";
import { PEDAGOGICAL_PRICING_ORDER_2026, PEDAGOGICAL_PRICING_VERSION } from "./pedagogicalPricingOrder2026";
import { activeAt, type HouseholdLifecycle } from "./householdLifecycle";

export const PRICING_NOTICE = "Estimation pédagogique — tarif non contractuel";
export const PRICING_SOURCE = "pedagogical_estimator" as const;
export interface PedagogicalPricingConfig {
  year: number; formulaKey: string; baseMonthlyRate: number;
  ageBands: {maxAge: number; coefficient: number; label: string}[];
  spouseRule: number; childRule: number; regimeCoefficient: number;
  zoneCoefficient: number; version: string; source: typeof PRICING_SOURCE;
}
/** Internal fictional assumptions. Order is supplied by the existing canonical catalogue,
 * never inferred from PSI/PLI digits. No equivalence between product keys. */
export type PricingProduct = {reference:string;family:string;regime:string};
export function createPedagogicalGrid(products: readonly PricingProduct[] = catalog.listProducts()): PedagogicalPricingConfig[] {
  if(new Set(products.map(p=>p.reference)).size!==products.length)throw new Error("Références tarifaires dupliquées.");
  return products.map(product => {
    const index=(PEDAGOGICAL_PRICING_ORDER_2026 as readonly string[]).indexOf(product.reference);
    if(index<0)throw new Error("Référence absente de l’ordre pédagogique versionné.");
    if((product.regime==='Régime local'&&!product.reference.startsWith('PLI'))||(product.regime==='Régime général'&&!product.reference.startsWith('PSI')))throw new Error("Référence incompatible avec le régime du catalogue.");
    return {
    year: 2026, formulaKey: product.reference, baseMonthlyRate: 30 + index * 2,
    ageBands: [
      {maxAge: 25, coefficient: 1, label: "0–25 ans"},
      {maxAge: 40, coefficient: 1.15, label: "26–40 ans"},
      {maxAge: 55, coefficient: 1.35, label: "41–55 ans"},
      {maxAge: 70, coefficient: 1.65, label: "56–70 ans"},
      {maxAge: 130, coefficient: 2, label: "71 ans et plus"},
    ],
    spouseRule: 1, childRule: 0.35,
    regimeCoefficient: product.regime === "Régime local" ? 0.9 : 1,
    zoneCoefficient: 1, version: PEDAGOGICAL_PRICING_VERSION, source: PRICING_SOURCE,
  };});
}
export interface PricingMember {id: string; name: string; birthDate: string; role: "adherent" | "conjoint" | "enfant";}
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function estimatePedagogicalPricing(config: PedagogicalPricingConfig, input: {
  date: string; members: PricingMember[]; lifecycle?: HouseholdLifecycle; postalCode?: string;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || new Date(input.date).toISOString().slice(0,10) !== input.date || Number(input.date.slice(0,4)) !== config.year) throw new Error("Date hors période du barème pédagogique.");
  if (!activeAt(input.lifecycle?.adherent, input.date)) throw new Error("Adhésion inactive à la date du calcul.");
  if (input.members.filter(m => m.role === "adherent").length !== 1) throw new Error("Titulaire requis.");
  const lines = input.members.filter(m => m.role === "adherent" || activeAt(input.lifecycle?.beneficiaries[m.id], input.date)).map(member => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(member.birthDate) || new Date(member.birthDate).toISOString().slice(0,10) !== member.birthDate || member.birthDate > input.date) throw new Error("Date de naissance à vérifier.");
    const age = Number(input.date.slice(0,4)) - Number(member.birthDate.slice(0,4)) - (input.date.slice(5) < member.birthDate.slice(5) ? 1 : 0);
    const band = config.ageBands.find(b => age <= b.maxAge);
    if (!band) throw new Error("Âge hors barème pédagogique.");
    const roleCoefficient = member.role === "enfant" ? config.childRule : member.role === "conjoint" ? config.spouseRule : 1;
    const monthly = round(config.baseMonthlyRate * band.coefficient * roleCoefficient * config.regimeCoefficient * config.zoneCoefficient);
    return {...member, age, ageBand: band.label, ageCoefficient: band.coefficient, roleCoefficient, monthly};
  });
  const monthly = round(lines.reduce((sum, line) => sum + line.monthly, 0));
  return {pricingSource: PRICING_SOURCE, notice: PRICING_NOTICE, date: input.date, config, postalCode: input.postalCode ?? null, lines, monthly, annual: round(monthly * 12)};
}

/** Pricing-only compatibility. Never use this resolver for documentary guarantees. */
export function resolveCanonicalPricingReference(key:string,products:readonly PricingProduct[]=catalog.listProducts()):string {
 const parts=key.trim().split(':');if(parts.length>2)throw new Error('Formule tarifaire invalide.');
 const group=parts.length===2?parts[0]:undefined,reference=parts.at(-1)!.replace(/\s/g,'');
 const sameFamily=(p:PricingProduct)=>group===undefined?true:group==='regime_general'?p.family==='Particuliers'&&p.regime==='Régime général':group==='regime_local'?p.family==='Particuliers'&&p.regime==='Régime local':group==='reflexe_eco_pharmacie'?p.family==='Particuliers — Réflexe eco Pharmacie':group==='reflexe_eco_pharmacie_et_chambre'?p.family==='Particuliers — Réflexe eco Pharmacie + chambre particulière':false;
 // Only the historical local PSI spelling has an explicitly authorized alias.
 const localAlias=group==='regime_local'&&/^PSI[0-9]+$/.test(reference)?reference.replace(/^PSI/,'PLI'):undefined;
 const matches=products.filter(p=>sameFamily(p)&&(p.reference===reference||p.reference===localAlias));
 if(matches.length!==1)throw new Error(matches.length?'Correspondance tarifaire ambiguë.':'Aucune correspondance tarifaire canonique dans cette famille/régime.');
 return matches[0].reference;
}
export function getCanonicalPricingConfig(key:string):PedagogicalPricingConfig {
 const reference=resolveCanonicalPricingReference(key),config=createPedagogicalGrid().find(c=>c.formulaKey===reference);
 if(!config)throw new Error('Référence sans correspondance tarifaire pédagogique explicite.');return config;
}
