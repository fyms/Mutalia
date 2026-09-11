import { expect, it } from "vitest";
import { createPedagogicalGrid, estimatePedagogicalPricing, PRICING_NOTICE, type PricingMember } from "./pedagogicalPricing";
import { emptyLifecycle } from "./householdLifecycle";
const grid=createPedagogicalGrid([{key:"regime_general:PSI 999"},{key:"regime_general:PSI 111"},{key:"regime_local:PLI 211"}]);
const member=(id:string,role:PricingMember["role"],birthDate="2006-01-01"):PricingMember=>({id,role,birthDate,name:id});
const holder=member("titulaire","adherent");const spouse=member("conjoint","conjoint","1980-01-01");const child=member("enfant","enfant","2015-01-01");
const estimate=(members:PricingMember[])=>estimatePedagogicalPricing(grid[0],{date:"2026-09-11",members});
it("calculates a single member and annual total with explicit source",()=>{
 expect(estimate([holder])).toMatchObject({monthly:30,annual:360,pricingSource:"pedagogical_estimator",notice:PRICING_NOTICE});
});
it("uses spouse own age",()=>{
 const r=estimate([holder,spouse]);expect(r.lines[1]).toMatchObject({age:46,monthly:40.5});expect(r.monthly).toBe(70.5);
});
it("prices children below adults and totals a couple with several children",()=>{
 expect(estimate([holder,child]).monthly).toBe(40.5);
 const r=estimate([holder,spouse,child,{...child,id:"second"}]);expect(r.monthly).toBe(91.5);expect(r.annual).toBe(1098);
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
 expect(estimatePedagogicalPricing(grid[1],{date:"2026-09-11",members:[holder]}).monthly).toBe(32);
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
