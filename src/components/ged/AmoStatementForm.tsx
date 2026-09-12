"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AmoStatementInput } from "@/lib/domain/amoStatement";
import type { Fund } from "@/lib/services/healthInsuranceFund";
interface ExistingCare {id:string;memberId:string;act:string;careDate:string;billed:number;brss:number;amoRate:number;}
export function AmoStatementForm({caseId,householdId,members,target,domicile,hasNir,existing}:{caseId:string;householdId:string;members:{id:string;name:string}[];target:string;domicile:string;hasNir:boolean;existing:ExistingCare[]}) {
 const [care,setCare]=useState<ExistingCare>();
 const [preview,setPreview]=useState<{input:AmoStatementInput;fund:Fund}>();
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 const router=useRouter();
 async function post(data:unknown){const response=await fetch("/api/amo-statements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error??"Service indisponible.");return result;}
 return <details className="m-panel mb-4"><summary className="cursor-pointer font-bold">Générer le décompte Assurance Maladie</summary>
 <p className="m-help my-2">Document fictif généré par Mutalia — simulation pédagogique. Aucun versement ni transmission réelle.</p>
 {!hasNir&&<p className="m-error">Renseignez d’abord un NIR fictif dans le <a className="underline" href={`/adherents/${householdId}?tab=beneficiaires&action=edit`}>dossier de simulation</a>.</p>}
 {!!existing.length&&<label className="block">Reprendre une prestation existante<select className="m-field" value={care?.id??""} onChange={e=>{setCare(existing.find(p=>p.id===e.target.value));setPreview(undefined);}}><option value="">Saisie pédagogique manuelle</option>{existing.map(p=><option key={p.id} value={p.id}>{p.careDate} · {p.act}</option>)}</select></label>}
 <form key={care?.id??"manual"} onChange={()=>setPreview(undefined)} onSubmit={async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const input={...data,caseId,paid:Number(data.paid),brss:Number(data.brss),amoRate:Number(data.amoRate)} as AmoStatementInput;setError("");setPending(true);try{const result=await post({...input,operation:"preview"});setPreview({input,fund:result.fund});}catch{setError("Préparation indisponible. Réessayez.");}finally{setPending(false);}}}>
 <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 my-3">
 <label>Bénéficiaire<select className="m-field" name="memberId" required defaultValue={care?.memberId??target}>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 {([['periodStart','Période du'],['periodEnd','Période au'],['careDate','Date de soin']] as const).map(([name,label])=><label key={name}>{label}<input className="m-field" name={name} type="date" required defaultValue={care?.careDate}/></label>)}
 <label>Nature de prestation<input className="m-field" name="act" required maxLength={150} defaultValue={care?.act}/></label>
 {([['paid','Montant payé (€)',care?.billed],['brss','Base de remboursement (€)',care?.brss],['amoRate','Taux AMO (%)',care?care.amoRate*100:undefined]] as const).map(([name,label,value])=><label key={name}>{label}<input className="m-field" type="number" name={name} required min="0" max={name==="amoRate"?100:1000000} step="0.01" defaultValue={value}/></label>)}
 </fieldset><p className="m-help">Les montants absents restent à saisir comme données d’exercice ; aucun tarif officiel n’est déduit.</p><button className="m-button m-button--secondary" disabled={pending||!hasNir}>Préparer le décompte</button></form>
 {preview&&<section className="m-panel mt-3" aria-label="Résumé avant génération"><h3>Résumé avant génération</h3><dl className="text-sm space-y-1"><div><dt>Bénéficiaire</dt><dd>{members.find(m=>m.id===preview.input.memberId)?.name}</dd></div><div><dt>Domicile</dt><dd>{domicile||"Domicile à renseigner"}</dd></div><div><dt>Caisse déterminée</dt><dd>{preview.fund.name}<br/>{preview.fund.address.join(" · ")}<br/>Source : {preview.fund.source}{preview.fund.reason&&<p>{preview.fund.reason}</p>}</dd></div><div><dt>Période</dt><dd>{preview.input.periodStart} → {preview.input.periodEnd}</dd></div><div><dt>Prestation</dt><dd>{preview.input.act} · {preview.input.careDate} · payé {preview.input.paid} € · BR {preview.input.brss} € · AMO {preview.input.amoRate} %</dd></div></dl>
 <button className="m-button mt-3" disabled={pending} onClick={async()=>{setPending(true);setError("");try{await post(preview.input);setPreview(undefined);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Génération indisponible.");}finally{setPending(false);}}}>Confirmer et générer le PDF</button></section>}
 {error&&<p className="m-error" role="alert">{error}</p>}
 </details>;
}
