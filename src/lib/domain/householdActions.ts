"use server";
import { pedagogicalHouseholdRecord } from "./pedagogicalHouseholdRecord";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { resetPedagogicalHousehold, convertProspect, deleteErroneousHousehold, changeHouseholdLifecycle, HouseholdEditError, updateManualHousehold, saveManualBeneficiary, removeManualBeneficiary, createManualHousehold } from "@/lib/store/runtimeStore";
import { BeneficiaryInputSchema, PedagogicalHouseholdInputSchema, ManualHouseholdInputSchema } from "./manualHouseholds";
import { getHouseholdFormulas } from "./householdFormulas";

export async function createHouseholdAction(formData: FormData): Promise<{error: string}> {
  const session = await getSession();
  const parsed = ManualHouseholdInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {error: parsed.error.issues[0].message};
  if (!getHouseholdFormulas().some(f => f.key === parsed.data.formulaKey))
    return {error: "Choisissez une formule du référentiel Harmonie 2026."};
  let id: string;
  try { id = formData.get("prospectId") ? convertProspect(session.userId, String(formData.get("prospectId")), parsed.data) : createManualHousehold(session.userId, parsed.data).id; }
  catch { return {error: "Enregistrement impossible. Vos saisies sont conservées ; réessayez."}; }
  revalidatePath("/adherents");
  revalidatePath("/prospects");
  revalidatePath("/contrats");
  revalidatePath("/api/search-index");
  redirect(`/adherents/${id}`);
}

export async function editHouseholdAction(id: string, revision: number, operation: "adherent" | "beneficiary" | "remove", beneficiaryId: string | null, data: FormData): Promise<{error?: string}> {
  const session = await getSession();
  if (!["adherent", "beneficiary", "remove"].includes(operation)) return {error: "Action invalide."};
  const parsed = (operation === "adherent" ? (pedagogicalHouseholdRecord(id) ? PedagogicalHouseholdInputSchema : ManualHouseholdInputSchema) : BeneficiaryInputSchema).safeParse({city:"", ...Object.fromEntries(data)});
  if (operation !== "remove" && !parsed.success) return {error: parsed.error.issues[0].message};
  try {
    if (operation === "adherent") updateManualHousehold(session.userId, id, revision, parsed.data);
    else if (operation === "beneficiary") saveManualBeneficiary(session.userId, id, revision, beneficiaryId, parsed.data);
    else {
      if (!beneficiaryId) return {error: "Bénéficiaire requis."};
      removeManualBeneficiary(session.userId, id, revision, beneficiaryId);
    }
  } catch (error) {
    return {error: error instanceof HouseholdEditError ? error.message : "Enregistrement impossible. Réessayez."};
  }
  revalidatePath("/", "layout");
  revalidatePath(`/adherents/${id}`);
  revalidatePath("/adherents");
  revalidatePath("/prospects");
  revalidatePath("/contrats");
  revalidatePath("/api/search-index");
  return {};
}

export async function lifecycleAction(id: string, revision: number, memberId: string | null, data: FormData): Promise<{error?:string}> {
  const {userId} = await getSession();
  try { changeHouseholdLifecycle(userId,id,revision,memberId,Object.fromEntries(data)); }
  catch (e) { return {error:e instanceof HouseholdEditError ? e.message : "Statut, date et motif valides requis."}; }
  for (const path of ["/adherents",`/adherents/${id}`,"/api/search-index","/prestations","/pec-devis","/contrats","/dossiers"]) revalidatePath(path);
  return {};
}

export async function deleteErroneousHouseholdAction(id:string,confirmation:string):Promise<{error?:string}> {
 const {userId}=await getSession();
 try { deleteErroneousHousehold(userId,id,confirmation); }
 catch(e){return {error:e instanceof HouseholdEditError?e.message:"Suppression impossible."};}
 for(const path of ["/adherents","/contrats","/api/search-index"])revalidatePath(path);
 redirect("/adherents");
}

export async function resetPedagogicalHouseholdAction(id:string,revision:number,confirmed:boolean):Promise<{error?:string}> {
 const {userId} = await getSession();
 try { resetPedagogicalHousehold(userId,id,revision,confirmed); }
 catch(e) { return {error:e instanceof HouseholdEditError ? e.message : "Réinitialisation impossible."}; }
 revalidatePath("/", "layout");
 return {};
}
