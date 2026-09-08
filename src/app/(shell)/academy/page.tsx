import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAcademyCurriculum } from "@/lib/data/loaders";

export default async function AcademyPage() {
  const curriculum = getAcademyCurriculum();

  return (
    <div>
      <PageHeader
        title="Mutalia Academy"
        description={`Parcours « ${curriculum.track.title} » — ${curriculum.modules.length} modules. Le contenu détaillé (cours, flashcards, quiz, cas pratique, correction) arrive en P1 ; la structure du curriculum est déjà seedée.`}
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
        {curriculum.modules.map((m) => (
          <Card key={m.id}>
            <p className="text-xs font-semibold text-brand-strong">{m.id}</p>
            <p className="mt-1 text-sm font-medium">{m.title}</p>
            <Badge tone="neutral" className="mt-2">P1</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
