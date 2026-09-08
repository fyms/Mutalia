import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DocumentStatusPill } from "@/components/ui/StatusPill";
import { RealDocumentWarningBanner } from "@/components/ui/WarningBanner";
import { ImportRealDocumentButton } from "@/components/ged/ImportRealDocumentButton";
import { getAllCases } from "@/lib/data/loaders";
import { getDocumentState } from "@/lib/store/runtimeStore";
import {
  DOCUMENT_STATUS_FLOW,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  type DocumentStatus,
} from "@/lib/domain/constants";
import { formatDate } from "@/lib/utils/format";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status: statusFilter, type: typeFilter } = await searchParams;
  const cases = getAllCases();

  const rows = cases.flatMap((c) =>
    c.documents.map((doc) => ({
      caseId: c.case_id,
      doc,
      state: getDocumentState(doc.document_id),
    })),
  );

  const types = [...new Set(rows.map((r) => r.doc.document_type))].sort();

  const filtered = rows.filter((r) => {
    const status = r.state.status ?? r.doc.status;
    if (statusFilter && status !== statusFilter) return false;
    if (typeFilter && r.doc.document_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Documents / GED"
        description="Gestion électronique des documents d'exercice (PDF fictifs) des 12 cas pratiques Mutalia."
        action={<ImportRealDocumentButton />}
      />

      <RealDocumentWarningBanner />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3 text-xs">
          <label>
            <span className="mb-1 block text-foreground-muted">Statut</span>
            <select name="status" defaultValue={statusFilter ?? ""} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Tous</option>
              {DOCUMENT_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{DOCUMENT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-foreground-muted">Type de document</span>
            <select name="type" defaultValue={typeFilter ?? ""} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Tous</option>
              {types.map((t) => (
                <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-brand px-3 py-1.5 font-medium text-white">
            Filtrer
          </button>
          {(statusFilter || typeFilter) && (
            <Link href="/documents" className="text-brand hover:underline">Réinitialiser</Link>
          )}
        </form>
      </Card>

      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Document</th>
              <th className="px-4 py-2 font-medium">Cas</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Consultation</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ caseId, doc, state }) => (
              <tr key={doc.document_id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-2.5">
                  <Link href={`/cas-pratiques/${caseId}`} className="text-brand hover:underline">
                    {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                  </Link>
                  <p className="text-[11px] text-foreground-muted">{doc.file_name}</p>
                </td>
                <td className="px-4 py-2.5">{caseId}</td>
                <td className="px-4 py-2.5 text-foreground-muted">{doc.document_date ? formatDate(doc.document_date) : "—"}</td>
                <td className="px-4 py-2.5 text-foreground-muted">{state.viewedAt.length > 0 ? "Consulté" : "Non consulté"}</td>
                <td className="px-4 py-2.5">
                  <DocumentStatusPill status={(state.status ?? doc.status) as DocumentStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
