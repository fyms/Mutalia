# Extraction Harmonie 2026 — lot 2A

Le schéma JSON Schema draft-07 et l'échantillon sont dans `data/references/harmonie/2026/`, séparés du manifest. Aucun consommateur métier n'utilise ces candidats.

## Reproduction

Installer `scripts/requirements-harmonie-extraction.txt` dans un environnement Python et les dépendances npm existantes (Ajv). Depuis le dépôt :

```sh
python3 scripts/extract_harmonie.py
python3 -m unittest discover -s scripts -p 'test_harmonie*.py'
node scripts/validate_harmonie_extraction.cjs data/references/harmonie/2026/extraction-sample.json
```

Par défaut : PSI111, PLI211, PSI114, PSI113 et synthèse 2026. `--references` permet une sélection explicite de 1 à 5 références du manifest ; les CCN sont exclues. Le SHA256 et la classification sont contrôlés avant lecture. Aucune extraction des 43 PDF n'a été lancée.

## Interprétation

Chaque ligne conserve référence, famille, régime, catégorie, prestation/sous-prestation, mode, valeur littérale éventuelle, unité, limite, conditions à contrôler, fichier, page, SHA, zone, texte brut, confiance et statut. Les textes de contexte sont conservés par page ; une limite ou condition non isolée reste à consulter dans ce contexte. Les codes PSI et PLI restent distincts, y compris lorsque la synthèse emploie PSI dans sa page régime local.

L'extraction géométrique cible le gabarit des quatre fiches observées. Les exemples de remboursement et pages pédagogiques sont exclus. Chaque page possède un bilan de couverture ; un tableau ou gabarit non reconnu est `not_extracted`, jamais une garantie nulle. L'optique non reconnue reste à extraire.

Les barres AMO/ticket modérateur/dépassement sont conservées ensemble sans somme. Valeurs superposées, alternatives, plafonds et conditions donnent `needs_review`. Même une valeur littérale simple reste à revoir : elle n'est pas une garantie AMC validée. `confidence` exprime une confiance technique, pas une validation contractuelle. Aucun candidat n'est automatiquement `verified` ; ce statut exige une revue documentaire identifiée (`verifiedBy`), une confiance de 1 et aucune réserve ouverte.

Ambiguïtés connues : chiffres superposés ; composantes AMO/TM non séparées ; plafonds partagés ; titre de la synthèse page 3 discordant avec son contenu ; codes PSI dans sa page 4 régime local. Les résoudre sur la page source avant toute intégration métier ou extension à d'autres gabarits.
