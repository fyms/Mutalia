import { individualCatalog2026 } from '@/lib/data/harmonie/individualCatalog';
import { computeReimbursement } from './reimbursement';

export const CONDITION_TO_VERIFY = 'Condition ou consommation à vérifier';

/** Free-text conditions are evidence, not executable eligibility checks.
 * Until their requirements are structured, a generic confirmation cannot resolve them.
 * Empty strings explicitly mean no additional requirement; absent fields remain unknown.
 */
export function hasDeterminedApplication(guarantee: {
  condition?: string; limit?: string; unit?: string;
}) {
  return guarantee.condition === '' && guarantee.limit === '' && guarantee.unit === 'EUR';
}

export function simulateIndividual(reference: string, id: string, billed: number, consumed: number | undefined, eligible: boolean) {
  const guarantee = individualCatalog2026.getCalculableGuarantee(reference, id);
  if (!guarantee) throw new Error('Donnée 2026 à vérifier');
  // Current catalogue conditions include frequencies, eligibility, negotiated tariffs
  // and annual limits. Neither `eligible` nor one consumption amount resolves all of them.
  if (!hasDeterminedApplication(guarantee)) throw new Error(CONDITION_TO_VERIFY);
  if (!Number.isFinite(billed) || billed < 0) throw new Error('Montants invalides.');
  // Compatibility arguments intentionally do not grant contractual eligibility.
  void consumed;
  void eligible;
  return computeReimbursement({ billed, brss: 0, amoRate: 0, guaranteeMode: 'forfait_euros', guaranteeValue: guarantee.value });
}
