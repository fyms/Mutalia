"use client";

import { useTransition } from "react";
import { setDocumentStatusAction } from "@/lib/store/actions";
import { DOCUMENT_STATUS_FLOW, DOCUMENT_STATUS_LABELS, type DocumentStatus } from "@/lib/domain/constants";

export function DocumentStatusSelect({
  documentId,
  caseId,
  status,
}: {
  documentId: string;
  caseId: string;
  status: DocumentStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => setDocumentStatusAction(documentId, caseId, e.target.value as DocumentStatus))
      }
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
    >
      {DOCUMENT_STATUS_FLOW.map((s) => (
        <option key={s} value={s}>
          {DOCUMENT_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
