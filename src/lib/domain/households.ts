import { pedagogicalFormula } from "./pedagogicalHouseholdRecord";
import type { HouseholdLifecycle } from "./householdLifecycle";
import { getManualHouseholds, getHouseholdLifecycles, getPedagogicalOverlays } from "@/lib/store/runtimeStore";
import { getHouseholdFormulas } from "./householdFormulas";
import type { ManualHousehold } from "./manualHouseholds";
import "server-only";
import { getAllCases } from "@/lib/data/loaders";
import type { Household, Member, TrainingCase } from "@/lib/domain/types";
import { DATA_TO_VERIFY } from "@/lib/domain/constants";

export interface PedagogicalHouseholdView {
  householdId: string;
  simulation?: ManualHousehold;
  simulationHistory?: {at:string;event:string}[];
  simulationRevision?: number;
  lifecycle?: HouseholdLifecycle;
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

export type HouseholdView = PedagogicalHouseholdView | (Omit<PedagogicalHouseholdView, "case"> & {case: null; manual: ManualHousehold});

let cache: PedagogicalHouseholdView[] | null = null;

function getPedagogicalHouseholds(): PedagogicalHouseholdView[] {
  if (cache) return cache;
  const cases = getAllCases();

  cache = cases.map((trainingCase) => {
    const adherent = trainingCase.household.members.find((m) => m.role === "adherent");
    if (!adherent) {
      throw new Error(`Foyer ${trainingCase.household.household_id} sans adhérent principal`);
    }
    const beneficiaries = trainingCase.household.members.filter((m) => m.role !== "adherent");
    const formula = pedagogicalFormula(trainingCase.household.household_id);

    return {
      householdId: trainingCase.household.household_id,
      case: trainingCase,
      household: trainingCase.household,
      adherent,
      beneficiaries,
      assignedFormula: formula.formula,
      starsSoins: formula.soins_stars,
      starsEquipements: formula.equipements_stars,
    } satisfies PedagogicalHouseholdView;
  });
  return cache;
}

export function getAllHouseholds(owner?: string): HouseholdView[] {
  const seeds = getPedagogicalHouseholds();
  if (!owner) return seeds;
  const formulas = getHouseholdFormulas();
  const manual: HouseholdView[] = getManualHouseholds(owner).map(record => {
    const adherent: Member = {
      member_id: record.memberId, household_id: record.id, role: "adherent",
      first_name: record.firstName, last_name: record.lastName, birth_date: record.birthDate,
    };
    const beneficiaries: Member[] = (record.beneficiaries ?? []).map(b => ({
      member_id: b.id, household_id: record.id, role: b.role,
      first_name: b.firstName, last_name: b.lastName, birth_date: b.birthDate,
    }));
    return {
      householdId: record.id, case: null, manual: record, adherent, beneficiaries,
      household: {household_id: record.id, members: [adherent, ...beneficiaries]},
      assignedFormula: formulas.find(f => f.key === record.formulaKey)?.formula ?? DATA_TO_VERIFY,
      starsSoins: DATA_TO_VERIFY, starsEquipements: DATA_TO_VERIFY,
    };
  });
  const overlays = getPedagogicalOverlays(owner);
  const simulated = seeds.map(h => {
    const record = overlays.records[h.householdId];
    const metadata = {simulationHistory:overlays.history[h.householdId],simulationRevision:overlays.revisions[h.householdId] ?? 0};
    if (!record) return {...h,...metadata};
    const members:Member[] = [{...h.adherent,first_name:record.firstName,last_name:record.lastName,birth_date:record.birthDate},
      ...(record.beneficiaries ?? []).map(b=>({member_id:b.id,household_id:h.householdId,role:b.role,first_name:b.firstName,last_name:b.lastName,birth_date:b.birthDate}))];
    return {...h,...metadata,simulation:record,household:{...h.household,members},adherent:members[0],beneficiaries:members.slice(1),
      assignedFormula:formulas.find(f=>f.key===record.formulaKey)?.formula ?? DATA_TO_VERIFY,starsSoins:DATA_TO_VERIFY,starsEquipements:DATA_TO_VERIFY};
  });
  const lifecycles = getHouseholdLifecycles(owner);
  return [...simulated, ...manual].map(h => lifecycles[h.householdId] ? {...h,lifecycle:lifecycles[h.householdId]} : h);
}

export function getHouseholdById(householdId: string, owner?: string): HouseholdView | undefined {
  return getAllHouseholds(owner).find((h) => h.householdId === householdId);
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
