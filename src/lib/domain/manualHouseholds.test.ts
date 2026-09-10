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
    expect(() => store.updateManualHousehold("editor", "FOY-001", 1, input)).toThrow("introuvable");
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
    store.removeManualBeneficiary("family", h.id, 3, id);
    expect(store.getManualHouseholds("family")[0]).toMatchObject({revision: 4, beneficiaries: []});
    expect(households.getHouseholdById(h.id, "family")?.household.members).toHaveLength(1);
    expect(buildSearchIndex("family").find(i => i.url === `/adherents/${h.id}`)?.subtitle).not.toContain("Alix Exemple");
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
