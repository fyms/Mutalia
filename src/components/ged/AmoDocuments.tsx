import Link from "next/link";
import { getAmoContext, listAmoStatements } from "@/lib/services/amoStatementService";
import { getPrestations } from "@/lib/store/runtimeStore";
import { AmoStatementForm } from "./AmoStatementForm";
export function AmoDocuments({owner,caseId,formOnly=false}:{owner:string;caseId?:string;formOnly?:boolean}) {
 const context=caseId?getAmoContext(owner,caseId):undefined;
 const documents=listAmoStatements(owner,caseId);
 return <section aria-label="Décomptes AMO générés" className="my-4">
 {context&&<AmoStatementForm caseId={context.c.case_id} householdId={context.h.householdId} members={context.h.household.members.map(m=>({id:m.member_id,name:`${m.first_name} ${m.last_name}`}))} target={context.c.target_beneficiary_id} domicile={[context.record?.address,context.record?.postalCode,context.record?.city].filter(Boolean).join(" ")} hasNir={!!context.record?.socialSecurityNumber} existing={getPrestations(owner).filter(p=>p.householdId===context.h.householdId).map(p=>({id:p.id,memberId:p.memberId,act:p.act,careDate:p.careDate,billed:p.billed,brss:p.brss,amoRate:p.amoRate}))}/>}
 {!formOnly&&<><h2>Décomptes AMO générés — Démo</h2><p className="m-help">Copies pédagogiques personnelles, distinctes des documents sources et des pièces à corriger.</p>
 {!context&&<Link className="m-button m-button--secondary my-2" href="/cas-pratiques">Choisir un cas pour générer un décompte</Link>}
 {documents.length?<ul className="space-y-2 mt-2">{documents.map(doc=><li key={doc.id}><a className="text-brand underline" href={`/api/amo-statements/${doc.id}`} target="_blank" rel="noreferrer">{doc.filename}</a> · {doc.createdAt.slice(0,16).replace("T"," ")}</li>)}</ul>:<p className="m-help">Aucun décompte généré.</p>}
 </>}
 </section>;
}
