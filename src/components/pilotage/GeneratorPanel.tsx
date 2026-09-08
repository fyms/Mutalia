"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateCaseAction } from "@/lib/domain/generatorActions";
import { Card, CardHeader } from "@/components/ui/Card";

export function GeneratorPanel() {
  const [seed, setSeed] = useState("2026");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    setMessage(null);
    const seedNumber = Number(seed);
    if (!Number.isFinite(seedNumber)) {
      setError("Le seed doit être un nombre entier.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await generateCaseAction(seedNumber);
        setMessage(`Cas ${result.caseId} généré avec succès.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la génération.");
      }
    });
  }

  return (
    <Card>
      <CardHeader
        title="Générateur de cas dynamique"
        subtitle="Réservé au mode Formateur — seed obligatoire pour la reproductibilité"
      />
      <div className="flex items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Seed</span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-32 rounded-md border border-border px-2 py-1.5 text-sm"
            inputMode="numeric"
          />
        </label>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? "Génération…" : "Générer un nouveau cas"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-success">{message}</p> : null}
      <p className="mt-3 text-[11px] text-foreground-muted">
        Le même seed produit toujours la même séquence de cas (reproductibilité). Chaque cas généré est marqué
        « synthetic », porte le bandeau « DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR » sur ses pièces et
        apparaît immédiatement dans la liste des Cas pratiques.
      </p>
    </Card>
  );
}
