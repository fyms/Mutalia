"use server";

import { revalidatePath } from "next/cache";
import { getAnswerKey, getCaseById } from "@/lib/data/loaders";
import { scoreCaseSubmission } from "@/lib/domain/scoring";
import { assertFormateur } from "@/lib/domain/permissions";
import { getSession } from "@/lib/store/session";
import { getViewedDocumentIds, recordSubmission } from "@/lib/store/runtimeStore";
import type { AnswerKey, CaseSubmissionInput, LearnerFeedback } from "@/lib/domain/types";

export async function submitCaseAction(input: CaseSubmissionInput): Promise<LearnerFeedback> {
  const trainingCase = getCaseById(input.caseId);
  if (!trainingCase) throw new Error("Cas introuvable.");
  const answerKey = getAnswerKey(input.caseId);
  if (!answerKey) throw new Error("Corrigé introuvable pour ce cas.");

  const viewedIds = getViewedDocumentIds(trainingCase.documents.map((d) => d.document_id));
  const result = scoreCaseSubmission(trainingCase, answerKey, input, viewedIds.size);
  await recordSubmission(input.caseId, result);
  revalidatePath(`/cas-pratiques/${input.caseId}`);
  revalidatePath("/progression");
  revalidatePath("/cockpit");

  // Le corrigé brut (`correction`) n'est jamais renvoyé au client en mode apprenant :
  // seuls le score et les commentaires dérivés par dimension le sont.
  return {
    caseId: result.caseId,
    submittedAt: result.submittedAt,
    score: result.score,
    maxScore: result.maxScore,
    breakdown: result.breakdown,
  };
}

/** Réservé au mode formateur : ne jamais appeler depuis un composant accessible en mode apprenant. */
export async function getAnswerKeyForFormateurAction(caseId: string): Promise<AnswerKey> {
  const session = await getSession();
  assertFormateur(session.role);
  const answerKey = getAnswerKey(caseId);
  if (!answerKey) throw new Error("Corrigé introuvable pour ce cas.");
  return answerKey;
}
