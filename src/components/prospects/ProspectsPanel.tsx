"use client";
import Link from "next/link";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import type {Prospect} from "@/lib/domain/prospects";
import {localToday,upcomingAppointments,type Appointment} from "@/lib/domain/appointments";
import {saveProspectAction} from "@/lib/domain/prospectActions";
import {BusinessStatus} from "@/components/ui/StatusPill";
import {ProspectEditor} from "./ProspectEditor";
export function ProspectsPanel({prospects,appointments}:{prospects:Prospect[];appointments:Appointment[]}){
 const [status,setStatus]=useState("Tous"),[editing,setEditing]=useState<Prospect|null|undefined>(),[error,setError]=useState("");const [pending,start]=useTransition();const router=useRouter();
 return <div className="space-y-4"><div className="m-actionbar"><button className="m-button" onClick={()=>setEditing(null)}>Nouveau prospect</button><label>Statut<select className="m-field" value={status} onChange={e=>setStatus(e.target.value)}>{["actif","converti","abandonné","Tous"].map(s=><option key={s}>{s}</option>)}</select></label></div>
 {editing!==undefined&&<div className="m-panel"><ProspectEditor key={editing?.id??"new"} initial={editing??undefined} onSaved={()=>{setEditing(undefined);router.refresh();}}/><button className="m-button m-button--secondary" onClick={()=>setEditing(undefined)}>Annuler</button></div>}
 {error&&<p role="alert" className="m-error">{error}</p>}
 {prospects.filter(p=>status==="Tous"||p.status===status).map(p=>{const rdvs=appointments.filter(a=>a.prospectId===p.id);const next=upcomingAppointments(rdvs)[0];const last=rdvs.filter(a=>a.date<localToday()||a.status==="Réalisé").at(-1);return <article id={p.id} key={p.id} className="m-panel space-y-2"><h2>{p.firstName} {p.lastName} <BusinessStatus status={p.status}/></h2><p>{p.phone} · {p.email}</p><p>Prochain rendez-vous : {next?`${next.date} ${next.startTime} · ${next.reason}`:"Aucun"}</p><p>Dernier rendez-vous : {last?`${last.date} ${last.startTime} · ${last.reason}`:"Aucun"}</p><div className="flex flex-wrap gap-2"><Link className="m-button m-button--secondary" href={`/agenda?filterProspectId=${p.id}`}>Voir les rendez-vous</Link>{p.status==="actif"&&<><Link className="m-button" href={`/agenda?prospectId=${p.id}`}>Planifier un rendez-vous</Link><button className="m-button m-button--secondary" onClick={()=>setEditing(p)}>Modifier</button><button className="m-button m-button--danger" disabled={pending} onClick={()=>{if(window.confirm("Abandonner ce prospect ? Son historique sera conservé."))start(async()=>{const r=await saveProspectAction(p,p.id,p.revision,"abandonné");setError(r.error??"");router.refresh();});}}>Abandonner</button><Link className="m-button m-button--secondary" href={`/adherents/nouveau?prospectId=${p.id}`}>Convertir en adhérent</Link></>}{p.householdId&&<Link className="m-button" href={`/adherents/${p.householdId}`}>Fiche adhérent</Link>}</div></article>;})}
 {!prospects.some(p=>status==="Tous"||p.status===status)&&<p className="m-panel">Aucun prospect dans ce statut.</p>}</div>;
}
