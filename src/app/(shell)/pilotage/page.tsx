import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PilotagePage() {
  return (
    <EmptyState
      title="Pilotage formateur — non disponible"
      description="Les comptes et sessions sont disponibles, avec des données de travail isolées par compte. Le pilotage collectif (comparaison, alertes et export des résultats) reste à développer."
      action={
        <Link
          href="/progression"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          Voir la progression individuelle →
        </Link>
      }
    />
  );
}
