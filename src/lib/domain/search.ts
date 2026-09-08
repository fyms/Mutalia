import "server-only";
import { getAcademyCurriculum, getAllCases, getFaq, getLexicon } from "@/lib/data/loaders";
import { getAllHouseholds } from "@/lib/domain/households";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";

export interface SearchItem {
  id: string;
  type: "lexique" | "faq" | "academy" | "adherent" | "cas" | "document" | "page";
  title: string;
  subtitle?: string;
  category?: string;
  url: string;
}

const STATIC_PAGES: SearchItem[] = [
  { id: "page-cockpit", type: "page", title: "Cockpit", url: "/cockpit" },
  { id: "page-adherents", type: "page", title: "Adhérents", url: "/adherents" },
  { id: "page-garanties", type: "page", title: "Garanties 2026", url: "/garanties" },
  { id: "page-simulateur", type: "page", title: "Simulateur de remboursement", url: "/simulateur" },
  { id: "page-documents", type: "page", title: "GED - Documents", url: "/documents" },
  { id: "page-lexique", type: "page", title: "Lexique métier", url: "/lexique" },
  { id: "page-faq", type: "page", title: "FAQ & Procédures", url: "/faq" },
  { id: "page-cas", type: "page", title: "Cas pratiques", url: "/cas-pratiques" },
  { id: "page-progression", type: "page", title: "Progression", url: "/progression" },
  { id: "page-academy", type: "page", title: "Mutalia Academy", url: "/academy" },
];

/** Index public de recherche globale : ne contient jamais de contenu d'answer_key. */
export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [...STATIC_PAGES];

  for (const entry of getLexicon()) {
    items.push({
      id: `lex-${entry.id}`,
      type: "lexique",
      title: entry.acronym ? `${entry.acronym} — ${entry.term}` : entry.term,
      subtitle: entry.definition_simple,
      category: entry.category,
      url: `/lexique?terme=${entry.id}`,
    });
  }

  for (const entry of getFaq()) {
    items.push({
      id: `faq-${entry.id}`,
      type: "faq",
      title: entry.question,
      subtitle: entry.short_answer,
      category: entry.category,
      url: `/faq?question=${entry.id}`,
    });
  }

  const academy = getAcademyCurriculum();
  for (const academyModule of academy.modules) {
    items.push({
      id: `academy-${academyModule.id}`,
      type: "academy",
      title: `${academyModule.id} — ${academyModule.title}`,
      category: "Mutalia Academy",
      url: `/academy`,
    });
  }

  for (const household of getAllHouseholds()) {
    items.push({
      id: `adh-${household.householdId}`,
      type: "adherent",
      title: `${household.adherent.first_name} ${household.adherent.last_name}`,
      subtitle: `Foyer ${household.householdId} · ${household.assignedFormula}`,
      category: "Adhérents",
      url: `/adherents/${household.householdId}`,
    });
  }

  for (const trainingCase of getAllCases()) {
    items.push({
      id: `case-${trainingCase.case_id}`,
      type: "cas",
      title: `${trainingCase.case_id} — ${trainingCase.scenario_type.replace(/_/g, " ")}`,
      subtitle: `Difficulté ${trainingCase.difficulty}`,
      category: "Cas pratiques",
      url: `/cas-pratiques/${trainingCase.case_id}`,
    });

    for (const doc of trainingCase.documents) {
      items.push({
        id: `doc-${doc.document_id}`,
        type: "document",
        title: DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type,
        subtitle: `${trainingCase.case_id} · ${doc.file_name}`,
        category: "GED",
        url: `/cas-pratiques/${trainingCase.case_id}`,
      });
    }
  }

  return items;
}
