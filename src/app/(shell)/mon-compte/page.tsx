import { getSession } from "@/lib/store/session";
import { ROLE_LABELS } from "@/lib/domain/constants";
import Link from "next/link";
export default async function Page() {
  const s = await getSession();
  return (
    <section className="m-panel">
      <h1>Mon compte</h1>
      <p>{s.displayName}</p>
      <p>{s.email}</p>
      <p>{ROLE_LABELS[s.accountRole]}</p>
      <Link href="/recuperation" className="underline">
        Réinitialiser mon mot de passe
      </Link>
      <p>
        Vos brouillons enregistrés sont retrouvés après reconnexion. Les
        modifications non enregistrées ne sont pas récupérables.
      </p>
    </section>
  );
}
