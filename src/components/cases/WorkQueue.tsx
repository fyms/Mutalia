"use client";
import { useState } from "react";
import Link from "next/link";
export interface WorkRow {
  id: string;
  name: string;
  householdId: string;
  documents: number;
  state: string;
  activity: string;
  difficulty: string;
}
export function WorkQueue({ rows }: { rows: WorkRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [ascending, setAscending] = useState(true);
  const filtered = rows
    .filter(
      (r) =>
        (!status || r.state === status) &&
        `${r.id} ${r.name}`
          .toLocaleLowerCase("fr")
          .includes(query.toLocaleLowerCase("fr")),
    )
    .sort((a, b) => (ascending ? 1 : -1) * a.id.localeCompare(b.id));
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  return (
    <section className="m-panel">
      <h2>Dossiers à reprendre</h2>
      <div className="m-filters">
        <label>
          <span className="m-label">Rechercher un dossier ou adhérent</span>
          <input
            className="m-field"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          <span className="m-label">État de travail</span>
          <select
            className="m-field"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tous les états</option>
            {[...new Set(rows.map((r) => r.state))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          className="m-button m-button--secondary"
          onClick={() => {
            setQuery("");
            setStatus("");
            setPage(0);
          }}
        >
          Effacer les filtres
        </button>
      </div>
      <table className="m-work-table">
        <caption className="sr-only">File de travail personnelle</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ascending ? "ascending" : "descending"}>
              <button onClick={() => setAscending(!ascending)}>
                Dossier {ascending ? "↑" : "↓"}
              </button>
            </th>
            <th scope="col">Adhérent fictif</th>
            <th scope="col">Documents</th>
            <th scope="col">État de travail</th>
            <th scope="col">Activité</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(page * 6, page * 6 + 6).map((r) => (
            <tr key={r.id}>
              <td data-label="Dossier">{r.id}</td>
              <td data-label="Adhérent">
                <Link
                  className="underline"
                  href={`/adherents/${r.householdId}`}
                >
                  {r.name}
                </Link>
              </td>
              <td data-label="Documents">{r.documents} pièces</td>
              <td data-label="État">
                <span className="m-badge m-badge--info">{r.state}</span>
              </td>
              <td data-label="Activité">{r.activity}</td>
              <td data-label="Action">
                <Link
                  className="m-button m-button--secondary"
                  aria-label={`Ouvrir ${r.id}`}
                  href={`/cas-pratiques/${r.id}`}
                >
                  Ouvrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!filtered.length && (
        <p role="status">
          Aucun dossier pour « {query} ». Effacez les filtres pour retrouver les
          dossiers.
        </p>
      )}
      <div className="m-pagination">
        <p role="status">
          {filtered.length} dossiers · Page {page + 1} / {pages}
        </p>
        <div className="flex gap-2">
          <button
            className="m-button m-button--secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Précédent
          </button>
          <button
            className="m-button m-button--secondary"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  );
}
