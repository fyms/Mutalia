import { activeAt } from "@/lib/domain/householdLifecycle";
import { getSession } from "@/lib/store/session";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllHouseholds, computeAge } from "@/lib/domain/households";
import { MEMBER_ROLE_LABELS } from "@/lib/domain/constants";
import { formatDate } from "@/lib/utils/format";

export default async function AdherentsPage({searchParams}: {searchParams: Promise<{status?:string}>}) {
  const archived = (await searchParams).status === "archived";
  const today = new Date().toISOString().slice(0,10);
  const households = getAllHouseholds((await getSession()).userId).filter(h=>activeAt(h.lifecycle?.adherent,today) !== archived);

  return (
    <div>
      <PageHeader
        title="Adhérents"
        description="Les 12 foyers pédagogiques et vos adhérents créés manuellement."
        action={<Link href="/adherents/nouveau" className="m-button">Nouvel adhérent</Link>}
      />

      <nav className="flex gap-3 mb-4" aria-label="Statut des adhérents"><Link className="m-button m-button--secondary" aria-current={!archived?"page":undefined} href="/adherents">Actifs</Link><Link className="m-button m-button--secondary" aria-current={archived?"page":undefined} href="/adherents?status=archived">Archivés / clôturés</Link></nav>
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Adhérent principal</th>
                <th className="px-4 py-2 font-medium">Foyer</th>
                <th className="px-4 py-2 font-medium">Bénéficiaires</th>
                <th className="px-4 py-2 font-medium">Formule d&apos;exercice 2026</th>
                <th className="px-4 py-2 font-medium">Cas pratique lié</th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => (
                <tr key={h.householdId} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-2.5">
                    <Link href={`/adherents/${h.householdId}`} className="font-medium text-brand hover:underline">
                      {h.adherent.first_name} {h.adherent.last_name}
                    </Link>
                    <p className="text-[11px] text-foreground-muted">
                      {computeAge(h.adherent.birth_date)} ans · né(e) le {formatDate(h.adherent.birth_date)}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-foreground-muted">{h.householdId}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {h.beneficiaries.filter(b=>activeAt(h.lifecycle?.beneficiaries[b.member_id],today)).map((b) => (
                        <Badge key={b.member_id} tone="neutral">
                          {MEMBER_ROLE_LABELS[b.role]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone="brand">{h.assignedFormula}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {h.case ? <Link href={`/cas-pratiques/${h.case.case_id}`} className="text-brand hover:underline">
                      {h.case.case_id}
                    </Link> : <span>Création manuelle</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
