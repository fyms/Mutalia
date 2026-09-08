"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { LexiconEntry } from "@/lib/domain/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LEXICON_CATEGORY_TO_CASE } from "@/lib/domain/lexiconCaseLinks";

const FAVORITES_KEY = "mutalia_lexicon_favorites";

let favoritesCache = "[]";
const listeners = new Set<() => void>();

function readFavoritesRaw(): string {
  try {
    return window.localStorage.getItem(FAVORITES_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): string {
  favoritesCache = readFavoritesRaw();
  return favoritesCache;
}

function getServerSnapshot(): string {
  return "[]";
}

function writeFavorites(next: Set<string>): void {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
  } catch {
    /* localStorage indisponible : favoris désactivés silencieusement */
  }
  for (const listener of listeners) listener();
}

function useFavorites() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorites = useMemo(() => new Set<string>(JSON.parse(raw)), [raw]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(favorites);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavorites(next);
    },
    [favorites],
  );

  return { favorites, toggle };
}

export function LexiconExplorer({
  entries,
  initialTermId,
}: {
  entries: LexiconEntry[];
  initialTermId?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [openId, setOpenId] = useState<string | undefined>(initialTermId);
  const { favorites, toggle } = useFavorites();

  const categories = useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  const levels = useMemo(() => [...new Set(entries.map((e) => e.level))], [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => (category ? e.category === category : true))
      .filter((e) => (level ? e.level === level : true))
      .filter((e) => (onlyFavorites ? favorites.has(e.id) : true))
      .filter((e) =>
        q
          ? e.term.toLowerCase().includes(q) ||
            (e.acronym ?? "").toLowerCase().includes(q) ||
            e.definition_simple.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.term.localeCompare(b.term, "fr"));
  }, [entries, query, category, level, onlyFavorites, favorites]);

  const byLetter = useMemo(() => {
    const map = new Map<string, LexiconEntry[]>();
    for (const entry of filtered) {
      const letter = entry.term[0]?.toUpperCase() ?? "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(entry);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [filtered]);

  return (
    <div>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex-1 min-w-[200px]">
            <span className="mb-1 block text-foreground-muted">Recherche plein texte</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Terme, acronyme, définition…"
              className="w-full rounded-md border border-border px-2 py-1.5"
            />
          </label>
          <label>
            <span className="mb-1 block text-foreground-muted">Catégorie</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-foreground-muted">Niveau</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              <option value="">Tous</option>
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} />
            <span>Favoris uniquement</span>
          </label>
          <span className="text-foreground-muted">{filtered.length} terme(s)</span>
        </div>
      </Card>

      {byLetter.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aucun terme ne correspond à ces filtres.</p>
      ) : (
        <div className="space-y-6">
          {byLetter.map(([letter, items]) => (
            <div key={letter}>
              <h2 className="mb-2 text-sm font-semibold text-brand-strong">{letter}</h2>
              <div className="space-y-2">
                {items.map((entry) => {
                  const open = openId === entry.id;
                  const linkedCase = LEXICON_CATEGORY_TO_CASE[entry.category];
                  return (
                    <Card key={entry.id} className="p-0">
                      <button
                        onClick={() => setOpenId(open ? undefined : entry.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                      >
                        <span>
                          <span className="font-medium">
                            {entry.acronym ? `${entry.acronym} — ` : ""}
                            {entry.term}
                          </span>
                          <span className="ml-2"><Badge tone="neutral">{entry.category}</Badge></span>
                        </span>
                        <span className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(entry.id);
                            }}
                            aria-label="Ajouter aux favoris"
                            className="text-lg leading-none"
                          >
                            {favorites.has(entry.id) ? "★" : "☆"}
                          </button>
                          <span className="text-xs text-foreground-muted">{open ? "▲" : "▼"}</span>
                        </span>
                      </button>
                      {open && (
                        <div className="border-t border-border px-4 py-3 text-sm">
                          <p className="text-foreground-muted">{entry.definition_metier}</p>
                          {entry.example ? (
                            <p className="mt-2 rounded bg-brand-soft px-2 py-1.5 text-xs text-brand-strong">
                              <span className="font-semibold">Comprendre avec un exemple : </span>
                              {entry.example}
                            </p>
                          ) : null}
                          {entry.common_mistake ? (
                            <p className="mt-2 text-xs text-warning">⚠ Erreur fréquente : {entry.common_mistake}</p>
                          ) : null}
                          {entry.related_terms.length > 0 ? (
                            <p className="mt-2 text-xs text-foreground-muted">
                              Termes liés : {entry.related_terms.join(", ")}
                            </p>
                          ) : null}
                          {linkedCase ? (
                            <Link
                              href={`/cas-pratiques/${linkedCase}`}
                              className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
                            >
                              Voir dans un cas pratique ({linkedCase}) →
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
