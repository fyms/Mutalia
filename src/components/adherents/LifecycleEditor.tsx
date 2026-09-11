"use client";
import { Badge } from "@/components/ui/Badge";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lifecycleAction } from "@/lib/domain/householdActions";
import { activeAt, activeLifecycle, emptyLifecycle, STATUS_LABELS, REASON_LABELS, type HouseholdLifecycle, type LifecycleState } from "@/lib/domain/householdLifecycle";
export function LifecycleEditor({id,showAdherent=true,initialClose=false,lifecycle=emptyLifecycle(),members}: {id:string;showAdherent?:boolean;initialClose?:boolean;lifecycle?:HouseholdLifecycle;members:{id:string;name:string;detail?:string}[]}) {
 const [target,setTarget]=useState<string|null|undefined>(initialClose?null:undefined);
 const [error,setError]=useState("");const [pending,start]=useTransition();const router=useRouter();
 const today=new Date().toISOString().slice(0,10);
 const stateOf=(memberId:string)=>lifecycle.beneficiaries[memberId] ?? activeLifecycle();
 const details=(state:LifecycleState)=><><Badge tone={state.status==="active"?"success":"neutral"}>{STATUS_LABELS[state.status]}</Badge>{state.endDate && <span> · {state.endDate} · {state.endReason && REASON_LABELS[state.endReason]}</span>}{state.history.length>0 && <details><summary>Historique des statuts</summary><ul>{state.history.map((e,i)=><li key={i}>{e.endDate} · {STATUS_LABELS[e.status]} · {REASON_LABELS[e.endReason]} · enregistré le {e.at}</li>)}</ul></details>}</>;
 return <section className="m-panel space-y-3" aria-label="Cycle de vie du foyer">
  {showAdherent&&<><h2>Statut de l’adhérent</h2><div>{details(lifecycle.adherent)}</div>
  <button className="m-button m-button--secondary" disabled={pending} onClick={()=>{setTarget(null);setError("");}}>Clôturer l’adhérent</button></>}
  <div className="grid gap-4 lg:grid-cols-2">{[true,false].map(active=><div key={String(active)}><h3 className="font-semibold mb-2">{active ? "Bénéficiaires actifs" : "Anciens bénéficiaires / bénéficiaires inactifs"}</h3><ul>{members.filter(m=>activeAt(stateOf(m.id),today)===active).map(m=><li key={m.id} className="mb-3 border-b border-border pb-3"><div><strong>{m.name}</strong>{m.detail&&<span className="text-sm text-foreground-muted"> · {m.detail}</span>} · {details(stateOf(m.id))}</div><button className="m-button m-button--secondary" disabled={pending} onClick={()=>{setTarget(m.id);setError("");}}>Modifier le statut de {m.name}</button></li>)}</ul>{!members.some(m=>activeAt(stateOf(m.id),today)===active)&&<p className="text-sm text-foreground-muted">Aucun bénéficiaire dans cette catégorie.</p>}</div>)}</div>
  {target!==undefined && <form aria-label="Changement de statut" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);start(async()=>{const result=await lifecycleAction(id,lifecycle.revision,target,data);if(result.error)setError(result.error);else{setTarget(undefined);router.refresh();}});}}>
   <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-3"><legend>{target===null ? "Clôture de l’adhérent" : "Statut du bénéficiaire"}</legend>
    <label>Statut<select name="status" className="m-field" defaultValue={target===null?"terminated":"inactive"}>{(target===null ? ["terminated","deceased","archived"] as const : ["inactive","deceased","active"] as const).map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
    <label>Date d’effet<input className="m-field" type="date" name="endDate" required defaultValue={today}/></label>
    <label>Motif<select name="endReason" className="m-field">{(target===null ? ["termination","death","duplicate","error","other"] as const : ["detached","divorce","deceased","age_limit","other"] as const).map(r=><option key={r} value={r}>{REASON_LABELS[r]}</option>)}</select></label>
   </fieldset><p>Les personnes et leurs opérations historiques seront conservées.</p>
   <label className="flex gap-2"><input type="checkbox" required disabled={pending}/>Je confirme ce changement de statut.</label>
   <button className="m-button" disabled={pending}>Confirmer le changement</button>{" "}<button type="button" className="m-button m-button--secondary" disabled={pending} onClick={()=>setTarget(undefined)}>Annuler</button>
  </form>}{error && <p role="alert" className="m-error">{error}</p>}

 </section>;
}
