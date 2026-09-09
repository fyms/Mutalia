"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProfileAction, switchProfileAction } from "@/lib/store/actions";
import type { LearnerProfile } from "@/lib/store/runtimeStore";

const NEW_PROFILE_VALUE = "__new__";

export function ProfileSwitcher({
  profiles,
  currentProfileId,
}: {
  profiles: LearnerProfile[];
  currentProfileId: string;
}) {
  const [current, setCurrent] = useState(currentProfileId);
  const [prevCurrent, setPrevCurrent] = useState(currentProfileId);
  if (currentProfileId !== prevCurrent) {
    setPrevCurrent(currentProfileId);
    setCurrent(currentProfileId);
  }

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect(value: string) {
    if (value === NEW_PROFILE_VALUE) {
      setCreating(true);
      return;
    }
    setCurrent(value);
    startTransition(async () => {
      await switchProfileAction(value);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Le nom du profil est requis.");
      return;
    }
    startTransition(async () => {
      try {
        const profile = await createProfileAction(name);
        setCurrent(profile.id);
        setCreating(false);
        setNewName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création du profil.");
      }
    });
  }

  if (creating) {
    return (
      <form onSubmit={handleCreate} className="flex items-center gap-1.5 text-xs">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom du profil…"
          className="w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
        />
        <button type="submit" className="rounded-md bg-brand px-2 py-1.5 text-xs font-medium text-white">
          Créer
        </button>
        <button
          type="button"
          onClick={() => {
            setCreating(false);
            setError(null);
          }}
          className="rounded-md border border-border px-2 py-1.5 text-xs"
        >
          Annuler
        </button>
        {error ? <span className="text-danger">{error}</span> : null}
      </form>
    );
  }

  return (
    <select
      value={current}
      onChange={(e) => handleSelect(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
      title="Profil apprenant"
    >
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          👤 {p.name}
        </option>
      ))}
      <option value={NEW_PROFILE_VALUE}>+ Nouveau profil…</option>
    </select>
  );
}
