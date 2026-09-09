import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthSession } from "@/lib/store/session";

export default async function LoginPage() {
  const session = await getAuthSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-brand-strong">Mutalia</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Jumeau pédagogique — complémentaire santé particuliers (données fictives)
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h1 className="mb-4 text-sm font-semibold text-foreground">Connexion</h1>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-foreground-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-brand hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
