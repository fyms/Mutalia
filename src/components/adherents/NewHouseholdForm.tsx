"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createHouseholdAction } from "@/lib/domain/householdActions";

const fields = [
  ["firstName", "Prénom", "text", 100], ["lastName", "Nom", "text", 100],
  ["birthDate", "Date de naissance", "date", 10], ["email", "E-mail", "email", 254],
  ["phone", "Téléphone", "tel", 30], ["address", "Adresse", "text", 250],
  ["postalCode", "Code postal", "text", 5], ["city", "Ville", "text", 100],
  ["effectiveDate", "Date d’effet / adhésion", "date", 10],
] as const;
export function NewHouseholdForm({formulas}: {formulas: {key: string; label: string}[]}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <form className="m-panel space-y-4" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await createHouseholdAction(data);
      setError(result.error);
    });
  }}>
    <p className="m-help">Tous les champs sont requis. Pour la démonstration, utilisez des coordonnées fictives.</p>
    <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Identité et adhésion</legend>
      {fields.map(([name, label, type, maxLength]) => <label key={name} className="block">
        <span className="m-label">{label}</span>
        <input className="m-field" name={name} type={type} required maxLength={maxLength}
          pattern={name === "postalCode" ? "[0-9]{5}" : undefined} />
      </label>)}
      <label className="block"><span className="m-label">Formule Harmonie 2026</span>
        <select name="formulaKey" className="m-field" required defaultValue="">
          <option value="" disabled>Choisir une formule</option>
          {formulas.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </label>
    </fieldset>
    {error && <p role="alert" className="m-error">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button className="m-button" disabled={pending}>{pending ? "Enregistrement…" : "Créer l’adhérent"}</button>
      <Link className="m-button m-button--secondary" href="/adherents">Annuler</Link>
    </div>
  </form>;
}
