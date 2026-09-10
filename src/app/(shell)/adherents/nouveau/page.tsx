import { getSession } from "@/lib/store/session";
import { getHouseholdFormulas } from "@/lib/domain/householdFormulas";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewHouseholdForm } from "@/components/adherents/NewHouseholdForm";
export default async function NewHouseholdPage() {
  await getSession();
  return <div><PageHeader title="Nouvel adhérent" description="Créer un foyer avec son adhérent principal." />
    <NewHouseholdForm formulas={getHouseholdFormulas()} />
  </div>;
}
