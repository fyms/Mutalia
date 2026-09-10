"use server";

import { revalidatePath } from "next/cache";
import { getAnswerKey, getCaseById } from "@/lib/data/loaders";
import { scoreCaseSubmission } from "@/lib/domain/scoring";
import { assertFormateur } from "@/lib/domain/permissions";
import { getSession } from "@/lib/store/session";
import {
  getViewedDocumentIds,
  recordSubmissionOnce,
} from "@/lib/store/runtimeStore";
import { DraftSchema } from "./drafts";
import { getDraft } from "@/lib/store/drafts";
import type {
  AnswerKey,
  CaseSubmissionInput,
  LearnerFeedback,
} from "@/lib/domain/types";

export async function submitCaseAction(
  input: CaseSubmissionInput & { revision: number },
): Promise<LearnerFeedback> {
  const ownerId = (await getSession()).userId;

  DraftSchema.parse(input);
  const draft = getDraft(ownerId, input.caseId);
  if (!draft || draft.revision !== input.revision)
    throw new Error("Enregistrez le brouillon avant soumission.");
  input = { ...draft.input, revision: draft.revision };
  if (input.explanation.trim().length < 10)
    throw new Error("Justification requise (10 caractères minimum).");
  const trainingCase = getCaseById(input.caseId);
  if (!trainingCase) throw new Error("Cas introuvable.");
  const answerKey = getAnswerKey(input.caseId);
  if (!answerKey) throw new Error("Corrigé introuvable pour ce cas.");

  const session = await getSession();
  const viewedIds = getViewedDocumentIds(
    ownerId,
    trainingCase.documents.map((d) => d.document_id),
  );
  const result = recordSubmissionOnce(
    session.profileId,
    input.revision,
    scoreCaseSubmission(trainingCase, answerKey, input, viewedIds.size),
  );
  revalidatePath(`/cas-pratiques/${input.caseId}`);
  revalidatePath("/progression");
  revalidatePath("/cockpit");

  // Le corrigé brut (`correction`) n'est jamais renvoyé au client en mode apprenant :
  // seuls le score, les commentaires dérivés par dimension et la propre saisie de
  // l'apprenant (déjà connue de lui) le sont.
  return {
    caseId: result.caseId,
    submittedAt: result.submittedAt,
    score: result.score,
    maxScore: result.maxScore,
    breakdown: result.breakdown,
  };
}

/** Réservé au mode formateur : ne jamais appeler depuis un composant accessible en mode apprenant. */
export async function getAnswerKeyForFormateurAction(
  caseId: string,
): Promise<AnswerKey> {
  const session = await getSession();
  assertFormateur(session.accountRole);
  const answerKey = getAnswerKey(caseId);
  if (!answerKey) throw new Error("Corrigé introuvable pour ce cas.");
  return answerKey;
}
