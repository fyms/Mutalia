import { getSession } from "@/lib/store/session";
import { getAppointments, getProspects } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { PageHeader } from "@/components/ui/PageHeader";
import { Agenda } from "@/components/agenda/Agenda";
export default async function AgendaPage({searchParams}:{searchParams:Promise<{householdId?:string;prospectId?:string;filterProspectId?:string}>}) {
 const {userId}=await getSession();const {householdId,prospectId,filterProspectId}=await searchParams;
 return <div className="m-workspace"><PageHeader title="Agenda" description="Rendez-vous adhérents et prospects · agenda personnel du gestionnaire"/><Agenda rows={getAppointments(userId).filter(p=>!filterProspectId||p.prospectId===filterProspectId)} households={getAllHouseholds(userId).map(h=>({id:h.householdId,name:`${h.adherent.first_name} ${h.adherent.last_name}`}))} prospects={getProspects(userId)} prospectId={prospectId} householdId={householdId}/></div>;
}
