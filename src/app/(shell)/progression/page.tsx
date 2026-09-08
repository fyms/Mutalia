import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAcademyProgressionSummary, getProgressionSummary } from "@/lib/domain/progression";
import { DIFFICULTY_LABELS } from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";

export default async function ProgressionPage() {
  const progression = getProgressionSummary();
  const academyProgression = getAcademyProgressionSummary();

  return (
    <div>
      <PageHeader
        title="Progression"
        description="Suivi des cas pratiques et des quiz Mutalia Academy."
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
          <p className="mt-1 text-[11px] text-foreground-muted">Score moyen cas (meilleure tentative)</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-brand-strong">
            {progression.totalCases > 0 ? Math.round((progression.attemptedCases / progression.totalCases) * 100) : 0}%
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">Couverture des cas</p>
        </Card>
      </div>

      <Card padded={false} className="mb-6">
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

      <CardHeader
        title="Mutalia Academy"
        subtitle={`${academyProgression.attemptedModules}/${academyProgression.totalModules} module(s) tenté(s)${
          academyProgression.averageBestScorePercent !== null
            ? ` · score moyen ${academyProgression.averageBestScorePercent}%`
            : ""
        }`}
      />
      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Module</th>
              <th className="px-4 py-2 font-medium">Tentatives</th>
              <th className="px-4 py-2 font-medium">Meilleur score</th>
              <th className="px-4 py-2 font-medium">Dernière soumission</th>
            </tr>
          </thead>
          <tbody>
            {academyProgression.perModule.map((m) => (
              <tr key={m.moduleId} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-2.5">
                  <Link href={`/academy/${m.moduleId}`} className="text-brand hover:underline">
                    {m.moduleId} — {m.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{m.attempts}</td>
                <td className="px-4 py-2.5">
                  {m.bestScore !== null ? (
                    <Badge tone={m.bestScore / (m.bestMaxScore ?? 1) >= 0.7 ? "success" : "warning"}>
                      {m.bestScore}/{m.bestMaxScore}
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {m.lastSubmittedAt ? formatDateTime(m.lastSubmittedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
