import { getCotisations } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { CotisationList } from "./CotisationList";
export function CotisationHistory({owner,householdId,allowCreate=false}:{owner:string;householdId?:string;allowCreate?:boolean}) {
 const households=getAllHouseholds(owner).map(h=>({id:h.householdId,name:`${h.adherent.first_name} ${h.adherent.last_name}`}));
 return <CotisationList rows={getCotisations(owner).filter(p=>!householdId||p.householdId===householdId)} households={households} allowCreate={allowCreate} today={new Date().toISOString().slice(0,10)}/>;
}
