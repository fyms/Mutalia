import { betterAuth, type BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import { defaultAc, userAc } from "better-auth/plugins/admin/access";
import { db, dataDir } from "../db";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32)
  throw new Error(
    "Définir un BETTER_AUTH_SECRET stable de 32 caractères minimum dans .env.local.",
  );
const adminRole = defaultAc.newRole({
  user: ["create", "list", "set-role", "ban", "update", "get"],
  session: ["list", "revoke", "delete"],
});
export const authOptions = {
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      const message = {
        from: process.env.MAIL_FROM || "Mutalia <formation@mutalia.invalid>",
        to: user.email,
        subject: "Mutalia — activation ou récupération du compte",
        text: `Définissez votre mot de passe avec ce lien à usage unique, valable une heure : ${url}`,
      };
      if (process.env.MAIL_TRANSPORT === "smtp") {
        if (!process.env.SMTP_URL || !process.env.MAIL_FROM)
          throw new Error("Transport de compte non configuré");
        await nodemailer
          .createTransport(process.env.SMTP_URL)
          .sendMail(message);
      } else {
        if (
          process.env.NODE_ENV === "production" &&
          process.env.MAIL_TRANSPORT !== "capture"
        )
          throw new Error("Configurer MAIL_TRANSPORT");
        const dir = path.join(dataDir, "mail");
        await fs.mkdir(dir, { recursive: true, mode: 0o700 });
        await fs.writeFile(
          path.join(dir, `${randomUUID()}.json`),
          JSON.stringify(message),
          { mode: 0o600 },
        );
      }
    },
    onPasswordReset: async ({ user }: { user: { id: string } }) => {
      db.prepare("UPDATE user SET active = 1 WHERE id = ?").run(user.id);
    },
  },
  user: {
    additionalFields: {
      active: { type: "boolean" as const, defaultValue: false, input: false },
    },
  },
  session: {
    expiresIn: Number(process.env.SESSION_TTL_SECONDS || 28800),
    updateAge: 900,
    cookieCache: { enabled: false },
  },
  logger: { disabled: true },
  advanced: {
    disableOriginCheck: false,
    disableCSRFCheck: false,
    useSecureCookies:
      process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
  },
  rateLimit: {
    enabled: true,
    storage: "database" as const,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session: { userId: string }) => {
          const user = db
            .prepare("SELECT active, banned FROM user WHERE id=?")
            .get(session.userId) as
            { active: number; banned: number } | undefined;
          if (!user?.active || user.banned) return false;
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "apprenant",
      adminRoles: ["administrateur"],
      roles: {
        administrateur: adminRole,
        apprenant: defaultAc.newRole(userAc.statements),
        formateur: defaultAc.newRole(userAc.statements),
      },
    }),
  ],
} satisfies BetterAuthOptions;
export const auth = betterAuth(authOptions);
