"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { HouseholdEditError } from "@/lib/store/runtimeStore";
import { receivePrestation, correctPrestation, advancePrestation } from "./prestationService";
import { PrestationInputSchema, type PrestationStatus } from "./prestations";
export async function savePrestationAction(raw: unknown, id?: string, revision?: number): Promise<{error?:string}> {
  const {userId} = await getSession();
  const parsed = PrestationInputSchema.safeParse(raw);
  if (!parsed.success) return {error:parsed.error.issues[0].message};
  try {
    const p = id ? correctPrestation(userId, id, revision!, parsed.data) : receivePrestation(userId, parsed.data);
    refresh(p.householdId);
    return {};
  } catch (e) {return {error:e instanceof HouseholdEditError ? e.message : "Enregistrement impossible."};}
}
export async function advancePrestationAction(id: string, revision: number, target: PrestationStatus): Promise<{error?:string}> {
  const {userId} = await getSession();
  try {
    const p = advancePrestation(userId,id,revision,target);
    refresh(p.householdId);
    return p.status === target ? {} : {error:p.anomalies.join(" ")};
  } catch (e) {return {error:e instanceof HouseholdEditError ? e.message : "Opération impossible."};}
}
function refresh(householdId: string) {
  for (const path of ["/prestations", `/adherents/${householdId}`, "/dossiers", "/cockpit"]) revalidatePath(path);
}
