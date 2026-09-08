"use client";

import { useState, useTransition } from "react";
import { markDocumentViewedAction, addDocumentAnnotationAction } from "@/lib/store/actions";
import { DocumentStatusSelect } from "@/components/ged/DocumentStatusSelect";
import { DOCUMENT_TYPE_LABELS, type DocumentStatus } from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";
import type { CaseDocument } from "@/lib/domain/types";
import type { DocumentAnnotation } from "@/lib/store/runtimeStore";

export function DocumentViewer({
  document,
  status,
  viewedCount,
  annotations,
  author,
}: {
  document: CaseDocument;
  status: DocumentStatus;
  viewedCount: number;
  annotations: DocumentAnnotation[];
  author: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const url = `/exercices/${document.case_id}/${document.file_name}`;

  function handleOpen() {
    setExpanded((v) => !v);
    if (viewedCount === 0) {
      startTransition(() => markDocumentViewedAction(document.document_id, document.case_id));
    }
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div>
          <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[document.document_type] ?? document.document_type}</p>
          <p className="text-[11px] text-foreground-muted">
            {document.file_name} {viewedCount > 0 ? "· consulté" : "· non consulté"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DocumentStatusSelect documentId={document.document_id} caseId={document.case_id} status={status} />
          <button
            onClick={handleOpen}
            className="rounded-md border border-brand px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
          >
            {expanded ? "Masquer" : "Consulter"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <iframe src={url} title={document.file_name} className="h-96 w-full" />
          <div className="border-t border-border p-3">
            <p className="mb-1.5 text-xs font-medium text-foreground-muted">Annotations</p>
            <ul className="mb-2 space-y-1">
              {annotations.length === 0 ? (
                <li className="text-xs text-foreground-muted">Aucune annotation.</li>
              ) : (
                annotations.map((a) => (
                  <li key={a.id} className="rounded bg-surface-muted px-2 py-1 text-xs">
                    <span className="font-medium">{a.author}</span> — {a.text}
                    <span className="ml-1 text-[10px] text-foreground-muted">{formatDateTime(a.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                startTransition(() =>
                  addDocumentAnnotationAction(document.document_id, document.case_id, note, author),
                );
                setNote("");
              }}
              className="flex gap-2"
            >
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter une annotation de qualification…"
                className="flex-1 rounded-md border border-border px-2 py-1 text-xs"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-strong"
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
