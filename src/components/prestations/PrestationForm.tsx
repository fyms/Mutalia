"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePrestationAction } from "@/lib/domain/prestationActions";
import type { PrestationInput } from "@/lib/domain/prestations";
import { DATA_TO_VERIFY } from "@/lib/domain/constants";
export interface PrestationHouseholdChoice {id:string; name:string; members:{id:string; name:string}[];}
export function PrestationForm({households, initial, onDone, submit, submitLabel, planned=false}: {households:PrestationHouseholdChoice[]; initial?:PrestationInput & {id:string;revision:number}; onDone?:()=>void; submit?:(raw:unknown)=>Promise<{error?:string}>; submitLabel?:string; planned?:boolean}) {
  const [householdId,setHousehold] = useState(initial?.householdId ?? "");
  const [memberId,setMember] = useState(initial?.memberId ?? "");
  const [mode,setMode] = useState(initial?.guaranteeMode ?? "");
  const [error,setError] = useState("");
  const [pending,startTransition] = useTransition();
  const router = useRouter();
  const household = households.find(h => h.id === householdId);
  return <form className="m-panel space-y-3" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      const raw = {householdId,memberId,
        act:data.get("act"),careDate:data.get("careDate"),billed:Number(data.get("billed")),brss:Number(data.get("brss")),amoRate:Number(data.get("amoRate"))/100,
        guaranteeMode:mode || undefined, guaranteeValue:mode === "frais_reels" || !data.get("guaranteeValue") ? undefined : Number(data.get("guaranteeValue")),
        contractSource:data.get("contractSource"),contractVerified:data.get("contractVerified") === "on",
      };
      const result = submit ? await submit(raw) : await savePrestationAction(raw, initial?.id, initial?.revision);
      if (result.error) setError(result.error); else {onDone?.(); router.refresh();}
    });
  }}>
    <p className="m-help">Exercice fictif, sans paiement réel. La formule du foyer ne fournit aucun taux automatiquement. Garantie inconnue : {DATA_TO_VERIFY}.</p>
    <fieldset disabled={pending} className="grid gap-3 md:grid-cols-3"><legend className="sr-only">Données de la prestation</legend>
      <label><span className="m-label">Adhérent</span><select className="m-field" value={householdId} required disabled={!!initial} onChange={e => {setHousehold(e.target.value);setMember("");}}><option value="">Choisir un adhérent</option>{households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
      <label><span className="m-label">Bénéficiaire</span><select className="m-field" value={memberId} required disabled={!!initial || !householdId} onChange={e => setMember(e.target.value)}><option value="">Choisir un bénéficiaire</option>{household?.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label><span className="m-label">Acte</span><input className="m-field" name="act" required maxLength={150} defaultValue={initial?.act} /></label>
      <label><span className="m-label">{planned ? "Date prévue des soins" : "Date de soins"}</span><input className="m-field" type="date" name="careDate" required defaultValue={initial?.careDate} /></label>
      <label><span className="m-label">{planned ? "Montant du devis (€)" : "Montant facturé (€)"}</span><input className="m-field" type="number" name="billed" min="0" step="0.01" required defaultValue={initial?.billed} /></label>
      <label><span className="m-label">BRSS (€)</span><input className="m-field" type="number" name="brss" min="0" step="0.01" required defaultValue={initial?.brss} /></label>
      <label><span className="m-label">Taux AMO (%)</span><input className="m-field" type="number" name="amoRate" min="0" max="100" step="0.01" required defaultValue={initial ? initial.amoRate*100 : undefined} /></label>
      <label><span className="m-label">Garantie</span><select className="m-field" value={mode} onChange={e => setMode(e.target.value)}><option value="">{DATA_TO_VERIFY}</option><option value="percent_brss">% BRSS, AMO incluse</option><option value="forfait_euros">Forfait complémentaire (€)</option><option value="frais_reels">Frais réels</option></select></label>
      {mode && mode !== "frais_reels" && <label><span className="m-label">Valeur de garantie ({mode === "percent_brss" ? "% BRSS" : "€"})</span><input className="m-field" type="number" min="0" step="0.01" name="guaranteeValue" defaultValue={initial?.guaranteeValue} placeholder="Inconnue" /></label>}
      <label className="md:col-span-3"><span className="m-label">Source contractuelle de l’exercice (document / page)</span><input className="m-field" name="contractSource" maxLength={500} defaultValue={initial?.contractSource} /></label>
      <label className="md:col-span-3"><input type="checkbox" name="contractVerified" defaultChecked={initial?.contractVerified} /> J’ai contrôlé les droits et la garantie applicable dans la source contractuelle de l’exercice.</label>
    </fieldset>
    <p className="m-help">Moteur du simulateur : BRSS × taux AMO ; hors franchises et participations non remboursables. Aucun rattachement automatique PSI/PLI/CCN.</p>
    {error && <p className="m-error" role="alert">{error}</p>}
    <button className="m-button" disabled={pending}>{pending ? "Enregistrement…" : submitLabel ?? (initial ? "Enregistrer la correction" : "Recevoir la prestation")}</button>{" "}
    {onDone && <button className="m-button m-button--secondary" type="button" disabled={pending} onClick={onDone}>Annuler</button>}
  </form>;
}
