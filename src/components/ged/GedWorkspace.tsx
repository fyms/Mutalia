"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentViewer } from "./DocumentViewer";
import { UploadDocumentForm } from "./UploadDocumentForm";
import { CaseSubmissionForm } from "@/components/cases/CaseSubmissionForm";
import type { TrainingCase,LearnerFeedback } from "@/lib/domain/types";
import type { DocumentState } from "@/lib/store/runtimeStore";
import type { SavedDraft } from "@/lib/domain/drafts";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
import { DOCUMENT_SOURCE_LABELS,UPLOAD_DOCUMENT_TYPES,type RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
export function GedWorkspace({trainingCase,states,draft,feedback,author,household,runtimeDocuments=[],initialImport=false}:{trainingCase?:TrainingCase;states:Record<string,DocumentState>;draft:SavedDraft|null;feedback:LearnerFeedback|null;author:string;household?:{id:string;members:{id:string;name:string}[]};runtimeDocuments?:RuntimeDocumentView[];initialImport?:boolean}){
 const [selected,setSelected]=useState<string>(),[view,setView]=useState("document"),[importing,setImporting]=useState(initialImport);const router=useRouter();
 const folder=household??(trainingCase?{id:trainingCase.household.household_id,members:trainingCase.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))}:undefined);
 const pieces=[...(trainingCase?.documents??[]).map(d=>({id:d.document_id,source:"case" as const,name:d.file_name,type:d.document_type,document:d})),...runtimeDocuments.map(d=>({id:d.id,source:d.source,name:d.originalFileName,type:d.documentType,document:d}))];
 const selectedPiece=pieces.find(d=>d.id===selected)??pieces[0];
 const doc=selectedPiece?.source==="case"?selectedPiece.document:undefined;
 const state=doc?(states[doc.document_id]??{viewedAt:[],annotations:[]}):undefined;
 return <>
 <div className="m-ged-switch"><button className="m-button m-button--secondary" aria-pressed={view==="document"} onClick={()=>setView("document")}>Document</button>{trainingCase&&<button className="m-button m-button--secondary" aria-pressed={view==="controle"} onClick={()=>setView("controle")}>Qualification et contrôle</button>}</div>
 <div className={`m-ged view-${view}`}><div className="m-panel m-pieces"><h2>Pièces du dossier</h2>
 {folder&&<button className="m-button m-button--secondary my-3" onClick={()=>setImporting(!importing)}>+ Importer un document</button>}
 {importing&&folder&&<UploadDocumentForm householdId={folder.id} members={folder.members} onCancel={()=>setImporting(false)} onUploaded={document=>{setSelected(document.id);setImporting(false);router.refresh();}}/>}
 {pieces.map(d=><button key={d.id} className="m-piece" aria-pressed={selectedPiece?.id===d.id} onClick={()=>{setSelected(d.id);setView("document");}}>{UPLOAD_DOCUMENT_TYPES[d.type as keyof typeof UPLOAD_DOCUMENT_TYPES]??DOCUMENT_TYPE_LABELS[d.type]??"Pièce"}<span>{d.name}</span><span>{DOCUMENT_SOURCE_LABELS[d.source]}</span></button>)}
 {!pieces.length&&<p className="m-help">Aucune pièce dans ce dossier.</p>}</div>
 <div className="m-document">{doc&&state?<DocumentViewer key={doc.document_id} document={doc} status={state.status??"a_qualifier"} viewedCount={state.viewedAt.length} annotations={state.annotations} author={author}/>:selectedPiece&&selectedPiece.source!=="case"?<DocumentViewer key={selectedPiece.id} runtimeDocument={selectedPiece.document}/>:<p className="m-panel">Importez une pièce fictive pour la consulter ici.</p>}</div>
 <div className="m-control">{trainingCase?<><p className="m-help mb-2">Contrôle du cas source uniquement : les pièces importées ou générées ne modifient pas le corrigé.</p><CaseSubmissionForm key={trainingCase.case_id} caseId={trainingCase.case_id} objectives={trainingCase.objectives} valueFields={["billed","brss","amo","total"]} trainingCase={trainingCase} initialDraft={draft} initialFeedback={feedback}/></>:<p className="m-help">Les pièces importées restent dans votre espace personnel. Leur qualification se fait dans le visualiseur.</p>}</div></div></>;
}
