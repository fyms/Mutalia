# CODEX MASTER PROMPT - MUTALIA FULL PROTOTYPE

Travaille dans le dépôt Mutalia existant.

1. Inspecte stack, routing, state, persistance, design system et tests avant de modifier.
2. Lis intégralement README.md, DATA_SAFETY.md, architecture/, features/, data/, schemas/, samples/ et generator/.
3. Conserve ce qui fonctionne et implémente par étapes non destructives.

## P0
Sidebar métier, cockpit, adhérents/fichier 360, garanties 2026, simulateur remboursement, GED, Lexique, FAQ, recherche globale, mode Nouveau collaborateur, import des 12 cas seedés, visualisation PDF, soumission et scoring avec answer_key caché.

## P1
Academy, quiz/flashcards, progression, prestations workflow, PEC, réclamations, anomalies, cotisations simulées, génération dynamique.

## Règles
Particuliers uniquement. Données fictives par défaut. Avertissement avant upload réel. Pas d identifiants réels. Harmonie 2026 = data/harmonie_2026_training.json. PSI et PLI distincts. Valeur manquante = `Donnée 2026 à vérifier`. Pas d anciens niveaux 2022 dans les simulations actuelles.

## UX
Doit ressembler à un logiciel métier dense, pas à une landing page. Tables, filtres, drawers, timelines, statuts, commandes rapides.

## Parcours de démo minimal
Cockpit -> recherche adhérent -> fiche 360 -> Documents -> cas GED -> qualification/anomalie/calcul -> soumission -> correction -> progression.

À la fin : exécute lint/tests/build, corrige les erreurs, résume les fichiers modifiés et liste ce qui reste mocké.
