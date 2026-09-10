"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nextPrestationStatus, type Prestation } from "@/lib/domain/prestations";
import { advancePrestationAction } from "@/lib/domain/prestationActions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import { DATA_TO_VERIFY } from "@/lib/domain/constants";
import { PrestationForm, type PrestationHouseholdChoice } from "./PrestationForm";
export function PrestationList({rows, households, allowCreate=false}: {rows:Prestation[]; households:PrestationHouseholdChoice[]; allowCreate?:boolean}) {
  const [creating,setCreating] = useState(false);
  return <div className="space-y-4">
    {allowCreate && <button className="m-button" onClick={() => setCreating(true)}>Nouvelle prestation</button>}
    {creating && <PrestationForm households={households} onDone={() => setCreating(false)} />}
    <div className="overflow-x-auto m-panel"><table className="w-full text-left text-sm"><caption className="sr-only">Historique des prestations santé</caption>
      <thead className="bg-surface-muted"><tr>{["Adhérent / bénéficiaire","Acte / soins","Facturé","AMC / reste à charge","Statut","Anomalie / contrôle","Action"].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(p => <PrestationRows key={`${p.id}-${p.revision}`} p={p} households={households} />)}{rows.length === 0 && <tr><td className="p-4" colSpan={7}>Aucune prestation enregistrée.</td></tr>}</tbody>
    </table></div>
  </div>;
}
function PrestationRows({p,households}: {p:Prestation;households:PrestationHouseholdChoice[]}) {
  const [editing,setEditing] = useState(false);
  const [error,setError] = useState("");
  const [pending,startTransition] = useTransition();
  const router = useRouter();
  const next = nextPrestationStatus(p.status);
  const h = households.find(h => h.id === p.householdId);
  return <>
    <tr className="border-b border-border align-top">
      <td className="p-2"><Link className="text-brand underline" href={`/adherents/${p.householdId}?tab=prestations`}>{h?.name ?? p.adherentName}</Link><p>{h?.members.find(m => m.id === p.memberId)?.name ?? p.beneficiaryName}</p></td>
      <td className="p-2">{p.act}<p>{formatDate(p.careDate)}</p></td><td className="p-2 whitespace-nowrap">{formatCurrency(p.billed)}</td>
      <td className="p-2">{p.result ? <><p>AMC : {formatCurrency(p.result.amcReimbursement)}</p><p>RAC : {formatCurrency(p.result.remainingCharge)}</p><p>AMO : {formatCurrency(p.result.amoReimbursement)}</p></> : p.anomalies.includes(DATA_TO_VERIFY) ? DATA_TO_VERIFY : "Non calculée"}</td>
      <td className="p-2">{p.status}{p.status === "Payée" && <p className="m-help">Simulation uniquement</p>}</td>
      <td className="p-2">{p.anomalies.length ? p.anomalies.join(" · ") : "—"}<p><Link className="text-brand underline" href="/dossiers">Dossier de contrôle {p.dossierId}</Link></p></td>
      <td className="p-2 space-y-2">{next && <button className="m-button m-button--secondary" disabled={pending || editing} onClick={() => {
        setError("");startTransition(async () => {const r=await advancePrestationAction(p.id,p.revision,next);if(r.error)setError(r.error);router.refresh();});
      }}>{pending ? "Enregistrement…" : next === "Payée" ? "Simuler le paiement" : `Passer à « ${next} »`}</button>}
      {["Reçue","À contrôler"].includes(p.status) && <button className="m-button m-button--tertiary" disabled={pending || editing} onClick={() => setEditing(true)}>Corriger les données</button>}{error && <p role="alert" className="m-error">{error}</p>}</td>
    </tr>
    <tr className="border-b border-border"><td colSpan={7} className="p-2">{editing && <PrestationForm initial={p} households={households} onDone={() => setEditing(false)} />}
      <details><summary className="cursor-pointer text-brand">Historique · {p.id}</summary><ul>{p.history.map((e,i)=><li key={i}>{formatDateTime(e.at)} — {e.event}</li>)}</ul></details>
    </td></tr>
  </>;
}
