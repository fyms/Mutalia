import { z } from "zod";
export const DOSSIER_STATUSES = ["À traiter", "En attente", "Incomplet", "Terminé"] as const;
export const DOSSIER_PRIORITIES = ["Urgent", "Normal", "Faible"] as const;
export const DossierStateSchema = z.object({status: z.enum(DOSSIER_STATUSES), priority: z.enum(DOSSIER_PRIORITIES)});
export type DossierState = z.infer<typeof DossierStateSchema> & {revision: number; updatedAt?: string};
export interface Dossier extends DossierState {
  id: string; householdId: string; adherent: string; type: string;
  createdAt: string; anomaly: string | null; nextAction: string;
}
export function sortDossiers(rows: Dossier[]): Dossier[] {
  return [...rows].sort((a,b) => DOSSIER_PRIORITIES.indexOf(a.priority) - DOSSIER_PRIORITIES.indexOf(b.priority) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export function dossierSummary(rows: Dossier[]) {
  return {todo: rows.filter(r => r.status === "À traiter").length,
    urgent: rows.filter(r => r.priority === "Urgent" && r.status !== "Terminé").length,
    incomplete: rows.filter(r => r.status === "Incomplet").length,
    waiting: rows.filter(r => r.status === "En attente").length};
}
export function dossierAge(createdAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 86400000));
}
