"use client";
import { useState } from "react";
import { BANKING_NOTICE, DEMO_IBAN_PATTERN, MANDATE_STATUSES, PAYMENT_METHODS, generateDemoAccount, type DemoBanking } from "@/lib/domain/demoBanking";
const empty = {accountHolder:"",iban:"",bic:""};
export function DemoBankingFields({initial,disabled}:{initial?:DemoBanking;disabled?:boolean}) {
 const [enabled,setEnabled]=useState(!!initial);
 const [payment,setPayment]=useState(initial?.paymentAccount??{...empty,paymentMethod:PAYMENT_METHODS[0],mandateDate:"",mandateStatus:MANDATE_STATUSES[0]});
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
 <fieldset className="grid gap-3 sm:grid-cols-3"><legend className="font-semibold">Compte de prélèvement</legend>{accountFields("payment")}
 <label><span className="m-label">Mode de paiement</span><select className="m-field" value={payment.paymentMethod} onChange={e=>setPayment({...payment,paymentMethod:e.target.value as typeof payment.paymentMethod})}>{PAYMENT_METHODS.map(v=><option key={v}>{v}</option>)}</select></label>
 <label><span className="m-label">Date du mandat</span><input className="m-field" type="date" value={payment.mandateDate} onChange={e=>setPayment({...payment,mandateDate:e.target.value})}/></label>
 <label><span className="m-label">Statut du mandat</span><select className="m-field" value={payment.mandateStatus} onChange={e=>setPayment({...payment,mandateStatus:e.target.value as typeof payment.mandateStatus})}>{MANDATE_STATUSES.map(v=><option key={v}>{v}</option>)}</select></label></fieldset>
 <label className="flex gap-2 my-3"><input type="checkbox" checked={refund.sameAsPayment} onChange={e=>setRefund({...refund,sameAsPayment:e.target.checked})}/>Même compte pour les remboursements</label>
 {!refund.sameAsPayment&&<fieldset className="grid gap-3 sm:grid-cols-3"><legend className="font-semibold">Compte de remboursement</legend>{accountFields("refund")}</fieldset>}</>}
 </fieldset></details>;
}
