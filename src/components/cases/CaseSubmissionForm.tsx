"use client";

import { useState, useTransition, useEffect } from "react";
import { saveDraftAction } from "@/lib/domain/draftActions";
import type { SavedDraft } from "@/lib/domain/drafts";
import type { TrainingCase } from "@/lib/domain/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
import { ContextHelp, Select } from "@/components/ui/Controls";
import { submitCaseAction } from "@/lib/domain/caseActions";
import {
  ANOMALY_CODES,
  ANOMALY_LABELS,
  VALUE_FIELD_LABELS,
  type AnomalyCode,
} from "@/lib/domain/constants";
import type { LearnerFeedback } from "@/lib/domain/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function CaseSubmissionForm({
  caseId,
  objectives,
  valueFields,
  initialDraft,
  initialFeedback,
  trainingCase,
}: {
  caseId: string;
  objectives: string[];
  valueFields: string[];
  initialDraft: SavedDraft | null;
  initialFeedback: LearnerFeedback | null;
  trainingCase: TrainingCase;
}) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialDraft?.input.completedObjectives ?? []),
  );
  const [anomalies, setAnomalies] = useState<Set<AnomalyCode>>(
    new Set((initialDraft?.input.selectedAnomalies ?? []) as AnomalyCode[]),
  );
  const [values, setValues] = useState<Record<string, string>>(
    initialDraft?.input.values ?? {},
  );
  const [explanation, setExplanation] = useState(
    initialDraft?.input.explanation ?? "",
  );
  const [feedback, setFeedback] = useState<LearnerFeedback | null>(
    initialFeedback,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [revision, setRevision] = useState(initialDraft?.revision ?? 0);
  const [qualifications, setQualifications] = useState(
    initialDraft?.input.qualifications ?? {},
  );
  const [saveStatus, setSaveStatus] = useState(
    initialDraft ? "Enregistré" : "Non enregistré",
  );
  const input = {
    caseId,
    completedObjectives: [...completed],
    selectedAnomalies: [...anomalies],
    values,
    explanation,
    qualifications,
  };
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(input));
  const dirty = JSON.stringify(input) !== savedSnapshot;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save() {
    setSaveStatus("Enregistrement…");
    try {
      const result = await saveDraftAction(input, revision);
      if (!result.ok) throw new Error(result.error);
      const saved = result.draft;
      setRevision(saved.revision);
      setSavedSnapshot(JSON.stringify(input));
      setSaveStatus("Enregistré");
      return saved;
    } catch (err) {
      setSaveStatus("Échec — saisie conservée");
      throw err;
    }
  }
  function toggleAnomaly(code: AnomalyCode) {
    setAnomalies((prev) => {
      const next = new Set(prev);
      if (code === "aucune")
        return next.has("aucune") ? new Set() : new Set(["aucune"]);
      next.delete("aucune");
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const saved = await save();
        const result = await submitCaseAction({
          ...input,
          revision: saved.revision,
        });
        setFeedback(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la soumission.",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader
        title="Qualification et contrôle"
        subtitle="Votre travail personnel sur ce dossier"
      />
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <fieldset disabled={isPending} className="space-y-4">
          <legend className="font-bold">Qualifier les pièces</legend>
          {trainingCase.documents.map((d) => (
            <div key={d.document_id} className="space-y-2">
              <p>{d.file_name}</p>
              <Select
                label="Type de document"
                value={qualifications[d.document_id]?.type ?? ""}
                onChange={(e) =>
                  setQualifications((q) => ({
                    ...q,
                    [d.document_id]: {
                      beneficiary: q[d.document_id]?.beneficiary ?? "",
                      type: e.target.value,
                    },
                  }))
                }
              >
                <option value="">À qualifier</option>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select
                label="Bénéficiaire"
                value={qualifications[d.document_id]?.beneficiary ?? ""}
                onChange={(e) =>
                  setQualifications((q) => ({
                    ...q,
                    [d.document_id]: {
                      type: q[d.document_id]?.type ?? "",
                      beneficiary: e.target.value,
                    },
                  }))
                }
              >
                <option value="">À associer</option>
                {trainingCase.household.members.map((m) => (
                  <option key={m.member_id} value={m.member_id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </fieldset>
        <ContextHelp />
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Étapes réalisées
          </legend>
          <div className="space-y-1">
            {objectives.map((o) => (
              <label key={o} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={completed.has(o)}
                  onChange={() =>
                    setCompleted((prev) => {
                      const next = new Set(prev);
                      if (next.has(o)) next.delete(o);
                      else next.add(o);
                      return next;
                    })
                  }
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Anomalies détectées
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {ANOMALY_CODES.map((code) => (
              <button
                type="button"
                key={code}
                aria-pressed={anomalies.has(code)}
                onClick={() => toggleAnomaly(code)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  anomalies.has(code)
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-border text-foreground-muted hover:bg-surface-muted"
                }`}
              >
                {ANOMALY_LABELS[code]}
              </button>
            ))}
          </div>
        </fieldset>

        {valueFields.length > 0 && (
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Valeurs calculées
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {valueFields.map((key) => {
                const meta = VALUE_FIELD_LABELS[key];
                return (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs text-foreground-muted">
                      {meta?.label ?? key}
                    </span>
                    <input
                      type={meta?.type === "date" ? "date" : "text"}
                      inputMode={
                        meta?.type === "currency" || meta?.type === "number"
                          ? "decimal"
                          : undefined
                      }
                      value={values[key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [key]: e.target.value }))
                      }
                      className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Justification
          </legend>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            aria-label="Justification obligatoire"
            required
            minLength={10}
            maxLength={5000}
            rows={4}
            placeholder="Expliquez votre raisonnement métier (référentiel 2026, garantie appliquée, anomalie éventuelle)…"
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </fieldset>

        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}

        <p role="status">
          {dirty && saveStatus === "Enregistré"
            ? "Modifications non enregistrées"
            : saveStatus}
        </p>
        <button
          type="button"
          className="m-button m-button--secondary"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                setError(null);
                await save();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Enregistrement impossible",
                );
              }
            })
          }
        >
          Enregistrer le brouillon
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? "Soumission en cours…" : "Soumettre le dossier"}
        </button>
      </form>

      {feedback ? <FeedbackPanel feedback={feedback} /> : null}
    </Card>
  );
}

function FeedbackPanel({ feedback }: { feedback: LearnerFeedback }) {
  const percent = Math.round((feedback.score / feedback.maxScore) * 100);
  return (
    <div
      role="status"
      tabIndex={-1}
      className="mt-5 border-t border-border pt-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Soumission reçue — correction</p>
        <Badge
          tone={
            percent >= 70 ? "success" : percent >= 40 ? "warning" : "danger"
          }
        >
          {feedback.score}/{feedback.maxScore} pts ({percent}%)
        </Badge>
      </div>
      <ul className="space-y-2">
        {feedback.breakdown.map((b) => (
          <li key={b.dimension} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{b.label}</span>
              <span className="text-foreground-muted">
                {b.points}/{b.maxPoints}
              </span>
            </div>
            <p className="text-foreground-muted">{b.comment}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-foreground-muted">
        Note « Explication » indicative en mode prototype, à valider par un
        formateur.
      </p>
    </div>
  );
}
