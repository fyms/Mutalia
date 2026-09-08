import { describe, expect, it } from "vitest";
import { scoreCaseSubmission } from "./scoring";
import type { AnswerKey, CaseSubmissionInput, TrainingCase } from "./types";

const trainingCase: TrainingCase = {
  case_id: "CASE-TEST",
  difficulty: "debutant",
  scenario_type: "consultation_specialiste",
  household: {
    household_id: "FOY-TEST",
    members: [
      {
        member_id: "MUT-TEST-A",
        first_name: "Test",
        last_name: "Adherent",
        birth_date: "1980-01-01",
        role: "adherent",
      },
    ],
  },
  target_beneficiary_id: "MUT-TEST-A",
  contract: { provider: "Harmonie Mutuelle", year: 2026, exercise_formula: "PSI 221", status: "actif" },
  documents: [
    { document_id: "D1", case_id: "CASE-TEST", document_type: "decompte_amo", file_name: "d1.pdf", status: "importe", anomalies: [] },
    { document_id: "D2", case_id: "CASE-TEST", document_type: "facture_acquittee", file_name: "d2.pdf", status: "importe", anomalies: [] },
  ],
  objectives: ["Identifier BRSS et remboursement AMO", "Calculer le reste à charge"],
  visible_in_learner_mode: true,
};

const answerKey: AnswerKey = {
  case_id: "CASE-TEST",
  anomalies: [],
  expected_actions: trainingCase.objectives,
  expected_values: { billed: 80, brss: 35, amo: 24.5 },
  scoring: {
    document_reading: 20,
    anomaly_detection: 25,
    procedure: 25,
    calculation_or_analysis: 20,
    explanation: 10,
  },
  trainer_notes: "Utiliser le référentiel 2026.",
};

function baseInput(overrides: Partial<CaseSubmissionInput> = {}): CaseSubmissionInput {
  return {
    caseId: "CASE-TEST",
    completedObjectives: [],
    selectedAnomalies: [],
    values: {},
    explanation: "",
    ...overrides,
  };
}

describe("scoreCaseSubmission", () => {
  it("awards a perfect score for a fully correct submission", () => {
    const result = scoreCaseSubmission(
      trainingCase,
      answerKey,
      baseInput({
        completedObjectives: trainingCase.objectives,
        selectedAnomalies: [],
        values: { billed: "80", brss: "35", amo: "24.5" },
        explanation: "Consultation spécialiste standard, remboursement calculé selon la garantie 2026 du foyer.",
      }),
      2,
    );
    expect(result.score).toBe(result.maxScore);
    expect(result.maxScore).toBe(100);
  });

  it("penalises a wrongly reported anomaly on a clean dossier", () => {
    const result = scoreCaseSubmission(
      trainingCase,
      answerKey,
      baseInput({ selectedAnomalies: ["doublon"] }),
      0,
    );
    const anomalyDim = result.breakdown.find((b) => b.dimension === "anomaly_detection");
    expect(anomalyDim?.points).toBe(0);
  });

  it("never exposes the raw answer key fields outside the correction block", () => {
    const result = scoreCaseSubmission(trainingCase, answerKey, baseInput(), 0);
    expect(result.correction.expectedValues).toEqual(answerKey.expected_values);
    expect(Object.keys(result)).toEqual([
      "caseId",
      "submittedAt",
      "score",
      "maxScore",
      "breakdown",
      "correction",
    ]);
  });

  it("gives partial credit for calculation values within tolerance", () => {
    const result = scoreCaseSubmission(
      trainingCase,
      answerKey,
      baseInput({ values: { billed: "80", brss: "35", amo: "10" } }),
      0,
    );
    const calcDim = result.breakdown.find((b) => b.dimension === "calculation_or_analysis");
    expect(calcDim?.points).toBeCloseTo(13, 0);
  });
});
