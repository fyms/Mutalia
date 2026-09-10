"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { updateOperationalAnomaly, HouseholdEditError } from "@/lib/store/runtimeStore";
import { AnomalyUpdateSchema } from "./operationalAnomalies";
export async function updateAnomalyAction(id:string,revision:number,raw:unknown):Promise<{error?:string}> {
  const {userId}=await getSession();
  const input=AnomalyUpdateSchema.safeParse(raw);
  if(!input.success)return {error:"Statut ou résolution invalide."};
  try {
    const a=updateOperationalAnomaly(userId,id,revision,input.data);
    for(const path of ["/flux-anomalies","/prestations","/dossiers","/cockpit",`/adherents/${a.householdId}`])revalidatePath(path);
    return {};
  }catch(e){return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
