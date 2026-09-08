"use server";

import { revalidatePath } from "next/cache";
import { getAcademyModuleContent } from "@/lib/domain/academyContent";
import { scoreQuiz, type QuizScoreResult } from "@/lib/domain/quizScoring";
import { recordQuizAttempt } from "@/lib/store/runtimeStore";

export type QuizSubmissionResult = QuizScoreResult;

export async function submitAcademyQuizAction(
  moduleId: string,
  answers: Record<string, number>,
): Promise<QuizSubmissionResult> {
  const content = getAcademyModuleContent(moduleId);
  if (!content || content.quiz.length === 0) {
    throw new Error("Quiz introuvable pour ce module.");
  }

  const result = scoreQuiz(content.quiz, answers);

  await recordQuizAttempt(moduleId, {
    score: result.score,
    maxScore: result.maxScore,
    submittedAt: new Date().toISOString(),
  });

  revalidatePath(`/academy/${moduleId}`);
  revalidatePath("/academy");
  revalidatePath("/quiz");
  revalidatePath("/progression");
  revalidatePath("/cockpit");

  return result;
}
