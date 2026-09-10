import fs from "node:fs";
import path from "node:path";

// Local operator utility: never expose captured invitations through an HTTP route.
if (process.env.MAIL_TRANSPORT !== "capture") {
  throw new Error("Cette commande nécessite MAIL_TRANSPORT=capture.");
}
const emailIndex = process.argv.indexOf("--email");
const email = emailIndex >= 0 ? process.argv[emailIndex + 1] : undefined;
if (!email)
  throw new Error(
    "Utilisation : npm run auth:inbox -- --email adresse@example.org",
  );
const directory = path.resolve(process.env.MUTALIA_DATA_DIR || ".data");
const mailDirectory = path.join(directory, "mail");
const messages = fs
  .readdirSync(mailDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => ({
    file,
    time: fs.statSync(path.join(mailDirectory, file)).mtimeMs,
  }))
  .sort((a, b) => b.time - a.time);
const message = messages
  .map(({ file }) =>
    JSON.parse(fs.readFileSync(path.join(mailDirectory, file), "utf8")),
  )
  .find((item) => item.to.toLowerCase() === email.toLowerCase());
const url = String(message?.text || "").match(/https?:\/\/\S+/)?.[0];
if (!url)
  throw new Error(
    "Aucun message local pour cette adresse. Créez d’abord une invitation ou demandez une réinitialisation.",
  );
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const target = path.join(directory, "invitation-locale.html");
fs.writeFileSync(
  target,
  `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Invitation Mutalia</title><body style="font:16px/1.5 Arial;padding:32px"><h1>Choisir votre mot de passe</h1><p>Compte : ${escape(email)}</p><p>Dernier lien capturé, valable une heure après émission et à usage unique.</p><p><a href="${escape(url)}">Ouvrir Mutalia</a></p></body></html>`,
  { mode: 0o600 },
);
fs.chmodSync(target, 0o600);
console.log(`Ouvrir le fichier privé : ${target}`);
