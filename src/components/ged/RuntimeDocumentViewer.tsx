"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PdfCanvas } from "./PdfCanvas";
import { DOCUMENT_SOURCE_LABELS,type RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
import { DOCUMENT_STATUS_FLOW,DOCUMENT_STATUS_LABELS } from "@/lib/domain/constants";
export function RuntimeDocumentViewer({document}:{document:RuntimeDocumentView}){
 const [page,setPage]=useState(1),[pages,setPages]=useState(0),[zoom,setZoom]=useState(100),[confirmed,setConfirmed]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState("");const router=useRouter();
 const url=`/api/runtime-documents/${encodeURIComponent(document.householdId)}/${encodeURIComponent(document.id)}`;
 async function mutate(method:string,body:unknown){setError("");setPending(true);try{const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error("Action impossible.");router.refresh();}catch{setError("Action impossible. Réessayez.");}finally{setPending(false);}}
 return <section className="m-panel space-y-3" aria-label="Visualisation du document runtime"><h2>{document.originalFileName}</h2><p className="m-help">{DOCUMENT_SOURCE_LABELS[document.source]} · {document.documentDate} · Document fictif</p>
 <label>Statut documentaire<select className="m-field" value={document.status} disabled={pending} onChange={e=>mutate("PATCH",{status:e.target.value})}>{DOCUMENT_STATUS_FLOW.map(s=><option key={s} value={s}>{DOCUMENT_STATUS_LABELS[s]}</option>)}</select></label>
 {document.note&&<p>{document.note}</p>}
 <a className="m-button m-button--secondary" href={url} target="_blank" rel="noreferrer">Ouvrir / télécharger</a>
 {document.mimeType==="application/pdf"?<><div className="flex flex-wrap items-center gap-2"><button className="m-button m-button--secondary" disabled={page<=1} onClick={()=>setPage(page-1)}>Précédent</button><span>Page {page} / {pages||"…"}</span><button className="m-button m-button--secondary" disabled={page>=pages} onClick={()=>setPage(page+1)}>Suivant</button><button className="m-button m-button--secondary" disabled={zoom<=50} onClick={()=>setZoom(zoom-25)}>−</button><span>{zoom} %</span><button className="m-button m-button--secondary" disabled={zoom>=200} onClick={()=>setZoom(zoom+25)}>+</button></div><PdfCanvas url={url} page={page} zoom={zoom} onLoaded={setPages}/></>:<Image src={url} alt="Document fictif importé" unoptimized width={1200} height={1600} className="w-full h-auto" onError={()=>setError("Image illisible. Vérifiez le fichier importé.")}/>}
 {document.source==="uploaded"&&<div className="border-t border-border pt-3"><label className="block"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Je confirme la suppression de ce document importé.</label><button className="m-button m-button--danger" disabled={!confirmed||pending} onClick={()=>mutate("DELETE",{confirmed})}>Supprimer le document importé</button></div>}
 {error&&<p className="m-error" role="alert">{error}</p>}
 </section>;
}
