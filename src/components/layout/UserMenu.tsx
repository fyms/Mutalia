"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/auth/actions";

export function UserMenu({ displayName, email }: { displayName: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-foreground-muted" title={email}>
        👤 {displayName}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => logoutAction())}
        className="rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground-muted hover:bg-surface-muted disabled:opacity-60"
      >
        Déconnexion
      </button>
    </div>
  );
}
