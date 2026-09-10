import { getPrestations } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { PrestationList } from "./PrestationList";
export function PrestationHistory({owner, householdId, allowCreate=false}: {owner:string; householdId?:string; allowCreate?:boolean}) {
  const households = getAllHouseholds(owner).map(h => ({id:h.householdId,name:`${h.adherent.first_name} ${h.adherent.last_name}`,members:h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))}));
  const rows = getPrestations(owner).filter(p => !householdId || p.householdId === householdId);
  return <PrestationList rows={rows} households={households} allowCreate={allowCreate} />;
}
