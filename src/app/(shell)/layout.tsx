import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LexiconProvider } from "@/components/lexicon/LexiconProvider";
import { getLexicon } from "@/lib/data/loaders";
import { getSession } from "@/lib/store/session";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const [lexicon, session] = await Promise.all([getLexicon(), getSession()]);

  return (
    <LexiconProvider entries={lexicon} level={session.level}>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background px-6 py-6">{children}</main>
        </div>
      </div>
    </LexiconProvider>
  );
}
