"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { AppointmentOverlapError, HouseholdEditError } from "@/lib/store/runtimeStore";
import { saveAppointment, appointmentToContact } from "./appointmentService";
export type AppointmentResult={error?:string;confirmation?:string;conflicts?:string[]};
function refresh(id:string){for(const path of ["/agenda","/cockpit",`/adherents/${id}`,"/relation-adherent"])revalidatePath(path);}
export async function saveAppointmentAction(raw:unknown,id?:string,revision?:number,confirmation?:string):Promise<AppointmentResult>{
 const {userId}=await getSession();try{const p=saveAppointment(userId,raw,id,revision,confirmation);refresh(p.householdId);return {};}
 catch(e){if(e instanceof AppointmentOverlapError)return {error:e.message,confirmation:e.confirmation,conflicts:e.conflicts.map(p=>`${p.date} ${p.startTime} · ${p.adherentName} · ${p.reason}`)};return {error:e instanceof HouseholdEditError?e.message:"Date, heure, durée et champs obligatoires à vérifier."};}
}
export async function appointmentContactAction(id:string,revision:number):Promise<AppointmentResult>{const {userId}=await getSession();try{const p=appointmentToContact(userId,id,revision);refresh(p.householdId);return {};}catch(e){return {error:e instanceof HouseholdEditError?e.message:"Conversion impossible."};}}
