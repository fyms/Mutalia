import "server-only";
import { getAllCases, getHarmonieReferential } from "@/lib/data/loaders";
import type { Household, Member, TrainingCase } from "@/lib/domain/types";
import { DATA_TO_VERIFY } from "@/lib/domain/constants";

export interface HouseholdView {
  householdId: string;
  case: TrainingCase;
  household: Household;
  adherent: Member;
  beneficiaries: Member[];
  /**
   * Formule d'exercice affectée pour les besoins de l'exercice pédagogique,
   * choisie parmi le référentiel PSI 2026 vérifié (régime général). Il s'agit
   * d'une affectation fictive de foyer, pas d'une donnée contractuelle vérifiée :
   * les pourcentages de garantie par prestation ne sont pas publiés pour les
   * codes PSI et restent donc affichés comme "Donnée 2026 à vérifier".
   */
  assignedFormula: string;
  starsSoins: number | typeof DATA_TO_VERIFY;
  starsEquipements: number | typeof DATA_TO_VERIFY;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

let cache: HouseholdView[] | null = null;

export function getAllHouseholds(): HouseholdView[] {
  if (cache) return cache;
  const cases = getAllCases();
  const referential = getHarmonieReferential();
  const formulas = referential.canonical_2026_architecture.regime_general;

  cache = cases.map((trainingCase) => {
    const adherent = trainingCase.household.members.find((m) => m.role === "adherent");
    if (!adherent) {
      throw new Error(`Foyer ${trainingCase.household.household_id} sans adhérent principal`);
    }
    const beneficiaries = trainingCase.household.members.filter((m) => m.role !== "adherent");
    const idx = hashString(trainingCase.household.household_id) % formulas.length;
    const formula = formulas[idx];

    return {
      householdId: trainingCase.household.household_id,
      case: trainingCase,
      household: trainingCase.household,
      adherent,
      beneficiaries,
      assignedFormula: formula.formula,
      starsSoins: formula.soins_stars,
      starsEquipements: formula.equipements_stars,
    } satisfies HouseholdView;
  });
  return cache;
}

export function getHouseholdById(householdId: string): HouseholdView | undefined {
  return getAllHouseholds().find((h) => h.householdId === householdId);
}

export function computeAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
