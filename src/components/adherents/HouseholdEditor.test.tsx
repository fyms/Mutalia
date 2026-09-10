// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HouseholdEditor } from "./HouseholdEditor";
import { editHouseholdAction } from "@/lib/domain/householdActions";
import type { ManualHousehold } from "@/lib/domain/manualHouseholds";
vi.mock("next/navigation", () => ({useRouter: () => ({refresh: vi.fn()})}));
vi.mock("@/lib/domain/householdActions", () => ({editHouseholdAction: vi.fn(async () => ({})), createHouseholdAction: vi.fn()}));
const record: ManualHousehold = {
  id: "manual", memberId: "primary", source: "manual", referenceYear: 2026,
  firstName: "Camille", lastName: "Exemple", birthDate: "1990-01-01",
  email: "camille@example.invalid", phone: "0100000000", address: "10 rue Exemple",
  postalCode: "75001", city: "Paris", effectiveDate: "2026-01-01", formulaKey: "existing",
  createdAt: "2026-01-01", updatedAt: "2026-01-01", revision: 3, deletedAt: null,
  beneficiaries: [{id: "child", firstName: "Alex", lastName: "Exemple", birthDate: "2015-01-01", role: "enfant"}],
};
afterEach(() => {cleanup(); vi.clearAllMocks();});
it("does not remove a beneficiary before explicit confirmation and supports cancellation", async () => {
  render(<HouseholdEditor record={record} formulas={[]} />);
  fireEvent.click(screen.getByRole("button", {name: "Retirer Alex Exemple"}));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  expect(editHouseholdAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name: "Annuler"}));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(editHouseholdAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name: "Retirer Alex Exemple"}));
  fireEvent.click(screen.getByRole("button", {name: "Confirmer le retrait"}));
  await waitFor(() => expect(editHouseholdAction).toHaveBeenCalledWith("manual", 3, "remove", "child", expect.any(FormData)));
});
it("reuses the prefilled member form and preserves entered values on conflict", async () => {
  vi.mocked(editHouseholdAction).mockResolvedValueOnce({error: "Conflit de révision"});
  render(<HouseholdEditor record={record} formulas={[{key: "existing", label: "Formule existante"}]} />);
  fireEvent.click(screen.getByRole("button", {name: "Modifier l’adhérent"}));
  expect((screen.getByRole("textbox", {name: "Prénom"}) as HTMLInputElement).value).toBe("Camille");
  fireEvent.change(screen.getByRole("textbox", {name: "Prénom"}), {target: {value: "Lucie"}});
  fireEvent.submit(screen.getByRole("button", {name: "Enregistrer les modifications"}).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Conflit de révision"));
  expect((screen.getByRole("textbox", {name: "Prénom"}) as HTMLInputElement).value).toBe("Lucie");
});
