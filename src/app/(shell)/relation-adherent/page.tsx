import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/store/session";
import { RelationHistory } from "@/components/relation/RelationHistory";
export default async function RelationAdherentPage() {
 const {userId}=await getSession();return <div className="m-workspace space-y-4"><PageHeader title="Relation adhérent" description="Contacts, réclamations et suivi des échanges · aucune communication externe."/><RelationHistory owner={userId}/></div>;
}
