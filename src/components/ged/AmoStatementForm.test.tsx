// @vitest-environment jsdom
import { afterEach,it,expect,vi } from "vitest";
import { cleanup,render,screen,fireEvent,waitFor } from "@testing-library/react";
import { AmoStatementForm } from "./AmoStatementForm";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("resolves only on preparation and requires a preview before generation",async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({fund:{name:"Caisse à vérifier",address:["Adresse à vérifier"],source:"Vérification requise"}})});vi.stubGlobal("fetch",fetcher);
 render(<AmoStatementForm caseId="CASE-001" householdId="FOY-001" members={[{id:"m",name:"Titulaire"},{id:"b",name:"Enfant"}]} target="b" domicile="Domicile fictif" hasNir existing={[]}/>);
 fireEvent.click(screen.getByText("Générer le décompte Assurance Maladie"));
 fireEvent.change(screen.getByLabelText("Nature de prestation"),{target:{value:"Dentaire"}});expect(fetcher).not.toHaveBeenCalled();
 fireEvent.submit(screen.getByRole("button",{name:"Préparer le décompte"}).closest("form")!);
 await waitFor(()=>expect(screen.getByRole("region",{name:"Résumé avant génération"})).toBeTruthy());
 expect(fetcher).toHaveBeenCalledTimes(1);expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({operation:"preview",caseId:"CASE-001",memberId:"b"});
 fireEvent.click(screen.getByRole("button",{name:"Confirmer et générer le PDF"}));await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(2));
 expect(JSON.parse(fetcher.mock.calls[1][1].body)).not.toHaveProperty("operation");
});
