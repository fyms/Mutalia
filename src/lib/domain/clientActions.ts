"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/store/session";
import {
  createClient,
  createQuote,
  deleteClient,
  getClientById,
  updateClient,
  type ClientStatus,
  type QuoteRecord,
} from "@/lib/store/runtimeStore";
import type { Household, Member } from "@/lib/domain/types";

export interface ClientMemberInput {
  first_name: string;
  last_name: string;
  birth_date: string;
  role: "conjoint" | "enfant";
}

export interface ClientFormInput {
  adherent: { first_name: string; last_name: string; birth_date: string };
  beneficiaries: ClientMemberInput[];
}

function validateClientFormInput(input: ClientFormInput): void {
  if (!input.adherent.first_name.trim() || !input.adherent.last_name.trim() || !input.adherent.birth_date) {
    throw new Error("Nom, prénom et date de naissance de l'adhérent principal sont requis.");
  }
  for (const b of input.beneficiaries) {
    if (!b.first_name.trim() || !b.last_name.trim() || !b.birth_date) {
      throw new Error("Chaque bénéficiaire ajouté doit avoir un nom, prénom et une date de naissance.");
    }
  }
}

function buildHousehold(input: ClientFormInput, householdId: string): Household {
  const adherent: Member = {
    member_id: `${householdId}-M1`,
    first_name: input.adherent.first_name.trim(),
    last_name: input.adherent.last_name.trim(),
    birth_date: input.adherent.birth_date,
    role: "adherent",
    household_id: householdId,
    synthetic: true,
  };
  const beneficiaries: Member[] = input.beneficiaries.map((b, idx) => ({
    member_id: `${householdId}-M${idx + 2}`,
    first_name: b.first_name.trim(),
    last_name: b.last_name.trim(),
    birth_date: b.birth_date,
    role: b.role,
    household_id: householdId,
    synthetic: true,
  }));
  return { household_id: householdId, members: [adherent, ...beneficiaries] };
}

export async function createClientAction(input: ClientFormInput): Promise<{ clientId: string }> {
  const session = await getSession();
  validateClientFormInput(input);
  const householdId = `CLI-HH-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const household = buildHousehold(input, householdId);
  const record = await createClient({ household, createdBy: session.displayName });
  revalidatePath("/adherents");
  return { clientId: record.id };
}

export async function updateClientAction(clientId: string, input: ClientFormInput): Promise<void> {
  await getSession();
  validateClientFormInput(input);
  const existing = getClientById(clientId);
  if (!existing) throw new Error("Client introuvable.");
  const household = buildHousehold(input, existing.household.household_id);
  await updateClient(clientId, { household });
  revalidatePath("/adherents");
  revalidatePath(`/adherents/clients/${clientId}`);
}

export async function updateClientStatusAction(clientId: string, status: ClientStatus): Promise<void> {
  await getSession();
  await updateClient(clientId, { status });
  revalidatePath("/adherents");
  revalidatePath(`/adherents/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string): Promise<void> {
  await getSession();
  await deleteClient(clientId);
  revalidatePath("/adherents");
  redirect("/adherents");
}

export async function applyFormulaAction(
  clientId: string,
  formulaCode: string,
  formulaCatalog: NonNullable<QuoteRecord["formulaCatalog"]>,
): Promise<void> {
  await getSession();
  if (!formulaCode.trim()) {
    throw new Error("Sélectionnez une formule de garantie à appliquer.");
  }
  await updateClient(clientId, { formulaCode, formulaCatalog });
  revalidatePath(`/adherents/clients/${clientId}`);
}

export async function generateQuoteAction(
  clientId: string,
  input: { formulaCode: string; formulaCatalog: QuoteRecord["formulaCatalog"]; monthlyPremium: string },
): Promise<{ quoteId: string }> {
  const session = await getSession();
  const client = getClientById(clientId);
  if (!client) throw new Error("Client introuvable.");
  if (!input.formulaCode.trim() || !input.formulaCatalog) {
    throw new Error("Une formule de garantie doit être sélectionnée pour générer un devis.");
  }

  const trimmedPremium = input.monthlyPremium.trim();
  let premium: number | null = null;
  if (trimmedPremium) {
    const parsed = Number(trimmedPremium.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("La cotisation mensuelle doit être un nombre positif.");
    }
    premium = Math.round(parsed * 100) / 100;
  }

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const quote = await createQuote({
    clientId,
    formulaCode: input.formulaCode,
    formulaCatalog: input.formulaCatalog,
    monthlyPremium: premium,
    createdBy: session.displayName,
    validUntil,
  });
  revalidatePath(`/adherents/clients/${clientId}`);
  return { quoteId: quote.id };
}
