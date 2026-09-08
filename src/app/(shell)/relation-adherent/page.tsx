import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RelationAdherentPage() {
  return (
    <EmptyState
      title="Relation adhérent — disponible en P2"
      description="Historique des contacts et traitement des réclamations (entité Complaint / ContactEvent) prévus en P2."
      action={
        <Link
          href="/cas-pratiques/CASE-008"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          En attendant, s&apos;exercer sur CASE-008 (réclamation remboursement) →
        </Link>
      }
    />
  );
}
