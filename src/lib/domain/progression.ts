import "server-only";
import { getAcademyCurriculum, getAllTrainingCases } from "@/lib/data/loaders";
import { getAllQuizAttempts, getAllSubmissions } from "@/lib/store/runtimeStore";
import { getAcademyModuleContent } from "@/lib/domain/academyContent";

export interface CaseProgress {
  caseId: string;
  scenarioType: string;
  difficulty: string;
  attempts: number;
  bestScore: number | null;
  bestMaxScore: number | null;
  lastSubmittedAt: string | null;
}

export interface ProgressionSummary {
  totalCases: number;
  attemptedCases: number;
  completedCases: number;
  averageBestScorePercent: number | null;
  perCase: CaseProgress[];
}

export function getProgressionSummary(): ProgressionSummary {
  const cases = getAllTrainingCases();
  const submissions = getAllSubmissions();

  const perCase: CaseProgress[] = cases.map((c) => {
    const list = submissions[c.case_id] ?? [];
    const best = list.reduce<{ score: number; maxScore: number } | null>((acc, s) => {
      if (!acc || s.score > acc.score) return { score: s.score, maxScore: s.maxScore };
      return acc;
    }, null);
    return {
      caseId: c.case_id,
      scenarioType: c.scenario_type,
      difficulty: c.difficulty,
      attempts: list.length,
      bestScore: best?.score ?? null,
      bestMaxScore: best?.maxScore ?? null,
      lastSubmittedAt: list.length > 0 ? list[list.length - 1].submittedAt : null,
    };
  });

  const attempted = perCase.filter((c) => c.attempts > 0);
  const percentages = attempted
    .filter((c) => c.bestMaxScore && c.bestMaxScore > 0)
    .map((c) => (c.bestScore! / c.bestMaxScore!) * 100);

  return {
    totalCases: cases.length,
    attemptedCases: attempted.length,
    completedCases: attempted.length,
    averageBestScorePercent:
      percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null,
    perCase,
  };
}

export interface AcademyModuleProgress {
  moduleId: string;
  title: string;
  hasQuiz: boolean;
  attempts: number;
  bestScore: number | null;
  bestMaxScore: number | null;
  lastSubmittedAt: string | null;
}

export interface AcademyProgressionSummary {
  totalModules: number;
  attemptedModules: number;
  averageBestScorePercent: number | null;
  perModule: AcademyModuleProgress[];
}

export function getAcademyProgressionSummary(): AcademyProgressionSummary {
  const curriculum = getAcademyCurriculum();
  const attempts = getAllQuizAttempts();

  const perModule: AcademyModuleProgress[] = curriculum.modules.map((m) => {
    const content = getAcademyModuleContent(m.id);
    const list = attempts[m.id] ?? [];
    const best = list.reduce<{ score: number; maxScore: number } | null>((acc, a) => {
      if (!acc || a.score > acc.score) return { score: a.score, maxScore: a.maxScore };
      return acc;
    }, null);
    return {
      moduleId: m.id,
      title: m.title,
      hasQuiz: (content?.quiz.length ?? 0) > 0,
      attempts: list.length,
      bestScore: best?.score ?? null,
      bestMaxScore: best?.maxScore ?? null,
      lastSubmittedAt: list.length > 0 ? list[list.length - 1].submittedAt : null,
    };
  });

  const attempted = perModule.filter((m) => m.attempts > 0);
  const percentages = attempted
    .filter((m) => m.bestMaxScore && m.bestMaxScore > 0)
    .map((m) => (m.bestScore! / m.bestMaxScore!) * 100);

  return {
    totalModules: curriculum.modules.length,
    attemptedModules: attempted.length,
    averageBestScorePercent:
      percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null,
    perModule,
  };
}
