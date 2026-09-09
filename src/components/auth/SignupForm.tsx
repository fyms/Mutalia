"use client";

import { useActionState } from "react";
import { signupAction, type AuthFormState } from "@/lib/auth/actions";
import { ROLE_LABELS, ROLES } from "@/lib/domain/constants";

const INITIAL_STATE: AuthFormState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="displayName" className="mb-1 block text-xs font-medium text-foreground-muted">
          Nom affiché
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
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
          Mot de passe (8 caractères minimum)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1 block text-xs font-medium text-foreground-muted">
          Rôle
        </label>
        <select
          id="role"
          name="role"
          defaultValue="apprenant"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-foreground-muted">
          Prototype de démonstration : le rôle Formateur est auto-attribuable ici (pas de validation
          hiérarchique en environnement réel).
        </p>
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
