import "server-only";
import { cookies } from "next/headers";
import {
  ASSISTANCE_LEVELS,
  ROLES,
  type AssistanceLevel,
  type Role,
} from "@/lib/domain/constants";

const ROLE_COOKIE = "mutalia_role";
const LEVEL_COOKIE = "mutalia_level";
const NEW_HIRE_COOKIE = "mutalia_new_hire";

export interface Session {
  role: Role;
  level: AssistanceLevel;
  newHireMode: boolean;
}

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const rawRole = store.get(ROLE_COOKIE)?.value;
  const rawLevel = store.get(LEVEL_COOKIE)?.value;
  const rawNewHire = store.get(NEW_HIRE_COOKIE)?.value;

  const role = (ROLES as readonly string[]).includes(rawRole ?? "")
    ? (rawRole as Role)
    : "apprenant";
  const level = (ASSISTANCE_LEVELS as readonly string[]).includes(rawLevel ?? "")
    ? (rawLevel as AssistanceLevel)
    : "debutant";
  const newHireMode = rawNewHire ? rawNewHire === "1" : true;

  return { role, level, newHireMode };
}

export async function setRole(role: Role): Promise<void> {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setLevel(level: AssistanceLevel): Promise<void> {
  const store = await cookies();
  store.set(LEVEL_COOKIE, level, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setNewHireMode(enabled: boolean): Promise<void> {
  const store = await cookies();
  store.set(NEW_HIRE_COOKIE, enabled ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
