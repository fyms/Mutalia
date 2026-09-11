import { getDevisPec } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { DevisPecList } from "./DevisPecList";
export function DevisPecHistory({owner,householdId,allowCreate=false}:{owner:string;householdId?:string;allowCreate?:boolean}) {
  const households=getAllHouseholds(owner).map(h=>({id:h.householdId,lifecycle:h.lifecycle,name:`${h.adherent.first_name} ${h.adherent.last_name}`,members:h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))}));
  return <DevisPecList rows={getDevisPec(owner).filter(p=>!householdId||p.householdId===householdId)} households={households} allowCreate={allowCreate}/>;
}
