"use client";

import { useTransition } from "react";
import { updateComplaintStatusAction } from "@/lib/domain/p2Actions";
import { COMPLAINT_STATUSES, type ComplaintStatus } from "@/lib/domain/constants";

const LABELS: Record<ComplaintStatus, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  cloturee: "Clôturée",
};

export function ComplaintStatusControl({
  id,
  householdId,
  status,
}: {
  id: string;
  householdId: string;
  status: ComplaintStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateComplaintStatusAction(id, householdId, e.target.value as ComplaintStatus))
      }
      className="rounded-md border border-border px-2 py-1 text-xs"
    >
      {COMPLAINT_STATUSES.map((s) => (
        <option key={s} value={s}>{LABELS[s]}</option>
      ))}
    </select>
  );
}
