"use client";

import { useMemo, useState } from "react";
import { AMO_RATE_PRESETS, computeReimbursement, type GuaranteeMode } from "@/lib/domain/reimbursement";
import { SIMULATOR_BENEFITS, getSimulatorBenefit } from "@/lib/data/harmonie/simulatorBenefits";
import { computeVerifiedSimulation } from "@/lib/domain/verifiedSimulation";
import { formatCurrency } from "@/lib/utils/format";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";

const CCN_BENEFITS = SIMULATOR_BENEFITS.filter(b => b.family.startsWith("IDCC "));
const inputClass =
  "m-field";

export function ReimbursementSimulator() {
  const [billed, setBilled] = useState("80");
  const [brss, setBrss] = useState("35");
  const [amoPresetId, setAmoPresetId] = useState("soins_courants");
  const [amoCustomRate, setAmoCustomRate] = useState("70");
  const [guaranteeMode, setGuaranteeMode] = useState<GuaranteeMode>("percent_brss");
  const [guaranteeValue, setGuaranteeValue] = useState<string>("150");
  const [useVerifiedTable, setUseVerifiedTable] = useState(true);
  const [benefitId,setBenefitId]=useState(CCN_BENEFITS[0].id);
  const selectedBenefit=getSimulatorBenefit(benefitId);
  const displayedMode=useVerifiedTable ? selectedBenefit?.mode ?? "percent_brss" : guaranteeMode;

  const amoRate = useMemo(() => {
    const preset = AMO_RATE_PRESETS.find((p) => p.id === amoPresetId);
    if (preset && !Number.isNaN(preset.rate)) return preset.rate;
    const parsed = Number(amoCustomRate);
    return Number.isFinite(parsed) ? parsed / 100 : 0;
  }, [amoPresetId, amoCustomRate]);

  const result = useMemo(() => {
    const billedNum = Number(billed.replace(",", "."));
    const brssNum = Number(brss.replace(",", "."));
    if (!billed.trim() || !brss.trim() || ![billedNum,brssNum,amoRate].every(Number.isFinite) || billedNum<0 || brssNum<0 || amoRate<0 || amoRate>1 || brssNum*amoRate>billedNum) return null;
    const guaranteeValueNum = guaranteeValue ? Number(guaranteeValue.replace(",", ".")) : undefined;
    try {
      if(useVerifiedTable)return computeVerifiedSimulation(benefitId,{billed:billedNum,brss:brssNum,amoRate});
      if(guaranteeValueNum!==undefined && (!Number.isFinite(guaranteeValueNum)||guaranteeValueNum<0))return null;
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
  }, [billed, brss, amoRate, guaranteeMode, guaranteeValue, useVerifiedTable, benefitId]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="min-w-0">
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
              value={displayedMode}
              disabled={useVerifiedTable}
              onChange={(e) => setGuaranteeMode(e.target.value as GuaranteeMode)}
              className={inputClass}
            >
              <option value="percent_brss">Pourcentage BRSS</option>
              <option value="frais_reels">Frais réels</option>
              <option value="forfait_euros">Forfait en euros</option>
            </select>
          </Field>

          <Field label="Utiliser le barème 2026 documenté">
            <input type="checkbox" checked={useVerifiedTable} onChange={e=>setUseVerifiedTable(e.target.checked)} className="h-4 w-4" />
          </Field>
          {useVerifiedTable ? <>
            <Field label="Prestation garantie (barème vérifié)">
              <select value={benefitId} onChange={e=>setBenefitId(e.target.value)} className={inputClass}>
                {CCN_BENEFITS.map(b=><option key={b.id} value={b.id}>{b.family} · {b.level} · {b.category} — {b.label} — {b.guarantee}</option>)}
              </select>
            </Field>
            {selectedBenefit && <p className="text-[11px] text-foreground-muted">
              {selectedBenefit.category} · {selectedBenefit.family} · {selectedBenefit.level} · {selectedBenefit.guarantee}. Source : {selectedBenefit.source}{selectedBenefit.page ? `, page ${selectedBenefit.page}` : ""}.
              {selectedBenefit.restriction && <> Donnée 2026 à vérifier : {selectedBenefit.restriction}</>}
              {selectedBenefit.family.startsWith("IDCC") && <> Sous réserve des droits, du parcours de soins et des conditions du tableau. Les options 405 incluent la Base.</>}
            </p>}
          </> : guaranteeMode !== "frais_reels" && <Field label={guaranteeMode === "percent_brss" ? "Pourcentage BRSS garanti (%)" : "Forfait garanti (€)"}>
            <input value={guaranteeValue} onChange={e=>setGuaranteeValue(e.target.value)} className={inputClass} inputMode="decimal" placeholder="Laisser vide si non vérifié" />
          </Field>}
        </div>
      </Card>

      <Card className="min-w-0">
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
              <div className="pt-1"><DataToVerifyBadge label="Donnée 2026 à vérifier" /></div>
            ) : (
              <ResultRow label="Remboursement AMC" value={formatCurrency(result.amcReimbursement)} highlight />
            )}
            {!result.dataToVerify && <ResultRow
              label="Reste à charge estimé"
              value={formatCurrency(result.remainingCharge)}
              tone={result.remainingCharge > 0 ? "warning" : "success"}
            />}
            <p className="pt-2 text-[11px] text-foreground-muted">
              Méthode pédagogique générique (BRSS/AMO/AMC/RAC). Les saisies libres ne constituent pas un barème vérifié. Une garantie ou condition manquante affiche « Donnée 2026 à vérifier » sans estimation AMC/RAC.
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
