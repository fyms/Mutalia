import {beforeAll,afterAll,it,expect,vi} from 'vitest';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {NeedsSchema,emptySales} from '@/lib/domain/prospectSales';
import {individualCatalog2026 as catalog} from '@/lib/data/harmonie/individualCatalog';
vi.mock('server-only',()=>({}));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mutalia-sales-'));
let db:typeof import('@/lib/db').db,store:typeof import('@/lib/store/runtimeStore'),service:typeof import('./prospectSalesService'),docs:typeof import('@/lib/store/runtimeDocuments');
beforeAll(async()=>{process.env.MUTALIA_DATA_DIR=dir;db=(await import('@/lib/db')).db;store=await import('@/lib/store/runtimeStore');service=await import('./prospectSalesService');docs=await import('@/lib/store/runtimeDocuments');});
afterAll(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
const needs=NeedsSchema.parse({familySituation:'Couple',currentCoverage:'À renseigner',budget:150,hospitalisation:'Forte',dental:'Forte',optical:'Normale',routine:'Normale',protection:true,savings:false,other:'',comment:'Démonstration',nextAction:'Relancer le prospect',members:[{id:'holder',name:'Camille Démo',role:'adherent',birthDate:'1990-01-01'},{id:'spouse',name:'Alex Démo',role:'conjoint',birthDate:'1991-02-03'}]});
const person={firstName:'Camille',lastName:'Démo',phone:'0600000000',email:'camille@example.test'};
it('persists needs, validates pipeline/lost reasons, isolates accounts and retains lifecycle history',()=>{
 let p=store.saveProspect('a',person);const id=p.id;p=service.saveSalesNeeds('a',id,p.revision,needs);
 expect(p.sales?.status).toBe('Besoins identifiés');expect(store.getProspects('a').find(p=>p.id===id)?.sales?.needs).toEqual(needs);
 expect(()=>service.saveSalesNeeds('b',id,p.revision,needs)).toThrow();expect(()=>service.saveSalesNeeds('a',id,1,needs)).toThrow();
 expect(()=>service.setSalesPipeline('a',id,p.revision,{status:'Perdu'})).toThrow();
 p=service.setSalesPipeline('a',id,p.revision,{status:'Perdu',lostReason:'Prix'});expect(p.status).toBe('abandonné');expect(p.sales?.history.at(-1)?.summary).toContain('Prix');
 p=service.setSalesPipeline('a',id,p.revision,{status:'Gagné'});expect(p.status).toBe('actif');expect(p.sales?.history.some(e=>e.summary==='Perdu — Prix')).toBe(true);
});
it('creates immutable V1/V2 PDFs, captures one local mail with exact attachment, schedules a follow-up and converts once',async()=>{
 let p=store.saveProspect('a',person);p=service.saveSalesNeeds('a',p.id,p.revision,needs);const id=p.id;
 const option=service.salesPricingOptions().find(o=>o.reference==='PLI411')!;expect(option.config).toBeTruthy();
 const input={reference:option.reference,date:'2026-09-13',frequency:'Mensuelle'};
 const q1=await service.createSalesQuote('a',id,p.revision,input);p=store.getProspects('a').find(p=>p.id===id)!;
 const pdf1=docs.readRuntimeDocument('a',id,q1.documentId)!;expect(await PDFDocument.load(pdf1.bytes)).toBeTruthy();expect(docs.readRuntimeDocument('b',id,q1.documentId)).toBeUndefined();expect(pdf1.record.prospectId).toBe(id);expect(pdf1.record.householdId).toBe('');
 fs.writeFileSync('/tmp/mutalia-sales-review.pdf',pdf1.bytes);
 const q2=await service.createSalesQuote('a',id,p.revision,{...input,previousId:q1.id});p=store.getProspects('a').find(p=>p.id===id)!;
 expect(q2.number).toBe(q1.number);expect(q2.version).toBe(2);expect(q2.documentId).not.toBe(q1.documentId);expect(docs.readRuntimeDocument('a',id,q1.documentId)!.bytes).toEqual(pdf1.bytes);
 expect(p.sales?.quotes[0]).toEqual(q1);const {getCanonicalPricingConfig,estimatePedagogicalPricing}=await import('@/lib/domain/pedagogicalPricing');expect(q1.estimate).toEqual(estimatePedagogicalPricing(getCanonicalPricingConfig('regime_local:PSI 411'),{date:input.date,members:needs.members}));expect(q1.regime).toBe('Régime local');expect(q1.reference).toBe('PLI411');expect(q1.estimate.pricingSource).toBe('pedagogical_estimator');expect(q1.estimate.notice).toBe('Estimation pédagogique — tarif non contractuel');
 for(const g of q1.guarantees){expect(g.reference).toBe(option.reference);expect(g.sourcePage).toBeGreaterThan(0);if(g.status==='needs_review')expect(catalog.getCalculableGuarantee(g.reference,g.id)).toBeUndefined();}
 p=service.changeSalesQuote('a',id,p.revision,q2.id,'Prêt à envoyer');const email={to:person.email,subject:'Proposition Démo',text:'Simulation pédagogique'};
 p=service.captureSalesEmail('a',id,p.revision,q2.id,email);expect(p.sales?.quotes[1].status).toBe('Envoyé');expect(p.sales?.status).toBe('Devis envoyé');expect(p.sales?.emails[0]).toMatchObject({transport:'capture',documentId:q2.documentId,fileName:q2.fileName});
 expect(()=>service.captureSalesEmail('a',id,p.revision,q2.id,email)).toThrow();expect(store.getProspects('b')).toEqual([]);
 const {saveAppointment}=await import('@/lib/domain/appointmentService');saveAppointment('a',{contactType:'prospect',prospectId:id,householdId:'',date:'2026-12-20',startTime:'10:00',durationMinutes:30,type:'Téléphone',reason:`Relance devis ${q2.number}`,status:'Planifié',notes:''});
 p=store.getProspects('a').find(p=>p.id===id)!;expect(p.sales?.status).toBe('À relancer');expect(store.getAppointments('a').filter(a=>a.prospectId===id)).toHaveLength(1);
 p=service.changeSalesQuote('a',id,p.revision,q2.id,'Accepté');p=service.setSalesPipeline('a',id,p.revision,{status:'Gagné'});
 const {getHouseholdFormulas}=await import('@/lib/domain/householdFormulas');const raw={...person,birthDate:'1990-01-01',address:'1 rue Démo',postalCode:'45130',city:'Meung-sur-Loire',effectiveDate:'2026-09-13',formulaKey:getHouseholdFormulas()[0].key};
 const h=store.convertProspect('a',id,raw);expect(store.convertProspect('a',id,raw)).toBe(h);
 const persisted=store.getProspects('a').find(p=>p.id===id)!;expect(persisted.sales?.quotes).toHaveLength(2);expect(persisted.sales?.emails).toHaveLength(1);expect(persisted.sales?.history.at(-1)?.summary).toBe('Conversion en adhérent');expect(docs.listRuntimeDocuments('a',id)).toHaveLength(2);
});
it('rejects unpriced, foreign or stale quote inputs and does not derive reimbursements from candidates',async()=>{
 let p=store.saveProspect('c',person);expect(p.sales).toMatchObject({...emptySales(),history:expect.any(Array)});
 await expect(service.createSalesQuote('c',p.id,p.revision,{reference:'PSI111',date:'2026-09-13',frequency:'Mensuelle'})).rejects.toThrow();
 p=service.saveSalesNeeds('c',p.id,p.revision,needs);
 await expect(service.createSalesQuote('c',p.id,p.revision,{reference:'CCN2691',date:'2026-09-13',frequency:'Mensuelle'})).rejects.toThrow();
 const option=service.salesPricingOptions().find(o=>o.config)!;
 await expect(service.createSalesQuote('c',p.id,p.revision,{reference:option.reference,date:'2026-09-13',frequency:'Mensuelle',previousId:'foreign'})).rejects.toThrow();
 const old=p.revision;service.setSalesPipeline('c',p.id,p.revision,{status:'En réflexion'});
 await expect(service.createSalesQuote('c',p.id,old,{reference:option.reference,date:'2026-09-13',frequency:'Mensuelle'})).rejects.toThrow();
 expect(()=>service.estimateProspect(option.reference,{...needs,members:needs.members.map(m=>({...m,birthDate:''}))},'2026-09-13')).toThrow();
});

it('prices every catalogue product, retains the unknown-reference guard and shares Cotisations configuration',()=>{
 const options=service.salesPricingOptions();expect(options).toHaveLength(catalog.listProducts().length);expect(options.every(o=>!!o.config)).toBe(true);
 expect(catalog.listForConsultation('PLI411').length).toBeGreaterThan(0);
 expect(service.estimateProspect('PLI411',needs,'2026-09-13').config.formulaKey).toBe('PLI411');
 expect(()=>service.estimateProspect('PLI999',needs,'2026-09-13')).toThrow('Référence sans correspondance tarifaire pédagogique explicite.');
});
