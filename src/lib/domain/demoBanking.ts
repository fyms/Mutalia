import { z } from "zod";
export const BANKING_NOTICE = "Données fictives — aucun traitement bancaire réel";
export const MANDATE_STATUSES = ["Non renseigné", "À signer", "Actif", "Révoqué"] as const;
export const PAYMENT_METHODS = ["Prélèvement pédagogique", "Virement pédagogique", "Chèque pédagogique"] as const;
// Deliberately invalid IBAN checksum (00) and zero bank/branch: never usable for payments.
export const DEMO_IBAN_PREFIX = "FR00" + "00000" + "00000";
export const DEMO_IBAN_PATTERN = `${DEMO_IBAN_PREFIX}[0-9]{11}00`;
const iban = z.string().transform(s=>s.replace(/\s/g, "").toUpperCase()).pipe(z.string().regex(new RegExp(`^${DEMO_IBAN_PATTERN}$`), "IBAN de démonstration requis : utilisez le générateur."));
const bic = z.string().trim().toUpperCase().regex(/^DEMOFR00(?:XXX)?$/, "BIC de démonstration requis : DEMOFR00XXX.");
const account = z.object({accountHolder:z.string().trim().min(1,"Titulaire du compte requis.").max(100),iban,bic});
export const DemoBankingSchema = z.object({
 paymentAccount:account.extend({paymentMethod:z.enum(PAYMENT_METHODS),mandateDate:z.union([z.iso.date(),z.literal("")]),mandateStatus:z.enum(MANDATE_STATUSES)}),
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
