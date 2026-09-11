'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { LayoutDashboard, Search, Users, ShieldCheck, Wallet, MessagesSquare, Inbox, Receipt, ClipboardCheck, TriangleAlert, FolderOpen, Calculator, GraduationCap, BookOpen, CircleHelp, Settings, FileSignature, ListChecks, ChartNoAxesCombined } from 'lucide-react';
import { Logo } from './Logo';
const groups = [
  { title: 'Pilotage', items: [['Cockpit','/cockpit',LayoutDashboard],['Recherche','#recherche',Search]] },
  { title: 'Adhérents & contrats', items: [['Adhérents','/adherents',Users],['Garanties','/garanties',ShieldCheck],['Cotisations','/cotisations',Wallet],['Relation adhérent','/relation-adherent',MessagesSquare]] },
  { title: 'Gestion des prestations', items: [['Mes dossiers','/dossiers',Inbox],['Prestations','/prestations',Receipt],['PEC / Devis','/pec-devis',ClipboardCheck],['Anomalies','/flux-anomalies',TriangleAlert]] },
  { title: 'Documents & outils', items: [['GED','/documents',FolderOpen],['Simulateur','/simulateur',Calculator]] },
  { title: 'Ressources', items: [['Academy','/academy',GraduationCap],['FAQ','/faq',CircleHelp],['Lexique','/lexique',BookOpen]] },
] as const;
const other = [['Contrats','/contrats',FileSignature],['Cas pratiques','/cas-pratiques',ListChecks],['Progression','/progression',ChartNoAxesCombined],['Administration','/administration',Settings]] as const;
export function Sidebar() {
  const pathname=usePathname(); const [open,setOpen]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null);
  const close=()=>{setOpen(false);toggle.current?.focus();};
  const link=([label,href,Icon]:typeof groups[number]['items'][number]|typeof other[number]) => href==='#recherche'
    ? <button key={href} className="m-nav-link m-nav-search" aria-label={label} title={label} onClick={()=>{setOpen(false);window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true}));}}><Icon aria-hidden="true"/><span className="m-nav-label">{label}</span></button>
    : <Link key={href} href={href} title={label} aria-label={label} aria-current={pathname===href||pathname.startsWith(href+'/')?'page':undefined} className="m-nav-link" onClick={()=>setOpen(false)}><Icon aria-hidden="true"/><span className="m-nav-label">{label}</span></Link>;
  return <><button ref={toggle} className="m-menu-button m-button m-button--secondary" aria-expanded={open} aria-controls="navigation-metier" onClick={()=>setOpen(!open)}>Menu</button>
    {open&&<button className="m-nav-backdrop" aria-label="Fermer la navigation" onClick={close}/>}
    <aside id="navigation-metier" className={`m-sidebar ${open?'is-open':''}`} onKeyDown={e=>{if(e.key==='Escape')close();}}>
      <Logo/><button className="m-menu-button m-button m-button--secondary" onClick={close}>Fermer le menu</button>
      <nav aria-label="Navigation principale">{groups.map(g=><section key={g.title}><p className="m-nav-group">{g.title}</p>{g.items.map(link)}</section>)}
        <details><summary className="m-nav-link">Autres rubriques</summary>{other.map(link)}</details>
      </nav><footer>Environnement pédagogique<br/>Aucun flux métier réel</footer>
    </aside></>;
}
