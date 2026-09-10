import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { RecoveryForm } from "@/components/auth/RecoveryForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const q = await searchParams;
  return (
    <main className="m-panel mx-auto my-12 w-full max-w-md">
      <Logo />
      <h1 className="my-4">Activation / récupération</h1>
      {q.error ? (
        <p role="alert">Lien invalide ou expiré. Demandez un nouveau lien.</p>
      ) : null}
      <RecoveryForm token={q.token} />
      <Link className="underline" href="/login">
        Retour à la connexion
      </Link>
    </main>
  );
}
