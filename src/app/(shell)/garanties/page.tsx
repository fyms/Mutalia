import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { IndividualGuarantees } from '@/components/garanties/IndividualGuarantees';
export default function GarantiesPage() {
  return <div className="space-y-4"><PageHeader title="Garanties 2026" description="Particuliers PSI/PLI : garanties documentées et candidats à vérifier, sans équivalence entre références."/><p><Link className="inline-block rounded bg-brand px-4 py-3 text-white" href="/garanties/conventions">Conventions collectives 2026 — IDCC 405 / 2691</Link></p><IndividualGuarantees/></div>;
}
