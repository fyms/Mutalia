import { CotisationHistory } from "@/components/cotisations/CotisationHistory";
import { DevisPecHistory } from "@/components/devisPec/DevisPecHistory";
import { PrestationHistory } from "@/components/prestations/PrestationHistory";
import { HouseholdEditor } from "./HouseholdEditor";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryTabs } from "@/components/ui/QueryTabs";
import { getHouseholdFormulas } from "@/lib/domain/householdFormulas";
import type { ManualHousehold } from "@/lib/domain/manualHouseholds";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export function ManualHouseholdDetails({owner, record, activeTab, tabs}: {
  owner: string; record: ManualHousehold; activeTab: string; tabs: {key: string; label: string}[];
}) {
  const formula = getHouseholdFormulas().find(f => f.key === record.formulaKey);
  const identity = <dl className="space-y-2">
    <Row label="Prénom et nom">{record.firstName} {record.lastName}</Row>
    <Row label="Date de naissance">{formatDate(record.birthDate)}</Row>
    <Row label="Identifiant adhérent">{record.memberId}</Row>
    <Row label="Identifiant foyer">{record.id}</Row>
  </dl>;
  const contact = <dl className="space-y-2">
    <Row label="E-mail">{record.email}</Row><Row label="Téléphone">{record.phone}</Row>
    <Row label="Adresse">{record.address}</Row><Row label="Code postal et ville">{record.postalCode} {record.city}</Row>
  </dl>;
  const contract = <dl className="space-y-2">
    <Row label="Organisme">Harmonie Mutuelle</Row><Row label="Année du référentiel">2026</Row>
    <Row label="Formule">{formula?.label ?? "Donnée 2026 à vérifier"}</Row>
    <Row label="Date d’effet / adhésion">{formatDate(record.effectiveDate)}</Row>
    <Row label="Statut">Adhésion saisie</Row>
  </dl>;
  return <div>
    <PageHeader title={`${record.firstName} ${record.lastName}`} description="Fiche adhérent 360° · Création manuelle"
      action={<Link href="/adherents" className="m-button m-button--secondary">Retour aux adhérents</Link>} />
    <HouseholdEditor record={record} formulas={getHouseholdFormulas()} />
    <QueryTabs basePath={`/adherents/${record.id}`} activeKey={activeTab} tabs={tabs} />
    {activeTab === "vue-generale" && <div className="grid gap-4 lg:grid-cols-2">
      <section className="m-panel"><h2>Identité</h2>{identity}</section>
      <section className="m-panel"><h2>Adhésion</h2>{contract}</section>
      <section className="m-panel"><h2>Coordonnées</h2>{contact}</section>
    </div>}
    {activeTab === "beneficiaires" && <section className="m-panel"><h2>Adhérent principal</h2>{identity}<p>{(record.beneficiaries ?? []).length} bénéficiaire(s) supplémentaire(s), visibles dans la gestion du foyer ci-dessus.</p></section>}
    {activeTab === "cotisations" && <CotisationHistory owner={owner} householdId={record.id} />}
    {activeTab === "pec" && <DevisPecHistory owner={owner} householdId={record.id} />}
    {activeTab === "prestations" && <PrestationHistory owner={owner} householdId={record.id} />}
    {activeTab === "contacts" && <section className="m-panel"><h2>Coordonnées</h2>{contact}</section>}
    {activeTab === "contrat" && <section className="m-panel"><h2>Adhésion</h2>{contract}</section>}
    {activeTab === "garanties" && <section className="m-panel"><h2>{formula?.label}</h2>
      <p>La sélection de formule ne vaut pas validation des droits ni des remboursements.</p>
      <Link className="underline" href="/garanties">Consulter le référentiel 2026</Link></section>}
    {activeTab === "historique" && <section className="m-panel"><h2>Historique</h2><p>Création du foyer le {formatDateTime(record.createdAt)}.</p></section>}
    {["documents"].includes(activeTab) && <section className="m-panel"><h2>{tabs.find(t => t.key === activeTab)?.label}</h2><p>Aucun élément enregistré pour ce nouveau foyer.</p></section>}
  </div>;
}
function Row({label, children}: {label: string; children: React.ReactNode}) {
  return <div><dt className="text-sm text-foreground-muted">{label}</dt><dd className="break-words font-medium">{children}</dd></div>;
}
