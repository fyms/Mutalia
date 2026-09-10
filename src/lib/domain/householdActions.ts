"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { createManualHousehold } from "@/lib/store/runtimeStore";
import { ManualHouseholdInputSchema } from "./manualHouseholds";
import { getHouseholdFormulas } from "./householdFormulas";

export async function createHouseholdAction(formData: FormData): Promise<{error: string}> {
  const session = await getSession();
  const parsed = ManualHouseholdInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {error: parsed.error.issues[0].message};
  if (!getHouseholdFormulas().some(f => f.key === parsed.data.formulaKey))
    return {error: "Choisissez une formule du référentiel Harmonie 2026."};
  let id: string;
  try { id = createManualHousehold(session.userId, parsed.data).id; }
  catch { return {error: "Enregistrement impossible. Vos saisies sont conservées ; réessayez."}; }
  revalidatePath("/adherents");
  revalidatePath("/contrats");
  revalidatePath("/api/search-index");
  redirect(`/adherents/${id}`);
}
