import { z } from "zod";
import type { Fund } from "@/lib/services/healthInsuranceFund";
export const AmoStatementInputSchema=z.object({
 caseId:z.string().regex(/^CASE-[0-9]+$/), memberId:z.string().min(1).max(100),
 periodStart:z.iso.date(),periodEnd:z.iso.date(),careDate:z.iso.date(),
 act:z.string().trim().min(1).max(150),paid:z.number().min(0).max(1000000),brss:z.number().min(0).max(1000000),amoRate:z.number().min(0).max(100),
}).refine(p=>p.periodStart<=p.careDate&&p.careDate<=p.periodEnd,"La date de soin doit appartenir à la période.");
export type AmoStatementInput=z.infer<typeof AmoStatementInputSchema>;
export interface AmoStatementSnapshot extends AmoStatementInput {
 id:string;householdId:string;holder:string;beneficiary:string;birthDate:string;socialSecurityNumber:string;
 domicile:string;fund:Fund;reimbursed:number;createdAt:string;filename:string;
}
