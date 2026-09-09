"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  // État local contrôlé : reflète le choix immédiatement, sans dépendre du
  // round-trip serveur (revalidatePath peut renvoyer un rendu transitoire basé
  // sur l'ancien cookie avant que celui-ci ne soit pris en compte côté client).
  const [currentRole, setCurrentRole] = useState<Role>(role);
  const [currentLevel, setCurrentLevel] = useState<AssistanceLevel>(level);
  const [currentNewHire, setCurrentNewHire] = useState(newHireMode);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleRoleChange(next: Role) {
    setCurrentRole(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("role", next);
      await updateRoleAction(formData);
      router.refresh();
    });
  }

  function handleLevelChange(next: AssistanceLevel) {
    setCurrentLevel(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("level", next);
      await updateLevelAction(formData);
      router.refresh();
    });
  }

  function handleToggleNewHire() {
    const next = !currentNewHire;
    setCurrentNewHire(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("enabled", next ? "1" : "0");
      await toggleNewHireModeAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        value={currentRole}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
        title="Rôle actif"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      <select
        value={currentLevel}
        onChange={(e) => handleLevelChange(e.target.value as AssistanceLevel)}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
        title="Niveau d'aide"
      >
        {ASSISTANCE_LEVELS.map((l) => (
          <option key={l} value={l}>
            {ASSISTANCE_LEVEL_LABELS[l]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleToggleNewHire}
        className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
          currentNewHire
            ? "border-brand bg-brand-soft text-brand-strong"
            : "border-border bg-surface text-foreground-muted"
        }`}
        title="Mode Nouveau collaborateur : aides et indices renforcés"
      >
        🎓 Nouveau collaborateur : {currentNewHire ? "activé" : "désactivé"}
      </button>
    </div>
  );
}
