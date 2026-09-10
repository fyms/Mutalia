import { afterAll, beforeAll, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { computeReimbursement } from "./reimbursement";
import { DATA_TO_VERIFY } from "./constants";
vi.mock("server-only",()=>({}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/store/session",()=>({getSession:vi.fn(async()=>({userId:"a"}))}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-devis-"));
let db:typeof import("../db").db;
let service:typeof import("./devisPecService");
let store:typeof import("../store/runtimeStore");
let dossiers:typeof import("./dossierService");
let input:import("./prestations").PrestationInput & {kind:"devis"|"pec"};
beforeAll(async()=>{
  process.env.MUTALIA_DATA_DIR=dir;db=(await import("../db")).db;
  service=await import("./devisPecService");store=await import("../store/runtimeStore");dossiers=await import("./dossierService");
  const h=(await import("./households")).getAllHouseholds("a")[0];
  input={kind:"devis",householdId:h.householdId,memberId:h.adherent.member_id,act:"Soin fictif",careDate:"2026-12-01",billed:80,brss:35,amoRate:0.7,guaranteeMode:"percent_brss",guaranteeValue:150,contractSource:"Exercice fictif, page 1",contractVerified:true};
});
afterAll(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true});});
it("persists both workflows and engine estimates without changing the 12 households",async()=>{
  const {getAllHouseholds}=await import("./households");const before=getAllHouseholds("a");
  for(const kind of ["devis","pec"] as const){
    let p=service.saveDevisPec("a",{...input,kind});
    expect(p.status).toBe(kind === "devis" ? "Reçu" : "Demandée");
    p=service.processDevisPec("a",p.id,p.revision,kind === "devis" ? "À analyser" : "À contrôler");
    p=service.processDevisPec("a",p.id,p.revision,"estimate");
    expect(p.result).toEqual(computeReimbursement({...input,guaranteeMode:"percent_brss"}));
    expect(p.status).toBe(kind === "devis" ? "Calculé" : "À contrôler");
    p=service.processDevisPec("a",p.id,p.revision,kind === "devis" ? "Accepté" : "Accordée");
    p=service.processDevisPec("a",p.id,p.revision,kind === "devis" ? "Clôturé" : "Clôturée");
    expect(p.history).toHaveLength(5);
    expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Terminé");
    expect(()=>service.saveDevisPec("a",{...input,kind},p.id,p.revision)).toThrow("ne peut plus");
    const other=new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
    try{const row=other.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("a") as {payload:string};expect(JSON.parse(row.payload).devisPec[p.id]).toEqual(p);}finally{other.close();}
  }
  expect(getAllHouseholds("a")).toEqual(before);expect(before).toHaveLength(12);
});
it("blocks unknown estimates and agreements, retaining the exact warning and linked anomaly",()=>{
  let p=service.saveDevisPec("a",{...input,kind:"pec",contractVerified:false});
  p=service.processDevisPec("a",p.id,p.revision,"À contrôler");
  p=service.processDevisPec("a",p.id,p.revision,"estimate");
  expect(p.result).toBeNull();expect(p.anomalies).toEqual([DATA_TO_VERIFY]);
  expect(()=>service.processDevisPec("a",p.id,p.revision,"Accordée")).toThrow("requis");
  const a=store.getOperationalAnomalies("a").find(a=>a.quoteId===p.id)!;
  expect(a).toMatchObject({dossierId:p.dossierId,conditionActive:true,severity:"Bloquante"});expect(a.prestationId).toBeUndefined();
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Incomplet");
  expect(()=>store.updateOperationalAnomaly("a",a.id,a.revision,{status:"Résolue",resolution:"Résolution impossible"})).toThrow("Corrigez d’abord");
  expect(store.getOperationalAnomalies("a").find(x=>x.id===a.id)).toEqual(a);
});
it("requires refusal reasons in both workflows and preserves source anomalies on administrative closure",()=>{
  for(const kind of ["devis","pec"] as const){
    let p=service.saveDevisPec("a",{...input,kind,contractVerified:false});
    p=service.processDevisPec("a",p.id,p.revision,kind === "devis" ? "À analyser" : "À contrôler");
    const target=kind === "devis" ? "Refusé" : "Refusée";
    expect(()=>service.processDevisPec("a",p.id,p.revision,target," ")).toThrow("Motif");
    p=service.processDevisPec("a",p.id,p.revision,target,"Demande abandonnée par le demandeur");
    p=service.processDevisPec("a",p.id,p.revision,kind === "devis" ? "Clôturé" : "Clôturée");
    expect(p.anomalies).toEqual([DATA_TO_VERIFY]);expect(p.result).toBeNull();
    const a=store.getOperationalAnomalies("a").find(a=>a.quoteId===p.id)!;
    expect(a.status).toBe("Résolue");expect(a.resolution).toContain("sans accord");expect(a.history).toHaveLength(2);
    expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Terminé");
  }
});
it("confirms monetary corrections by recalculation and synchronizes documented resolution",()=>{
  let p=service.saveDevisPec("a",{...input,billed:1});
  p=service.processDevisPec("a",p.id,p.revision,"À analyser");p=service.processDevisPec("a",p.id,p.revision,"estimate");
  expect(p.result).toBeNull();
  p=service.saveDevisPec("a",input,p.id,p.revision);
  let a=store.getOperationalAnomalies("a").find(a=>a.quoteId===p.id)!;expect(a.conditionActive).toBe(true);
  p=service.processDevisPec("a",p.id,p.revision,"estimate");
  a=store.getOperationalAnomalies("a").find(a=>a.quoteId===p.id)!;expect(a.conditionActive).toBe(false);
  p=service.processDevisPec("a",p.id,p.revision,"Accepté");
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("À traiter");
  store.updateOperationalAnomaly("a",a.id,a.revision,{status:"Résolue",resolution:"Montant corrigé et estimation contrôlée"});
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Terminé");
});
it("rejects invalid input, stale revisions, cross-owner edits and workflow shortcuts",()=>{
  for(const patch of [{billed:-1},{amoRate:2},{careDate:"invalid"},{memberId:"foreign"}])expect(()=>service.saveDevisPec("a",{...input,...patch})).toThrow();
  let p=service.saveDevisPec("a",input);
  expect(store.getDevisPec("b")).toEqual([]);expect(()=>service.processDevisPec("b",p.id,p.revision,"À analyser")).toThrow("introuvable");
  expect(()=>service.processDevisPec("a",p.id,p.revision,"Accepté")).toThrow("Transition");
  expect(()=>service.saveDevisPec("a",{...input,kind:"pec"},p.id,p.revision)).toThrow("rattachement");
  p=service.processDevisPec("a",p.id,p.revision,"À analyser");
  expect(()=>service.processDevisPec("a",p.id,1,"estimate")).toThrow("autre onglet");
  p=service.saveDevisPec("a",{...input,guaranteeMode:undefined,guaranteeValue:undefined},p.id,p.revision);
  expect(p.guaranteeMode).toBeUndefined();expect(p.result).toBeNull();expect(p.anomalies).toContain(DATA_TO_VERIFY);
});
it("authenticates actions and refreshes all connected pages",async()=>{
  const actions=await import("./devisPecActions");const {getSession}=await import("../store/session");const {revalidatePath}=await import("next/cache");
  vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));await expect(actions.saveDevisPecAction(input)).rejects.toThrow("Connexion requise");
  expect(await actions.saveDevisPecAction(input)).toEqual({});
  for(const route of ["/pec-devis","/flux-anomalies","/dossiers","/cockpit",`/adherents/${input.householdId}`])expect(revalidatePath).toHaveBeenCalledWith(route);
  expect(await actions.processDevisPecAction("unknown",1,"estimate")).toHaveProperty("error");
});
