import { z } from "zod";
import { DATA_TO_VERIFY } from "./constants";
export const ANOMALY_SEVERITIES = ["Bloquante", "Majeure", "Mineure"] as const;
export const ANOMALY_STATUSES = ["À analyser", "En cours", "Résolue"] as const;
export const AnomalyUpdateSchema = z.object({status:z.enum(ANOMALY_STATUSES), resolution:z.string().trim().max(3000)});
export interface OperationalAnomaly {
  id:string; prestationId?:string; quoteId?:string; dossierId:string; householdId:string; adherentName:string;
  type:string; severity:typeof ANOMALY_SEVERITIES[number]; status:typeof ANOMALY_STATUSES[number];
  cause:string; impact:string; recommendation:string; conditionActive:boolean;
  createdAt:string; updatedAt:string; revision:number; resolution:string;
  history:{at:string; status:typeof ANOMALY_STATUSES[number]; event:string; resolution:string}[];
}
export function describeControl(message:string) {
  if(message === DATA_TO_VERIFY) return {code:"contract",type:"Donnée contractuelle à vérifier",cause:DATA_TO_VERIFY,impact:"Calcul et validation impossibles sans garantie contrôlée.",recommendation:"Compléter et contrôler la garantie, les droits et la référence documentaire dans la source liée."};
  if(message.startsWith("AMO supérieure")) return {code:"amo",type:"Incohérence AMO / facturé",cause:message,impact:"Le résultat ne peut pas être retenu pour la liquidation.",recommendation:"Contrôler le montant facturé, la BRSS et le taux AMO, puis relancer le calcul."};
  if(message.startsWith("Soins antérieurs")) return {code:"dates",type:"Date de soins / adhésion",cause:message,impact:"Validation bloquée tant que les dates et droits ne sont pas cohérents.",recommendation:"Vérifier les dates de soins et d’adhésion dans les données de l’exercice, puis corriger la source erronée."};
  return {code:`control-${encodeURIComponent(message)}`,type:"Contrôle de prestation",cause:message,impact:"Le contrôle de la prestation est bloqué.",recommendation:"Examiner le contrôle signalé dans la prestation ; ne pas supposer une règle contractuelle."};
}
export function filterOperationalAnomalies(rows:OperationalAnomaly[], filters:{severity?:string;status?:string;type?:string}) {
  return rows.filter(a=>(!filters.severity || a.severity===filters.severity)&&(!filters.status || a.status===filters.status)&&(!filters.type || a.type===filters.type))
    .sort((a,b)=>ANOMALY_SEVERITIES.indexOf(a.severity)-ANOMALY_SEVERITIES.indexOf(b.severity)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
}
