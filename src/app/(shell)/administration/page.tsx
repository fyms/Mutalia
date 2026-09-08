import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { ResetButton } from "@/components/admin/ResetButton";
import { getSession } from "@/lib/store/session";
import { getTrainingModes } from "@/lib/data/loaders";
import { ASSISTANCE_LEVEL_LABELS, ROLE_LABELS } from "@/lib/domain/constants";

export default async function AdministrationPage() {
  const session = await getSession();
  const modes = getTrainingModes();

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Rôle actif, niveau d'aide, règles de données et réinitialisation du prototype."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Session courante" subtitle="Aucun compte réel : profil local au navigateur" />
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-foreground-muted">Rôle :</span>
            <Badge tone="brand">{ROLE_LABELS[session.role]}</Badge>
            <span className="text-foreground-muted">Niveau d&apos;aide :</span>
            <Badge tone="brand">{ASSISTANCE_LEVEL_LABELS[session.level]}</Badge>
          </div>
          <ModeSwitcher role={session.role} level={session.level} newHireMode={session.newHireMode} />
          <p className="mt-3 text-xs text-foreground-muted">
            Le mode Formateur donne accès au corrigé des cas pratiques (jamais visible en mode Apprenant,
            avant ou après soumission).
          </p>
        </Card>

        <Card>
          <CardHeader title="Modes d'aide (mode Nouveau collaborateur)" />
          <table className="w-full text-left text-xs">
            <thead className="text-foreground-muted">
              <tr>
                <th className="py-1 font-medium">Niveau</th>
                <th className="py-1 font-medium">Aide contextuelle</th>
                <th className="py-1 font-medium">Indices</th>
                <th className="py-1 font-medium">Tooltips</th>
              </tr>
            </thead>
            <tbody>
              {modes.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-1.5 capitalize">{m.id}</td>
                  <td className="py-1.5">{m.context_help}</td>
                  <td className="py-1.5">{m.hints ? "oui" : "non"}</td>
                  <td className="py-1.5">{m.tooltips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Règles de données" subtitle="Rappel des garde-fous du prototype" />
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Particuliers uniquement — aucune entreprise/TNS.</li>
            <li>Documents fictifs par défaut, marqués « DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR ».</li>
            <li>Avertissement affiché avant tout import de document réel (voir page Documents/GED).</li>
            <li>Aucune donnée bancaire ou administrative valide dans les fixtures (pas d&apos;IBAN ni de NIR valides).</li>
            <li>Référentiel Harmonie Mutuelle 2026 uniquement — aucune donnée 2022.</li>
            <li>Codes PSI et PLI jamais confondus.</li>
            <li>Toute valeur contractuelle non vérifiée est affichée comme « Donnée 2026 à vérifier », jamais inventée.</li>
            <li>Le corrigé (answer_key) n&apos;est jamais transmis au client en mode apprenant.</li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Réinitialisation" subtitle="Efface les statuts documentaires, annotations et soumissions locales" />
          <ResetButton />
        </Card>
      </div>
    </div>
  );
}
