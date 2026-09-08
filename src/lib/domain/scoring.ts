import type { AnswerKey, CaseSubmissionInput, CaseSubmissionResult, TrainingCase } from "@/lib/domain/types";
import { ANOMALY_LABELS, type AnomalyCode } from "@/lib/domain/constants";

const DIMENSION_LABELS: Record<string, string> = {
  document_reading: "Lecture documentaire",
  anomaly_detection: "Détection d'anomalies",
  procedure: "Procédure",
  calculation_or_analysis: "Calcul / analyse",
  explanation: "Explication",
};

function round(value: number): number {
  return Math.round(value);
}

function scoreDocumentReading(weight: number, totalDocuments: number, viewedCount: number) {
  if (totalDocuments === 0) {
    return { points: weight, comment: "Aucun document associé à ce dossier." };
  }
  const fraction = Math.min(1, viewedCount / totalDocuments);
  const points = round(weight * fraction);
  const comment =
    fraction >= 1
      ? "Toutes les pièces du dossier ont été consultées."
      : `${viewedCount}/${totalDocuments} pièce(s) consultée(s) avant soumission.`;
  return { points, comment };
}

function scoreAnomalyDetection(weight: number, actual: string[], selected: string[]) {
  const actualSet = new Set<string>(actual.length === 0 ? ["aucune"] : actual);
  const selectedSet = new Set<string>(selected.length === 0 ? ["aucune"] : selected);
  const correct = [...selectedSet].filter((a) => actualSet.has(a)).length;
  const recall = correct / actualSet.size;
  const precision = selectedSet.size > 0 ? correct / selectedSet.size : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const points = round(weight * f1);
  const comment =
    f1 >= 1
      ? "Anomalies correctement identifiées."
      : "Écart entre les anomalies sélectionnées et le dossier.";
  return { points, comment };
}

function scoreProcedure(weight: number, objectives: string[], completed: string[]) {
  if (objectives.length === 0) {
    return { points: weight, comment: "Aucune étape de procédure définie pour ce dossier." };
  }
  const completedSet = new Set(completed);
  const done = objectives.filter((o) => completedSet.has(o)).length;
  const fraction = done / objectives.length;
  const points = round(weight * fraction);
  const comment = `${done}/${objectives.length} étape(s) de la procédure confirmée(s).`;
  return { points, comment };
}

function isDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function scoreCalculation(
  weight: number,
  expectedValues: Record<string, string | number>,
  submittedValues: Record<string, string>,
) {
  const keys = Object.keys(expectedValues);
  if (keys.length === 0) {
    return { points: weight, comment: "Aucun calcul chiffré requis pour ce dossier." };
  }
  let correct = 0;
  for (const key of keys) {
    const expected = expectedValues[key];
    const submitted = submittedValues[key];
    if (submitted === undefined || submitted === "") continue;
    if (typeof expected === "number") {
      const parsed = Number(submitted.replace(",", "."));
      if (!Number.isNaN(parsed)) {
        const tolerance = Math.max(0.5, Math.abs(expected) * 0.01);
        if (Math.abs(parsed - expected) <= tolerance) correct++;
      }
    } else if (isDateLike(String(expected))) {
      if (submitted === expected) correct++;
    } else if (submitted.trim().toLowerCase() === String(expected).trim().toLowerCase()) {
      correct++;
    }
  }
  const fraction = correct / keys.length;
  const points = round(weight * fraction);
  const comment = `${correct}/${keys.length} valeur(s) attendue(s) correctement renseignée(s).`;
  return { points, comment };
}

function scoreExplanation(weight: number, explanation: string) {
  const trimmed = explanation.trim();
  const fraction = Math.min(1, trimmed.length / 40);
  const points = round(weight * fraction);
  const comment =
    trimmed.length === 0
      ? "Aucune justification renseignée."
      : "Justification renseignée (note indicative en mode prototype, à valider par un formateur).";
  return { points, comment };
}

export function scoreCaseSubmission(
  trainingCase: TrainingCase,
  answerKey: AnswerKey,
  input: CaseSubmissionInput,
  viewedDocumentCount: number,
): CaseSubmissionResult {
  const breakdown: CaseSubmissionResult["breakdown"] = [];
  let score = 0;
  let maxScore = 0;

  for (const [dimension, rawWeight] of Object.entries(answerKey.scoring)) {
    const weight = Number(rawWeight);
    maxScore += weight;
    let result: { points: number; comment: string };
    switch (dimension) {
      case "document_reading":
        result = scoreDocumentReading(weight, trainingCase.documents.length, viewedDocumentCount);
        break;
      case "anomaly_detection":
        result = scoreAnomalyDetection(weight, answerKey.anomalies, input.selectedAnomalies);
        break;
      case "procedure":
        result = scoreProcedure(weight, trainingCase.objectives, input.completedObjectives);
        break;
      case "calculation_or_analysis":
        result = scoreCalculation(weight, answerKey.expected_values, input.values);
        break;
      case "explanation":
        result = scoreExplanation(weight, input.explanation);
        break;
      default:
        result = { points: 0, comment: "Dimension non reconnue." };
    }
    score += result.points;
    breakdown.push({
      dimension,
      label: DIMENSION_LABELS[dimension] ?? dimension,
      points: result.points,
      maxPoints: weight,
      comment: result.comment,
    });
  }

  return {
    caseId: trainingCase.case_id,
    submittedAt: new Date().toISOString(),
    score,
    maxScore,
    breakdown,
    correction: {
      anomalies: answerKey.anomalies,
      expectedActions: answerKey.expected_actions,
      expectedValues: answerKey.expected_values,
      trainerNotes: answerKey.trainer_notes,
    },
    submittedValues: input.values,
  };
}

export function anomalyLabel(code: string): string {
  return ANOMALY_LABELS[code as AnomalyCode] ?? code;
}
