"use client";

import { useMemo, useState } from "react";
import { AMO_RATE_PRESETS, computeReimbursement, type GuaranteeMode } from "@/lib/domain/reimbursement";
import { formatCurrency } from "@/lib/utils/format";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-brand";

const PLI_BENEFITS_PERCENT: { label: string; value: number }[] = [
  { label: "Consultation généraliste — PLI 411/421", value: 150 },
  { label: "Consultation généraliste — PLI 521", value: 200 },
  { label: "Consultation spécialiste — PLI 411/421", value: 180 },
  { label: "Consultation spécialiste — PLI 521", value: 200 },
  { label: "Radio / IRM / scanner — PLI 411/421", value: 150 },
  { label: "Radio / IRM / scanner — PLI 521", value: 180 },
  { label: "Frais de séjour hospitalier — toutes formules", value: 200 },
  { label: "Honoraires de chirurgie — toutes formules", value: 220 },
];

export function ReimbursementSimulator() {
  const [billed, setBilled] = useState("80");
  const [brss, setBrss] = useState("35");
  const [amoPresetId, setAmoPresetId] = useState("soins_courants");
  const [amoCustomRate, setAmoCustomRate] = useState("70");
  const [guaranteeMode, setGuaranteeMode] = useState<GuaranteeMode>("percent_brss");
  const [guaranteeValue, setGuaranteeValue] = useState<string>("150");
  const [useVerifiedTable, setUseVerifiedTable] = useState(true);

  const amoRate = useMemo(() => {
    const preset = AMO_RATE_PRESETS.find((p) => p.id === amoPresetId);
    if (preset && !Number.isNaN(preset.rate)) return preset.rate;
    const parsed = Number(amoCustomRate);
    return Number.isFinite(parsed) ? parsed / 100 : 0;
  }, [amoPresetId, amoCustomRate]);

  const result = useMemo(() => {
    const billedNum = Number(billed.replace(",", "."));
    const brssNum = Number(brss.replace(",", "."));
    if (!Number.isFinite(billedNum) || !Number.isFinite(brssNum)) return null;
    const guaranteeValueNum = guaranteeValue ? Number(guaranteeValue.replace(",", ".")) : undefined;
    try {
      return computeReimbursement({
        billed: billedNum,
        brss: brssNum,
        amoRate,
        guaranteeMode,
        guaranteeValue: guaranteeMode === "frais_reels" ? undefined : guaranteeValueNum,
      });
    } catch {
      return null;
    }
  }, [billed, brss, amoRate, guaranteeMode, guaranteeValue]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Paramètres du calcul" subtitle="BRSS, taux AMO et garantie AMC" />
        <div className="space-y-3 text-sm">
          <Field label="Montant facturé (€)">
            <input
              value={billed}
              onChange={(e) => setBilled(e.target.value)}
              className={inputClass}
              inputMode="decimal"
            />
          </Field>
          <Field label="Base de remboursement SS — BRSS (€)">
            <input
              value={brss}
              onChange={(e) => setBrss(e.target.value)}
              className={inputClass}
              inputMode="decimal"
            />
          </Field>
          <Field label="Taux AMO">
            <select
              value={amoPresetId}
              onChange={(e) => setAmoPresetId(e.target.value)}
              className={inputClass}
            >
              {AMO_RATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {!Number.isNaN(p.rate) ? ` (${Math.round(p.rate * 100)}%)` : ""}
                </option>
              ))}
            </select>
          </Field>
          {amoPresetId === "personnalise" && (
            <Field label="Taux AMO personnalisé (%)">
              <input
                value={amoCustomRate}
                onChange={(e) => setAmoCustomRate(e.target.value)}
                className={inputClass}
                inputMode="decimal"
              />
            </Field>
          )}

          <Field label="Type de garantie AMC">
            <select
              value={guaranteeMode}
              onChange={(e) => setGuaranteeMode(e.target.value as GuaranteeMode)}
              className={inputClass}
            >
              <option value="percent_brss">Pourcentage BRSS</option>
              <option value="frais_reels">Frais réels</option>
              <option value="forfait_euros">Forfait en euros</option>
            </select>
          </Field>

          {guaranteeMode === "percent_brss" && (
            <>
              <Field label="Utiliser le barème comparateur vérifié (PLI)">
                <input
                  type="checkbox"
                  checked={useVerifiedTable}
                  onChange={(e) => setUseVerifiedTable(e.target.checked)}
                  className="h-4 w-4"
                />
              </Field>
              {useVerifiedTable ? (
                <Field label="Prestation garantie (barème vérifié)">
                  <select
                    value={guaranteeValue}
                    onChange={(e) => setGuaranteeValue(e.target.value)}
                    className={inputClass}
                  >
                    {PLI_BENEFITS_PERCENT.map((b) => (
                      <option key={b.label} value={b.value}>
                        {b.label} — {b.value}% BRSS
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Pourcentage BRSS garanti (%)">
                  <input
                    value={guaranteeValue}
                    onChange={(e) => setGuaranteeValue(e.target.value)}
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="Laisser vide si non vérifié"
                  />
                </Field>
              )}
            </>
          )}

          {guaranteeMode === "forfait_euros" && (
            <Field label="Forfait garanti (€)">
              <input
                value={guaranteeValue}
                onChange={(e) => setGuaranteeValue(e.target.value)}
                className={inputClass}
                inputMode="decimal"
              />
            </Field>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Résultat" subtitle="BRSS → AMO → AMC → reste à charge" />
        {!result ? (
          <p className="text-xs text-foreground-muted">Saisissez des montants valides pour lancer le calcul.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <ResultRow label="Montant facturé" value={formatCurrency(result.billed)} />
            <ResultRow label="BRSS" value={formatCurrency(result.brss)} />
            <ResultRow label="Ticket modérateur" value={formatCurrency(result.ticketModerateur)} />
            <ResultRow
              label={`Remboursement AMO (${Math.round(result.amoRate * 100)}%)`}
              value={formatCurrency(result.amoReimbursement)}
              highlight
            />
            {result.dataToVerify ? (
              <div className="pt-1"><DataToVerifyBadge label="Garantie AMC non renseignée : donnée 2026 à vérifier avant tout calcul réel" /></div>
            ) : (
              <ResultRow label="Remboursement AMC" value={formatCurrency(result.amcReimbursement)} highlight />
            )}
            <ResultRow
              label="Reste à charge estimé"
              value={formatCurrency(result.remainingCharge)}
              tone={result.remainingCharge > 0 ? "warning" : "success"}
            />
            <p className="pt-2 text-[11px] text-foreground-muted">
              Méthode pédagogique générique (BRSS/AMO/AMC/RAC). Les pourcentages hors barème vérifié
              affichent « Donnée 2026 à vérifier » plutôt que d&apos;être estimés.
            </p>
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

function ResultRow({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-1.5 last:border-0">
      <span className="text-foreground-muted">{label}</span>
      {tone ? (
        <Badge tone={tone}>{value}</Badge>
      ) : (
        <span className={highlight ? "font-semibold text-brand-strong" : "font-medium"}>{value}</span>
      )}
    </div>
  );
}
