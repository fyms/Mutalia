export interface NavItem {
  label: string;
  href: string;
  phase: "Disponible" | "P0" | "P1" | "P2" | "P3";
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    items: [{ label: "Cockpit", href: "/cockpit", phase: "P0" }, { label: "Mes dossiers", href: "/dossiers", phase: "Disponible" }],
  },
  {
    title: "Portefeuille",
    items: [
      { label: "Adhérents", href: "/adherents", phase: "P0" },
      { label: "Contrats", href: "/contrats", phase: "P0" },
      { label: "Garanties", href: "/garanties", phase: "P0" },
      { label: "Prestations", href: "/prestations", phase: "Disponible" },
      { label: "PEC & Devis", href: "/pec-devis", phase: "Disponible" },
      { label: "Cotisations", href: "/cotisations", phase: "Disponible" },
    ],
  },
  {
    title: "Documents & qualité",
    items: [
      { label: "Documents / GED", href: "/documents", phase: "P0" },
      { label: "Flux & Anomalies", href: "/flux-anomalies", phase: "Disponible" },
      { label: "Relation adhérent", href: "/relation-adherent", phase: "Disponible" },
    ],
  },
  {
    title: "Formation",
    items: [
      { label: "Mutalia Academy", href: "/academy", phase: "P1" },
      { label: "Lexique métier", href: "/lexique", phase: "P0" },
      { label: "FAQ & Procédures", href: "/faq", phase: "P0" },
      { label: "Cas pratiques", href: "/cas-pratiques", phase: "P0" },
      { label: "Simulateur", href: "/simulateur", phase: "P0" },
      { label: "Progression", href: "/progression", phase: "P0" },
    ],
  },
  {
    title: "Système",
    items: [{ label: "Administration", href: "/administration", phase: "P0" }],
  },
];
