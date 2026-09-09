import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ASSISTANCE_LEVELS,
  ROLES,
  type AssistanceLevel,
  type Role,
} from "@/lib/domain/constants";
import { getUserById, getValidSession } from "@/lib/store/runtimeStore";

const SESSION_COOKIE = "mutalia_session";
const LEVEL_COOKIE = "mutalia_level";
const NEW_HIRE_COOKIE = "mutalia_new_hire";
/** Bascule d'aperçu réservée aux comptes Formateur : ne modifie jamais le rôle réel du compte. */
const ROLE_PREVIEW_COOKIE = "mutalia_role_preview";

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  /** Rôle réel et infalsifiable du compte connecté — seule source de vérité pour les contrôles de sécurité. */
  accountRole: Role;
  /** Rôle affiché pour l'UI : identique à accountRole, sauf aperçu apprenant activé par un compte Formateur. */
  role: Role;
  level: AssistanceLevel;
  newHireMode: boolean;
  /** Alias de userId : conservé pour la compatibilité avec le scope par profil (soumissions, quiz, pilotage). */
  profileId: string;
}

/** Ne redirige jamais : à utiliser uniquement là où une absence de session est un état légitime (ex. /login). */
export async function getAuthSession(): Promise<Session | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const record = getValidSession(sessionId);
  if (!record) return null;

  const user = getUserById(record.userId);
  if (!user) return null;

  const rawLevel = store.get(LEVEL_COOKIE)?.value;
  const rawNewHire = store.get(NEW_HIRE_COOKIE)?.value;
  const rawPreview = store.get(ROLE_PREVIEW_COOKIE)?.value;

  const level = (ASSISTANCE_LEVELS as readonly string[]).includes(rawLevel ?? "")
    ? (rawLevel as AssistanceLevel)
    : "debutant";
  const newHireMode = rawNewHire ? rawNewHire === "1" : true;
  const role =
    user.role === "formateur" && (ROLES as readonly string[]).includes(rawPreview ?? "")
      ? (rawPreview as Role)
      : user.role;

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    accountRole: user.role,
    role,
    level,
    newHireMode,
    profileId: user.id,
  };
}

/** À utiliser dans toutes les pages de l'application : redirige vers /login si aucune session valide. */
export async function getSession(): Promise<Session> {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionCookieValue(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** Aperçu apprenant : réservé aux comptes Formateur, ne change jamais accountRole. */
export async function setRolePreview(role: Role): Promise<void> {
  const store = await cookies();
  store.set(ROLE_PREVIEW_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setLevel(level: AssistanceLevel): Promise<void> {
  const store = await cookies();
  store.set(LEVEL_COOKIE, level, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setNewHireMode(enabled: boolean): Promise<void> {
  const store = await cookies();
  store.set(NEW_HIRE_COOKIE, enabled ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
