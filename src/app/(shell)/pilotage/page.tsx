import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GeneratorPanel } from "@/components/pilotage/GeneratorPanel";
import { getAllProfilesProgression } from "@/lib/domain/progression";
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

  const [profilesProgression, complaints, pecRecords, generatedCases, flagged] = await Promise.all([
    Promise.resolve(getAllProfilesProgression()),
    Promise.resolve(getComplaints()),
    Promise.resolve(getPecRecords()),
    Promise.resolve(getGeneratedCases()),
    Promise.resolve(getFlaggedDocuments()),
  ]);

  const openComplaints = complaints.filter((c) => c.status !== "cloturee").length;

  const totalCasesAttempted = profilesProgression.reduce((sum, p) => sum + p.cases.attemptedCases, 0);
  const totalModulesAttempted = profilesProgression.reduce((sum, p) => sum + p.academy.attemptedModules, 0);
  const allScorePercents = profilesProgression.flatMap((p) => [
    ...p.cases.perCase.filter((c) => c.bestMaxScore).map((c) => (c.bestScore! / c.bestMaxScore!) * 100),
    ...p.academy.perModule.filter((m) => m.bestMaxScore).map((m) => (m.bestScore! / m.bestMaxScore!) * 100),
  ]);
  const averageScorePercent =
    allScorePercents.length > 0
      ? Math.round(allScorePercents.reduce((a, b) => a + b, 0) / allScorePercents.length)
      : null;

  return (
    <div>
      <PageHeader
        title="Pilotage formateur"
        description="Vue d'ensemble de tous les comptes apprenant et formateur créés sur ce prototype (voir la note en bas de page)."
        action={
          <a
            href="/api/report/csv"
            className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
          >
            ⬇ Exporter le rapport (CSV)
          </a>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Profils suivis" value={profilesProgression.length} />
        <Stat label="Cas tentés (tous profils)" value={totalCasesAttempted} />
        <Stat label="Modules Academy tentés" value={totalModulesAttempted} />
        <Stat label="Score moyen global" value={averageScorePercent !== null ? `${averageScorePercent}%` : "—"} />
        <Stat label="Réclamations ouvertes" value={openComplaints} />
        <Stat label="PEC émises" value={pecRecords.length} />
        <Stat label="Documents en anomalie" value={flagged.length} />
      </div>

      <Card padded={false} className="mb-4">
        <CardHeader title="Progression par profil apprenant" />
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Profil</th>
              <th className="px-4 py-2 font-medium">Cas tentés</th>
              <th className="px-4 py-2 font-medium">Score moyen cas</th>
              <th className="px-4 py-2 font-medium">Modules Academy tentés</th>
              <th className="px-4 py-2 font-medium">Score moyen Academy</th>
            </tr>
          </thead>
          <tbody>
            {profilesProgression.map(({ profile, cases, academy }) => (
              <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-2.5 font-medium">👤 {profile.name}</td>
                <td className="px-4 py-2.5">{cases.attemptedCases}/{cases.totalCases}</td>
                <td className="px-4 py-2.5">
                  {cases.averageBestScorePercent !== null ? (
                    <Badge tone={cases.averageBestScorePercent >= 70 ? "success" : "warning"}>
                      {cases.averageBestScorePercent}%
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">{academy.attemptedModules}/{academy.totalModules}</td>
                <td className="px-4 py-2.5">
                  {academy.averageBestScorePercent !== null ? (
                    <Badge tone={academy.averageBestScorePercent >= 70 ? "success" : "warning"}>
                      {academy.averageBestScorePercent}%
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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

      <p className="mt-4 text-[11px] text-foreground-muted">
        Chaque compte (email + mot de passe, voir /inscription) constitue un profil apprenant ou formateur
        suivi individuellement. Authentification réelle par session serveur — données stockées dans le
        magasin de démonstration du prototype (pas d&apos;annuaire d&apos;entreprise ni d&apos;isolation
        multi-organisation : à construire pour un déploiement client réel).
      </p>
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
