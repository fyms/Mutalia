import { afterAll, beforeAll, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { dossierAge, dossierSummary, sortDossiers } from "./dossiers";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({revalidatePath: vi.fn()}));
vi.mock("@/lib/store/session", () => ({getSession: vi.fn(async () => ({userId: "a"}))}));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mutalia-dossiers-"));
let db: typeof import("../db").db;
let service: typeof import("./dossierService");
let store: typeof import("../store/runtimeStore");
beforeAll(async () => {
  process.env.MUTALIA_DATA_DIR = dir;
  db = (await import("../db")).db;
  service = await import("./dossierService");
  store = await import("../store/runtimeStore");
});
afterAll(() => {db?.close(); fs.rmSync(dir, {recursive:true,force:true});});
it("creates stable fictitious dossiers linked to the twelve existing households", async () => {
  const {getAllHouseholds} = await import("./households");
  const rows = service.getDossiers("a");
  expect(rows).toHaveLength(12);
  expect(new Set(rows.map(d => d.id)).size).toBe(12);
  for (const d of rows) expect(getAllHouseholds("a").some(h => h.householdId === d.householdId)).toBe(true);
  expect(service.getDossiers("a")).toEqual(rows);
  expect(dossierSummary(rows)).toEqual({todo:6, urgent:4, incomplete:2, waiting:2});
});
it("sorts by priority then age without changing the input", () => {
  const base = service.getDossiers("a")[0];
  const rows = [{...base,id:"normal",priority:"Normal" as const,createdAt:"2026-01-01"}, {...base,id:"new",priority:"Urgent" as const,createdAt:"2026-09-09"}, {...base,id:"old",priority:"Urgent" as const,createdAt:"2026-09-01"}];
  expect(sortDossiers(rows).map(r => r.id)).toEqual(["old","new","normal"]);
  expect(rows[0].id).toBe("normal");
  expect(dossierAge("2026-09-01T00:00:00Z", Date.parse("2026-09-10T00:00:00Z"))).toBe(9);
});
it("persists changes across connections and isolates managers without altering seeds", async () => {
  const {getAllHouseholds} = await import("./households");
  const before = getAllHouseholds("a");
  const row = service.getDossiers("a")[0];
  service.updateDossier("a",row.id,0,{status:"Terminé",priority:"Faible"});
  expect(service.getDossiers("a").find(d => d.id === row.id)).toMatchObject({status:"Terminé",priority:"Faible",revision:1,anomaly:null,nextAction:"Aucune action requise"});
  expect(service.getDossiers("b").find(d => d.id === row.id)?.status).toBe(row.status);
  expect(getAllHouseholds("a")).toEqual(before);
  const other = new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
  try {
    const saved = other.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("a") as {payload:string};
    expect(JSON.parse(saved.payload).dossiers[row.id].status).toBe("Terminé");
  } finally {other.close();}
  expect(dossierSummary(service.getDossiers("a")).urgent).toBe(3);
});
it("rejects invalid states, unknown ids and stale writes", () => {
  const row = service.getDossiers("a").find(d => d.revision === 1)!;
  expect(() => service.updateDossier("a",row.id,0,{status:"À traiter",priority:"Urgent"})).toThrow("changé");
  expect(() => service.updateDossier("a",row.id,1,{status:"inventé",priority:"Urgent"})).toThrow();
  expect(() => service.updateDossier("a","unknown",0,{status:"À traiter",priority:"Urgent"})).toThrow("introuvable");
});
it("includes manual households only for their owner and reads old store payloads", async () => {
  const {getHouseholdFormulas} = await import("./householdFormulas");
  const h = store.createManualHousehold("manual", {firstName:"Démo",lastName:"Exemple",birthDate:"1990-01-01",email:"demo@example.invalid",phone:"0100000000",address:"1 rue Exemple",postalCode:"75001",city:"Paris",effectiveDate:"2026-09-01",formulaKey:getHouseholdFormulas()[0].key});
  expect(service.getDossiers("manual")).toHaveLength(13);
  const id = `DOS-${h.id}`;
  expect(service.getDossiers("b").some(d => d.id === id)).toBe(false);
  expect(() => service.updateDossier("b",id,0,{status:"Terminé",priority:"Normal"})).toThrow("introuvable");
  service.updateDossier("manual",id,0,{status:"En attente",priority:"Normal"});
  expect(store.getManualHouseholds("manual")[0]).toEqual(h);
});
it("authenticates changes and refreshes cockpit and queue", async () => {
  const {updateDossierAction} = await import("./dossierActions");
  const {getSession} = await import("../store/session");
  const {revalidatePath} = await import("next/cache");
  const row = service.getDossiers("a").find(d => d.revision === 0)!;
  vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));
  await expect(updateDossierAction(row.id,0,{status:"En attente",priority:"Normal"})).rejects.toThrow("Connexion requise");
  expect(await updateDossierAction(row.id,0,{status:"En attente",priority:"Normal"})).toEqual({});
  expect(revalidatePath).toHaveBeenCalledWith("/dossiers");
  expect(revalidatePath).toHaveBeenCalledWith("/cockpit");
  expect(await updateDossierAction("unknown",0,{status:"Terminé",priority:"Normal"})).toHaveProperty("error");
});
