import pdfBenefits from "./verifiedBenefits.json";
import seed from "@/lib/data/seed/harmonie-2026.json";
import { CONVENTIONS } from "./conventions";
import type { GuaranteeMode } from "@/lib/domain/reimbursement";
export interface SimulatorBenefit {
 id:string;family:string;level:string;category:string;label:string;mode:GuaranteeMode;
 value:number|null;guarantee:string;source:string;page?:number;restriction:string;
}
// Preserve the existing comparator as a distinct source, never a PSI/CCN mapping.
const comparator:SimulatorBenefit[]=seed.verified_live_quote_2026_sample.benefits.flatMap(b=>
 seed.verified_live_quote_2026_sample.compared_formulas.map(level=>{
  const guarantee=(b as Record<string,string>)[level];
  const percent=guarantee.match(/^(\d+)% BRSS$/);
  const forfait=guarantee.match(/^(\d+) €/);
  const real=guarantee === "Frais réels";
  const category=/dentaire|Orthodontie|Parodontologie|Implantologie/.test(b.benefit) ? "Dentaire" : /hospitalier|chirurgie|Chambre/.test(b.benefit) ? "Hospitalisation" : "Soins courants";
  return {id:`pli:${encodeURIComponent(b.benefit)}:${level}`,family:"Comparateur PLI",level,category,label:b.benefit,
   mode:real ? "frais_reels" as const : forfait ? "forfait_euros" as const : "percent_brss" as const,
   value:percent ? Number(percent[1]) : forfait ? Number(forfait[1]) : null,guarantee,
   source:"src/lib/data/seed/harmonie-2026.json — verified_live_quote_2026_sample",
   restriction:percent||real ? "" : "Unité, conditions et/ou consommation à vérifier dans une source contractuelle PLI ; aucun rattachement PSI ou CCN implicite."};
 }));
const hospital:SimulatorBenefit[]=CONVENTIONS.flatMap(c=>c.benefits.flatMap(b=>c.levels.map((level,i)=>({
 id:`${c.idcc}:hospital-${b.id}:${level}`,family:`IDCC ${c.idcc}`,level,category:"Hospitalisation",label:b.label,
 mode:"percent_brss",value:b.rates[i],guarantee:`${b.rates[i]} % BR, AMO incluse`,source:`data/sources/harmonie/2026/${c.file}`,page:1,restriction:"",
}))));
export const SIMULATOR_BENEFITS:readonly SimulatorBenefit[]=[...comparator,...pdfBenefits as SimulatorBenefit[],...hospital];
export function getSimulatorBenefit(id:string) {return SIMULATOR_BENEFITS.find(b=>b.id===id);}
