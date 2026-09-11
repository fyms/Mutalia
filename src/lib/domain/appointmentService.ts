import "server-only";
import { db } from "@/lib/db";
import { getHouseholdById } from "./households";
import { activeAt } from "./householdLifecycle";
import { AppointmentInputSchema, activeAppointment, localToday } from "./appointments";
import { getAppointments, saveStoredAppointment, linkAppointmentContact, HouseholdEditError } from "@/lib/store/runtimeStore";
import { createContact } from "./relationService";
export function saveAppointment(owner:string,raw:unknown,id?:string,revision?:number,confirmation?:string){
 const input=AppointmentInputSchema.parse(raw);const h=getHouseholdById(input.householdId,owner);
 if(!h)throw new HouseholdEditError("Adhérent introuvable.");
 if(activeAppointment(input)&&!activeAt(h.lifecycle?.adherent,input.date))throw new HouseholdEditError("Adhérent clôturé ou décédé à la date du rendez-vous.");
 if(["Réalisé","Absent"].includes(input.status)&&input.date>localToday())throw new HouseholdEditError("Un rendez-vous futur ne peut pas être réalisé ou absent.");
 return saveStoredAppointment(owner,{...input,adherentName:`${h.adherent.first_name} ${h.adherent.last_name}`},id,revision,confirmation);
}
export function appointmentToContact(owner:string,id:string,revision:number){
 return db.transaction(()=>{
  const p=getAppointments(owner).find(p=>p.id===id);
  if(!p||p.revision!==revision)throw new HouseholdEditError("Rendez-vous introuvable ou modifié.");
  if(p.status!=="Réalisé"||p.contactId)throw new HouseholdEditError("Rendez-vous non réalisé ou déjà converti en contact.");
  const contact=createContact(owner,{householdId:p.householdId,date:p.date,channel:p.type==="Téléphone"?"Appel":"Note interne",reason:p.reason,summary:`Rendez-vous ${p.type} du ${p.date} à ${p.startTime} (${p.durationMinutes} min). ${p.notes}`.slice(0,3000),nextAction:""});
  linkAppointmentContact(owner,id,revision,contact.id);return contact;
 })();
}
