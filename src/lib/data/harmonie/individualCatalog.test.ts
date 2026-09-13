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

it('exposes documentary text only with exact provenance and never changes calculation eligibility', async()=>{
 const values=(await import('./individual-consultation-values.json')).default;
 const base=createIndividualCatalog(data);
 for(const row of values){
  const entry=catalog.listForConsultation(row.reference).find(e=>e.id===row.id)!;
  expect(entry).toMatchObject({status:'needs_review',documentValue:row.documentValue,sourceFile:row.sourceFile,sourcePage:row.sourcePage});
  expect(entry).not.toHaveProperty('value');
  expect(catalog.getCalculableGuarantee(row.reference,row.id)).toBeUndefined();
  expect(catalog.listCalculableGuarantees(row.reference).some(e=>e.id===row.id)).toBe(false);
 }
 for(const p of data.products)expect(catalog.listCalculableGuarantees(p.reference)).toEqual(base.listCalculableGuarantees(p.reference));
 const row=values[0];
 for(const change of [{reference:'PLI321'},{reference:'PLI221'},{reference:'PSI999'},{sourceFile:'other.pdf'},{sourcePage:999},{sourceSha256:'0'.repeat(64)}]){
  if(change.reference===row.reference)continue;
  const unsafe=createIndividualCatalog(data,[{...row,...change}]);
  expect(unsafe.listForConsultation(row.reference).find(e=>e.id===row.id)?.documentValue).toBeUndefined();
 }
 const conflict=createIndividualCatalog(data,[row,{...row,documentValue:'999 €/An'}]);
 expect(conflict.listForConsultation(row.reference).find(e=>e.id===row.id)?.documentValue).toBeUndefined();
 expect(base.listForConsultation(row.reference).find(e=>e.id===row.id)?.documentValue).toBeUndefined();
});
