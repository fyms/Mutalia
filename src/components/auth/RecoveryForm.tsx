"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
export function RecoveryForm({ token }: { token?: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const f = new FormData(e.currentTarget);
        try {
          if (token) {
            if (f.get("password") !== f.get("confirmPassword")) {
              setMessage("Les mots de passe doivent être identiques.");
              setPending(false);
              return;
            }
            const r = await authClient.resetPassword({
              token,
              newPassword: String(f.get("password")),
            });
            setMessage(
              r.error
                ? "Lien invalide ou expiré. Demandez un nouveau lien."
                : "Mot de passe enregistré. Vous pouvez vous connecter.",
            );
          } else {
            await authClient.requestPasswordReset({
              email: String(f.get("email")),
              redirectTo: "/activation",
            });
            setMessage(
              "Si cette adresse est associée à un compte, un lien de récupération sera envoyé.",
            );
          }
        } catch {
          setMessage("Service indisponible. Réessayez.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block">
        <span className="m-label">
          {token
            ? "Nouveau mot de passe (12 caractères minimum)"
            : "Adresse e-mail"}
        </span>
        <input
          className="m-field"
          name={token ? "password" : "email"}
          type={token ? "password" : "email"}
          autoComplete={token ? "new-password" : "email"}
          minLength={token ? 12 : undefined}
          required
        />
      </label>
      {token && (
        <label className="block">
          <span className="m-label">Confirmer le mot de passe</span>
          <input
            className="m-field"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
      )}
      <button className="m-button" disabled={pending}>
        {pending
          ? "En cours…"
          : token
            ? "Enregistrer le mot de passe"
            : "Recevoir un lien"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
