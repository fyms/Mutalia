"use client";

import { useState } from "react";
import type { LexiconEntry } from "@/lib/domain/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Question {
  entry: LexiconEntry;
  options: LexiconEntry[];
}

function buildQuestions(entries: LexiconEntry[], count: number): Question[] {
  const pool = entries.filter((e) => e.definition_simple);
  const picked = shuffle(pool).slice(0, count);
  return picked.map((entry) => {
    const distractors = shuffle(pool.filter((e) => e.id !== entry.id)).slice(0, 3);
    return { entry, options: shuffle([entry, ...distractors]) };
  });
}

export function LexiconMiniQuiz({ entries }: { entries: LexiconEntry[] }) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  function start() {
    setQuestions(buildQuestions(entries, 5));
    setIndex(0);
    setScore(0);
    setSelectedId(null);
    setStarted(true);
  }

  const current = questions[index];
  const finished = started && index >= questions.length;

  return (
    <Card>
      <CardHeader title="Mini-quiz lexique" subtitle="5 questions aléatoires pour vérifier vos acquis" />
      {!started ? (
        <button onClick={start} className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong">
          Démarrer le mini-quiz
        </button>
      ) : finished ? (
        <div className="text-sm">
          <p className="font-medium">Score : {score}/{questions.length}</p>
          <button onClick={start} className="mt-2 rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft">
            Recommencer
          </button>
        </div>
      ) : current ? (
        <div>
          <p className="mb-3 text-sm font-medium">
            Question {index + 1}/{questions.length} — quelle définition correspond à{" "}
            <Badge tone="brand">{current.entry.acronym ?? current.entry.term}</Badge> ?
          </p>
          <div className="space-y-1.5">
            {current.options.map((opt) => {
              const isSelected = selectedId === opt.id;
              const isCorrect = opt.id === current.entry.id;
              const showState = selectedId !== null;
              return (
                <button
                  key={opt.id}
                  disabled={selectedId !== null}
                  onClick={() => {
                    setSelectedId(opt.id);
                    if (isCorrect) setScore((s) => s + 1);
                    setTimeout(() => {
                      setIndex((i) => i + 1);
                      setSelectedId(null);
                    }, 700);
                  }}
                  className={`block w-full rounded-md border px-3 py-1.5 text-left text-xs ${
                    showState && isCorrect
                      ? "border-success bg-success-soft"
                      : showState && isSelected
                        ? "border-danger bg-danger-soft"
                        : "border-border hover:bg-surface-muted"
                  }`}
                >
                  {opt.definition_simple}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
