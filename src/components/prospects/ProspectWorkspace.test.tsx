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
