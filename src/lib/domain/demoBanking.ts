import { z } from "zod";
export const BANKING_NOTICE = "Données fictives — aucun traitement bancaire réel";
export const MANDATE_STATUSES = ["Non renseigné", "À signer", "Actif", "Révoqué", "En attente", "Suspendu"] as const;
export const PAYMENT_METHODS = ["Prélèvement pédagogique", "Virement pédagogique", "Chèque pédagogique"] as const;
export const PAYMENT_METHOD_LABELS = {"Prélèvement pédagogique":"Prélèvement SEPA démo", "Virement pédagogique":"Virement démo", "Chèque pédagogique":"Chèque démo"} as const;
export const PAYMENT_FREQUENCIES = ["Mensuelle", "Trimestrielle", "Semestrielle", "Annuelle"] as const;
export type PaymentFrequency = typeof PAYMENT_FREQUENCIES[number];
export const DEBIT_DAYS = [5,10,15,20,25] as const;
export const CURRENT_MANDATE_STATUSES = ["Actif","En attente","Suspendu","Révoqué"] as const;
export function paymentFrequency(value?:PaymentFrequency):PaymentFrequency{return value??"Mensuelle";}
export function mandateStatusLabel(value:string){return value==="Non renseigné"||value==="À signer"?"En attente":value;}
export function estimatedDueAmount(monthly:number,frequency:PaymentFrequency="Mensuelle") {
 if(!Number.isFinite(monthly)||monthly<0)throw new Error("Montant mensuel invalide.");
 const months={Mensuelle:1,Trimestrielle:3,Semestrielle:6,Annuelle:12}[frequency];
 return Math.round((monthly+Number.EPSILON)*100)*months/100;
}
export function generateDemoMandateReference(){return `MUTALIA-DEMO-${crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase()}`;}
// Deliberately invalid IBAN checksum (00) and zero bank/branch: never usable for payments.
export const DEMO_IBAN_PREFIX = "FR00" + "00000" + "00000";
export const DEMO_IBAN_PATTERN = `${DEMO_IBAN_PREFIX}[0-9]{11}00`;
const iban = z.string().transform(s=>s.replace(/\s/g, "").toUpperCase()).pipe(z.string().regex(new RegExp(`^${DEMO_IBAN_PATTERN}$`), "IBAN de démonstration requis : utilisez le générateur."));
const bic = z.string().trim().toUpperCase().regex(/^DEMOFR00(?:XXX)?$/, "BIC de démonstration requis : DEMOFR00XXX.");
const account = z.object({accountHolder:z.string().trim().min(1,"Titulaire du compte requis.").max(100),iban,bic});
export const DemoBankingSchema = z.object({
 paymentAccount:account.extend({paymentMethod:z.enum(PAYMENT_METHODS),paymentFrequency:z.enum(PAYMENT_FREQUENCIES).optional(),debitDay:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(25)]).optional(),mandateReference:z.string().regex(/^MUTALIA-DEMO-[A-Z0-9]{12}$/).optional(),mandateDate:z.union([z.iso.date(),z.literal("")]),mandateStatus:z.enum(MANDATE_STATUSES)}),
 refundAccount:z.discriminatedUnion("sameAsPayment",[
  z.object({sameAsPayment:z.literal(true)}),account.extend({sameAsPayment:z.literal(false)}),
 ]),
}).transform(b=>({...b,refundAccount:b.refundAccount.sameAsPayment?{sameAsPayment:true as const,accountHolder:b.paymentAccount.accountHolder,iban:b.paymentAccount.iban,bic:b.paymentAccount.bic}:b.refundAccount}));
export type DemoBanking = z.infer<typeof DemoBankingSchema>;
export const BankingInputSchema = z.preprocess(value=>{
 if(typeof value!=="string")return value;
 try{return JSON.parse(value);}catch{return null;}
},DemoBankingSchema.optional());
export function generateDemoAccount() {
 const bytes = new Uint8Array(11); crypto.getRandomValues(bytes);
 return {accountHolder:"TITULAIRE DEMO",iban:DEMO_IBAN_PREFIX + Array.from(bytes,b=>b%10).join("") + "00",bic:"DEMOFR00XXX"};
}
export function maskDemoIban(value:string) {return value ? `FR•• •••• •••• •••• •••• ••${value.slice(-4,-2)} ${value.slice(-2)}` : "Non renseigné";}
