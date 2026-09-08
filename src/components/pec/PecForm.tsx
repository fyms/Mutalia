"use client";

import { useMemo, useState, useTransition } from "react";
import { createPecRecordAction } from "@/lib/domain/p2Actions";
import { Card, CardHeader } from "@/components/ui/Card";

export interface PecHouseholdOption {
  householdId: string;
  label: string;
  caseId: string;
  beneficiaries: { id: string; label: string }[];
}

export function PecForm({ households }: { households: PecHouseholdOption[] }) {
  const [householdId, setHouseholdId] = useState(households[0]?.householdId ?? "");
  const [beneficiaryId, setBeneficiaryId] = useState(households[0]?.beneficiaries[0]?.id ?? "");
  const [acte, setActe] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [dateSoins, setDateSoins] = useState("2026-09-01");
  const [montant, setMontant] = useState("");
  const [dataToVerify, setDataToVerify] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedHousehold = useMemo(
    () => households.find((h) => h.householdId === householdId),
    [households, householdId],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await createPecRecordAction({
          householdId,
          caseId: selectedHousehold?.caseId,
          beneficiaryId,
          acte,
          etablissement,
          dateSoins,
          montantGaranti: dataToVerify ? null : Number(montant.replace(",", ".")) || 0,
        });
        setMessage("Prise en charge pédagogique émise.");
        setActe("");
        setEtablissement("");
        setMontant("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'émission de la PEC.");
      }
    });
  }

  return (
    <Card>
      <CardHeader title="Émettre une PEC pédagogique" subtitle="Aucun engagement réel : document de formation uniquement" />
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Foyer</span>
          <select
            value={householdId}
            onChange={(e) => {
              setHouseholdId(e.target.value);
              const h = households.find((x) => x.householdId === e.target.value);
              setBeneficiaryId(h?.beneficiaries[0]?.id ?? "");
            }}
            className="w-full rounded-md border border-border px-2 py-1.5"
          >
            {households.map((h) => (
              <option key={h.householdId} value={h.householdId}>{h.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Bénéficiaire</span>
          <select
            value={beneficiaryId}
            onChange={(e) => setBeneficiaryId(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5"
          >
            {selectedHousehold?.beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Acte / motif</span>
          <input value={acte} onChange={(e) => setActe(e.target.value)} required className="w-full rounded-md border border-border px-2 py-1.5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Établissement</span>
          <input value={etablissement} onChange={(e) => setEtablissement(e.target.value)} required className="w-full rounded-md border border-border px-2 py-1.5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-foreground-muted">Date des soins</span>
          <input type="date" value={dateSoins} onChange={(e) => setDateSoins(e.target.value)} required className="w-full rounded-md border border-border px-2 py-1.5" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={dataToVerify} onChange={(e) => setDataToVerify(e.target.checked)} />
          <span className="text-xs">Montant garanti non vérifié (afficher « Donnée 2026 à vérifier »)</span>
        </label>
        {!dataToVerify && (
          <label className="block">
            <span className="mb-1 block text-xs text-foreground-muted">Montant garanti estimé (€)</span>
            <input value={montant} onChange={(e) => setMontant(e.target.value)} inputMode="decimal" className="w-full rounded-md border border-border px-2 py-1.5" />
          </label>
        )}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        {message ? <p className="text-xs text-success">{message}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? "Émission…" : "Émettre la PEC"}
        </button>
      </form>
    </Card>
  );
}
