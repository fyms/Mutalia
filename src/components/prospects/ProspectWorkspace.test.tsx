// @vitest-environment jsdom
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {ProspectWorkspace} from './ProspectWorkspace';
import {emptySales} from '@/lib/domain/prospectSales';
const action=vi.hoisted(()=>vi.fn(async()=>({})));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock('@/lib/domain/prospectSalesActions',()=>({prospectSalesAction:action}));
vi.mock('@/components/garanties/IndividualGuarantees',()=>({Product:({reference}:{reference:string})=><p>Garanties {reference}</p>}));
vi.mock('@/components/agenda/AppointmentForm',()=>({AppointmentForm:({prospectId,defaultReason}:{prospectId:string;defaultReason:string})=><p>RDV {prospectId} {defaultReason}</p>}));
vi.mock('@/components/adherents/NewHouseholdForm',()=>({NewHouseholdForm:()=>null}));
vi.mock('@/components/ged/RuntimeDocumentViewer',()=>({RuntimeDocumentViewer:()=>null}));
vi.mock('./ProspectEditor',()=>({ProspectEditor:()=>null}));
afterEach(()=>{cleanup();action.mockClear();});
const prospect={id:'p',firstName:'Camille',lastName:'Démo',email:'demo@example.test',phone:'0600000000',createdAt:'2026-09-13',updatedAt:'2026-09-13',status:'actif' as const,revision:1,sales:emptySales()};
const options=['PSI111','PSI121','PLI211'].map(reference=>({reference,family:'Particuliers',regime:reference.startsWith('PLI')?'Régime local':'Régime général'}));
it('compares two then three exact references, without a reimbursement action',()=>{
 render(<ProspectWorkspace prospect={prospect} appointments={[]} documents={[]} options={options} formulas={[]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Comparatif'}));
 for(const reference of ['PSI111','PSI121'])fireEvent.change(screen.getByLabelText('Ajouter une référence'),{target:{value:reference}});
 expect(screen.getByText('Garanties PSI111')).toBeTruthy();expect(screen.getByText('Garanties PSI121')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Ajouter une référence'),{target:{value:'PLI211'}});expect(screen.getByText('Garanties PLI211')).toBeTruthy();
 expect((screen.getByLabelText('Ajouter une référence') as HTMLSelectElement).disabled).toBe(true);expect(screen.queryByRole('button',{name:'Calculer'})).toBeNull();
});
it('saves needs and explicit lost reason in the contextual workspace',async()=>{
 render(<ProspectWorkspace prospect={prospect} appointments={[]} documents={[]} options={options} formulas={[]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Besoins'}));fireEvent.change(screen.getByLabelText('Date de naissance'),{target:{value:'1990-01-01'}});fireEvent.change(screen.getByLabelText('Budget mensuel indicatif (€)'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'Enregistrer les besoins'}));
 await waitFor(()=>expect(action).toHaveBeenCalledWith('p',1,'needs',expect.objectContaining({budget:100,members:[expect.objectContaining({birthDate:'1990-01-01'})]}),''));
 fireEvent.click(screen.getByRole('button',{name:'Synthèse'}));fireEvent.change(screen.getByLabelText('Statut commercial'),{target:{value:'Perdu'}});expect(screen.getByLabelText('Motif de perte')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Motif de perte'),{target:{value:'Prix'}});fireEvent.click(screen.getByRole('button',{name:'Mettre à jour le statut'}));
 await waitFor(()=>expect(action).toHaveBeenCalledWith('p',1,'pipeline',{status:'Perdu',lostReason:'Prix'},''));
});

it('uses contextual role labels and displays legacy coverage without changing persisted roles',()=>{
 const needs={familySituation:'',currentCoverage:'Mutuelle obligatoire',budget:null,hospitalisation:'Normale' as const,dental:'Normale' as const,optical:'Normale' as const,routine:'Normale' as const,other:'',protection:false,savings:false,comment:'',nextAction:'',members:[{id:'holder',name:'Camille',birthDate:'1990-01-01',role:'adherent' as const},{id:'spouse',name:'Alex',birthDate:'1991-01-01',role:'conjoint' as const},{id:'child',name:'Lou',birthDate:'2015-01-01',role:'enfant' as const}]};
 render(<ProspectWorkspace prospect={{...prospect,sales:{...emptySales(),needs}}} appointments={[]} documents={[]} options={options} formulas={[]} initialTab="Besoins"/>);
 expect(screen.getByRole('option',{name:'Prospect principal'}).getAttribute('value')).toBe('adherent');
 expect(screen.getAllByRole('option',{name:'Conjoint / Conjointe'}).length).toBeGreaterThan(0);
 expect(screen.getAllByRole('option',{name:'Enfant'}).length).toBeGreaterThan(0);
 expect(screen.queryByText('adherent',{exact:true})).toBeNull();
 expect((screen.getByLabelText('Couverture actuelle') as HTMLTextAreaElement).value).toBe('Complémentaire santé collective obligatoire via employeur');
 expect(needs.currentCoverage).toBe('Mutuelle obligatoire');expect(needs.members[0].role).toBe('adherent');
 cleanup();render(<ProspectWorkspace prospect={{...prospect,status:'converti',sales:{...emptySales(),needs}}} appointments={[]} documents={[]} options={options} formulas={[]} initialTab="Besoins"/>);
 expect(screen.getByRole('option',{name:'Adhérent'}).getAttribute('value')).toBe('adherent');expect(screen.queryByText('Prospect principal')).toBeNull();
});

it('blocks unavailable quote selections, keeps comparison and handles a stale selected tariff',async()=>{
 const {createPedagogicalGrid}=await import('@/lib/domain/pedagogicalPricing');
 const priced={...options[0],config:createPedagogicalGrid().find(c=>c.formulaKey==='PSI111')!};
 const unavailable={reference:'PLI411',family:'Particuliers',regime:'Régime local'};
 const props={prospect,appointments:[],documents:[],options:[priced,unavailable],formulas:[]};
 const view=render(<ProspectWorkspace {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:'Créer un devis'}));
 expect((screen.getByRole('option',{name:/PLI411 — tarif pédagogique indisponible/}) as HTMLOptionElement).disabled).toBe(true);
 expect((screen.getByRole('option',{name:/PSI111/}) as HTMLOptionElement).disabled).toBe(false);
 const generate=screen.getByRole('button',{name:'Générer le PDF'}) as HTMLButtonElement;
 expect(generate.disabled).toBe(true);
 expect(screen.getByText('Seules les références disposant d’une tarification pédagogique explicite peuvent générer un devis.')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Référence'),{target:{value:'PSI111'}});expect(generate.disabled).toBe(false);
 // A previously selected reference may lose its configuration on a refreshed page.
 view.rerender(<ProspectWorkspace {...props} options={[options[0],unavailable]}/>);
 expect(generate.disabled).toBe(true);expect(screen.getByText(/Tarif pédagogique indisponible — sélectionnez/)).toBeTruthy();
 fireEvent.submit(generate.closest('form')!);expect(action).not.toHaveBeenCalled();
 view.rerender(<ProspectWorkspace {...props}/>);
 fireEvent.submit(generate.closest('form')!);
 await waitFor(()=>expect(action).toHaveBeenCalledWith('p',1,'quote',expect.objectContaining({reference:'PSI111'}),''));
 fireEvent.click(screen.getByRole('button',{name:'Comparatif'}));
 for(const reference of ['PSI111','PLI411'])fireEvent.change(screen.getByLabelText('Ajouter une référence'),{target:{value:reference}});
 expect(screen.getByText('Garanties PLI411')).toBeTruthy();expect(screen.getByText('Tarif pédagogique indisponible')).toBeTruthy();
 expect(screen.getByText('Devis indisponible — tarif pédagogique non défini')).toBeTruthy();
 expect(screen.getAllByRole('button',{name:'Choisir pour un devis'})).toHaveLength(1);
});

it('enables canonical PLI411 in comparison and quotes using the shared grid',async()=>{
 const {createPedagogicalGrid}=await import('@/lib/domain/pedagogicalPricing');
 const {NeedsSchema}=await import('@/lib/domain/prospectSales');
 const needs=NeedsSchema.parse({budget:null,hospitalisation:'Normale',dental:'Normale',optical:'Normale',routine:'Normale',protection:false,savings:false,members:[{id:'holder',name:'Démo',birthDate:'1990-01-01',role:'adherent'}]});
 const choices=['PLI411','PSI111'].map(reference=>({reference,family:'Particuliers',regime:reference.startsWith('PLI')?'Régime local':'Régime général',config:createPedagogicalGrid().find(c=>c.formulaKey===reference)!}));
 render(<ProspectWorkspace prospect={{...prospect,sales:{...emptySales(),needs}}} appointments={[]} documents={[]} options={choices} formulas={[]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Comparatif'}));for(const reference of ['PLI411','PSI111'])fireEvent.change(screen.getByLabelText('Ajouter une référence'),{target:{value:reference}});
 expect(screen.getByText('Garanties PLI411')).toBeTruthy();expect(screen.queryByText('Tarif pédagogique indisponible')).toBeNull();expect(screen.getAllByText(/€\/mois ·/)).toHaveLength(2);
 fireEvent.click(screen.getAllByRole('button',{name:'Choisir pour un devis'})[0]);expect((screen.getByLabelText('Référence') as HTMLSelectElement).value).toBe('PLI411');
 expect((screen.getByRole('button',{name:'Générer le PDF'}) as HTMLButtonElement).disabled).toBe(false);
});
