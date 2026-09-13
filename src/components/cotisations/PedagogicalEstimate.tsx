import { paymentFrequency,estimatedDueAmount } from "@/lib/domain/demoBanking";
import type { HouseholdView } from "@/lib/domain/households";
import { individualCatalog2026 as catalog } from "@/lib/data/harmonie/individualCatalog";
import { PEDAGOGICAL_PRICING_VERSION } from "@/lib/domain/pedagogicalPricingOrder2026";
import { createPedagogicalGrid, getCanonicalPricingConfig, estimatePedagogicalPricing, PRICING_NOTICE } from "@/lib/domain/pedagogicalPricing";
import { formatCurrency } from "@/lib/utils/format";
import { localToday } from "@/lib/domain/appointments";
const roles = {adherent:"Titulaire", conjoint:"Conjoint", enfant:"Enfant"};
export function PedagogicalEstimate({household:h,showPayment=false}: {household: HouseholdView;showPayment?:boolean}) {
  const frequency=paymentFrequency((h.case?h.simulation:h.manual)?.banking?.paymentAccount.paymentFrequency);
  const formulaKey = h.case ? h.simulation?.formulaKey ?? `regime_general:${h.assignedFormula}` : h.manual.formulaKey;
  let result;
  let error = "Formule absente du barème pédagogique.";
  try {
    const config = getCanonicalPricingConfig(formulaKey);
    result = estimatePedagogicalPricing(config, {date: localToday(), lifecycle:h.lifecycle,
      postalCode:h.case ? h.simulation?.postalCode : h.manual.postalCode,
      members:h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`,birthDate:m.birth_date,role:m.role})),
    });
  } catch(e) {error = e instanceof Error ? e.message : "Estimation indisponible.";}
  return <section className="m-panel" aria-label="Estimation cotisation" data-pricing-source="pedagogical_estimator">
    <h2 className="font-semibold">Estimation cotisation</h2><p className="text-sm font-medium mt-1">{PRICING_NOTICE}</p>
    {!result ? <p className="m-help mt-2">{error}</p> : <>
      <ul className="text-sm my-2">{result.lines.map(line=><li className="flex justify-between gap-3 py-1" key={line.id}><span>{roles[line.role]} · {line.name} · {line.age} ans</span><strong>{formatCurrency(line.monthly)}/mois</strong></li>)}</ul>
      <p className="font-semibold">Foyer : {formatCurrency(result.monthly)}/mois · {formatCurrency(result.annual)}/an</p>
      {showPayment&&<dl className="text-sm mt-3 space-y-1"><div><dt>Cotisation mensuelle de référence</dt><dd>{formatCurrency(result.monthly)}</dd></div><div><dt>Périodicité</dt><dd>{frequency}</dd></div><div><dt>Montant estimé à chaque échéance</dt><dd>{formatCurrency(estimatedDueAmount(result.monthly,frequency))}</dd></div></dl>}
      <details className="text-sm mt-3"><summary className="cursor-pointer text-brand">Voir le détail du calcul</summary>
        <p>Hypothèses internes fictives · {result.config.version} · calcul au {result.date} · {result.config.formulaKey}.</p>
        <p>Base formule : {formatCurrency(result.config.baseMonthlyRate)}. Coefficient régime : {result.config.regimeCoefficient}. Zone : {result.config.zoneCoefficient} (neutre, aucune modulation géographique ; code postal {result.postalCode ?? "non renseigné"}).</p>
        {result.lines.map(line=><p key={line.id}>{line.name} : {line.ageBand} · base × âge {line.ageCoefficient} × rôle {line.roleCoefficient} × régime {result.config.regimeCoefficient} × zone {result.config.zoneCoefficient} = {formatCurrency(line.monthly)}. Arrondi par personne à 2 décimales.</p>)}
        <p>Total mensuel = somme des membres actifs ; annuel = mensuel × 12. Aucune échéance créée.</p>
      </details>
    </>}
  </section>;
}
export function PedagogicalFormulaBases() {
  const products = catalog.listProducts(); const grid = createPedagogicalGrid();
  return <details className="m-panel" data-pricing-source="pedagogical_estimator"><summary className="cursor-pointer font-semibold">Références / Formules — bases pédagogiques</summary>
    <p className="text-sm my-2">{PRICING_NOTICE}. Hypothèses internes : progression selon l’ordre canonique, sans classement commercial ni équivalence PSI/PLI.</p>
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th>Référence · famille / régime</th><th>Base pédagogique</th></tr></thead><tbody>{products.map((p,i)=><tr key={p.reference}><td className="py-2">{p.family} · {p.regime} — {p.reference}</td><td>À partir de {formatCurrency(Math.round(grid[i].baseMonthlyRate*grid[i].regimeCoefficient*100)/100)}/mois*</td></tr>)}</tbody></table></div>
    <p className="m-help">* Estimation pédagogique : titulaire seul de 0–25 ans, coefficient régime inclus, zone neutre. Aucun prix par prestation. Source : pedagogical_estimator · version {PEDAGOGICAL_PRICING_VERSION}.</p>
  </details>;
}
