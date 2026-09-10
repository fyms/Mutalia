import { PrestationHistory } from "@/components/prestations/PrestationHistory";
import { ManualHouseholdDetails } from "@/components/adherents/ManualHouseholdDetails";
import { getSession } from "@/lib/store/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { DocumentStatusPill } from "@/components/ui/StatusPill";
import { getHouseholdById, computeAge } from "@/lib/domain/households";
import { getHarmonieReferential } from "@/lib/data/loaders";
import { getSubmissions } from "@/lib/store/runtimeStore";
import { getDocumentState } from "@/lib/store/runtimeStore";
import { DOCUMENT_TYPE_LABELS, MEMBER_ROLE_LABELS, type DocumentStatus } from "@/lib/domain/constants";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";

const TABS = [
  { key: "vue-generale", label: "Vue générale" },
  { key: "beneficiaires", label: "Bénéficiaires" },
  { key: "contrat", label: "Contrat" },
  { key: "garanties", label: "Garanties" },
  { key: "cotisations", label: "Cotisations" },
  { key: "prestations", label: "Prestations" },
  { key: "pec", label: "PEC" },
  { key: "documents", label: "Documents" },
  { key: "contacts", label: "Contacts" },
  { key: "historique", label: "Historique" },
];

export default async function Fiche360Page({
  params,
  searchParams,
}: {
  params: Promise<{ householdId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const owner = (await getSession()).userId;
  const { householdId } = await params;
  const { tab } = await searchParams;
  const household = getHouseholdById(householdId, owner);
  if (!household) notFound();

  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "vue-generale";
  if (!household.case) return <ManualHouseholdDetails owner={owner} record={household.manual} activeTab={activeTab} tabs={TABS} />;
  const basePath = `/adherents/${householdId}`;
  const referential = getHarmonieReferential();
  const submissions = getSubmissions(owner, household.case.case_id);

  return (
    <div>
      <PageHeader
        title={`${household.adherent.first_name} ${household.adherent.last_name}`}
        description={`Foyer ${household.householdId} · Fiche adhérent 360 · Cas pratique lié : ${household.case.case_id}`}
        action={
          <Link
            href={`/cas-pratiques/${household.case.case_id}`}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
          >
            Ouvrir le cas pratique →
          </Link>
        }
      />

      <QueryTabs basePath={basePath} activeKey={activeTab} tabs={TABS} />

      {activeTab === "vue-generale" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Identité" />
            <dl className="space-y-1.5 text-sm">
              <Row label="Nom">{household.adherent.first_name} {household.adherent.last_name}</Row>
              <Row label="Date de naissance">{formatDate(household.adherent.birth_date)} ({computeAge(household.adherent.birth_date)} ans)</Row>
              <Row label="Rôle">{MEMBER_ROLE_LABELS[household.adherent.role]}</Row>
              <Row label="Identifiant fictif">{household.adherent.member_id}</Row>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Composition du foyer" />
            <ul className="space-y-1.5 text-sm">
              {household.household.members.map((m) => (
                <li key={m.member_id} className="flex items-center justify-between">
                  <span>{m.first_name} {m.last_name}</span>
                  <Badge tone="neutral">{MEMBER_ROLE_LABELS[m.role]}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Statut du dossier" />
            <dl className="space-y-1.5 text-sm">
              <Row label="Contrat">{household.case.contract.status}</Row>
              <Row label="Formule d'exercice">
                <Badge tone="brand">{household.assignedFormula}</Badge>
              </Row>
              <Row label="Difficulté du cas">{household.case.difficulty}</Row>
              <Row label="Tentatives de résolution">{submissions.length}</Row>
            </dl>
          </Card>
        </div>
      )}

      {activeTab === "beneficiaires" && (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Rôle</th>
                <th className="px-4 py-2 font-medium">Date de naissance</th>
                <th className="px-4 py-2 font-medium">Âge</th>
                <th className="px-4 py-2 font-medium">Bénéficiaire cible du cas</th>
              </tr>
            </thead>
            <tbody>
              {household.household.members.map((m) => (
                <tr key={m.member_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">{m.first_name} {m.last_name}</td>
                  <td className="px-4 py-2.5">{MEMBER_ROLE_LABELS[m.role]}</td>
                  <td className="px-4 py-2.5">{formatDate(m.birth_date)}</td>
                  <td className="px-4 py-2.5">{computeAge(m.birth_date)} ans</td>
                  <td className="px-4 py-2.5">
                    {m.member_id === household.case.target_beneficiary_id ? (
                      <Badge tone="brand">Bénéficiaire ciblé</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "contrat" && (
        <Card>
          <CardHeader title="Contrat" subtitle="Données du contrat fictif (particulier)" />
          <dl className="space-y-1.5 text-sm">
            <Row label="Organisme">{household.case.contract.provider}</Row>
            <Row label="Année de référence">{household.case.contract.year}</Row>
            <Row label="Statut">{household.case.contract.status}</Row>
            <Row label="Formule d'exercice (PSI)">
              <Badge tone="brand">{household.assignedFormula}</Badge>
            </Row>
          </dl>
          <p className="mt-3 text-xs text-foreground-muted">
            Le libellé « À lier au référentiel 2026 » fourni par le cas pédagogique a été rattaché à une
            formule PSI réelle du référentiel Harmonie Mutuelle 2026 pour les besoins de l&apos;exercice.
          </p>
        </Card>
      )}

      {activeTab === "garanties" && (
        <Card>
          <CardHeader
            title={`Garanties — ${household.assignedFormula}`}
            subtitle="Architecture PSI 2026 (régime général)"
          />
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-2">
            <Row label="Module Soins">{"★".repeat(household.starsSoins as number)} ({household.starsSoins}/4)</Row>
            <Row label="Module Équipements">{"★".repeat(household.starsEquipements as number)} ({household.starsEquipements}/3)</Row>
          </dl>
          <DataToVerifyBadge label="Pourcentages de remboursement par prestation non publiés pour ce code PSI — donnée 2026 à vérifier" />
          <p className="mt-3 text-xs text-foreground-muted">
            Consultez le référentiel complet et le barème comparatif vérifié (codes PLI) dans la page{" "}
            <Link href="/garanties" className="text-brand hover:underline">Garanties 2026</Link>.
          </p>
        </Card>
      )}

      {activeTab === "cotisations" && (
        <StubTab label="Cotisations" note="Module de calcul de cotisation prévu en P2 (Cotisations, régularisations)." />
      )}
      {activeTab === "prestations" && (
        <PrestationHistory owner={owner} householdId={householdId} />
      )}
      {activeTab === "pec" && (
        <StubTab label="PEC & Devis" note="Émission de prise en charge dédiée prévue en P2 (voir le cas pratique pour un exercice guidé)." />
      )}

      {activeTab === "documents" && (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Document</th>
                <th className="px-4 py-2 font-medium">Bénéficiaire</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {household.case.documents.map((doc) => {
                const state = getDocumentState(owner, doc.document_id);
                return (
                  <tr key={doc.document_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/cas-pratiques/${household.case.case_id}`} className="text-brand hover:underline">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">{doc.beneficiary_id}</td>
                    <td className="px-4 py-2.5 text-foreground-muted">{doc.document_date ? formatDate(doc.document_date) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <DocumentStatusPill status={(state.status ?? doc.status) as DocumentStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "contacts" && (
        <EmptyState
          title="Aucune coordonnée fictive seedée"
          description="Le pack de données P0 ne fournit pas de téléphone/email fictif par foyer. Ce point pourra être enrichi en P2/P3 (module Relation adhérent)."
        />
      )}

      {activeTab === "historique" && (
        <Card>
          <CardHeader title="Historique des tentatives" subtitle="Soumissions du cas pratique lié à ce foyer" />
          {submissions.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucune soumission enregistrée pour ce dossier.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {submissions
                .slice()
                .reverse()
                .map((s, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span>{formatDateTime(s.submittedAt)}</span>
                    <Badge tone={s.score / s.maxScore >= 0.7 ? "success" : "warning"}>
                      {s.score}/{s.maxScore} pts
                    </Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      )}

      <p className="mt-6 text-[11px] text-foreground-muted">
        Sources 2026 : {referential.metadata.official_sources.length} document(s) officiel(s) référencé(s) —
        vérifié le {referential.metadata.verified_on}.
      </p>
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

function StubTab({ label, note }: { label: string; note: string }) {
  return <EmptyState title={`${label} — à venir`} description={note} />;
}
