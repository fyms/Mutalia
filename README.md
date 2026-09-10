# Mutalia — Jumeau pédagogique complémentaire santé

Prototype Next.js d'un jumeau pédagogique d'un back-office de complémentaire santé
particuliers (Harmonie Mutuelle, référentiel 2026) : cockpit, fiche adhérent 360,
garanties, simulateur de remboursement, GED d'exercice, lexique métier, FAQ,
recherche globale et 12 cas pratiques avec correction sans exposition du corrigé.

Le cahier des charges complet est dans [`CLAUDE.md`](./CLAUDE.md) et
[`docs/mutalia-spec/`](./docs/mutalia-spec). L'état d'avancement détaillé est dans
[`IMPLEMENTATION_REPORT.md`](./IMPLEMENTATION_REPORT.md).

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) (redirige vers `/cockpit`).

## Commandes

```bash
npm run dev        # serveur de développement
npm run build       # build de production
npm run start        # lancer le build de production
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test           # tests unitaires (Vitest)
```

## Données et sécurité

Environnement de formation : particuliers uniquement, documents fictifs par défaut,
avertissement avant tout import de document réel, aucune donnée bancaire/administrative
valide, référentiel Harmonie Mutuelle 2026 uniquement, PSI et PLI jamais confondus,
toute valeur contractuelle non vérifiée est affichée comme « Donnée 2026 à vérifier ».
Voir [`docs/mutalia-spec/DATA_SAFETY.md`](./docs/mutalia-spec/DATA_SAFETY.md).

## Conventions collectives 2026 — premier lot

Depuis Garanties, ouvrir **Conventions collectives 2026**, ou choisir cet onglet
dans Simulateur. Le lot couvre huit lignes hospitalisation en % BR pour IDCC 405
(Base/Option 1/Option 2) et IDCC 2691 (A/B/C/D), sans équivalence PSI/PLI.
Sources : `data/sources/harmonie/2026/`, empreintes dans `manifest.json`.
Les options 405 incluent la Base ; elles ne s’additionnent pas. La simulation
utilise l’AMO du dossier avant franchises, plafonne aux frais et exige la vérification
des conditions. Les autres postes restent à intégrer.

Validation du lot : `npm test`, `npm run lint`, `npm run build -- --webpack`.
Reprise courte et limites actuelles : [PROGRESS.md](PROGRESS.md).
