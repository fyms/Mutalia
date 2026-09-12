import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({revalidatePath: vi.fn()}));
vi.mock("next/navigation", () => ({redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); }}));
vi.mock("@/lib/store/session", () => ({getSession: vi.fn(async () => ({userId: "owner-a"}))}));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mutalia-households-"));
let db: typeof import("../db").db;
let store: typeof import("../store/runtimeStore");
let households: typeof import("./households");
let formulas: typeof import("./householdFormulas");
const input = {
  firstName: "Élise", lastName: "Démonstration", birthDate: "1990-05-12",
  email: "elise@example.invalid", phone: "01 00 00 00 00", address: "10 rue Exemple",
  postalCode: "75001", city: "Paris", effectiveDate: "2026-09-10", formulaKey: "",
};
beforeAll(async () => {
  process.env.MUTALIA_DATA_DIR = dir;
  db = (await import("../db")).db;
  store = await import("../store/runtimeStore");
  households = await import("./households");
  formulas = await import("./householdFormulas");
  input.formulaKey = formulas.getHouseholdFormulas()[0].key;
});
afterAll(() => { db?.close(); fs.rmSync(dir, {recursive: true, force: true}); });
describe("manual households on the Codex store", () => {
  it("preserves the twelve seeds and persists unique households visible only to their owner", () => {
    const seeds = households.getAllHouseholds("owner-a");
    expect(seeds).toHaveLength(12);
    const a = store.createManualHousehold("owner-a", input);
    const b = store.createManualHousehold("owner-a", input);
    expect(a.id).not.toBe(b.id);
    expect(a.memberId).not.toBe(b.memberId);
    expect(households.getAllHouseholds("owner-a")).toHaveLength(14);
    expect(households.getAllHouseholds("owner-a").slice(0, 12)).toEqual(seeds);
    expect(households.getAllHouseholds("owner-b")).toHaveLength(12);
    expect(households.getHouseholdById(a.id, "owner-b")).toBeUndefined();
    const view = households.getHouseholdById(a.id, "owner-a")!;
    expect(view.case).toBeNull();
    expect(view.adherent.first_name).toBe(input.firstName);
    const connection = new Database(path.join(dir, "mutalia.sqlite"), {readonly: true});
    try {
      const row = connection.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("owner-a") as {payload: string};
      expect(JSON.parse(row.payload).manualHouseholds[a.id]).toEqual(a);
    } finally { connection.close(); }
    expect(a).toMatchObject({source: "manual", revision: 1, deletedAt: null, referenceYear: 2026});
  });
  it("reads old P0 payloads without erasing documents or submissions", () => {
    const payload = {version: 1, documents: {doc: {viewedAt: ["2026-09-10"], annotations: []}}, submissions: {}};
    db.prepare("INSERT INTO codex_learner_work(owner,payload) VALUES(?,?)").run("legacy", JSON.stringify(payload));
    expect(store.getManualHouseholds("legacy")).toEqual([]);
    store.createManualHousehold("legacy", input);
    expect(store.getDocumentState("legacy", "doc").viewedAt).toEqual(["2026-09-10"]);
  });
  it("rejects invalid dates, contacts and formulas without writing", () => {
    for (const invalid of [{birthDate: "2026-02-30"}, {birthDate: "2999-01-01"}, {effectiveDate: "1989-01-01"}, {email: "incorrect"}, {postalCode: "abc"}, {firstName: "  "}, {formulaKey: "invented"}]) {
      expect(() => store.createManualHousehold("invalid", {...input, ...invalid})).toThrow();
    }
    expect(store.getManualHouseholds("invalid")).toEqual([]);
    expect(() => store.createManualHousehold("", input)).toThrow("Compte requis");
    expect(new Set(formulas.getHouseholdFormulas().map(f => f.key)).size).toBe(formulas.getHouseholdFormulas().length);
  });
  it("adds created households to the existing search without cross-account disclosure", async () => {
    const {buildSearchIndex} = await import("./search");
    expect(buildSearchIndex("owner-a").some(i => i.title === "Élise Démonstration")).toBe(true);
    expect(buildSearchIndex("owner-b").some(i => i.title === "Élise Démonstration")).toBe(false);
  });
  it("authenticates creation, returns validation errors and redirects to the created 360 view", async () => {
    const {createHouseholdAction} = await import("./householdActions");
    const {getSession} = await import("../store/session");
    const data = new FormData();
    Object.entries(input).forEach(([key, value]) => data.set(key, value));
    vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));
    await expect(createHouseholdAction(data)).rejects.toThrow("Connexion requise");
    data.set("email", "invalid");
    expect(await createHouseholdAction(data)).toHaveProperty("error");
    data.set("email", input.email);
    await expect(createHouseholdAction(data)).rejects.toThrow(/REDIRECT:\/adherents\/FOY-M-/);
    expect(store.getManualHouseholds("owner-a")).toHaveLength(3);
  });
  it("updates identity without changing identifiers or seed households and refreshes search", async () => {
    const h = store.createManualHousehold("editor", input);
    const seeds = households.getAllHouseholds();
    const updated = store.updateManualHousehold("editor", h.id, h.revision, {...input, firstName: "Lucie", city: "Lyon", id: "forged"});
    expect(updated).toMatchObject({id: h.id, memberId: h.memberId, firstName: "Lucie", city: "Lyon", revision: 2, createdAt: h.createdAt});
    expect(households.getHouseholdById(h.id, "editor")?.adherent.first_name).toBe("Lucie");
    const {buildSearchIndex} = await import("./search");
    expect(buildSearchIndex("editor").find(i => i.url === `/adherents/${h.id}`)?.title).toBe("Lucie Démonstration");
    expect(() => store.updateManualHousehold("editor", h.id, 1, input)).toThrow("autre onglet");
    expect(() => store.updateManualHousehold("other", h.id, 2, input)).toThrow("introuvable");
    expect(() => store.updateManualHousehold("editor", "FOY-001", 1, input)).toThrow("autre onglet");
    expect(households.getAllHouseholds()).toEqual(seeds);
  });
  it("persists beneficiary add/edit/removal and refuses invalid or foreign mutations", async () => {
    const h = store.createManualHousehold("family", input);
    const child = {firstName: "Alex", lastName: "Exemple", birthDate: "2015-01-20", role: "enfant"};
    const added = store.saveManualBeneficiary("family", h.id, 1, null, child);
    const id = added.beneficiaries![0].id;
    expect(id).not.toBe(h.memberId);
    expect(households.getHouseholdById(h.id, "family")?.beneficiaries).toHaveLength(1);
    expect(() => store.saveManualBeneficiary("family", h.id, 2, null, {...child, role: "adherent"})).toThrow();
    expect(() => store.saveManualBeneficiary("family", h.id, 2, "foreign", child)).toThrow("introuvable");
    const edited = store.saveManualBeneficiary("family", h.id, 2, id, {...child, firstName: "Alix"});
    expect(edited.beneficiaries![0]).toMatchObject({id, firstName: "Alix"});
    const {buildSearchIndex} = await import("./search");
    expect(buildSearchIndex("family").find(i => i.url === `/adherents/${h.id}`)?.subtitle).toContain("Alix Exemple");
    expect(() => store.removeManualBeneficiary("other", h.id, 3, id)).toThrow("introuvable");
    expect(() => store.removeManualBeneficiary("family", h.id, 2, id)).toThrow("autre onglet");
    expect(() => store.removeManualBeneficiary("family", h.id, 3, h.memberId)).toThrow("introuvable");
    expect(() => store.removeManualBeneficiary("family", h.id, 3, id)).toThrow("Modifier le statut");
    expect(store.getManualHouseholds("family")[0]).toMatchObject({revision: 3, beneficiaries: [{id,firstName:"Alix"}]});
    expect(households.getHouseholdById(h.id, "family")?.household.members).toHaveLength(2);
    expect(buildSearchIndex("family").find(i => i.url === `/adherents/${h.id}`)?.subtitle).toContain("Alix Exemple");
  });
  it("edit actions authenticate and revalidate list, detail and search", async () => {
    const {editHouseholdAction} = await import("./householdActions");
    const {getSession} = await import("../store/session");
    const {revalidatePath} = await import("next/cache");
    const h = store.createManualHousehold("owner-a", input);
    const data = new FormData();
    Object.entries({...input, firstName: "Action"}).forEach(([k,v]) => data.set(k,v));
    vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));
    await expect(editHouseholdAction(h.id, 1, "adherent", null, data)).rejects.toThrow("Connexion requise");
    expect(await editHouseholdAction(h.id, 1, "adherent", null, data)).toEqual({});
    for (const route of ["/adherents", `/adherents/${h.id}`, "/api/search-index"]) expect(revalidatePath).toHaveBeenCalledWith(route);
    expect(await editHouseholdAction(h.id, 1, "adherent", null, data)).toHaveProperty("error");
  });

});

it("preserves lifecycle histories and operations, isolates accounts and resets only seed overlays", async () => {
 const {eligibleAt}=await import("./householdLifecycle");
 const seed=households.getAllHouseholds()[0];const snapshot=JSON.stringify(households.getAllHouseholds());
 const members=seed.beneficiaries;
 for (const [i,reason] of (["detached","divorce","deceased"] as const).entries()) {
  const owner=`lifecycle-${i}`;const member=members.find(m=>reason==="divorce"?m.role==="conjoint":m.role==="enfant")!;
  const life=store.changeHouseholdLifecycle(owner,seed.householdId,0,member.member_id,{status:reason==="deceased"?"deceased":"inactive",endDate:"2026-08-01",endReason:reason});
  expect(life.beneficiaries[member.member_id].history).toHaveLength(1);
  expect(eligibleAt(life,member.member_id,"2026-07-31")).toBe(true);
  expect(eligibleAt(life,member.member_id,"2026-08-01")).toBe(false);
  expect(households.getHouseholdById(seed.householdId,owner)?.lifecycle).toEqual(life);
  expect(households.getHouseholdById(seed.householdId,owner)?.household.members).toEqual(seed.household.members);
  expect(households.getHouseholdById(seed.householdId,"unaffected")?.lifecycle).toBeUndefined();
  await store.resetRuntimeStore(owner);expect(households.getHouseholdById(seed.householdId,owner)?.lifecycle).toBeUndefined();
 }
 const h=store.createManualHousehold("closed",input);
 const life=store.changeHouseholdLifecycle("closed",h.id,0,null,{status:"terminated",endDate:"2026-09-11",endReason:"termination"});
 expect(eligibleAt(life,h.memberId,"2026-09-11")).toBe(false);
 expect(households.getHouseholdById(h.id,"closed")).toBeDefined();
 expect(store.getManualHouseholds("closed")[0]).toEqual(h);
 await store.resetRuntimeStore("closed");expect(store.getHouseholdLifecycles("closed")[h.id]).toEqual(life);
 expect(JSON.stringify(households.getAllHouseholds())).toBe(snapshot);
 expect(()=>store.changeHouseholdLifecycle("closed",h.id,0,null,{status:"terminated",endDate:"2026-09-11",endReason:"termination"})).toThrow("autre onglet");
 const {context}=await import("./prestationService");
 expect(()=>context("closed",{householdId:h.id,memberId:h.memberId,careDate:"2026-09-11"} as never)).toThrow("inactif");
 expect(()=>context("closed",{householdId:h.id,memberId:h.memberId,careDate:"2026-09-10"} as never)).not.toThrow();
});

it("retains all linked records on closure and rejects physical deletion with historical links", () => {
 const owner="linked-lifecycle";const h=store.createManualHousehold(owner,input);
 const connection=new Database(path.join(dir,"mutalia.sqlite"));
 const payload=JSON.parse((connection.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get(owner) as {payload:string}).payload);
 for(const key of ["prestations","devisPec","cotisations","contacts","complaints"]){payload[key]={history:{id:"history",householdId:h.id}};}
 connection.prepare("UPDATE codex_learner_work SET payload=? WHERE owner=?").run(JSON.stringify(payload),owner);
 store.changeHouseholdLifecycle(owner,h.id,0,null,{status:"archived",endDate:"2026-09-11",endReason:"error"});
 expect(()=>store.deleteErroneousHousehold(owner,h.id,`SUPPRIMER ${h.id}`)).toThrow("historique métier");
 const after=JSON.parse((connection.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get(owner) as {payload:string}).payload);
 for(const key of ["prestations","devisPec","cotisations","contacts","complaints"])expect(after[key]).toEqual(payload[key]);
 expect(after.householdLifecycles[h.id].adherent.history).toHaveLength(1);connection.close();
 const empty=store.createManualHousehold("error-only",input);
 store.changeHouseholdLifecycle("error-only",empty.id,0,null,{status:"archived",endDate:"2026-09-11",endReason:"error"});
 expect(()=>store.deleteErroneousHousehold("error-only",empty.id,"oui")).toThrow("Confirmation");
 store.deleteErroneousHousehold("error-only",empty.id,`SUPPRIMER ${empty.id}`);
 expect(households.getHouseholdById(empty.id,"error-only")).toBeUndefined();
});
it("persists manual beneficiary exit and reactivation without losing earlier intervals", () => {
 const h=store.createManualHousehold("manual-lifecycle",input);
 const added=store.saveManualBeneficiary("manual-lifecycle",h.id,1,null,{firstName:"Alex",lastName:"Exemple",birthDate:"2005-01-01",role:"enfant"});
 const id=added.beneficiaries![0].id;
 store.changeHouseholdLifecycle("manual-lifecycle",h.id,0,id,{status:"inactive",endDate:"2026-09-10",endReason:"age_limit"});
 const restored=households.getHouseholdById(h.id,"manual-lifecycle")!;
 expect(restored.beneficiaries).toHaveLength(1);
 expect(restored.lifecycle?.beneficiaries[id]).toMatchObject({status:"inactive",endDate:"2026-09-10",endReason:"age_limit"});
 expect(()=>store.changeHouseholdLifecycle("manual-lifecycle",h.id,1,id,{status:"deceased",endDate:"2026-09-11",endReason:"divorce"})).toThrow("incompatibles");
});

it("persists demo banking per owner and records only generic updates",async()=>{
 const {generateDemoAccount,DemoBankingSchema}=await import("./demoBanking");
 const first=DemoBankingSchema.parse({paymentAccount:{...generateDemoAccount(),paymentMethod:"Prélèvement pédagogique",mandateDate:"2026-09-11",mandateStatus:"Actif"},refundAccount:{sameAsPayment:true}});
 const h=store.createManualHousehold("bank-a",{...input,banking:JSON.stringify(first)});
 expect(store.getManualHouseholds("bank-a")[0].banking?.refundAccount.iban).toBe(first.paymentAccount.iban);
 expect(store.getManualHouseholds("bank-b")).toEqual([]);
 const next=DemoBankingSchema.parse({paymentAccount:{...first.paymentAccount,...generateDemoAccount(),mandateStatus:"Révoqué"},refundAccount:{...generateDemoAccount(),sameAsPayment:false}});
 store.updateManualHousehold("bank-a",h.id,h.revision,{...input,banking:next});
 const saved=store.getManualHouseholds("bank-a")[0];expect(saved.banking).toEqual(next);
 expect(saved.bankingHistory).toEqual([{at:expect.any(String),event:"Coordonnées bancaires mises à jour"}]);
 expect(JSON.stringify(saved.bankingHistory)).not.toContain(first.paymentAccount.iban);
 const connection=new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
 try{const row=connection.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("bank-a") as {payload:string};expect(JSON.parse(row.payload).manualHouseholds[h.id].banking).toEqual(next);}finally{connection.close();}
 const {buildSearchIndex}=await import("./search");expect(JSON.stringify(buildSearchIndex("bank-a"))).not.toContain(next.paymentAccount.iban);
 const {householdTimeline}=await import("@/components/adherents/householdTimeline");
 const events=householdTimeline({dossiers:[],anomalies:[],appointments:[],prestations:[],complaints:[],quotes:[],cotisations:[],contacts:[]},h.id,undefined,{},h.createdAt,saved.bankingHistory);
 expect(events.some(e=>e.summary==="Coordonnées bancaires mises à jour")).toBe(true);
 expect(JSON.stringify(events)).not.toContain(next.paymentAccount.iban);
});

it("edits pedagogical overlays per account, preserves source and resets only the dossier", async () => {
 const {getAllCases} = await import("../data/loaders");
 const {pedagogicalHouseholdRecord} = await import("./pedagogicalHouseholdRecord");
 const owner="overlay-a", other="overlay-b";
 const seed=households.getAllHouseholds()[0], id=seed.householdId;
 const source=JSON.stringify(getAllCases());
 const payload={version:1,documents:{demo:{viewedAt:["2026-01-01"],annotations:[]}},submissions:{exercise:[{score:12}]},progress:{saved:true},drafts:{keep:true}};
 db.prepare("INSERT INTO codex_learner_work(owner,payload) VALUES(?,?)").run(owner,JSON.stringify(payload));
 const original=pedagogicalHouseholdRecord(id)!;
 expect(households.getHouseholdById(id,owner)?.household).toEqual(seed.household);
 const changed=store.updateManualHousehold(owner,id,0,{...original,firstName:"Simulation",address:"1 rue Fictive",postalCode:"45130",city:"Meung-sur-Loire",formulaKey:formulas.getHouseholdFormulas()[2].key});
 expect(changed.source).toBe("pedagogical");
 const child={firstName:"Enfant",lastName:"Fictif",birthDate:"2014-01-01",role:"enfant"};
 const added=store.saveManualBeneficiary(owner,id,1,null,child);
 const childId=added.beneficiaries!.at(-1)!.id;
 store.saveManualBeneficiary(owner,id,2,childId,{...child,firstName:"Modifié"});
 store.changeHouseholdLifecycle(owner,id,0,childId,{status:"inactive",endDate:"2026-09-12",endReason:"detached"});
 const view=households.getHouseholdById(id,owner)!;
 expect(view.adherent.first_name).toBe("Simulation");
 expect(view.simulation).toMatchObject({postalCode:"45130",city:"Meung-sur-Loire",address:"1 rue Fictive"});
 expect(view.assignedFormula).toBe(formulas.getHouseholdFormulas()[2].formula);
 expect(view.beneficiaries.at(-1)?.first_name).toBe("Modifié");
 expect(view.lifecycle?.beneficiaries[childId].status).toBe("inactive");
 expect(households.getHouseholdById(id,other)?.household).toEqual(seed.household);
 expect(JSON.stringify(getAllCases())).toBe(source);
 const persisted=JSON.parse((db.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get(owner) as {payload:string}).payload);
 expect(persisted.pedagogicalHouseholds[id].firstName).toBe("Simulation");
 expect(() => store.resetPedagogicalHousehold(owner,id,4,false)).toThrow();
 expect(() => store.resetPedagogicalHousehold(owner,id,0,true)).toThrow();
 store.resetPedagogicalHousehold(owner,id,4,true);
 expect(households.getHouseholdById(id,owner)?.household).toEqual(seed.household);
 expect(households.getHouseholdById(id,owner)?.simulation).toBeUndefined();
 const after=JSON.parse((db.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get(owner) as {payload:string}).payload);
 for(const key of ["documents","submissions","progress","drafts"] as const) expect(after[key]).toEqual(payload[key]);
 expect(after.pedagogicalHistory[id].map((e:{event:string})=>e.event)).toContain("Données de simulation réinitialisées");
 expect(() => store.updateManualHousehold(owner,id,0,original)).toThrow();
 expect(JSON.stringify(getAllCases())).toBe(source);
});
