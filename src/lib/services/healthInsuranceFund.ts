import "server-only";
import { z } from "zod";
export const FUND_TO_VERIFY="Caisse d’Assurance Maladie à vérifier";
export const ADDRESS_TO_VERIFY="Adresse CPAM à vérifier";
export type FundSource="Annuaire officiel"|"cache officiel"|"Vérification requise";
export interface Fund {codeINSEE?:string;city?:string;serviceId?:string;name:string;address:string[];retrievedAt?:string;source:FundSource;reason?:string;}
export interface FundCache {get(key:string):{at:number;value:unknown}|undefined;set(key:string,value:unknown,at:number):void;}
const TTL=14*86400*1000;
const root="https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/";
const commune=z.object({nom:z.string(),code:z.string().regex(/^[0-9A-Z]{5}$/),codeDepartement:z.string(),codesPostaux:z.array(z.string())});
const normalize=(s:string)=>s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().replace(/[\s’'-]+/g," ").trim();
const unavailable=(reason:string,codeINSEE?:string,city?:string):Fund=>({name:FUND_TO_VERIFY,address:[ADDRESS_TO_VERIFY],source:"Vérification requise",reason,codeINSEE,city});
function recordsUrl(dataset:string,where:string,select:string) {
 const url=new URL(`${root}${dataset}/records`);
 url.search=new URLSearchParams({where,select,limit:"100"}).toString();return url.toString();
}
function arrayJson(value:unknown):unknown {return typeof value==="string"?JSON.parse(value):value;}
export function createFundResolver({cache,fetcher=fetch,now=Date.now}:{cache:FundCache;fetcher?:typeof fetch;now?:()=>number}) {
 const pending=new Map<string,Promise<Fund>>();
 async function request(url:string) {const response=await fetcher(url,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error("API indisponible");return response.json();}
 async function resolve(input:{postalCode:string;city:string}):Promise<Fund> {
  if (!/^[0-9]{5}$/.test(input.postalCode)||!input.city.trim()||input.city.length>100) return unavailable("Domicile incomplet.");
  const locationKey=`commune:${input.postalCode}:${normalize(input.city)}`;
  const location=cache.get(locationKey);
  let place:z.infer<typeof commune>|undefined;
  let staleLocation=false;
  if (location && now()-location.at<TTL) place=commune.parse(location.value);
  else try {
   const url=new URL("https://geo.api.gouv.fr/communes");url.search=new URLSearchParams({codePostal:input.postalCode,fields:"nom,code,codeDepartement,codesPostaux"}).toString();
   const rows=z.array(commune).parse(await request(url.toString()));
   const matches=[...new Map(rows.filter(p=>p.codesPostaux.includes(input.postalCode)&&normalize(p.nom)===normalize(input.city)).map(p=>[p.code,p])).values()];
   if(matches.length!==1)return unavailable(matches.length?"Commune ambiguë.":"Commune exacte introuvable.");
   place=matches[0];cache.set(locationKey,place,now());
  } catch {if(location){place=commune.parse(location.value);staleLocation=true;}else return unavailable("API communes indisponible.");}
  const code=place.code,key=`cpam:${code}`,saved=cache.get(key);
  if (saved && (now()-saved.at<TTL || staleLocation)) return {...saved.value as Fund,source:"cache officiel"};
  if(staleLocation) return unavailable("Résolution territoriale à actualiser.",code,place.nom);
  try {
   // DILA dataset schema checked: code_type_service_local = cpam.
   const competence=await request(recordsUrl("api-lannuaire-administration-locale-competence-geographique",`code_insee_commune="${code}" AND code_type_service_local="cpam"`,"code_insee_commune,nom_commune,id_service_local,code_type_service_local"));
   const parsed=z.object({total_count:z.number(),results:z.array(z.object({code_insee_commune:z.string(),code_type_service_local:z.string(),id_service_local:z.unknown()}))}).parse(competence);
   if(parsed.total_count>parsed.results.length)return unavailable("Résultats incomplets.",code,place.nom);
   const ids=[...new Set(parsed.results.filter(r=>r.code_insee_commune===code&&r.code_type_service_local==="cpam").flatMap(r=>z.array(z.string().uuid()).parse(arrayJson(r.id_service_local))))];
   if(ids.length!==1)return unavailable(ids.length?"Plusieurs services CPAM compétents : contrôle nécessaire.":"Aucun service CPAM trouvé.",code,place.nom);
   const services=z.object({total_count:z.number(),results:z.array(z.object({id:z.string(),nom:z.string().min(1),adresse:z.unknown(),pivot:z.unknown()}))}).parse(await request(recordsUrl("api-lannuaire-administration",`id="${ids[0]}"`,"id,nom,adresse,pivot")));
   if(services.total_count!==1 || services.results[0]?.id!==ids[0])return unavailable("Service ambigu ou absent.",code,place.nom);
   const service=services.results[0];
   const pivots=z.array(z.object({type_service_local:z.string()})).parse(arrayJson(service.pivot));
   if(!pivots.some(p=>p.type_service_local==="cpam"))return unavailable("Type de service non confirmé.",code,place.nom);
   const addresses=z.array(z.object({type_adresse:z.string(),complement1:z.string().optional(),complement2:z.string().optional(),numero_voie:z.string(),service_distribution:z.string().optional(),code_postal:z.string(),nom_commune:z.string()})).parse(arrayJson(service.adresse));
   const candidates=addresses.filter(a=>a.type_adresse==="Adresse"&&a.numero_voie&&a.code_postal&&a.nom_commune);
   if(candidates.length!==1)return unavailable("Adresse absente ou ambiguë.",code,place.nom);
   const a=candidates[0];const fund:Fund={codeINSEE:code,city:place.nom,serviceId:ids[0],name:service.nom,address:[a.complement1,a.complement2,a.numero_voie,a.service_distribution,`${a.code_postal} ${a.nom_commune}`].filter((s):s is string=>!!s),retrievedAt:new Date(now()).toISOString(),source:"Annuaire officiel"};
   cache.set(key,fund,now());return fund;
  } catch {return saved?{...saved.value as Fund,source:"cache officiel"}:unavailable("Annuaire indisponible.",code,place.nom);}
 }
 return (input:{postalCode:string;city:string})=>{
  const key=`${input.postalCode}:${normalize(input.city)}`;
  const failed=cache.get(`unresolved:${key}`);
  if(failed && now()-failed.at<300000)return Promise.resolve(failed.value as Fund);
  const existing=pending.get(key);if(existing)return existing;
  const promise=resolve(input).catch(()=>unavailable("Résolution indisponible.")).then(fund=>{if(fund.source==="Vérification requise")cache.set(`unresolved:${key}`,fund,now());return fund;}).finally(()=>pending.delete(key));pending.set(key,promise);return promise;
 };
}
