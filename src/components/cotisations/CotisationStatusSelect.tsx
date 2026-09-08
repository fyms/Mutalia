"use client";

import { useState, useTransition } from "react";
import { setCotisationStatusAction } from "@/lib/domain/p2Actions";
import { COTISATION_STATUSES, type CotisationStatus } from "@/lib/domain/constants";

const LABELS: Record<CotisationStatus, string> = {
  a_jour: "À jour",
  en_relance: "En relance",
  impayee: "Impayée",
};

export function CotisationStatusSelect({
  householdId,
  status,
  editable,
}: {
  householdId: string;
  status: CotisationStatus;
  editable: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return <span className="text-xs">{LABELS[status]}</span>;
  }

  return (
    <div>
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          setError(null);
          startTransition(async () => {
            try {
              await setCotisationStatusAction(householdId, e.target.value as CotisationStatus);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erreur.");
            }
          });
        }}
        className="rounded-md border border-border px-2 py-1 text-xs"
      >
        {COTISATION_STATUSES.map((s) => (
          <option key={s} value={s}>{LABELS[s]}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-[10px] text-danger">{error}</p> : null}
    </div>
  );
}
