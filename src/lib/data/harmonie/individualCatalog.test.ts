import { describe, expect, it } from 'vitest';
import data from './individualCatalog2026.json';
import { createIndividualCatalog, individualCatalog2026 as catalog } from './individualCatalog';

describe('individual catalogue calculation boundary', () => {
  it('never exposes pending or uninterpreted records as calculable', () => {
    for (const e of data.entries) {
      const result = catalog.getCalculableGuarantee(e.reference, e.id);
      if (e.status === 'verified') {
        expect(result?.verifiedBy).toBe('document_review_2026');
        expect(result?.sourceFile).toBeTruthy();
      } else expect(result).toBeUndefined();
    }
    expect(data.entries.filter(e => e.status === 'verified')).toHaveLength(17);
  });
  it('keeps reference scopes exact and hides missing records and uncertain values', () => {
    for (const p of data.products) {
      for (const e of catalog.listForConsultation(p.reference)) {
        expect(e.reference).toBe(p.reference);
        if (e.status === 'needs_review') {
          expect(e.notice).toBe('Donnée 2026 à vérifier');
          expect(e).not.toHaveProperty('value');
          expect(e).not.toHaveProperty('calculationMode');
        }
      }
    }
    const e = data.entries.find(e => e.status === 'verified')!;
    expect(catalog.getCalculableGuarantee('PLI999', e.id)).toBeUndefined();
    expect(catalog.listCalculableGuarantees('IDCC 405')).toEqual([]);
  });
  it('returns independent records that cannot mutate calculation eligibility', () => {
    const pending = data.entries.find(e => e.status === 'needs_review')!;
    const result = catalog.listForConsultation(pending.reference).find(e => e.id === pending.id)!;
    Object.assign(result, { status: 'verified', value: 999 });
    expect(catalog.getCalculableGuarantee(pending.reference, pending.id)).toBeUndefined();
  });
  it('rejects numeric payloads on pending records and incomplete approvals', () => {
    const copy = structuredClone(data);
    Object.assign(copy.entries.find(e => e.status === 'needs_review')!, { value: 999 });
    expect(() => createIndividualCatalog(copy)).toThrow();
    const invalid = structuredClone(data);
    Object.assign(invalid.entries.find(e => e.status === 'needs_review')!, { status: 'verified' });
    expect(() => createIndividualCatalog(invalid)).toThrow();
  });
});
