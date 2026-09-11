// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IndividualGuarantees } from './IndividualGuarantees';
import { individualCatalog2026 as catalog } from '@/lib/data/harmonie/individualCatalog';
import { CONDITION_TO_VERIFY } from '@/lib/domain/individualSimulation';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('shows documented conditions and disables calculation without hiding provenance', () => {
  const product = catalog.listProducts().find(p => catalog.listCalculableGuarantees(p.reference).length)!;
  const guarantee = catalog.listCalculableGuarantees(product.reference)[0];
  render(<IndividualGuarantees simulator/>);
  fireEvent.change(screen.getByLabelText('Famille · Régime · Référence/Formule'), {target:{value:product.reference}});
  fireEvent.change(screen.getByLabelText('Prestation garantie'), {target:{value:guarantee.id}});
  expect(screen.getByRole('button', {name:'Calculer'}).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('status').textContent).toContain(CONDITION_TO_VERIFY);
  expect(screen.getByText(`${guarantee.sourceFile} — page ${guarantee.sourcePage}`)).toBeTruthy();
  const options = screen.getByLabelText('Prestation garantie').querySelectorAll('option');
  expect(options.length).toBe(catalog.listCalculableGuarantees(product.reference).length + 1);
});
it('keeps calculation available for an explicitly unconditional verified guarantee', () => {
  const product = catalog.listProducts().find(p => catalog.listCalculableGuarantees(p.reference).length)!;
  const guarantee = catalog.listCalculableGuarantees(product.reference)[0];
  vi.spyOn(catalog, 'getCalculableGuarantee').mockImplementation((_reference, id) => id === guarantee.id ? {...guarantee, condition:'', limit:'', unit:'EUR'} : undefined);
  render(<IndividualGuarantees simulator/>);
  fireEvent.change(screen.getByLabelText('Famille · Régime · Référence/Formule'), {target:{value:product.reference}});
  fireEvent.change(screen.getByLabelText('Prestation garantie'), {target:{value:guarantee.id}});
  expect(screen.getByRole('button', {name:'Calculer'}).hasAttribute('disabled')).toBe(false);
});
