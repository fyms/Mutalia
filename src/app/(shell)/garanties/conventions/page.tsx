import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConventionSimulator } from "@/components/simulateur/ConventionSimulator";
export default function ConventionsPage() {
  return <><PageHeader title="Conventions collectives 2026" description="Garanties hospitalisation transcrites des PDF du dépôt. Chaque convention conserve ses propres niveaux et conditions."/><Link href="/garanties" className="text-brand underline">Retour aux garanties PSI / PLI</Link><div className="mt-4"><ConventionSimulator/></div></>;
}
