"use client";

import { RuntimeDocumentViewer } from "./RuntimeDocumentViewer";
import type { RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
import { useState, useTransition } from "react";
import {
  markDocumentViewedAction,
  addDocumentAnnotationAction,
} from "@/lib/store/actions";
import { PdfCanvas } from "./PdfCanvas";
import { DocumentStatusSelect } from "@/components/ged/DocumentStatusSelect";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentStatus,
} from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";
import type { CaseDocument } from "@/lib/domain/types";
import type { DocumentAnnotation } from "@/lib/store/runtimeStore";

function SourceDocumentViewer({
  document,
  status,
  viewedCount,
  annotations,
}: {
  document: CaseDocument;
  status: DocumentStatus;
  viewedCount: number;
  annotations: DocumentAnnotation[];
  author: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const url =
    `/api/documents/${document.case_id}/${document.document_id}`;

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState("");

  function handleOpen() {
    setExpanded((v) => !v);
    if (viewedCount === 0) {
      startTransition(() =>
        markDocumentViewedAction(document.document_id, document.case_id),
      );
    }
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div>
          <p className="text-sm font-medium">
            {DOCUMENT_TYPE_LABELS[document.document_type] ??
              document.document_type}
          </p>
          <p className="text-[11px] text-foreground-muted">
            {document.file_name}{" "}
            {viewedCount > 0 ? "· consulté" : "· non consulté"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DocumentStatusSelect
            documentId={document.document_id}
            caseId={document.case_id}
            status={status}
          />
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
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
            <button
              aria-label="Page précédente"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </button>
            <span>
              Page {page} / {pages || "…"}
            </span>
            <button
              aria-label="Page suivante"
              disabled={!pages || page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </button>
            <button
              aria-label="Réduire le zoom"
              disabled={zoom <= 50}
              onClick={() => setZoom(zoom - 25)}
            >
              −
            </button>
            <span>{zoom} %</span>
            <button
              aria-label="Augmenter le zoom"
              disabled={zoom >= 200}
              onClick={() => setZoom(zoom + 25)}
            >
              +
            </button>
            <a
              className="underline"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir / télécharger
            </a>
          </div>
          <p className="m-help p-2">
            DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR
          </p>
          {error ? (
            <p role="alert" className="m-error p-3">
              {error}
            </p>
          ) : (
            <PdfCanvas
              url={url}
              page={page}
              zoom={zoom}
              onLoaded={(count) => {
                setPages(count);
                startTransition(async () => {
                  try {
                    await markDocumentViewedAction(
                      document.document_id,
                      document.case_id,
                    );
                  } catch {
                    setError(
                      "Lecture non enregistrée. Réessayez après reconnexion.",
                    );
                  }
                });
              }}
            />
          )}
          <div className="border-t border-border p-3">
            <p className="mb-1.5 text-xs font-medium text-foreground-muted">
              Annotations
            </p>
            <ul className="mb-2 space-y-1">
              {annotations.length === 0 ? (
                <li className="text-xs text-foreground-muted">
                  Aucune annotation.
                </li>
              ) : (
                annotations.map((a) => (
                  <li
                    key={a.id}
                    className="rounded bg-surface-muted px-2 py-1 text-xs"
                  >
                    <span className="font-medium">{a.author}</span> — {a.text}
                    <span className="ml-1 text-[10px] text-foreground-muted">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                startTransition(async () => {
                  try {
                    await addDocumentAnnotationAction(
                      document.document_id,
                      document.case_id,
                      note,
                    );
                    setNote("");
                    setError("");
                  } catch {
                    setError(
                      "Échec de sauvegarde. Votre annotation est conservée ; réessayez.",
                    );
                  }
                });
              }}
              className="flex gap-2"
            >
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Annotation documentaire"
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

export function DocumentViewer(props:Parameters<typeof SourceDocumentViewer>[0]|{runtimeDocument:RuntimeDocumentView}) {
 return "runtimeDocument" in props?<RuntimeDocumentViewer document={props.runtimeDocument}/>:<SourceDocumentViewer {...props}/>;
}
