import 'server-only';
import {prospectRoleLabel} from '@/lib/domain/prospectLabels';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {DEMO_DOCUMENT_NOTICE,type SalesQuote} from '@/lib/domain/prospectSales';
import {PRICING_NOTICE} from '@/lib/domain/pedagogicalPricing';
import {estimatedDueAmount} from '@/lib/domain/demoBanking';
import {CONDITION_TO_VERIFY,hasDeterminedApplication} from '@/lib/domain/individualSimulation';
/** Same pdf-lib renderer dependency as existing AMO documents; no source PDF read. */
export async function renderSalesQuotePdf(q:SalesQuote){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const blue=rgb(33/255,93/255,145/255),ink=rgb(.12,.19,.24);let page=pdf.addPage([595.28,841.89]),y=785;
 const clean=(s:string)=>s.normalize('NFC').replace(/[\u00a0\u202f]/g,' ').replace(/œ/g,'oe').replace(/Œ/g,'OE').replace(/[^\x20-\x7e\u00a0-\u00ff€’–—]/g,'?');
 function header(){page.drawText('Mutalia',{x:40,y:803,size:22,font:bold,color:blue});page.drawText(`${q.number} · V${q.version} · ${q.date}`,{x:40,y:779,size:10,font,color:ink});y=754;}
 function wrap(text:string,size:number,strong:boolean){const f=strong?bold:font;const rows:string[]=[];let row='';for(const word of clean(text).split(/\s+/)){const next=row?row+' '+word:word;if(f.widthOfTextAtSize(next,size)<=515){row=next;continue;}if(row)rows.push(row);row='';for(const char of word){if(f.widthOfTextAtSize(row+char,size)>515){rows.push(row);row='';}row+=char;}}if(row)rows.push(row);return rows;}
 function line(text:string,size=10,strong=false){const f=strong?bold:font;for(const row of wrap(text,size,strong)){if(y<62){page=pdf.addPage([595.28,841.89]);header();}page.drawText(row,{x:40,y,size,font:f,color:strong?blue:ink});y-=size+5;}y-=4;}

 header();line('Proposition santé — Démonstration',16,true);line(PRICING_NOTICE,11,true);line(DEMO_DOCUMENT_NOTICE,9);
 line(`${q.identity.firstName} ${q.identity.lastName}`,13,true);line(`${q.identity.email} · ${q.identity.phone}`);
 line(`${q.reference} · ${q.family} · ${q.regime}`,11,true);
 line(`Périodicité : ${q.frequency} · montant estimé par échéance : ${estimatedDueAmount(q.estimate.monthly,q.frequency).toFixed(2)} €`);
 line(`Total mensuel : ${q.estimate.monthly.toFixed(2)} € · annuel : ${q.estimate.annual.toFixed(2)} €`,12,true);
 line('Personnes couvertes et détail pédagogique',12,true);
 for(const m of q.estimate.lines)line(`${m.name} · ${prospectRoleLabel(m.role)} · ${m.birthDate} · ${m.age} ans : ${m.monthly.toFixed(2)} €/mois (âge ×${m.ageCoefficient}, rôle ×${m.roleCoefficient})`);
 line(`Hypothèses internes ${q.estimate.config.version} · base ${q.estimate.config.baseMonthlyRate} € · régime ×${q.estimate.config.regimeCoefficient} · zone ×${q.estimate.config.zoneCoefficient}. Source : pedagogical_estimator.`,9);
 line('Garanties consultables — sélection documentaire non exhaustive',12,true);
 for(const g of q.guarantees){const block:[string,number,boolean][]=[
 [`${g.category} — ${g.benefit}`,10,true],
 [g.status==='verified'?`${g.value} ${g.unit} · ${g.calculationMode} · ${g.condition} · ${g.limit}`:g.documentValue??'Donnée 2026 à vérifier',10,false],
 [g.status==='verified'?`Vérifié${!hasDeterminedApplication(g)?' · '+CONDITION_TO_VERIFY:''}`:'Donnée 2026 à vérifier · Source PDF — non validée pour calcul',9,false],
 [`${g.reference} · ${g.sourceFile} · page ${g.sourcePage}`,8,false]];
 const height=block.reduce((n,[t,size,strong])=>n+wrap(t,size,strong).length*(size+5)+4,0);
 if(y-height<62&&height<690){page=pdf.addPage([595.28,841.89]);header();}for(const [t,size,strong] of block)line(t,size,strong);
 }

 pdf.getPages().forEach((p,i)=>{p.drawText(`Mutalia · Simulation pédagogique · ${i+1}/${pdf.getPageCount()}`,{x:40,y:28,size:8,font,color:blue});});
 pdf.setTitle(`${q.number} V${q.version} — Démo Mutalia`);pdf.setAuthor('Mutalia');return pdf.save();
}
