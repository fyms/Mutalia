import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RealDocumentWarningBanner } from "@/components/ui/WarningBanner";
import { DocumentViewer } from "@/components/ged/DocumentViewer";
import { CaseSubmissionForm } from "@/components/cases/CaseSubmissionForm";
import { CorrectionPanel } from "@/components/cases/CorrectionPanel";
import { getCaseById } from "@/lib/data/loaders";
import { getDocumentState } from "@/lib/store/runtimeStore";
import { getSession } from "@/lib/store/session";
import { CASE_VALUE_FIELDS } from "@/lib/domain/caseFieldTemplates";
import { DIFFICULTY_LABELS, MEMBER_ROLE_LABELS, type DocumentStatus } from "@/lib/domain/constants";
import { formatDate } from "@/lib/utils/format";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const trainingCase = getCaseById(caseId);
  if (!trainingCase) notFound();
  const session = await getSession();

  const targetBeneficiary = trainingCase.household.members.find(
    (m) => m.member_id === trainingCase.target_beneficiary_id,
  );

  return (
    <div>
      <PageHeader
        title={`${trainingCase.case_id} — ${trainingCase.scenario_type.replace(/_/g, " ")}`}
        description={trainingCase.learner_instructions}
        action={
          <Link
            href={`/adherents/${trainingCase.household.household_id}`}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            Voir la fiche adhérent →
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="brand">{DIFFICULTY_LABELS[trainingCase.difficulty]}</Badge>
        <Badge tone="neutral">Foyer {trainingCase.household.household_id}</Badge>
        {targetBeneficiary ? (
          <Badge tone="neutral">
            Bénéficiaire ciblé : {targetBeneficiary.first_name} {targetBeneficiary.last_name} (
            {MEMBER_ROLE_LABELS[targetBeneficiary.role]})
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Objectifs du dossier" />
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {trainingCase.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Foyer" subtitle={`${trainingCase.household.members.length} membre(s)`} />
            <ul className="space-y-1 text-sm">
              {trainingCase.household.members.map((m) => (
                <li key={m.member_id} className="flex items-center justify-between">
                  <span>{m.first_name} {m.last_name} — {formatDate(m.birth_date)}</span>
                  <Badge tone="neutral">{MEMBER_ROLE_LABELS[m.role]}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <div>
            <CardHeader title="Pièces du dossier (GED)" />
            <RealDocumentWarningBanner />
            <div className="space-y-2">
              {trainingCase.documents.map((doc) => {
                const state = getDocumentState(doc.document_id);
                return (
                  <DocumentViewer
                    key={doc.document_id}
                    document={doc}
                    status={(state.status ?? doc.status) as DocumentStatus}
                    viewedCount={state.viewedAt.length}
                    annotations={state.annotations}
                    author={session.role === "formateur" ? "Formateur" : "Apprenant"}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CaseSubmissionForm
            caseId={trainingCase.case_id}
            objectives={trainingCase.objectives}
            valueFields={CASE_VALUE_FIELDS[trainingCase.case_id] ?? []}
          />
          {session.role === "formateur" ? <CorrectionPanel caseId={trainingCase.case_id} /> : null}
        </div>
      </div>
    </div>
  );
}
