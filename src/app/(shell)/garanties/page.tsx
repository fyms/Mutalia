import Link from 'next/link';
import { PedagogicalFormulaBases } from '@/components/cotisations/PedagogicalEstimate';
import { PageHeader } from '@/components/ui/PageHeader';
import { IndividualGuarantees } from '@/components/garanties/IndividualGuarantees';
export default function GarantiesPage() {
  return <div className="m-workspace space-y-4"><PageHeader title="Garanties 2026" description="Particuliers PSI/PLI : garanties documentées et candidats à vérifier, sans équivalence entre références."/><p><Link className="m-button m-button--secondary" href="/garanties/conventions">Conventions collectives 2026 — IDCC 405 / 2691</Link></p><PedagogicalFormulaBases/><IndividualGuarantees/></div>;
}
