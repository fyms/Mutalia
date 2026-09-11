import { describe, it, expect } from 'vitest';
import data from '../data/harmonie/individualCatalog2026.json';
import { simulateIndividual } from './individualSimulation';
import { individualCatalog2026 } from '../data/harmonie/individualCatalog';
describe('individual simulation',()=>{
 it('calculates documented forfaits with annual consumption',()=>{
 const e=data.entries.find(e=>e.status==='verified'&&e.unit==='EUR/an')!;
 expect(simulateIndividual(e.reference,e.id,440,0,true).amcReimbursement).toBe(e.value);
 expect(simulateIndividual(e.reference,e.id,440,e.value!,true).amcReimbursement).toBe(0);
 });
 it('blocks pending, missing and cross-reference guarantees',()=>{
 for(const status of ['needs_review','not_extracted']){const e=data.entries.find(e=>e.status===status)!;expect(()=>simulateIndividual(e.reference,e.id,440,0,true)).toThrow('Donnée 2026 à vérifier');}
 const e=data.entries.find(e=>e.status==='verified')!;expect(()=>simulateIndividual('PLI999',e.id,440,0,true)).toThrow();
 expect(individualCatalog2026.listForConsultation(e.reference).some(x=>String(x.status)==='not_extracted')).toBe(false);
 expect(()=>simulateIndividual(e.reference,e.id,440,0,false)).toThrow();
 });
});
