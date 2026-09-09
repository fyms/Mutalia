"use client";

import { useTransition } from "react";
import { deleteClientAction } from "@/lib/domain/clientActions";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Supprimer définitivement l'adhérent ${clientName} et ses devis ?`)) return;
        startTransition(async () => {
          await deleteClientAction(clientId);
        });
      }}
      className="rounded-md border border-danger/50 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft/70 disabled:opacity-60"
    >
      {isPending ? "Suppression…" : "Supprimer l'adhérent"}
    </button>
  );
}
