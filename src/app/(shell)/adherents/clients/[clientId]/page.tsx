import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { GuaranteeQuotePanel } from "@/components/adherents/GuaranteeQuotePanel";
import { DeleteClientButton } from "@/components/adherents/DeleteClientButton";
import { getClientById, getQuotes } from "@/lib/store/runtimeStore";
import { getHarmonieReferential } from "@/lib/data/loaders";
import { computeAge } from "@/lib/domain/households";
import { MEMBER_ROLE_LABELS } from "@/lib/domain/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

const STATUS_LABELS = { prospect: "Prospect", actif: "Actif", resilie: "Résilié" } as const;

export default async function ClientFichePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = getClientById(clientId);
  if (!client) notFound();

  const referential = getHarmonieReferential();
  const quotes = getQuotes(clientId);
  const adherent = client.household.members.find((m) => m.role === "adherent");

  return (
    <div>
      <PageHeader
        title={adherent ? `${adherent.first_name} ${adherent.last_name}` : client.id}
        description={`Adhérent du portefeuille de démonstration · ${client.id}`}
        action={
          <div className="flex gap-2">
            <Link
              href={`/adherents/clients/${client.id}/modifier`}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              Modifier
            </Link>
            <DeleteClientButton clientId={client.id} clientName={adherent ? `${adherent.first_name} ${adherent.last_name}` : client.id} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Identité" />
          {adherent ? (
            <dl className="space-y-1.5 text-sm">
              <Row label="Nom">{adherent.first_name} {adherent.last_name}</Row>
              <Row label="Date de naissance">
                {formatDate(adherent.birth_date)} ({computeAge(adherent.birth_date)} ans)
              </Row>
              <Row label="Identifiant fictif">{adherent.member_id}</Row>
            </dl>
          ) : (
            <p className="text-xs text-foreground-muted">Adhérent principal manquant.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Composition du foyer" />
          {client.household.members.length <= 1 ? (
            <p className="text-xs text-foreground-muted">Aucun bénéficiaire supplémentaire.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {client.household.members
                .filter((m) => m.role !== "adherent")
                .map((m) => (
                  <li key={m.member_id} className="flex items-center justify-between">
                    <span>{m.first_name} {m.last_name}</span>
                    <Badge tone="neutral">{MEMBER_ROLE_LABELS[m.role]}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Statut du dossier" />
          <dl className="space-y-1.5 text-sm">
            <Row label="Statut">
              <Badge tone={client.status === "actif" ? "success" : client.status === "resilie" ? "danger" : "neutral"}>
                {STATUS_LABELS[client.status]}
              </Badge>
            </Row>
            <Row label="Formule appliquée">
              {client.formulaCode ? <Badge tone="brand">{client.formulaCode}</Badge> : <DataToVerifyBadge label="Aucune formule appliquée" />}
            </Row>
            <Row label="Créé par">{client.createdBy}</Row>
            <Row label="Créé le">{formatDateTime(client.createdAt)}</Row>
          </dl>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Garanties 2026 et devis"
          subtitle="Application d'une formule PSI (niveaux ★) ou du comparateur vérifié (codes PLI) — jamais confondus."
        />
        <GuaranteeQuotePanel
          clientId={client.id}
          regimeGeneral={referential.canonical_2026_architecture.regime_general.map((f) => f.formula)}
          regimeLocal={referential.canonical_2026_architecture.regime_local.map((f) => f.formula)}
          pliFormulas={referential.verified_live_quote_2026_sample.compared_formulas}
          currentFormulaCode={client.formulaCode}
          currentFormulaCatalog={client.formulaCatalog}
        />
      </Card>

      <Card padded={false} className="mt-4">
        <CardHeader title="Devis générés" />
        {quotes.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-foreground-muted">Aucun devis généré pour cet adhérent.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Référence</th>
                <th className="px-4 py-2 font-medium">Formule</th>
                <th className="px-4 py-2 font-medium">Cotisation</th>
                <th className="px-4 py-2 font-medium">Émis le</th>
                <th className="px-4 py-2 font-medium">Valable jusqu&apos;au</th>
                <th className="px-4 py-2 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-2.5 font-medium">{q.id}</td>
                  <td className="px-4 py-2.5"><Badge tone="brand">{q.formulaCode}</Badge></td>
                  <td className="px-4 py-2.5">
                    {q.monthlyPremium !== null ? formatCurrency(q.monthlyPremium) + " /mois" : <DataToVerifyBadge />}
                  </td>
                  <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(q.createdAt)}</td>
                  <td className="px-4 py-2.5 text-foreground-muted">{formatDate(q.validUntil)}</td>
                  <td className="px-4 py-2.5">
                    <a
                      href={`/api/devis/${q.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      Ouvrir ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </div>
  );
}
