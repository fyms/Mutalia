'use server';
import {getSession} from '@/lib/store/session';
import {revalidatePath} from 'next/cache';
import {saveSalesNeeds,setSalesPipeline,createSalesQuote,changeSalesQuote,captureSalesEmail} from '@/lib/services/prospectSalesService';
export async function prospectSalesAction(id:string,revision:number,operation:'needs'|'pipeline'|'quote'|'quoteStatus'|'email',raw:unknown,quoteId='') {
 const {userId}=await getSession();try{
 switch(operation){case 'needs':saveSalesNeeds(userId,id,revision,raw);break;case 'pipeline':setSalesPipeline(userId,id,revision,raw);break;case 'quote':await createSalesQuote(userId,id,revision,raw);break;case 'quoteStatus':changeSalesQuote(userId,id,revision,quoteId,raw);break;case 'email':captureSalesEmail(userId,id,revision,quoteId,raw);break;default:throw new Error('Action inconnue.');}
 for(const path of ['/prospects','/agenda','/documents','/cockpit'])revalidatePath(path);return {};
 }catch(e){return {error:e instanceof Error&&e.name!=='ZodError'?e.message:'Champs obligatoires ou valeurs à vérifier.'};}
}
