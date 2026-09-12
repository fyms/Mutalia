import { cx } from "@/lib/utils/format";
import type { ReactNode } from "react";

const TONES = {
  neutral: "",
  brand: "m-badge--info",
  success: "m-badge--good",
  warning: "m-badge--warn",
  danger: "m-badge--bad",
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
        "m-badge inline-flex items-center gap-1",
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
