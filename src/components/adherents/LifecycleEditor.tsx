"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lifecycleAction, deleteErroneousHouseholdAction } from "@/lib/domain/householdActions";
import { activeAt, activeLifecycle, emptyLifecycle, STATUS_LABELS, REASON_LABELS, type HouseholdLifecycle, type LifecycleState } from "@/lib/domain/householdLifecycle";
export function LifecycleEditor({id,manual=false,lifecycle=emptyLifecycle(),members}: {id:string;manual?:boolean;lifecycle?:HouseholdLifecycle;members:{id:string;name:string}[]}) {
 const [target,setTarget]=useState<string|null|undefined>(undefined);
 const [error,setError]=useState("");const [pending,start]=useTransition();const router=useRouter();
 const today=new Date().toISOString().slice(0,10);
 const stateOf=(memberId:string)=>lifecycle.beneficiaries[memberId] ?? activeLifecycle();
 const details=(state:LifecycleState)=><><span className="m-badge">{STATUS_LABELS[state.status]}</span>{state.endDate && <span> · {state.endDate} · {state.endReason && REASON_LABELS[state.endReason]}</span>}{state.history.length>0 && <details><summary>Historique des statuts</summary><ul>{state.history.map((e,i)=><li key={i}>{e.endDate} · {STATUS_LABELS[e.status]} · {REASON_LABELS[e.endReason]} · enregistré le {e.at}</li>)}</ul></details>}</>;
 return <section className="m-panel space-y-3" aria-label="Cycle de vie du foyer">
  <h2>Statut de l’adhérent</h2><div>{details(lifecycle.adherent)}</div>
  <button className="m-button m-button--secondary" disabled={pending} onClick={()=>{setTarget(null);setError("");}}>Clôturer l’adhérent</button>
  {[true,false].map(active=><div key={String(active)}><h3>{active ? "Bénéficiaires actifs" : "Anciens bénéficiaires / bénéficiaires inactifs"}</h3><ul>{members.filter(m=>activeAt(stateOf(m.id),today)===active).map(m=><li key={m.id} className="mb-3"><div>{m.name} · {details(stateOf(m.id))}</div><button className="m-button m-button--secondary" disabled={pending} onClick={()=>{setTarget(m.id);setError("");}}>Modifier le statut de {m.name}</button></li>)}</ul></div>)}
  {target!==undefined && <form aria-label="Changement de statut" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);start(async()=>{const result=await lifecycleAction(id,lifecycle.revision,target,data);if(result.error)setError(result.error);else{setTarget(undefined);router.refresh();}});}}>
   <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-3"><legend>{target===null ? "Clôture de l’adhérent" : "Statut du bénéficiaire"}</legend>
    <label>Statut<select name="status" className="m-field" defaultValue={target===null?"terminated":"inactive"}>{(target===null ? ["terminated","deceased","archived"] as const : ["inactive","deceased","active"] as const).map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
    <label>Date d’effet<input className="m-field" type="date" name="endDate" required defaultValue={today}/></label>
    <label>Motif<select name="endReason" className="m-field">{(target===null ? ["termination","death","duplicate","error","other"] as const : ["detached","divorce","deceased","age_limit","other"] as const).map(r=><option key={r} value={r}>{REASON_LABELS[r]}</option>)}</select></label>
   </fieldset><p>Les personnes et leurs opérations historiques seront conservées.</p>
   <label className="flex gap-2"><input type="checkbox" required disabled={pending}/>Je confirme ce changement de statut.</label>
   <button className="m-button" disabled={pending}>Confirmer le changement</button>{" "}<button type="button" className="m-button m-button--secondary" disabled={pending} onClick={()=>setTarget(undefined)}>Annuler</button>
  </form>}{error && <p role="alert" className="m-error">{error}</p>}
  {manual && lifecycle.adherent.endReason==="error" && <details><summary>Supprimer une création erronée sans historique</summary><form onSubmit={e=>{e.preventDefault();const confirmation=String(new FormData(e.currentTarget).get("confirmation"));start(async()=>{const result=await deleteErroneousHouseholdAction(id,confirmation);if(result.error)setError(result.error);});}}><p>Suppression définitive uniquement en l’absence de dossier, prestation, PEC, cotisation ou contact associé.</p><label>Saisissez SUPPRIMER {id}<input className="m-field" name="confirmation" required disabled={pending}/></label><label><input type="checkbox" required disabled={pending}/>Je confirme la suppression définitive de cette création erronée.</label><button className="m-button" disabled={pending}>Supprimer définitivement la création erronée</button></form></details>}
 </section>;
}
