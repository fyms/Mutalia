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
export function createPedagogicalGrid(formulas: readonly {key: string}[]): PedagogicalPricingConfig[] {
  return formulas.map((formula, index) => ({
    year: 2026, formulaKey: formula.key, baseMonthlyRate: 30 + index * 2,
    ageBands: [
      {maxAge: 25, coefficient: 1, label: "0–25 ans"},
      {maxAge: 40, coefficient: 1.15, label: "26–40 ans"},
      {maxAge: 55, coefficient: 1.35, label: "41–55 ans"},
      {maxAge: 70, coefficient: 1.65, label: "56–70 ans"},
      {maxAge: 130, coefficient: 2, label: "71 ans et plus"},
    ],
    spouseRule: 1, childRule: 0.35,
    regimeCoefficient: formula.key.startsWith("regime_local:") ? 0.9 : 1,
    zoneCoefficient: 1, version: "pedagogical-2026-v1", source: PRICING_SOURCE,
  }));
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
