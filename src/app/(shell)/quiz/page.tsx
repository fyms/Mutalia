import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function QuizPage() {
  return (
    <EmptyState
      title="Quiz — disponible en P1"
      description="Les quiz notés par module Academy arrivent en P1. Un mini-quiz lexique est déjà disponible en P0."
      action={
        <Link
          href="/lexique"
          className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          Essayer le mini-quiz du lexique →
        </Link>
      }
    />
  );
}
