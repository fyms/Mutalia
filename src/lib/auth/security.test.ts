import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
vi.mock("server-only", () => ({}));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mutalia-security-"));
let auth: typeof import("./config").auth;
let db: typeof import("../db").db;
let work: typeof import("../store/runtimeStore");
let drafts: typeof import("../store/drafts");
const password = randomBytes(24).toString("base64url");
let a: string;
let b: string;
let cookie: string;
async function post(
  endpoint: string,
  body: unknown,
  cookie = "",
  origin = "http://localhost:3000",
) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Cookie: cookie,
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify(body),
    }),
  );
}
async function tokenFor(email: string) {
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/activation" },
  });
  const messages = fs
    .readdirSync(path.join(dir, "mail"))
    .map((f) => ({ file: f, stat: fs.statSync(path.join(dir, "mail", f)) }))
    .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs)
    .map((x) =>
      JSON.parse(fs.readFileSync(path.join(dir, "mail", x.file), "utf8")),
    )
    .filter((m) => m.to === email);
  return new URL(messages.at(-1).text.match(/https?:\/\/\S+/)[0]).pathname
    .split("/")
    .pop()!;
}
async function activate(email: string) {
  const token = await tokenFor(email);
  expect(
    (await post("reset-password", { token, newPassword: password })).status,
  ).toBe(200);
  return token;
}
async function login(email: string) {
  const r = await post("sign-in/email", { email, password });
  expect(r.status).toBe(200);
  expect(r.headers.get("set-cookie")).toContain("HttpOnly");
  return r.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}
beforeAll(async () => {
  process.env.MUTALIA_DATA_DIR = dir;
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.MAIL_TRANSPORT = "capture";
  const mod = await import("./config");
  auth = mod.auth;
  db = (await import("../db")).db;
  const { getMigrations } = await import("better-auth/db/migration");
  await (await getMigrations(mod.authOptions)).runMigrations();
  work = await import("../store/runtimeStore");
  drafts = await import("../store/drafts");
  a = (
    await auth.api.createUser({
      body: { email: "a@mutalia.invalid", name: "A", role: "apprenant" },
    })
  ).user.id;
  b = (
    await auth.api.createUser({
      body: { email: "b@mutalia.invalid", name: "B", role: "apprenant" },
    })
  ).user.id;

});
afterAll(() => {
  db?.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
describe("real accounts and persistent work", () => {
  it("refuses public signup and unauthenticated account creation", async () => {
    expect(
      (
        await post("sign-up/email", {
          email: "x@mutalia.invalid",
          password,
          name: "X",
        })
      ).status,
    ).toBeGreaterThanOrEqual(400);
    expect(
      (
        await post("admin/create-user", {
          email: "x@mutalia.invalid",
          name: "X",
          role: "administrateur",
        })
      ).status,
    ).toBeGreaterThanOrEqual(400);
  });
  it("activates an invitation once with a real HttpOnly session", async () => {
    const token = await activate("a@mutalia.invalid");
    expect(
      (await post("reset-password", { token, newPassword: password })).status,
    ).toBe(400);
    cookie = await login("a@mutalia.invalid");
    expect(cookie).toContain("session_token");
  });
  it("rejects incorrect passwords, learner escalation, and foreign origins", async () => {
    expect(
      (
        await post("sign-in/email", {
          email: "a@mutalia.invalid",
          password: "invalid-password",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await post(
          "admin/set-role",
          { userId: a, role: "administrateur" },
          cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (await post("sign-out", {}, cookie, "https://other.invalid")).status,
    ).toBe(403);
  });
  it("isolates annotations and drafts and rejects conflicting saves", async () => {
    await work.addDocumentAnnotation(
      a,
      "DOC-001",
      "Observation personnelle",
      "A",
    );
    expect(work.getDocumentState(b, "DOC-001").annotations).toEqual([]);
    const input = {
      caseId: "CASE-001",
      completedObjectives: [],
      selectedAnomalies: [],
      values: {},
      explanation: "Justification enregistrée",
      qualifications: {},
    };
    expect(drafts.saveDraft(a, input, 0).revision).toBe(1);
    expect(drafts.getDraft(b, "CASE-001")).toBeNull();
    expect(() => drafts.saveDraft(a, input, 0)).toThrow("Conflit");
    expect(work.getAllSubmissions(b)).toEqual({});
  });
  it("keeps repeated submissions idempotent and preserves historical payloads", () => {
    const historical = JSON.stringify({version: 5, untouched: true});
    db.prepare("INSERT INTO learner_work(owner,payload) VALUES(?,?)").run(a, historical);
    const result = {
      caseId: "CASE-001", submittedAt: new Date().toISOString(), score: 0,
      maxScore: 100, breakdown: [],
      correction: {anomalies: [], expectedActions: [], expectedValues: {}, trainerNotes: ""},
    };
    expect(work.recordSubmissionOnce(a, 1, result)).toEqual(result);
    expect(work.recordSubmissionOnce(a, 1, {...result, score: 100})).toEqual(result);
    expect(work.getSubmissions(a, "CASE-001")).toHaveLength(1);
    expect(work.getSubmissions(b, "CASE-001")).toEqual([]);
    expect(db.prepare("SELECT payload FROM learner_work WHERE owner=?").get(a)).toEqual({payload: historical});
  });
  it("revokes logout sessions and restores saved work on reconnect", async () => {
    await post("sign-out", {}, cookie);
    expect(
      await auth.api.getSession({ headers: new Headers({ Cookie: cookie }) }),
    ).toBeNull();
    db.prepare("DELETE FROM rateLimit").run();
    cookie = await login("a@mutalia.invalid");
    expect(drafts.getDraft(a, "CASE-001")?.revision).toBe(1);
  });
  it("expires sessions and denies disabled accounts", async () => {
    db.prepare("UPDATE session SET expiresAt=? WHERE userId=?").run(
      Date.now() - 10000,
      a,
    );
    expect(
      await auth.api.getSession({ headers: new Headers({ Cookie: cookie }) }),
    ).toBeNull();
    db.prepare("UPDATE user SET banned=1 WHERE id=?").run(a);
    expect(
      (await post("sign-in/email", { email: "a@mutalia.invalid", password }))
        .status,
    ).toBeGreaterThanOrEqual(400);
    db.prepare("UPDATE user SET banned=0 WHERE id=?").run(a);
  });
  it("gives generic recovery responses and revokes sessions after reset", async () => {
    await activate("b@mutalia.invalid");
    const c = await login("b@mutalia.invalid");
    const known = await post("request-password-reset", {
      email: "b@mutalia.invalid",
      redirectTo: "/activation",
    });
    const unknown = await post("request-password-reset", {
      email: "unknown@mutalia.invalid",
      redirectTo: "/activation",
    });
    expect(await known.json()).toEqual(await unknown.json());
    const token = await tokenFor("b@mutalia.invalid");
    await post("reset-password", { token, newPassword: password + "x" });
    expect(
      await auth.api.getSession({ headers: new Headers({ Cookie: c }) }),
    ).toBeNull();
  });
  it("removes source answer cues and raw filenames from learner DTOs", async () => {
    const loaders = await import("../data/loaders");
    const cases = loaders.getAllCases();
    expect(cases).toHaveLength(12);
    for (const c of cases) {
      expect(c.objectives).toEqual(loaders.NEUTRAL_CHECKS);
      expect(c.scenario_type).toBe("dossier_documentaire");
      for (const d of c.documents) {
        expect(d.anomalies).toEqual([]);
        expect(d.file_name).toMatch(/^piece-\d+\.pdf$/);
      }
    }
    expect(loaders.getAnswerKey("../../package")).toBeUndefined();
  });
});
