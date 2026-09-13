"use client";
import { useState } from "react";
import { BANKING_NOTICE, DEMO_IBAN_PATTERN, CURRENT_MANDATE_STATUSES, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_FREQUENCIES, DEBIT_DAYS, paymentFrequency, mandateStatusLabel, generateDemoMandateReference, generateDemoAccount, type DemoBanking } from "@/lib/domain/demoBanking";
const empty = {accountHolder:"",iban:"",bic:""};
export function DemoBankingFields({initial,disabled}:{initial?:DemoBanking;disabled?:boolean}) {
 const [enabled,setEnabled]=useState(!!initial);
 const [payment,setPayment]=useState<DemoBanking["paymentAccount"]>({...(initial?initial.paymentAccount:{...empty,paymentMethod:PAYMENT_METHODS[0],mandateDate:"",mandateStatus:"En attente"}),paymentFrequency:paymentFrequency(initial?.paymentAccount.paymentFrequency)});
 const [refund,setRefund]=useState(initial?.refundAccount??{...empty,sameAsPayment:true});
 const accountFields=(kind:"payment"|"refund")=>{
  const data=kind==="payment"?payment:refund;
  return <>{([['accountHolder','Titulaire du compte'],['iban','IBAN démo'],['bic','BIC démo']] as const).map(([key,label])=><label key={key} className="block"><span className="m-label">{label}</span><input className="m-field" required value={data[key]} maxLength={key==="accountHolder"?100:key==="iban"?27:11} pattern={key==="iban"?DEMO_IBAN_PATTERN:key==="bic"?"DEMOFR00(XXX)?":undefined} onChange={e=>{const value=key==="accountHolder"?e.target.value:e.target.value.replace(/\s/g,"").toUpperCase();if(kind==="payment")setPayment({...payment,[key]:value});else setRefund({...refund,[key]:value});}}/></label>)}</>;
 };
 return <details className="m-panel" open={enabled}><summary className="cursor-pointer font-semibold">Coordonnées bancaires — Démo</summary>
 <p className="text-sm my-2">{BANKING_NOTICE}</p><p className="m-help">Format synthétique uniquement : FR00, banque et guichet 00000, 11 chiffres libres, clé 00 ; BIC DEMOFR00XXX. Les clés 00 sont volontairement non bancaires. Aucun contrôle d’existence de compte.</p>
 <fieldset disabled={disabled}><label className="flex gap-2 my-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Renseigner des comptes de démonstration</label>
 {enabled&&<><input type="hidden" name="banking" value={JSON.stringify({paymentAccount:payment,refundAccount:refund})}/>
 <button type="button" className="m-button m-button--secondary mb-3" onClick={()=>{setPayment({...payment,...generateDemoAccount()});setRefund({...refund,...generateDemoAccount()});}}>Générer des coordonnées fictives</button>
 <fieldset className="grid gap-3 sm:grid-cols-3"><legend className="font-semibold">Compte de règlement</legend>{accountFields("payment")}
 <label><span className="m-label">Mode de règlement</span><select className="m-field" value={payment.paymentMethod} onChange={e=>setPayment({...payment,paymentMethod:e.target.value as typeof payment.paymentMethod})}>{PAYMENT_METHODS.map(v=><option key={v}>{PAYMENT_METHOD_LABELS[v]}</option>)}</select></label>
 <label><span className="m-label">Périodicité de paiement</span><select className="m-field" value={paymentFrequency(payment.paymentFrequency)} onChange={e=>setPayment({...payment,paymentFrequency:e.target.value as typeof payment.paymentFrequency})}>{PAYMENT_FREQUENCIES.map(v=><option key={v}>{v}</option>)}</select></label>
 {payment.paymentMethod===PAYMENT_METHODS[0]&&<>
 <label><span className="m-label">Jour de prélèvement</span><select aria-label="Jour de prélèvement" className="m-field" value={payment.debitDay??""} onChange={e=>setPayment({...payment,debitDay:e.target.value?Number(e.target.value) as typeof payment.debitDay:undefined})}><option value="">Non renseigné</option>{DEBIT_DAYS.map(v=><option key={v} value={v}>{v}</option>)}</select><span className="m-help">Valeurs pédagogiques — selon règles de l’organisme</span></label>
 <label><span className="m-label">Date de signature du mandat</span><input className="m-field" type="date" value={payment.mandateDate} onChange={e=>setPayment({...payment,mandateDate:e.target.value})}/></label>
 <label><span className="m-label">Statut du mandat</span><select className="m-field" value={mandateStatusLabel(payment.mandateStatus)} onChange={e=>setPayment({...payment,mandateStatus:e.target.value as typeof payment.mandateStatus})}>{CURRENT_MANDATE_STATUSES.map(v=><option key={v}>{v}</option>)}</select></label>
 <label><span className="m-label">RUM démo</span><input aria-label="RUM démo" className="m-field" value={payment.mandateReference??""} readOnly/><button type="button" className="m-button m-button--secondary" onClick={()=>setPayment({...payment,mandateReference:generateDemoMandateReference()})}>Générer une RUM démo</button><span className="m-help">Mandat fictif — environnement pédagogique</span></label>
 </>}</fieldset>
 <label className="flex gap-2 my-3"><input type="checkbox" checked={refund.sameAsPayment} onChange={e=>setRefund({...refund,sameAsPayment:e.target.checked})}/>Même compte pour les remboursements</label>
 {!refund.sameAsPayment&&<fieldset className="grid gap-3 sm:grid-cols-3"><legend className="font-semibold">Compte de remboursement</legend>{accountFields("refund")}</fieldset>}</>}
 </fieldset></details>;
}
