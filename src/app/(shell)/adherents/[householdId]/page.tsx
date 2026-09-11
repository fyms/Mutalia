import { notFound } from "next/navigation";
import { Household360 } from "@/components/adherents/Household360";
import { getSession } from "@/lib/store/session";
import { getHouseholdById } from "@/lib/domain/households";
import { getDossiers } from "@/lib/domain/dossierService";
import { getAppointments,getOperationalAnomalies,getPrestations,getComplaints,getDevisPec,getCotisations,getContacts } from "@/lib/store/runtimeStore";
export default async function Fiche360Page({params,searchParams}:{params:Promise<{householdId:string}>;searchParams:Promise<{tab?:string;action?:string}>}){
 const {userId}=await getSession();const {householdId}=await params;const {tab,action}=await searchParams;
 const household=getHouseholdById(householdId,userId);if(!household)notFound();
 return <Household360 owner={userId} household={household} tab={tab} action={action} data={{dossiers:getDossiers(userId),anomalies:getOperationalAnomalies(userId),appointments:getAppointments(userId),prestations:getPrestations(userId),complaints:getComplaints(userId),quotes:getDevisPec(userId),cotisations:getCotisations(userId),contacts:getContacts(userId)}}/>;
}
