"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/components/layout/nav";
import { cx } from "@/lib/utils/format";

const PHASE_TONE: Record<string, string> = {
  P0: "text-brand",
  P1: "text-foreground-muted",
  P2: "text-foreground-muted",
  P3: "text-foreground-muted",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
          M
        </div>
        <div>
          <p className="text-sm font-semibold leading-4">Mutalia</p>
          <p className="text-[11px] text-foreground-muted">Jumeau pédagogique</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(
                        "flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition",
                        active
                          ? "bg-brand-soft font-medium text-brand-strong"
                          : "text-foreground hover:bg-surface-muted",
                      )}
                    >
                      <span>{item.label}</span>
                      {item.phase !== "P0" ? (
                        <span className={cx("text-[10px] font-semibold", PHASE_TONE[item.phase])}>
                          {item.phase}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-4 py-3 text-[11px] text-foreground-muted">
        Environnement de formation — aucune donnée réelle, aucun flux réel.
      </div>
    </aside>
  );
}
