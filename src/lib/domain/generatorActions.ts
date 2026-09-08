"use server";

import { revalidatePath } from "next/cache";
import { generateCase } from "@/lib/domain/caseGenerator";
import { buildExerciseDocumentPdf, saveGeneratedPdf } from "@/lib/domain/pdfGenerator";
import { assertFormateur } from "@/lib/domain/permissions";
import { getSession } from "@/lib/store/session";
import { getGeneratedCases, saveGeneratedCase } from "@/lib/store/runtimeStore";

/** Génération dynamique de cas : réservée au mode Formateur (pilotage). */
export async function generateCaseAction(seed: number): Promise<{ caseId: string }> {
  const session = await getSession();
  assertFormateur(session.role);

  const existingCount = getGeneratedCases().filter((g) => g.seed === seed).length;
  const { trainingCase, answerKey } = generateCase(seed, existingCount + 1);

  for (const document of trainingCase.documents) {
    const beneficiary = trainingCase.household.members.find((m) => m.member_id === document.beneficiary_id);
    const bytes = await buildExerciseDocumentPdf(document, beneficiary);
    await saveGeneratedPdf(trainingCase.case_id, document.file_name, bytes);
  }

  await saveGeneratedCase({
    case: trainingCase,
    answerKey,
    seed,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/cas-pratiques");
  revalidatePath("/pilotage");
  revalidatePath("/cockpit");

  return { caseId: trainingCase.case_id };
}
