import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";
vi.mock("@/lib/store/session", () => ({getAuthSession: vi.fn(async () => ({userId:"audit"}))}));
afterEach(() => vi.unstubAllGlobals());
it.each(["1234","123456","12a45",""])("rejects invalid postal code %s without upstream fetch", async postal => {
 const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
 expect((await GET(new Request(`http://localhost/api/communes?codePostal=${postal}`))).status).toBe(400);
 expect(fetcher).not.toHaveBeenCalled();
});
it("projects useful fields, deduplicates INSEE, sorts and requests a daily server cache", async () => {
 const row=(nom:string,code:string)=>({nom,code,codeDepartement:"45",codesPostaux:["45130"],population:999});
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>[row("Zeta","2"),row("Alpha","1"),row("Zeta","2")]});vi.stubGlobal("fetch",fetcher);
 const result=await GET(new Request("http://localhost/api/communes?codePostal=45130"));
 expect(await result.json()).toEqual([{nom:"Alpha",code:"1",codeDepartement:"45",codesPostaux:["45130"]},{nom:"Zeta",code:"2",codeDepartement:"45",codesPostaux:["45130"]}]);
 expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("https://geo.api.gouv.fr/communes?codePostal=45130"),expect.objectContaining({next:{revalidate:86400}}));
});
it("returns no invented city for an unknown code", async () => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>[]}));
 expect(await (await GET(new Request("http://localhost/api/communes?codePostal=00000"))).json()).toEqual([]);
});
it("returns an actionable unavailable response", async () => {
 vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("offline")));
 const result=await GET(new Request("http://localhost/api/communes?codePostal=45130"));
 expect(result.status).toBe(503);expect(await result.json()).toEqual({error:"Service des communes temporairement indisponible"});
});
