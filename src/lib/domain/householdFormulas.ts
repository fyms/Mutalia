import "server-only";
import { getHarmonieReferential } from "@/lib/data/loaders";

export function getHouseholdFormulas() {
  const architecture = getHarmonieReferential().canonical_2026_architecture;
  const labels = {
    regime_general: "Régime général",
    regime_local: "Régime local",
    reflexe_eco_pharmacie_et_chambre: "Réflexe éco pharmacie et chambre",
    reflexe_eco_pharmacie: "Réflexe éco pharmacie",
  };
  return Object.entries(labels).flatMap(([group, label]) =>
    architecture[group as keyof typeof labels].map(item => {
      const formula = typeof item === "string" ? item : item.formula;
      return {key: `${group}:${formula}`, formula, label: `${label} — ${formula}`};
    }),
  );
}
