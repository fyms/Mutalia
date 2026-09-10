import { getSession } from "@/lib/store/session";
import { DevisPecHistory } from "@/components/devisPec/DevisPecHistory";
export default async function PecDevisPage() {
  const {userId}=await getSession();
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">PEC & Devis</h1><p className="m-help">Demandes pédagogiques et estimations santé. Aucun accord transmis, paiement ou flux hospitalier réel.</p><DevisPecHistory owner={userId} allowCreate/></div>;
}
