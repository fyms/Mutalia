"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FaqEntry } from "@/lib/domain/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function FaqExplorer({ entries, initialId }: { entries: FaqEntry[]; initialId?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [openId, setOpenId] = useState<string | undefined>(initialId);

  const categories = useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  const levels = useMemo(() => [...new Set(entries.map((e) => e.level))], [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => (category ? e.category === category : true))
      .filter((e) => (level ? e.level === level : true))
      .filter((e) => (q ? e.question.toLowerCase().includes(q) || e.short_answer.toLowerCase().includes(q) : true));
  }, [entries, query, category, level]);

  return (
    <div>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex-1 min-w-[220px]">
            <span className="mb-1 block text-foreground-muted">Recherche</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full rounded-md border border-border px-2 py-1.5"
            />
          </label>
          <label>
            <span className="mb-1 block text-foreground-muted">Catégorie</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-foreground-muted">Niveau</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Tous</option>
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <span className="text-foreground-muted">{filtered.length} question(s)</span>
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.map((entry) => {
          const open = openId === entry.id;
          return (
            <Card key={entry.id} className="p-0">
              <button
                onClick={() => setOpenId(open ? undefined : entry.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
              >
                <span className="font-medium">{entry.question}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">{entry.category}</Badge>
                  <span className="text-xs text-foreground-muted">{open ? "▲" : "▼"}</span>
                </span>
              </button>
              {open && (
                <div className="border-t border-border px-4 py-3 text-sm">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">Comprendre</p>
                    <p className="mt-1 text-foreground-muted">{entry.short_answer}</p>
                    {entry.detailed_answer ? <p className="mt-1 text-foreground-muted">{entry.detailed_answer}</p> : null}
                  </div>
                  {entry.procedure_steps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Que faire ?</p>
                      <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-foreground-muted">
                        {entry.procedure_steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {entry.documents_required.length > 0 && (
                    <p className="mb-1.5 text-xs text-foreground-muted">
                      <span className="font-medium">Pièces nécessaires : </span>
                      {entry.documents_required.join(", ")}
                    </p>
                  )}
                  {entry.common_mistakes.length > 0 && (
                    <p className="mb-1.5 text-xs text-warning">
                      <span className="font-medium">Erreurs fréquentes : </span>
                      {entry.common_mistakes.join(" · ")}
                    </p>
                  )}
                  {entry.escalation_conditions.length > 0 && (
                    <p className="mb-1.5 text-xs text-danger">
                      <span className="font-medium">Escalade si : </span>
                      {entry.escalation_conditions.join(" · ")}
                    </p>
                  )}
                  {entry.linked_case_ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.linked_case_ids.map((cid) => (
                        <Link key={cid} href={`/cas-pratiques/${cid}`} className="text-xs font-medium text-brand hover:underline">
                          Voir le cas {cid} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
