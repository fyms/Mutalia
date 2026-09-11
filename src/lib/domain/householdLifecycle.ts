import { z } from "zod";
export const LifecycleChangeSchema = z.object({
  status: z.enum(["active", "inactive", "deceased", "terminated", "archived"]),
  endDate: z.iso.date(),
  endReason: z.enum(["detached", "divorce", "deceased", "age_limit", "other", "termination", "death", "duplicate", "error"]),
});
export type LifecycleChange = z.infer<typeof LifecycleChangeSchema>;
export interface LifecycleState { status: LifecycleChange["status"]; endDate: string | null; endReason: LifecycleChange["endReason"] | null; history: (LifecycleChange & {at: string})[]; }
export interface HouseholdLifecycle { revision: number; adherent: LifecycleState; beneficiaries: Record<string, LifecycleState>; }
export const activeLifecycle = (): LifecycleState => ({status:"active",endDate:null,endReason:null,history:[]});
export const emptyLifecycle = (): HouseholdLifecycle => ({revision:0,adherent:activeLifecycle(),beneficiaries:{}});
export const STATUS_LABELS = {active:"Actif",inactive:"Inactif",deceased:"Décédé",terminated:"Clôturé",archived:"Archivé"};
export const REASON_LABELS = {detached:"Non rattaché / autonome",divorce:"Divorce",deceased:"Décès",age_limit:"Limite d’âge",other:"Autre",termination:"Résiliation",death:"Décès",duplicate:"Doublon",error:"Création par erreur"};
/** Date de sortie inclusive : les opérations antérieures restent accessibles. */
export function activeAt(state: LifecycleState | undefined, date: string): boolean {
  if (!state) return true;
  const events = state.history.filter(e => e.endDate <= date);
  if (events.length) return events[events.length - 1].status === "active";
  return state.endDate ? date < state.endDate : state.status === "active";
}
export function eligibleAt(lifecycle: HouseholdLifecycle | undefined, memberId: string, date: string) {
  return !lifecycle || (activeAt(lifecycle.adherent,date) && activeAt(lifecycle.beneficiaries[memberId],date));
}
