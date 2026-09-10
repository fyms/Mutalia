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

## Terminé — étape 3 : Mes dossiers
- Page /dossiers accessible dans la navigation : adhérent lié à la fiche 360°, type, priorité, statut, ancienneté, anomalie simulée et prochaine action.
- Dossiers fictifs stables liés aux 12 foyers pédagogiques et aux foyers manuels visibles du compte ; aucun workflow Prestations/PEC/Cotisations développé.
- Filtres combinables statut/priorité, tri urgence puis ancienneté, changement immédiat des statuts et priorités dans le runtimeStore existant avec isolation et contrôle des conflits.
- Résumé compact du cockpit : à traiter, urgents non terminés, incomplets, en attente.
- Validation finale : 23 tests ciblés, typecheck et lint réussis ; persistance SQLite, isolation, liens aux foyers, tri, compteurs et actualisation contrôlés.

## Restant — étape 3
- Aucun problème bloquant constaté. Les dossiers et anomalies affichés sont des simulations.

## Prochain travail
- Attendre les instructions de l’étape suivante. Commit local uniquement, aucun push.

## Terminé — étape 4 : Prestations
- Page Prestations fonctionnelle : création, adhérent/bénéficiaire, acte et date de soins, montants, anomalies, résultats et historique des statuts.
- Réutilisation directe de computeReimbursement : % BRSS, forfait complémentaire et frais réels ; aucune copie des calculs ni affectation automatique de garantie depuis une formule.
- Garantie/source/droits non contrôlés : « Donnée 2026 à vérifier », aucun résultat présenté comme liquidé et validation bloquée. Correction possible avant calcul ; contrôle des dates et de l’AMO supérieure au facturé.
- Workflow séquentiel Reçue → À contrôler → Calculée → Validée → Payée → Clôturée ; paiement strictement pédagogique, sans flux financier.
- Persistance et historique dans le runtimeStore par compte, conflits de révision contrôlés ; historique dans l’onglet Prestations des fiches 360° pédagogiques et manuelles.
- Dossier de contrôle lié automatiquement à chaque prestation, actualisé sans doublon avec les anomalies et l’avancement ; cockpit actualisé.
- Validation finale : 37 tests ciblés (prestations, moteur existant, dossiers, adhérents, comptes), typecheck et lint réussis.

## Restant — étape 4
- Aucun problème bloquant constaté. Les garanties doivent être renseignées et vérifiées pour l’exercice ; aucun barème contractuel manquant inventé.
- PEC, cotisations, NOEMIE complet et paiement réel hors périmètre.

## Prochain travail
- Attendre les instructions suivantes. Commit local uniquement, aucun push.

## Terminé — étape 5 : Flux & Anomalies
- Centre opérationnel /flux-anomalies : adhérent, liens directs prestation/dossier/360°, type, gravité, date, statut et lecture cause probable → impact → action recommandée.
- Filtres combinés gravité/statut/type et tri gravité puis ancienneté ; gravités Bloquante/Majeure/Mineure disponibles, sans inventer de contrôles pour remplir les catégories.
- Anomalies créées dans le runtimeStore avec les contrôles bloquants déjà identifiés par les prestations ; reprise des contrôles actifs des prestations antérieures sans doublon.
- Traitement À analyser/En cours/Résolue, note de résolution persistante, contrôle des versions et isolation par compte. Résolution refusée tant que la cause persiste ; incohérence AMO confirmée corrigée uniquement après recalcul réussi.
- Historique conservé, réouverture du même identifiant si le blocage revient, synchronisation des dossiers et du cockpit sans clôturer un contrôle restant actif ni modifier la liquidation.
- Validation finale : 39 tests concernés, typecheck et lint réussis (détection, reprise, résolution, réouverture, conflits, isolation, filtres, tri et synchronisation).

## Restant — étape 5
- Aucun problème bloquant constaté. Aucun flux NOEMIE/DRE/ROC complet ni règle contractuelle Harmonie ajoutés.

## Prochain travail
- Attendre les instructions suivantes. Commit local uniquement, aucun push.

## Terminé — étape 6 PEC & Devis
- Création, correction, estimation AMC/RAC par le moteur existant et workflows Devis/PEC avec refus motivé obligatoire, historique et persistance runtimeStore par compte.
- Liste et historique 360°, dossiers et anomalies synchronisés ; données contractuelles inconnues conservées sous « Donnée 2026 à vérifier ». Refus : clôture administrative documentée sans accord ni effacement du contrôle source.
- Validation finale : 42 tests ciblés réussis, typecheck et lint réussis. Foyers pédagogiques préservés, aucun calcul dupliqué ni flux réel.

## Restant — étape 6
- Aucun problème bloquant constaté.

## Prochain travail
- Attendre les instructions suivantes ; commit local uniquement, aucun push.
