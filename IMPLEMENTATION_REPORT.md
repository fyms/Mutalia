# Mutalia — Rapport d'implémentation P0

Statut : **P0 stable et fonctionnel**. Non démarré : P1, P2, P3.

## 1. Contexte et démarche

Le dépôt `fyms/Mutalia` était vide (aucun commit) : il n'existait aucun prototype
existant à inspecter. Le pack `Mutalia_ClaudeCode_Full_Prototype_Pack.zip` a été
décompressé dans `docs/mutalia-spec/` (source de vérité conservée telle quelle) et
`CLAUDE.md` copié à la racine, comme demandé par `START_HERE_CLAUDE_CODE.md`. La
priorité P0 définie dans `CLAUDE.md` a ensuite été implémentée intégralement avant
tout travail sur P1/P2.

## 2. Stack technique

- **Next.js 16 (App Router, Turbopack)** + **React 19** + **TypeScript strict**.
- **Tailwind CSS v4** pour un design system dense de back-office (pas d'effet landing
  page : sidebar persistante, tables denses, panneaux contextuels, statuts, tabs).
- **Zod** pour les schémas de données (`src/lib/domain/types.ts`), fidèles aux schémas
  JSON du pack (`training_case`, `member`, `document`, `answer_key`).
- **Fuse.js** pour la recherche floue côté client (palette de commande ⌘K).
- **Vitest** pour les tests unitaires (calculs, scoring, permissions).
- **Persistance fichier JSON idempotente** (`.data/runtime-store.json`, non versionné) :
  statuts documentaires, annotations GED, soumissions de cas, initialisée
  automatiquement si absente — pas de base de données externe requise pour ce
  prototype local.
- **Rôle / niveau d'aide** gérés par cookies (`src/lib/store/session.ts`), sans compte
  réel (prototype mono-utilisateur, conforme au périmètre P0).

## 3. Architecture du code

```
src/
  app/(shell)/…           pages métier (sidebar + topbar communs)
  app/api/search-index/    endpoint JSON de l'index de recherche global (public-safe)
  components/              UI (layout, ged, cases, lexicon, faq, simulateur, admin)
  lib/
    domain/                types, calculs (remboursement, plafond), scoring, permissions,
                            dérivation des foyers/adhérents, recherche
    data/                  loaders serveur-only des seeds (lexique, FAQ, academy,
                            référentiel 2026, cas) + answer_key (serveur uniquement)
      seed/                données publiques versionnées (dérivées du pack)
      private/answer-keys/ corrigés des 12 cas — jamais importés côté client
    store/                 session (cookies), persistance runtime, server actions
docs/mutalia-spec/          pack de spécification original (conservé intact)
public/exercices/<CASE-ID>/ PDFs fictifs des 12 cas (servis statiquement)
```

Le fichier `src/lib/data/private/answer-keys/*.json` n'est importé que par des modules
marqués `import "server-only"` (`loaders.ts`, `caseActions.ts`). Aucun composant client
n'y accède directement.

## 4. Fonctionnalités livrées (P0)

Correspondance avec `docs/mutalia-spec/architecture/acceptance_criteria.md` :

| Critère | Statut |
|---|---|
| 91 entrées de lexique seedées | ✅ (page `/lexique`, recherche, index alphabétique, catégories, niveaux, favoris localStorage, mini-quiz, tooltips contextuels `<Term>`) |
| 66 questions FAQ seedées | ✅ (page `/faq`, angles Comprendre / Que faire, contenu rédigé pour les 66 entrées — les champs `short_answer`/`detailed_answer`/`procedure_steps` du pack étaient vides et ont été complétés) |
| 19 modules Academy | ✅ structure seedée et affichée (`/academy`) ; contenu pédagogique détaillé (cours/flashcards/quiz) = **P1** |
| 12 cas GED prêts à importer | ✅ (`/cas-pratiques`, PDFs servis depuis `public/exercices/`) |
| Recherche globale | ✅ palette ⌘K (Fuse.js) sur lexique, FAQ, academy, adhérents, cas, documents, pages |
| Tooltips acronymes | ✅ composant `<Term acronym="BRSS">` branché sur le lexique, visibilité adaptée au niveau d'aide |
| PDF/JPG/PNG + preview + statuts + annotations | ✅ PDF (fournis) : preview iframe, workflow de statuts (Importé → … → Archivé), annotations ; JPG/PNG non fournis dans le pack (aucun cas n'en contient) |
| Mode apprenant ne reçoit jamais les corrigés | ✅ voir §5 |
| Fiche adhérent 360 | ✅ 10 onglets (Vue générale, Bénéficiaires, Contrat, Garanties, Cotisations, Prestations, PEC, Documents, Contacts, Historique) — les 3 onglets P2 affichent un état vide explicite |
| Prestations / PEC / cotisations / réclamations simulées | Hors P0 (prévu P2) — voir §6 |
| Calculs et anomalies testés | ✅ 12 tests Vitest (remboursement, plafond, scoring) |
| Build/lint/tests passent | ✅ voir §7 |

Navigation métier complète (19 entrées de `information_architecture.md`) : chaque
entrée existe et route vers une page réelle ; les pages hors périmètre P0 affichent un
état vide explicite avec la phase prévue (P1/P2/P3) plutôt qu'un lien mort.

### Détail des modules clés

- **Cockpit** (`/cockpit`) : indicateurs (foyers, cas, lexique, FAQ, cas tentés, score
  moyen), parcours recommandé, activité récente.
- **Adhérents** (`/adherents`) : liste des 12 foyers dérivés des cas seedés.
- **Fiche adhérent 360** (`/adherents/[householdId]`) : identité, composition du
  foyer, contrat, garanties (formule PSI affectée + niveaux étoiles), documents,
  historique des tentatives.
- **Garanties 2026** (`/garanties`) : architecture PSI complète (régime général,
  régime local, variantes réflexe éco), avertissement PSI ≠ PLI, comparateur vérifié
  PLI 411/421/521 avec le barème complet fourni par le pack, règles d'exercice 2026.
- **Simulateur** (`/simulateur`) : calcul BRSS → AMO → AMC → reste à charge
  (pourcentage BRSS, frais réels, forfait euros) et calcul de plafond annuel
  (disponible / consommé / dépassement). Aucune valeur non vérifiée n'est inventée :
  badge « Donnée 2026 à vérifier » si le pourcentage garanti n'est pas fourni.
- **GED** (`/documents` + panneau par cas) : filtres statut/type, preview PDF,
  changement de statut, annotations, avertissement avant import de document réel
  (bouton interactif de confirmation, aucun stockage réel de document importé).
- **Cas pratiques** (`/cas-pratiques`) : les 12 cas, formulaire de résolution
  (checklist d'objectifs, sélection d'anomalies, champs de calcul dynamiques,
  justification), soumission, correction chiffrée par dimension.
- **Progression** (`/progression`) : agrégat des tentatives par cas, score moyen.
- **Administration** (`/administration`) : rôle actif, niveau d'aide, règles de
  données, réinitialisation des données de session.
- **Mode Nouveau collaborateur** : bascule visible dans la topbar et
  l'administration ; les 4 niveaux d'aide (`debutant`/`intermediaire`/`autonome`/
  `expert`) du pack pilotent la densité des tooltips.

## 5. Sécurité du corrigé (answer_key)

Règle appliquée strictement, y compris après soumission :

- `src/lib/data/private/answer-keys/*.json` n'est lu que par du code serveur
  (`server-only`).
- L'action serveur `submitCaseAction` calcule le score complet côté serveur, **mais ne
  renvoie au client que** `{ caseId, submittedAt, score, maxScore, breakdown }` — jamais
  `correction.expectedValues/expectedActions/anomalies/trainerNotes` (type
  `LearnerFeedback`, distinct de `CaseSubmissionResult`).
- Le contenu brut du corrigé n'est accessible que via `getAnswerKeyForFormateurAction`,
  gardé par `assertFormateur(session.role)` — jamais appelable depuis un composant
  visible en mode apprenant.
- Vérifié par un test automatisé (`scoring.test.ts` : « never exposes the raw answer
  key fields outside the correction block ») et par un test end-to-end Playwright
  (voir §7) qui grep la réponse HTML/JSON en mode apprenant pour confirmer l'absence
  de toute valeur ou champ du corrigé, avant et après soumission.

## 6. Ce qui est mocké / hors périmètre P0

- **Prospects, Pilotage formateur multi-utilisateurs, catalogue de parcours** : hors
  P0/P1/P2 explicites du pack (P3) — page d'état vide.
- **Prestations, PEC & Devis dédiés, Cotisations, Flux & Anomalies, Relation
  adhérent** : modules P2 du roadmap — pages d'état vide renvoyant vers l'exercice
  équivalent déjà disponible (ex. simulateur, cas CASE-005 pour la PEC).
- **Academy détaillée, Quiz, flashcards** : structure du curriculum affichée, contenu
  pédagogique détaillé = P1.
- **Contrats** : pas d'entité séparée créée ; les données contractuelles vivent dans
  l'onglet « Contrat » de la fiche 360 (le modèle de données du pack ne distingue pas
  un CRUD contrat indépendant en P0).
- **Formule d'exercice par foyer** : le pack fournit `exercise_formula: "À lier au
  référentiel 2026"` comme placeholder explicite. Chaque foyer se voit assigner de
  façon déterministe (hash de l'identifiant de foyer) un code PSI réel du référentiel
  « régime général » — choix pédagogique explicite et documenté dans l'UI, jamais un
  pourcentage de garantie inventé : les pourcentages détaillés par prestation pour les
  codes PSI ne sont pas publiés dans le pack et restent affichés comme
  « Donnée 2026 à vérifier ».
- **Justification libre (dimension « explication » du scoring)** : notée
  automatiquement sur la longueur du texte en mode prototype, explicitement annoncée
  comme « indicative, à valider par un formateur » — aucune évaluation sémantique
  n'est simulée pour ne pas donner une fausse impression de correction experte.
- **Import de document réel** : le bouton affiche l'avertissement obligatoire du pack
  puis refuse explicitement l'opération (« aucun stockage réel prévu dans ce
  prototype ») plutôt que de simuler un upload qui n'aurait aucune conséquence réelle.
- **Favoris du lexique** : stockés en `localStorage` (par navigateur), pas de compte
  utilisateur en P0.

## 7. Tests exécutés

```bash
npm run lint        # ESLint (eslint-config-next + react-hooks) → 0 erreur, 0 warning
npm run typecheck    # tsc --noEmit → 0 erreur
npm run test          # Vitest → 3 fichiers, 12 tests passés
npm run build          # next build → succès, 25 routes générées
```

Tests unitaires (`src/lib/domain/*.test.ts`) :
- `reimbursement.test.ts` (6 tests) : calcul BRSS/AMO/AMC/RAC recalé sur la valeur
  vérifiée du pack (CASE-001 : facturé 80 €, BRSS 35 €, AMO 24,5 €), plafonnement au
  montant facturé, frais réels, forfait euros, garantie manquante → « donnée à
  vérifier » plutôt qu'une valeur inventée, taux AMO invalide rejeté.
- `caps.test.ts` (2 tests) : calcul de plafond annuel recalé sur CASE-012 (plafond
  1200 €, déjà consommé 600 €).
- `scoring.test.ts` (4 tests) : score parfait sur une soumission correcte, pénalité sur
  anomalie mal déclarée, tolérance de calcul, **non-exposition du corrigé brut** dans
  le résultat retourné au client apprenant.

Test end-to-end manuel (Playwright + Chromium, hors suite versionnée) exécuté contre
`npm run dev` pour valider le parcours complet du Definition of done :
Cockpit → recherche adhérent → fiche 360 → ouvrir un cas → lire les PDFs → qualifier →
calculer → soumettre → correction (sans fuite du corrigé) → progression mise à jour →
bascule mode Formateur → corrigé visible → recherche globale (⌘K) fonctionnelle.
Les 12 cas et les 12 fiches adhérent ont été vérifiés en HTTP 200, ainsi que le
service des PDFs (`Content-Type: application/pdf`).

## 8. Commandes de lancement

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000> (redirige vers `/cockpit`).

Autres commandes utiles :

```bash
npm run build && npm run start   # build + exécution en mode production
npm run lint
npm run typecheck
npm run test
```

Aucune variable d'environnement n'est requise. La persistance locale se fait dans
`.data/runtime-store.json` (créé automatiquement, ignoré par git) ; supprimer ce
dossier ou utiliser le bouton « Réinitialiser les données de session » dans
`/administration` remet le prototype à l'état initial.

## 9. Prochaines étapes (P1 puis P2)

**P1 — Formation structurée** (à lancer seulement après validation de ce P0) :
- Contenu pédagogique complet des 19 modules Academy (cours, exemple, flashcards).
- Quiz notés par module (au-delà du mini-quiz lexique déjà disponible).
- Progression enrichie par dimension de compétence (`scoring_dimensions` du pack).
- Cas multi-documents avancés et correction détaillée enrichie.

**P2 — Profondeur métier** :
- Workflow Prestations (liquidation), PEC & Devis dédiés, Cotisations, Réclamations.
- Flux simulés (NOEMIE/DRE/ROC pédagogiques, jamais réels) et tableau de bord
  Anomalies.
- Pilotage formateur multi-apprenants (nécessite un modèle de comptes).
- Génération dynamique de cas (le script `docs/mutalia-spec/generator/generate_cases.py`
  fourni par le pack est la base à intégrer côté serveur).

Ce prototype P0 ne doit pas être modifié en profondeur pour ces prochaines étapes :
il s'agit d'ajouter des modules et de remplacer les pages d'état vide existantes,
sans casser la navigation, la sécurité du corrigé ni les calculs déjà testés.
