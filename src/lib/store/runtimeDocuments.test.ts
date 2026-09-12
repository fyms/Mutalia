import { beforeAll,afterAll,it,expect,vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { MAX_UPLOAD_SIZE,documentView } from "@/lib/domain/runtimeDocuments";
vi.mock("server-only",()=>({}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-upload-"));
let db:typeof import("@/lib/db").db,store:typeof import("./runtimeDocuments"),households:typeof import("@/lib/domain/households"),runtime:typeof import("./runtimeStore");let pdf:Uint8Array;
beforeAll(async()=>{process.env.MUTALIA_DATA_DIR=dir;db=(await import("@/lib/db")).db;store=await import("./runtimeDocuments");households=await import("@/lib/domain/households");runtime=await import("./runtimeStore");const document=await PDFDocument.create();document.addPage();pdf=await document.save();});
afterAll(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
const metadata=(h:ReturnType<typeof households.getAllHouseholds>[0])=>({householdId:h.householdId,beneficiaryId:h.beneficiaries[0]?.member_id??h.adherent.member_id,documentType:"facture_acquittee",documentDate:"2026-09-12",note:"Exercice"});
it("persists PDF bytes separately, preserves source and reset, verifies owner/household, then deletes only uploaded files",async()=>{
 const {getAllCases}=await import("@/lib/data/loaders"),source=JSON.stringify(getAllCases());const h=households.getAllHouseholds()[0];
 const doc=store.uploadDocument("a",metadata(h),{name:"facture-demo.pdf",type:"application/pdf",size:pdf.length},pdf);
 expect(doc.source).toBe("uploaded");expect(doc.status).toBe("a_qualifier");expect(doc.beneficiaryId).toBe(metadata(h).beneficiaryId);
 const file=path.join(dir,"uploads",doc.storedFileName);expect(fs.readFileSync(file)).toEqual(Buffer.from(pdf));
 expect(store.listRuntimeDocuments("a",h.householdId)[0]).toEqual(doc);
 expect(documentView(doc)).not.toHaveProperty("storedFileName");
 expect(store.readRuntimeDocument("b",h.householdId,doc.id)).toBeUndefined();expect(store.readRuntimeDocument("a","wrong",doc.id)).toBeUndefined();
 expect(()=>store.deleteUploadedDocument("b",h.householdId,doc.id,true)).toThrow();expect(()=>store.deleteUploadedDocument("a",h.householdId,doc.id,false)).toThrow();
 expect(()=>store.deleteUploadedDocument("a",h.householdId,h.case!.documents[0].document_id,true)).toThrow();
 runtime.resetPedagogicalHousehold("a",h.householdId,0,true);expect(store.readRuntimeDocument("a",h.householdId,doc.id)?.bytes).toEqual(Buffer.from(pdf));
 store.setRuntimeDocumentStatus("a",h.householdId,doc.id,"conforme");expect(store.findRuntimeDocument("a",h.householdId,doc.id)?.status).toBe("conforme");
 store.deleteUploadedDocument("a",h.householdId,doc.id,true);expect(fs.existsSync(file)).toBe(false);expect(store.findRuntimeDocument("a",h.householdId,doc.id)).toBeUndefined();
 expect(store.documentEvents("a",h.householdId).map(e=>e.event)).toEqual(["Document importé","Document importé supprimé"]);
 expect(JSON.stringify(getAllCases())).toBe(source);
});
it("accepts JPEG and PNG but refuses forbidden/mismatched/oversize files and foreign beneficiaries",()=>{
 const h=households.getAllHouseholds()[1],input=metadata(h);
 for(const [name,type,bytes] of [["demo.jpg","image/jpeg",Buffer.from([255,216,255,224,0,16,255,217])],["demo.png","image/png",Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV1kAAAAASUVORK5CYII=","base64")]] as const){const d=store.uploadDocument("images",input,{name,type,size:bytes.length},bytes);expect(store.readRuntimeDocument("images",h.householdId,d.id)?.bytes).toEqual(bytes);}
 for(const file of [{name:"virus.exe",type:"application/pdf",size:pdf.length},{name:"fake.png",type:"image/png",size:pdf.length},{name:"fake.pdf",type:"image/jpeg",size:pdf.length},{name:"big.pdf",type:"application/pdf",size:MAX_UPLOAD_SIZE+1},{name:"180017512345642.pdf",type:"application/pdf",size:pdf.length},{name:"FR7630006000011234567890189.pdf",type:"application/pdf",size:pdf.length}])expect(()=>store.uploadDocument("invalid",input,file,pdf)).toThrow();
 expect(()=>store.uploadDocument("invalid",{...input,beneficiaryId:"foreign"},{name:"demo.pdf",type:"application/pdf",size:pdf.length},pdf)).toThrow();
});
it("prevents household deletion from orphaning uploaded documents or their history",async()=>{
 const owner="document-closure",formulaKey=(await import("@/lib/domain/householdFormulas")).getHouseholdFormulas()[0].key;
 const h=runtime.createManualHousehold(owner,{firstName:"Audit",lastName:"Documents",birthDate:"1990-01-01",email:"audit@example.invalid",phone:"0100000000",address:"1 rue Exemple",postalCode:"75001",city:"Paris",effectiveDate:"2026-09-10",formulaKey});
 const doc=store.uploadDocument(owner,{householdId:h.id,beneficiaryId:h.memberId,documentType:"justificatif",documentDate:"2026-09-12",note:""},{name:"audit.pdf",type:"application/pdf",size:pdf.length},pdf);
 runtime.changeHouseholdLifecycle(owner,h.id,0,null,{status:"archived",endDate:"2026-09-12",endReason:"error"});
 expect(()=>runtime.deleteErroneousHousehold(owner,h.id,`SUPPRIMER ${h.id}`)).toThrow("historique métier");
 expect(households.getHouseholdById(h.id,owner)).toBeDefined();
 expect(store.readRuntimeDocument(owner,h.id,doc.id)?.bytes).toEqual(Buffer.from(pdf));
 store.deleteUploadedDocument(owner,h.id,doc.id,true);
 expect(()=>runtime.deleteErroneousHousehold(owner,h.id,`SUPPRIMER ${h.id}`)).toThrow("historique métier");
});
it("migrates old generated AMO into the shared file adapter without permitting deletion",()=>{
 const h=households.getAllHouseholds()[0];db.exec("CREATE TABLE IF NOT EXISTS pedagogical_amo_documents(id TEXT PRIMARY KEY,owner TEXT,case_id TEXT,created_at TEXT,filename TEXT,snapshot TEXT,pdf BLOB)");
 db.prepare("INSERT INTO pedagogical_amo_documents VALUES(?,?,?,?,?,?,?)").run("AMO-DEMO-legacy","legacy",h.case!.case_id,"2026-09-12","decompte-demo.pdf",JSON.stringify({householdId:h.householdId,memberId:h.adherent.member_id,careDate:"2026-09-10"}),Buffer.from(pdf));
 const docs=store.listRuntimeDocuments("legacy",h.householdId);expect(docs).toHaveLength(1);expect(docs[0].source).toBe("generated");expect(store.readRuntimeDocument("legacy",h.householdId,docs[0].id)?.bytes).toEqual(Buffer.from(pdf));
 expect(()=>store.deleteUploadedDocument("legacy",h.householdId,docs[0].id,true)).toThrow();
 expect(store.listRuntimeDocuments("legacy",h.householdId)).toHaveLength(1);
 expect((db.prepare("SELECT length(pdf) AS n FROM pedagogical_amo_documents WHERE id=?").get(docs[0].id) as {n:number}).n).toBe(0);
});
