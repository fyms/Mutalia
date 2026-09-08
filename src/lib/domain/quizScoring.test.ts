import { describe, expect, it } from "vitest";
import { scoreQuiz } from "./quizScoring";
import type { QuizQuestion } from "./academyContent";

const questions: QuizQuestion[] = [
  { id: "Q1", question: "?", options: ["a", "b"], correctIndex: 0, explanation: "" },
  { id: "Q2", question: "?", options: ["a", "b"], correctIndex: 1, explanation: "" },
];

describe("scoreQuiz", () => {
  it("scores every correct answer", () => {
    const result = scoreQuiz(questions, { Q1: 0, Q2: 1 });
    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(2);
    expect(result.incorrectQuestionIds).toEqual([]);
  });

  it("scores a partial submission", () => {
    const result = scoreQuiz(questions, { Q1: 0, Q2: 0 });
    expect(result.score).toBe(1);
    expect(result.correctQuestionIds).toEqual(["Q1"]);
    expect(result.incorrectQuestionIds).toEqual(["Q2"]);
  });

  it("treats a missing answer as incorrect rather than throwing", () => {
    const result = scoreQuiz(questions, { Q1: 0 });
    expect(result.score).toBe(1);
    expect(result.incorrectQuestionIds).toEqual(["Q2"]);
  });
});
