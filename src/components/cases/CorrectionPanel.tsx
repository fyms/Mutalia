"use client";

import { useState, useTransition } from "react";
import { getAnswerKeyForFormateurAction } from "@/lib/domain/caseActions";
import type { AnswerKey } from "@/lib/domain/types";
import { anomalyLabel } from "@/lib/domain/scoring";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function CorrectionPanel({ caseId }: { caseId: string }) {
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        setAnswerKey(await getAnswerKeyForFormateurAction(caseId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Accès refusé.");
      }
    });
  }

  return (
    <Card className="border-brand/40 bg-brand-soft/30">
      <CardHeader
        title="Corrigé formateur"
        subtitle="Réservé au mode Formateur — jamais transmis en mode apprenant"
      />
      {!answerKey ? (
        <button
          onClick={load}
          disabled={isPending}
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          {isPending ? "Chargement…" : "Afficher le corrigé"}
        </button>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-muted">Anomalies attendues</p>
            {answerKey.anomalies.length === 0 ? (
              <p className="text-foreground-muted">Aucune anomalie.</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1">
                {answerKey.anomalies.map((a) => (
                  <Badge key={a} tone="danger">{anomalyLabel(a)}</Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-muted">Actions attendues</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {answerKey.expected_actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          {Object.keys(answerKey.expected_values).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-foreground-muted">Valeurs attendues</p>
              <dl className="mt-1 space-y-0.5">
                {Object.entries(answerKey.expected_values).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <dt className="text-foreground-muted">{k}</dt>
                    <dd className="font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {answerKey.trainer_notes ? (
            <p className="text-xs italic text-foreground-muted">{answerKey.trainer_notes}</p>
          ) : null}
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </Card>
  );
}
