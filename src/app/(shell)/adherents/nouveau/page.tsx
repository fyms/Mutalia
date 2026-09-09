import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/adherents/ClientForm";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Nouvel adhérent"
        description="Créer un adhérent fictif dans le portefeuille de démonstration (particuliers uniquement)."
      />
      <Card>
        <ClientForm mode="create" />
      </Card>
    </div>
  );
}
