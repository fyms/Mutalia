import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { documentFiles } from "./documentFiles";
import { getHouseholdById } from "@/lib/domain/households";
import { DocumentUploadSchema, MAX_UPLOAD_SIZE, RuntimeDocumentStatusSchema, type RuntimeDocument } from "@/lib/domain/runtimeDocuments";
db.exec(`CREATE TABLE IF NOT EXISTS runtime_documents(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,household_id TEXT NOT NULL,payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS runtime_documents_owner_household ON runtime_documents(owner_id,household_id);
CREATE TABLE IF NOT EXISTS runtime_document_events(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,household_id TEXT NOT NULL,created_at TEXT NOT NULL,event TEXT NOT NULL);`);
function event(owner:string,household:string,message:string){db.prepare("INSERT INTO runtime_document_events VALUES(?,?,?,?,?)").run(randomUUID(),owner,household,new Date().toISOString(),message);}
export function documentEvents(owner:string,household:string){return db.prepare("SELECT id,created_at AS at,event FROM runtime_document_events WHERE owner_id=? AND household_id=? ORDER BY created_at").all(owner,household) as {id:string;at:string;event:string}[];}
function assertHousehold(owner:string,id:string){if(!owner||!getHouseholdById(id,owner))throw new Error("Dossier introuvable.");}
function insert(record:RuntimeDocument){db.prepare("INSERT INTO runtime_documents VALUES(?,?,?,?)").run(record.id,record.ownerId,record.householdId,JSON.stringify(record));}
function safeFileName(name:string) {
 const file=name.split(/[\\/]/).at(-1)!.replace(/[\x00-\x1f\x7f]/g,"").trim();
 const compact=file.replace(/[\s_.-]/g,"").toUpperCase();
 if(!file||file.length>180||/\d{13,}/.test(compact)||/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/.test(compact))throw new Error("Renommez le fichier sans NIR ni IBAN, avec un nom court.");
 return file;
}
export function validateUpload(file:{name:string;type:string;size:number},bytes:Uint8Array) {
 if(!file.size||file.size>MAX_UPLOAD_SIZE||bytes.length!==file.size)throw new Error("Fichier vide ou supérieur à 10 Mo.");
 const originalFileName=safeFileName(file.name),extension=originalFileName.split(".").at(-1)?.toLowerCase();
 const expected=extension==="pdf"?"application/pdf":extension==="jpg"||extension==="jpeg"?"image/jpeg":extension==="png"?"image/png":undefined;
 if(!expected||file.type!==expected)throw new Error("Formats autorisés : PDF, JPEG et PNG uniquement.");
 const b=Buffer.from(bytes);
 const matches=expected==="application/pdf"?b.subarray(0,5).toString()==="%PDF-":expected==="image/png"?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b[0]===255&&b[1]===216&&b[2]===255;
 if(!matches)throw new Error("Le contenu ne correspond pas au format déclaré.");
 return {originalFileName,mimeType:expected,extension:expected==="image/jpeg"?"jpg":extension!};
}
export function uploadDocument(owner:string,raw:unknown,file:{name:string;type:string;size:number},bytes:Uint8Array) {
 const input=DocumentUploadSchema.parse(raw);assertHousehold(owner,input.householdId);
 const h=getHouseholdById(input.householdId,owner)!;
 if(!h.household.members.some(m=>m.member_id===input.beneficiaryId))throw new Error("Bénéficiaire étranger au dossier.");
 const validated=validateUpload(file,bytes),id=randomUUID();
 const record:RuntimeDocument={...input,...validated,id,storedFileName:`${id}.${validated.extension}`,ownerId:owner,createdBy:owner,size:bytes.length,source:"uploaded",status:"a_qualifier",createdAt:new Date().toISOString(),caseId:h.case?.case_id};
 documentFiles.write(record.storedFileName,bytes);
 try {db.transaction(()=>{insert(record);event(owner,input.householdId,"Document importé");})();}catch(e){documentFiles.remove(record.storedFileName);throw e;}
 return record;
}
export function storeGeneratedDocument(record:Omit<RuntimeDocument,"storedFileName"|"size">,bytes:Uint8Array,onStored?:()=>void) {
 const stored={...record,storedFileName:`${randomUUID()}.pdf`,size:bytes.length};documentFiles.write(stored.storedFileName,bytes);
 try{db.transaction(()=>{insert(stored);onStored?.();})();}catch(e){documentFiles.remove(stored.storedFileName);throw e;}return stored;
}
/** Move legacy AMO blobs to the same binary adapter; keep their immutable audit snapshot. */
export function migrateGeneratedDocuments(owner:string) {
 if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pedagogical_amo_documents'").get())return;
 const rows=db.prepare("SELECT * FROM pedagogical_amo_documents WHERE owner=? AND length(pdf)>0").all(owner) as {id:string;case_id:string;created_at:string;filename:string;snapshot:string;pdf:Buffer}[];
 for(const row of rows){
  if(db.prepare("SELECT id FROM runtime_documents WHERE id=? AND owner_id=?").get(row.id,owner))continue;
  const snapshot=JSON.parse(row.snapshot);
  storeGeneratedDocument({id:row.id,ownerId:owner,createdBy:owner,householdId:snapshot.householdId,beneficiaryId:snapshot.memberId,documentType:"decompte_amo",originalFileName:row.filename,mimeType:"application/pdf",documentDate:snapshot.careDate,note:"",source:"generated",status:"a_qualifier",createdAt:row.created_at,caseId:row.case_id},row.pdf,()=>{
   db.prepare("UPDATE pedagogical_amo_documents SET pdf=X'' WHERE id=? AND owner=?").run(row.id,owner);
  });
 }
}
export function listRuntimeDocuments(owner:string,household?:string):RuntimeDocument[]{
 migrateGeneratedDocuments(owner);
 const rows=db.prepare(`SELECT payload FROM runtime_documents WHERE owner_id=?${household?" AND household_id=?":""} ORDER BY json_extract(payload,'$.createdAt') DESC`).all(...(household?[owner,household]:[owner])) as {payload:string}[];
 return rows.map(r=>JSON.parse(r.payload));
}
export function findRuntimeDocument(owner:string,household:string,id:string):RuntimeDocument|undefined {
 const row=db.prepare("SELECT payload FROM runtime_documents WHERE owner_id=? AND household_id=? AND id=?").get(owner,household,id) as {payload:string}|undefined;
 return row?JSON.parse(row.payload):undefined;
}
export function readRuntimeDocument(owner:string,household:string,id:string){const record=findRuntimeDocument(owner,household,id);if(!record)return;return {record,bytes:documentFiles.read(record.storedFileName)};}
export function setRuntimeDocumentStatus(owner:string,household:string,id:string,status:unknown){
 const record=findRuntimeDocument(owner,household,id);if(!record)throw new Error("Document introuvable.");
 record.status=RuntimeDocumentStatusSchema.parse(status);db.prepare("UPDATE runtime_documents SET payload=? WHERE owner_id=? AND household_id=? AND id=?").run(JSON.stringify(record),owner,household,id);
}
export function deleteUploadedDocument(owner:string,household:string,id:string,confirmed:boolean){
 const record=findRuntimeDocument(owner,household,id);if(!record||record.source!=="uploaded"||confirmed!==true)throw new Error("Suppression interdite ou non confirmée.");
 // Keep a recoverable copy until both operations have succeeded.
 const bytes=documentFiles.read(record.storedFileName);
 let removed=false;
 try {db.transaction(()=>{documentFiles.remove(record.storedFileName);removed=true;db.prepare("DELETE FROM runtime_documents WHERE owner_id=? AND household_id=? AND id=?").run(owner,household,id);event(owner,household,"Document importé supprimé");})();}
 catch(e){if(removed)documentFiles.write(record.storedFileName,bytes);throw e;}
}
