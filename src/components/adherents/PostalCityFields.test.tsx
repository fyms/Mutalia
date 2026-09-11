// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PostalCityFields } from "./PostalCityFields";
const response = (rows: {nom: string; code: string}[]) => ({ok: true, json: async () => rows});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});
it("waits for five digits and selects a single commune", async () => {
 const fetcher = vi.fn().mockResolvedValue(response([{nom:"Commune unique",code:"001"}])); vi.stubGlobal("fetch",fetcher);
 render(<PostalCityFields/>);
 fireEvent.change(screen.getByLabelText("Code postal"), {target:{value:"1234"}});
 expect(fetcher).not.toHaveBeenCalled(); expect((screen.getByLabelText("Ville") as HTMLSelectElement).disabled).toBe(true);
 fireEvent.change(screen.getByLabelText("Code postal"), {target:{value:"12345"}});
 await waitFor(() => expect((screen.getByLabelText("Ville") as HTMLSelectElement).value).toBe("Commune unique"));
 expect(fetcher).toHaveBeenCalledTimes(1);
 expect(fetcher.mock.calls[0][0]).toBe("/api/communes?codePostal=12345");
});
it("requires a choice for multiple communes and clears it on postal change", async () => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(response([{nom:"Alpha",code:"001"},{nom:"Beta",code:"002"}])));
 render(<PostalCityFields postalCode="12345"/>);
 await screen.findByRole("option",{name:"Beta"});
 expect((screen.getByLabelText("Ville") as HTMLSelectElement).value).toBe("");
 fireEvent.change(screen.getByLabelText("Ville"),{target:{value:"Beta"}});
 fireEvent.change(screen.getByLabelText("Code postal"),{target:{value:"5432"}});
 expect((screen.getByLabelText("Ville") as HTMLSelectElement).value).toBe("");
 expect(screen.queryByRole("option",{name:"Beta"})).toBeNull();
});
it("preserves an existing city while loading its list, including legacy names", async () => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(response([{nom:"Autre commune",code:"001"}])));
 render(<PostalCityFields postalCode="12345" city="Ville enregistrée"/>);
 await screen.findByRole("option",{name:"Autre commune"});
 expect((screen.getByLabelText("Ville") as HTMLSelectElement).value).toBe("Ville enregistrée");
});
it.each([false,true])("allows explicit manual fallback for empty result / unavailable API (%s)", async unavailable => {
 vi.stubGlobal("fetch",unavailable ? vi.fn().mockRejectedValue(new Error("offline")) : vi.fn().mockResolvedValue(response([])));
 render(<PostalCityFields postalCode="00000"/>);
 fireEvent.click(await screen.findByRole("button",{name:"Saisir la ville manuellement"}));
 expect(screen.getByRole("status").textContent).toBe(unavailable ? "Service des communes temporairement indisponible" : "Aucune commune trouvée pour ce code postal.");
 fireEvent.change(screen.getByRole("textbox",{name:"Ville"}),{target:{value:"Ville de secours"}});
 expect((screen.getByLabelText("Ville") as HTMLInputElement).value).toBe("Ville de secours");
 expect(screen.getByLabelText("Ville").getAttribute("name")).toBe("city");
});
it("ignores a late response from the previous postal code", async () => {
 let resolveOld!: (value: ReturnType<typeof response>) => void;
 vi.stubGlobal("fetch",vi.fn().mockReturnValueOnce(new Promise(resolve => {resolveOld=resolve;})).mockResolvedValueOnce(response([{nom:"Nouvelle",code:"002"}])));
 render(<PostalCityFields postalCode="12345"/>);
 fireEvent.change(screen.getByLabelText("Code postal"),{target:{value:"54321"}});
 await screen.findByRole("option",{name:"Nouvelle"});
 resolveOld(response([{nom:"Ancienne",code:"001"}]));
 await waitFor(() => expect((screen.getByLabelText("Ville") as HTMLSelectElement).value).toBe("Nouvelle"));
 expect(screen.queryByRole("option",{name:"Ancienne"})).toBeNull();
});
