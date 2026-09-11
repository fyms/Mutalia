"use server";
import { getSession } from "@/lib/store/session";
import { saveProspect,HouseholdEditError } from "@/lib/store/runtimeStore";
import { revalidatePath } from "next/cache";
export async function saveProspectAction(raw:unknown,id?:string,revision?:number,status?:"actif"|"abandonné") {
 const {userId}=await getSession();
 try {const p=saveProspect(userId,raw,id,revision,status);for(const path of ["/agenda","/prospects","/cockpit"])revalidatePath(path);return {prospect:p};}
 catch(e){return {error:e instanceof HouseholdEditError?e.message:"Prénom, nom, téléphone et e-mail valides requis."};}
}
