import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthSession } from "@/lib/store/session";
export default async function Login({searchParams}:{searchParams:Promise<{expired?:string}>}) {
 if(await getAuthSession())redirect("/cockpit");
 const {expired}=await searchParams;
 return <main className="m-panel mx-auto my-12 w-full max-w-md"><Logo/><h1 className="my-4">Se connecter</h1>{expired&&<p role="status">Votre session a expiré. Reconnectez-vous.</p>}<LoginForm/><p className="mt-4"><Link className="underline" href="/recuperation">Mot de passe oublié ?</Link></p><p className="m-help">Activation sur invitation uniquement.</p></main>;
}
