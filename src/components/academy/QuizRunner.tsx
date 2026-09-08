"use client";

import { useState, useTransition } from "react";
import { submitAcademyQuizAction, type QuizSubmissionResult } from "@/lib/domain/academyActions";
import type { QuizQuestion } from "@/lib/domain/academyContent";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function QuizRunner({ moduleId, questions }: { moduleId: string; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitAcademyQuizAction(moduleId, answers);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la soumission du quiz.");
      }
    });
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  return (
    <Card>
      <CardHeader title={`Quiz — ${questions.length} question(s)`} />
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isCorrect = result && q.correctIndex === answers[q.id];
          const showState = !!result;
          return (
            <div key={q.id} className="border-b border-border pb-3 last:border-0">
              <p className="mb-2 text-sm font-medium">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-1">
                {q.options.map((opt, optIdx) => {
                  const selected = answers[q.id] === optIdx;
                  const isRightAnswer = optIdx === q.correctIndex;
                  let stateClass = "border-border hover:bg-surface-muted";
                  if (showState && isRightAnswer) stateClass = "border-success bg-success-soft";
                  else if (showState && selected && !isRightAnswer) stateClass = "border-danger bg-danger-soft";
                  else if (!showState && selected) stateClass = "border-brand bg-brand-soft";
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={!!result}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: optIdx }))}
                      className={`block w-full rounded-md border px-3 py-1.5 text-left text-xs ${stateClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showState ? (
                <p className={`mt-1.5 text-xs ${isCorrect ? "text-success" : "text-danger"}`}>{q.explanation}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isPending}
          className="mt-3 rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {isPending ? "Correction…" : "Valider le quiz"}
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <Badge tone={result.score / result.maxScore >= 0.7 ? "success" : "warning"}>
            {result.score}/{result.maxScore}
          </Badge>
          <button
            onClick={retry}
            className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
          >
            Recommencer
          </button>
        </div>
      )}
    </Card>
  );
}
