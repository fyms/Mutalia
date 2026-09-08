"use client";

import { useMemo, useState } from "react";
import { computeAnnualCap } from "@/lib/domain/caps";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-brand";

export function AnnualCapSimulator() {
  const [annualCap, setAnnualCap] = useState("1200");
  const [alreadyUsed, setAlreadyUsed] = useState("600");
  const [requestedAmount, setRequestedAmount] = useState("900");

  const result = useMemo(() => {
    const a = Number(annualCap.replace(",", "."));
    const u = Number(alreadyUsed.replace(",", "."));
    const r = Number(requestedAmount.replace(",", "."));
    if (![a, u, r].every(Number.isFinite)) return null;
    try {
      return computeAnnualCap({ annualCap: a, alreadyUsed: u, requestedAmount: r });
    } catch {
      return null;
    }
  }, [annualCap, alreadyUsed, requestedAmount]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Paramètres du plafond"
          subtitle="Utile pour l'implantologie, l'ostéopathie ou tout forfait annuel plafonné"
        />
        <div className="space-y-3 text-sm">
          <Field label="Plafond annuel garanti (€)">
            <input value={annualCap} onChange={(e) => setAnnualCap(e.target.value)} className={inputClass} inputMode="decimal" />
          </Field>
          <Field label="Déjà consommé sur la période (€)">
            <input value={alreadyUsed} onChange={(e) => setAlreadyUsed(e.target.value)} className={inputClass} inputMode="decimal" />
          </Field>
          <Field label="Montant de la nouvelle demande (€)">
            <input value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className={inputClass} inputMode="decimal" />
          </Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Résultat" />
        {!result ? (
          <p className="text-xs text-foreground-muted">Saisissez des montants valides.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <Row label="Disponible avant demande" value={formatCurrency(result.available)} />
            <Row label="Montant couvert par le plafond" value={formatCurrency(result.coveredAmount)} highlight />
            <Row label="Part au-delà du plafond (à charge)" value={formatCurrency(result.overCapAmount)} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground-muted">Plafond atteint ?</span>
              <Badge tone={result.capReached ? "danger" : "success"}>{result.capReached ? "Oui" : "Non"}</Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-1.5 last:border-0">
      <span className="text-foreground-muted">{label}</span>
      <span className={highlight ? "font-semibold text-brand-strong" : "font-medium"}>{value}</span>
    </div>
  );
}
