# CLAUDE CODE MASTER PROMPT - MUTALIA FULL PROTOTYPE

Explore d abord le repo entier. Identifie stack, routes, state, persistance, design system, tests et conventions. Évite les refactors globaux tant que P0 n est pas fonctionnel. Lis tous les fichiers de ce pack.

Vision : Mutalia = jumeau pédagogique d un back-office de complémentaire santé particuliers + Academy + GED + moteur de cas.

P0 : navigation métier, cockpit, adhérents/fichier 360, garanties 2026, simulateur, GED, lexique contextuel, FAQ, recherche globale, mode Nouveau collaborateur et 12 cas seedés avec PDFs/corrigés cachés.

P1 : Academy, quiz, progression, prestations, PEC, cotisations, réclamations, anomalies, générateur dynamique.

Contraintes : particuliers uniquement, pas de SI réel, pas de télétransmission réelle, données fictives, avertissement avant upload réel, answer_key jamais envoyé au client en mode apprenant, PSI/PLI distincts, valeur manquante = `Donnée 2026 à vérifier`, pas de niveaux 2022 dans les simulations actuelles.

Qualité : types stricts si possible, composants réutilisables, seeds idempotents, empty/loading/error states, tests sur calculs et permissions, build/lint/test avant fin.

Definition of done : Cockpit -> recherche adhérent -> fiche 360 -> ouvrir cas -> lire PDFs -> qualifier -> calcul/anomalie -> soumettre -> correction -> progression.

Créer à la fin `IMPLEMENTATION_REPORT.md` avec architecture, fonctionnalités terminées, mocks, commandes de lancement, tests exécutés et prochaines étapes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
