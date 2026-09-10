import { afterAll, beforeAll, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { computeReimbursement } from "./reimbursement";
import { calculatePrestation, PRESTATION_STATUSES, type PrestationInput } from "./prestations";
import { DATA_TO_VERIFY } from "./constants";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({revalidatePath:vi.fn()}));
vi.mock("@/lib/store/session", () => ({getSession:vi.fn(async()=>({userId:"a"}))}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-prestations-"));
let db:typeof import("../db").db;
let service:typeof import("./prestationService");
let store:typeof import("../store/runtimeStore");
let dossiers:typeof import("./dossierService");
let input:PrestationInput;
beforeAll(async()=>{
  process.env.MUTALIA_DATA_DIR=dir;
  db=(await import("../db")).db;
  service=await import("./prestationService");store=await import("../store/runtimeStore");dossiers=await import("./dossierService");
  const h=(await import("./households")).getAllHouseholds("a")[0];
  input={householdId:h.householdId,memberId:h.adherent.member_id,act:"Consultation fictive",careDate:"2026-09-01",billed:80,brss:35,amoRate:0.7,guaranteeMode:"percent_brss",guaranteeValue:150,contractSource:"Exercice fictif — tableau de contrôle, page 1",contractVerified:true};
});
afterAll(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true});});
it("uses the existing simulator result for each supported guarantee mode",()=>{
  for(const guaranteeMode of ["percent_brss","forfait_euros","frais_reels"] as const){
    const data={...input,guaranteeMode};
    expect(calculatePrestation(data)).toEqual({result:computeReimbursement(data),anomalies:[]});
  }
});
it("receives and persists a linked control dossier without altering the household",async()=>{
  const {getAllHouseholds}=await import("./households");const before=getAllHouseholds("a");
  const p=service.receivePrestation("a",input);
  expect(p).toMatchObject({status:"Reçue",revision:1,result:null});
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)).toMatchObject({householdId:input.householdId,status:"À traiter"});
  expect(getAllHouseholds("a")).toEqual(before);
  const other=new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
  try{const row=other.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("a") as {payload:string};expect(JSON.parse(row.payload).prestations[p.id]).toEqual(p);}finally{other.close();}
});
it("enforces the full sequential workflow, preserves history and simulates payment only",()=>{
  let p=service.receivePrestation("a",input);
  expect(()=>service.advancePrestation("a",p.id,p.revision,"Payée")).toThrow("Transition");
  for(const status of PRESTATION_STATUSES.slice(1)){p=service.advancePrestation("a",p.id,p.revision,status);expect(p.status).toBe(status);}
  expect(p.result).toEqual(computeReimbursement({...input,guaranteeMode:"percent_brss"}));
  expect(p.history.map(h=>h.status)).toEqual([...PRESTATION_STATUSES]);
  expect(p.history.find(h=>h.status==="Payée")?.event).toContain("aucun flux financier");
  expect(dossiers.getDossiers("a").filter(d=>d.id===p.dossierId)).toHaveLength(1);
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Terminé");
  expect(()=>service.correctPrestation("a",p.id,p.revision,input)).toThrow("ne peut plus");
});
it("retains the exact unknown-contract warning and blocks calculation until corrected",()=>{
  let p=service.receivePrestation("a",{...input,guaranteeMode:undefined,guaranteeValue:undefined,contractVerified:false,contractSource:""});
  expect(p.anomalies).toContain(DATA_TO_VERIFY);
  p=service.advancePrestation("a",p.id,p.revision,"À contrôler");
  p=service.advancePrestation("a",p.id,p.revision,"Calculée");
  expect(p).toMatchObject({status:"À contrôler",result:null});
  expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("Incomplet");
  expect(()=>service.advancePrestation("a",p.id,p.revision,"Validée")).toThrow();
  p=service.correctPrestation("a",p.id,p.revision,input);
  p=service.advancePrestation("a",p.id,p.revision,"Calculée");
  expect(p.status).toBe("Calculée");expect(p.result).not.toBeNull();
});
it("clears a previously entered guarantee when the correction marks it unknown",()=>{
  let p=service.receivePrestation("a",input);
  const {guaranteeMode: _mode,guaranteeValue: _value,...unknown}=input;
  void _mode;void _value;
  p=service.correctPrestation("a",p.id,p.revision,unknown);
  expect(p.guaranteeMode).toBeUndefined();expect(p.anomalies).toContain(DATA_TO_VERIFY);
  expect(calculatePrestation({...input,contractSource:""}).result).toBeNull();
});
it("rejects foreign beneficiaries, invalid numbers, future care and cross-account operations",()=>{
  expect(()=>service.receivePrestation("a",{...input,memberId:"foreign"})).toThrow("introuvable");
  for(const invalid of [{billed:-1},{brss:NaN},{amoRate:2},{guaranteeValue:-10},{careDate:"2999-01-01"}])expect(()=>service.receivePrestation("a",{...input,...invalid})).toThrow();
  const p=service.receivePrestation("a",input);
  expect(store.getPrestations("b")).toEqual([]);
  expect(()=>service.advancePrestation("b",p.id,1,"À contrôler")).toThrow("introuvable");
  const advanced=service.advancePrestation("a",p.id,1,"À contrôler");
  expect(()=>service.advancePrestation("a",p.id,1,"À contrôler")).toThrow("autre onglet");
  expect(advanced.revision).toBe(2);
  const anomalous=calculatePrestation({...input,billed:1});
  expect(anomalous.result).toBeNull();expect(anomalous.anomalies[0]).toContain("AMO supérieure");
});
it("blocks care before manual membership effective date and retains the beneficiary link",async()=>{
  const {getHouseholdFormulas}=await import("./householdFormulas");
  const h=store.createManualHousehold("manual",{firstName:"Démo",lastName:"Exemple",birthDate:"1990-01-01",email:"demo@example.invalid",phone:"0100000000",address:"1 rue Exemple",postalCode:"75001",city:"Paris",effectiveDate:"2026-09-05",formulaKey:getHouseholdFormulas()[0].key});
  let p=service.receivePrestation("manual",{...input,householdId:h.id,memberId:h.memberId});
  p=service.advancePrestation("manual",p.id,p.revision,"À contrôler");p=service.advancePrestation("manual",p.id,p.revision,"Calculée");
  expect(p.result).toBeNull();expect(p.anomalies.join()).toContain("droits à vérifier");
});
it("authenticates actions and refreshes prestations, 360, dossiers and cockpit",async()=>{
  const {savePrestationAction,advancePrestationAction}=await import("./prestationActions");
  const {getSession}=await import("../store/session");const {revalidatePath}=await import("next/cache");
  vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));
  await expect(savePrestationAction(input)).rejects.toThrow("Connexion requise");
  expect(await savePrestationAction(input)).toEqual({});
  for(const route of ["/prestations",`/adherents/${input.householdId}`,"/dossiers","/cockpit"])expect(revalidatePath).toHaveBeenCalledWith(route);
  expect(await advancePrestationAction("unknown",1,"Payée")).toHaveProperty("error");
});
