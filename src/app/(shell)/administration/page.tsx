import { getSession } from "@/lib/store/session";
import { db } from "@/lib/db";
import { Accounts, type AccountRow } from "@/components/admin/Accounts";
export default async function Page() {
  const s = await getSession();
  if (s.accountRole !== "administrateur")
    return (
      <section className="m-panel">
        <h1>Administration</h1>
        <p>Accès réservé aux administrateurs.</p>
      </section>
    );
  const users = db
    .prepare("SELECT id,email,name,role,banned,active FROM user ORDER BY name")
    .all() as AccountRow[];
  const assignments = db
    .prepare("SELECT trainer,learner FROM trainer_assignment")
    .all() as { trainer: string; learner: string }[];
  return (
    <>
      <h1 className="mb-4">Administration des comptes</h1>
      <p className="mb-6">
        L’administration des comptes ne donne pas accès aux corrigés réservés
        aux formateurs.
      </p>
      <Accounts users={users} assignments={assignments} />
    </>
  );
}
