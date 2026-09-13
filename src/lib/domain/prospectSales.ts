import { z } from 'zod';
import type { individualCatalog2026 } from '@/lib/data/harmonie/individualCatalog';
import type { estimatePedagogicalPricing } from './pedagogicalPricing';
import { PAYMENT_FREQUENCIES } from './demoBanking';
export const SALES_STATUSES=['Nouveau','À contacter','RDV planifié','Besoins identifiés','Devis envoyé','En réflexion','À relancer','Gagné','Perdu'] as const;
export const LOST_REASONS=['Prix','Garanties','Concurrent','Pas de besoin','Report du projet','Ne répond plus','Autre'] as const;
export const QUOTE_STATUSES=['Brouillon','Prêt à envoyer','Envoyé','Accepté','Refusé','Expiré'] as const;
const text=z.string().trim().max(2000).default('');
export const NeedsSchema=z.object({familySituation:text,currentCoverage:text,budget:z.number().nonnegative().max(10000).nullable(),hospitalisation:z.enum(['Faible','Normale','Forte']),dental:z.enum(['Faible','Normale','Forte']),optical:z.enum(['Faible','Normale','Forte']),routine:z.enum(['Faible','Normale','Forte']),other:text,protection:z.boolean(),savings:z.boolean(),comment:text,nextAction:text,members:z.array(z.object({id:z.string().min(1),name:z.string().trim().min(1).max(100),birthDate:z.union([z.iso.date(),z.literal('')]),role:z.enum(['adherent','conjoint','enfant'])})).min(1).max(15)}).refine(n=>n.members.filter(m=>m.role==='adherent').length===1&&new Set(n.members.map(m=>m.id)).size===n.members.length,'Un titulaire et des identifiants de personnes distincts sont requis.');
export type Needs=z.infer<typeof NeedsSchema>;
export const PipelineSchema=z.object({status:z.enum(SALES_STATUSES),lostReason:z.enum(LOST_REASONS).optional()}).refine(v=>v.status!=='Perdu'||!!v.lostReason,'Motif de perte obligatoire.');
export const QuoteInputSchema=z.object({reference:z.string(),date:z.iso.date(),frequency:z.enum(PAYMENT_FREQUENCIES),previousId:z.string().optional()});
export type GuaranteeRow=ReturnType<typeof individualCatalog2026.listForConsultation>[number];
export type SalesEstimate=ReturnType<typeof estimatePedagogicalPricing>;
export interface SalesQuote {id:string;number:string;version:number;createdAt:string;status:typeof QUOTE_STATUSES[number];documentId:string;fileName:string;reference:string;family:string;regime:string;date:string;frequency:typeof PAYMENT_FREQUENCIES[number];identity:{firstName:string;lastName:string;email:string;phone:string};needs:Needs;estimate:SalesEstimate;guarantees:GuaranteeRow[];}
export interface SalesEvent {id:string;at:string;summary:string;quoteId?:string;appointmentId?:string;}
export interface DemoSalesMail {id:string;at:string;to:string;subject:string;text:string;quoteId:string;documentId:string;fileName:string;transport:'capture';}
export interface ProspectSales {status:typeof SALES_STATUSES[number];lostReason?:typeof LOST_REASONS[number];needs?:Needs;quotes:SalesQuote[];emails:DemoSalesMail[];history:SalesEvent[];}
export function emptySales():ProspectSales{return {status:'Nouveau',quotes:[],emails:[],history:[]};}
export const DEMO_DOCUMENT_NOTICE='Document fictif généré par Mutalia — simulation pédagogique';
