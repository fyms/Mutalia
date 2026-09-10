import "server-only";
import { getHouseholdById } from "./households";
import { getDossiers } from "./dossierService";
import { getPrestations,getDevisPec,getCotisations,createStoredContact,createStoredComplaint,updateStoredComplaint,HouseholdEditError } from "@/lib/store/runtimeStore";
import { ContactInputSchema,ComplaintInputSchema,ComplaintUpdateSchema,type RelationLink } from "./relationAdherent";
export function getRelationLinks(owner:string):RelationLink[] {
 return [
 ...getPrestations(owner).map(p=>({key:`prestation:${p.id}`,householdId:p.householdId,label:`Prestation — ${p.act} (${p.careDate})`,href:`/prestations#${p.id}`,type:"Prestation" as const})),
 ...getDevisPec(owner).map(p=>({key:`pec:${p.id}`,householdId:p.householdId,label:`${p.kind === "devis" ? "Devis" : "PEC"} — ${p.act}`,href:`/pec-devis#${p.id}`,type:"PEC / Devis" as const})),
 ...getCotisations(owner).map(p=>({key:`cotisation:${p.id}`,householdId:p.householdId,label:`Cotisation — ${p.period}`,href:`/cotisations#${p.id}`,type:"Cotisation" as const})),
 ...getDossiers(owner).map(p=>({key:`dossier:${p.id}`,householdId:p.householdId,label:`Dossier — ${p.type}`,href:`/dossiers#${p.id}`,type:"Dossier" as const})),
 ];
}
function name(owner:string,id:string) {
 const h=getHouseholdById(id,owner);if(!h)throw new HouseholdEditError("Adhérent introuvable.");return `${h.adherent.first_name} ${h.adherent.last_name}`;
}
export function createContact(owner:string,raw:unknown) {
 const input=ContactInputSchema.parse(raw);return createStoredContact(owner,{...input,adherentName:name(owner,input.householdId)});
}
export function createComplaint(owner:string,raw:unknown) {
 const input=ComplaintInputSchema.parse(raw);const adherentName=name(owner,input.householdId);
 const link=input.linkKey ? getRelationLinks(owner).find(l=>l.key===input.linkKey&&l.householdId===input.householdId) : undefined;
 if(input.linkKey && !link)throw new HouseholdEditError("Rattachement introuvable pour cet adhérent et ce compte.");
 return createStoredComplaint(owner,{...input,adherentName,link});
}
export function updateComplaint(owner:string,id:string,revision:number,raw:unknown) {
 return updateStoredComplaint(owner,id,revision,ComplaintUpdateSchema.parse(raw));
}
