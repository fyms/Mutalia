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
  accountRole,
  role,
  level,
  newHireMode,
}: {
  accountRole: Role;
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

  // Resynchronise l'état local si la vérité serveur change pour une raison
  // externe à ce composant (ex. une autre instance du sélecteur ailleurs sur
  // la même page, un autre onglet, ou une réinitialisation) : sans cela, deux
  // instances montées simultanément peuvent diverger, l'une restant bloquée
  // sur son état initial pendant que l'autre a changé le cookie. Ajusté
  // pendant le rendu (pattern recommandé par React) plutôt que dans un
  // useEffect, pour éviter un rendu supplémentaire après commit.
  const [prevRole, setPrevRole] = useState(role);
  if (role !== prevRole) {
    setPrevRole(role);
    setCurrentRole(role);
  }
  const [prevLevel, setPrevLevel] = useState(level);
  if (level !== prevLevel) {
    setPrevLevel(level);
    setCurrentLevel(level);
  }
  const [prevNewHire, setPrevNewHire] = useState(newHireMode);
  if (newHireMode !== prevNewHire) {
    setPrevNewHire(newHireMode);
    setCurrentNewHire(newHireMode);
  }

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
      {accountRole === "formateur" ? (
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
          title="Aperçu de rôle (compte Formateur uniquement)"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "apprenant" ? "👁 Aperçu Apprenant" : ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      ) : (
        <span
          className="rounded-md border border-border bg-surface-muted px-2 py-1.5 text-xs font-medium text-foreground-muted"
          title="Rôle du compte connecté"
        >
          {ROLE_LABELS[currentRole]}
        </span>
      )}

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
