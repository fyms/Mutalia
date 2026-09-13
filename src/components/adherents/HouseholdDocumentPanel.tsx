"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentViewer } from "@/components/ged/DocumentViewer";
import { UploadDocumentForm } from "@/components/ged/UploadDocumentForm";
import { DOCUMENT_SOURCE_LABELS,UPLOAD_DOCUMENT_TYPES,type RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
import type { CaseDocument } from "@/lib/domain/types";
import type { DocumentState } from "@/lib/store/runtimeStore";
export function HouseholdDocumentPanel({householdId,members,documents,states,runtimeDocuments}:{householdId:string;members:{id:string;name:string}[];documents:CaseDocument[];states:Record<string,DocumentState>;runtimeDocuments:RuntimeDocumentView[]}){
 const [importing,setImporting]=useState(false),[selected,setSelected]=useState<string>(),[message,setMessage]=useState("");const router=useRouter();const add=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const source=documents.find(d=>d.document_id===selected),runtime=runtimeDocuments.find(d=>d.id===selected);
 const rows=[...documents.map(d=>({id:d.document_id,name:d.file_name,type:d.document_type,source:"case" as const,date:""})),...runtimeDocuments.map(d=>({id:d.id,name:d.originalFileName,type:d.documentType,source:d.source,date:d.documentDate}))];
 return <section className="space-y-3"><h2 ref={heading} tabIndex={-1}>Documents liés</h2>
 <button ref={add} className="m-button m-button--secondary" onClick={()=>{setSelected(undefined);setImporting(true);setMessage("");}}>+ Ajouter un document</button>
 {message&&<p role="status" className="m-help">{message}</p>}
 {importing&&<UploadDocumentForm householdId={householdId} members={members} onCancel={()=>{setImporting(false);add.current?.focus();}} onUploaded={()=>{setImporting(false);setMessage("Document importé.");router.refresh();add.current?.focus();}}/>}
 {source||runtime?<div className="space-y-3"><button className="m-button m-button--secondary" onClick={()=>{setSelected(undefined);heading.current?.focus();}}>← Fermer le document</button>{runtime?<DocumentViewer key={runtime.id} runtimeDocument={runtime}/>:source&&<DocumentViewer key={source.document_id} document={source} status={states[source.document_id]?.status??"a_qualifier"} viewedCount={states[source.document_id]?.viewedAt?.length??0} annotations={states[source.document_id]?.annotations??[]} author=""/>}</div>:<div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">Pièces de cet adhérent</caption><thead><tr><th>Type</th><th>Nom</th><th>Source</th><th>Date</th><th>Action</th></tr></thead><tbody>{rows.map(d=><tr key={d.id} className="border-t border-border"><td className="p-2">{UPLOAD_DOCUMENT_TYPES[d.type as keyof typeof UPLOAD_DOCUMENT_TYPES]??DOCUMENT_TYPE_LABELS[d.type]??d.type}</td><td className="p-2 break-all">{d.name}</td><td className="p-2">{DOCUMENT_SOURCE_LABELS[d.source]}</td><td className="p-2">{d.date||"—"}</td><td className="p-2"><button className="m-button m-button--secondary" aria-label={`Voir ${d.name}`} onClick={()=>{setSelected(d.id);setImporting(false);}}>Voir</button></td></tr>)}</tbody></table>{!rows.length&&<p className="m-help">Aucun document lié disponible.</p>}</div>}
 </section>;
}
