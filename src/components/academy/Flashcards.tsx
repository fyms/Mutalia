"use client";

import { useState } from "react";
import type { LexiconEntry } from "@/lib/domain/types";
import { Card, CardHeader } from "@/components/ui/Card";

export function Flashcards({ entries }: { entries: LexiconEntry[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader title="Flashcards" />
        <p className="text-xs text-foreground-muted">Aucune flashcard associée à ce module.</p>
      </Card>
    );
  }

  const entry = entries[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + entries.length) % entries.length);
  }

  return (
    <Card>
      <CardHeader title="Flashcards" subtitle={`Carte ${index + 1}/${entries.length} — cliquer pour retourner`} />
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex h-40 w-full flex-col items-center justify-center rounded-md border border-border bg-surface-muted px-4 text-center hover:border-brand/50"
      >
        {!flipped ? (
          <p className="text-lg font-semibold">{entry.acronym ?? entry.term}</p>
        ) : (
          <div>
            <p className="text-sm font-medium">{entry.term}</p>
            <p className="mt-1 text-xs text-foreground-muted">{entry.definition_simple}</p>
          </div>
        )}
      </button>
      <div className="mt-3 flex justify-between">
        <button onClick={() => go(-1)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-muted">
          ← Précédent
        </button>
        <button onClick={() => go(1)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-muted">
          Suivant →
        </button>
      </div>
    </Card>
  );
}
