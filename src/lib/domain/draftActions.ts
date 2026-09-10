"use server";
import { getSession } from "@/lib/store/session";
import { DraftSchema } from "./drafts";
import { saveDraft, DraftConflictError } from "@/lib/store/drafts";
import { getCaseById } from "@/lib/data/loaders";
import { DOCUMENT_TYPE_LABELS } from "./constants";
export async function saveDraftAction(raw: unknown, revision: number) {
  const s = await getSession();
  const input = DraftSchema.parse(raw);
  const c = getCaseById(input.caseId);
  if (!c || !Number.isInteger(revision) || revision < 0)
    throw new Error("Dossier introuvable");
  for (const [id, q] of Object.entries(input.qualifications)) {
    if (
      !c.documents.some((d) => d.document_id === id) ||
      (q.type && !Object.hasOwn(DOCUMENT_TYPE_LABELS, q.type)) ||
      (q.beneficiary &&
        !c.household.members.some((m) => m.member_id === q.beneficiary))
    )
      throw new Error("Qualification invalide");
  }
  try {
    return { ok: true as const, draft: saveDraft(s.userId, input, revision) };
  } catch (error) {
    // Expected conflicts must survive Next.js production error sanitization.
    if (error instanceof DraftConflictError)
      return { ok: false as const, error: error.message };
    throw error;
  }
}
