import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FluxAnomaliesPage() {
  return (
    <EmptyState
      title="Flux & Anomalies — disponible en P2"
      description="La simulation de flux NOEMIE/DRE/ROC et un tableau de bord dédié aux anomalies (hors flux réels) sont prévus en P2."
      action={
        <Link
          href="/documents"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          En attendant, consulter les statuts documentaires dans la GED →
        </Link>
      }
    />
  );
}
