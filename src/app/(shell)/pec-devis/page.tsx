import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataToVerifyBadge } from "@/components/ui/Badge";
import { PecForm, type PecHouseholdOption } from "@/components/pec/PecForm";
import { getAllHouseholds } from "@/lib/domain/households";
import { getPecRecords } from "@/lib/store/runtimeStore";
import { MEMBER_ROLE_LABELS } from "@/lib/domain/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

export default async function PecDevisPage() {
  const households = getAllHouseholds();
  const records = getPecRecords();

  const householdOptions: PecHouseholdOption[] = households.map((h) => ({
    householdId: h.householdId,
    label: `${h.adherent.first_name} ${h.adherent.last_name} (${h.householdId})`,
    caseId: h.case.case_id,
    beneficiaries: h.household.members.map((m) => ({
      id: m.member_id,
      label: `${m.first_name} ${m.last_name} — ${MEMBER_ROLE_LABELS[m.role]}`,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="PEC & Devis"
        description="Émission pédagogique de prises en charge. Aucun engagement financier réel."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <PecForm households={householdOptions} />
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Foyer</th>
                <th className="px-4 py-2 font-medium">Acte</th>
                <th className="px-4 py-2 font-medium">Établissement</th>
                <th className="px-4 py-2 font-medium">Date des soins</th>
                <th className="px-4 py-2 font-medium">Montant garanti</th>
                <th className="px-4 py-2 font-medium">Émise le</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-foreground-muted">
                    Aucune PEC émise pour le moment.
                  </td>
                </tr>
              ) : (
                records
                  .slice()
                  .reverse()
                  .map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-4 py-2.5">
                        <Link href={`/adherents/${r.householdId}`} className="text-brand hover:underline">
                          {r.householdId}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{r.acte}</td>
                      <td className="px-4 py-2.5">{r.etablissement}</td>
                      <td className="px-4 py-2.5">{formatDate(r.dateSoins)}</td>
                      <td className="px-4 py-2.5">
                        {r.montantGaranti !== null ? formatCurrency(r.montantGaranti) : <DataToVerifyBadge />}
                      </td>
                      <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
