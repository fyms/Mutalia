import { getHouseholdById } from "@/lib/domain/households";
import { getDocumentState,getLatestSubmission } from "@/lib/store/runtimeStore";
import { getDraft } from "@/lib/store/drafts";
import { listRuntimeDocuments } from "@/lib/store/runtimeDocuments";
import { documentView } from "@/lib/domain/runtimeDocuments";
import { GedWorkspace } from "./GedWorkspace";
import { AmoDocuments } from "./AmoDocuments";
export function HouseholdDocumentWorkspace({owner,householdId,author,initialImport=false}:{owner:string;householdId:string;author:string;initialImport?:boolean}){
 const h=getHouseholdById(householdId,owner);if(!h)return <p>Dossier introuvable.</p>;
 const c=h.case,submission=c?getLatestSubmission(owner,c.case_id):undefined;
 const feedback=submission?{caseId:submission.caseId,score:submission.score,maxScore:submission.maxScore,submittedAt:submission.submittedAt,breakdown:submission.breakdown}:null;
 return <>{c&&<AmoDocuments owner={owner} caseId={c.case_id} formOnly/>}<GedWorkspace key={h.householdId} trainingCase={c??undefined} states={Object.fromEntries((c?.documents??[]).map(d=>[d.document_id,getDocumentState(owner,d.document_id)]))} draft={c?getDraft(owner,c.case_id):null} feedback={feedback} author={author} household={{id:h.householdId,members:h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))}} runtimeDocuments={listRuntimeDocuments(owner,h.householdId).map(documentView)} initialImport={initialImport}/></>;
}
