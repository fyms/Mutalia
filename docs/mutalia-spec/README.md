# Mutalia - Full Prototype Core

Socle commun aux prototypes Codex et Claude Code.

## Positionnement
Mutalia est un **jumeau pédagogique d'un environnement de gestion de complémentaire santé particuliers**. Il combine formation, simulation, GED d'exercice, dossier adhérent fictif, garanties, prestations, lexique, FAQ, Academy, anomalies, correction et progression.

Mutalia n'est pas un SI de production : pas de télétransmission réelle, pas de liquidation réelle, pas de paiement réel et pas de données de santé réelles dans les données seed.

## Données 2026
Le référentiel Harmonie Mutuelle 2026 inclus doit rester versionné. Les codes PSI et PLI restent distincts. Toute valeur non vérifiée doit être affichée comme `Donnée 2026 à vérifier`.

## Contenu
- `architecture/` : architecture produit, data model, roadmap et critères d'acceptation.
- `features/` : spécifications des modules.
- `data/` : lexique, FAQ, Academy, modes et données Harmonie 2026.
- `schemas/` : schémas JSON.
- `generator/` : générateur de cas/documents fictifs.
- `samples/` : 12 dossiers pédagogiques prêts à importer.
- `prompts/` : prompts maîtres Codex et Claude Code.
