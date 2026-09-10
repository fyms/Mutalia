import "server-only";
import { context } from "./prestationService";
import { calculatePrestation, contractAnomalies } from "./prestations";
import { DevisPecInputSchema, nextDecisions, type DevisPecStatus } from "./devisPec";
import { createStoredDevisPec, changeStoredDevisPec, getDevisPec, HouseholdEditError } from "@/lib/store/runtimeStore";
export function saveDevisPec(owner:string,raw:unknown,id?:string,revision?:number) {
  const input=DevisPecInputSchema.parse(raw);
  const {anomalies,...names}=context(owner,input);
  const values={...input,...names,guaranteeMode:input.guaranteeMode,guaranteeValue:input.guaranteeValue,result:null,anomalies:[...contractAnomalies(input),...anomalies]};
  if(!id)return createStoredDevisPec(owner,{...values,status:input.kind === "devis" ? "Reçu" : "Demandée",refusalReason:""});
  return changeStoredDevisPec(owner,id,revision!,p=>{
    if(!["Reçu","À analyser","Demandée","À contrôler"].includes(p.status))throw new HouseholdEditError("Cette demande ne peut plus être modifiée.");
    if(p.householdId!==input.householdId||p.memberId!==input.memberId||p.kind!==input.kind)throw new HouseholdEditError("Le rattachement et le type ne peuvent pas être remplacés.");
    Object.assign(p,values);p.history.push({at:new Date().toISOString(),status:p.status,event:"Données corrigées ; estimation à refaire"});
  });
}
export function processDevisPec(owner:string,id:string,revision:number,target:DevisPecStatus|"estimate",reason="") {
  const current=getDevisPec(owner).find(p=>p.id===id);
  if(!current)throw new HouseholdEditError("Devis / PEC introuvable.");
  const checked=context(owner,current);
  return changeStoredDevisPec(owner,id,revision,p=>{
    if(target === "estimate") {
      if(!(p.kind === "devis" && p.status === "À analyser") && !(p.kind === "pec" && p.status === "À contrôler"))throw new HouseholdEditError("Estimation indisponible à ce statut.");
      const calculated=calculatePrestation(p);
      p.anomalies=[...calculated.anomalies,...checked.anomalies];p.result=p.anomalies.length ? null : calculated.result;
      if(p.result && p.kind === "devis")p.status="Calculé";
      p.history.push({at:new Date().toISOString(),status:p.status,event:p.result ? "Estimation calculée avec le moteur du simulateur" : `Estimation bloquée : ${p.anomalies.join(" · ")}`});
      return;
    }
    if(!nextDecisions(p).includes(target))throw new HouseholdEditError("Transition non autorisée.");
    if(["Accepté","Accordée"].includes(target) && (!p.result||p.anomalies.length||checked.anomalies.length))throw new HouseholdEditError("Estimation et contrôle complets requis avant accord.");
    if(["Refusé","Refusée"].includes(target)) {
      if(typeof reason!=="string"||reason.trim().length<10||reason.trim().length>3000)throw new HouseholdEditError("Motif de refus requis (10 à 3000 caractères).");
      p.refusalReason=reason.trim();
    }
    p.status=target;p.history.push({at:new Date().toISOString(),status:target,event:p.refusalReason ? `${target} : ${p.refusalReason}` : target});
  });
}
