// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PedagogicalEstimate, PedagogicalFormulaBases } from "./PedagogicalEstimate";
import type { HouseholdView } from "@/lib/domain/households";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/domain/appointments",()=>({localToday:()=>"2026-09-11"}));
afterEach(cleanup);
it("labels estimates and reference bases as non contractual, with transparent detail and no creation action",()=>{
 const adherent={member_id:"m",role:"adherent" as const,first_name:"Camille",last_name:"Exemple",birth_date:"1990-01-01"};
 const household: HouseholdView={assignedFormula:"PSI 111",starsSoins:"Donnée 2026 à vérifier",starsEquipements:"Donnée 2026 à vérifier",householdId:"h",case:null,adherent,beneficiaries:[],household:{household_id:"h",members:[adherent]},manual:{id:"h",memberId:"m",source:"manual",referenceYear:2026,createdAt:"2026-01-01",updatedAt:"2026-01-01",revision:1,deletedAt:null,firstName:"Camille",lastName:"Exemple",birthDate:"1990-01-01",email:"test@example.invalid",phone:"0600000000",address:"Rue exemple",city:"Commune exemple",effectiveDate:"2026-01-01",formulaKey:"regime_general:PSI 111",postalCode:"45130"}};
 const {container}=render(<><PedagogicalEstimate household={household} showPayment/><PedagogicalFormulaBases/></>);
 expect(screen.getAllByText(/Estimation pédagogique — tarif non contractuel/)).toHaveLength(2);
 expect(screen.getByText("Montant estimé à chaque échéance")).toBeTruthy();
 expect(screen.getByText("Mensuelle")).toBeTruthy();
 expect(screen.getByText("Voir le détail du calcul")).toBeTruthy();
 expect(container.textContent).toContain("Titulaire");expect(container.textContent).toContain("45130");
 expect(container.textContent).not.toMatch(/Tarif officiel|Tarif Harmonie|Devis/i);
 expect(screen.queryByRole("button")).toBeNull();
 expect(container.querySelectorAll('[data-pricing-source="pedagogical_estimator"]')).toHaveLength(2);
});

it('presents canonical local PLI bases and all catalogue references',()=>{
 const {container}=render(<PedagogicalFormulaBases/>);
 expect(screen.getByText('Particuliers · Régime local — PLI411')).toBeTruthy();
 expect(screen.getByText('Particuliers · Régime général — PSI111')).toBeTruthy();
 expect(container.querySelectorAll('tbody tr')).toHaveLength(42);
 expect(container.textContent).not.toMatch(/Régime local — PSI/);
 expect(container.textContent).toContain('pedagogical-2026-v2');
});
