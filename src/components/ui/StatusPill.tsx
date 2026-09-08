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
