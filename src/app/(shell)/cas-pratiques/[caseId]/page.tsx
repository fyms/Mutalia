import { HouseholdDocumentWorkspace } from "@/components/ged/HouseholdDocumentWorkspace";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/store/session";
import { getCaseById } from "@/lib/data/loaders";
export default async function Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const s = await getSession();
  const { caseId } = await params;
  const c = getCaseById(caseId);
  if (!c) notFound();
  const a = c.household.members[0];
  return (
    <>
      <p className="m-help mb-3">Mutalia / Documents / GED</p>
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div>
          <h1>Contrôle documentaire</h1>
          <p>
            {caseId} · {a.first_name} {a.last_name} · {c.documents.length}{" "}
            pièces fictives
          </p>
        </div>
        <Link
          className="m-button m-button--secondary"
          href={`/adherents/${c.household.household_id}`}
        >
          Fiche adhérent
        </Link>
      </div>
      <p className="mb-4">
        1 Qualifier · 2 Contrôler · 3 Justifier · 4 Soumettre
      </p>
      <HouseholdDocumentWorkspace owner={s.userId} householdId={c.household.household_id} author={s.displayName}/>
    </>
  );
}
