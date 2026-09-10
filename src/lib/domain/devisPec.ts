import { z } from "zod";
import { PrestationInputSchema, type Prestation } from "./prestations";
export const DevisPecInputSchema = PrestationInputSchema.extend({careDate:z.iso.date(),kind:z.enum(["devis","pec"])});
export const DEVIS_STATUSES = ["Reçu","À analyser","Calculé","Accepté","Refusé","Clôturé"] as const;
export const PEC_STATUSES = ["Demandée","À contrôler","Accordée","Refusée","Clôturée"] as const;
export type DevisPecStatus = typeof DEVIS_STATUSES[number] | typeof PEC_STATUSES[number];
export interface DevisPec extends Omit<Prestation,"status"|"history"> {
  kind:"devis"|"pec"; status:DevisPecStatus; refusalReason:string;
  history:{at:string;status:DevisPecStatus;event:string}[];
}
export function isRefused(p:DevisPec) {return !!p.refusalReason && ["Refusé","Refusée","Clôturé","Clôturée"].includes(p.status);}
export function nextDecisions(p:DevisPec):DevisPecStatus[] {
  if(p.kind === "devis") {
    switch(p.status) {
      case "Reçu":return ["À analyser"];
      case "À analyser":return ["Refusé"];
      case "Calculé":return ["Accepté","Refusé"];
      case "Accepté":case "Refusé":return ["Clôturé"];
      default:return [];
    }
  }
  switch(p.status) {
    case "Demandée":return ["À contrôler"];
    case "À contrôler":return ["Accordée","Refusée"];
    case "Accordée":case "Refusée":return ["Clôturée"];
    default:return [];
  }
}
