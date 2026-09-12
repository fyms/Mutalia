import { z } from "zod";
export const DEMO_NIR_NOTICE = "Donnée fictive — environnement pédagogique";
export const normalizeDemoNir = (value:string) => value.replace(/[\s-]/g, "").toUpperCase();
export const DemoSocialSecuritySchema = z.string().max(50).transform(normalizeDemoNir)
 .refine(value => value === "" || /^DEMO\d{15}$/.test(value), "Utilisez DEMO suivi de 15 chiffres fictifs. Aucun NIR réel accepté.").optional();
export function generateDemoSocialSecurityNumber():string {
 const digits = crypto.getRandomValues(new Uint8Array(15));
 return `DEMO${Array.from(digits,n=>n%10).join("")}`;
}
export function maskDemoSocialSecurityNumber(value?:string):string {
 return value ? `DEMO ••• ••• ••• •• ${normalizeDemoNir(value).slice(-4)}` : "Non renseigné";
}
