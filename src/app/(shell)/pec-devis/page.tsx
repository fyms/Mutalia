import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PecDevisPage() {
  return (
    <EmptyState
      title="PEC & Devis — disponible en P2"
      description="L'émission dédiée de prise en charge (PEC) et le suivi de devis feront l'objet d'un module complet en P2."
      action={
        <Link
          href="/cas-pratiques/CASE-005"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          En attendant, s&apos;exercer sur CASE-005 (hospitalisation, PEC pédagogique) →
        </Link>
      }
    />
  );
}
