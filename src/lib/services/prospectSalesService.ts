import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {db} from '@/lib/db';
import {getProspects,updateProspectSales,HouseholdEditError} from '@/lib/store/runtimeStore';
import {storeGeneratedDocument,readRuntimeDocument} from '@/lib/store/runtimeDocuments';
import {individualCatalog2026 as catalog} from '@/lib/data/harmonie/individualCatalog';
import {createPedagogicalGrid,estimatePedagogicalPricing} from '@/lib/domain/pedagogicalPricing';
import {getHouseholdFormulas} from '@/lib/domain/householdFormulas';
import {NeedsSchema,PipelineSchema,QuoteInputSchema,emptySales,type Needs,type ProspectSales,type SalesQuote} from '@/lib/domain/prospectSales';
import {renderSalesQuotePdf} from './salesQuotePdf';
const event=(s:ProspectSales,summary:string,quoteId?:string)=>s.history.push({id:randomUUID(),at:new Date().toISOString(),summary,quoteId});
function prospect(owner:string,id:string){const p=getProspects(owner).find(p=>p.id===id);if(!p)throw new HouseholdEditError('Prospect introuvable.');return p;}
export function salesPricingOptions(){const formulas=getHouseholdFormulas(),grid=createPedagogicalGrid(formulas);return catalog.listProducts().map(p=>{
 const matches=formulas.filter(f=>f.formula.replace(/\s/g,'')===p.reference && (f.key.startsWith('regime_general:')?p.family==='Particuliers'&&p.regime==='Régime général':f.key.startsWith('regime_local:')?p.family==='Particuliers'&&p.regime==='Régime local':f.key.startsWith('reflexe_eco_pharmacie_et_chambre:')?p.family==='Particuliers — Réflexe eco Pharmacie + chambre particulière':p.family==='Particuliers — Réflexe eco Pharmacie'));
 // Exact canonical reference only; ambiguous/missing mappings never receive an estimate.
 return {...p,config:matches.length===1?grid.find(g=>g.formulaKey===matches[0].key):undefined};
});}
export function estimateProspect(reference:string,needs:Needs,date:string){const option=salesPricingOptions().find(p=>p.reference===reference);if(!option?.config)throw new Error('Référence sans correspondance tarifaire pédagogique explicite.');return estimatePedagogicalPricing(option.config,{date,members:needs.members});}
export function saveSalesNeeds(owner:string,id:string,revision:number,raw:unknown){const needs=NeedsSchema.parse(raw);return updateProspectSales(owner,id,revision,(s,p)=>{s.needs=needs;if(['Nouveau','À contacter','RDV planifié'].includes(s.status)&&p.status==='actif')s.status='Besoins identifiés';event(s,'Besoins mis à jour');});}
export function setSalesPipeline(owner:string,id:string,revision:number,raw:unknown){const input=PipelineSchema.parse(raw);return updateProspectSales(owner,id,revision,(s,p)=>{s.status=input.status;s.lostReason=input.status==='Perdu'?input.lostReason:undefined;p.status=input.status==='Perdu'?'abandonné':'actif';event(s,`${input.status}${s.lostReason?' — '+s.lostReason:''}`);});}
export async function createSalesQuote(owner:string,id:string,revision:number,raw:unknown){
 const input=QuoteInputSchema.parse(raw),p=prospect(owner,id),s=p.sales??emptySales();if(p.revision!==revision||p.status!=='actif')throw new HouseholdEditError('Prospect modifié ou inactif.');
 if(!s.needs)throw new Error('Renseignez les besoins et les personnes à couvrir.');
 const product=catalog.listProducts().find(p=>p.reference===input.reference);if(!product)throw new Error('Référence individuelle inconnue.');
 const estimate=estimateProspect(input.reference,s.needs,input.date);
 const previous=input.previousId?s.quotes.find(q=>q.id===input.previousId):undefined;if(input.previousId&&!previous)throw new Error('Version introuvable.');
 const numbers=getProspects(owner).flatMap(p=>p.sales?.quotes??[]).map(q=>Number(q.number.split('-')[2]));
 const number=previous?.number??`DEV-2026-${String(Math.max(0,...numbers)+1).padStart(5,'0')}`;
 const version=previous?Math.max(...s.quotes.filter(q=>q.number===number).map(q=>q.version))+1:1;
 const rows=catalog.listForConsultation(input.reference),categories=[...new Set(rows.map(g=>g.category))];
 const quote:SalesQuote={...input,id:randomUUID(),number,version,createdAt:new Date().toISOString(),status:'Brouillon',documentId:randomUUID(),fileName:`devis-Mutalia-DEMO-${p.lastName.normalize('NFD').replace(/[^a-zA-Z0-9]/g,'').slice(0,40)||'prospect'}-${number}-V${version}.pdf`,family:product.family,regime:product.regime,identity:{firstName:p.firstName,lastName:p.lastName,email:p.email,phone:p.phone},needs:structuredClone(s.needs),estimate,guarantees:categories.flatMap(c=>rows.filter(g=>g.category===c).slice(0,2))};
 const bytes=await renderSalesQuotePdf(quote);
 storeGeneratedDocument({id:quote.documentId,ownerId:owner,createdBy:owner,householdId:'',prospectId:id,beneficiaryId:'',documentType:'devis',originalFileName:quote.fileName,mimeType:'application/pdf',documentDate:input.date,note:'Devis pédagogique versionné',source:'generated',status:'a_qualifier',createdAt:quote.createdAt},bytes,()=>{
  // Recheck the version and account-wide number after asynchronous rendering.
  if(!previous&&getProspects(owner).some(p=>p.sales?.quotes.some(q=>q.number===number)))throw new Error('Numéro attribué entre-temps. Réessayez.');
  updateProspectSales(owner,id,revision,s=>{s.quotes.push(quote);event(s,`${previous?'Nouvelle version':'Création'} ${number} V${version}`,quote.id);});
 });return quote;
}
export function changeSalesQuote(owner:string,id:string,revision:number,quoteId:string,status:unknown){
 const next=z.enum(['Prêt à envoyer','Accepté','Refusé','Expiré']).parse(status);
 return updateProspectSales(owner,id,revision,s=>{const q=s.quotes.find(q=>q.id===quoteId);if(!q)throw new Error('Devis introuvable.');
 const allowed=q.status==='Brouillon'?['Prêt à envoyer']:q.status==='Envoyé'?['Accepté','Refusé','Expiré']:q.status==='Prêt à envoyer'?['Expiré']:[];
 if(!allowed.includes(next))throw new Error('Transition de devis impossible.');q.status=next;event(s,`${q.number} V${q.version} — ${next}`,q.id);});
}
export function captureSalesEmail(owner:string,id:string,revision:number,quoteId:string,raw:unknown){
 const input=z.object({to:z.email().max(254),subject:z.string().trim().min(1).max(200),text:z.string().trim().min(1).max(5000)}).parse(raw);
 return db.transaction(()=>{const p=prospect(owner,id),q=p.sales?.quotes.find(q=>q.id===quoteId);if(!q||!readRuntimeDocument(owner,id,q.documentId))throw new Error('PDF joint introuvable.');
 return updateProspectSales(owner,id,revision,(s,p)=>{if(p.status!=='actif'||q.status!=='Prêt à envoyer')throw new Error('Devis non prêt ou déjà envoyé.');const current=s.quotes.find(x=>x.id===quoteId)!;
 // Account-scoped local inbox, immutable attachment references. No SMTP/network transport.
 s.emails.push({...input,id:randomUUID(),at:new Date().toISOString(),quoteId,documentId:q.documentId,fileName:q.fileName,transport:'capture'});current.status='Envoyé';if(!['Gagné','Perdu'].includes(s.status))s.status='Devis envoyé';event(s,`${q.number} V${q.version} — E-mail Démo capturé`,q.id);});})();
}
