"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { HouseholdEditError } from "@/lib/store/runtimeStore";
import { DevisPecInputSchema, type DevisPecStatus } from "./devisPec";
import { saveDevisPec, processDevisPec } from "./devisPecService";
function refresh(id:string) {
  for(const path of ["/pec-devis","/flux-anomalies","/dossiers","/cockpit",`/adherents/${id}`])revalidatePath(path);
}
export async function saveDevisPecAction(raw:unknown,id?:string,revision?:number):Promise<{error?:string}> {
  const {userId}=await getSession();const parsed=DevisPecInputSchema.safeParse(raw);
  if(!parsed.success)return {error:parsed.error.issues[0].message};
  try {const p=saveDevisPec(userId,parsed.data,id,revision);refresh(p.householdId);return {};}
  catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
export async function processDevisPecAction(id:string,revision:number,target:DevisPecStatus|"estimate",reason=""):Promise<{error?:string}> {
  const {userId}=await getSession();
  try {const p=processDevisPec(userId,id,revision,target,reason);refresh(p.householdId);return target === "estimate" && !p.result ? {error:p.anomalies.join(" · ")} : {};}
  catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Opération impossible."};}
}
