import { PageHeader } from "@/components/ui/PageHeader";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { ReimbursementSimulator } from "@/components/simulateur/ReimbursementSimulator";
import { AnnualCapSimulator } from "@/components/simulateur/AnnualCapSimulator";

const TABS = [
  { key: "remboursement", label: "Remboursement BRSS / AMO / AMC" },
  { key: "plafond", label: "Plafond annuel" },
];

export default async function SimulateurPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "plafond" ? "plafond" : "remboursement";

  return (
    <div>
      <PageHeader
        title="Simulateur de remboursement"
        description="Calcul pédagogique du reste à charge à partir de la BRSS, du taux AMO et de la garantie AMC. Toute valeur non vérifiée sur le référentiel 2026 est signalée plutôt qu'inventée."
      />
      <QueryTabs basePath="/simulateur" activeKey={activeTab} tabs={TABS} />
      {activeTab === "remboursement" ? <ReimbursementSimulator /> : <AnnualCapSimulator />}
    </div>
  );
}
