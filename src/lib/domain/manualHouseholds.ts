import { z } from "zod";
import { BankingInputSchema } from "./demoBanking";

const required = (label: string, max = 100) => z.string().trim().min(1, `${label} requis.`).max(max, `${label} trop long.`);
const date = z.iso.date("Date invalide.");
export const ManualHouseholdInputSchema = z.object({
  banking: BankingInputSchema,
  firstName: required("Prénom"),
  lastName: required("Nom"),
  birthDate: date.refine(value => value <= new Date().toISOString().slice(0, 10), "La naissance ne peut pas être dans le futur."),
  email: z.string().trim().max(254).pipe(z.email("Adresse e-mail invalide.")),
  phone: required("Téléphone", 30).regex(/^\+?[0-9 ().-]{6,30}$/, "Téléphone invalide."),
  address: required("Adresse", 250),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal : 5 chiffres requis."),
  city: required("Ville"),
  effectiveDate: date,
  formulaKey: required("Formule", 150),
}).refine(value => (!value.effectiveDate || value.effectiveDate >= value.birthDate), {path: ["effectiveDate"], message: "L’adhésion ne peut pas précéder la naissance."});
export type ManualHouseholdInput = z.infer<typeof ManualHouseholdInputSchema>;
export interface ManualHousehold extends ManualHouseholdInput {
  id: string;
  memberId: string;
  source: "manual" | "pedagogical";
  referenceYear: 2026;
  createdAt: string;
  updatedAt: string;
  revision: number;
  deletedAt: string | null;
  beneficiaries?: ManualBeneficiary[];
  bankingHistory?: {at: string; event: "Coordonnées bancaires mises à jour"}[];
}

export const BeneficiaryInputSchema = z.object({
  firstName: required("Prénom"), lastName: required("Nom"),
  birthDate: date.refine(value => value <= new Date().toISOString().slice(0, 10), "La naissance ne peut pas être dans le futur."),
  role: z.enum(["conjoint", "enfant"], {error: "Lien familial invalide."}),
});
export type BeneficiaryInput = z.infer<typeof BeneficiaryInputSchema>;
export interface ManualBeneficiary extends BeneficiaryInput { id: string; }

// Missing source coordinates remain optional for a pedagogical dossier only.
export const PedagogicalHouseholdInputSchema = ManualHouseholdInputSchema.safeExtend({
 email: ManualHouseholdInputSchema.shape.email.or(z.literal("")),
 phone: ManualHouseholdInputSchema.shape.phone.or(z.literal("")),
 address: ManualHouseholdInputSchema.shape.address.or(z.literal("")),
 postalCode: ManualHouseholdInputSchema.shape.postalCode.or(z.literal("")),
 city: ManualHouseholdInputSchema.shape.city.or(z.literal("")),
 effectiveDate: date.or(z.literal("")),
});
