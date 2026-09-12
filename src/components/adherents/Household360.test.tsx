// @vitest-environment jsdom
import { afterEach,expect,it,vi } from "vitest";
import { cleanup,render,screen,within } from "@testing-library/react";
import { Household360,householdTab } from "./Household360";
import { householdTimeline } from "./householdTimeline";
import type { HouseholdView } from "@/lib/domain/households";
import type { CockpitData } from "@/components/cockpit/Cockpit";
import { emptyLifecycle } from "@/lib/domain/householdLifecycle";
vi.mock("@/lib/store/runtimeDocuments",()=>({documentEvents:()=>[],listRuntimeDocuments:()=>[]}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/lib/domain/householdActions",()=>({lifecycleAction:vi.fn(),editHouseholdAction:vi.fn(),createHouseholdAction:vi.fn()}));
vi.mock("@/lib/store/runtimeStore",()=>({getDocumentState:()=>({}),getSubmissions:()=>[]}));
vi.mock("@/lib/domain/householdFormulas",()=>({getHouseholdFormulas:()=>[{key:"regime_general:PSI 111",formula:"PSI 111",label:"Régime général — PSI 111"}]}));
vi.mock("@/components/relation/RelationHistory",()=>({RelationHistory:()=> <p>Relation existante</p>}));
vi.mock("@/components/cotisations/CotisationHistory",()=>({CotisationHistory:()=> <p>Cotisations existantes</p>}));
vi.mock("@/components/prestations/PrestationHistory",()=>({PrestationHistory:()=> <p>Prestations existantes</p>}));
vi.mock("@/components/devisPec/DevisPecHistory",()=>({DevisPecHistory:()=> <p>PEC existantes</p>}));
vi.mock("@/components/prestations/PrestationForm",()=>({PrestationForm:()=> <p>Formulaire existant</p>}));
const data:CockpitData={dossiers:[],anomalies:[],appointments:[],prestations:[],complaints:[],quotes:[],cotisations:[],contacts:[]};
const adherent={member_id:"m",first_name:"Camille",last_name:"Exemple",birth_date:"1980-01-01",role:"adherent" as const};
const child={member_id:"b",first_name:"Alex",last_name:"Exemple",birth_date:"2005-01-01",role:"enfant" as const};
const manual:HouseholdView={householdId:"h",case:null,household:{household_id:"h",members:[adherent,child]},adherent,beneficiaries:[child],assignedFormula:"PSI 111",starsSoins:"Donnée 2026 à vérifier",starsEquipements:"Donnée 2026 à vérifier",manual:{id:"h",memberId:"m",source:"manual",referenceYear:2026,createdAt:"2026-01-01T10:00:00Z",updatedAt:"2026-01-01T10:00:00Z",revision:1,deletedAt:null,firstName:"Camille",lastName:"Exemple",birthDate:"1980-01-01",email:"test@example.invalid",phone:"0100000000",address:"Rue Exemple",postalCode:"75001",city:"Paris",effectiveDate:"2026-01-01",formulaKey:"regime_general:PSI 111"}};
afterEach(cleanup);
it("presents identity, coverage, contacts and existing quick actions together",()=>{
 render(<Household360 owner="a" household={manual} data={data}/>);
 const header=within(screen.getByRole("banner",{name:"En-tête adhérent"}));expect(header.getByRole("heading",{name:"Camille Exemple"})).toBeTruthy();expect(header.getByText(/Adhérent n° m/)).toBeTruthy();expect(header.getByRole("link",{name:"test@example.invalid"})).toBeTruthy();
 const actions=within(screen.getByRole("navigation",{name:"Actions rapides adhérent"}));expect(actions.getByRole("link",{name:"Modifier"}).getAttribute("href")).toContain("action=edit");expect(actions.getByRole("link",{name:"Nouveau contact"}).getAttribute("href")).toContain("action=contact");
 expect(screen.getByRole("link",{name:"Synthèse"}).getAttribute("aria-current")).toBe("page");
});
it("preserves closed members and separates inactive beneficiaries without a deletion action",()=>{
 const lifecycle=emptyLifecycle();lifecycle.adherent={status:"archived",endDate:"2026-01-02",endReason:"error",history:[]};lifecycle.beneficiaries.b={status:"inactive",endDate:"2026-01-02",endReason:"divorce",history:[]};
 render(<Household360 owner="a" household={{...manual,lifecycle}} data={data} tab="beneficiaires"/>);
 expect(screen.getAllByText("Archivé").length).toBeGreaterThan(0);expect(screen.getByText("Inactif")).toBeTruthy();expect(screen.getByText(/Divorce/)).toBeTruthy();expect(screen.getByText("Alex Exemple")).toBeTruthy();expect(screen.queryByText(/Supprimer/)).toBeNull();
});
it("retains old tab links and existing history modules",()=>{
 expect(householdTab("contrat")).toBe("vue-generale");expect(householdTab("pec")).toBe("prestations");
 render(<Household360 owner="a" household={manual} data={data} tab="pec"/>);expect(screen.getByText("Prestations existantes")).toBeTruthy();expect(screen.getByText("PEC existantes")).toBeTruthy();
});
it("keeps missing source fields explicit and labels simulation editing",()=>{
 const seed:HouseholdView={...manual,case:{case_id:"case",difficulty:"debutant",scenario_type:"test",household:manual.household,target_beneficiary_id:"b",contract:{provider:"Harmonie Mutuelle",year:2026,exercise_formula:"PSI 111",status:"Actif"},documents:[],objectives:[],visible_in_learner_mode:true}};
 render(<Household360 owner="a" household={seed} data={data}/>);expect(screen.getByText("Non renseignée")).toBeTruthy();expect(screen.queryByRole("link",{name:"Modifier"})).toBeNull();expect(screen.getByRole("link",{name:"Ajouter un bénéficiaire"})).toBeTruthy();expect(screen.getByRole("link",{name:"Modifier le dossier de simulation"})).toBeTruthy();
});
it("merges chronologically, preserves date-only events and removes exact repetitions and other households",()=>{
 const at="2026-09-10T10:00:00Z";const lifecycle=emptyLifecycle();lifecycle.beneficiaries.b={status:"inactive",endDate:"2026-09-10",endReason:"detached",history:[{status:"inactive",endDate:"2026-09-10",endReason:"detached",at}]};
 const contact={id:"c",householdId:"h",adherentName:"Camille",date:"2026-09-09",channel:"Appel" as const,reason:"Suivi",summary:"Résumé",nextAction:"",createdAt:at};
 const records:CockpitData={...data,contacts:[contact,contact,{...contact,id:"other",householdId:"other"}],appointments:[{id:"rdv",householdId:"h",adherentName:"Camille",date:"2026-09-11",startTime:"09:00",durationMinutes:30,type:"Téléphone",reason:"Rappel",status:"Planifié",notes:"",createdAt:at,updatedAt:at,revision:1}]};
 const before=JSON.stringify(records);const events=householdTimeline(records,"h",lifecycle,{b:"Alex"},"2026-01-01T10:00:00Z");
 expect(events).toHaveLength(4);expect(new Set(events.map(e=>e.id)).size).toBe(4);expect(events.map(e=>e.at)).toEqual([...events.map(e=>e.at)].sort().reverse());expect(events.find(e=>e.type==="Appel")?.at).toBe("2026-09-09");expect(events.some(e=>e.summary.includes("Alex"))).toBe(true);expect(JSON.stringify(records)).toBe(before);
});
it("includes all available operational histories and skips only duplicate source dossier events",()=>{
 const at="2026-09-10T10:00:00Z",later="2026-09-11T10:00:00Z";
 const records:CockpitData={...data,
 prestations:[{id:"p",householdId:"h",dossierId:"dp",act:"Consultation",createdAt:at,history:[{at,status:"Reçue",event:"Réception"},{at:later,status:"À contrôler",event:"Contrôle"}]} as CockpitData["prestations"][number]],
 quotes:[{id:"q",householdId:"h",dossierId:"dq",act:"Devis",createdAt:at,history:[{at,status:"Reçu",event:"Réception"}]} as CockpitData["quotes"][number]],
 complaints:[{id:"r",householdId:"h",dossierId:"dr",reason:"Suivi",history:[{at,status:"Nouvelle",priority:"Normal",response:""}]} as CockpitData["complaints"][number]],
 cotisations:[{id:"cot",householdId:"h",createdAt:at,period:"2026-09",entries:[{id:"payment",date:"2026-09-11",createdAt:later,kind:"payment",reason:"Règlement",cents:100}]} as CockpitData["cotisations"][number]],
 dossiers:[{id:"dp",householdId:"h",createdAt:at,updatedAt:later,status:"À traiter",type:"Source"},{id:"independent",householdId:"h",createdAt:at,status:"En attente",type:"Pièces"}] as CockpitData["dossiers"]};
 const events=householdTimeline(records,"h");
 expect(events.map(e=>e.type)).toEqual(expect.arrayContaining(["Prestation","PEC / Devis","Cotisation","Réclamation","Dossier"]));
 expect(events.filter(e=>e.href==="/dossiers#dp")).toHaveLength(0);expect(events.filter(e=>e.type==="Prestation")).toHaveLength(2);
 expect(events.filter(e=>e.type==="Cotisation")).toHaveLength(2);
});

it("links document upload to the existing GED with the correct household",()=>{
 render(<Household360 owner="a" household={manual} data={data} tab="documents"/>);
 expect(screen.getByRole("link",{name:"Ajouter un document"}).getAttribute("href")).toBe("/documents?householdId=h&import=1");
});
