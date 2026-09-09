"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyFormulaAction, generateQuoteAction } from "@/lib/domain/clientActions";

type Catalog = "psi_general" | "psi_local" | "pli_verifie";

export function GuaranteeQuotePanel({
  clientId,
  regimeGeneral,
  regimeLocal,
  pliFormulas,
  currentFormulaCode,
  currentFormulaCatalog,
}: {
  clientId: string;
  regimeGeneral: string[];
  regimeLocal: string[];
  pliFormulas: string[];
  currentFormulaCode: string | null;
  currentFormulaCatalog: Catalog | null;
}) {
  const [catalog, setCatalog] = useState<Catalog>(currentFormulaCatalog ?? "psi_general");
  const optionsByCatalog: Record<Catalog, string[]> = useMemo(
    () => ({ psi_general: regimeGeneral, psi_local: regimeLocal, pli_verifie: pliFormulas }),
    [regimeGeneral, regimeLocal, pliFormulas],
  );
  const [formulaCode, setFormulaCode] = useState(
    currentFormulaCode ?? optionsByCatalog[catalog][0] ?? "",
  );
  const [premium, setPremium] = useState("");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCatalogChange(next: Catalog) {
    setCatalog(next);
    setFormulaCode(optionsByCatalog[next][0] ?? "");
  }

  function handleApply() {
    setError(null);
    setApplyMessage(null);
    startTransition(async () => {
      try {
        await applyFormulaAction(clientId, formulaCode, catalog);
        setApplyMessage(`Formule ${formulaCode} appliquée au client.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'application de la formule.");
      }
    });
  }

  function handleGenerateQuote() {
    setError(null);
    setQuoteMessage(null);
    startTransition(async () => {
      try {
        const result = await generateQuoteAction(clientId, {
          formulaCode,
          formulaCatalog: catalog,
          monthlyPremium: premium,
        });
        setQuoteMessage(`Devis ${result.quoteId} généré.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la génération du devis.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="mb-1 block text-foreground-muted">Catalogue de référence</span>
          <select
            value={catalog}
            onChange={(e) => handleCatalogChange(e.target.value as Catalog)}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <option value="psi_general">PSI — régime général (niveaux ★)</option>
            <option value="psi_local">PSI — régime local Alsace-Moselle (niveaux ★)</option>
            <option value="pli_verifie">Comparateur vérifié — codes PLI</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-foreground-muted">Formule</span>
          <select
            value={formulaCode}
            onChange={(e) => setFormulaCode(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          >
            {optionsByCatalog[catalog].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handleApply}
        disabled={isPending}
        className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        Appliquer cette formule au client
      </button>
      {applyMessage ? <p className="text-xs text-success">{applyMessage}</p> : null}

      <div className="border-t border-border pt-3">
        <label className="block text-xs">
          <span className="mb-1 block text-foreground-muted">
            Cotisation mensuelle (saisie conseiller — outil de tarification externe, laisser vide si non
            connue : affichera « Donnée 2026 à vérifier »)
          </span>
          <input
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            inputMode="decimal"
            placeholder="ex. 89.50"
            className="w-40 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={handleGenerateQuote}
          disabled={isPending}
          className="mt-2 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? "Génération…" : "Générer un devis PDF"}
        </button>
        {quoteMessage ? <p className="mt-1 text-xs text-success">{quoteMessage}</p> : null}
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
