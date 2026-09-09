"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/lib/auth/actions";

const INITIAL_STATE: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-foreground-muted">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
