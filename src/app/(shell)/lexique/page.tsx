import { PageHeader } from "@/components/ui/PageHeader";
import { LexiconExplorer } from "@/components/lexicon/LexiconExplorer";
import { LexiconMiniQuiz } from "@/components/lexicon/LexiconMiniQuiz";
import { getLexicon } from "@/lib/data/loaders";

export default async function LexiquePage({
  searchParams,
}: {
  searchParams: Promise<{ terme?: string }>;
}) {
  const { terme } = await searchParams;
  const entries = getLexicon();

  return (
    <div>
      <PageHeader
        title="Lexique métier"
        description={`${entries.length} entrées : recherche plein texte, index alphabétique, catégories, niveaux, favoris et mini-quiz.`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <LexiconExplorer entries={entries} initialTermId={terme} />
        <LexiconMiniQuiz entries={entries} />
      </div>
    </div>
  );
}
