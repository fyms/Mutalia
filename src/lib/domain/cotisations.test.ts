import { afterAll,beforeAll,expect,it,vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { cotisationSummary } from "./cotisations";
vi.mock("server-only",()=>({}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/store/session",()=>({getSession:vi.fn(async()=>({userId:"a"}))}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-cotisations-"));
let db:typeof import("../db").db,store:typeof import("../store/runtimeStore"),service:typeof import("./cotisationService"),dossiers:typeof import("./dossierService");
let input:{householdId:string;period:string;amount:number;dueDate:string};
beforeAll(async()=>{process.env.MUTALIA_DATA_DIR=dir;db=(await import("../db")).db;store=await import("../store/runtimeStore");service=await import("./cotisationService");dossiers=await import("./dossierService");input={householdId:(await import("./households")).getAllHouseholds("a")[0].householdId,period:"2026-01",amount:100.10,dueDate:"2026-01-10"};});
afterAll(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true});});
it("persists manual expected amounts and history without altering pedagogical households",async()=>{
 const {getAllHouseholds}=await import("./households");const before=getAllHouseholds("a");
 const p=service.createCotisation("a",input);expect(p.expectedCents).toBe(10010);expect(getAllHouseholds("a")).toEqual(before);expect(before).toHaveLength(12);
 const other=new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
 try {const row=other.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("a") as {payload:string};expect(JSON.parse(row.payload).cotisations[p.id]).toEqual(p);}finally{other.close();}
});
it("derives all five statuses and integer balances from entered amounts",()=>{
 let p=service.createCotisation("a",{...input,dueDate:"2999-01-01"});expect(cotisationSummary(p).status).toBe("À venir");
 expect(cotisationSummary({...p,dueDate:"2026-01-01"},"2026-01-02").status).toBe("Impayée");
 p=service.recordCotisationEntry("a",p.id,p.revision,{kind:"payment",amount:0.1,date:"2026-01-01",reason:"Règlement fictif"});
 expect(cotisationSummary(p)).toMatchObject({paid:10,balance:10000,status:"Partielle"});
 p=service.recordCotisationEntry("a",p.id,p.revision,{kind:"payment",amount:100,date:"2026-01-01",reason:"Solde fictif"});expect(cotisationSummary(p)).toMatchObject({balance:0,status:"Réglée"});
 let q=service.createCotisation("a",input);q=service.recordCotisationEntry("a",q.id,q.revision,{kind:"adjustment",amount:100.1,date:"2026-01-01",reason:"Annulation pédagogique motivée"});
 expect(cotisationSummary(q)).toMatchObject({paid:0,adjusted:10010,balance:0,status:"Régularisée"});expect(q.entries).toHaveLength(1);
});
it("creates one overdue dossier, keeps partial arrears open and closes after settlement",()=>{
 let p=service.createCotisation("a",input);expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("À traiter");
 p=service.recordCotisationEntry("a",p.id,p.revision,{kind:"payment",amount:50,date:"2026-01-01",reason:"Acompte fictif"});
 expect(cotisationSummary(p)).toMatchObject({status:"Partielle",overdue:true});expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.anomaly).toContain("impayé");
 p=service.recordCotisationEntry("a",p.id,p.revision,{kind:"adjustment",amount:50.1,date:"2026-01-01",reason:"Solde régularisé pour exercice"});
 const rows=dossiers.getDossiers("a").filter(d=>d.id===p.dossierId);expect(rows).toHaveLength(1);expect(rows[0].status).toBe("Terminé");
 expect(store.getCotisations("a").find(r=>r.id===p.id)?.entries).toHaveLength(2);
});
it("detects newly overdue balances on read without requiring a new payment",()=>{
 vi.useFakeTimers();try {
 vi.setSystemTime(new Date("2026-01-09T12:00:00Z"));const p=service.createCotisation("a",input);expect(p.dossierId).toBeUndefined();
 vi.setSystemTime(new Date("2026-01-11T12:00:00Z"));const read=store.getCotisations("a").find(r=>r.id===p.id)!;expect(read.dossierId).toBeDefined();
 expect(dossiers.getDossiers("a").find(d=>d.id===read.dossierId)?.status).toBe("À traiter");
 }finally{vi.useRealTimers();}
});
it("rejects invalid amounts, overpayments, stale revisions and foreign owners",()=>{
 for(const patch of [{amount:-1},{amount:0},{amount:1.001},{period:"2026-13"},{dueDate:"invalid"},{householdId:"foreign"}])expect(()=>service.createCotisation("a",{...input,...patch})).toThrow();
 const p=service.createCotisation("a",input),entry={kind:"payment",amount:10,date:"2026-01-01",reason:"Règlement pédagogique"};
 expect(store.getCotisations("b")).toEqual([]);expect(()=>service.recordCotisationEntry("b",p.id,1,entry)).toThrow("introuvable");
 for(const patch of [{amount:101},{amount:-1},{amount:NaN},{date:"2999-01-01"},{reason:""}])expect(()=>service.recordCotisationEntry("a",p.id,1,{...entry,...patch})).toThrow();
 service.recordCotisationEntry("a",p.id,1,entry);expect(()=>service.recordCotisationEntry("a",p.id,1,entry)).toThrow("autre onglet");
 expect(store.getCotisations("a").find(r=>r.id===p.id)?.entries).toHaveLength(1);
});
it("authenticates actions and refreshes the list, 360, dossiers and cockpit",async()=>{
 const actions=await import("./cotisationActions"),{getSession}=await import("../store/session"),{revalidatePath}=await import("next/cache");
 vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));await expect(actions.createCotisationAction(input)).rejects.toThrow("Connexion requise");
 expect(await actions.createCotisationAction(input)).toEqual({});
 for(const route of ["/cotisations","/dossiers","/cockpit",`/adherents/${input.householdId}`])expect(revalidatePath).toHaveBeenCalledWith(route);
 expect(await actions.recordCotisationAction("unknown",1,{kind:"payment",amount:1,date:"2026-01-01",reason:"Test"})).toHaveProperty("error");
});
