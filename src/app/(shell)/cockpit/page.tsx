import { Cockpit } from "@/components/cockpit/Cockpit";
import { getDossiers } from "@/lib/domain/dossierService";
import { getSession } from "@/lib/store/session";
import { getAppointments,getOperationalAnomalies,getPrestations,getComplaints,getDevisPec,getCotisations,getContacts } from "@/lib/store/runtimeStore";
export default async function Page(){
 const {userId}=await getSession();
 return <Cockpit data={{dossiers:getDossiers(userId),anomalies:getOperationalAnomalies(userId),appointments:getAppointments(userId),prestations:getPrestations(userId),complaints:getComplaints(userId),quotes:getDevisPec(userId),cotisations:getCotisations(userId),contacts:getContacts(userId)}}/>;
}
