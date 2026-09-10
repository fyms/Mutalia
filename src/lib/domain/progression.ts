import "server-only";
import { getAllCases } from "@/lib/data/loaders";
import { getAllSubmissions } from "@/lib/store/runtimeStore";

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

export function getProgressionSummary(owner: string): ProgressionSummary {
  const cases = getAllCases();
  const submissions = getAllSubmissions(owner);

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
