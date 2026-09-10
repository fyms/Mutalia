"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DOSSIER_STATUSES, DOSSIER_PRIORITIES, type Dossier } from "@/lib/domain/dossiers";
import { updateDossierAction } from "@/lib/domain/dossierActions";
export function DossierRow({row, age}: {row: Dossier; age: number}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function update(field: "status" | "priority", value: string) {
    setError("");
    startTransition(async () => {
      const result = await updateDossierAction(row.id, row.revision, {status: row.status, priority: row.priority, [field]: value});
      if (result.error) setError(result.error); else router.refresh();
    });
  }
  const cell = "px-3 py-3 align-top";
  return <tr id={row.id} className="scroll-mt-4 border-b border-border hover:bg-surface-muted" aria-busy={pending}>
    <td className={cell}><Link className="font-semibold text-brand underline" href={`/adherents/${row.householdId}`}>{row.adherent}</Link><p className="text-xs text-foreground-muted break-all">{row.id}</p></td>
    <td className={cell}>{row.type}</td>
    <td className={cell}><select className="m-field" aria-label={`Priorité de ${row.adherent}`} value={row.priority} disabled={pending} onChange={e => update("priority", e.target.value)}>{DOSSIER_PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></td>
    <td className={cell}><select className="m-field" aria-label={`Statut de ${row.adherent}`} value={row.status} disabled={pending} onChange={e => update("status", e.target.value)}>{DOSSIER_STATUSES.map(s => <option key={s}>{s}</option>)}</select>{pending && <span role="status">Enregistrement…</span>}{error && <p role="alert" className="m-error">{error}</p>}</td>
    <td className={`${cell} whitespace-nowrap`}>{age} j</td><td className={cell}>{row.anomaly ?? "—"}</td><td className={cell}>{row.nextAction}</td>
  </tr>;
}
