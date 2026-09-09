import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { DocumentStatusPill } from "@/components/ui/StatusPill";
import { getHouseholdById, computeAge } from "@/lib/domain/households";
import { getHarmonieReferential } from "@/lib/data/loaders";
import {
  getComplaints,
  getCotisationState,
  getDocumentState,
  getPecRecords,
  getSubmissions,
} from "@/lib/store/runtimeStore";
import { getPrestationsForHousehold } from "@/lib/domain/prestations";
import { getSession } from "@/lib/store/session";
import { DOCUMENT_TYPE_LABELS, MEMBER_ROLE_LABELS, type DocumentStatus } from "@/lib/domain/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

const COTISATION_STATUS_LABELS = { a_jour: "À jour", en_relance: "En relance", impayee: "Impayée" } as const;

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
  const { householdId } = await params;
  const { tab } = await searchParams;
  const household = getHouseholdById(householdId);
  if (!household) notFound();

  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "vue-generale";
  const basePath = `/adherents/${householdId}`;
  const referential = getHarmonieReferential();
  const session = await getSession();
  const submissions = getSubmissions(session.profileId, household.case.case_id);
  const cotisationState = getCotisationState(householdId);
  const householdPrestations = getPrestationsForHousehold(householdId);
  const householdPecRecords = getPecRecords(householdId);
  const householdComplaints = getComplaints(householdId);

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
        <Card>
          <CardHeader title="Cotisation" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground-muted">Statut :</span>
            <Badge tone={cotisationState.status === "a_jour" ? "success" : cotisationState.status === "en_relance" ? "warning" : "danger"}>
              {COTISATION_STATUS_LABELS[cotisationState.status]}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-foreground-muted">
            Le calculateur de régularisation (prorata en cas de changement de formule) est disponible sur la page{" "}
            <Link href="/cotisations" className="text-brand hover:underline">Cotisations</Link>.
          </p>
        </Card>
      )}
      {activeTab === "prestations" && (
        <Card padded={false}>
          {householdPrestations.length === 0 ? (
            <p className="p-4 text-xs text-foreground-muted">
              Aucune prestation liquidée : résolvez le cas pratique {household.case.case_id} pour en générer une.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Cas</th>
                  <th className="px-4 py-2 font-medium">Montant retenu</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {householdPrestations.map((p, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{p.caseId}</td>
                    <td className="px-4 py-2.5">{p.retainedAmount !== null ? formatCurrency(p.retainedAmount) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={p.status === "liquidee" ? "success" : "warning"}>
                        {p.status === "liquidee" ? "Liquidée" : "À vérifier"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">{formatDateTime(p.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
      {activeTab === "pec" && (
        <Card padded={false}>
          {householdPecRecords.length === 0 ? (
            <p className="p-4 text-xs text-foreground-muted">
              Aucune PEC émise pour ce foyer. Utilisez la page{" "}
              <Link href="/pec-devis" className="text-brand hover:underline">PEC &amp; Devis</Link> pour en créer une.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-[11px] uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Acte</th>
                  <th className="px-4 py-2 font-medium">Établissement</th>
                  <th className="px-4 py-2 font-medium">Date des soins</th>
                  <th className="px-4 py-2 font-medium">Montant garanti</th>
                </tr>
              </thead>
              <tbody>
                {householdPecRecords.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{p.acte}</td>
                    <td className="px-4 py-2.5">{p.etablissement}</td>
                    <td className="px-4 py-2.5">{formatDate(p.dateSoins)}</td>
                    <td className="px-4 py-2.5">{p.montantGaranti !== null ? formatCurrency(p.montantGaranti) : <DataToVerifyBadge />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
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
                const state = getDocumentState(doc.document_id);
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
        <Card>
          <CardHeader title="Réclamations du foyer" subtitle="Aucune coordonnée fictive seedée dans le pack P0 (téléphone/email) : cet onglet suit les réclamations." />
          {householdComplaints.length === 0 ? (
            <p className="text-xs text-foreground-muted">
              Aucune réclamation. Ouvrez-en une depuis{" "}
              <Link href="/relation-adherent" className="text-brand hover:underline">Relation adhérent</Link>.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {householdComplaints.map((c) => (
                <li key={c.id} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span>{c.motif}</span>
                    <Badge tone={c.status === "ouverte" ? "danger" : c.status === "en_cours" ? "warning" : "success"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-foreground-muted">{formatDateTime(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activeTab === "historique" && (
        <Card>
          <CardHeader title="Historique des tentatives" subtitle="Vos soumissions du cas pratique lié à ce foyer (profil courant)" />
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
