"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { DemoSocialSecurityFields } from "./DemoSocialSecurityFields";
import { DemoBankingFields } from "./DemoBankingFields";
import { PostalCityFields } from "./PostalCityFields";
import type { ManualHousehold } from "@/lib/domain/manualHouseholds";
import { editHouseholdAction, createHouseholdAction } from "@/lib/domain/householdActions";

const fields = [
  ["firstName", "Prénom", "text", 100], ["lastName", "Nom", "text", 100],
  ["birthDate", "Date de naissance", "date", 10], ["email", "E-mail", "email", 254],
  ["phone", "Téléphone", "tel", 30], ["address", "Adresse", "text", 250],
  ["effectiveDate", "Date d’effet / adhésion", "date", 10],
] as const;
export function NewHouseholdForm({formulas, record, onDone, prefill, prospectId}: {formulas: {key: string; label: string}[]; prefill?: Partial<Record<string,string>>; prospectId?:string; record?: ManualHousehold; onDone?: () => void}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <form className="m-panel space-y-4" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = record ? await editHouseholdAction(record.id, record.revision, "adherent", null, data) : await createHouseholdAction(data);
      setError(result.error ?? "");
      if (!result.error) onDone?.();
    });
  }}>
    {prospectId&&<input type="hidden" name="prospectId" value={prospectId}/> }
    <p className="m-help">{record?.source === "pedagogical" ? "Modification pédagogique — le cas source reste inchangé. Les coordonnées absentes peuvent rester vides." : "Tous les champs sont requis. Pour la démonstration, utilisez des coordonnées fictives."}</p>
    <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Identité et adhésion</legend>
      {fields.map(([name, label, type, maxLength]) => <label key={name} className="block">
        <span className="m-label">{label}</span>
        <input className="m-field" name={name} defaultValue={record?.[name]??prefill?.[name]} type={type} required={record?.source !== "pedagogical" || ["firstName","lastName","birthDate"].includes(name)} maxLength={maxLength}
          />
      </label>)}
      <PostalCityFields required={record?.source !== "pedagogical"} key={record?.id ?? "new"} postalCode={record?.postalCode} city={record?.city}/>
      <label className="block"><span className="m-label">Formule Harmonie 2026</span>
        <select name="formulaKey" className="m-field" required defaultValue={record?.formulaKey ?? ""}>
          <option value="" disabled>Choisir une formule</option>
          {formulas.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </label>
    </fieldset>
    <DemoSocialSecurityFields initial={record?.socialSecurityNumber} disabled={pending}/>
    <DemoBankingFields initial={record?.banking} disabled={pending}/>
    {error && <p role="alert" className="m-error">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button className="m-button" disabled={pending}>{pending ? "Enregistrement…" : record ? "Enregistrer les modifications" : "Créer l’adhérent"}</button>
      {onDone ? <button type="button" disabled={pending} className="m-button m-button--secondary" onClick={onDone}>Annuler</button> : <Link className="m-button m-button--secondary" href="/adherents">Annuler</Link>}
    </div>
  </form>;
}
