// @vitest-environment jsdom
import {afterEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {ProspectsPanel} from "./ProspectsPanel";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/lib/domain/prospectActions",()=>({saveProspectAction:vi.fn()}));
afterEach(cleanup);
it("presents prospects in a labelled table and preserves filtering and actions",()=>{
 const p={id:"p",firstName:"Alice",lastName:"Exemple",phone:"0100000000",email:"alice@example.invalid",status:"actif" as const,createdAt:"",updatedAt:"",revision:1};
 render(<ProspectsPanel prospects={[p,{...p,id:"other",firstName:"Ancien",status:"abandonné"}]} appointments={[]}/>);
 const table=within(screen.getByRole("table",{name:"Prospects"}));expect(table.getAllByRole("columnheader").map(h=>h.textContent)).toEqual(["Prospect","Coordonnées","Intérêt / motif","Prochain RDV","Statut","Actions"]);
 fireEvent.click(screen.getByLabelText("Actions pour Alice Exemple"));
 expect(table.getByRole("link",{name:"Convertir en adhérent"}).getAttribute("href")).toBe("/adherents/nouveau?prospectId=p");
 expect(table.getByRole("link",{name:"Planifier un rendez-vous"}).getAttribute("href")).toBe("/agenda?prospectId=p");
 fireEvent.change(screen.getByLabelText("Statut"),{target:{value:"actif"}});expect(screen.queryByText("Ancien Exemple")).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Modifier"}));expect(screen.getByLabelText("Prénom").getAttribute("value")).toBe("Alice");
});
