import "server-only";
import { db } from "@/lib/db";
import type { DraftInput, SavedDraft } from "@/lib/domain/drafts";
export class DraftConflictError extends Error {}
export function getDraft(owner: string, caseId: string): SavedDraft | null {
  const row = db
    .prepare(
      "SELECT revision,payload,updated_at FROM case_draft WHERE owner=? AND case_id=?",
    )
    .get(owner, caseId) as
    { revision: number; payload: string; updated_at: string } | undefined;
  return row
    ? {
        revision: row.revision,
        input: JSON.parse(row.payload),
        updatedAt: row.updated_at,
      }
    : null;
}
export function saveDraft(
  owner: string,
  input: DraftInput,
  revision: number,
): SavedDraft {
  return db.transaction(() => {
    const current = getDraft(owner, input.caseId);
    if ((current?.revision ?? 0) !== revision)
      throw new DraftConflictError(
        "Conflit : un autre onglet a enregistré ce dossier. Votre saisie est conservée ; rechargez la version enregistrée avant de reprendre.",
      );
    const updatedAt = new Date().toISOString();
    const next = revision + 1;
    db.prepare(
      "INSERT INTO case_draft(owner,case_id,revision,payload,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,case_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at",
    ).run(owner, input.caseId, next, JSON.stringify(input), updatedAt);
    return { revision: next, input, updatedAt };
  })();
}
