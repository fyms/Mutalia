"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createClientAction,
  updateClientAction,
  type ClientFormInput,
  type ClientMemberInput,
} from "@/lib/domain/clientActions";

const EMPTY_BENEFICIARY: ClientMemberInput = { first_name: "", last_name: "", birth_date: "", role: "conjoint" };

export function ClientForm({
  mode,
  clientId,
  initial,
}: {
  mode: "create" | "edit";
  clientId?: string;
  initial?: ClientFormInput;
}) {
  const [adherent, setAdherent] = useState(
    initial?.adherent ?? { first_name: "", last_name: "", birth_date: "" },
  );
  const [beneficiaries, setBeneficiaries] = useState<ClientMemberInput[]>(initial?.beneficiaries ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function addBeneficiary() {
    setBeneficiaries((prev) => [...prev, { ...EMPTY_BENEFICIARY }]);
  }

  function updateBeneficiary(idx: number, patch: Partial<ClientMemberInput>) {
    setBeneficiaries((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  function removeBeneficiary(idx: number) {
    setBeneficiaries((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: ClientFormInput = { adherent, beneficiaries };
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createClientAction(input);
          router.push(`/adherents/clients/${result.clientId}`);
        } else if (clientId) {
          await updateClientAction(clientId, input);
          router.push(`/adherents/clients/${clientId}`);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du client.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold text-foreground-muted">Adhérent principal</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-xs">
            <span className="mb-1 block text-foreground-muted">Prénom</span>
            <input
              required
              value={adherent.first_name}
              onChange={(e) => setAdherent((p) => ({ ...p, first_name: e.target.value }))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-foreground-muted">Nom</span>
            <input
              required
              value={adherent.last_name}
              onChange={(e) => setAdherent((p) => ({ ...p, last_name: e.target.value }))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-foreground-muted">Date de naissance</span>
            <input
              required
              type="date"
              value={adherent.birth_date}
              onChange={(e) => setAdherent((p) => ({ ...p, birth_date: e.target.value }))}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold text-foreground-muted">Bénéficiaires du foyer</legend>
        {beneficiaries.length === 0 ? (
          <p className="text-xs text-foreground-muted">Aucun bénéficiaire ajouté (conjoint, enfants).</p>
        ) : (
          <div className="space-y-2">
            {beneficiaries.map((b, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-md bg-surface-muted p-2 sm:grid-cols-5">
                <input
                  required
                  placeholder="Prénom"
                  value={b.first_name}
                  onChange={(e) => updateBeneficiary(idx, { first_name: e.target.value })}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs sm:col-span-1"
                />
                <input
                  required
                  placeholder="Nom"
                  value={b.last_name}
                  onChange={(e) => updateBeneficiary(idx, { last_name: e.target.value })}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs sm:col-span-1"
                />
                <input
                  required
                  type="date"
                  value={b.birth_date}
                  onChange={(e) => updateBeneficiary(idx, { birth_date: e.target.value })}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs sm:col-span-1"
                />
                <select
                  value={b.role}
                  onChange={(e) => updateBeneficiary(idx, { role: e.target.value as "conjoint" | "enfant" })}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs sm:col-span-1"
                >
                  <option value="conjoint">Conjoint(e)</option>
                  <option value="enfant">Enfant</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeBeneficiary(idx)}
                  className="rounded-md border border-danger/40 px-2 py-1.5 text-xs text-danger hover:bg-danger-soft sm:col-span-1"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addBeneficiary}
          className="mt-2 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground-muted hover:bg-surface-muted"
        >
          + Ajouter un bénéficiaire
        </button>
      </fieldset>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : mode === "create" ? "Créer l'adhérent" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
