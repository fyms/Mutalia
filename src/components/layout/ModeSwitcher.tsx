"use client";

import { useTransition } from "react";
import {
  updateLevelAction,
  updateRoleAction,
  toggleNewHireModeAction,
} from "@/lib/store/actions";
import {
  ASSISTANCE_LEVELS,
  ASSISTANCE_LEVEL_LABELS,
  ROLE_LABELS,
  ROLES,
  type AssistanceLevel,
  type Role,
} from "@/lib/domain/constants";

export function ModeSwitcher({
  role,
  level,
  newHireMode,
}: {
  role: Role;
  level: AssistanceLevel;
  newHireMode: boolean;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs">
      <form
        action={(formData) => startTransition(() => updateRoleAction(formData))}
        onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
      >
        <select
          name="role"
          defaultValue={role}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
          title="Rôle actif"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </form>

      <form
        action={(formData) => startTransition(() => updateLevelAction(formData))}
        onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
      >
        <select
          name="level"
          defaultValue={level}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
          title="Niveau d'aide"
        >
          {ASSISTANCE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {ASSISTANCE_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </form>

      <form
        action={(formData) => startTransition(() => toggleNewHireModeAction(formData))}
        onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
      >
        <input type="hidden" name="enabled" value={newHireMode ? "0" : "1"} />
        <button
          type="submit"
          className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
            newHireMode
              ? "border-brand bg-brand-soft text-brand-strong"
              : "border-border bg-surface text-foreground-muted"
          }`}
          title="Mode Nouveau collaborateur : aides et indices renforcés"
        >
          🎓 Nouveau collaborateur : {newHireMode ? "activé" : "désactivé"}
        </button>
      </form>
    </div>
  );
}
