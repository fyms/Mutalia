"use client";

import { useState, useTransition } from "react";
import { createComplaintAction } from "@/lib/domain/p2Actions";
import { Card, CardHeader } from "@/components/ui/Card";

export interface ComplaintHouseholdOption {
  householdId: string;
  label: string;
  caseId: string;
}

export function ComplaintForm({ households }: { households: ComplaintHouseholdOption[] }) {
  const [householdId, setHouseholdId] = useState(households[0]?.householdId ?? "");
  const [motif, setMotif] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const household = households.find((h) => h.householdId === householdId);
    startTransition(async () => {
      try {
        await createComplaintAction({ householdId, caseId: household?.caseId, motif });
        setMotif("");
        setMessage("Réclamation enregistrée.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création.");
      }
    });
  }

  return (
    <Card>
      <CardHeader title="Nouvelle réclamation" />
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Foyer</span>
          <select
            value={householdId}
            onChange={(e) => setHouseholdId(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5"
          >
            {households.map((h) => (
              <option key={h.householdId} value={h.householdId}>{h.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Motif</span>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            required
            placeholder="Ex. remboursement inférieur au montant attendu…"
            className="w-full rounded-md border border-border px-2 py-1.5"
          />
        </label>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        {message ? <p className="text-xs text-success">{message}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Enregistrer la réclamation"}
        </button>
      </form>
    </Card>
  );
}
