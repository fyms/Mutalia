"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrestationForm, type PrestationHouseholdChoice } from "@/components/prestations/PrestationForm";
import { nextDecisions, type DevisPec, type DevisPecStatus } from "@/lib/domain/devisPec";
import { saveDevisPecAction, processDevisPecAction } from "@/lib/domain/devisPecActions";
import { DATA_TO_VERIFY } from "@/lib/domain/constants";
import { formatDateTime } from "@/lib/utils/format";
const money=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
export function DevisPecList({rows,households,allowCreate}:{rows:DevisPec[];households:PrestationHouseholdChoice[];allowCreate:boolean}) {
  const [kind,setKind]=useState<"devis"|"pec"|null>(null);
  return <div className="space-y-4">
    {allowCreate && <div className="flex gap-2"><button className="m-button" onClick={()=>setKind("devis")}>Nouveau devis</button><button className="m-button m-button--secondary" onClick={()=>setKind("pec")}>Nouvelle PEC</button></div>}
    {kind && <section><h2 className="font-semibold mb-2">{kind === "devis" ? "Nouveau devis" : "Nouvelle demande de PEC"}</h2><PrestationForm key={kind} households={households} planned submitLabel="Enregistrer la demande" onDone={()=>setKind(null)} submit={raw=>saveDevisPecAction({...raw as object,kind})}/></section>}
    <div className="m-panel overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Adhérent / bénéficiaire","Demande / soin","Montant / estimation","Statut / date","Traitement"].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>
      {rows.map(p=><QuoteRow key={`${p.id}-${p.revision}`} p={p} households={households}/>)}
      {!rows.length && <tr><td colSpan={5} className="p-4">Aucun devis ni PEC enregistré.</td></tr>}
    </tbody></table></div>
  </div>;
}
function QuoteRow({p,households}:{p:DevisPec;households:PrestationHouseholdChoice[]}) {
  const [editing,setEditing]=useState(false),[reason,setReason]=useState(""),[error,setError]=useState("");
  const [pending,startTransition]=useTransition();const router=useRouter();
  const editable=["Reçu","À analyser","Demandée","À contrôler"].includes(p.status);
  const estimate=(p.kind === "devis" && p.status === "À analyser") || (p.kind === "pec" && p.status === "À contrôler");
  const decisions=nextDecisions(p);
  const h=households.find(h=>h.id===p.householdId);
  function process(target:DevisPecStatus|"estimate") {setError("");startTransition(async()=>{const r=await processDevisPecAction(p.id,p.revision,target,reason);if(r.error)setError(r.error);router.refresh();});}
  return <><tr id={p.id} className="border-b border-border align-top">
    <td className="p-2"><Link className="text-brand underline" href={`/adherents/${p.householdId}?tab=pec`}>{h?.name ?? p.adherentName}</Link><p>{h?.members.find(m=>m.id===p.memberId)?.name ?? p.beneficiaryName}</p></td>
    <td className="p-2"><strong>{p.kind === "devis" ? "Devis" : "PEC"}</strong><p>{p.act}</p><p>Soins prévus : {p.careDate}</p></td>
    <td className="p-2">{money(p.billed)}{p.result ? <p>AMC {money(p.result.amcReimbursement)}<br/>RAC {money(p.result.remainingCharge)}</p> : <p>{DATA_TO_VERIFY}</p>}{p.anomalies.map(a=><p key={a} className="text-danger">{a}</p>)}</td>
    <td className="p-2"><strong>{p.status}</strong><p>{formatDateTime(p.createdAt)}</p>{p.refusalReason && <p>Motif : {p.refusalReason}</p>}</td>
    <td className="p-2 space-y-2"><p><Link className="text-brand underline" href={`/dossiers#${p.dossierId}`}>Dossier lié</Link>{p.anomalies.length>0 && <> · <Link className="text-brand underline" href="/flux-anomalies">Anomalies</Link></>}</p>
      {editable && <button className="m-button m-button--secondary" disabled={pending} onClick={()=>setEditing(!editing)}>Corriger les données</button>}
      {estimate && <button className="m-button" disabled={pending} onClick={()=>process("estimate")}>Estimer AMC / RAC</button>}
      {decisions.some(s=>s.startsWith("Refus")) && <label><span className="m-label">Motif obligatoire en cas de refus</span><textarea className="m-field" value={reason} maxLength={3000} onChange={e=>setReason(e.target.value)}/></label>}
      <div className="flex flex-wrap gap-2">{decisions.map(s=><button key={s} className="m-button m-button--secondary" disabled={pending || (["Accepté","Accordée"].includes(s) && !p.result) || (s.startsWith("Refus") && reason.trim().length<10)} onClick={()=>process(s)}>{s}</button>)}</div>
      {error && <p role="alert" className="m-error">{error}</p>}
    </td></tr>
    <tr className="border-b border-border"><td colSpan={5} className="p-2">{editing && <PrestationForm households={households} initial={p} planned onDone={()=>setEditing(false)} submit={raw=>saveDevisPecAction({...raw as object,kind:p.kind},p.id,p.revision)}/>}
      <details><summary className="cursor-pointer text-brand">Historique de la demande</summary><ol>{p.history.map((e,i)=><li key={i}>{formatDateTime(e.at)} · {e.status} · {e.event}</li>)}</ol></details>
    </td></tr></>;
}
