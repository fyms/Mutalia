import { CommandPalette } from "@/components/search/CommandPalette";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher";
import { getSession } from "@/lib/store/session";
import { getProfiles } from "@/lib/store/runtimeStore";

export async function Topbar() {
  const [session, profiles] = await Promise.all([getSession(), Promise.resolve(getProfiles())]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2.5">
      <CommandPalette />
      <div className="flex items-center gap-2">
        <ProfileSwitcher profiles={profiles} currentProfileId={session.profileId} />
        <ModeSwitcher role={session.role} level={session.level} newHireMode={session.newHireMode} />
      </div>
    </header>
  );
}
