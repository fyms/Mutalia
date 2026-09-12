// @vitest-environment jsdom
import { afterEach,it,expect,vi } from "vitest";
import { cleanup,render,screen,fireEvent } from "@testing-library/react";
import { GedWorkspace } from "./GedWorkspace";
import type { TrainingCase } from "@/lib/domain/types";
import type { RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("./DocumentViewer",()=>({DocumentViewer:(p:{runtimeDocument?:RuntimeDocumentView})=><p>{p.runtimeDocument?`Aperçu ${p.runtimeDocument.source}`:"Aperçu source"}</p>}));
vi.mock("@/components/cases/CaseSubmissionForm",()=>({CaseSubmissionForm:()=>null}));
afterEach(cleanup);
const c:TrainingCase={case_id:"CASE-001",difficulty:"debutant",scenario_type:"test",household:{household_id:"h",members:[{member_id:"m",first_name:"Alex",last_name:"Démo",birth_date:"1980-01-01",role:"adherent"}]},target_beneficiary_id:"m",contract:{provider:"Harmonie",year:2026,exercise_formula:"PSI",status:"Actif"},documents:[{document_id:"source",case_id:"CASE-001",document_type:"decompte_amo",file_name:"source.pdf",status:"a_qualifier",anomalies:[]}],objectives:[],visible_in_learner_mode:true};
const document:RuntimeDocumentView={id:"upload",householdId:"h",beneficiaryId:"m",documentType:"facture_acquittee",originalFileName:"facture.pdf",mimeType:"application/pdf",size:100,documentDate:"2026-09-12",note:"",source:"uploaded",status:"a_qualifier",createdAt:"2026-09-12"};
it("shows case, generated and uploaded pieces in one selector and opens the same import form",()=>{
 render(<GedWorkspace trainingCase={c} states={{}} draft={null} feedback={null} author="Démo" runtimeDocuments={[document,{...document,id:"generated",source:"generated",originalFileName:"généré.pdf"}]}/>);
 expect(screen.getByText("Cas pratique")).toBeTruthy();expect(screen.getByText("Importé")).toBeTruthy();expect(screen.getByText("Généré")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/facture.pdf/}));expect(screen.getByText("Aperçu uploaded")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/généré.pdf/}));expect(screen.getByText("Aperçu generated")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"+ Importer un document"}));expect(screen.getByRole("form",{name:"Importer un document fictif"})).toBeTruthy();
});
it("supports an empty manual household with the import shortcut",()=>{
 render(<GedWorkspace states={{}} draft={null} feedback={null} author="Démo" household={{id:"manual",members:[]}} initialImport/>);
 expect(screen.getByRole("form",{name:"Importer un document fictif"})).toBeTruthy();expect(screen.getByText("Aucune pièce dans ce dossier.")).toBeTruthy();
});
