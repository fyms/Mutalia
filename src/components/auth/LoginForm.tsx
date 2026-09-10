"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
export function LoginForm() {
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      aria-busy={pending}
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const r = await authClient.signIn.email({
            email: String(f.get("email")),
            password: String(f.get("password")),
          });
          if (r.error) {
            setError(
              "Connexion impossible. Vérifiez vos identifiants et l’activation du compte, puis réessayez.",
            );
          } else {
            // Discard all client state when changing authenticated identity.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign("/cockpit");
          }
        } catch {
          setError(
            "Service indisponible. Réessayez sans effacer votre saisie.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block">
        <span className="m-label">Adresse e-mail</span>
        <input
          className="m-field"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="m-label">Mot de passe</span>
        <input
          className="m-field"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="button"
        className="m-button m-button--tertiary"
        onClick={() => setShow(!show)}
        aria-pressed={show}
      >
        {show ? "Masquer" : "Afficher"} le mot de passe
      </button>
      {error && (
        <p role="alert" className="m-error">
          {error}
        </p>
      )}
      <button className="m-button w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
