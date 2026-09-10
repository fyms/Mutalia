"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/store/session";
import { auth } from "./config";
import { db } from "@/lib/db";
import { z } from "zod";
const roleSchema = z.enum(["apprenant", "formateur", "administrateur"]);
export async function inviteAccount(raw: unknown) {
  const s = await getSession();
  if (s.accountRole !== "administrateur") throw new Error("Accès refusé");
  const input = z
    .object({
      email: z.email(),
      name: z.string().min(1).max(100),
      role: roleSchema,
    })
    .parse(raw);
  await auth.api.createUser({ body: input, headers: await headers() });
  await auth.api.requestPasswordReset({
    body: { email: input.email, redirectTo: "/activation" },
  });
  revalidatePath("/administration");
  return "Compte créé ; invitation confiée au transport de compte.";
}
export async function changeAccount(raw: unknown) {
  const s = await getSession();
  if (s.accountRole !== "administrateur") throw new Error("Accès refusé");
  const input = z
    .object({ id: z.string(), role: roleSchema, disabled: z.boolean() })
    .parse(raw);
  if (input.id === s.userId)
    throw new Error(
      "La modification de votre propre rôle ou désactivation est interdite ici.",
    );
  await auth.api.setRole({
    headers: await headers(),
    body: { userId: input.id, role: input.role },
  });
  if (input.disabled)
    await auth.api.banUser({
      headers: await headers(),
      body: {
        userId: input.id,
        banReason: "Compte désactivé par l’administrateur",
      },
    });
  else
    await auth.api.unbanUser({
      headers: await headers(),
      body: { userId: input.id },
    });
  await auth.api.revokeUserSessions({
    headers: await headers(),
    body: { userId: input.id },
  });
  revalidatePath("/administration");
  return "Compte mis à jour. Sessions révoquées.";
}
export async function assignLearner(raw: unknown) {
  const s = await getSession();
  if (s.accountRole !== "administrateur") throw new Error("Accès refusé");
  const input = z
    .object({ trainer: z.string(), learner: z.string(), remove: z.boolean() })
    .parse(raw);
  const role = (id: string) =>
    (
      db.prepare("SELECT role FROM user WHERE id=?").get(id) as
        { role: string } | undefined
    )?.role;
  if (
    role(input.trainer) !== "formateur" ||
    role(input.learner) !== "apprenant"
  )
    throw new Error("Sélectionnez un formateur et un apprenant");
  if (input.remove)
    db.prepare(
      "DELETE FROM trainer_assignment WHERE trainer=? AND learner=?",
    ).run(input.trainer, input.learner);
  else
    db.prepare(
      "INSERT OR IGNORE INTO trainer_assignment(trainer,learner) VALUES(?,?)",
    ).run(input.trainer, input.learner);
  revalidatePath("/administration");
  return "Rattachement mis à jour.";
}
