"use client";
import { useState,useTransition } from "react";
import type { Prospect } from "@/lib/domain/prospects";
import { saveProspectAction } from "@/lib/domain/prospectActions";
export function ProspectEditor({initial,onSaved}:{initial?:Prospect;onSaved:(p:Prospect)=>void}){
 const [data,setData]=useState({firstName:initial?.firstName??"",lastName:initial?.lastName??"",phone:initial?.phone??"",email:initial?.email??""});const [error,setError]=useState("");const [pending,start]=useTransition();
 return <fieldset className="m-panel space-y-2" disabled={pending}><legend>{initial?"Modifier le prospect":"Nouveau prospect"}</legend><div className="grid gap-2 sm:grid-cols-2">{([['firstName','Prénom'],['lastName','Nom'],['phone','Téléphone'],['email','E-mail']] as const).map(([key,label])=><label key={key}>{label}<input className="m-field" type={key==="email"?"email":"text"} value={data[key]} onChange={e=>setData({...data,[key]:e.target.value})}/></label>)}</div>{error&&<p role="alert">{error}</p>}<button className="m-button" type="button" onClick={()=>start(async()=>{const r=await saveProspectAction(data,initial?.id,initial?.revision);setError(r.error??"");if(r.prospect)onSaved(r.prospect);})}>Enregistrer le prospect</button></fieldset>;
}
