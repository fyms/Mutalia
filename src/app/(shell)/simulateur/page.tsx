import { IndividualGuarantees } from "@/components/garanties/IndividualGuarantees";
import { ConventionSimulator } from "@/components/simulateur/ConventionSimulator";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { ReimbursementSimulator } from "@/components/simulateur/ReimbursementSimulator";
import { AnnualCapSimulator } from "@/components/simulateur/AnnualCapSimulator";

const TABS = [
  { key: "particuliers", label: "Particuliers PSI/PLI 2026" },
  { key: "conventions", label: "Conventions collectives 2026" },
  { key: "remboursement", label: "Remboursement BRSS / AMO / AMC" },
  { key: "plafond", label: "Plafond annuel" },
];

export default async function SimulateurPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "particuliers" ? "particuliers" : tab === "conventions" ? "conventions" : tab === "plafond" ? "plafond" : "remboursement";

  return (
    <div className="m-workspace">
      <PageHeader
        title="Simulateur de remboursement"
        description="Calcul pédagogique du reste à charge à partir de la BRSS, du taux AMO et de la garantie AMC. Toute valeur non vérifiée sur le référentiel 2026 est signalée plutôt qu'inventée."
      />
      <QueryTabs basePath="/simulateur" activeKey={activeTab} tabs={TABS} />
      {activeTab === "particuliers" ? <IndividualGuarantees simulator /> : activeTab === "conventions" ? <ConventionSimulator /> : activeTab === "remboursement" ? <ReimbursementSimulator /> : <AnnualCapSimulator />}
    </div>
  );
}
