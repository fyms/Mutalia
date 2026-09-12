import Link from "next/link";
import type { HouseholdView } from "@/lib/domain/households";
import { listRuntimeDocuments } from "@/lib/store/runtimeDocuments";
import { DOCUMENT_SOURCE_LABELS,UPLOAD_DOCUMENT_TYPES } from "@/lib/domain/runtimeDocuments";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
export function HouseholdDocuments({owner,household:h}:{owner:string;household:HouseholdView}){
 const url=`/documents?householdId=${encodeURIComponent(h.householdId)}`;
 const docs=[...(h.case?.documents??[]).map(d=>({id:d.document_id,name:d.file_name,type:d.document_type,source:"case" as const})),...listRuntimeDocuments(owner,h.householdId).map(d=>({id:d.id,name:d.originalFileName,type:d.documentType,source:d.source}))];
 return <section><h2>Documents liés</h2><Link className="m-button m-button--secondary my-3" href={`${url}&import=1`}>Ajouter un document</Link>
 {h.case&&<p className="m-help">Les documents du cas source restent immuables ; les imports et copies générées appartiennent à votre espace personnel.</p>}
 {docs.length?<ul className="space-y-2">{docs.map(d=><li key={d.id}><Link href={url} className="text-brand underline">{UPLOAD_DOCUMENT_TYPES[d.type as keyof typeof UPLOAD_DOCUMENT_TYPES]??DOCUMENT_TYPE_LABELS[d.type]??d.type} · {d.name}</Link> · {DOCUMENT_SOURCE_LABELS[d.source]}</li>)}</ul>:<p className="m-help">Aucun document lié disponible.</p>}</section>;
}
