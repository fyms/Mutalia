import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GeneratorPanel } from "@/components/pilotage/GeneratorPanel";
import { getProgressionSummary, getAcademyProgressionSummary } from "@/lib/domain/progression";
import { getFlaggedDocuments } from "@/lib/domain/anomalies";
import { getSession } from "@/lib/store/session";
import {
  getComplaints,
  getGeneratedCases,
  getPecRecords,
} from "@/lib/store/runtimeStore";
import { formatDateTime } from "@/lib/utils/format";

export default async function PilotagePage() {
  const session = await getSession();

  if (session.role !== "formateur") {
    return (
      <div>
        <PageHeader title="Pilotage formateur" description="Tableau de bord réservé au mode Formateur." />
        <EmptyState
          title="Accès réservé"
          description="Basculez en mode Formateur (barre du haut) pour accéder au pilotage et au générateur de cas."
        />
      </div>
    );
  }

  const [progression, academyProgression, complaints, pecRecords, generatedCases, flagged] = await Promise.all([
    Promise.resolve(getProgressionSummary()),
    Promise.resolve(getAcademyProgressionSummary()),
    Promise.resolve(getComplaints()),
    Promise.resolve(getPecRecords()),
    Promise.resolve(getGeneratedCases()),
    Promise.resolve(getFlaggedDocuments()),
  ]);

  const openComplaints = complaints.filter((c) => c.status !== "cloturee").length;

  return (
    <div>
      <PageHeader
        title="Pilotage formateur"
        description="Vue d'ensemble mono-session du portefeuille pédagogique. Le pilotage multi-apprenants nécessite un modèle de comptes (P3)."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Cas tentés" value={`${progression.attemptedCases}/${progression.totalCases}`} />
        <Stat label="Score moyen cas" value={progression.averageBestScorePercent !== null ? `${progression.averageBestScorePercent}%` : "—"} />
        <Stat label="Modules Academy tentés" value={`${academyProgression.attemptedModules}/${academyProgression.totalModules}`} />
        <Stat label="Réclamations ouvertes" value={openComplaints} />
        <Stat label="PEC émises" value={pecRecords.length} />
        <Stat label="Documents en anomalie" value={flagged.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GeneratorPanel />

        <Card padded={false}>
          <CardHeader title="Cas générés dynamiquement" />
          {generatedCases.length === 0 ? (
            <p className="px-4 pb-4 text-xs text-foreground-muted">Aucun cas généré pour le moment.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Cas</th>
                  <th className="px-4 py-2 font-medium">Difficulté</th>
                  <th className="px-4 py-2 font-medium">Généré le</th>
                </tr>
              </thead>
              <tbody>
                {generatedCases.map((g) => (
                  <tr key={g.case.case_id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="px-4 py-2.5">
                      <Link href={`/cas-pratiques/${g.case.case_id}`} className="text-brand hover:underline">{g.case.case_id}</Link>
                      <p className="text-[11px] capitalize text-foreground-muted">{g.case.scenario_type.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone="brand">{g.case.difficulty}</Badge></td>
                    <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-semibold text-brand-strong">{value}</p>
      <p className="mt-1 text-[11px] text-foreground-muted">{label}</p>
    </Card>
  );
}
