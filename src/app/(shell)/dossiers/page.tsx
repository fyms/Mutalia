import Link from "next/link";
import { getSession } from "@/lib/store/session";
import { getDossiers } from "@/lib/domain/dossierService";
import { DOSSIER_STATUSES, DOSSIER_PRIORITIES, dossierAge } from "@/lib/domain/dossiers";
import { DossierRow } from "@/components/dossiers/DossierRow";
import { PageHeader } from "@/components/ui/PageHeader";
export default async function DossiersPage({searchParams}: {searchParams: Promise<{status?: string; priority?: string}>}) {
  const {userId} = await getSession();
  const filters = await searchParams;
  const status = DOSSIER_STATUSES.find(s => s === filters.status);
  const priority = DOSSIER_PRIORITIES.find(p => p === filters.priority);
  const rows = getDossiers(userId).filter(r => (!status || r.status === status) && (!priority || r.priority === priority));
  return <div className="m-workspace">
    <PageHeader title="Mes dossiers" description="Votre corbeille · priorités, pièces manquantes et prochaines actions. Données pédagogiques." />
    <nav aria-label="Filtres rapides par statut" className="m-filterbar mb-3">
      {[undefined, ...DOSSIER_STATUSES].map(s => <Link key={s ?? "all"} aria-current={status === s ? "page" : undefined} className="m-button m-button--secondary" href={`/dossiers?${new URLSearchParams({...s ? {status:s} : {}, ...priority ? {priority} : {}})}`}>{s ?? "Tous les statuts"}</Link>)}
    </nav>
    <nav aria-label="Filtres rapides par priorité" className="m-filterbar mb-4">
      {[undefined, ...DOSSIER_PRIORITIES].map(p => <Link key={p ?? "all"} aria-current={priority === p ? "page" : undefined} className="m-button m-button--secondary" href={`/dossiers?${new URLSearchParams({...status ? {status} : {}, ...p ? {priority:p} : {}})}`}>{p ?? "Toutes les priorités"}</Link>)}
      <Link className="m-button m-button--tertiary" href="/dossiers">Réinitialiser</Link>
    </nav>
    <p className="mb-2 text-sm">{rows.length} dossier(s) · Tri : Urgent, Normal, Faible, puis les plus anciens.</p>
    <div className="m-panel overflow-x-auto">
      <table className="w-full text-left text-sm"><caption className="sr-only">Dossiers du gestionnaire</caption>
        <thead className="bg-surface-muted"><tr>{["Adhérent / dossier", "Type", "Priorité", "Statut", "Ancienneté", "Anomalie éventuelle", "Prochaine action"].map(h => <th className="px-3 py-2" scope="col" key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(row => <DossierRow key={`${row.id}-${row.revision}`} row={row} age={dossierAge(row.createdAt)} />)}{!rows.length && <tr><td colSpan={7} className="p-4">Aucun dossier ne correspond à ces filtres.</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}
