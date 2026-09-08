import { CommandPalette } from "@/components/search/CommandPalette";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { getSession } from "@/lib/store/session";

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2.5">
      <CommandPalette />
      <ModeSwitcher role={session.role} level={session.level} newHireMode={session.newHireMode} />
    </header>
  );
}
