import Link from "next/link";
import { cx } from "@/lib/utils/format";

export function QueryTabs({
  basePath,
  activeKey,
  tabs,
  paramName = "tab",
}: {
  basePath: string;
  activeKey: string;
  tabs: { key: string; label: string }[];
  paramName?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={`${basePath}?${paramName}=${tab.key}`}
            className={cx(
              "-mb-px rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium",
              active
                ? "border-border bg-surface text-brand-strong"
                : "border-transparent text-foreground-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
