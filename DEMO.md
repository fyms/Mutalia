# Démonstration locale Mutalia — Codex

Démarrage : `npm run build -- --webpack`, puis `npm run start -- --port 3000`.
Le secret et la base locale existants sont conservés. Ne pas relancer la création du premier administrateur pour une simple démonstration.

1. Ouvrir http://localhost:3000/login et se connecter avec son compte existant.
2. Cockpit : filtrer les 12 dossiers fictifs, ouvrir CASE-001.
3. GED : lire les deux PDF, qualifier les pièces, enregistrer un brouillon ; retrouver celui-ci après reconnexion.
4. Simulateur → Conventions collectives 2026 : IDCC 405, Option 1, honoraires signataires DPTM, facturé 300 €, BR 100 €, AMO 80 €. Résultat : complémentaire 140 €, reste à charge hors franchises 80 €.
5. Passer à IDCC 2691 : niveaux A/B/C/D, saisies et résultat remis à zéro ; source PDF distincte. Le calcul couvre uniquement les lignes hospitalisation affichées.
6. Mon compte ; pour un administrateur, Administration permet les invitations et la gestion des comptes. Le transport local capture les invitations : aucun e-mail réel n’est envoyé. `npm run auth:inbox` donne accès aux liens locaux à usage unique.

Parcours validé visuellement : login, connexion existante, cockpit, lecture PDF GED et simulateur CCN. Les tests automatisés utilisent une base temporaire.
Le pilotage collectif et les autres extensions métier exclues du stash ne font pas partie de cette démonstration. Les anciennes données métier étendues restent conservées, sans import dans le stockage P0.
