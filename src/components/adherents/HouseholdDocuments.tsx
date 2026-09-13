import type { HouseholdView } from "@/lib/domain/households";
import { listRuntimeDocuments } from "@/lib/store/runtimeDocuments";
import { documentView } from "@/lib/domain/runtimeDocuments";
import { getDocumentState } from "@/lib/store/runtimeStore";
import { HouseholdDocumentPanel } from "./HouseholdDocumentPanel";
export function HouseholdDocuments({owner,household:h}:{owner:string;household:HouseholdView}){
 return <HouseholdDocumentPanel householdId={h.householdId} members={h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))} documents={h.case?.documents??[]} states={Object.fromEntries((h.case?.documents??[]).map(d=>[d.document_id,getDocumentState(owner,d.document_id)]))} runtimeDocuments={listRuntimeDocuments(owner,h.householdId).map(documentView)}/>;
}
