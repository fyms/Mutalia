import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPrestations } from "@/lib/domain/prestations";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export default async function PrestationsPage() {
  const prestations = getPrestations();

  return (
    <div>
      <PageHeader
        title="Prestations"
        description="Historique des prestations liquidées pédagogiquement, dérivé des soumissions de cas pratiques (jamais du corrigé)."
      />

      {prestations.length === 0 ? (
        <EmptyState
          title="Aucune prestation liquidée pour le moment"
          description="Résolvez un cas pratique pour qu'il apparaisse ici comme une prestation traitée."
          action={
            <Link href="/cas-pratiques" className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft">
              Ouvrir les cas pratiques →
            </Link>
          }
        />
      ) : (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Foyer</th>
                <th className="px-4 py-2 font-medium">Cas</th>
                <th className="px-4 py-2 font-medium">Montant retenu</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {prestations.map((p, idx) => (
                <tr key={`${p.caseId}-${idx}`} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-2.5">
                    <Link href={`/adherents/${p.householdId}`} className="text-brand hover:underline">
                      {p.adherentName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/cas-pratiques/${p.caseId}`} className="text-brand hover:underline">
                      {p.caseId}
                    </Link>
                    <p className="text-[11px] capitalize text-foreground-muted">{p.scenarioType.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-4 py-2.5">{p.retainedAmount !== null ? formatCurrency(p.retainedAmount) : "—"}</td>
                  <td className="px-4 py-2.5">{p.score}/{p.maxScore}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.status === "liquidee" ? "success" : "warning"}>
                      {p.status === "liquidee" ? "Liquidée" : "À vérifier"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(p.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
