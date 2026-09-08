"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { LexiconEntry } from "@/lib/domain/types";
import type { AssistanceLevel } from "@/lib/domain/constants";

interface LexiconContextValue {
  byAcronym: Map<string, LexiconEntry>;
  level: AssistanceLevel;
}

const LexiconContext = createContext<LexiconContextValue | null>(null);

export function LexiconProvider({
  entries,
  level,
  children,
}: {
  entries: LexiconEntry[];
  level: AssistanceLevel;
  children: ReactNode;
}) {
  const byAcronym = useMemo(() => {
    const map = new Map<string, LexiconEntry>();
    for (const entry of entries) {
      if (entry.acronym) map.set(entry.acronym.toUpperCase(), entry);
    }
    return map;
  }, [entries]);

  return (
    <LexiconContext.Provider value={{ byAcronym, level }}>{children}</LexiconContext.Provider>
  );
}

export function useLexiconContext() {
  const ctx = useContext(LexiconContext);
  if (!ctx) throw new Error("useLexiconContext doit être utilisé sous LexiconProvider");
  return ctx;
}
