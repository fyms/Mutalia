import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { getAllHouseholds, computeAge } from "@/lib/domain/households";
import { getClients } from "@/lib/store/runtimeStore";
import { MEMBER_ROLE_LABELS } from "@/lib/domain/constants";
import { formatDate, formatDateTime } from "@/lib/utils/format";

const CLIENT_STATUS_LABELS = { prospect: "Prospect", actif: "Actif", resilie: "Résilié" } as const;

export default async function AdherentsPage() {
  const households = getAllHouseholds();
  const clients = getClients();

  return (
    <div>
      <PageHeader
        title="Adhérents"
        description="Portefeuille de démonstration (créé/modifié librement) et foyers fictifs issus des 12 cas pédagogiques Mutalia."
        action={
          <Link
            href="/adherents/nouveau"
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
          >
            + Nouvel adhérent
          </Link>
        }
      />

      <Card padded={false} className="mb-4 overflow-hidden">
        <div className="px-4 pt-3">
          <CardHeader
            title="Portefeuille de démonstration"
            subtitle="Adhérents créés, modifiés ou supprimés librement pour la démonstration commerciale."
          />
        </div>
        {clients.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-foreground-muted">
            Aucun adhérent créé pour le moment. Utilisez « + Nouvel adhérent » ci-dessus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Adhérent principal</th>
                  <th className="px-4 py-2 font-medium">Bénéficiaires</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Formule appliquée</th>
                  <th className="px-4 py-2 font-medium">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const adherent = c.household.members.find((m) => m.role === "adherent");
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-4 py-2.5">
                        <Link href={`/adherents/clients/${c.id}`} className="font-medium text-brand hover:underline">
                          {adherent ? `${adherent.first_name} ${adherent.last_name}` : c.id}
                        </Link>
                        <p className="text-[11px] text-foreground-muted">
                          {adherent ? `${computeAge(adherent.birth_date)} ans` : ""} <Badge tone="neutral" className="ml-1">Démo</Badge>
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {c.household.members
                            .filter((m) => m.role !== "adherent")
                            .map((m) => (
                              <Badge key={m.member_id} tone="neutral">
                                {MEMBER_ROLE_LABELS[m.role]}
                              </Badge>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={c.status === "actif" ? "success" : c.status === "resilie" ? "danger" : "neutral"}>
                          {CLIENT_STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.formulaCode ? <Badge tone="brand">{c.formulaCode}</Badge> : <DataToVerifyBadge label="Aucune" />}
                      </td>
                      <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="px-4 pt-3">
          <CardHeader
            title="Foyers pédagogiques (12 cas)"
            subtitle="Lecture seule — dérivés des cas pratiques du pack P0."
          />
        </div>
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
                      {h.beneficiaries.map((b) => (
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
                    <Link href={`/cas-pratiques/${h.case.case_id}`} className="text-brand hover:underline">
                      {h.case.case_id}
                    </Link>
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
