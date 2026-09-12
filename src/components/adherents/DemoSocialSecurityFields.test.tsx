// @vitest-environment jsdom
import { afterEach,it,expect } from "vitest";
import { cleanup,render,screen,fireEvent } from "@testing-library/react";
import { DemoSocialSecurityFields } from "./DemoSocialSecurityFields";
afterEach(cleanup);
it("generates a synthetic value and masks it by default",()=>{
 render(<DemoSocialSecurityFields/>);
 const input=screen.getByLabelText("Identifiant synthétique") as HTMLInputElement;
 expect(input.type).toBe("password");
 fireEvent.click(screen.getByRole("button",{name:"Générer un NIR fictif"}));
 expect(input.value).toMatch(/^DEMO\d{15}$/);
 expect(screen.queryByText(input.value)).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Révéler dans cet écran pédagogique"}));expect(input.type).toBe("text");
 fireEvent.click(screen.getByRole("button",{name:"Masquer"}));expect(input.type).toBe("password");
});
