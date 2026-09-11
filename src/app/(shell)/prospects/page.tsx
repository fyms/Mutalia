import { getSession } from "@/lib/store/session";
import { getProspects,getAppointments } from "@/lib/store/runtimeStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProspectsPanel } from "@/components/prospects/ProspectsPanel";
export default async function ProspectsPage(){const s=await getSession();return <div><PageHeader title="Prospects" description="Contacts et rendez-vous avant adhésion."/><ProspectsPanel prospects={getProspects(s.userId)} appointments={getAppointments(s.userId)}/></div>;}
