import { getProspects } from "@/lib/store/runtimeStore";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/store/session";
import { getHouseholdFormulas } from "@/lib/domain/householdFormulas";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewHouseholdForm } from "@/components/adherents/NewHouseholdForm";
export default async function NewHouseholdPage({searchParams}:{searchParams:Promise<{prospectId?:string}>}) {
  const session=await getSession(); const {prospectId}=await searchParams;
  const prospect=prospectId?getProspects(session.userId).find(p=>p.id===prospectId):undefined;
  if(prospectId&&!prospect)notFound();
  if(prospect?.status==="converti"&&prospect.householdId)redirect(`/adherents/${prospect.householdId}`);
  if(prospect?.status==="abandonné")notFound();
  return <div><PageHeader title="Nouvel adhérent" description="Créer un foyer avec son adhérent principal." />
    <NewHouseholdForm formulas={getHouseholdFormulas()} prospectId={prospectId} prefill={prospect?{firstName:prospect.firstName,lastName:prospect.lastName,phone:prospect.phone,email:prospect.email}:undefined} />
  </div>;
}
