"use client";
import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";
import { CaseSubmissionForm } from "@/components/cases/CaseSubmissionForm";
import type { TrainingCase, LearnerFeedback } from "@/lib/domain/types";
import type { DocumentState } from "@/lib/store/runtimeStore";
import type { SavedDraft } from "@/lib/domain/drafts";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
export function GedWorkspace({
  trainingCase,
  states,
  draft,
  feedback,
  author,
}: {
  trainingCase: TrainingCase;
  states: Record<string, DocumentState>;
  draft: SavedDraft | null;
  feedback: LearnerFeedback | null;
  author: string;
}) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState("document");
  const doc = trainingCase.documents[selected];
  const state = states[doc.document_id];
  return (
    <>
      <div className="m-ged-switch">
        <button
          className="m-button m-button--secondary"
          aria-pressed={view === "document"}
          onClick={() => setView("document")}
        >
          Document
        </button>
        <button
          className="m-button m-button--secondary"
          aria-pressed={view === "controle"}
          onClick={() => setView("controle")}
        >
          Qualification et contrôle
        </button>
      </div>
      <div className={`m-ged view-${view}`}>
        <div className="m-panel m-pieces">
          <h2>Pièces du dossier</h2>
          {trainingCase.documents.map((d, i) => (
            <button
              key={d.document_id}
              className="m-piece"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {DOCUMENT_TYPE_LABELS[d.document_type] ?? "Pièce"}
              <span>{d.file_name}</span>
            </button>
          ))}
        </div>
        <div className="m-document">
          <DocumentViewer
            key={doc.document_id}
            document={doc}
            status={state.status ?? "a_qualifier"}
            viewedCount={state.viewedAt.length}
            annotations={state.annotations}
            author={author}
          />
        </div>
        <div className="m-control">
          <CaseSubmissionForm
            key={trainingCase.case_id}
            caseId={trainingCase.case_id}
            objectives={trainingCase.objectives}
            valueFields={["billed", "brss", "amo", "total"]}
            trainingCase={trainingCase}
            initialDraft={draft}
            initialFeedback={feedback}
          />
        </div>
      </div>
    </>
  );
}
