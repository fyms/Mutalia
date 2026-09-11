import { beforeAll,afterAll,expect,it,vi } from "vitest";
import fs from "node:fs";import os from "node:os";import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppointmentInputSchema,endTime,agendaDates,upcomingAppointments } from "./appointments";
vi.mock("server-only",()=>({}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"mutalia-agenda-"));
let store:typeof import("../store/runtimeStore");let service:typeof import("./appointmentService");let db:typeof import("../db").db;let households:typeof import("./households");
let input:{householdId:string;date:string;startTime:string;durationMinutes:number;type:"Téléphone";reason:string;status:"Planifié";notes:string};
beforeAll(async()=>{process.env.MUTALIA_DATA_DIR=dir;db=(await import("../db")).db;store=await import("../store/runtimeStore");service=await import("./appointmentService");households=await import("./households");input={householdId:households.getAllHouseholds()[0].householdId,date:"2026-01-05",startTime:"09:00",durationMinutes:30,type:"Téléphone",reason:"Point adhésion",status:"Planifié",notes:"Documents à préparer"};});
afterAll(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
it("requires valid date and HH:mm, validates durations and disallows midnight overflow",()=>{
 for(const bad of [{date:""},{date:"2026-02-30"},{startTime:""},{startTime:"9:00"},{startTime:"24:00"},{startTime:"23:45",durationMinutes:30},{durationMinutes:20}])expect(AppointmentInputSchema.safeParse({...input,...bad}).success).toBe(false);
 expect(endTime("09:45",90)).toBe("11:15");
});
it("persists account-scoped appointments with ordered dates and revision-controlled moves",()=>{
 const p=service.saveAppointment("create",input);expect(store.getAppointments("create")[0]).toEqual(p);expect(store.getAppointments("other")).toEqual([]);
 const moved=service.saveAppointment("create",{...input,date:"2026-01-06",startTime:"14:15",durationMinutes:45},p.id,p.revision);
 expect(moved).toMatchObject({id:p.id,createdAt:p.createdAt,revision:2,startTime:"14:15",durationMinutes:45});
 expect(()=>service.saveAppointment("other",input,p.id,2)).toThrow();expect(()=>service.saveAppointment("create",input,p.id,1)).toThrow();
 const earlier=service.saveAppointment("create",{...input,startTime:"08:00"});expect(store.getAppointments("create").map(p=>p.id)).toEqual([earlier.id,moved.id]);
 const row=db.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get("create") as {payload:string};expect(JSON.parse(row.payload).appointments[moved.id]).toEqual(moved);
});
it("requires explicit current overlap confirmation and leaves both appointments intact",()=>{
 const first=service.saveAppointment("overlap",input);let token="";
 try{service.saveAppointment("overlap",{...input,startTime:"09:15"});}catch(e){expect(e).toBeInstanceOf(store.AppointmentOverlapError);token=(e as InstanceType<typeof store.AppointmentOverlapError>).confirmation;}
 expect(store.getAppointments("overlap")).toHaveLength(1);
 const second=service.saveAppointment("overlap",{...input,startTime:"09:15"},undefined,undefined,token);expect(store.getAppointments("overlap")).toHaveLength(2);
 expect(()=>service.saveAppointment("overlap",{...input,startTime:"09:15"},undefined,undefined,token)).toThrow("Chevauchement");
 service.saveAppointment("overlap",{...input,startTime:"09:45"});
 expect(store.getAppointments("overlap").find(p=>p.id===first.id)).toEqual(first);expect(second.id).not.toBe(first.id);
});
it("cancels without deletion and permits the freed time slot",()=>{
 const p=service.saveAppointment("cancel",input);const cancelled=service.saveAppointment("cancel",{...input,status:"Annulé"},p.id,p.revision);
 expect(cancelled.status).toBe("Annulé");service.saveAppointment("cancel",input);expect(store.getAppointments("cancel")).toHaveLength(2);
});
it("manually converts a completed appointment exactly once through existing contacts",()=>{
 const p=service.saveAppointment("contact",{...input,status:"Réalisé"});const c=service.appointmentToContact("contact",p.id,p.revision);
 expect(c).toMatchObject({channel:"Appel",householdId:input.householdId,reason:input.reason});expect(store.getContacts("contact")).toHaveLength(1);
 expect(store.getAppointments("contact")[0].contactId).toBe(c.id);expect(()=>service.appointmentToContact("contact",p.id,2)).toThrow("déjà converti");expect(store.getContacts("contact")).toHaveLength(1);
 const planned=service.saveAppointment("not-done",input);expect(()=>service.appointmentToContact("not-done",planned.id,1)).toThrow("non réalisé");
});
it("blocks new active appointments after closure while preserving histories and seeds",()=>{
 const before=JSON.stringify(households.getAllHouseholds());const p=service.saveAppointment("closed",input);
 store.changeHouseholdLifecycle("closed",input.householdId,0,null,{status:"terminated",endDate:"2026-01-06",endReason:"termination"});
 expect(()=>service.saveAppointment("closed",{...input,date:"2026-01-07"})).toThrow("clôturé");
 expect(store.getAppointments("closed")).toEqual([p]);expect(JSON.stringify(households.getAllHouseholds())).toBe(before);
 expect(()=>service.saveAppointment("closed",{...input,status:"Annulé"},p.id,1)).not.toThrow();
});
it("exposes next appointments in 360 and cockpit and past entries in the history",async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date("2026-01-05T07:00:00Z"));
 try{const {AppointmentSummary}=await import("@/components/agenda/AppointmentSummary");service.saveAppointment("summary",input);
 const cockpit=renderToStaticMarkup(<AppointmentSummary owner="summary"/>);expect(cockpit).toContain("Mes prochains rendez-vous");expect(cockpit).toContain("09:00");expect(cockpit).toContain(input.reason);
 const detail=renderToStaticMarkup(<AppointmentSummary owner="summary" householdId={input.householdId}/>);expect(detail).toContain("Planifier un rendez-vous");expect(detail).toContain(`/agenda?householdId=${input.householdId}`);
 vi.setSystemTime(new Date("2026-01-06T12:00:00Z"));const history=renderToStaticMarkup(<AppointmentSummary owner="summary" householdId={input.householdId} history/>);expect(history).toContain(input.reason);expect(upcomingAppointments(store.getAppointments("summary"))).toEqual([]);
 }finally{vi.useRealTimers();}
});
it("generates Monday-to-Sunday weeks and full calendar months",()=>{expect(agendaDates("2026-01-07","week")).toEqual(["2026-01-05","2026-01-06","2026-01-07","2026-01-08","2026-01-09","2026-01-10","2026-01-11"]);expect(agendaDates("2026-02-14","month")).toHaveLength(28);});
