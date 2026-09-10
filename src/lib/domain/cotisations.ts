import { z } from "zod";
const amount=z.number().positive().max(1000000).refine(n=>Math.abs(n*100-Math.round(n*100))<0.000001,"Deux décimales maximum.");
export const CotisationInputSchema=z.object({householdId:z.string().min(1),period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/,"Période attendue : AAAA-MM."),amount,dueDate:z.iso.date()});
export const CotisationEntrySchema=z.object({kind:z.enum(["payment","adjustment"]),amount,date:z.iso.date().refine(d=>d<=new Date().toISOString().slice(0,10),"Date future interdite."),reason:z.string().trim().min(3).max(1000)});
export const COTISATION_STATUSES=["À venir","Réglée","Partielle","Impayée","Régularisée"] as const;
export interface Cotisation {
 id:string;householdId:string;adherentName:string;period:string;expectedCents:number;dueDate:string;
 revision:number;createdAt:string;updatedAt:string;dossierId?:string;
 entries:{id:string;kind:"payment"|"adjustment";cents:number;date:string;reason:string;createdAt:string}[];
}
export function cotisationSummary(p:Cotisation,today=new Date().toISOString().slice(0,10)) {
 const paid=p.entries.filter(e=>e.kind==="payment").reduce((s,e)=>s+e.cents,0);
 const adjusted=p.entries.filter(e=>e.kind==="adjustment").reduce((s,e)=>s+e.cents,0);
 const balance=p.expectedCents-paid-adjusted;
 const overdue=balance>0 && p.dueDate<today;
 const status:typeof COTISATION_STATUSES[number]=balance===0 ? adjusted>0 ? "Régularisée" : "Réglée" : paid+adjusted>0 ? "Partielle" : overdue ? "Impayée" : "À venir";
 return {paid,adjusted,balance,overdue,status};
}
