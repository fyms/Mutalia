import { getContacts,getComplaints } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { getRelationLinks } from "@/lib/domain/relationService";
import { RelationPanel } from "./RelationPanel";
export function RelationHistory({owner,householdId}:{owner:string;householdId?:string}) {
 const households=getAllHouseholds(owner).filter(h=>!householdId||h.householdId===householdId).map(h=>({id:h.householdId,name:`${h.adherent.first_name} ${h.adherent.last_name}`}));
 return <RelationPanel households={households} contacts={getContacts(owner).filter(p=>!householdId||p.householdId===householdId)} complaints={getComplaints(owner).filter(p=>!householdId||p.householdId===householdId)} links={getRelationLinks(owner).filter(p=>!householdId||p.householdId===householdId)} today={new Date().toISOString().slice(0,10)}/>;
}
