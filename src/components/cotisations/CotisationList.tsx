"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { COTISATION_STATUSES,cotisationSummary,type Cotisation } from "@/lib/domain/cotisations";
import { createCotisationAction,recordCotisationAction } from "@/lib/domain/cotisationActions";
import { formatDateTime } from "@/lib/utils/format";
const money=(c:number)=>(c/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
export function CotisationList({rows,households,allowCreate,today}:{rows:Cotisation[];households:{id:string;name:string}[];allowCreate:boolean;today:string}) {
 const [create,setCreate]=useState(false),[status,setStatus]=useState(""),[period,setPeriod]=useState(""),[error,setError]=useState("");
 const [pending,startTransition]=useTransition();const router=useRouter();
 return <div className="space-y-4"><p className="m-help">Montants pédagogiques saisis manuellement : aucun tarif Harmonie calculé, aucun prélèvement réel. Une régularisation réduit le solde sans constituer un règlement.</p>
 {allowCreate && <button className="m-button" onClick={()=>setCreate(!create)}>Nouvelle échéance</button>}
 {create && <form className="m-panel space-y-3" onSubmit={e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);setError("");startTransition(async()=>{const r=await createCotisationAction({householdId:d.get("householdId"),period:d.get("period"),amount:Number(d.get("amount")),dueDate:d.get("dueDate")});if(r.error)setError(r.error);else{setCreate(false);router.refresh();}});
 }}><fieldset disabled={pending} className="grid gap-3 md:grid-cols-4"><legend className="sr-only">Échéance pédagogique</legend>
 <label><span className="m-label">Adhérent</span><select className="m-field" name="householdId" required><option value="">Choisir</option>{households.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
 <label><span className="m-label">Période</span><input className="m-field" name="period" type="month" required/></label>
 <label><span className="m-label">Montant pédagogique (€)</span><input className="m-field" name="amount" type="number" min="0.01" max="1000000" step="0.01" required/></label>
 <label><span className="m-label">Date d’échéance</span><input className="m-field" name="dueDate" type="date" required/></label>
 </fieldset><button className="m-button" disabled={pending}>Créer l’échéance</button>{error && <p className="m-error" role="alert">{error}</p>}</form>}
 <div className="flex gap-3"><label><span className="m-label">Statut</span><select className="m-field" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tous</option>{COTISATION_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label><label><span className="m-label">Période</span><select className="m-field" value={period} onChange={e=>setPeriod(e.target.value)}><option value="">Toutes</option>{[...new Set(rows.map(p=>p.period))].sort().map(s=><option key={s}>{s}</option>)}</select></label></div>
 <div className="m-panel overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Adhérent / période","Attendu","Réglé","Régularisation","Solde","Échéance / statut"].map(s=><th className="p-2" key={s}>{s}</th>)}</tr></thead><tbody>
 {rows.filter(p=>(!period||p.period===period)&&(!status||cotisationSummary(p,today).status===status)).map(p=><CotisationRow key={`${p.id}-${p.revision}`} p={p} today={today} name={households.find(h=>h.id===p.householdId)?.name ?? p.adherentName}/>)}
 {!rows.some(p=>(!period||p.period===period)&&(!status||cotisationSummary(p,today).status===status)) && <tr><td colSpan={6} className="p-3">Aucune échéance pour ces filtres.</td></tr>}
 </tbody></table></div></div>;
}
function CotisationRow({p,name,today}:{p:Cotisation;name:string;today:string}) {
 const summary=cotisationSummary(p,today);const [error,setError]=useState("");const [pending,startTransition]=useTransition();const router=useRouter();
 return <><tr id={p.id} className="border-b border-border align-top"><td className="p-2"><Link className="text-brand underline" href={`/adherents/${p.householdId}?tab=cotisations`}>{name}</Link><p>{p.period}</p></td><td className="p-2">{money(p.expectedCents)}</td><td className="p-2">{money(summary.paid)}</td><td className="p-2">{money(summary.adjusted)}</td><td className="p-2 font-semibold">{money(summary.balance)}</td><td className="p-2">{p.dueDate}<p>{summary.status}</p>{summary.overdue && <p className="text-danger">Solde en retard à traiter</p>}{p.dossierId && <Link className="text-brand underline" href={`/dossiers#${p.dossierId}`}>Dossier lié</Link>}</td></tr>
 <tr className="border-b border-border"><td colSpan={6} className="p-2"><details><summary className="cursor-pointer text-brand">Règlement / régularisation / historique</summary>
 {summary.balance>0 && <form className="space-y-2 my-3" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);setError("");startTransition(async()=>{const r=await recordCotisationAction(p.id,p.revision,{kind:d.get("kind"),amount:Number(d.get("amount")),date:d.get("date"),reason:d.get("reason")});if(r.error)setError(r.error);else router.refresh();});}}>
 <fieldset disabled={pending} className="grid gap-3 md:grid-cols-4"><legend className="sr-only">Enregistrer une opération pédagogique</legend>
 <label><span className="m-label">Opération</span><select className="m-field" name="kind"><option value="payment">Règlement fictif</option><option value="adjustment">Régularisation (réduction du solde)</option></select></label>
 <label><span className="m-label">Montant (€)</span><input className="m-field" name="amount" type="number" required min="0.01" max={summary.balance/100} step="0.01"/></label>
 <label><span className="m-label">Date</span><input className="m-field" name="date" type="date" required max={today} defaultValue={today}/></label>
 <label><span className="m-label">Référence / motif obligatoire</span><input className="m-field" name="reason" required minLength={3} maxLength={1000}/></label></fieldset><button className="m-button" disabled={pending}>Enregistrer l’opération</button>{error && <p className="m-error" role="alert">{error}</p>}</form>}
 <ol className="text-sm space-y-1"><li>{formatDateTime(p.createdAt)} · Création pédagogique : {money(p.expectedCents)}</li>{p.entries.map(e=><li key={e.id}>{e.date} · {e.kind==="payment" ? "Règlement fictif" : "Régularisation"} · {money(e.cents)} · {e.reason} (saisi le {formatDateTime(e.createdAt)})</li>)}</ol>
 </details></td></tr></>;
}
