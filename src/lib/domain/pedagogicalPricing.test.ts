import { expect, it } from "vitest";
import { createPedagogicalGrid, estimatePedagogicalPricing, PRICING_NOTICE, type PricingMember } from "./pedagogicalPricing";
import { emptyLifecycle } from "./householdLifecycle";
const all=createPedagogicalGrid();
const grid=["PSI111","PSI121","PLI211"].map(r=>all.find(c=>c.formulaKey===r)!);
const member=(id:string,role:PricingMember["role"],birthDate="2006-01-01"):PricingMember=>({id,role,birthDate,name:id});
const holder=member("titulaire","adherent");const spouse=member("conjoint","conjoint","1980-01-01");const child=member("enfant","enfant","2015-01-01");
const estimate=(members:PricingMember[])=>estimatePedagogicalPricing(grid[0],{date:"2026-09-11",members});
it("calculates a single member and annual total with explicit source",()=>{
 expect(estimate([holder])).toMatchObject({monthly:48,annual:576,pricingSource:"pedagogical_estimator",notice:PRICING_NOTICE});
});
it("uses spouse own age",()=>{
 const r=estimate([holder,spouse]);expect(r.lines[1]).toMatchObject({age:46,monthly:64.8});expect(r.monthly).toBe(112.8);
});
it("prices children below adults and totals a couple with several children",()=>{
 expect(estimate([holder,child]).monthly).toBe(64.8);
 const r=estimate([holder,spouse,child,{...child,id:"second"}]);expect(r.monthly).toBe(146.4);expect(r.annual).toBe(1756.8);
});
it("excludes inactive and deceased members at the calculation date, preserving historical eligibility",()=>{
 const lifecycle=emptyLifecycle();
 lifecycle.beneficiaries.enfant={status:"inactive",endDate:"2026-09-01",endReason:"detached",history:[]};
 lifecycle.beneficiaries.conjoint={status:"deceased",endDate:"2026-09-01",endReason:"deceased",history:[]};
 expect(estimatePedagogicalPricing(grid[0],{date:"2026-09-11",members:[holder,spouse,child],lifecycle}).lines).toHaveLength(1);
 expect(estimatePedagogicalPricing(grid[0],{date:"2026-08-31",members:[holder,spouse,child],lifecycle}).lines).toHaveLength(3);
});
it("changes by age/formula, uses canonical order rather than code digits, and is deterministic",()=>{
 expect(grid[1].baseMonthlyRate).toBeGreaterThan(grid[0].baseMonthlyRate);
 expect(estimate([{...holder,birthDate:"1950-01-01"}]).monthly).toBeGreaterThan(estimate([holder]).monthly);
 expect(estimatePedagogicalPricing(grid[1],{date:"2026-09-11",members:[holder]}).monthly).toBe(54);
 expect(estimate([holder,spouse,child])).toEqual(estimate([holder,spouse,child]));
 expect(grid[2].regimeCoefficient).toBe(0.9);
});
it("does not mutate input, rounds each person, and blocks closed memberships",()=>{
 const input={date:"2026-09-11",members:[holder,spouse,child]};const before=structuredClone(input);
 const r=estimatePedagogicalPricing(grid[2],input);expect(input).toEqual(before);
 expect(r.annual).toBe(Math.round(r.monthly*1200)/100);
 const lifecycle=emptyLifecycle();lifecycle.adherent={status:"terminated",endDate:"2026-01-01",endReason:"termination",history:[]};
 expect(()=>estimatePedagogicalPricing(grid[0],{...input,lifecycle})).toThrow("inactive");
 expect(()=>estimatePedagogicalPricing(grid[0],{...input,date:"2027-01-01"})).toThrow("période");
});

it('covers every canonical product exactly once with frozen versioned positions and untouched guarantees',async()=>{
 const {individualCatalog2026:catalog}=await import('@/lib/data/harmonie/individualCatalog');
 const products=catalog.listProducts(),before=products.map(p=>catalog.listForConsultation(p.reference));
 const configs=createPedagogicalGrid();expect(configs).toHaveLength(42);expect(configs).toHaveLength(products.length);expect(new Set(configs.map(c=>c.formulaKey)).size).toBe(products.length);
 for(const product of products){const matches=configs.filter(c=>c.formulaKey===product.reference);expect(matches).toHaveLength(1);expect(matches[0]).toMatchObject({version:'pedagogical-2026-v2',source:'pedagogical_estimator',regimeCoefficient:product.regime==='Régime local'?0.9:1});
 if(product.regime==='Régime local')expect(product.reference).toMatch(/^PLI/);if(product.regime==='Régime général')expect(product.reference).toMatch(/^PSI/);}
 const reordered=createPedagogicalGrid([...products].reverse());for(const c of configs)expect(reordered.find(r=>r.formulaKey===c.formulaKey)).toEqual(c);
 expect(()=>createPedagogicalGrid([...products,products[0]])).toThrow('dupliquées');
 expect(products.map(p=>catalog.listForConsultation(p.reference))).toEqual(before);
 expect(products.flatMap(p=>catalog.listCalculableGuarantees(p.reference))).toHaveLength(17);
 for(const g of before.flat())if(g.status==='needs_review')expect(catalog.getCalculableGuarantee(g.reference,g.id)).toBeUndefined();
});
it('resolves historical pricing keys only within the documented family and rejects ambiguity',async()=>{
 const {resolveCanonicalPricingReference:resolve,getCanonicalPricingConfig:get}=await import('./pedagogicalPricing');
 const {individualCatalog2026:catalog}=await import('@/lib/data/harmonie/individualCatalog');const products=catalog.listProducts();
 for(const r of ['PSI111','PLI211','PLI411'])expect(get(r).formulaKey).toBe(r);
 expect(resolve('regime_local:PSI 211')).toBe('PLI211');expect(resolve('regime_general:PSI 211')).toBe('PSI211');
 expect(get('regime_local:PSI 211')).toEqual(get('PLI211'));
 expect(()=>resolve('regime_general:PLI211')).toThrow('Aucune correspondance');
 expect(()=>resolve('regime_local:PSI 999')).toThrow('Aucune correspondance');
 const local=products.find(p=>p.reference==='PLI211')!;
 expect(()=>resolve('regime_local:PSI 211',[...products,local])).toThrow('ambiguë');
 expect(()=>resolve('reflexe_eco_pharmacie:PSI111')).toThrow('Aucune correspondance');
});
