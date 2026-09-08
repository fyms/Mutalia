import { StubPage } from "@/components/ui/EmptyState";

export default function PrestationsPage() {
  return (
    <StubPage
      title="Prestations"
      phase="P2"
      description="Le workflow complet de liquidation des prestations (contrôle, calcul, mise en paiement pédagogique) est prévu en P2. Le simulateur de remboursement (menu Simulateur) couvre déjà le calcul BRSS/AMO/AMC en P0."
      bullets={[
        "Historique de prestations liquidées par bénéficiaire",
        "Rapprochement devis / facture / décompte",
        "Détection d'anomalies intégrée au workflow (aujourd'hui disponible via les cas pratiques)",
      ]}
    />
  );
}
