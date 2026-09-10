import Link from "next/link";
import { getSession } from "@/lib/store/session";
import { getOperationalAnomalies } from "@/lib/store/runtimeStore";
import { getAllHouseholds } from "@/lib/domain/households";
import { ANOMALY_SEVERITIES, ANOMALY_STATUSES, filterOperationalAnomalies } from "@/lib/domain/operationalAnomalies";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnomalyRow } from "@/components/anomalies/AnomalyRow";
export default async function FluxAnomaliesPage({searchParams}: {searchParams:Promise<{severity?:string;status?:string;type?:string}>}) {
  const {userId}=await getSession();const filters=await searchParams;
  const households=getAllHouseholds(userId);
  const all=getOperationalAnomalies(userId).map(a=>{
    const h=households.find(h=>h.householdId===a.householdId);
    return {...a,adherentName:h?`${h.adherent.first_name} ${h.adherent.last_name}`:a.adherentName};
  });
  const types=[...new Set(all.map(a=>a.type))].sort();
  const rows=filterOperationalAnomalies(all,filters);
  return <div>
    <PageHeader title="Flux & Anomalies" description="Contrôles pédagogiques des prestations et PEC/devis : corriger la cause, documenter la résolution et retrouver l’historique. Aucun flux NOEMIE/DRE/ROC simulé." />
    <form action="/flux-anomalies" className="m-panel mb-4 flex flex-wrap items-end gap-3">
      <label><span className="m-label">Gravité</span><select name="severity" className="m-field" defaultValue={filters.severity??""}><option value="">Toutes les gravités</option>{ANOMALY_SEVERITIES.map(s=><option key={s}>{s}</option>)}</select></label>
      <label><span className="m-label">Statut</span><select name="status" className="m-field" defaultValue={filters.status??""}><option value="">Tous les statuts</option>{ANOMALY_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
      <label><span className="m-label">Type</span><select name="type" className="m-field" defaultValue={filters.type??""}><option value="">Tous les types</option>{types.map(t=><option key={t}>{t}</option>)}</select></label>
      <button className="m-button">Filtrer</button><Link className="m-button m-button--secondary" href="/flux-anomalies">Réinitialiser</Link>
    </form>
    <p className="mb-2 text-sm">{rows.length} anomalie(s) · Gravité puis ancienneté, les plus anciennes d’abord.</p>
    <div className="m-panel overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Centre opérationnel des anomalies</caption>
      <thead className="bg-surface-muted"><tr>{["Adhérent / liens","Type","Gravité","Détection","Statut","Cause → impact → action"].map(t=><th key={t} scope="col" className="p-2">{t}</th>)}</tr></thead>
      <tbody>{rows.map(a=><AnomalyRow key={`${a.id}-${a.revision}`} a={a} />)}{!rows.length&&<tr><td className="p-4" colSpan={6}>Aucune anomalie pour ces filtres. Les contrôles bloquants des prestations et PEC/devis alimentent ce centre automatiquement.</td></tr>}</tbody>
    </table></div>
  </div>;
}
