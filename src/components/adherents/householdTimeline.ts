import type { CockpitData } from "@/components/cockpit/Cockpit";
import type { HouseholdLifecycle } from "@/lib/domain/householdLifecycle";
import { STATUS_LABELS,REASON_LABELS } from "@/lib/domain/householdLifecycle";
export interface HouseholdEvent {id:string;at:string;type:string;summary:string;href:string;}
export function householdTimeline(data:CockpitData,householdId:string,lifecycle?:HouseholdLifecycle,names:Record<string,string>={},createdAt?:string) {
 const events:HouseholdEvent[]=[];
 const add=(source:string,id:string,at:string,type:string,summary:string,href:string)=>{if(at)events.push({id:`${source}:${id}:${at}:${summary}`,at,type,summary,href});};
 const href=`/adherents/${householdId}`;
 if(createdAt)add("creation",householdId,createdAt,"Adhésion","Création du foyer",`${href}?tab=vue-generale`);
 data.contacts.filter(p=>p.householdId===householdId).forEach(p=>add("contact",p.id,p.date,p.channel,p.reason,`${href}?tab=contacts`));
 data.appointments.filter(p=>p.householdId===householdId).forEach(p=>{
  add("rdv",p.id,p.updatedAt,"Rendez-vous",`${p.status} · ${p.date} ${p.startTime} · ${p.reason}`,"/agenda");
 });
 for(const [kind,rows,path] of [["Prestation",data.prestations,"/prestations"],["PEC / Devis",data.quotes,"/pec-devis"]] as const)rows.filter(p=>p.householdId===householdId).forEach(p=>{
  const history=p.history.length?p.history:[{at:p.createdAt,status:p.status,event:"Enregistrement"}];
  history.forEach(e=>add(kind,p.id,e.at,kind,`${p.act} · ${e.status} · ${e.event}`,`${path}#${p.id}`));
 });
 const sourceTimes=new Set([...data.prestations,...data.quotes,...data.complaints].filter(p=>p.householdId===householdId).flatMap(p=>p.history.map(e=>e.at)).concat(data.cotisations.filter(p=>p.householdId===householdId).flatMap(p=>[p.createdAt,...p.entries.map(e=>e.createdAt)])));
 const linked=new Set([...data.prestations,...data.quotes,...data.complaints,...data.cotisations].map(p=>p.dossierId));
 data.dossiers.filter(p=>p.householdId===householdId).forEach(p=>{
  if(!p.updatedAt&&createdAt&&p.createdAt===createdAt&&p.id===`DOS-${householdId}`)return;
  // Generated source dossiers share the source event; avoid repeating it.
  if(!linked.has(p.id)||(p.updatedAt&&!sourceTimes.has(p.updatedAt)))add("dossier",p.id,p.updatedAt??p.createdAt,"Dossier",`${p.type} · ${p.status}`,`/dossiers#${p.id}`);
 });
 data.cotisations.filter(p=>p.householdId===householdId).forEach(p=>{
  add("cot",p.id,p.createdAt,"Cotisation",`Échéance créée · ${p.period}`,`/cotisations#${p.id}`);
  p.entries.forEach(e=>add("reglement",e.id,e.date,"Cotisation",`${e.kind==="payment"?"Règlement":"Régularisation"} · ${e.reason}`,`/cotisations#${p.id}`));
 });
 data.complaints.filter(p=>p.householdId===householdId).forEach(p=>p.history.forEach(e=>add("reclamation",p.id,e.at,"Réclamation",`${p.reason} · ${e.status}${e.response?` · ${e.response}`:""}`,`/relation-adherent#${p.id}`)));
 if(lifecycle){
  lifecycle.adherent.history.forEach(e=>add("statut",householdId,e.at,"Adhésion",`${STATUS_LABELS[e.status]} · ${REASON_LABELS[e.endReason]} · effet ${e.endDate}`,`${href}?tab=beneficiaires`));
  Object.entries(lifecycle.beneficiaries).forEach(([id,state])=>state.history.forEach(e=>add("statut",id,e.at,"Bénéficiaire",`${names[id]??id} · ${STATUS_LABELS[e.status]} · ${REASON_LABELS[e.endReason]} · effet ${e.endDate}`,`${href}?tab=beneficiaires`)));
 }
 return [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>b.at.localeCompare(a.at)||a.id.localeCompare(b.id));
}
