import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs text-foreground-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StubPage({
  title,
  phase,
  description,
  bullets,
}: {
  title: string;
  phase: "P1" | "P2" | "P3";
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title={`${title} — disponible en ${phase}`}
        description={description}
        action={
          bullets ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-left text-xs text-foreground-muted">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : undefined
        }
      />
    </div>
  );
}
