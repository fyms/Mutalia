import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getProgressionSummary } from "@/lib/domain/progression";
import { DIFFICULTY_LABELS } from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";

export default async function ProgressionPage() {
  const progression = getProgressionSummary();

  return (
    <div>
      <PageHeader
        title="Progression"
        description="Suivi des tentatives de résolution des 12 cas pratiques. Le détail Academy / quiz / flashcards arrive en P1."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-2xl font-semibold text-brand-strong">{progression.totalCases}</p>
          <p className="mt-1 text-[11px] text-foreground-muted">Cas disponibles</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-brand-strong">{progression.attemptedCases}</p>
          <p className="mt-1 text-[11px] text-foreground-muted">Cas tentés</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-brand-strong">
            {progression.averageBestScorePercent !== null ? `${progression.averageBestScorePercent}%` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">Score moyen (meilleure tentative)</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-brand-strong">
            {progression.totalCases > 0 ? Math.round((progression.attemptedCases / progression.totalCases) * 100) : 0}%
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">Couverture du parcours</p>
        </Card>
      </div>

      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Cas</th>
              <th className="px-4 py-2 font-medium">Difficulté</th>
              <th className="px-4 py-2 font-medium">Tentatives</th>
              <th className="px-4 py-2 font-medium">Meilleur score</th>
              <th className="px-4 py-2 font-medium">Dernière soumission</th>
            </tr>
          </thead>
          <tbody>
            {progression.perCase.map((c) => (
              <tr key={c.caseId} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-2.5">
                  <Link href={`/cas-pratiques/${c.caseId}`} className="text-brand hover:underline">
                    {c.caseId}
                  </Link>
                  <p className="text-[11px] capitalize text-foreground-muted">{c.scenarioType.replace(/_/g, " ")}</p>
                </td>
                <td className="px-4 py-2.5">{DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}</td>
                <td className="px-4 py-2.5">{c.attempts}</td>
                <td className="px-4 py-2.5">
                  {c.bestScore !== null ? (
                    <Badge tone={c.bestScore / (c.bestMaxScore ?? 1) >= 0.7 ? "success" : "warning"}>
                      {c.bestScore}/{c.bestMaxScore}
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {c.lastSubmittedAt ? formatDateTime(c.lastSubmittedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
