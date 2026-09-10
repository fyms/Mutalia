import "server-only";
import { getHouseholdById } from "./households";
import { CotisationInputSchema, CotisationEntrySchema } from "./cotisations";
import { createStoredCotisation, addStoredCotisationEntry, HouseholdEditError } from "@/lib/store/runtimeStore";
export function createCotisation(owner:string,raw:unknown) {
 const input=CotisationInputSchema.parse(raw);const h=getHouseholdById(input.householdId,owner);
 if(!h)throw new HouseholdEditError("Adhérent introuvable.");
 return createStoredCotisation(owner,{householdId:input.householdId,adherentName:`${h.adherent.first_name} ${h.adherent.last_name}`,period:input.period,dueDate:input.dueDate,expectedCents:Math.round(input.amount*100)});
}
export function recordCotisationEntry(owner:string,id:string,revision:number,raw:unknown) {
 const input=CotisationEntrySchema.parse(raw);
 return addStoredCotisationEntry(owner,id,revision,{kind:input.kind,cents:Math.round(input.amount*100),date:input.date,reason:input.reason});
}
