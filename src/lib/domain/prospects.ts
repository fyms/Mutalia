import { z } from "zod";
export const PROSPECT_REASONS=["Découverte des besoins","Devis santé","Protection des personnes","Épargne & Retraite","Relance","Autre"] as const;
export const ProspectInputSchema=z.object({firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100),phone:z.string().trim().regex(/^\+?[0-9 ().-]{6,30}$/),email:z.email().max(254)});
export interface Prospect extends z.infer<typeof ProspectInputSchema> {id:string;createdAt:string;updatedAt:string;status:"actif"|"converti"|"abandonné";revision:number;householdId?:string;}
