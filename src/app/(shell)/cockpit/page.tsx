import { getDossiers } from "@/lib/domain/dossierService";
import { dossierSummary } from "@/lib/domain/dossiers";
import { getSession } from "@/lib/store/session";
import { getAllCases } from "@/lib/data/loaders";
import { getLatestSubmission } from "@/lib/store/runtimeStore";
import { getDraft } from "@/lib/store/drafts";
import { WorkQueue } from "@/components/cases/WorkQueue";
import { formatDateTime } from "@/lib/utils/format";
import Link from "next/link";
export default async function Page() {
  const s = await getSession();
  const summary = dossierSummary(getDossiers(s.userId));
  const rows = getAllCases().map((c) => {
    const draft = getDraft(s.userId, c.case_id);
    const result = getLatestSubmission(s.userId, c.case_id);
    const a = c.household.members[0];
    return {
      id: c.case_id,
      name: `${a.first_name} ${a.last_name}`,
      householdId: c.household.household_id,
      documents: c.documents.length,
      difficulty: c.difficulty,
      state: result ? "Soumis" : draft ? "En contrôle" : "À qualifier",
      activity: result
        ? formatDateTime(result.submittedAt)
        : draft
          ? formatDateTime(draft.updatedAt)
          : "Non commencé",
    };
  });
  const stats = [
    ["Cas disponibles", rows.length],
    ["À qualifier", rows.filter((r) => r.state === "À qualifier").length],
    ["En contrôle", rows.filter((r) => r.state === "En contrôle").length],
    ["Soumis", rows.filter((r) => r.state === "Soumis").length],
  ];
  return (
    <>
      <p className="m-help mb-3">Mutalia / Cockpit</p>
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div>
          <h1>Cockpit de gestion</h1>
          <p>Votre espace de traitement · {rows.length} dossiers fictifs</p>
        </div>
        <Link className="m-button" href="/adherents">
          Rechercher un adhérent
        </Link>
      </div>
      <section className="m-panel mb-4" aria-label="Résumé Mes dossiers">
        <h2><Link className="text-brand underline" href="/dossiers">Mes dossiers</Link></h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/dossiers?status=À traiter">À traiter : <strong>{summary.todo}</strong></Link>
          <span>Urgents non terminés : <strong>{summary.urgent}</strong></span>
          <Link href="/dossiers?status=Incomplet">Incomplets : <strong>{summary.incomplete}</strong></Link>
          <Link href="/dossiers?status=En attente">En attente : <strong>{summary.waiting}</strong></Link>
        </div>
      </section>
      <div className="m-stats">
        {stats.map(([label, value]) => (
          <div className="m-panel" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <WorkQueue rows={rows} />
      <p className="m-help mt-4">
        Les états de travail reflètent vos brouillons et soumissions. Ils sont
        distincts des statuts documentaires et des scores.
      </p>
    </>
  );
}
