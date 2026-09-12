"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { normalizeDemoNir } from "@/lib/domain/demoSocialSecurity";
import type { SearchItem } from "@/lib/domain/search";

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  lexique: "Lexique",
  faq: "FAQ",
  academy: "Academy",
  adherent: "Adhérents",
  cas: "Cas pratiques",
  document: "Documents",
  page: "Pages",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nirMatches,setNirMatches]=useState<{query:string;items:SearchItem[]}>({query:"",items:[]});
  const nirQuery=normalizeDemoNir(query);
  const isNir=/^(DEMO)?[0-9]{15}$/.test(nirQuery);
  useEffect(()=>{
    if (!open || !isNir) return;
    const controller=new AbortController();
    fetch("/api/search-index",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:nirQuery}),signal:controller.signal,cache:"no-store"})
     .then(r=>r.ok?r.json():[]).then(items=>{if(!controller.signal.aborted)setNirMatches({query:nirQuery,items});}).catch(()=>{});
    return ()=>controller.abort();
  },[open,isNir,nirQuery]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") closePalette();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    {
      fetch("/api/search-index", {cache: "no-store", signal: controller.signal})
        .then((r) => r.json())
        .then((data: SearchItem[]) => setItems(data))
        .catch(() => { if (!controller.signal.aborted) setItems([]); });
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open]);

  const fuse = useMemo(() => {
    if (!items) return null;
    return new Fuse(items, {
      keys: [
        { name: "title", weight: 2 },
        { name: "subtitle", weight: 1 },
        { name: "category", weight: 0.5 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [items]);

  const results = useMemo(() => {
    if (isNir) return nirMatches.query===nirQuery?nirMatches.items:[];
    if (!items) return [];
    if (!query.trim()) return items.slice(0, 8);
    return fuse?.search(query, { limit: 20 }).map((r) => r.item) ?? [];
  }, [fuse, items, query,isNir,nirMatches,nirQuery]);

  const go = useCallback(
    (item: SearchItem) => {
      router.push(item.url);
      closePalette();
    },
    [router, closePalette],
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 items-center justify-between rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted transition hover:border-brand/50"
      >
        <span>Rechercher (adhérents, lexique, FAQ, cas…)</span>
        <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
      onClick={closePalette}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              go(results[activeIndex]);
            }
          }}
          placeholder="Rechercher un adhérent, un terme du lexique, une question FAQ, un cas pratique…"
          className="w-full border-b border-border px-4 py-3 text-sm outline-none"
        />
        <div className="max-h-96 overflow-y-auto scrollbar-thin p-1">
          {items === null ? (
            <p className="px-3 py-6 text-center text-xs text-foreground-muted">Chargement de l&apos;index…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-foreground-muted">Aucun résultat.</p>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm ${
                  idx === activeIndex ? "bg-brand-soft" : "hover:bg-surface-muted"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] uppercase text-foreground-muted">
                    {TYPE_LABELS[item.type]}
                  </span>
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">{item.subtitle}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
