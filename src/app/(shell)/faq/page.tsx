import { PageHeader } from "@/components/ui/PageHeader";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
import { getFaq } from "@/lib/data/loaders";

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  const { question } = await searchParams;
  const entries = getFaq();

  return (
    <div>
      <PageHeader
        title="FAQ & Procédures"
        description={`${entries.length} questions organisées en deux angles : Comprendre et Que faire ?`}
      />
      <FaqExplorer entries={entries} initialId={question} />
    </div>
  );
}
