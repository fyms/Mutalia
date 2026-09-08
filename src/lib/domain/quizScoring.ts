import type { QuizQuestion } from "@/lib/domain/academyContent";

export interface QuizScoreResult {
  score: number;
  maxScore: number;
  correctQuestionIds: string[];
  incorrectQuestionIds: string[];
}

export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, number>): QuizScoreResult {
  const correctQuestionIds: string[] = [];
  const incorrectQuestionIds: string[] = [];

  for (const question of questions) {
    if (answers[question.id] === question.correctIndex) {
      correctQuestionIds.push(question.id);
    } else {
      incorrectQuestionIds.push(question.id);
    }
  }

  return {
    score: correctQuestionIds.length,
    maxScore: questions.length,
    correctQuestionIds,
    incorrectQuestionIds,
  };
}
