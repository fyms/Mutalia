import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AmoStatementSnapshot } from "@/lib/domain/amoStatement";
export const AMO_TEMPLATE=path.join(process.cwd(),"data/templates/assurance-maladie/Template_vierge_decompte_Assurance_Maladie_Mutalia.pdf");
const date=(value:string)=>value.split("-").reverse().join("/");
export async function renderAmoStatementPdf(data:AmoStatementSnapshot):Promise<Uint8Array> {
 const template=await PDFDocument.load(await readFile(AMO_TEMPLATE));
 const pdf=await PDFDocument.create();
 const [page]=await pdf.copyPages(template,[0]);pdf.addPage(page);
 const height=page.getHeight();
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const clean=(s:string)=>s.replace(/\u202f|\u00a0/g," ").replace(/œ/g,"oe").replace(/Œ/g,"OE").replace(/[^\x20-\x7e\u00a0-\u00ff€’–—]/g,"?");
 function text(value:string,x:number,top:number,width:number,size=9) {
  value=clean(value);let actual=size;
  while(font.widthOfTextAtSize(value,actual)>width&&actual>6)actual-=0.25;
  if(font.widthOfTextAtSize(value,actual)>width) throw new Error("Texte trop long pour le modèle : raccourcissez la prestation ou les coordonnées.");
  page.drawText(value,{x,y:height-top,size:actual,font,color:rgb(0,0,0)});
 }
 function clear(x:number,top:number,width:number,h:number){page.drawRectangle({x,y:height-top-h,width,height:h,color:rgb(1,1,1)});}
 function lines(value:string,x:number,top:number,width:number,size=8,max=4) {
  const words=clean(value).split(/\s+/),rows:string[]=[];let line="";
  for(const word of words){const next=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(next,size)>width&&line){rows.push(line);line=word;}else line=next;}
  if(line)rows.push(line);if(rows.length>max)throw new Error("Coordonnées trop longues pour le modèle.");
  rows.forEach((row,i)=>text(row,x,top+i*(size+3),width,size));
 }
 clear(42,114,250,26);text(`Assuré social : ${data.holder}`,42,125,245,8);
 text(`N° de Sécurité sociale - Démo : ${data.socialSecurityNumber||"À renseigner"}`,42,138,245,7);
 // Replace the preprinted Loiret address only on this in-memory copy.
 clear(296,136,277,57);lines(data.fund.name,298,146,273,8,2);
 lines(data.fund.address.join(" - "),298,170,273,8,3);
 lines(`Domicile fictif : ${data.domicile||"Domicile à renseigner"}`,298,219,270,8,3);
 text(`Source : ${data.fund.source}`,298,203,272,7);
 clear(132,264,440,43);
 text(`Voici le détail des versements pour la période du ${date(data.periodStart)} au ${date(data.periodEnd)}.`,133,276,437,9);
 lines("Informations fictives pour l'exercice Mutalia. Aucune transmission à l'Assurance Maladie ni à un organisme complémentaire.",133,294,435,9,2);
 clear(130,356,260,16);text(`Pour ${data.beneficiary} - né(e) le ${date(data.birthDate)}`,132,367,261,8);
 text(date(data.careDate),44,383,75,8);text(data.act,132,383,261,8);
 const money=(n:number)=>n.toFixed(2).replace(".",",");
 text(money(data.paid),402,383,38,8);text(money(data.brss),452,383,38,8);
 text(`${data.amoRate} %`,502,383,30,8);text(money(data.reimbursed),545,383,28,8);
 clear(130,386,390,8);text(`réf. ${data.id} - SIMULATION`,132,392,380,6);
 text("Document fictif généré par Mutalia — simulation pédagogique",42,809,530,8);
 pdf.setTitle("Décompte AMO - Démo Mutalia");pdf.setSubject("Document fictif, aucun versement réel");pdf.setAuthor("Mutalia");
 return pdf.save({useObjectStreams:false});
}
