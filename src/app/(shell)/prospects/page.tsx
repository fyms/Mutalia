import { getSession } from "@/lib/store/session";
import { getProspects,getAppointments } from "@/lib/store/runtimeStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProspectsPanel } from "@/components/prospects/ProspectsPanel";
import { ProspectWorkspace } from "@/components/prospects/ProspectWorkspace";
import { listRuntimeDocuments } from "@/lib/store/runtimeDocuments";
import { documentView } from "@/lib/domain/runtimeDocuments";
import { salesPricingOptions } from "@/lib/services/prospectSalesService";
import { getHouseholdFormulas } from "@/lib/domain/householdFormulas";
import { notFound } from "next/navigation";
export default async function ProspectsPage({searchParams}:{searchParams:Promise<{prospectId?:string;tab?:string}>}){const s=await getSession(),query=await searchParams,prospects=getProspects(s.userId),appointments=getAppointments(s.userId);
 if(query.prospectId){const p=prospects.find(p=>p.id===query.prospectId);if(!p)notFound();return <ProspectWorkspace key={p.id} prospect={p} appointments={appointments.filter(a=>a.prospectId===p.id)} documents={listRuntimeDocuments(s.userId,p.id).map(documentView)} options={salesPricingOptions()} formulas={getHouseholdFormulas()} initialTab={query.tab}/>;}
 return <div><PageHeader title="Prospects" description="Contacts, besoins et propositions pédagogiques avant adhésion."/><ProspectsPanel prospects={prospects} appointments={appointments}/></div>;}
