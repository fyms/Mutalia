import { getSimulatorBenefit } from "@/lib/data/harmonie/simulatorBenefits";
import { computeReimbursement, type ReimbursementInput } from "./reimbursement";
export function computeVerifiedSimulation(id:string,input:Pick<ReimbursementInput,"billed"|"brss"|"amoRate">) {
 const b=getSimulatorBenefit(id);
 const available=b && !b.restriction && (b.mode === "frais_reels" || b.value!==null);
 // Reuse the shared engine; unknown/conditional guarantees keep AMO only.
 return computeReimbursement({...input,guaranteeMode:available ? b.mode : "percent_brss",guaranteeValue:available ? b.value ?? undefined : undefined});
}
