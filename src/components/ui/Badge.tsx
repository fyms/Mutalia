import { cx } from "@/lib/utils/format";
import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-surface-muted text-foreground-muted border-border",
  brand: "bg-brand-soft text-brand-strong border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badge dédié aux valeurs contractuelles non vérifiées : jamais inventer, toujours signaler. */
export function DataToVerifyBadge({ label = "Donnée 2026 à vérifier" }: { label?: string }) {
  return (
    <Badge tone="warning" className="italic">
      ⚠ {label}
    </Badge>
  );
}
