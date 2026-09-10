import { z } from "zod";
import { DOSSIER_PRIORITIES } from "./dossiers";
export const CONTACT_CHANNELS=["Appel","Email","Courrier","Note interne"] as const;
export const COMPLAINT_STATUSES=["Nouvelle","À analyser","En cours","En attente adhérent","Résolue","Clôturée"] as const;
const pastDate=z.iso.date().refine(d=>d<=new Date().toISOString().slice(0,10),"La date ne peut pas être future.");
export const ContactInputSchema=z.object({householdId:z.string().min(1),date:pastDate,channel:z.enum(CONTACT_CHANNELS),reason:z.string().trim().min(3).max(200),summary:z.string().trim().min(3).max(3000),nextAction:z.string().trim().max(1000).default("")});
export const ComplaintInputSchema=z.object({householdId:z.string().min(1),receivedDate:pastDate,priority:z.enum(DOSSIER_PRIORITIES),reason:z.string().trim().min(3).max(200),description:z.string().trim().min(10).max(5000),linkKey:z.string().max(300).default("")});
export const ComplaintUpdateSchema=z.object({status:z.enum(COMPLAINT_STATUSES),priority:z.enum(DOSSIER_PRIORITIES),response:z.string().trim().max(5000)}).refine(p=>!["Résolue","Clôturée"].includes(p.status)||p.response.length>=10,{message:"Réponse / résolution obligatoire (10 caractères minimum).",path:["response"]});
export interface Contact extends z.infer<typeof ContactInputSchema> {id:string;adherentName:string;createdAt:string;}
export interface RelationLink {key:string;householdId:string;label:string;href:string;type:"Prestation"|"PEC / Devis"|"Cotisation"|"Dossier";}
export interface Complaint extends z.infer<typeof ComplaintInputSchema> {
 id:string;dossierId:string;adherentName:string;link?:RelationLink;status:typeof COMPLAINT_STATUSES[number];response:string;revision:number;createdAt:string;updatedAt:string;
 history:{at:string;status:typeof COMPLAINT_STATUSES[number];priority:typeof DOSSIER_PRIORITIES[number];response:string}[];
}
export function complaintTransitions(status:Complaint["status"]):Complaint["status"][] {
 switch(status){
 case "Nouvelle":return ["Nouvelle","À analyser"];
 case "À analyser":return ["À analyser","En cours","En attente adhérent","Résolue"];
 case "En cours":return ["En cours","En attente adhérent","Résolue"];
 case "En attente adhérent":return ["En attente adhérent","En cours","Résolue"];
 case "Résolue":return ["Résolue","En cours","Clôturée"];
 case "Clôturée":return [];
 }
}
