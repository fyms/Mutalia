# Progression Mutalia — Codex — 10 septembre 2026

## Terminé
- P0 initial conservé ; aucun apport de Claude, aucun ancien stash réappliqué.
- Lot CCN : huit lignes hospitalisation % BR, IDCC 405 et 2691 séparés ; données réutilisables, sources du dépôt et empreintes SHA-256.
- Consultation /garanties/conventions et onglet /simulateur?tab=conventions ; PDF accessibles par identifiant autorisé.
- Simulation avec AMO saisie, plafond aux frais, options 405 Base incluse, refus des combinaisons invalides ; remise à zéro au changement de convention.
- Validation : npm ci, ESLint, 24 tests Vitest 5, build Webpack/TypeScript réussis. Navigateur : 405 Option 1 AMC 140 €, 2691 B AMC 70 € (facturé 300, BR 100, AMO 80), navigation et remise à zéro vérifiées. HTTP 200 sur les pages du lot, PDF servis identiques aux sources, identifiant inconnu refusé en 404.

## Reste à faire
- P0 : authentification réelle, invitations, isolation des travaux et droits formateur dans cette branche.
- P1 : autres postes CCN (conditions/forfaits/plafonds), rattachement des contrats fictifs ; formation structurée.

## Problèmes connus
- Cette branche utilise encore des rôles simulés et un stockage partagé : démonstration locale uniquement, pas de données personnelles réelles.
- Référentiel CCN partiel, hors franchises/participations non remboursables ; droits et conditions à vérifier. Ne pas mélanger PSI/PLI et CCN.
- Préparation du lot comptes : npm a refusé Better Auth 1.7.3 avec Vitest 5 (peer compatible 2/3/4). Aucun changement de dépendance appliqué ; résoudre ensemble les versions au prochain lot, sans --force.
- Les types .next/dev/types de l’ancienne branche ont été retirés pour débloquer le build ; aucun fichier source ancien restauré.

## Prochaine action
- Traiter le P0 authentification/isolation par un lot autonome sur Codex, sans réappliquer le stash.
- Démo du lot courant : npm run build -- --webpack puis npm run start -- --port 3002 ; /garanties/conventions.
