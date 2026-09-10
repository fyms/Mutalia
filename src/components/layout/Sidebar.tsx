"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
const groups = [
  {
    title: "Travail",
    items: [
      ["Cockpit", "/cockpit"],
      ["Adhérents", "/adherents"],
      ["Contrats", "/contrats"],
      ["Garanties", "/garanties"],
      ["Simulateur", "/simulateur"],
      ["Documents / GED", "/documents"],
      ["Prestations", "/prestations"],
      ["PEC & Devis", "/pec-devis"],
      ["Anomalies", "/flux-anomalies"],
    ],
  },
  {
    title: "Ressources",
    items: [
      ["Academy", "/academy"],
      ["Lexique", "/lexique"],
      ["FAQ", "/faq"],
      ["Progression", "/progression"],
    ],
  },
];
export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const link = ([label, href]: string[]) => (
    <Link
      key={href}
      href={href}
      title={label}
      aria-label={label}
      aria-current={
        pathname === href || pathname.startsWith(href + "/")
          ? "page"
          : undefined
      }
      className="m-nav-link"
      onClick={() => setOpen(false)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 7h7l2 2h9v11H3zM3 7V4h7l2 3" />
      </svg>
      <span className="m-nav-label">{label}</span>
    </Link>
  );
  return (
    <>
      <button
        className="m-menu-button m-button m-button--secondary"
        aria-expanded={open}
        aria-controls="navigation-metier"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <aside
        id="navigation-metier"
        className={`m-sidebar ${open ? "is-open" : ""}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <Logo />
        <button
          className="m-menu-button m-button m-button--secondary"
          onClick={() => setOpen(false)}
        >
          Fermer le menu
        </button>
        <nav aria-label="Navigation principale">
          {groups.map((g) => (
            <section key={g.title}>
              <p className="m-nav-group">{g.title}</p>
              {g.items.map(link)}
            </section>
          ))}
          <details>
            <summary className="m-nav-link">Autres rubriques</summary>
            {[
              ["Cas pratiques", "/cas-pratiques"],
              ["Cotisations", "/cotisations"],
              ["Relation adhérent", "/relation-adherent"],
              ["Prospects", "/prospects"],
              ["Quiz", "/quiz"],
              ["Pilotage formateur", "/pilotage"],
              ["Administration", "/administration"],
            ].map(link)}
          </details>
        </nav>
        <footer>
          Simulation / données fictives
          <br />
          Aucun flux métier réel
        </footer>
      </aside>
    </>
  );
}
