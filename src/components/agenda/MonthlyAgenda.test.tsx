// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MonthlyAgenda } from "./MonthlyAgenda";
import type { Appointment } from "@/lib/domain/appointments";
afterEach(cleanup);
const base: Appointment = {id:"a",householdId:"h",adherentName:"Camille Exemple",date:"2026-09-11",startTime:"09:00",durationMinutes:30,type:"Téléphone",reason:"Point dossier",status:"Planifié",notes:"",createdAt:"2026-09-01",updatedAt:"2026-09-01",revision:1};
it("aligns Monday-first dates and navigates across year boundaries", () => {
 const change = vi.fn();
 const {container} = render(<MonthlyAgenda date="2026-09-12" rows={[]} onDateChange={change} onEdit={vi.fn()} renderDetail={()=>null}/>);
 expect(screen.getAllByText("Aucun rendez-vous")).toHaveLength(30);
 expect(container.querySelector('[aria-hidden="true"]')?.nextElementSibling?.getAttribute("aria-label")).toBe("mardi 1 septembre 2026");
 fireEvent.click(screen.getByRole("button",{name:"Mois précédent"}));
 expect(change).toHaveBeenLastCalledWith("2026-08-01");
 cleanup();
 render(<MonthlyAgenda date="2026-12-31" rows={[]} onDateChange={change} onEdit={vi.fn()} renderDetail={()=>null}/>);
 fireEvent.click(screen.getByRole("button",{name:"Mois suivant"}));
 expect(change).toHaveBeenLastCalledWith("2027-01-01");
});
it("keeps dense days compact, exposes every appointment and preserves edit targets", () => {
 const edit=vi.fn();
 const rows=[base,{...base,id:"b",contactType:"prospect" as const,prospectId:"p",adherentName:"Alex Prospect",startTime:"10:00"},{...base,id:"c",startTime:"11:00"}];
 render(<MonthlyAgenda date="2026-09-12" rows={rows} onDateChange={vi.fn()} onEdit={edit} renderDetail={item=><span>{item.id}</span>}/>);
 const day=screen.getByRole("region",{name:"vendredi 11 septembre 2026"});
 expect(within(day).getAllByRole("button")).toHaveLength(2);
 expect(within(day).getByText("PROSPECT")).toBeTruthy();
 expect(within(day).getByText("09:00–09:30")).toBeTruthy();
 fireEvent.click(within(day).getAllByRole("button")[1]);
 expect(edit).toHaveBeenCalledWith(rows[1]);
 fireEvent.click(within(day).getByRole("link",{name:/\+ 1 autres/}));
 expect(screen.getByRole("region",{name:"Détail de la journée"}).textContent).toContain("abc");
 expect(rows).toHaveLength(3);
});
