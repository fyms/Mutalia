# Progression Mutalia — Codex

## Terminé
- Récupération sélective Codex : charte, logo, navigation, connexion, activation, récupération, comptes et sessions réelles.
- GED privée, brouillons avec contrôle de révision, annotations et résultats isolés par compte dans SQLite ; ancien stockage étendu conservé sans import.
- Point de sécurité `securite/avant-recuperation-codex-20260910` sur `2d0b3fa` ; stash conservé, aucune fusion ni reprise de commit Claude.
- Deux commits locaux et lot Harmonie 2026 conservés : sources officielles, séparation IDCC 405/2691, huit lignes hospitalisation et simulateur.
- 21 tests ciblés (9 comptes/isolation/persistance et 12 CCN), TypeScript, ESLint et build Webpack réussis. Compte local existant conservé.

- Vérification visuelle : login et connexion Armel, cockpit, PDF GED, administration et simulateur CCN ; résultat 405 Option 1 = AMC 140 €, remise à zéro en passant à 2691.
- Recherche et PDF GED sans session : 401 ; ancien chemin public : 404.
- Guide local `DEMO.md` ; serveur disponible sur http://localhost:3000.

## Restant
- Pilotage formateur non récupéré ; extensions métier de provenance Claude/incertaine écartées.
- CCN limité à l’hospitalisation % BR ; autres postes, droits et conditions à compléter ultérieurement.

## Prochain travail
- Prochain lot distinct : compléter les postes CCN manquants depuis les sources officielles, en maintenant la séparation des conventions.

## Terminé — étape 1 : création d’adhérent
- Formulaire /adherents/nouveau, validation serveur, formules issues du référentiel 2026, identifiants uniques et persistance SQLite par compte.
- Redirection vers la fiche 360°, présence après rechargement, liste et recherche actualisées ; 12 foyers pédagogiques conservés.
- Modèle préparé pour modification/suppression futures, sans développer ces fonctions.
- Validation déjà effectuée : 14 tests ciblés, typecheck, lint et parcours navigateur. Foyer de recette retiré après vérification.

## Restant — étape 1
- Aucun problème bloquant constaté.

## Prochain travail
- Attendre les instructions pour l’étape suivante.

## Terminé — étape 2 : édition et bénéficiaires
- Modification des informations de l’adhérent manuel depuis la fiche 360° avec réutilisation du formulaire de création.
- Ajout, modification et retrait confirmé des bénéficiaires ; persistance transactionnelle dans le runtimeStore existant, identifiants stables et contrôle de révision.
- Liste, fiche et recherche actualisées, y compris les noms des bénéficiaires ; isolation par compte et 12 foyers pédagogiques conservés.
- Validation finale : typecheck, lint et 19 tests concernés réussis, dont confirmation/annulation du retrait, conflits, isolation et conservation des données existantes.

## Restant — étape 2
- Aucun problème bloquant constaté. Aucun autre module développé.

## Prochain travail
- Attendre les instructions pour la suite. Commit local uniquement ; push manuel à l’initiative de l’utilisateur.
