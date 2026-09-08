import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, DataToVerifyBadge } from "@/components/ui/Badge";
import { getHarmonieReferential } from "@/lib/data/loaders";

export default async function GarantiesPage() {
  const referential = getHarmonieReferential();
  const { canonical_2026_architecture, verified_live_quote_2026_sample, metadata, training_rules } =
    referential;

  return (
    <div>
      <PageHeader
        title="Garanties 2026"
        description={`Référentiel ${metadata.provider} — ${metadata.product_family} — année ${metadata.reference_year} (particuliers uniquement). Vérifié le ${metadata.verified_on}.`}
      />

      <Card className="mb-4 border-warning/40 bg-warning-soft">
        <p className="text-sm font-semibold text-warning">⚠ Ne jamais confondre PSI et PLI</p>
        <p className="mt-1 text-xs text-warning">{verified_live_quote_2026_sample.warning}</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Architecture PSI — régime général"
            subtitle="Niveaux relatifs Soins / Équipements (source vérifiée 2026)"
          />
          <table className="w-full text-left text-xs">
            <thead className="text-foreground-muted">
              <tr>
                <th className="py-1 font-medium">Formule</th>
                <th className="py-1 font-medium">Soins</th>
                <th className="py-1 font-medium">Équipements</th>
              </tr>
            </thead>
            <tbody>
              {canonical_2026_architecture.regime_general.map((f) => (
                <tr key={f.formula} className="border-t border-border">
                  <td className="py-1.5"><Badge tone="brand">{f.formula}</Badge></td>
                  <td className="py-1.5">{"★".repeat(f.soins_stars)} ({f.soins_stars}/4)</td>
                  <td className="py-1.5">{"★".repeat(f.equipements_stars)} ({f.equipements_stars}/3)</td>
                </tr>
              ))}
            </tbody>
          </table>
          <DataToVerifyBadge label="Pourcentages détaillés par prestation non publiés — donnée 2026 à vérifier" />
        </Card>

        <Card>
          <CardHeader
            title="Architecture PSI — régime local (Alsace-Moselle)"
            subtitle="Niveaux relatifs Soins / Équipements"
          />
          <table className="w-full text-left text-xs">
            <thead className="text-foreground-muted">
              <tr>
                <th className="py-1 font-medium">Formule</th>
                <th className="py-1 font-medium">Soins</th>
                <th className="py-1 font-medium">Équipements</th>
              </tr>
            </thead>
            <tbody>
              {canonical_2026_architecture.regime_local.map((f) => (
                <tr key={f.formula} className="border-t border-border">
                  <td className="py-1.5"><Badge tone="brand">{f.formula}</Badge></td>
                  <td className="py-1.5">{"★".repeat(f.soins_stars)} ({f.soins_stars}/4)</td>
                  <td className="py-1.5">{"★".repeat(f.equipements_stars)} ({f.equipements_stars}/3)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Variante réflexe éco pharmacie + chambre" />
          <div className="flex flex-wrap gap-1.5">
            {canonical_2026_architecture.reflexe_eco_pharmacie_et_chambre.map((code) => (
              <Badge key={code} tone="neutral">{code}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Variante réflexe éco pharmacie" />
          <div className="flex flex-wrap gap-1.5">
            {canonical_2026_architecture.reflexe_eco_pharmacie.map((code) => (
              <Badge key={code} tone="neutral">{code}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Comparateur vérifié — devis en ligne (codes PLI)"
          subtitle={`Formules comparées : ${verified_live_quote_2026_sample.compared_formulas.join(", ")}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-foreground-muted">
              <tr>
                <th className="py-1.5 pr-4 font-medium">Prestation</th>
                {verified_live_quote_2026_sample.compared_formulas.map((f) => (
                  <th key={f} className="py-1.5 pr-4 font-medium">
                    <Badge tone="brand">{f}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {verified_live_quote_2026_sample.benefits.map((row) => (
                <tr key={row.benefit} className="border-b border-border last:border-0">
                  <td className="py-1.5 pr-4 font-medium">{row.benefit}</td>
                  {verified_live_quote_2026_sample.compared_formulas.map((f) => (
                    <td key={f} className="py-1.5 pr-4">{row[f]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Règles d'exercice 2026" />
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {training_rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
