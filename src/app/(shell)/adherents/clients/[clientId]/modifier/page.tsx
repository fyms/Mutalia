import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/adherents/ClientForm";
import { getClientById } from "@/lib/store/runtimeStore";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = getClientById(clientId);
  if (!client) notFound();

  const adherent = client.household.members.find((m) => m.role === "adherent");
  const beneficiaries = client.household.members
    .filter((m) => m.role !== "adherent")
    .map((m) => ({
      first_name: m.first_name,
      last_name: m.last_name,
      birth_date: m.birth_date,
      role: m.role as "conjoint" | "enfant",
    }));

  return (
    <div>
      <PageHeader
        title="Modifier l'adhérent"
        description={`${adherent?.first_name ?? ""} ${adherent?.last_name ?? ""} · ${client.id}`}
      />
      <Card>
        <ClientForm
          mode="edit"
          clientId={client.id}
          initial={{
            adherent: {
              first_name: adherent?.first_name ?? "",
              last_name: adherent?.last_name ?? "",
              birth_date: adherent?.birth_date ?? "",
            },
            beneficiaries,
          }}
        />
      </Card>
    </div>
  );
}
