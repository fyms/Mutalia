"use client";

import { useMemo, useState } from "react";
import { computeCotisationRegularisation } from "@/lib/domain/cotisations";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";

export function RegularisationCalculator() {
  const [previous, setPrevious] = useState("55");
  const [next, setNext] = useState("72");
  const [effectiveDate, setEffectiveDate] = useState("2026-04-16");

  const result = useMemo(() => {
    const previousAmount = Number(previous.replace(",", "."));
    const newAmount = Number(next.replace(",", "."));
    if (!Number.isFinite(previousAmount) || !Number.isFinite(newAmount)) return null;
    try {
      return computeCotisationRegularisation({
        previousMonthlyAmount: previousAmount,
        newMonthlyAmount: newAmount,
        effectiveDate,
      });
    } catch {
      return null;
    }
  }, [previous, next, effectiveDate]);

  return (
    <Card>
      <CardHeader
        title="Calculateur de régularisation"
        subtitle="Prorata jour par jour lors d'un changement de formule en cours de mois"
      />
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Cotisation mensuelle actuelle (€)</span>
          <input value={previous} onChange={(e) => setPrevious(e.target.value)} className="w-full rounded-md border border-border px-2 py-1.5" inputMode="decimal" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Nouvelle cotisation mensuelle (€)</span>
          <input value={next} onChange={(e) => setNext(e.target.value)} className="w-full rounded-md border border-border px-2 py-1.5" inputMode="decimal" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Date d&apos;effet</span>
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full rounded-md border border-border px-2 py-1.5" />
        </label>
      </div>
      {result ? (
        <div className="mt-4 space-y-1.5 text-sm">
          <p>
            {result.daysAtPreviousRate} jour(s) à l&apos;ancien tarif + {result.daysAtNewRate} jour(s) au nouveau
            tarif (mois de {result.daysInMonth} jours).
          </p>
          <p className="font-medium">Total dû pour le mois : {formatCurrency(result.totalDueForMonth)}</p>
          <p className={result.regularisationAmount >= 0 ? "text-warning" : "text-success"}>
            Régularisation : {result.regularisationAmount >= 0 ? "+" : ""}
            {formatCurrency(result.regularisationAmount)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-foreground-muted">Saisissez des montants et une date valides.</p>
      )}
    </Card>
  );
}
