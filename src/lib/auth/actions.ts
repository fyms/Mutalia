"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearSessionCookie,
  getSessionCookieValue,
  setSessionCookie,
} from "@/lib/store/session";
import {
  createSession,
  createUser,
  deleteSession,
  verifyCredentials,
} from "@/lib/store/runtimeStore";
import type { Role } from "@/lib/domain/constants";

export interface AuthFormState {
  error: string | null;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);
  redirect("/");
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const roleInput = String(formData.get("role") ?? "apprenant");
  const role: Role = roleInput === "formateur" ? "formateur" : "apprenant";

  try {
    const user = await createUser({ email, password, displayName, role });
    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur lors de la création du compte." };
  }
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const sessionId = await getSessionCookieValue();
  if (sessionId) {
    await deleteSession(sessionId);
  }
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}
