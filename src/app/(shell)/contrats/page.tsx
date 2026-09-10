import { getSession } from "@/lib/store/session";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { getAllHouseholds } from "@/lib/domain/households";

export default async function ContratsPage() {
  const households = getAllHouseholds((await getSession()).userId);

  return (
    <div>
      <PageHeader
        title="Contrats"
        description="Le détail contractuel de chaque foyer est géré dans l'onglet « Contrat » de la fiche adhérent 360."
      />
      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Foyer</th>
              <th className="px-4 py-2 font-medium">Organisme</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Formule</th>
            </tr>
          </thead>
          <tbody>
            {households.map((h) => (
              <tr key={h.householdId} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">
                  <Link href={`/adherents/${h.householdId}?tab=contrat`} className="text-brand hover:underline">
                    {h.adherent.first_name} {h.adherent.last_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{h.case?.contract.provider ?? "Harmonie Mutuelle"}</td>
                <td className="px-4 py-2.5">{h.case?.contract.status ?? "Adhésion saisie"}</td>
                <td className="px-4 py-2.5">{h.assignedFormula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
