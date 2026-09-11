import { eligibleAt } from "./householdLifecycle";
import "server-only";
import { getHouseholdById } from "./households";
import { getPrestations, createStoredPrestation, changeStoredPrestation, HouseholdEditError } from "@/lib/store/runtimeStore";
import { PrestationInputSchema, contractAnomalies, calculatePrestation, nextPrestationStatus, type PrestationInput, type PrestationStatus } from "./prestations";
export function context(owner: string, input: PrestationInput) {
  const h = getHouseholdById(input.householdId, owner);
  const member = h?.household.members.find(m => m.member_id === input.memberId);
  if (!h || !member) throw new HouseholdEditError("Adhérent ou bénéficiaire introuvable pour ce compte.");
  if (!eligibleAt(h.lifecycle,input.memberId,input.careDate)) throw new HouseholdEditError("Adhésion ou bénéficiaire inactif à la date des soins.");
  if (input.careDate < member.birth_date) throw new HouseholdEditError("Date de soins antérieure à la naissance.");
  return {adherentName: `${h.adherent.first_name} ${h.adherent.last_name}`, beneficiaryName: `${member.first_name} ${member.last_name}`,
    anomalies: !h.case && input.careDate < h.manual.effectiveDate ? ["Soins antérieurs à la date d’adhésion : droits à vérifier."] : []};
}
export function receivePrestation(owner: string, raw: unknown) {
  const input = PrestationInputSchema.parse(raw);
  const {anomalies, ...names} = context(owner, input);
  return createStoredPrestation(owner, {...input, ...names, status: "Reçue", result: null, anomalies: [...contractAnomalies(input), ...anomalies]});
}
export function correctPrestation(owner: string, id: string, revision: number, raw: unknown) {
  const input = PrestationInputSchema.parse(raw);
  const {anomalies, ...names} = context(owner, input);
  return changeStoredPrestation(owner, id, revision, p => {
    if (!["Reçue", "À contrôler"].includes(p.status)) throw new HouseholdEditError("Une prestation calculée ne peut plus être modifiée dans cette étape.");
    if (p.householdId !== input.householdId || p.memberId !== input.memberId) throw new HouseholdEditError("L’adhérent et le bénéficiaire d’une prestation reçue ne peuvent pas être remplacés.");
    Object.assign(p, input, names, {guaranteeMode:input.guaranteeMode, guaranteeValue:input.guaranteeValue, result:null, anomalies:[...contractAnomalies(input), ...anomalies]});
    p.history.push({at:new Date().toISOString(), status:p.status, event:"Données de contrôle corrigées"});
  });
}
export function advancePrestation(owner: string, id: string, revision: number, target: PrestationStatus) {
  // Validate the current household before entering the storage transaction.
  const current = getPrestations(owner).find(p => p.id === id);
  if (!current) throw new HouseholdEditError("Prestation introuvable.");
  const checked = context(owner, current);
  return changeStoredPrestation(owner, id, revision, p => {
    if (target !== nextPrestationStatus(p.status)) throw new HouseholdEditError("Transition de statut non autorisée.");
    if (target === "Calculée") {
      const computed = calculatePrestation(p);
      p.anomalies = [...computed.anomalies, ...checked.anomalies];
      p.result = p.anomalies.length ? null : computed.result;
      if (p.anomalies.length) {
        p.history.push({at:new Date().toISOString(), status:p.status, event:"Calcul bloqué : " + p.anomalies.join(" ")});
        return;
      }
    }
    if (["Validée", "Payée", "Clôturée"].includes(target) && (!p.result || p.anomalies.length || checked.anomalies.length))
      throw new HouseholdEditError("Contrôle incomplet : validation impossible.");
    p.status = target;
    p.history.push({at:new Date().toISOString(), status:target, event:target === "Payée" ? "Paiement pédagogique simulé — aucun flux financier" : target});
  });
}
