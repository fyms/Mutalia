"use client";

import { useState } from "react";
import { useLexiconContext } from "@/components/lexicon/LexiconProvider";

/** Enveloppe un acronyme métier avec une infobulle contextuelle tirée du lexique. */
export function Term({ acronym, children }: { acronym: string; children?: React.ReactNode }) {
  const { byAcronym, level } = useLexiconContext();
  const [open, setOpen] = useState(false);
  const entry = byAcronym.get(acronym.toUpperCase());

  if (!entry) return <>{children ?? acronym}</>;

  const showHint = level === "debutant";

  return (
    <span
      className="relative inline-flex items-center gap-0.5 border-b border-dotted border-brand/60 cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children ?? entry.acronym}
      {showHint ? <span className="text-[10px] text-brand">ⓘ</span> : null}
      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-border bg-surface p-2.5 text-left text-xs font-normal normal-case text-foreground shadow-lg"
        >
          <span className="block font-semibold text-brand-strong">
            {entry.acronym} — {entry.term}
          </span>
          <span className="mt-1 block text-foreground-muted">{entry.definition_simple}</span>
        </span>
      ) : null}
    </span>
  );
}
