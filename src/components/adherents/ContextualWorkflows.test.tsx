// @vitest-environment jsdom
import { afterEach,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { HouseholdDocumentPanel } from "./HouseholdDocumentPanel";
import { HouseholdAppointment } from "./HouseholdAppointment";
import { saveAppointmentAction } from "@/lib/domain/appointmentActions";
const {refresh}=vi.hoisted(()=>({refresh:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh})}));
vi.mock("@/lib/domain/appointmentActions",()=>({saveAppointmentAction:vi.fn()}));
vi.mock("@/lib/domain/prospectActions",()=>({saveProspectAction:vi.fn()}));
vi.mock("@/components/ged/DocumentViewer",()=>({DocumentViewer:({runtimeDocument}:{runtimeDocument:{originalFileName:string}})=><p>Aperçu {runtimeDocument.originalFileName}</p>}));
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});
it.each([['audit.pdf','application/pdf'],['audit.png','image/png']])("imports %s with existing API and displays refreshed contextual preview",async(name,type)=>{
 const doc={id:"doc",householdId:"h",beneficiaryId:"m",originalFileName:name,documentType:"justificatif",source:"uploaded" as const,documentDate:"2026-09-13",mimeType:type,size:5,status:"a_qualifier" as const,createdAt:"2026-09-13",note:""};
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>doc});vi.stubGlobal("fetch",fetcher);
 const props={householdId:"h",members:[{id:"m",name:"Camille"}],documents:[],states:{},runtimeDocuments:[]};
 const view=render(<HouseholdDocumentPanel {...props}/>);
 fireEvent.click(screen.getByText("+ Ajouter un document"));
 fireEvent.change(screen.getByLabelText(/Fichier ·/),{target:{files:[new File(['demo'],name,{type})]}});
 fireEvent.submit(screen.getByRole("form",{name:"Importer un document fictif"}));
 await waitFor(()=>expect(refresh).toHaveBeenCalled());
 expect(fetcher.mock.calls[0][0]).toBe('/api/runtime-documents');expect(fetcher.mock.calls[0][1].body.get('householdId')).toBe('h');
 view.rerender(<HouseholdDocumentPanel {...props} runtimeDocuments={[doc]}/>);
 fireEvent.click(screen.getByRole('button',{name:`Voir ${name}`}));expect(screen.getByText(`Aperçu ${name}`)).toBeTruthy();
 fireEvent.click(screen.getByText('← Fermer le document'));expect(screen.getByRole('button',{name:`Voir ${name}`})).toBeTruthy();expect(screen.queryByRole('link')).toBeNull();
});
it("locks the household, preserves overlap confirmation, closes and refreshes only after save",async()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 vi.mocked(saveAppointmentAction).mockResolvedValueOnce({error:'Chevauchement',confirmation:'token',conflicts:['09:00']}).mockResolvedValueOnce({});
 render(<HouseholdAppointment householdId="h" name="Camille"/>);fireEvent.click(screen.getByText('Planifier un rendez-vous'));
 expect((screen.getByLabelText('Adhérent') as HTMLSelectElement).value).toBe('h');expect((screen.getByLabelText('Adhérent') as HTMLSelectElement).disabled).toBe(true);expect((screen.getByLabelText('Type de contact') as HTMLSelectElement).disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Motif'),{target:{value:'Suivi dossier'}});fireEvent.submit(screen.getByRole('form',{name:'Rendez-vous'}));
 await waitFor(()=>expect(screen.getByText('Chevauchement')).toBeTruthy());expect(refresh).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.submit(screen.getByRole('form',{name:'Rendez-vous'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toBe('Rendez-vous enregistré.'));expect(saveAppointmentAction).toHaveBeenLastCalledWith(expect.objectContaining({householdId:'h',contactType:'adherent'}),undefined,undefined,'token');expect(refresh).toHaveBeenCalledOnce();expect(screen.queryByRole('form')).toBeNull();
});
