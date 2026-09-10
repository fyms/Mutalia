"use server";
import { getSession } from "@/lib/store/session";
import { revalidatePath } from "next/cache";
import { getDossiers, updateDossier } from "./dossierService";
import { DossierStateSchema } from "./dossiers";
import { HouseholdEditError } from "@/lib/store/runtimeStore";
export async function updateDossierAction(id: string, revision: number, raw: unknown): Promise<{error?: string}> {
  const {userId} = await getSession();
  const input = DossierStateSchema.safeParse(raw);
  if (!input.success) return {error: "Statut ou priorité invalide."};
  if (!getDossiers(userId).some(d => d.id === id)) return {error: "Dossier introuvable."};
  try { updateDossier(userId, id, revision, input.data); }
  catch (error) { return {error: error instanceof HouseholdEditError ? error.message : "Enregistrement impossible. Réessayez."}; }
  revalidatePath("/dossiers");
  revalidatePath("/cockpit");
  return {};
}
