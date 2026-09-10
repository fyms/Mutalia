"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { HouseholdEditError } from "@/lib/store/runtimeStore";
import { ContactInputSchema,ComplaintInputSchema,ComplaintUpdateSchema } from "./relationAdherent";
import { createContact,createComplaint,updateComplaint } from "./relationService";
function refresh(id:string){for(const path of ["/relation-adherent","/dossiers","/cockpit",`/adherents/${id}`])revalidatePath(path);}
export async function createContactAction(raw:unknown):Promise<{error?:string}> {
 const {userId}=await getSession();const parsed=ContactInputSchema.safeParse(raw);if(!parsed.success)return {error:parsed.error.issues[0].message};
 try{const p=createContact(userId,parsed.data);refresh(p.householdId);return {};}catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
export async function createComplaintAction(raw:unknown):Promise<{error?:string}> {
 const {userId}=await getSession();const parsed=ComplaintInputSchema.safeParse(raw);if(!parsed.success)return {error:parsed.error.issues[0].message};
 try{const p=createComplaint(userId,parsed.data);refresh(p.householdId);return {};}catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
export async function updateComplaintAction(id:string,revision:number,raw:unknown):Promise<{error?:string}> {
 const {userId}=await getSession();const parsed=ComplaintUpdateSchema.safeParse(raw);if(!parsed.success)return {error:parsed.error.issues[0].message};
 try{const p=updateComplaint(userId,id,revision,parsed.data);refresh(p.householdId);return {};}catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
