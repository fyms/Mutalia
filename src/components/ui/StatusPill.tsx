import { Badge } from "@/components/ui/Badge";
import { DOCUMENT_STATUS_LABELS, type DocumentStatus } from "@/lib/domain/constants";

const TONE_BY_STATUS: Record<DocumentStatus, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  importe: "neutral",
  a_qualifier: "brand",
  associe: "brand",
  controle: "brand",
  conforme: "success",
  incomplet: "warning",
  anomalie: "danger",
  traite: "success",
  archive: "neutral",
};

export function DocumentStatusPill({ status }: { status: DocumentStatus }) {
  return <Badge tone={TONE_BY_STATUS[status]}>{DOCUMENT_STATUS_LABELS[status]}</Badge>;
}

/** Presentation only: textual statuses remain the source of meaning. */
export function BusinessStatus({status}:{status:string}) {
 const tone=["Actif","Active","Vérifié","Validée","Validé","Confirmé","Réalisé","Accordée","Accepté","Réglée","Régularisée"].includes(status)?"success"
 :["Bloquante","Erreur","Urgent","Refusée","Refusé","Absent","Impayée"].includes(status)?"danger"
 :["À traiter","À analyser","À contrôler","En attente","En attente adhérent","Incomplet","Partielle","Majeure","Donnée 2026 à vérifier","Condition ou consommation à vérifier"].includes(status)?"warning"
 :["Planifié","Reçu","Reçue","Demandée","En cours","Calculé","Calculée","Nouvelle"].includes(status)?"brand":"neutral";
 return <Badge tone={tone}>{status}</Badge>;
}
