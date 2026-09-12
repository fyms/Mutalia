# Audit de stabilisation — 12 septembre 2026

Branche : **Codex**. Commit audité : **a33351a**, puis correction ciblée incluse dans le commit de ce rapport. Aucun push, tag, référentiel ou cas source modifié.

## Verdict

**GO — prêt pour tests utilisateurs** dans le périmètre pédagogique. Aucun P0/P1 restant identifié dans les contrôles ci-dessous ; ce verdict ne constitue pas une certification de production ou de sécurité exhaustive.

| Niveau | Trouvés pendant cet audit | Corrigés | Restants |
|---|---:|---:|---:|
| P0 | 0 | 0 | 0 identifié |
| P1 | 1 | 1 | 0 identifié |
| P2 | 3 | 0 | 3 + 5 réserves historiques |

## Correction P1 : documents orphelins

Reproduction dans une base temporaire : créer un adhérent manuel, importer un PDF, clôturer avec le motif « Création par erreur », puis demander sa suppression renforcée. La suppression réussissait malgré le document associé et rompait son rattachement métier.
`deleteErroneousHousehold` vérifie désormais aussi les tables GED, par compte et foyer. Un document ou un événement documentaire interdit la suppression ; la fiche clôturée et son historique restent conservés. Le test échoue avant correction, puis réussit avec conservation des octets et maintien du blocage après suppression explicite du document importé. La suppression exceptionnelle d’un foyer réellement sans historique reste testée.

## Validation automatisée

- `npm test` : **37 fichiers, 180 tests réussis**, une passe complète avant correction.
- Après reproduction et correction : tests GED + adhérents **17/17 réussis**, dont un nouveau test de régression (181 tests distincts au total).
- `npm run typecheck` et `npm run lint` : réussis, également après correction ; aucun avertissement ESLint. Avertissement Vite sur le chargement futur de sa configuration, sans échec.
- `npm run build -- --webpack` : **réussi**, compilation, TypeScript et 36 pages générées. Revalidé après correction ; l’ancienne limitation Turbopack ne bloque pas ce build webpack. Navigation contrôlée sur le serveur de développement, sans prétendre à un smoke-test du serveur de production.

| Périmètre | Preuves réutilisées / rejouées |
|---|---|
| Adhérent | Création/modification, validation des champs/formules, recherche nom/identifiant, bénéficiaires, clôture, persistance SQLite et isolation ; banque Démo et historique générique ; génération/masquage/recherche exacte du NIR synthétique. |
| Commune | Tests commune unique/multiple/absente, changement postal, édition, cache et panne avec secours manuel. Navigateur : 45130 charge une liste alphabétique de dix communes ; ville initialement désactivée. |
| Pédagogie | Overlay par compte, source inchangée, bénéficiaires/formule/NIR, réinitialisation préservant progression, brouillons, scores/soumissions, états documentaires et uploads. |
| Prospects / Agenda | Création rapide, réutilisation, modification, conversion atomique unique avec coordonnées, historique ; date/heure/durée, déplacement, chevauchement confirmé, annulation, Réalisé/contact, clôture, isolation, 360° et Cockpit. Tests des trois vues et du mois dense. |
| GED | PDF/PNG/JPEG, extension/MIME/signature, taille 10 Mo, propriétaire/foyer/bénéficiaire, stockage séparé, relecture, états, suppression confirmée des imports uniquement, migration des générés ; composants des trois sources et raccourci 360°. |
| AMO | Copie A4, empreintes PDF/PNG sources inchangées, bon bénéficiaire et période, AMO 72 €, NIR synthétique, accès isolé, présence GED et conservation après reset. Résolution CPAM par commune INSEE, adresse officielle, ambiguïtés, cache/panne testés avec réponses contrôlées, sans nouvelle interrogation documentaire. |
| Métier | Prestations, dossiers, PEC/devis, anomalies, cotisations et relation : suites existantes de calculs, transitions, liens et persistance. |
| Garanties | Verified simple calculable, needs_review bloqué, not_extracted absent, conditions/consommation inconnues bloquées, PSI/PLI séparés et CCN conservées. Estimation de cotisation explicitement non contractuelle. |
| Sécurité | Tests sessions HTTP, droits, origine, déconnexion/reconnexion, récupération et séparation des comptes ; pas de NIR complet dans les résultats de recherche ni d’ancien IBAN dans la timeline. Inspection ciblée des routes GED et clés de fichiers : accès authentifié, owner/foyer/id, aucune entrée de chemin arbitraire. |

## Contrôles navigateur de cette passe

Session authentifiée existante réutilisée. GED source : aperçu PDF visible, aucune suppression de pièce source proposée. Fiche Marc Garnier : actions, estimation non contractuelle, coordonnées et événements documentaires génériques. Liste adhérents et formulaire de création consultés sans nouvel enregistrement.
Agenda : Semaine, Mois et Aujourd’hui ; rendez-vous Annulé/Réalisé historiques conservés. Mois contrôlé visuellement à **1440, 820 et 390 px**, navigation mobile ouverte ; monogramme SVG et état actif conservés. Arial et graisses 400/700 confirmés dans les tokens, tracé SVG vérifié dans le composant partagé.
Prestations → dossier de contrôle, Anomalies → liens prestation/dossier/fiche, PEC/devis (état vide), Cockpit et Prospects consultés. Les mutations détaillées sont couvertes par les tests automatisés, pas toutes recréées au navigateur. La liste Prospects affiche son rendez-vous futur existant.
Simulateur : prothèse fixe **2691 B, 340 % BR**, facturé 440 €, BRSS 120 €, AMO 60 % → **AMO 72 €, AMC 336 €, RAC 32 €**. Consultation des candidats particuliers signalée « Donnée 2026 à vérifier », sans calcul disponible tant que la sélection et les contrôles nécessaires ne sont pas établis.

## P2 et limites conservées

Trois constats de cette passe : topbar mobile occupant environ 275 px avant le contenu ; texte « Tous les champs sont requis » malgré NIR/banque optionnels ; libellés candidats issus de l’extraction parfois fragmentés, toujours explicitement non vérifiés. Aucun blocage constaté.
Cinq réserves héritées du précédent audit, non corrigées et non toutes rejouées : repli des identifiants/boutons Prestations à 820 px ; recherche des archives sans badge de clôture ; réouverture de `action=add` après rechargement ; hétérogénéité de certains badges/espacement de liens ; libellé « Auxiliaires médicaux » du taux AMO 60 % peu adapté au dentaire (reconstaté, résultat exact).
La vue Mois mobile nécessite du défilement ; contrôle responsive ponctuel, pas audit exhaustif d’accessibilité. GED : contrôle de format/signature, sans antivirus ni validation exhaustive du contenu des fichiers. CPAM ambiguë ou indisponible conserve le fallback, sans caisse inventée. Aucun paiement, flux bancaire, télétransmission ou envoi réel. Référentiel particuliers encore partiellement validé.
Les imports ne sont pas versionnés : `git ls-files .data` vide et `git check-ignore .data/uploads/a.pdf` positif. Seuls le garde-fou, son test et ce rapport sont inclus dans le commit ; les scénarios destructifs de reproduction utilisent des bases temporaires, sans suppression des données utilisateur.
