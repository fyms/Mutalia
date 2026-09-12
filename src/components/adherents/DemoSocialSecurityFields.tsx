"use client";
import { useState } from "react";
import { DEMO_NIR_NOTICE, generateDemoSocialSecurityNumber, maskDemoSocialSecurityNumber } from "@/lib/domain/demoSocialSecurity";
export function DemoSocialSecurityFields({initial="",disabled=false}:{initial?:string;disabled?:boolean}) {
 const [value,setValue]=useState(initial),[revealed,setRevealed]=useState(false);
 return <fieldset disabled={disabled} className="m-panel space-y-2"><legend>Numéro de Sécurité sociale — Démo</legend>
 <p className="m-help">{DEMO_NIR_NOTICE} · DEMO suivi de 15 chiffres. Aucun NIR réel.</p>
 <label className="block"><span className="m-label">Identifiant synthétique</span><input className="m-field" name="socialSecurityNumber" type={revealed?"text":"password"} autoComplete="off" value={value} maxLength={50} onChange={e=>setValue(e.target.value)}/></label>
 <p className="m-help">{maskDemoSocialSecurityNumber(value)}</p>
 <div className="flex flex-wrap gap-2"><button type="button" className="m-button m-button--secondary" onClick={()=>setValue(generateDemoSocialSecurityNumber())}>Générer un NIR fictif</button><button type="button" className="m-button m-button--secondary" aria-pressed={revealed} onClick={()=>setRevealed(!revealed)}>{revealed?"Masquer":"Révéler dans cet écran pédagogique"}</button></div></fieldset>;
}
