import { afterAll,beforeAll,expect,it,vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { CONTACT_CHANNELS } from "./relationAdherent";
vi.mock("server-only",()=>({}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/store/session",()=>({getSession:vi.fn(async()=>({userId:"a"}))}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-relation-"));
let db:typeof import("../db").db,store:typeof import("../store/runtimeStore"),service:typeof import("./relationService"),dossiers:typeof import("./dossierService");
let householdId:string,memberId:string,otherId:string;
const complaint=()=>({householdId,receivedDate:"2026-01-05",priority:"Normal",reason:"Demande de contrôle",description:"Description pédagogique de la réclamation",linkKey:""});
beforeAll(async()=>{
 process.env.MUTALIA_DATA_DIR=dir;db=(await import("../db")).db;store=await import("../store/runtimeStore");service=await import("./relationService");dossiers=await import("./dossierService");
 const h=(await import("./households")).getAllHouseholds("a");householdId=h[0].householdId;memberId=h[0].adherent.member_id;otherId=h[1].householdId;
});
afterAll(()=>{db?.close();fs.rmSync(dir,{recursive:true,force:true});});
it("persists all contact channels, sorts the timeline and preserves households",async()=>{
 const {getAllHouseholds}=await import("./households");const before=getAllHouseholds("a");
 for(const [i,channel] of CONTACT_CHANNELS.entries())service.createContact("a",{householdId,date:`2026-01-0${i+1}`,channel,reason:"Information",summary:"Résumé pédagogique",nextAction:"Rappeler pour compléter"});
 const rows=store.getContacts("a");expect(rows).toHaveLength(4);expect(rows.map(p=>p.channel)).toEqual([...CONTACT_CHANNELS].reverse());expect(rows[0].nextAction).toContain("Rappeler");
 expect(new Set(rows.map(p=>p.id)).size).toBe(4);expect(getAllHouseholds("a")).toEqual(before);expect(before).toHaveLength(12);
 const other=new Database(path.join(dir,"mutalia.sqlite"),{readonly:true});
 try{const row=other.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("a") as {payload:string};expect(JSON.parse(row.payload).contacts[rows[0].id]).toEqual(rows[0]);}finally{other.close();}
 expect(store.getContacts("b")).toEqual([]);
});
it("follows all complaint stages and synchronizes waiting, priority and closure",()=>{
 let p=service.createComplaint("a",complaint());expect(p.status).toBe("Nouvelle");
 expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("À traiter");
 for(const status of ["À analyser","En cours","En attente adhérent","Résolue","Clôturée"] as const){
 p=service.updateComplaint("a",p.id,p.revision,{status,priority:"Urgent",response:"Réponse pédagogique documentée"});
 const d=dossiers.getDossiers("a").find(d=>d.id===p.dossierId)!;
 expect(d.priority).toBe("Urgent");expect(d.status).toBe(status==="En attente adhérent" ? "En attente" : ["Résolue","Clôturée"].includes(status) ? "Terminé" : "À traiter");
 }
 expect(p.history).toHaveLength(6);expect(dossiers.getDossiers("a").filter(d=>d.id===p.dossierId)).toHaveLength(1);
 expect(()=>service.updateComplaint("a",p.id,p.revision,{status:"En cours",priority:"Normal",response:"Réouverture"})).toThrow("Transition");
 expect(store.getComplaints("a").find(r=>r.id===p.id)).toEqual(p);
});
it("requires resolution and supports reopening before final closure without losing history",()=>{
 let p=service.createComplaint("a",complaint());
 expect(()=>service.updateComplaint("a",p.id,p.revision,{status:"Clôturée",priority:"Normal",response:"Réponse complète"})).toThrow("Transition");
 p=service.updateComplaint("a",p.id,p.revision,{status:"À analyser",priority:"Normal",response:""});
 expect(()=>service.updateComplaint("a",p.id,p.revision,{status:"Résolue",priority:"Normal",response:" "})).toThrow();
 p=service.updateComplaint("a",p.id,p.revision,{status:"Résolue",priority:"Normal",response:"Première résolution motivée"});
 p=service.updateComplaint("a",p.id,p.revision,{status:"En cours",priority:"Urgent",response:"Nouvel élément à contrôler"});
 expect(p.history.some(h=>h.response==="Première résolution motivée")).toBe(true);
 expect(dossiers.getDossiers("a").find(d=>d.id===p.dossierId)?.status).toBe("À traiter");
});
it("validates all four source types and rejects cross-household and cross-account attachments",async()=>{
 const raw={householdId,memberId,act:"Soin fictif",careDate:"2026-01-01",billed:50,brss:30,amoRate:0.7};
 const pre=(await import("./prestationService")).receivePrestation("a",raw);
 const pec=(await import("./devisPecService")).saveDevisPec("a",{...raw,kind:"pec"});
 const cot=(await import("./cotisationService")).createCotisation("a",{householdId,period:"2026-01",amount:100,dueDate:"2026-01-01"});
 for(const key of [`prestation:${pre.id}`,`pec:${pec.id}`,`cotisation:${cot.id}`,`dossier:DOS-${householdId}`]){
 const p=service.createComplaint("a",{...complaint(),linkKey:key});expect(p.link?.key).toBe(key);expect(p.link?.href).toMatch(/^\/(prestations|pec-devis|cotisations|dossiers)#/);
 expect(()=>service.createComplaint("a",{...complaint(),householdId:otherId,linkKey:key})).toThrow("Rattachement");
 }
 expect(()=>service.createComplaint("b",{...complaint(),linkKey:`prestation:${pre.id}`})).toThrow("Rattachement");
 expect(service.getRelationLinks("b").some(l=>l.key===`prestation:${pre.id}`)).toBe(false);
});
it("rejects invalid fields, foreign owners and stale edits without partial persistence",()=>{
 for(const patch of [{householdId:"unknown"},{receivedDate:"2999-01-01"},{priority:"Invalid"},{description:""},{linkKey:"fake"}])expect(()=>service.createComplaint("a",{...complaint(),...patch})).toThrow();
 expect(()=>service.createContact("a",{householdId,date:"2026-01-01",channel:"SMS",reason:"Test",summary:"Test"})).toThrow();
 const p=service.createComplaint("a",complaint());const edit={status:"À analyser",priority:"Normal",response:"Premier contrôle"};
 expect(()=>service.updateComplaint("b",p.id,1,edit)).toThrow("introuvable");expect(store.getComplaints("b")).toEqual([]);
 service.updateComplaint("a",p.id,1,edit);expect(()=>service.updateComplaint("a",p.id,1,edit)).toThrow("autre onglet");
 expect(store.getComplaints("a").find(r=>r.id===p.id)?.history).toHaveLength(2);
});
it("authenticates actions and refreshes all connected pages",async()=>{
 const actions=await import("./relationActions"),{getSession}=await import("../store/session"),{revalidatePath}=await import("next/cache");
 vi.mocked(getSession).mockRejectedValueOnce(new Error("Connexion requise"));await expect(actions.createComplaintAction(complaint())).rejects.toThrow("Connexion requise");
 expect(await actions.createComplaintAction(complaint())).toEqual({});
 expect(await actions.createContactAction({householdId,date:"2026-01-01",channel:"Email",reason:"Information",summary:"Email déjà reçu, consigné uniquement"})).toEqual({});
 for(const route of ["/relation-adherent","/dossiers","/cockpit",`/adherents/${householdId}`])expect(revalidatePath).toHaveBeenCalledWith(route);
 expect(await actions.updateComplaintAction("unknown",1,{status:"À analyser",priority:"Normal",response:""})).toHaveProperty("error");
});
