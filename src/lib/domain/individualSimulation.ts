import { individualCatalog2026 } from '@/lib/data/harmonie/individualCatalog';
import { computeReimbursement } from './reimbursement';
export function simulateIndividual(reference: string, id: string, billed: number, consumed: number, eligible: boolean) {
  const guarantee = individualCatalog2026.getCalculableGuarantee(reference, id);
  if (!guarantee) throw new Error('Donnée 2026 à vérifier');
  if (!eligible) throw new Error('Vérifier les conditions et limites de la prestation.');
  if (![billed, consumed].every(Number.isFinite) || billed < 0 || consumed < 0) throw new Error('Montants invalides.');
  // All current documented individual forfaits are outside AMO. One unit per simulation.
  const available = guarantee.unit === 'EUR/an' ? Math.max(0, guarantee.value - consumed) : guarantee.value;
  return computeReimbursement({ billed, brss: 0, amoRate: 0, guaranteeMode: 'forfait_euros', guaranteeValue: available });
}
