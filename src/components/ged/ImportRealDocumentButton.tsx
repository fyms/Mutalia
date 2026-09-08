"use client";

import { useState } from "react";

const WARNING =
  "Avant d'importer un document réel : anonymisez toute donnée personnelle, bancaire ou de santé non nécessaire à l'exercice. Aucun numéro de sécurité sociale ni IBAN valide ne doit être utilisé. Confirmez-vous vouloir continuer ?";

export function ImportRealDocumentButton() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => {
          const confirmed = window.confirm(WARNING);
          setMessage(
            confirmed
              ? "Import non disponible dans ce prototype P0 : aucun stockage de document réel n'est prévu. Utilisez les documents fictifs fournis."
              : "Import annulé.",
          );
        }}
        className="rounded-md border border-warning/50 bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning-soft/70"
      >
        Importer un document réel…
      </button>
      {message ? <p className="max-w-xs text-right text-[11px] text-foreground-muted">{message}</p> : null}
    </div>
  );
}
