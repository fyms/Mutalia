// @vitest-environment jsdom
import { afterEach,it,expect,vi } from "vitest";
import { cleanup,render,screen,fireEvent,waitFor } from "@testing-library/react";
import { RuntimeDocumentViewer } from "./RuntimeDocumentViewer";
import type { RuntimeDocumentView } from "@/lib/domain/runtimeDocuments";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("./PdfCanvas",()=>({PdfCanvas:({url}:{url:string})=><p>PDF {url}</p>}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const document:RuntimeDocumentView={id:"upload",householdId:"h",beneficiaryId:"b",documentType:"facture_acquittee",originalFileName:"facture.pdf",mimeType:"application/pdf",size:100,documentDate:"2026-09-12",note:"",source:"uploaded",status:"a_qualifier",createdAt:"2026-09-12"};
it("reuses PDF rendering and confirms uploaded-only deletion",async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal("fetch",fetcher);
 render(<RuntimeDocumentViewer document={document}/>);expect(screen.getByText("PDF /api/runtime-documents/h/upload")).toBeTruthy();
 const remove=screen.getByRole("button",{name:"Supprimer le document importé"}) as HTMLButtonElement;expect(remove.disabled).toBe(true);
 fireEvent.click(screen.getByRole("checkbox"));fireEvent.click(remove);await waitFor(()=>expect(fetcher).toHaveBeenCalledWith("/api/runtime-documents/h/upload",expect.objectContaining({method:"DELETE",body:'{"confirmed":true}'})));
});
it("renders images and never offers deletion of generated documents",()=>{
 render(<RuntimeDocumentViewer document={{...document,source:"generated",mimeType:"image/png"}}/>);
 expect(screen.getByRole("img").getAttribute("src")).toMatch(/\/api\/runtime-documents\/h\/upload$/);expect(screen.queryByRole("button",{name:"Supprimer le document importé"})).toBeNull();
});
