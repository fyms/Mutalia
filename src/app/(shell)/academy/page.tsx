import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAcademyCurriculum } from "@/lib/data/loaders";
import { getAcademyProgressionSummary } from "@/lib/domain/progression";
import { getSession } from "@/lib/store/session";

export default async function AcademyPage() {
  const curriculum = getAcademyCurriculum();
  const session = await getSession();
  const progression = getAcademyProgressionSummary(session.profileId);
  const byId = new Map(progression.perModule.map((m) => [m.moduleId, m]));

  return (
    <div>
      <PageHeader
        title="Mutalia Academy"
        description={`Parcours « ${curriculum.track.title} » — ${curriculum.modules.length} modules avec cours, exemple, flashcards, quiz et cas pratique lié.`}
      />

      <Card className="mb-4">
        <CardHeader title="Niveaux du parcours" />
        <div className="flex flex-wrap gap-1.5">
          {curriculum.levels.map((l) => (
            <Badge key={l} tone="brand">{l}</Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground-muted">
          Séquence pédagogique par module : {curriculum.lesson_flow.join(" → ")}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {curriculum.modules.map((m) => {
          const progress = byId.get(m.id);
          return (
            <Link key={m.id} href={`/academy/${m.id}`}>
              <Card className="h-full transition hover:border-brand/50">
                <p className="text-xs font-semibold text-brand-strong">{m.id}</p>
                <p className="mt-1 text-sm font-medium">{m.title}</p>
                {progress && progress.attempts > 0 ? (
                  <Badge tone={progress.bestScore! / progress.bestMaxScore! >= 0.7 ? "success" : "warning"} className="mt-2">
                    Quiz : {progress.bestScore}/{progress.bestMaxScore}
                  </Badge>
                ) : (
                  <Badge tone="neutral" className="mt-2">Non commencé</Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
