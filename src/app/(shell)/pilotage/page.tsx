import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PilotagePage() {
  return (
    <EmptyState
      title="Pilotage formateur — disponible en P2"
      description="Le pilotage multi-apprenants (comparaison, alertes, export de résultats) nécessite une gestion de comptes qui arrive en P2/P3. Ce prototype P0 est mono-utilisateur."
      action={
        <Link
          href="/progression"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          Voir la progression individuelle disponible dès P0 →
        </Link>
      }
    />
  );
}
