import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/store/session";
import { PrestationHistory } from "@/components/prestations/PrestationHistory";
export default async function PrestationsPage() {
  const {userId} = await getSession();
  return <div className="m-workspace"><PageHeader title="Prestations santé" description="Réception, contrôle et liquidation santé · aucun paiement réel." />
    <PrestationHistory owner={userId} allowCreate />
  </div>;
}
