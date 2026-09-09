import { CommandPalette } from "@/components/search/CommandPalette";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { getSession } from "@/lib/store/session";

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2.5">
      <CommandPalette />
      <div className="flex items-center gap-2">
        <ModeSwitcher
          accountRole={session.accountRole}
          role={session.role}
          level={session.level}
          newHireMode={session.newHireMode}
        />
        <UserMenu displayName={session.displayName} email={session.email} />
      </div>
    </header>
  );
}
