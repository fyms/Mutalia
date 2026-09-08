import "server-only";
import { getAllTrainingCases } from "@/lib/data/loaders";
import { getDocumentState } from "@/lib/store/runtimeStore";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";

export interface FlaggedDocument {
  documentId: string;
  caseId: string;
  documentType: string;
  documentTypeLabel: string;
  flaggedAt: string | null;
}

/**
 * Statistiques dérivées exclusivement des statuts documentaires positionnés par
 * l'utilisateur dans la GED (jamais du champ `anomalies` du case.json source, qui
 * préfigure le corrigé de l'exercice) : reflète le travail de qualification réel.
 */
export function getFlaggedDocuments(): FlaggedDocument[] {
  const cases = getAllTrainingCases();
  const flagged: FlaggedDocument[] = [];

  for (const trainingCase of cases) {
    for (const doc of trainingCase.documents) {
      const state = getDocumentState(doc.document_id);
      if (state.status === "anomalie") {
        flagged.push({
          documentId: doc.document_id,
          caseId: trainingCase.case_id,
          documentType: doc.document_type,
          documentTypeLabel: DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type,
          flaggedAt: state.viewedAt[state.viewedAt.length - 1] ?? null,
        });
      }
    }
  }

  return flagged;
}

export function getAnomalyCountByDocumentType(): { type: string; label: string; count: number }[] {
  const flagged = getFlaggedDocuments();
  const counts = new Map<string, number>();
  for (const f of flagged) {
    counts.set(f.documentType, (counts.get(f.documentType) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, label: DOCUMENT_TYPE_LABELS[type] ?? type, count }))
    .sort((a, b) => b.count - a.count);
}
