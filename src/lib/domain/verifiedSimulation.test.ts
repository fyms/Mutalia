import { expect,it } from "vitest";
import { SIMULATOR_BENEFITS,getSimulatorBenefit } from "@/lib/data/harmonie/simulatorBenefits";
import { computeVerifiedSimulation } from "./verifiedSimulation";
const input={billed:440,brss:120,amoRate:0.6};
it("uses the documented IDCC 2691 dental rates by level, not a GP guarantee",()=>{
 for(const [level,rate,amc,rac] of [["A",150,108,260],["B",340,336,32],["C",420,368,0],["D",500,368,0]] as const){
  const id=`2691:fixes:${level}`;
  expect(getSimulatorBenefit(id)).toMatchObject({category:"Dentaire",level,family:"IDCC 2691",value:rate,mode:"percent_brss",page:2});
  expect(computeVerifiedSimulation(id,input)).toMatchObject({amoReimbursement:72,amcReimbursement:amc,remainingCharge:rac,dataToVerify:false});
 }
});
it("assigns unique identities even for identical rates and separate conventions",()=>{
 expect(new Set(SIMULATOR_BENEFITS.map(b=>b.id)).size).toBe(SIMULATOR_BENEFITS.length);
 expect(getSimulatorBenefit("2691:fixes:A")?.value).toBe(getSimulatorBenefit("2691:generaliste-dptm:B")?.value);
 expect(getSimulatorBenefit("405:sourire:Option 1")).toMatchObject({value:260,category:"Dentaire",family:"IDCC 405"});
 expect(SIMULATOR_BENEFITS.some(b=>b.level.startsWith("PSI"))).toBe(false);
});
it("preserves AMO and marks missing conditions unknown for capped dental and optical benefits",()=>{
 for(const id of ["405:sourire:Base","405:implant:Option 1","2691:implant:C","2691:lunettes-simple:B","2691:100-sante:B","unknown"]){
  expect(computeVerifiedSimulation(id,input)).toMatchObject({amoReimbursement:72,dataToVerify:true});
 }
 expect(getSimulatorBenefit("405:implant:Option 1")).toMatchObject({mode:"forfait_euros",value:300});
});
it("reuses the engine for documented actual-cost cover and simple dental care",()=>{
 expect(computeVerifiedSimulation("2691:forfait-journalier:B",{billed:20,brss:0,amoRate:0})).toMatchObject({amcReimbursement:20,remainingCharge:0,dataToVerify:false});
 expect(computeVerifiedSimulation("405:soins:Base",input)).toMatchObject({amcReimbursement:48,remainingCharge:320});
});
