import { getSession } from "@/lib/store/session";
import { getAppointments } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { PageHeader } from "@/components/ui/PageHeader";
import { Agenda } from "@/components/agenda/Agenda";
export default async function AgendaPage({searchParams}:{searchParams:Promise<{householdId?:string}>}) {
 const {userId}=await getSession();const {householdId}=await searchParams;
 return <><PageHeader title="Agenda" description="Rendez-vous adhérents · agenda personnel du gestionnaire"/><Agenda rows={getAppointments(userId)} households={getAllHouseholds(userId).map(h=>({id:h.householdId,name:`${h.adherent.first_name} ${h.adherent.last_name}`}))} householdId={householdId}/></>;
}
