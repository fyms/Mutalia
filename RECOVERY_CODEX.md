# Récupération sélective — 10 septembre 2026

Point de départ : `2d0b3fa31640d8d1d3e70c08da337401115acecc`, branche Codex.
Sécurité : `securite/avant-recuperation-codex-20260910`.
Stash lu, jamais appliqué : `dab393eabadcf1c7f8f075ad005cf12491b9dd54`, base `038b6c2fdc0d5c2d309255f15a86eaa663153c5c`, parent des fichiers non suivis `00636e205abb81c35a9fd2c90ebf7c6280ab43b8`.

## Éléments établis Codex
Le reflog place les travaux non commités sur `codex/mutalia-v3-poste-metier`, avant sauvegarde puis passage à Codex. Cette métadonnée seule ne prouve pas l’auteur d’un hunk : elle est recoupée avec les créations et modifications réalisées dans cette session.
Les bases de globals.css, des layouts, Sidebar et CaseSubmissionForm sont identiques entre HEAD et le parent du stash ; seuls leurs changements Codex ont été repris.
Les nouveaux modules Better Auth, comptes, logo, contrôles, brouillons et GED correspondent aux créations Codex de cette session. LoginForm, UserMenu, ModeSwitcher, session, administration et cockpit ont été remplacés par Codex lors du même travail.

## Exclusions
Pas de restauration globale du runtimeStore, des loaders, des types, du lockfile ou de la page login héritée. Pas de CRUD clients/devis, génération de cas/PDF, surcharge pdfUrl, anciens tableaux métier ni pilotage étendu. Aucun merge, cherry-pick ou stash apply/pop.

## Raccordements minimaux au P0
Topbar et page login composent les composants récupérés. Les appelants transmettent l’identité serveur au stockage. Le schéma P0 documents/résultats est conservé dans des tables codex_learner_work/codex_submission_receipt séparées : aucune lecture/importation ni écrasement des anciennes données étendues. Les brouillons Codex et comptes existants restent conservés.
Le handler GED ne sert que les PDF seedés du P0, déplacés à l’identique hors public ; branche PDF générés exclue. Les DTO apprenants retirent les indices de correction. Les versions des dépendances auth/PDF sont reprises sélectivement ; lock régénéré, Vitest 4 compatible avec Better Auth.
Les fichiers Harmonie 2026 et les deux commits locaux restent inchangés.
