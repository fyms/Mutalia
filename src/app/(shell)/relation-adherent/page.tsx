import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ComplaintForm, type ComplaintHouseholdOption } from "@/components/complaints/ComplaintForm";
import { ComplaintStatusControl } from "@/components/complaints/ComplaintStatusControl";
import { getAllHouseholds } from "@/lib/domain/households";
import { getComplaints } from "@/lib/store/runtimeStore";
import { formatDateTime } from "@/lib/utils/format";

const STATUS_TONE = { ouverte: "danger", en_cours: "warning", cloturee: "success" } as const;

export default async function RelationAdherentPage() {
  const households = getAllHouseholds();
  const complaints = getComplaints();

  const householdOptions: ComplaintHouseholdOption[] = households.map((h) => ({
    householdId: h.householdId,
    label: `${h.adherent.first_name} ${h.adherent.last_name} (${h.householdId})`,
    caseId: h.case.case_id,
  }));

  return (
    <div>
      <PageHeader
        title="Relation adhérent"
        description="Suivi des réclamations (entité Complaint) par foyer. Le cas CASE-008 illustre le traitement complet d'une réclamation de remboursement."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <ComplaintForm households={householdOptions} />
        <Card padded={false}>
          <CardHeader title="Réclamations enregistrées" />
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Foyer</th>
                <th className="px-4 py-2 font-medium">Motif</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Ouverte le</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-foreground-muted">
                    Aucune réclamation enregistrée.
                  </td>
                </tr>
              ) : (
                complaints
                  .slice()
                  .reverse()
                  .map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-4 py-2.5">
                        <Link href={`/adherents/${c.householdId}`} className="text-brand hover:underline">
                          {c.householdId}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.motif}
                        {c.caseId ? (
                          <p className="text-[11px] text-foreground-muted">
                            Lié à <Link href={`/cas-pratiques/${c.caseId}`} className="text-brand hover:underline">{c.caseId}</Link>
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                          <ComplaintStatusControl id={c.id} householdId={c.householdId} status={c.status} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(c.createdAt)}</td>
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
