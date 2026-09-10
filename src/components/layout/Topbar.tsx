import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/search/CommandPalette";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { getSession } from "@/lib/store/session";

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="m-topbar flex flex-wrap items-center justify-between gap-4 px-4 py-2.5">
      <CommandPalette />
      <ModeSwitcher accountRole={session.accountRole} role={session.role} level={session.level} newHireMode={session.newHireMode} />
      <UserMenu displayName={session.displayName} email={session.email} />
    </header>
  );
}
