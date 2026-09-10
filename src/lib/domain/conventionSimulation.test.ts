import { describe,it,expect } from "vitest";
import { simulateConvention, type ConventionInput } from "./conventionSimulation";
import { CONVENTIONS } from "@/lib/data/harmonie/conventions";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const input:ConventionInput={idcc:"405",year:2026,level:"Option 1",benefit:"honoraires-dptm",billed:300,brss:100,amo:80,eligible:true};
describe("Conventions 2026 sans mélange",()=>{
 it("n'ajoute pas la Base au taux de l'option 405",()=>{expect(simulateConvention(input)).toEqual({rate:220,totalCeiling:220,amc:140,rac:80})});
 it("utilise le taux distinct EPI et plafonne aux frais",()=>{expect(simulateConvention({...input,idcc:"2691",level:"B"}).amc).toBe(70);expect(simulateConvention({...input,billed:100}).amc).toBe(20)});
 it.each([{idcc:"405",level:"B"},{idcc:"2691",level:"Option 1"},{idcc:"PSI"},{year:2025},{idcc:"2691",level:"A",benefit:"sejour-conventionne"}])("refuse une combinaison hors source %j",patch=>{expect(()=>simulateConvention({...input,...patch})).toThrow()});
 it.each([NaN,Infinity,-1])("refuse les montants invalides %s",billed=>{expect(()=>simulateConvention({...input,billed})).toThrow()});
 it("bloque un dossier sans conditions validées ou une AMO incohérente",()=>{expect(()=>simulateConvention({...input,eligible:false})).toThrow();expect(()=>simulateConvention({...input,amo:101})).toThrow()});
 it("conserve les PDF sources et le nombre de colonnes",()=>{const manifest=JSON.parse(readFileSync('data/sources/harmonie/2026/manifest.json','utf8'));for(const c of CONVENTIONS){expect(c.benefits.every(b=>b.rates.length===c.levels.length)).toBe(true);const hash=createHash('sha256').update(readFileSync(`data/sources/harmonie/2026/${c.file}`)).digest('hex');expect(hash).toBe(manifest[c.idcc].sha256)}});
});
