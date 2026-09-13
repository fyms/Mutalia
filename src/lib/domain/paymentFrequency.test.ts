import {expect,it} from 'vitest';
import {paymentFrequency,estimatedDueAmount,DemoBankingSchema,generateDemoAccount} from './demoBanking';
it('uses integer cents and monthly defaults without changing the pricing engine',()=>{
 expect(paymentFrequency()).toBe('Mensuelle');
 for(const [frequency,amount] of [['Mensuelle',78.4],['Trimestrielle',235.2],['Semestrielle',470.4],['Annuelle',940.8]] as const)expect(estimatedDueAmount(78.4,frequency)).toBe(amount);
 expect(estimatedDueAmount(0.1,'Trimestrielle')).toBe(0.3);expect(()=>estimatedDueAmount(NaN)).toThrow();
});
it('accepts old records and rejects invented frequencies, debit days and real mandate references',()=>{
 const payment={...generateDemoAccount(),paymentMethod:'Prélèvement pédagogique',mandateDate:'',mandateStatus:'À signer'};
 const parse=(fields:object)=>DemoBankingSchema.safeParse({paymentAccount:{...payment,...fields},refundAccount:{sameAsPayment:true}});
 expect(parse({}).success).toBe(true);for(const fields of [{paymentFrequency:'Unique'},{debitDay:8},{mandateReference:'REAL123'},{mandateStatus:'Expiré'}])expect(parse(fields).success).toBe(false);
});
