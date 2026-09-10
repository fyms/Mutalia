"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ANOMALY_STATUSES, type OperationalAnomaly } from "@/lib/domain/operationalAnomalies";
import { updateAnomalyAction } from "@/lib/domain/operationalAnomalyActions";
import { formatDateTime } from "@/lib/utils/format";
export function AnomalyRow({a}: {a:OperationalAnomaly}) {
  const [error,setError]=useState("");
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  return <>
    <tr className="border-b border-border align-top" id={a.id}>
      <td className="p-2"><Link className="text-brand underline" href={`/adherents/${a.householdId}`}>{a.adherentName}</Link><p><Link className="text-brand underline" href={`/prestations#${a.prestationId}`}>Prestation</Link> · <Link className="text-brand underline" href={`/dossiers#${a.dossierId}`}>Dossier</Link></p><p className="text-xs break-all">{a.prestationId}</p></td>
      <td className="p-2">{a.type}</td><td className="p-2 font-semibold">{a.severity}</td><td className="p-2">{formatDateTime(a.createdAt)}</td>
      <td className="p-2"><strong>{a.status}</strong><p className="text-xs">{a.conditionActive ? "Cause encore présente" : "Cause corrigée"}</p></td>
      <td className="p-2"><dl><dt className="font-semibold">Cause probable</dt><dd>{a.cause}</dd><dt className="font-semibold mt-2">Impact</dt><dd>{a.impact}</dd><dt className="font-semibold mt-2">Action recommandée</dt><dd>{a.recommendation}</dd></dl></td>
    </tr>
    <tr className="border-b border-border"><td colSpan={6} className="p-2">
      <details><summary className="cursor-pointer text-brand">Traiter l’anomalie / historique</summary>
        <form className="my-3 space-y-2" aria-label={`Traitement ${a.id}`} onSubmit={e=>{
          e.preventDefault();const data=new FormData(e.currentTarget);setError("");
          startTransition(async()=>{const r=await updateAnomalyAction(a.id,a.revision,{status:data.get("status"),resolution:data.get("resolution")});if(r.error)setError(r.error);else router.refresh();});
        }}>
          <fieldset disabled={pending} className="grid gap-3 md:grid-cols-3">
            <label><span className="m-label">Statut de l’anomalie</span><select className="m-field" name="status" defaultValue={a.status}>{ANOMALY_STATUSES.map(s=><option key={s} disabled={s==="Résolue" && a.conditionActive}>{s}</option>)}</select></label>
            <label className="md:col-span-2"><span className="m-label">Suivi / résolution</span><textarea className="m-field" name="resolution" maxLength={3000} defaultValue={a.resolution} /></label>
          </fieldset>
          <p className="m-help">{a.conditionActive ? "Corrigez d’abord la cause dans la prestation ; la résolution restera bloquée jusque-là." : "Pour résoudre : décrire la correction et le contrôle effectué (10 caractères minimum)."}</p>
          <button className="m-button" disabled={pending}>{pending?"Enregistrement…":"Enregistrer le traitement"}</button>
          {error && <p role="alert" className="m-error">{error}</p>}
        </form>
        <ol className="space-y-1 text-sm">{a.history.map((h,i)=><li key={i}>{formatDateTime(h.at)} · {h.status} · {h.event}{h.resolution && <p className="whitespace-pre-wrap">{h.resolution}</p>}</li>)}</ol>
      </details>
    </td></tr>
  </>;
}
