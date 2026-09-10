import { getMigrations } from "better-auth/db/migration";
import { auth, authOptions } from "../src/lib/auth/config";
import { db, dataDir } from "../src/lib/db";
import { createInterface } from "node:readline/promises";
import fs from "node:fs";
import path from "node:path";
async function main() {
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    throw new Error(
      "Définir BETTER_AUTH_SECRET (32 caractères minimum) dans .env.local.",
    );
  await (await getMigrations(authOptions)).runMigrations();
  if (process.argv.includes("--migrate-only")) {
    console.log("Schéma prêt. Base : " + path.join(dataDir, "mutalia.sqlite"));
    return;
  }
  const lock = path.join(dataDir, "bootstrap.lock");
  const fd = fs.openSync(lock, "wx", 0o600);
  try {
    const arg = (name: string) => {
      const i = process.argv.indexOf(name);
      return i < 0 ? undefined : process.argv[i + 1];
    };
    let email = arg("--email"),
      name = arg("--name");
    if (!email || !name) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      email =
        email || (await rl.question("Adresse du premier administrateur : "));
      name = name || (await rl.question("Nom d’affichage : "));
      rl.close();
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name.trim())
      throw new Error("Adresse et nom requis.");
    const admin = db
      .prepare("SELECT id,email FROM user WHERE role='administrateur' LIMIT 1")
      .get() as { id: string; email: string } | undefined;
    if (admin && (admin.email !== email || !process.argv.includes("--resend")))
      throw new Error(
        "Un administrateur existe déjà. Pour renouveler son lien, reprendre son adresse et ajouter --resend.",
      );
    if (!admin)
      await auth.api.createUser({
        body: { email, name, role: "administrateur" },
      });
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/activation" },
    });
    console.log(
      "Invitation administrateur prête. Aucun mot de passe n’a été créé. Transport : " +
        (process.env.MAIL_TRANSPORT || "capture") +
        ". Base : " +
        path.join(dataDir, "mutalia.sqlite"),
    );
    if (process.env.MAIL_TRANSPORT !== "smtp") {
      const messages = fs
        .readdirSync(path.join(dataDir, "mail"))
        .map((file) => ({
          file,
          time: fs.statSync(path.join(dataDir, "mail", file)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time);
      const message = messages
        .map((x) =>
          JSON.parse(
            fs.readFileSync(path.join(dataDir, "mail", x.file), "utf8"),
          ),
        )
        .find((m) => m.to === email);
      const url = String(message?.text || "").match(/https?:\/\/\S+/)?.[0];
      if (!url)
        throw new Error("Invitation créée mais lien local introuvable.");
      const escape = (value: string) =>
        value
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      fs.writeFileSync(
        path.join(dataDir, "admin-invitation.html"),
        `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Activation administrateur Mutalia</title><body style="font:16px/1.5 Arial;padding:32px"><h1>Activer votre compte Mutalia</h1><p>Compte : ${escape(email)}</p><p>Vous choisirez votre mot de passe sur Mutalia. Ce lien expire dans une heure et ne fonctionne qu’une fois.</p><p><a href="${escape(url)}">Choisir mon mot de passe</a></p></body></html>`,
        { mode: 0o600 },
      );
      console.log(
        "Ouvrir le fichier privé : " +
          path.join(dataDir, "admin-invitation.html"),
      );
    }
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Initialisation impossible");
  process.exitCode = 1;
});
