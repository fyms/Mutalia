"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { HouseholdEditError } from "@/lib/store/runtimeStore";
import { CotisationInputSchema, CotisationEntrySchema } from "./cotisations";
import { createCotisation, recordCotisationEntry } from "./cotisationService";
function refresh(id:string) {for(const p of ["/cotisations","/dossiers","/cockpit",`/adherents/${id}`])revalidatePath(p);}
export async function createCotisationAction(raw:unknown):Promise<{error?:string}> {
 const {userId}=await getSession();const parsed=CotisationInputSchema.safeParse(raw);
 if(!parsed.success)return {error:parsed.error.issues[0].message};
 try {const p=createCotisation(userId,parsed.data);refresh(p.householdId);return {};}
 catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
export async function recordCotisationAction(id:string,revision:number,raw:unknown):Promise<{error?:string}> {
 const {userId}=await getSession();const parsed=CotisationEntrySchema.safeParse(raw);
 if(!parsed.success)return {error:parsed.error.issues[0].message};
 try {const p=recordCotisationEntry(userId,id,revision,parsed.data);refresh(p.householdId);return {};}
 catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
