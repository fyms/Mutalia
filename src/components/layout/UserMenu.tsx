"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { useState } from "react";
export function UserMenu({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [error, setError] = useState("");
  return (
    <div>
      <Link className="underline" href="/mon-compte" title={email}>
        {displayName} · Mon compte
      </Link>
      <button
        className="m-button m-button--tertiary"
        onClick={async () => {
          try {
            const r = await authClient.signOut();
            if (r.error) throw Error();
            window.location.replace("/login");
          } catch {
            setError("Déconnexion impossible. Réessayez.");
          }
        }}
      >
        Se déconnecter
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
