import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAnomalyCountByDocumentType, getFlaggedDocuments } from "@/lib/domain/anomalies";
import { getFluxEvents } from "@/lib/store/runtimeStore";
import { formatDateTime } from "@/lib/utils/format";

const FLUX_LABELS: Record<string, string> = {
  teletransmission_simulee: "Télétransmission simulée",
  retour_anomalie: "Retour en anomalie",
  controle_manuel: "Contrôle manuel",
};

export default async function FluxAnomaliesPage() {
  const flagged = getFlaggedDocuments();
  const byType = getAnomalyCountByDocumentType();
  const fluxEvents = getFluxEvents();

  return (
    <div>
      <PageHeader
        title="Flux & Anomalies"
        description="Tableau de bord des documents en anomalie et journal des flux simulés (aucun flux réel, aucune télétransmission réelle)."
      />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Anomalies par type de document" subtitle="Basé sur les statuts positionnés dans la GED" />
          {byType.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucun document actuellement en anomalie.</p>
          ) : (
            <ul className="space-y-1.5">
              {byType.map((b) => (
                <li key={b.type} className="flex items-center justify-between text-sm">
                  <span>{b.label}</span>
                  <Badge tone="danger">{b.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Journal des flux simulés" subtitle="Pédagogique — jamais un flux réel (NOEMIE/DRE/ROC)" />
          {fluxEvents.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucun évènement de flux enregistré.</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin">
              {fluxEvents.slice(0, 30).map((e) => (
                <li key={e.id} className="text-xs">
                  <Badge tone="neutral">{FLUX_LABELS[e.type] ?? e.type}</Badge>
                  <span className="ml-2 text-foreground-muted">{e.label}</span>
                  <span className="ml-2 text-[10px] text-foreground-muted">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card padded={false}>
        <CardHeader title="Documents actuellement en anomalie" />
        {flagged.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Aucun document en anomalie"
              description="Changez le statut d'un document en « Anomalie » depuis la GED d'un cas pratique pour le voir apparaître ici."
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Document</th>
                <th className="px-4 py-2 font-medium">Cas</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((f) => (
                <tr key={f.documentId} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-2.5">{f.documentTypeLabel}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/cas-pratiques/${f.caseId}`} className="text-brand hover:underline">{f.caseId}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
