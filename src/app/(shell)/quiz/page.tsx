import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAcademyCurriculum } from "@/lib/data/loaders";
import { getAcademyModuleContent } from "@/lib/domain/academyContent";
import { getAcademyProgressionSummary } from "@/lib/domain/progression";

export default async function QuizPage() {
  const curriculum = getAcademyCurriculum();
  const progression = getAcademyProgressionSummary();
  const byId = new Map(progression.perModule.map((m) => [m.moduleId, m]));

  return (
    <div>
      <PageHeader
        title="Quiz"
        description="Un quiz noté par module Academy. Le score est calculé côté serveur et enregistré dans votre progression."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {curriculum.modules.map((m) => {
          const content = getAcademyModuleContent(m.id);
          const progress = byId.get(m.id);
          const questionCount = content?.quiz.length ?? 0;
          return (
            <Link key={m.id} href={`/academy/${m.id}?tab=quiz`}>
              <Card className="h-full transition hover:border-brand/50">
                <p className="text-xs font-semibold text-brand-strong">{m.id}</p>
                <p className="mt-1 text-sm font-medium">{m.title}</p>
                <p className="mt-1 text-xs text-foreground-muted">{questionCount} question(s)</p>
                {progress && progress.attempts > 0 ? (
                  <Badge tone={progress.bestScore! / progress.bestMaxScore! >= 0.7 ? "success" : "warning"} className="mt-2">
                    Meilleur score : {progress.bestScore}/{progress.bestMaxScore}
                  </Badge>
                ) : (
                  <Badge tone="neutral" className="mt-2">Pas encore tenté</Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
