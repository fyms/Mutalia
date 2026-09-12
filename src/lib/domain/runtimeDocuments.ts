import { z } from "zod";
import { DOCUMENT_STATUS_FLOW, type DocumentStatus } from "./constants";
export const UPLOAD_DOCUMENT_TYPES={decompte_amo:"Décompte Assurance Maladie",decompte_mutuelle:"Décompte mutuelle",facture_acquittee:"Facture",devis:"Devis",ordonnance:"Ordonnance",justificatif:"Justificatif",attestation_droits:"Attestation",autre:"Autre"} as const;
export const DocumentUploadSchema=z.object({householdId:z.string().min(1).max(100),beneficiaryId:z.string().min(1).max(100),documentType:z.enum(Object.keys(UPLOAD_DOCUMENT_TYPES) as [keyof typeof UPLOAD_DOCUMENT_TYPES,...(keyof typeof UPLOAD_DOCUMENT_TYPES)[]]),documentDate:z.iso.date(),note:z.string().trim().max(1000).default("")});
export const RuntimeDocumentStatusSchema=z.enum(DOCUMENT_STATUS_FLOW);
export interface RuntimeDocument {
 id:string;ownerId:string;householdId:string;beneficiaryId:string;documentType:string;originalFileName:string;storedFileName:string;mimeType:string;size:number;documentDate:string;note:string;source:"generated"|"uploaded";status:DocumentStatus;createdAt:string;createdBy:string;caseId?:string;
}
export type RuntimeDocumentView=Omit<RuntimeDocument,"ownerId"|"storedFileName"|"createdBy">;
export const documentView=(d:RuntimeDocument):RuntimeDocumentView=>({id:d.id,householdId:d.householdId,beneficiaryId:d.beneficiaryId,documentType:d.documentType,originalFileName:d.originalFileName,mimeType:d.mimeType,size:d.size,documentDate:d.documentDate,note:d.note,source:d.source,status:d.status,createdAt:d.createdAt,caseId:d.caseId});
export const MAX_UPLOAD_SIZE=10*1024*1024;
export const DOCUMENT_SOURCE_LABELS={case:"Cas pratique",generated:"Généré",uploaded:"Importé"};
