import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LexiconProvider } from "@/components/lexicon/LexiconProvider";
import { getLexicon } from "@/lib/data/loaders";
import { getSession } from "@/lib/store/session";

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [lexicon, session] = await Promise.all([getLexicon(), getSession()]);

  return (
    <LexiconProvider entries={lexicon} level={session.level}>
      <div className="m-shell">
        <a href="#contenu" className="m-skip">
          Aller au contenu
        </a>
        <Sidebar />
        <div className="m-content flex min-h-screen flex-col">
          <Topbar />
          <main id="contenu" tabIndex={-1} className="m-main flex-1">
            {children}
          </main>
        </div>
      </div>
    </LexiconProvider>
  );
}
