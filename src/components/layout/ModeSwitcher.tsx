"use client";
import { useState, useTransition } from "react";
import { toggleNewHireModeAction } from "@/lib/store/actions";
import {
  ROLE_LABELS,
  type Role,
  type AssistanceLevel,
} from "@/lib/domain/constants";
export function ModeSwitcher({
  accountRole,
  newHireMode,
}: {
  accountRole: Role;
  role: Role;
  level: AssistanceLevel;
  newHireMode: boolean;
}) {
  const [enabled, setEnabled] = useState(newHireMode);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="m-badge">{ROLE_LABELS[accountRole]}</span>
      <button
        className="m-button m-button--secondary"
        disabled={pending}
        aria-pressed={enabled}
        onClick={() =>
          start(async () => {
            try {
              const f = new FormData();
              f.set("enabled", enabled ? "0" : "1");
              await toggleNewHireModeAction(f);
              setEnabled(!enabled);
            } catch {
              setError("Préférence non enregistrée");
            }
          })
        }
      >
        Nouveau collaborateur : {enabled ? "activé" : "désactivé"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
