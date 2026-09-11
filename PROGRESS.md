# Mutalia — état courant Codex

## Socle livré
- Comptes, sessions et stockage SQLite isolé ; 12 foyers pédagogiques, adhérents manuels et bénéficiaires, fiche 360°, GED et simulateurs existants.
- Dossiers, prestations, anomalies, PEC/devis, cotisations pédagogiques, contacts et réclamations persistants ; navigation métier actualisée.
- Simulateur : catalogue 2026 documenté (dont dentaire), identifiants uniques, catégorie/convention/niveau/garantie chargés ensemble ; présentation conservée.
- Historique détaillé : [étapes 1 à 8](docs/history/PROGRESS-etapes-1-8.md).

## Limites actuelles
- Aucun paiement, prélèvement, envoi métier ou télétransmission réel. Montants de cotisation saisis à titre pédagogique.
- Plafonds, consommations, HLF/PLV et unités PLI insuffisamment documentés : AMC/RAC non estimés. Référentiel Harmonie 2026 partiel ; IDCC 405 et 2691 séparés ; garantie inconnue : « Donnée 2026 à vérifier ».
- Prospects, Quiz et Pilotage formateur incomplets, masqués de la navigation ; Academy partielle.

## Prochaine priorité
- Stabilisation validée : 83 tests, typecheck, lint et build Webpack ; parcours navigateur des huit écrans métier réussi avec la session existante. Écran de login vérifié ; nouvelle authentification par mot de passe non rejouée.
- Catalogue validé : 24 tests concernés, typecheck et lint. Prothèse fixe 2691 B : 440 €/BRSS 120 €/AMO 60 % → AMO 72 €, AMC 336 €, RAC 32 €.
- Attendre la prochaine priorité utilisateur ; aucun push.
