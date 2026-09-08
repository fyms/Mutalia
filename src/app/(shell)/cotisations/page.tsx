import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { CotisationStatusSelect } from "@/components/cotisations/CotisationStatusSelect";
import { RegularisationCalculator } from "@/components/cotisations/RegularisationCalculator";
import { getAllHouseholds } from "@/lib/domain/households";
import { getAllCotisationStates } from "@/lib/store/runtimeStore";
import type { CotisationStatus } from "@/lib/domain/constants";
import { getSession } from "@/lib/store/session";

export default async function CotisationsPage() {
  const [households, cotisations, session] = await Promise.all([
    Promise.resolve(getAllHouseholds()),
    Promise.resolve(getAllCotisationStates()),
    getSession(),
  ]);

  return (
    <div>
      <PageHeader
        title="Cotisations"
        description="Mécanique de régularisation et suivi de statut. Aucune grille tarifaire 2026 n'étant fournie par le pack, les montants du calculateur sont libres et pédagogiques."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card padded={false}>
          <CardHeader title="Suivi par foyer" />
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Foyer</th>
                <th className="px-4 py-2 font-medium">Statut cotisation</th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => (
                <tr key={h.householdId} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-2.5">
                    <Link href={`/adherents/${h.householdId}`} className="text-brand hover:underline">
                      {h.adherent.first_name} {h.adherent.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <CotisationStatusSelect
                      householdId={h.householdId}
                      status={(cotisations[h.householdId]?.status ?? "a_jour") as CotisationStatus}
                      editable={session.role === "formateur"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {session.role !== "formateur" ? (
            <p className="px-4 py-3 text-[11px] text-foreground-muted">
              Le changement de statut (simulation d&apos;impayé/relance) est réservé au mode Formateur.
            </p>
          ) : null}
        </Card>

        <RegularisationCalculator />
      </div>
    </div>
  );
}
