import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { QuizRunner } from "@/components/academy/QuizRunner";
import { Flashcards } from "@/components/academy/Flashcards";
import { CorrectionPanel } from "@/components/cases/CorrectionPanel";
import { getAcademyCurriculum, getLexicon } from "@/lib/data/loaders";
import { getAcademyModuleContent } from "@/lib/domain/academyContent";
import { getSession } from "@/lib/store/session";
import { getQuizAttempts } from "@/lib/store/runtimeStore";
import { formatDateTime } from "@/lib/utils/format";

const TABS = [
  { key: "cours", label: "Cours" },
  { key: "exemple", label: "Exemple" },
  { key: "flashcards", label: "Flashcards" },
  { key: "quiz", label: "Quiz" },
  { key: "cas_pratique", label: "Cas pratique" },
  { key: "correction", label: "Correction" },
];

export default async function AcademyModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { moduleId } = await params;
  const { tab } = await searchParams;
  const curriculum = getAcademyCurriculum();
  const moduleMeta = curriculum.modules.find((m) => m.id === moduleId);
  const content = getAcademyModuleContent(moduleId);
  if (!moduleMeta || !content) notFound();

  const session = await getSession();
  const lexicon = getLexicon();
  const flashcardEntries = lexicon.filter((e) => content.lexiconCategories.includes(e.category));
  const attempts = getQuizAttempts(session.profileId, moduleId);
  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "cours";
  const basePath = `/academy/${moduleId}`;

  return (
    <div>
      <PageHeader
        title={`${moduleMeta.id} — ${moduleMeta.title}`}
        description="Séquence pédagogique : cours → exemple → flashcards → quiz → cas pratique → correction."
        action={
          <Link href="/academy" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted">
            ← Tous les modules
          </Link>
        }
      />

      <QueryTabs basePath={basePath} activeKey={activeTab} tabs={TABS} />

      {activeTab === "cours" && (
        <Card>
          <CardHeader title="Cours" />
          <div className="space-y-3 text-sm">
            {content.course.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "exemple" && (
        <Card>
          <CardHeader title="Exemple" />
          <p className="text-sm">{content.example}</p>
        </Card>
      )}

      {activeTab === "flashcards" && <Flashcards entries={flashcardEntries} />}

      {activeTab === "quiz" && (
        <div className="space-y-3">
          {attempts.length > 0 ? (
            <p className="text-xs text-foreground-muted">
              {attempts.length} tentative(s) — dernière le {formatDateTime(attempts[attempts.length - 1].submittedAt)}
            </p>
          ) : null}
          <QuizRunner moduleId={moduleId} questions={content.quiz} />
        </div>
      )}

      {activeTab === "cas_pratique" && (
        <Card>
          <CardHeader title="Cas pratique associé" />
          {content.linkedCaseIds.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucun cas pratique associé à ce module conceptuel.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {content.linkedCaseIds.map((cid) => (
                <Link
                  key={cid}
                  href={`/cas-pratiques/${cid}`}
                  className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
                >
                  Ouvrir {cid} →
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "correction" && (
        <div className="space-y-3">
          {content.linkedCaseIds.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucune correction associée : module conceptuel sans cas pratique.</p>
          ) : session.role !== "formateur" ? (
            <Card>
              <p className="text-xs text-foreground-muted">
                Le corrigé n&apos;est visible qu&apos;en mode Formateur. Résolvez d&apos;abord le cas pratique
                pour obtenir votre propre correction chiffrée.
              </p>
            </Card>
          ) : (
            content.linkedCaseIds.map((cid) => (
              <div key={cid}>
                <Badge tone="neutral" className="mb-2">{cid}</Badge>
                <CorrectionPanel caseId={cid} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
