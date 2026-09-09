import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllCases, getFaq, getLexicon } from "@/lib/data/loaders";
import { getAllHouseholds } from "@/lib/domain/households";
import { getProgressionSummary } from "@/lib/domain/progression";
import { getSession } from "@/lib/store/session";
import { DIFFICULTY_LABELS } from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";

export default async function CockpitPage() {
  const session = await getSession();
  const [households, cases, lexicon, faq, progression] = await Promise.all([
    Promise.resolve(getAllHouseholds()),
    Promise.resolve(getAllCases()),
    Promise.resolve(getLexicon()),
    Promise.resolve(getFaq()),
    Promise.resolve(getProgressionSummary(session.profileId)),
  ]);

  const recentAttempts = progression.perCase
    .filter((c) => c.lastSubmittedAt)
    .sort((a, b) => (b.lastSubmittedAt! > a.lastSubmittedAt! ? 1 : -1))
    .slice(0, 5);

  const stats = [
    { label: "Foyers adhérents seedés", value: households.length },
    { label: "Cas pratiques disponibles", value: cases.length },
    { label: "Entrées lexique", value: lexicon.length },
    { label: "Questions FAQ", value: faq.length },
    {
      label: "Cas tentés",
      value: `${progression.attemptedCases}/${progression.totalCases}`,
    },
    {
      label: "Score moyen (meilleure tentative)",
      value: progression.averageBestScorePercent !== null ? `${progression.averageBestScorePercent}%` : "—",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cockpit"
        description="Vue d'ensemble du portefeuille pédagogique Mutalia : adhérents fictifs, cas pratiques et activité de formation."
        action={
          session.newHireMode ? (
            <Badge tone="brand">Mode Nouveau collaborateur actif — aides renforcées</Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-2xl font-semibold text-brand-strong">{s.value}</p>
            <p className="mt-1 text-[11px] text-foreground-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Parcours recommandé"
            subtitle="Cockpit → recherche adhérent → fiche 360 → ouvrir un cas → lire les pièces → qualifier → calculer → soumettre → correction → progression"
          />
          <ol className="space-y-2 text-sm">
            <li>
              <Link href="/adherents" className="text-brand hover:underline">
                1. Rechercher un adhérent et ouvrir sa fiche 360
              </Link>
            </li>
            <li>
              <Link href="/garanties" className="text-brand hover:underline">
                2. Consulter les garanties 2026 (référentiel Harmonie Mutuelle)
              </Link>
            </li>
            <li>
              <Link href="/cas-pratiques" className="text-brand hover:underline">
                3. Ouvrir un cas pratique, lire les pièces GED et qualifier le dossier
              </Link>
            </li>
            <li>
              <Link href="/simulateur" className="text-brand hover:underline">
                4. Utiliser le simulateur de remboursement pour vos calculs
              </Link>
            </li>
            <li>
              <Link href="/progression" className="text-brand hover:underline">
                5. Suivre votre progression après correction
              </Link>
            </li>
          </ol>
        </Card>

        <Card>
          <CardHeader title="Activité récente" subtitle="Dernières soumissions de cas pratiques" />
          {recentAttempts.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucune soumission pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {recentAttempts.map((a) => (
                <li key={a.caseId} className="flex items-center justify-between text-xs">
                  <Link href={`/cas-pratiques/${a.caseId}`} className="text-brand hover:underline">
                    {a.caseId} · {DIFFICULTY_LABELS[a.difficulty] ?? a.difficulty}
                  </Link>
                  <span className="text-foreground-muted">
                    {a.bestScore}/{a.bestMaxScore} · {formatDateTime(a.lastSubmittedAt!)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
