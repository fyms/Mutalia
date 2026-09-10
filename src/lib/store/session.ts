import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  ASSISTANCE_LEVELS,
  type AssistanceLevel,
  type Role,
} from "@/lib/domain/constants";
export interface Session {
  userId: string;
  email: string;
  displayName: string;
  accountRole: Role;
  role: Role;
  level: AssistanceLevel;
  newHireMode: boolean;
  profileId: string;
}
export async function getAuthSession(): Promise<Session | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const u = result.user;
  if (!u.active || u.banned) return null;
  const role = u.role;
  if (role !== "apprenant" && role !== "formateur" && role !== "administrateur")
    return null;
  const row = db
    .prepare("SELECT payload FROM preferences WHERE owner=?")
    .get(u.id) as { payload: string } | undefined;
  const prefs = row ? JSON.parse(row.payload) : {};
  return {
    userId: u.id,
    email: u.email,
    displayName: u.name,
    accountRole: role,
    role,
    level: prefs.level || "debutant",
    newHireMode: prefs.newHireMode ?? true,
    profileId: u.id,
  };
}
export async function getSession(): Promise<Session> {
  const s = await getAuthSession();
  if (!s) {
    const cookie = (await headers()).get("cookie") || "";
    redirect(
      /(?:better-auth|__Secure-better-auth)\.session_token=/.test(cookie)
        ? "/login?expired=1"
        : "/login",
    );
  }
  return s;
}
async function savePreference(update: Record<string, unknown>) {
  const s = await getSession();
  const row = db
    .prepare("SELECT payload FROM preferences WHERE owner=?")
    .get(s.userId) as { payload: string } | undefined;
  db.prepare(
    "INSERT INTO preferences(owner,payload) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload",
  ).run(
    s.userId,
    JSON.stringify({ ...(row ? JSON.parse(row.payload) : {}), ...update }),
  );
}
export async function setLevel(level: AssistanceLevel) {
  if (!ASSISTANCE_LEVELS.includes(level)) throw new Error("Niveau invalide");
  await savePreference({ level });
}
export async function setNewHireMode(enabled: boolean) {
  await savePreference({ newHireMode: enabled });
}
export async function setRolePreview(role: Role) {
  if (role !== (await getSession()).accountRole)
    throw new Error("Le rôle ne se modifie pas depuis les préférences.");
}
