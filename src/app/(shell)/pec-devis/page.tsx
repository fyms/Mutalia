import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/store/session";
import { DevisPecHistory } from "@/components/devisPec/DevisPecHistory";
export default async function PecDevisPage() {
  const {userId}=await getSession();
  return <div className="m-workspace space-y-4"><PageHeader title="PEC / Devis" description="Demandes et estimations santé · aucun accord transmis ni flux réel."/><DevisPecHistory owner={userId} allowCreate/></div>;
}
