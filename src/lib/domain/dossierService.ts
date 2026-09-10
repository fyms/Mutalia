import { cotisationSummary } from "./cotisations";
import "server-only";
import { getAllHouseholds } from "./households";
import { getComplaints, getCotisations, getDevisPec, getOperationalAnomalies, getPrestations, getDossierStates, saveDossierState } from "@/lib/store/runtimeStore";
import { sortDossiers, type Dossier, type DossierState } from "./dossiers";
const examples = [
  {type: "Contrôle d’adhésion", status: "À traiter", priority: "Normal", anomaly: null},
  {type: "Complétude des pièces", status: "Incomplet", priority: "Urgent", anomaly: "Pièce justificative manquante (simulation)"},
  {type: "Suivi de demande", status: "En attente", priority: "Normal", anomaly: null},
  {type: "Vérification documentaire", status: "À traiter", priority: "Urgent", anomaly: "Lisibilité à vérifier (simulation)"},
  {type: "Mise à jour des coordonnées", status: "Terminé", priority: "Faible", anomaly: null},
  {type: "Contrôle administratif", status: "À traiter", priority: "Faible", anomaly: null},
] satisfies Array<Pick<Dossier, "type" | "status" | "priority" | "anomaly">>;
const nextActions: Record<DossierState["status"], string> = {
  "À traiter": "Ouvrir la fiche et contrôler le dossier",
  "En attente": "Suivre le retour de l’adhérent",
  "Incomplet": "Vérifier les pièces à compléter",
  "Terminé": "Aucune action requise",
};
export function getDossiers(owner: string): Dossier[] {
  const anomalies = getOperationalAnomalies(owner);
  const cotisations = getCotisations(owner);
  const states = getDossierStates(owner);
  const households = getAllHouseholds(owner);
  const base: Dossier[] = households.map((h, i) => {
    const id = `DOS-${h.householdId}`;
    const example = h.case ? examples[i % examples.length] : examples[0];
    const state = states[id] ?? {status: example.status, priority: example.priority, revision: 0};
    return {...example, ...state, id, householdId: h.householdId,
      adherent: `${h.adherent.first_name} ${h.adherent.last_name}`,
      createdAt: h.case ? new Date(Date.UTC(2026, 8, 1 + i % 7)).toISOString() : h.manual.createdAt,
      anomaly: state.status === "Terminé" ? null : example.anomaly ?? (state.status === "Incomplet" ? "Pièces à compléter (simulation)" : null),
      nextAction: nextActions[state.status],
    };
  });
  const prestations: Dossier[] = getPrestations(owner).map(p => {
    const h = households.find(h => h.householdId === p.householdId);
    const pendingResolution = anomalies.some(a => a.prestationId === p.id && a.status !== "Résolue");
    const state = states[p.dossierId] ?? {status:"À traiter" as const,priority:"Normal" as const,revision:0};
    return {...state,id:p.dossierId,householdId:p.householdId,
      adherent:h ? `${h.adherent.first_name} ${h.adherent.last_name}` : p.adherentName,
      type:`Prestation — ${p.act}`,createdAt:p.createdAt,anomaly:p.anomalies.join(" · ") || (pendingResolution ? "Résolution d’anomalie à documenter" : null),
      nextAction:p.anomalies.length ? "Compléter le contrôle de la prestation" : pendingResolution ? "Documenter la résolution dans Flux & Anomalies" : ["Validée","Payée","Clôturée"].includes(p.status) ? "Contrôle terminé" : "Contrôler puis liquider la prestation",
    };
  });
  const quotes:Dossier[]=getDevisPec(owner).map(p=>{
    const h=households.find(h=>h.householdId===p.householdId);
    const state=states[p.dossierId] ?? {status:"À traiter" as const,priority:"Normal" as const,revision:0};
    const pending=anomalies.some(a=>a.quoteId===p.id && a.status!=="Résolue");
    return {...state,id:p.dossierId,householdId:p.householdId,adherent:h ? `${h.adherent.first_name} ${h.adherent.last_name}` : p.adherentName,
      type:`${p.kind === "devis" ? "Devis" : "PEC"} — ${p.act}`,createdAt:p.createdAt,
      anomaly:state.status === "Terminé" ? null : p.anomalies.join(" · ") || (pending ? "Résolution d’anomalie à documenter" : null),
      nextAction:state.status === "Terminé" ? "Aucune action requise" : pending && !p.anomalies.length ? "Documenter la résolution dans Flux & Anomalies" : "Contrôler la demande dans PEC & Devis"};
  });
  const dues:Dossier[]=cotisations.filter(p=>p.dossierId).map(p=>{
    const summary=cotisationSummary(p),h=households.find(h=>h.householdId===p.householdId);
    return {...states[p.dossierId!],id:p.dossierId!,householdId:p.householdId,adherent:h ? `${h.adherent.first_name} ${h.adherent.last_name}` : p.adherentName,
      type:`Cotisation pédagogique — ${p.period}`,createdAt:p.createdAt,anomaly:summary.overdue ? "Solde impayé après échéance" : null,
      nextAction:summary.overdue ? "Enregistrer le règlement ou la régularisation dans Cotisations" : "Aucune action requise"};
  });
  const complaints:Dossier[]=getComplaints(owner).map(p=>{
    const h=households.find(h=>h.householdId===p.householdId);
    return {...states[p.dossierId],id:p.dossierId,householdId:p.householdId,adherent:h ? `${h.adherent.first_name} ${h.adherent.last_name}` : p.adherentName,
      type:`Réclamation — ${p.reason}`,createdAt:`${p.receivedDate}T00:00:00.000Z`,anomaly:null,
      nextAction:["Résolue","Clôturée"].includes(p.status) ? "Aucune action requise" : p.status==="En attente adhérent" ? "Suivre le retour de l’adhérent" : "Traiter la réclamation dans Relation adhérent"};
  });
  return sortDossiers([...base,...prestations,...quotes,...dues,...complaints]);
}
export function updateDossier(owner: string, id: string, revision: number, raw: unknown) {
  if (!getDossiers(owner).some(d => d.id === id)) throw new Error("Dossier introuvable.");
  return saveDossierState(owner, id, revision, raw);
}
