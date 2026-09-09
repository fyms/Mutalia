import "server-only";
import { getAllTrainingCases } from "@/lib/data/loaders";
import { getAllSubmissions, getProfile } from "@/lib/store/runtimeStore";
import { VALUE_FIELD_LABELS } from "@/lib/domain/constants";

export interface PrestationRecord {
  caseId: string;
  scenarioType: string;
  householdId: string;
  adherentName: string;
  profileName: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  /** Montant retenu par l'apprenant, dérivé de sa propre saisie — jamais du corrigé. */
  retainedAmount: number | null;
  status: "liquidee" | "a_verifier";
}

/**
 * Vue "Prestations" du portefeuille : dérivée exclusivement des soumissions des
 * apprenants sur les cas pratiques (jamais du corrigé), pour ne pas exposer la
 * réponse attendue d'un exercice via l'historique du foyer. Tous profils confondus
 * (vue opérationnelle du foyer, comme un back-office réel où plusieurs gestionnaires
 * peuvent traiter le même dossier).
 */
export function getPrestations(): PrestationRecord[] {
  const cases = getAllTrainingCases();
  const submissionsByProfile = getAllSubmissions();
  const records: PrestationRecord[] = [];

  for (const trainingCase of cases) {
    const adherent = trainingCase.household.members.find((m) => m.role === "adherent");
    for (const [profileId, byCase] of Object.entries(submissionsByProfile)) {
      const list = byCase[trainingCase.case_id] ?? [];
      if (list.length === 0) continue;
      const profileName = getProfile(profileId).name;
      for (const submission of list) {
        const amountKey = Object.keys(submission.submittedValues).find(
          (k) => VALUE_FIELD_LABELS[k]?.type === "currency",
        );
        const rawAmount = amountKey ? Number(submission.submittedValues[amountKey]?.replace(",", ".")) : NaN;
        records.push({
          caseId: trainingCase.case_id,
          scenarioType: trainingCase.scenario_type,
          householdId: trainingCase.household.household_id,
          adherentName: adherent ? `${adherent.first_name} ${adherent.last_name}` : "—",
          profileName,
          submittedAt: submission.submittedAt,
          score: submission.score,
          maxScore: submission.maxScore,
          retainedAmount: Number.isFinite(rawAmount) ? rawAmount : null,
          status: submission.score / submission.maxScore >= 0.6 ? "liquidee" : "a_verifier",
        });
      }
    }
  }

  return records.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function getPrestationsForHousehold(householdId: string): PrestationRecord[] {
  return getPrestations().filter((p) => p.householdId === householdId);
}
