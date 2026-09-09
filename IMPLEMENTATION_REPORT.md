# Mutalia — Rapport d'implémentation

Statut : **P0 stable et fonctionnel**. **P1 (Academy, quiz, progression, cas
pratiques avancés) livré et testé** — voir §10. **P2 (prestations, PEC, cotisations,
réclamations, flux simulés, anomalies, pilotage formateur, génération dynamique de
cas) livré et testé** — voir §11. **P3 lot 1 (profils apprenant, pilotage
multi-apprenants réel, export/reporting) livré et testé** — voir §12, scope volontaire
détaillé ci-dessous.

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

## 6. Ce qui est mocké / hors périmètre (mis à jour après P1/P2)

- **Prospects, catalogue de parcours, comptes multi-apprenants** : hors P0/P1/P2
  explicites du pack (P3) — page d'état vide. Le pilotage formateur livré en P2 reste
  **mono-session** faute de modèle de comptes (voir §11).
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

## 9. Ce qui reste (au-delà du lot P3 #1)

- **Comptes réels avec authentification** (mot de passe, email, isolation
  multi-appareils/multi-organisation). Le lot P3 #1 livre des **profils apprenant
  locaux sans mot de passe** (voir §12) qui couvrent le besoin fonctionnel de
  pilotage multi-apprenants pour un prototype de formation, mais ne sont pas des
  comptes au sens produit final — un vrai système d'authentification resterait à
  construire pour un déploiement client réel.
- **Catalogue de parcours** : le pack ne fournit qu'un seul curriculum
  (« Nouveau collaborateur - Complémentaire santé particuliers », 19 modules).
  Créer plusieurs parcours nécessiterait d'inventer un contenu pédagogique
  supplémentaire non fourni par le pack — volontairement laissé de côté plutôt que
  fabriqué.
- **Personnalisation par organisme** : le pack ne couvre qu'Harmonie Mutuelle 2026 ;
  ajouter d'autres organismes nécessiterait des données/une identité visuelle non
  fournies — même logique de non-invention.
- Progression détaillée par dimension de compétence (`scoring_dimensions` du pack :
  comprehension_metier, lecture_documentaire, calcul, procedure, detection_anomalies,
  conseil, justification, relation_client) plutôt que le score global actuel par cas.
- Grille tarifaire de cotisations réelle si un jour fournie par le pack (aujourd'hui
  aucune donnée 2026 de cotisation n'existe dans le pack ; le module Cotisations livré
  en P2 reste donc un calculateur générique de régularisation, pas un barème réel).

Ce prototype ne doit pas être modifié en profondeur pour ces prochaines étapes :
sans casser la navigation, la sécurité du corrigé ni les calculs déjà testés.

## 10. Lot P1 #1 — Mutalia Academy, quiz, progression, cas pratiques avancés

Premier lot cohérent de P1, livré et testé sans régression sur P0.

### Contenu livré

- **Mutalia Academy** (`/academy`, `/academy/[moduleId]`) : les 19 modules du
  curriculum ont désormais un contenu réel, écrit dans
  `src/lib/domain/academyContent.ts` — cours (2 paragraphes), exemple concret
  (souvent recalé sur un cas vérifié comme CASE-001 ou CASE-012), flashcards, quiz
  noté (3-4 questions à choix multiple avec explication), et lien vers un cas
  pratique quand c'est pertinent. La séquence pédagogique du pack est respectée :
  cours → exemple → flashcards → quiz → cas_pratique → correction (onglets).
- **Flashcards** : générées automatiquement à partir du lexique existant (filtre par
  catégorie associée au module) plutôt que dupliquées — pas de nouvelle source de
  vérité, réutilisation du contenu déjà seedé.
- **Quiz** (`/quiz` + onglet Quiz de chaque module) : moteur réutilisable
  (`QuizRunner`), notation calculée **côté serveur** (`submitAcademyQuizAction` /
  `scoreQuiz`, testé unitairement) pour ne pas faire confiance à un score
  potentiellement falsifié côté client. Résultat détaillé (bonne/mauvaise réponse +
  explication) affiché après soumission, tentative persistée dans le store runtime.
- **Progression** (`/progression`) : nouvelle section « Mutalia Academy » sous le
  tableau des cas, agrégeant tentatives et meilleur score par module
  (`getAcademyProgressionSummary`).
- **Cas pratiques avancés** : traités via le module **M19 — Cas complexes
  multi-documents**, relié explicitement aux 3 cas déjà seedés de difficulté
  `avance` (CASE-006 audiologie senior, CASE-011 droits fermés, CASE-012 implant
  plafond). Choix assumé : aucun nouveau cas fictif n'a été inventé à ce stade — la
  génération de nouveaux cas est explicitement une brique P2 (générateur dynamique)
  et mélanger les deux aurait ajouté des données non revues dans le pack sans
  justification P1.
- L'onglet **Correction** de chaque module réutilise le composant `CorrectionPanel`
  déjà construit en P0 : réservé au mode Formateur, jamais accessible en mode
  apprenant — même garde-fou que pour les cas pratiques.

### Tests exécutés pour ce lot

```bash
npm run lint       # 0 erreur
npm run typecheck  # 0 erreur
npm run test        # 19 tests (7 nouveaux : quizScoring.test.ts, academyContent.test.ts)
npm run build         # 27 routes générées, dont /academy/[moduleId]
```

Nouveaux tests unitaires :
- `quizScoring.test.ts` : notation correcte, partielle, et réponse manquante traitée
  comme incorrecte plutôt que de planter.
- `academyContent.test.ts` : les 19 modules du curriculum sont couverts exactement
  une fois, chacun a un cours/exemple/quiz non vides, chaque `correctIndex` de quiz
  est dans la plage des options, et M19 est bien relié aux 3 cas `avance`.

Test end-to-end Playwright (non versionné, exécuté contre `npm run dev`) :
navigation Academy → onglet Flashcards → quiz M04 répondu et noté 4/4 côté serveur →
progression mise à jour → M19 relié aux 3 cas avancés → **non-régression** : la
soumission d'un cas P0 (CASE-002) fonctionne toujours à l'identique → mode Formateur
révèle bien le corrigé sur l'onglet Correction d'un module Academy.

### Commandes de lancement (inchangées)

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>, puis le menu **Mutalia Academy** ou **Quiz** dans la
barre latérale (section Formation).

## 11. Lot P2 — Prestations, PEC, Cotisations, Réclamations, Flux, Anomalies, Pilotage, Générateur

Deuxième priorité livrée, testée sans régression sur P0 et P1.

### Principe directeur : ne jamais dériver l'UI du corrigé

Plusieurs modules P2 auraient pu être peuplés directement depuis `answer_key.json`
(prestations « déjà liquidées », anomalies « déjà connues »). Cela aurait
silencieusement révélé la réponse attendue des cas pratiques en dehors du parcours de
soumission. Choix systématique retenu à la place : chaque module P2 est **dérivé du
travail réel de l'utilisateur** (soumissions de cas, statuts GED positionnés à la
main), jamais du corrigé privé. Voir le détail par module ci-dessous.

### Contenu livré

- **Prestations** (`/prestations`, onglet Prestations de la fiche 360) : historique
  dérivé exclusivement des soumissions de cas pratiques déjà enregistrées — montant
  retenu = valeur saisie par l'apprenant (nouveau champ `submittedValues` sur
  `CaseSubmissionResult`, jamais le corrigé), statut « Liquidée »/« À vérifier » selon
  le score obtenu.
- **PEC & Devis** (`/pec-devis`, onglet PEC de la fiche 360) : formulaire d'émission
  de PEC pédagogique (foyer, bénéficiaire, acte, établissement, date des soins,
  montant garanti optionnel avec bascule « Donnée 2026 à vérifier » plutôt que
  d'inventer un montant), historique consultable.
- **Cotisations** (`/cotisations`, onglet Cotisations de la fiche 360) : suivi de
  statut par foyer (à jour / en relance / impayée, modifiable en mode Formateur
  uniquement) + calculateur de régularisation au prorata jour par jour lors d'un
  changement de formule en cours de mois (`computeCotisationRegularisation`, testé
  unitairement). Aucune grille tarifaire 2026 n'étant fournie par le pack, le
  calculateur reste générique (voir §9).
- **Relation adhérent** (`/relation-adherent`) : CRUD réclamations (entité
  `Complaint`) rattachées à un foyer et, si pertinent, au cas pratique correspondant
  (ex. CASE-008), avec suivi de statut (ouverte / en cours / clôturée).
- **Flux & Anomalies** (`/flux-anomalies`) : tableau de bord des documents
  actuellement en anomalie, **calculé à partir des statuts que l'utilisateur positionne
  dans la GED** (jamais du champ `anomalies` déjà présent dans les `case.json`
  sources, qui préfigurerait la réponse attendue de l'exercice) + journal des flux
  simulés (un évènement « retour en anomalie » est loggué automatiquement à chaque
  changement de statut de document vers « Anomalie » — toujours explicitement
  qualifié de simulé, jamais un flux NOEMIE/DRE/ROC réel).
- **Pilotage formateur** (`/pilotage`) : tableau de bord réservé au rôle Formateur
  (accès refusé sinon, avec message explicite) agrégeant cas tentés, score moyen,
  modules Academy tentés, réclamations ouvertes, PEC émises, documents en anomalie —
  et hébergeant le générateur de cas. Explicitement documenté comme **mono-session**
  : un vrai pilotage multi-apprenants suppose des comptes (P3).
- **Génération dynamique de cas** (`src/lib/domain/caseGenerator.ts`) : port
  TypeScript déterministe (PRNG mulberry32, seed obligatoire) du principe de
  `docs/mutalia-spec/generator/generate_cases.py` — mêmes familles de scénarios et
  d'anomalies, mêmes réserves de prénoms/noms fictifs. Un cas généré produit un
  `TrainingCase` + `AnswerKey` au même format que les 12 cas seedés, un vrai PDF par
  document (bandeau obligatoire « DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR »,
  généré avec `pdf-lib`, servi via une route API dédiée `/api/generated-doc/…`
  distincte des PDFs statiques), et apparaît immédiatement dans `/cas-pratiques`,
  `/progression` et le simulateur de scoring — **avec le même garde-fou answer_key
  que les cas seedés** (corrigé jamais envoyé au client apprenant, y compris pour un
  cas généré). Réservé au mode Formateur.

### Tests exécutés pour ce lot

```bash
npm run lint       # 0 erreur
npm run typecheck  # 0 erreur
npm run test        # 27 tests (8 nouveaux : cotisations, caseGenerator)
npm run build         # 28 routes générées, dont /api/generated-doc/[caseId]/[fileName]
```

Nouveaux tests unitaires :
- `cotisations.test.ts` : prorata correct sur un mois de 30 jours, régularisation
  nulle si le montant ne change pas, montants négatifs rejetés.
- `caseGenerator.test.ts` : déterminisme strict (même seed + séquence ⇒ cas
  rigoureusement identique), deux séquences différentes produisent des cas différents,
  aucun IBAN ni numéro de sécurité sociale à l'apparence valide n'est jamais généré,
  membres et documents toujours marqués `synthetic`, total de scoring du corrigé
  toujours égal à 100 (cohérent avec les 12 cas seedés).

Un bug de frontière client/serveur a été détecté puis corrigé pendant ce lot : deux
composants client (`CotisationStatusSelect`, `ComplaintStatusControl`) importaient une
constante (`COTISATION_STATUSES`/`COMPLAINT_STATUSES`) depuis `runtimeStore.ts`, un
module marqué `server-only` — ce qui faisait échouer le build (`next build` refuse
qu'un module `server-only` soit atteignable depuis un Client Component). Corrigé en
déplaçant ces constantes/types partagés vers `src/lib/domain/constants.ts` (déjà
sans dépendance serveur), qui reste la seule source pour le client comme pour le
serveur.

Test end-to-end Playwright (non versionné, exécuté contre `npm run dev`), en plus de
la re-exécution complète des suites de non-régression P0 et P1 :
mode Formateur → génération d'un cas (`CASE-GEN-777-00x`) → cas visible immédiatement
dans `/cas-pratiques` → PDF généré servi correctement (`Content-Type: application/pdf`)
→ **aucune fuite de corrigé** sur la page du cas généré avant affichage volontaire
côté formateur → réclamation créée sur `/relation-adherent` → PEC émise sur
`/pec-devis` → changement de statut de cotisation + calculateur de régularisation sur
`/cotisations` → document marqué « Anomalie » dans un cas pratique → apparition
immédiate dans `/flux-anomalies` → soumission d'un cas par un apprenant → apparition
immédiate dans `/prestations` avec le montant qu'il a lui-même saisi.

### Commandes de lancement (inchangées)

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>. Le générateur de cas et les tableaux de bord P2
réservés (Pilotage, changement de statut de cotisation) nécessitent de basculer en
mode **Formateur** dans la barre du haut ou sur `/administration`.

## 12. Lot P3 #1 — Profils apprenant, pilotage multi-apprenants réel, reporting

Premier lot de P3, livré et testé sans régression sur P0/P1/P2.

### Cadrage assumé

« Comptes formateur/apprenant » du roadmap a été interprété comme **profils
apprenant légers** (nom, pas de mot de passe) plutôt que comme un système
d'authentification complet — disproportionné pour un prototype pédagogique et non
requis explicitement par le pack. Ce choix débloque le vrai besoin sous-jacent : un
pilotage formateur qui distingue réellement plusieurs apprenants, plutôt que le
pilotage mono-session livré en P2. Catalogue de parcours et personnalisation
organisme restent hors périmètre (voir §9) : les construire aurait exigé d'inventer
du contenu ou une marque non fournis par le pack.

### Contenu livré

- **Profils apprenant** (sélecteur 👤 dans la barre du haut, partout dans
  l'application) : créer un profil par nom, basculer entre profils existants. Un
  profil « Apprenant » par défaut existe toujours. Stockés dans le même store
  runtime JSON que le reste du prototype (`.data/runtime-store.json`), sans mot de
  passe ni compte serveur distant — explicitement documenté comme tel dans l'UI
  (`/pilotage`) pour ne pas laisser croire à un vrai système multi-utilisateurs.
- **Cloisonnement réel des données d'apprentissage** : les soumissions de cas
  pratiques et les tentatives de quiz Academy sont désormais stockées **par profil**
  (`submissions[profileId][caseId]`, `quizAttempts[profileId][moduleId]` — la
  version du schéma de stockage passe de 3 à 4). Chaque profil a sa propre page
  Progression, ses propres modules Academy tentés, son propre historique de cas.
  Vérifié : soumettre un cas sous le profil « Marie » n'affecte pas la progression
  du profil « Apprenant » par défaut.
- **Pilotage multi-apprenants réel** (`/pilotage`) : table de progression par
  profil (cas tentés, score moyen, modules Academy tentés, score moyen Academy),
  agrégats globaux recalculés sur l'ensemble des profils plutôt que sur la seule
  session courante. Toujours réservé au mode Formateur.
- **Export / reporting** (`/api/report/csv`, bouton « Exporter le rapport » sur
  `/pilotage`) : export CSV (BOM UTF-8, séparateur `;`) de toutes les tentatives de
  tous les profils, cas pratiques et quiz Academy confondus — colonnes profil, type,
  identifiant, titre, tentatives, meilleur score, score max, date. Réservé au mode
  Formateur (403 sinon).
- **Prestations** enrichi d'une colonne « Traité par » (nom du profil), puisque la
  vue reste volontairement agrégée tous profils confondus (vue opérationnelle d'un
  foyer, comme un vrai back-office où plusieurs gestionnaires peuvent traiter le même
  dossier) — à la différence de Progression qui reste strictement personnelle au
  profil actif.

### Compatibilité et migration

Le changement de forme du store (soumissions/quiz désormais imbriqués par profil)
n'est pas rétrocompatible avec un `.data/runtime-store.json` généré par une version
antérieure : `readStore()` détecte le changement de version de schéma et repart d'un
store vide plutôt que de fusionner une forme incompatible (cf. `RUNTIME_STORE_VERSION`
dans `runtimeStore.ts`). Sans conséquence pratique : ce fichier est local,
non versionné, et régénéré automatiquement.

### Tests exécutés pour ce lot

```bash
npm run lint       # 0 erreur
npm run typecheck  # 0 erreur
npm run test        # 27 tests (inchangé : refactor sans nouvelle logique de calcul isolée)
npm run build         # 27 routes générées, dont /api/report/csv
```

Test end-to-end Playwright (non versionné, exécuté contre `npm run dev`) :
création d'un profil « Marie » → soumission de CASE-001 sous ce profil → page
Progression scoped au profil affichant l'attempt de Marie → bascule sur le profil
par défaut → mode Formateur → `/pilotage` affichant Marie **et** le profil par
défaut avec des scores distincts dans une table de progression par profil → export
CSV contenant bien la ligne de Marie → page Prestations affichant « Traité par
Marie ». Cas limite testé : réinitialisation des données (`/administration`) pendant
qu'un profil non par défaut est actif — l'application continue de fonctionner sans
plantage. Re-exécution complète des suites de régression P0/P1/P2 : aucune
régression.

### Commandes de lancement (inchangées)

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>. Le sélecteur de profil (👤) est disponible en haut à
gauche du sélecteur de rôle, sur toutes les pages. Le tableau de pilotage
multi-apprenants et l'export CSV nécessitent le mode Formateur.
