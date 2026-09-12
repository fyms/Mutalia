import { describe,expect,it,vi } from "vitest";
import { createFundResolver,type FundCache,FUND_TO_VERIFY } from "./healthInsuranceFund";
vi.mock("server-only",()=>({}));
const id="2f03e953-fa29-4a83-a77d-c7fef3fb6971";
function setup(code="45203",city="Meung-sur-Loire",postal="45130") {
 const values=new Map<string,{at:number;value:unknown}>();const cache:FundCache={get:key=>values.get(key),set:(key,value,at)=>{values.set(key,{value,at});}};
 let time=Date.parse("2026-09-12");
 const commune={code,nom:city,codeDepartement:code.slice(0,2),codesPostaux:[postal]};
 const competence={total_count:1,results:[{code_insee_commune:code,code_type_service_local:"cpam",id_service_local:JSON.stringify([id])}]};
 const service={total_count:1,results:[{id,nom:`CPAM Exemple ${city}`,adresse:JSON.stringify([{type_adresse:"Adresse",numero_voie:"1 rue Publique",code_postal:postal,nom_commune:city}]),pivot:JSON.stringify([{type_service_local:"cpam"}])}]};
 const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([commune])).mockResolvedValueOnce(Response.json(competence)).mockResolvedValueOnce(Response.json(service));
 const resolve=createFundResolver({cache,fetcher,now:()=>time});
 return {resolve,fetcher,commune,competence,service,cache,input:{postalCode:postal,city},expire:()=>{time+=15*86400000;}};
}
describe("official CPAM resolution",()=>{
 it.each([["45203","Meung-sur-Loire","45130"],["75056","Paris","75001"],["69123","Lyon","69001"],["13055","Marseille","13001"],["2A004","Ajaccio","20000"],["97105","Basse-Terre","97100"]])("resolves exact official commune %s without department inference",async(code,city,postal)=>{
  const s=setup(code,city,postal);const fund=await s.resolve(s.input);
  expect(fund).toMatchObject({codeINSEE:code,serviceId:id,source:"Annuaire officiel"});
  const url=new URL(String(s.fetcher.mock.calls[1][0]));expect(url.searchParams.get("where")).toBe(`code_insee_commune="${code}" AND code_type_service_local="cpam"`);
  expect((await s.resolve(s.input)).source).toBe("cache officiel");expect(s.fetcher).toHaveBeenCalledTimes(3);
 });
 it("disambiguates shared postal codes with the selected city and deduplicates INSEE",async()=>{
  const s=setup();s.fetcher.mockReset().mockResolvedValueOnce(Response.json([{...s.commune,code:"45001",nom:"Autre commune"},s.commune,s.commune])).mockResolvedValueOnce(Response.json(s.competence)).mockResolvedValueOnce(Response.json(s.service));
  expect((await s.resolve(s.input)).codeINSEE).toBe("45203");
 });
 it("uses stale official cache during an outage",async()=>{
  const s=setup();await s.resolve(s.input);s.expire();s.fetcher.mockRejectedValue(new Error("offline"));
  expect((await s.resolve(s.input)).source).toBe("cache officiel");
 });
 it("uses stale fund cache if only directory is offline",async()=>{
  const s=setup();await s.resolve(s.input);s.expire();s.fetcher.mockResolvedValueOnce(Response.json([s.commune])).mockRejectedValue(new Error("offline"));
  expect((await s.resolve(s.input)).source).toBe("cache officiel");
 });
 it("falls back with no cache, missing city or no match",async()=>{
  const s=setup();s.fetcher.mockReset().mockRejectedValue(new Error("offline"));expect((await s.resolve(s.input)).name).toBe(FUND_TO_VERIFY);
  expect((await s.resolve({...s.input,city:""})).source).toBe("Vérification requise");
  const empty=setup();empty.fetcher.mockReset().mockResolvedValue(Response.json([]));expect((await empty.resolve(empty.input)).source).toBe("Vérification requise");
 });
 it("rejects ambiguous commune and multiple competent services",async()=>{
  const s=setup();s.fetcher.mockReset().mockResolvedValueOnce(Response.json([s.commune,{...s.commune,code:"45001"}]));expect((await s.resolve(s.input)).reason).toBe("Commune ambiguë.");
  const multi=setup();multi.fetcher.mockReset().mockResolvedValueOnce(Response.json([multi.commune])).mockResolvedValueOnce(Response.json({total_count:1,results:[{...multi.competence.results[0],id_service_local:JSON.stringify([id,"379ec907-0fbe-4460-a78e-77712c47d4d3"])}]}));
  expect((await multi.resolve(multi.input)).reason).toContain("Plusieurs services");
 });
 it("never selects a non-CPAM service or invents an address",async()=>{
  const s=setup();s.fetcher.mockReset().mockResolvedValueOnce(Response.json([s.commune])).mockResolvedValueOnce(Response.json(s.competence)).mockResolvedValueOnce(Response.json({total_count:1,results:[{...s.service.results[0],adresse:"[]"}]}));
  expect((await s.resolve(s.input)).address).toEqual(["Adresse CPAM à vérifier"]);
 });
});
