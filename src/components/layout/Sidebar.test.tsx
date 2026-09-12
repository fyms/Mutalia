// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
vi.mock('next/navigation',()=>({usePathname:()=>'/adherents/nouveau'}));
afterEach(cleanup);
it('keeps grouped navigation and nested active state without hidden modules',()=>{
 render(<Sidebar/>);
 expect(screen.getByRole('link',{name:'Adhérents'}).getAttribute('aria-current')).toBe('page');
 for(const name of ['Pilotage','Adhérents & contrats','Gestion des prestations','Documents & outils','Ressources'])expect(screen.getByText(name)).toBeTruthy();
 for(const name of ['Prospects','Quiz','Pilotage formateur'])expect(screen.queryByText(name)).toBeNull();
 expect(screen.queryByText('Gestion Santé & Prévoyance')).toBeNull();
 expect(screen.getByRole('link',{name:'Mutalia, cockpit'})).toBeTruthy();
});
it('opens search through the existing shortcut and closes navigation with Escape',()=>{
 render(<Sidebar/>);const listener=vi.fn();window.addEventListener('keydown',listener);
 fireEvent.click(screen.getByRole('button',{name:'Recherche'}));expect(listener).toHaveBeenCalled();window.removeEventListener('keydown',listener);
 const menu=screen.getByRole('button',{name:/^Menu$/});fireEvent.click(menu);expect(menu.getAttribute('aria-expanded')).toBe('true');
 fireEvent.keyDown(screen.getByRole('navigation').parentElement!,{key:'Escape'});expect(menu.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(menu);
});
