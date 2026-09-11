// @vitest-environment jsdom
import { afterEach,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { Agenda } from "./Agenda";
import { saveAppointmentAction } from "@/lib/domain/appointmentActions";
vi.mock("@/lib/domain/prospectActions",()=>({saveProspectAction:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/lib/domain/appointmentActions",()=>({saveAppointmentAction:vi.fn(),appointmentContactAction:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it("defaults to weekly time slots and requires explicit overlap confirmation",async()=>{
 vi.mocked(saveAppointmentAction).mockResolvedValueOnce({error:"Chevauchement",confirmation:"token",conflicts:["09:00 · Autre rendez-vous"]}).mockResolvedValueOnce({});
 render(<Agenda rows={[]} households={[{id:"h",name:"Adhérent exemple"}]} householdId="h"/>);
 expect(screen.getByRole("button",{name:"Semaine"}).getAttribute("aria-pressed")).toBe("true");
 expect(screen.getByLabelText("Créneaux de la semaine")).toBeTruthy();
 fireEvent.change(screen.getByLabelText("Motif"),{target:{value:"Point dossier"}});
 fireEvent.submit(screen.getByRole("form",{name:"Rendez-vous"}));
 await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("Chevauchement"));
 expect(saveAppointmentAction).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("checkbox"));
 fireEvent.submit(screen.getByRole("form",{name:"Rendez-vous"}));
 await waitFor(()=>expect(saveAppointmentAction).toHaveBeenLastCalledWith(expect.objectContaining({startTime:"09:00",durationMinutes:30,householdId:"h"}),undefined,undefined,"token"));
});
it("recalculates end time on duration changes",()=>{
 render(<Agenda rows={[]} households={[]} householdId="h"/>);
 fireEvent.change(screen.getByLabelText("Heure de début"),{target:{value:"10:15"}});
 fireEvent.change(screen.getByLabelText("Durée"),{target:{value:"90"}});
 expect(screen.getByText("Heure de fin : 11:45")).toBeTruthy();
});

it("creates a quick prospect and uses its id for the appointment",async()=>{
 const {saveProspectAction}=await import("@/lib/domain/prospectActions");
 vi.mocked(saveProspectAction).mockResolvedValue({prospect:{id:"p",firstName:"Alice",lastName:"Test",phone:"0100000000",email:"a@example.invalid",createdAt:"",updatedAt:"",revision:1,status:"actif"}});
 vi.mocked(saveAppointmentAction).mockResolvedValue({});
 render(<Agenda rows={[]} households={[]}/>);fireEvent.click(screen.getByText("Planifier un rendez-vous"));
 fireEvent.change(screen.getByLabelText("Type de contact"),{target:{value:"prospect"}});fireEvent.click(screen.getByText("Créer un prospect"));
 fireEvent.click(screen.getByText("Enregistrer le prospect"));
 await waitFor(()=>expect(screen.getByRole("option",{name:"Alice Test"})).toBeTruthy());
 fireEvent.submit(screen.getByRole("form",{name:"Rendez-vous"}));
 await waitFor(()=>expect(saveAppointmentAction).toHaveBeenCalledWith(expect.objectContaining({contactType:"prospect",prospectId:"p",householdId:"",reason:"Découverte des besoins"}),undefined,undefined,undefined));
});
