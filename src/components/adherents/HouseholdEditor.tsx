"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ManualHousehold, ManualBeneficiary } from "@/lib/domain/manualHouseholds";
import { editHouseholdAction } from "@/lib/domain/householdActions";
import { NewHouseholdForm } from "./NewHouseholdForm";
export function HouseholdEditor({record, formulas}: {record: ManualHousehold; formulas: {key: string; label: string}[]}) {
  const [editing, setEditing] = useState(false);
  const [beneficiary, setBeneficiary] = useState<ManualBeneficiary | "new" | null>(null);
  const [remove, setRemove] = useState<ManualBeneficiary | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const done = () => { setEditing(false); setBeneficiary(null); setRemove(null); setError(""); router.refresh(); };
  const save = (operation: "beneficiary" | "remove", id: string | null, data: FormData) => {
    setError("");
    startTransition(async () => {
      const result = await editHouseholdAction(record.id, record.revision, operation, id, data);
      if (result.error) setError(result.error); else done();
    });
  };
  return <section className="m-panel mb-4 space-y-4" aria-label="Gestion du foyer">
    <div className="flex flex-wrap gap-3">
      <button className="m-button" disabled={pending || editing || beneficiary !== null || remove !== null} onClick={() => {setEditing(true); setError("");}}>Modifier l’adhérent</button>
      <button className="m-button m-button--secondary" disabled={pending || editing || beneficiary !== null || remove !== null} onClick={() => {setBeneficiary("new"); setError("");}}>Ajouter un bénéficiaire</button>
    </div>
    {editing && <NewHouseholdForm formulas={formulas} record={record} onDone={done} />}
    <h2>Bénéficiaires</h2>
    {(record.beneficiaries ?? []).length === 0 && <p>Aucun bénéficiaire supplémentaire.</p>}
    <ul className="space-y-3">{(record.beneficiaries ?? []).map(b => <li key={b.id}>
      <p>{b.firstName} {b.lastName} · {b.role === "conjoint" ? "Conjoint(e)" : "Enfant"} · {b.birthDate.split("-").reverse().join("/")}</p>
      <button className="m-button m-button--secondary" disabled={pending || editing || beneficiary !== null || remove !== null} onClick={() => {setBeneficiary(b); setError("");}}>Modifier {b.firstName} {b.lastName}</button>{" "}
      <button className="m-button m-button--secondary" disabled={pending || editing || beneficiary !== null || remove !== null} onClick={() => {setRemove(b); setError("");}}>Retirer {b.firstName} {b.lastName}</button>
    </li>)}</ul>
    {beneficiary && <form onSubmit={e => {e.preventDefault(); save("beneficiary", beneficiary === "new" ? null : beneficiary.id, new FormData(e.currentTarget));}}>
      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2"><legend>{beneficiary === "new" ? "Nouveau bénéficiaire" : "Modifier le bénéficiaire"}</legend>
        {([['firstName','Prénom','text'],['lastName','Nom','text'],['birthDate','Date de naissance','date']] as const).map(([name,label,type]) => <label key={name}><span className="m-label">{label}</span><input className="m-field" name={name} type={type} maxLength={100} required defaultValue={beneficiary === "new" ? "" : beneficiary[name]} /></label>)}
        <label><span className="m-label">Lien familial</span><select className="m-field" name="role" required defaultValue={beneficiary === "new" ? "enfant" : beneficiary.role}><option value="enfant">Enfant</option><option value="conjoint">Conjoint(e)</option></select></label>
      </fieldset>
      <button className="m-button" disabled={pending}>Enregistrer le bénéficiaire</button>{" "}<button className="m-button m-button--secondary" type="button" disabled={pending} onClick={done}>Annuler</button>
    </form>}
    {remove && <div role="alertdialog" aria-modal="false" aria-labelledby="remove-title" className="m-panel">
      <h3 id="remove-title">Retirer {remove.firstName} {remove.lastName} du foyer ?</h3>
      <p>Cette suppression du bénéficiaire est définitive.</p>
      <button className="m-button" disabled={pending} onClick={() => save("remove", remove.id, new FormData())}>Confirmer le retrait</button>{" "}<button className="m-button m-button--secondary" disabled={pending} onClick={done}>Annuler</button>
    </div>}
    {error && <p role="alert" className="m-error">{error}</p>}
  </section>;
}
