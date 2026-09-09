import "server-only";
import { getAcademyCurriculum, getAllTrainingCases } from "@/lib/data/loaders";
import {
  getAllQuizAttempts,
  getAllSubmissions,
  getProfiles,
  getQuizAttemptsForProfile,
  getSubmissionsForProfile,
  type LearnerProfile,
  type QuizAttempt,
} from "@/lib/store/runtimeStore";
import { getAcademyModuleContent } from "@/lib/domain/academyContent";
import type { CaseSubmissionResult } from "@/lib/domain/types";

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

function summariseCaseProgress(submissionsByCase: Record<string, CaseSubmissionResult[]>): ProgressionSummary {
  const cases = getAllTrainingCases();

  const perCase: CaseProgress[] = cases.map((c) => {
    const list = submissionsByCase[c.case_id] ?? [];
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

/** Progression du profil apprenant courant (par défaut) sur les cas pratiques. */
export function getProgressionSummary(profileId: string): ProgressionSummary {
  return summariseCaseProgress(getSubmissionsForProfile(profileId));
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

function summariseAcademyProgress(
  attemptsByModule: Record<string, QuizAttempt[]>,
): AcademyProgressionSummary {
  const curriculum = getAcademyCurriculum();

  const perModule: AcademyModuleProgress[] = curriculum.modules.map((m) => {
    const content = getAcademyModuleContent(m.id);
    const list = attemptsByModule[m.id] ?? [];
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

/** Progression Academy du profil apprenant courant. */
export function getAcademyProgressionSummary(profileId: string): AcademyProgressionSummary {
  return summariseAcademyProgress(getQuizAttemptsForProfile(profileId));
}

export interface ProfileProgressionRow {
  profile: LearnerProfile;
  cases: ProgressionSummary;
  academy: AcademyProgressionSummary;
}

/**
 * Pilotage multi-apprenants : progression cas + Academy pour chaque profil connu.
 * Réservé aux vues formateur — jamais utilisé pour filtrer ce qu'un apprenant voit
 * de son propre parcours (cela reste `getProgressionSummary(profileId)`).
 */
export function getAllProfilesProgression(): ProfileProgressionRow[] {
  const profiles = getProfiles();
  const allSubmissions = getAllSubmissions();
  const allQuizAttempts = getAllQuizAttempts();

  return profiles.map((profile) => ({
    profile,
    cases: summariseCaseProgress(allSubmissions[profile.id] ?? {}),
    academy: summariseAcademyProgress(allQuizAttempts[profile.id] ?? {}),
  }));
}
