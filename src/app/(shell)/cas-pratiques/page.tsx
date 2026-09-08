import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllCases } from "@/lib/data/loaders";
import { getProgressionSummary } from "@/lib/domain/progression";
import { DIFFICULTY_LABELS } from "@/lib/domain/constants";

const DIFFICULTY_TONE: Record<string, "success" | "brand" | "warning"> = {
  debutant: "success",
  intermediaire: "brand",
  avance: "warning",
};

export default async function CasPratiquesPage() {
  const cases = getAllCases();
  const progression = getProgressionSummary();
  const byId = new Map(progression.perCase.map((c) => [c.caseId, c]));

  return (
    <div>
      <PageHeader
        title="Cas pratiques"
        description="12 dossiers pédagogiques Mutalia (documents fictifs, corrigé caché en mode apprenant)."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cases.map((c) => {
          const progress = byId.get(c.case_id);
          return (
            <Link key={c.case_id} href={`/cas-pratiques/${c.case_id}`}>
              <Card className="h-full transition hover:border-brand/50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{c.case_id}</span>
                  <Badge tone={DIFFICULTY_TONE[c.difficulty]}>{DIFFICULTY_LABELS[c.difficulty]}</Badge>
                </div>
                <p className="text-sm capitalize text-foreground-muted">{c.scenario_type.replace(/_/g, " ")}</p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {c.documents.length} document(s) · {c.household.members.length} membre(s) du foyer
                </p>
                {progress && progress.attempts > 0 ? (
                  <p className="mt-2 text-xs font-medium text-brand">
                    Meilleur score : {progress.bestScore}/{progress.bestMaxScore} ({progress.attempts} tentative(s))
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-foreground-muted">Pas encore tenté</p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
