import { describe, it, expect, vi } from 'vitest';
import data from '../data/harmonie/individualCatalog2026.json';
import { simulateIndividual, hasDeterminedApplication, CONDITION_TO_VERIFY } from './individualSimulation';
import { individualCatalog2026 as catalog } from '../data/harmonie/individualCatalog';

describe('individual simulation application guard', () => {
  it('allows an explicitly unconditional simple verified forfait', () => {
    const entry = data.entries.find(e => e.status === 'verified')!;
    const original = catalog.getCalculableGuarantee(entry.reference, entry.id)!;
    const spy = vi.spyOn(catalog, 'getCalculableGuarantee').mockReturnValue({ ...original, condition: '', limit: '', unit: 'EUR', value: 100 });
    try {
      expect(simulateIndividual(entry.reference, entry.id, 140, undefined, false)).toMatchObject({ amcReimbursement: 100, remainingCharge: 40 });
    } finally { spy.mockRestore(); }
  });
  it('blocks all current unresolved contractual conditions despite generic confirmation', () => {
    for (const e of data.entries.filter(e => e.status === 'verified')) {
      for (const consumed of [undefined, 0, 100]) {
        expect(() => simulateIndividual(e.reference, e.id, 440, consumed, true)).toThrow(CONDITION_TO_VERIFY);
      }
    }
    expect(hasDeterminedApplication({})).toBe(false);
    expect(hasDeterminedApplication({ condition: '', limit: '', unit: 'EUR/an' })).toBe(false);
    expect(hasDeterminedApplication({ condition: 'Droits à contrôler', limit: '', unit: 'EUR' })).toBe(false);
    expect(hasDeterminedApplication({ condition: '', limit: '3 implants/an', unit: 'EUR' })).toBe(false);
  });
  it('blocks pending, missing and cross-reference guarantees and hides missing entries', () => {
    for (const status of ['needs_review', 'not_extracted']) {
      const e = data.entries.find(e => e.status === status)!;
      expect(() => simulateIndividual(e.reference, e.id, 440, undefined, true)).toThrow('Donnée 2026 à vérifier');
    }
    const e = data.entries.find(e => e.status === 'verified')!;
    expect(() => simulateIndividual('PLI999', e.id, 440, 0, true)).toThrow();
    expect(catalog.listForConsultation(e.reference).some(x => String(x.status) === 'not_extracted')).toBe(false);
  });
});
