import { getSession } from "@/lib/store/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrestationHistory } from "@/components/prestations/PrestationHistory";
export default async function PrestationsPage() {
  const {userId} = await getSession();
  return <div><PageHeader title="Prestations santé" description="Reçue → À contrôler → Calculée → Validée → Payée → Clôturée. Liquidation pédagogique : aucun paiement réel." />
    <PrestationHistory owner={userId} allowCreate />
  </div>;
}
