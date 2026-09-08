"use client";

import { useState, useTransition } from "react";
import { resetRuntimeStoreAction } from "@/lib/store/actions";

export function ResetButton() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (!window.confirm("Réinitialiser tous les statuts, annotations et soumissions du prototype ?")) return;
          startTransition(async () => {
            await resetRuntimeStoreAction();
            setDone(true);
          });
        }}
        disabled={isPending}
        className="rounded-md border border-danger/50 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft/70"
      >
        {isPending ? "Réinitialisation…" : "Réinitialiser les données de session"}
      </button>
      {done ? <span className="text-xs text-success">Terminé.</span> : null}
    </div>
  );
}
