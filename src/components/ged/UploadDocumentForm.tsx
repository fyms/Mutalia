"use client";
import { useState } from "react";
import { UPLOAD_DOCUMENT_TYPES,MAX_UPLOAD_SIZE,type RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
export function UploadDocumentForm({householdId,members,onUploaded,onCancel}:{householdId:string;members:{id:string;name:string}[];onUploaded:(document:RuntimeDocumentView)=>void;onCancel:()=>void}){
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 return <form aria-label="Importer un document fictif" className="m-panel space-y-3 mb-3" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const file=form.get("file");if(!(file instanceof File)||file.size>MAX_UPLOAD_SIZE){setError("Maximum 10 Mo par fichier.");return;}form.set("householdId",householdId);setPending(true);setError("");try{const r=await fetch("/api/runtime-documents",{method:"POST",body:form});const result=await r.json();if(!r.ok)throw new Error(result.error);onUploaded(result);}catch(e){setError(e instanceof Error?e.message:"Import indisponible.");}finally{setPending(false);}}}>
 <h3>Importer un document fictif</h3><fieldset disabled={pending} className="space-y-2"><label className="block">Fichier · PDF, JPEG ou PNG · 10 Mo maximum<input className="m-field" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required/></label>
 <label className="block">Bénéficiaire<select className="m-field" name="beneficiaryId" required>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <label className="block">Type de document<select name="documentType" className="m-field" required>{Object.entries(UPLOAD_DOCUMENT_TYPES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label className="block">Date du document<input className="m-field" type="date" name="documentDate" required/></label>
 <label className="block">Note facultative<textarea name="note" className="m-field" maxLength={1000}/></label>
 <label className="block"><input type="checkbox" name="fictional" value="true" required/> Je confirme que ce document est fictif et que son nom ne contient aucun NIR ou IBAN.</label></fieldset>
 {error&&<p role="alert" className="m-error">{error}</p>}<div className="flex flex-wrap gap-2"><button className="m-button" disabled={pending}>Importer</button><button type="button" className="m-button m-button--secondary" disabled={pending} onClick={onCancel}>Annuler</button></div>
 </form>;
}
