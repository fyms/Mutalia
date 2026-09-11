// @vitest-environment jsdom
import { afterEach,expect,it } from "vitest";
import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { ReimbursementSimulator } from "./ReimbursementSimulator";
afterEach(cleanup);
it("keeps the dental selection through calculations and another benefit sharing its rate",()=>{
 render(<ReimbursementSimulator/>);
 const select=screen.getByRole("combobox",{name:/Prestation garantie/}) as HTMLSelectElement;
 fireEvent.change(select,{target:{value:"2691:fixes:A"}});
 expect(select.value).toBe("2691:fixes:A");
 fireEvent.change(select,{target:{value:"2691:generaliste-dptm:B"}});
 fireEvent.change(select,{target:{value:"2691:fixes:B"}});
 fireEvent.change(screen.getByRole("textbox",{name:/Montant facturé/}),{target:{value:"440"}});
 fireEvent.change(screen.getByRole("textbox",{name:/Base de remboursement/}),{target:{value:"120"}});
 fireEvent.change(screen.getByRole("combobox",{name:/Taux AMO/}),{target:{value:"personnalise"}});
 fireEvent.change(screen.getByRole("textbox",{name:/Taux AMO personnalisé/}),{target:{value:"60"}});
 expect(select.value).toBe("2691:fixes:B");
 expect(select.selectedOptions[0].textContent).toContain("Prothèse dentaire fixe");
 expect(screen.getByText("Remboursement AMO (60%)").parentElement?.textContent).toMatch(/72[,.]00/);
 expect(screen.getByText("Remboursement AMC").parentElement?.textContent).toMatch(/336[,.]00/);
 expect(screen.getByText("Reste à charge estimé").parentElement?.textContent).toMatch(/32[,.]00/);
});
it("loads the correct mode, retains the menu and hides uncertain AMC and RAC",()=>{
 render(<ReimbursementSimulator/>);
 const select=screen.getByRole("combobox",{name:/Prestation garantie/});
 fireEvent.change(select,{target:{value:"2691:forfait-journalier:B"}});
 expect((screen.getByRole("combobox",{name:/Type de garantie AMC/}) as HTMLSelectElement).value).toBe("frais_reels");
 fireEvent.change(select,{target:{value:"405:implant:Option 1"}});
 expect((screen.getByRole("combobox",{name:/Type de garantie AMC/}) as HTMLSelectElement).value).toBe("forfait_euros");
 expect(screen.queryByText("Remboursement AMC")).toBeNull();
 expect(screen.queryByText("Reste à charge estimé")).toBeNull();
 expect(screen.getByText(/^⚠ Donnée 2026 à vérifier$/)).toBeTruthy();
});
