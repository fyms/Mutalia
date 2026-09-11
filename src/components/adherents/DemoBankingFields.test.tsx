// @vitest-environment jsdom
import { afterEach,expect,it } from "vitest";
import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { DemoBankingFields } from "./DemoBankingFields";
import { BankingSummary } from "./BankingSummary";
import { DemoBankingSchema,generateDemoAccount,maskDemoIban } from "@/lib/domain/demoBanking";
afterEach(cleanup);
it("generates synthetic accounts and supports shared or distinct refunds",()=>{
 const {container}=render(<form><DemoBankingFields/></form>);
 fireEvent.click(screen.getByLabelText("Renseigner des comptes de démonstration"));
 fireEvent.click(screen.getByRole("button",{name:"Générer des coordonnées fictives"}));
 const read=()=>DemoBankingSchema.parse(JSON.parse((container.querySelector('[name="banking"]') as HTMLInputElement).value));
 const shared=read();expect(shared.refundAccount.iban).toBe(shared.paymentAccount.iban);
 fireEvent.click(screen.getByLabelText("Même compte pour les remboursements"));
 const separate=read();expect(separate.refundAccount.sameAsPayment).toBe(false);expect(separate.refundAccount.iban).not.toBe(shared.paymentAccount.iban);
 fireEvent.change(screen.getByLabelText("Statut du mandat"),{target:{value:"Actif"}});expect(read().paymentAccount.mandateStatus).toBe("Actif");
 fireEvent.change(screen.getByLabelText("Statut du mandat"),{target:{value:"Révoqué"}});expect(read().paymentAccount.mandateStatus).toBe("Révoqué");
});
it("masks both full IBANs without exposing them in markup",()=>{
 const banking=DemoBankingSchema.parse({paymentAccount:{...generateDemoAccount(),paymentMethod:"Prélèvement pédagogique",mandateDate:"2026-09-11",mandateStatus:"Actif"},refundAccount:{...generateDemoAccount(),sameAsPayment:false}});
 const {container}=render(<BankingSummary banking={banking}/>);
 expect(container.innerHTML).not.toContain(banking.paymentAccount.iban);expect(container.innerHTML).not.toContain(banking.refundAccount.iban);
 expect(container.textContent).toContain(maskDemoIban(banking.paymentAccount.iban));expect(container.textContent).toContain("Données fictives — aucun traitement bancaire réel");
});
it("rejects non-demo coordinates and malformed BIC on the server schema",()=>{
 const account=generateDemoAccount();const raw={paymentAccount:{...account,paymentMethod:"Prélèvement pédagogique",mandateDate:"",mandateStatus:"À signer"},refundAccount:{sameAsPayment:true}};
 expect(DemoBankingSchema.safeParse(raw).success).toBe(true);
 expect(DemoBankingSchema.safeParse({...raw,paymentAccount:{...raw.paymentAccount,iban:account.iban.replace("FR00","FR12")}}).success).toBe(false);
 expect(DemoBankingSchema.safeParse({...raw,paymentAccount:{...raw.paymentAccount,bic:"INVALID"}}).success).toBe(false);
});
