"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { ProspectEditor } from "@/components/prospects/ProspectEditor";
import { PROSPECT_REASONS,type Prospect } from "@/lib/domain/prospects";
import { APPOINTMENT_TYPES,APPOINTMENT_STATUSES,DURATIONS,endTime,localToday,type Appointment } from "@/lib/domain/appointments";
import { saveAppointmentAction,type AppointmentResult } from "@/lib/domain/appointmentActions";
export function AppointmentForm({initial,householdId,households,onDone,defaultReason,onCancel,lockHousehold=false,prospects=[],prospectId}:{defaultReason?:string;prospects?:Prospect[];lockHousehold?:boolean;onCancel?:()=>void;prospectId?:string;initial?:Appointment;householdId?:string;households:{id:string;name:string}[];onDone:()=>void}){
 const [contactType,setContactType]=useState(initial?.contactType??(prospectId?"prospect":"adherent"));
 const [choices,setChoices]=useState(prospects);const [selectedProspect,setSelectedProspect]=useState(initial?.prospectId??prospectId??"");const [creating,setCreating]=useState(false);
 const [time,setTime]=useState(initial?.startTime??"09:00");const [duration,setDuration]=useState(initial?.durationMinutes??30);
 const [result,setResult]=useState<AppointmentResult>({});const [confirmed,setConfirmed]=useState(false);const [pending,start]=useTransition();
 return <form className="m-panel space-y-3" aria-label="Rendez-vous" onChange={()=>{setConfirmed(false);}} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const raw:Record<string,unknown>={...Object.fromEntries(data),durationMinutes:Number(data.get("durationMinutes"))};raw.contactType=contactType;raw.householdId=contactType==="prospect"?"":initial?.householdId??(lockHousehold?householdId:raw.householdId);if(contactType==="prospect")raw.prospectId=selectedProspect;start(async()=>{const r=await saveAppointmentAction(raw,initial?.id,initial?.revision,confirmed?result.confirmation:undefined);setResult(r);setConfirmed(false);if(!r.error)onDone();});}}>
 <h2>{initial?"Modifier / déplacer le rendez-vous":"Nouveau rendez-vous"}</h2><fieldset disabled={pending} className="grid gap-3 md:grid-cols-3">
 <label>Type de contact<select className="m-field" value={contactType} disabled={!!initial||lockHousehold} onChange={e=>setContactType(e.target.value as "adherent"|"prospect")}><option value="adherent">Adhérent</option><option value="prospect">Prospect</option></select></label>
 {contactType==="prospect"?<div><label>Prospect<select className="m-field" required value={selectedProspect} disabled={!!initial||lockHousehold} onChange={e=>setSelectedProspect(e.target.value)}><option value="">Choisir un prospect</option>{choices.filter(p=>p.status==="actif"||p.id===selectedProspect).map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label>{!initial&&!lockHousehold&&<button type="button" className="m-button m-button--secondary" onClick={()=>setCreating(!creating)}>Créer un prospect</button>}{creating&&<ProspectEditor onSaved={p=>{setChoices([...choices,p]);setSelectedProspect(p.id);setCreating(false);}}/>}</div>:<label>Adhérent<select className="m-field" name="householdId" required defaultValue={initial?.householdId??householdId??""} disabled={!!initial||lockHousehold}><option value="">Choisir</option>{households.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
 <label>Date<input className="m-field" name="date" type="date" required defaultValue={initial?.date??localToday()}/></label>
 <label>Heure de début<input className="m-field" name="startTime" type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>
 <label>Durée<select className="m-field" name="durationMinutes" value={duration} onChange={e=>setDuration(Number(e.target.value))}>{DURATIONS.map(n=><option key={n} value={n}>{n} min</option>)}</select></label><p>Heure de fin : {time?endTime(time,duration):"—"}</p>
 <label>Type<select className="m-field" name="type" defaultValue={initial?.type}>{APPOINTMENT_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
 {contactType==="prospect"?<label>Motif du rendez-vous<select name="reason" className="m-field" defaultValue={initial?.reason??defaultReason??PROSPECT_REASONS[0]}>{[...new Set([...(defaultReason?[defaultReason]:[]),...(initial?.reason?[initial.reason]:[]),...PROSPECT_REASONS])].map(r=><option key={r}>{r}</option>)}</select></label>:<label>Motif<input className="m-field" name="reason" required minLength={3} maxLength={200} defaultValue={initial?.reason}/></label>}
 <label>Statut<select className="m-field" name="status" defaultValue={initial?.status??"Planifié"}>{APPOINTMENT_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Notes<textarea className="m-field" name="notes" maxLength={3000} defaultValue={initial?.notes}/></label></fieldset>
 {initial&&<Link className="underline" href={initial.contactType==="prospect"?`/prospects#${initial.prospectId}`:`/adherents/${initial.householdId}`}>Ouvrir la fiche</Link>}
 {result.error&&<div className="m-error" role="alert"><p>{result.error}</p>{result.conflicts?.map(c=><p key={c}>{c}</p>)}</div>}
 {result.confirmation&&<label><input type="checkbox" checked={confirmed} onChange={e=>{e.stopPropagation();setConfirmed(e.target.checked);}}/>Je confirme le chevauchement et conserve les rendez-vous existants.</label>}
 <button className="m-button" disabled={pending}>Enregistrer</button>{" "}<button className="m-button m-button--secondary" type="button" disabled={pending} onClick={onCancel??onDone}>Annuler la saisie</button>
 </form>;
}
