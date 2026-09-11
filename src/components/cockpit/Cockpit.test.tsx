// @vitest-environment jsdom
import { afterEach,expect,it,vi } from "vitest";
import { cleanup,render,screen,within } from "@testing-library/react";
import { Cockpit,type CockpitData } from "./Cockpit";
const empty:CockpitData={dossiers:[],anomalies:[],appointments:[],prestations:[],complaints:[],quotes:[],cotisations:[],contacts:[]};
const now=new Date("2026-09-11T07:00:00Z");
afterEach(cleanup);
it("shows four actionable indicators and honest empty states without training KPI",()=>{
 render(<Cockpit data={empty} now={now}/>);
 expect(within(screen.getByRole("navigation",{name:"Indicateurs de traitement"})).getAllByRole("link")).toHaveLength(4);
 expect(screen.getByText("Aucun dossier en attente de traitement.")).toBeTruthy();
 expect(screen.queryByText("Cas disponibles")).toBeNull();
 expect(screen.queryByRole("region",{name:"Cotisations à surveiller"})).toBeNull();
});
it("prioritizes open urgent dossiers then age without changing sources or inventing lateness",()=>{
 const base={householdId:"h",type:"Vérification",revision:0,anomaly:null,nextAction:"Contrôler",createdAt:"2026-09-01T00:00:00Z"};
 const data:CockpitData={...empty,dossiers:[{...base,id:"normal",adherent:"Normal",status:"À traiter",priority:"Normal"},{...base,id:"new",adherent:"Urgent récent",status:"Incomplet",priority:"Urgent",createdAt:"2026-09-10T00:00:00Z"},{...base,id:"old",adherent:"Urgent ancien",status:"En attente",priority:"Urgent"},{...base,id:"done",adherent:"Terminé",status:"Terminé",priority:"Urgent"}]};
 const before=JSON.stringify(data);render(<Cockpit data={data} now={now}/>);
 const panel=within(screen.getByRole("region",{name:"À traiter en priorité"}));
 expect(panel.getAllByRole("link",{name:"Contrôler →"}).map(a=>a.getAttribute("href"))).toEqual(["/dossiers#old","/dossiers#new","/dossiers#normal"]);
 expect(panel.queryByText("Terminé")).toBeNull();expect(panel.queryByText("En retard")).toBeNull();expect(JSON.stringify(data)).toBe(before);
});
it("shows unresolved alerts and upcoming appointments with member actions",()=>{
 const a={id:"a",householdId:"h",adherentName:"Adhérent A",date:"2026-09-11",startTime:"10:00",durationMinutes:30,type:"Téléphone" as const,reason:"Point dossier",status:"Confirmé" as const,createdAt:"2026-09-10T10:00:00Z",updatedAt:"2026-09-10T10:00:00Z",revision:1,notes:""};
 const data:CockpitData={...empty,appointments:[a,{...a,id:"cancel",reason:"Annulé futur",status:"Annulé"}],anomalies:[{id:"an",householdId:"h",adherentName:"Adhérent A",dossierId:"d",type:"Contrôle",severity:"Bloquante",status:"À analyser",cause:"Pièce requise",impact:"Calcul bloqué",recommendation:"Vérifier la source",conditionActive:true,createdAt:a.createdAt,updatedAt:a.updatedAt,revision:1,resolution:"",history:[]}]};
 render(<Cockpit data={data} now={now}/>);
 const appointments=within(screen.getByRole("region",{name:"Mes prochains rendez-vous"}));
 expect(appointments.getByText("Aujourd’hui · 10:00–10:30")).toBeTruthy();expect(appointments.queryByText(/Annulé futur/)).toBeNull();expect(appointments.getByRole("link",{name:"Adhérent A"}).getAttribute("href")).toBe("/adherents/h");
 expect(within(screen.getByRole("region",{name:"Alertes / anomalies"})).getByRole("link",{name:"Vérifier la source →"}).getAttribute("href")).toBe("/flux-anomalies#an");
});
it("uses existing arrears computation and orders recorded activity newest first",()=>{
 const data:CockpitData={...empty,cotisations:[{id:"cot",householdId:"h",adherentName:"Cotisant",period:"2026-08",expectedCents:10000,dueDate:"2026-08-31",revision:1,createdAt:"2026-08-01T12:00:00Z",updatedAt:"2026-08-01T12:00:00Z",entries:[]}],contacts:[{id:"contact",householdId:"h",adherentName:"Contact récent",date:"2026-09-10",channel:"Appel",reason:"Suivi adhésion",summary:"Note",nextAction:"",createdAt:"2026-09-10T12:00:00Z"}]};
 render(<Cockpit data={data} now={now}/>);
 expect(within(screen.getByRole("region",{name:"Cotisations à surveiller"})).getByText("Impayée · En retard")).toBeTruthy();
 const activity=within(screen.getByRole("region",{name:"Activité récente"})).getAllByRole("listitem");expect(activity[0].textContent).toContain("Contact récent");expect(activity[1].textContent).toContain("Cotisant");
});
vi.mock("@/lib/store/session",()=>({getSession:async()=>({userId:"account-cockpit"})}));
vi.mock("@/lib/domain/dossierService",()=>({getDossiers:vi.fn(()=>[])}));
vi.mock("@/lib/store/runtimeStore",()=>Object.fromEntries(["getAppointments","getOperationalAnomalies","getPrestations","getComplaints","getDevisPec","getCotisations","getContacts"].map(k=>[k,vi.fn(()=>[])])));
it("loads every cockpit source within the authenticated account",async()=>{
 const Page=(await import("@/app/(shell)/cockpit/page")).default;await Page();
 const store=await import("@/lib/store/runtimeStore");for(const method of [store.getAppointments,store.getOperationalAnomalies,store.getPrestations,store.getComplaints,store.getDevisPec,store.getCotisations,store.getContacts])expect(method).toHaveBeenCalledWith("account-cockpit");
});
