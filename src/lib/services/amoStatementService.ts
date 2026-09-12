import { storeGeneratedDocument,listRuntimeDocuments,readRuntimeDocument } from "@/lib/store/runtimeDocuments";
import { DemoSocialSecuritySchema } from "@/lib/domain/demoSocialSecurity";
import "server-only";
import { randomUUID } from "node:crypto";
import { getCaseById } from "@/lib/data/loaders";
import { getHouseholdById } from "@/lib/domain/households";
import { AmoStatementInputSchema, type AmoStatementSnapshot } from "@/lib/domain/amoStatement";
import { resolveHealthInsuranceFund } from "./resolveHealthInsuranceFund";
import { computeReimbursement } from "@/lib/domain/reimbursement";
import { renderAmoStatementPdf } from "./amoStatementPdf";
import { db } from "@/lib/db";
db.exec("CREATE TABLE IF NOT EXISTS pedagogical_amo_documents (id TEXT PRIMARY KEY, owner TEXT NOT NULL, case_id TEXT NOT NULL, created_at TEXT NOT NULL, filename TEXT NOT NULL, snapshot TEXT NOT NULL, pdf BLOB NOT NULL)");
export function getAmoContext(owner:string,caseId:string) {
 const c=getCaseById(caseId);if(!c)throw new Error("Cas introuvable.");
 const h=getHouseholdById(c.household.household_id,owner);if(!h)throw new Error("Foyer introuvable.");
 const record=h.case?h.simulation:h.manual;
 return {c,h,record};
}
export async function previewAmoFund(owner:string,caseId:string) {
 const {record}=getAmoContext(owner,caseId);
 return resolveHealthInsuranceFund({postalCode:record?.postalCode??"",city:record?.city??""});
}
export async function generateAmoStatement(owner:string,raw:unknown) {
 const input=AmoStatementInputSchema.parse(raw),{h,record}=getAmoContext(owner,input.caseId);
 const member=h.household.members.find(m=>m.member_id===input.memberId);if(!member)throw new Error("Bénéficiaire introuvable.");
 if (!record?.socialSecurityNumber) throw new Error("Renseignez ou générez le NIR Démo du titulaire dans le dossier de simulation.");
 DemoSocialSecuritySchema.parse(record.socialSecurityNumber);
 const fund=await previewAmoFund(owner,input.caseId);
 // Reuse the existing AMO arithmetic; the zero AMC here is never a contractual guarantee.
 const result=computeReimbursement({billed:input.paid,brss:input.brss,amoRate:input.amoRate/100,guaranteeMode:"forfait_euros",guaranteeValue:0});
 if(result.amoReimbursement>input.paid)throw new Error("AMO supérieure au montant payé : contrôlez les montants.");
 const id=`AMO-DEMO-${randomUUID()}`,createdAt=new Date().toISOString();
 const filename=`decompte-AMO-DEMO-${input.caseId}-${createdAt.slice(0,10)}.pdf`;
 const snapshot:AmoStatementSnapshot={...input,id,householdId:h.householdId,holder:`${h.adherent.first_name} ${h.adherent.last_name}`,
  beneficiary:`${member.first_name} ${member.last_name}`,birthDate:member.birth_date,socialSecurityNumber:record.socialSecurityNumber,
  domicile:[record.address,record.postalCode,record.city].filter(Boolean).join(" "),fund,reimbursed:result.amoReimbursement,createdAt,filename};
 const pdf=await renderAmoStatementPdf(snapshot);
 storeGeneratedDocument({id,ownerId:owner,createdBy:owner,householdId:h.householdId,beneficiaryId:input.memberId,documentType:"decompte_amo",originalFileName:filename,mimeType:"application/pdf",documentDate:input.careDate,note:"",source:"generated",status:"a_qualifier",createdAt,caseId:input.caseId},pdf,()=>{
  db.prepare("INSERT INTO pedagogical_amo_documents(id,owner,case_id,created_at,filename,snapshot,pdf) VALUES(?,?,?,?,?,?,?)").run(id,owner,input.caseId,createdAt,filename,JSON.stringify(snapshot),Buffer.alloc(0));
 });
 return {id,filename};
}
export function listAmoStatements(owner:string,caseId?:string) {
 return listRuntimeDocuments(owner).filter(d=>d.source==="generated"&&(!caseId||d.caseId===caseId)).map(d=>({id:d.id,caseId:d.caseId!,createdAt:d.createdAt,filename:d.originalFileName}));
}
export function readAmoStatement(owner:string,id:string) {
 const document=listRuntimeDocuments(owner).find(d=>d.id===id&&d.source==="generated");
 if(!document)return;
 const result=readRuntimeDocument(owner,document.householdId,id);
 return result?{filename:result.record.originalFileName,pdf:result.bytes}:undefined;
}
