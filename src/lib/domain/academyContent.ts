export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyModuleContent {
  moduleId: string;
  /** Catégories de lexique dont les entrées alimentent les flashcards du module. */
  lexiconCategories: string[];
  course: string[];
  example: string;
  quiz: QuizQuestion[];
  linkedCaseIds: string[];
}

export const ACADEMY_MODULE_CONTENT: AcademyModuleContent[] = [
  {
    moduleId: "M01",
    lexiconCategories: ["Écosystème"],
    course: [
      "La complémentaire santé s'articule toujours autour de deux régimes : l'Assurance Maladie Obligatoire (AMO), qui intervient en premier sur la base d'un taux réglementaire, et l'Assurance Maladie Complémentaire (AMC), qui vient ensuite compléter tout ou partie du reste après AMO, selon la garantie souscrite.",
      "Ce prototype ne traite que des particuliers, sur le référentiel Harmonie Mutuelle 2026. Aucun flux réel (NOEMIE, télétransmission) n'est simulé : les échanges AMO/AMC sont uniquement expliqués à des fins pédagogiques.",
    ],
    example:
      "Un adhérent consulte un spécialiste facturé 80 €. L'AMO rembourse sa part sur la BRSS, puis l'AMC intervient sur le solde selon la garantie du contrat — voir le calcul détaillé dans le module M04.",
    quiz: [
      {
        id: "M01-Q1",
        question: "Qui intervient en premier dans le circuit de remboursement ?",
        options: ["L'AMC", "L'AMO", "Les deux simultanément", "Cela dépend du professionnel de santé"],
        correctIndex: 1,
        explanation: "L'AMO calcule et verse sa part avant que l'AMC ne puisse intervenir sur le solde.",
      },
      {
        id: "M01-Q2",
        question: "Mutalia simule-t-il de vrais flux de télétransmission ?",
        options: ["Oui, avec l'Assurance Maladie", "Oui, mais uniquement en test", "Non, jamais", "Seulement pour les cas avancés"],
        correctIndex: 2,
        explanation: "Mutalia est un environnement de formation : aucun flux réel n'est simulé ou transmis.",
      },
      {
        id: "M01-Q3",
        question: "Quel public ce prototype couvre-t-il ?",
        options: ["Particuliers uniquement", "Entreprises et TNS", "Contrats collectifs", "Tous les segments"],
        correctIndex: 0,
        explanation: "Le périmètre produit exclut explicitement les entreprises, TNS et contrats collectifs professionnels.",
      },
      {
        id: "M01-Q4",
        question: "Que signifie AMC ?",
        options: [
          "Assurance Maladie Collective",
          "Assurance Maladie Complémentaire",
          "Aide Médicale Complémentaire",
          "Association Mutualiste et Complémentaire",
        ],
        correctIndex: 1,
        explanation: "AMC = Assurance Maladie Complémentaire, c'est-à-dire la mutuelle ou l'assurance santé complémentaire.",
      },
    ],
    linkedCaseIds: ["CASE-001"],
  },
  {
    moduleId: "M02",
    lexiconCategories: ["Écosystème", "Remboursement"],
    course: [
      "Le vocabulaire métier est dense et truffé d'acronymes. Le lexique Mutalia (page « Lexique métier ») centralise 91 entrées avec définition simple, définition métier, exemple et erreurs fréquentes.",
      "Prenez l'habitude de survoler les acronymes soulignés en pointillés dans l'application : une infobulle contextuelle rappelle la définition sans quitter la page en cours.",
    ],
    example:
      "Sur un décompte, vous croisez « BRSS », « TM » et « AMO » sur la même ligne : chaque terme a une définition précise et un rôle différent dans le calcul du remboursement.",
    quiz: [
      {
        id: "M02-Q1",
        question: "Où trouver la liste complète du lexique métier dans Mutalia ?",
        options: ["Dans le Cockpit", "Dans la page Lexique métier", "Dans les Cotisations", "Nulle part, il faut le deviner"],
        correctIndex: 1,
        explanation: "La page « Lexique métier » centralise les 91 entrées avec recherche, filtres et favoris.",
      },
      {
        id: "M02-Q2",
        question: "Comment consulter la définition d'un acronyme sans quitter la page en cours ?",
        options: [
          "Impossible, il faut ouvrir un nouvel onglet",
          "En survolant le terme souligné en pointillés",
          "En rafraîchissant la page",
          "En contactant un formateur",
        ],
        correctIndex: 1,
        explanation: "Les tooltips contextuels affichent la définition simple directement au survol ou au focus.",
      },
      {
        id: "M02-Q3",
        question: "Qu'apporte le champ « Erreur fréquente » d'une entrée du lexique ?",
        options: [
          "Un lien vers un cas pratique uniquement",
          "Un piège courant à éviter sur ce terme",
          "L'historique des modifications",
          "Rien, il est décoratif",
        ],
        correctIndex: 1,
        explanation: "Il signale une confusion ou une erreur d'interprétation fréquente sur ce terme métier.",
      },
    ],
    linkedCaseIds: [],
  },
  {
    moduleId: "M03",
    lexiconCategories: ["Garantie", "Contrat"],
    course: [
      "Une garantie 2026 combine un taux ou un forfait par prestation, un mode de calcul (pourcentage BRSS, forfait euros, frais réels) et parfois un plafond annuel. La page « Garanties 2026 » présente l'architecture complète du référentiel Harmonie Mutuelle.",
      "Attention à ne jamais confondre les codes PSI (architecture de formules) et les codes PLI (parcours de devis en ligne) : ce sont deux nomenclatures distinctes du même organisme, non interchangeables sans source contractuelle explicite.",
    ],
    example:
      "Le comparateur vérifié du pack donne, pour la formule PLI 421, une consultation spécialiste remboursée à 180 % BRSS et une orthodontie à 100 % + 300 €/an : deux modes de calcul différents sur la même garantie.",
    quiz: [
      {
        id: "M03-Q1",
        question: "Un code PSI et un code PLI désignent-ils la même chose ?",
        options: ["Oui, toujours", "Non, ce sont deux nomenclatures distinctes", "Oui, mais seulement pour l'optique", "Cela dépend du département"],
        correctIndex: 1,
        explanation: "PSI (architecture de formules) et PLI (devis en ligne) sont deux nomenclatures distinctes à ne jamais confondre.",
      },
      {
        id: "M03-Q2",
        question: "Que doit afficher Mutalia quand un niveau de garantie exact n'est pas vérifié sur une source 2026 ?",
        options: ["Une valeur estimée", "0 %", "« Donnée 2026 à vérifier »", "La valeur 2022 la plus proche"],
        correctIndex: 2,
        explanation: "La règle du prototype interdit d'inventer une valeur contractuelle manquante.",
      },
      {
        id: "M03-Q3",
        question: "Quels sont les modes de calcul d'une garantie rencontrés dans le référentiel 2026 ?",
        options: [
          "Pourcentage BRSS, forfait euros, frais réels",
          "Uniquement des pourcentages",
          "Uniquement des forfaits",
          "Un seul mode unique pour tout le contrat",
        ],
        correctIndex: 0,
        explanation: "Le référentiel combine ces trois modes selon la prestation (voir le comparateur PLI).",
      },
      {
        id: "M03-Q4",
        question: "Quelle page du prototype centralise l'architecture complète des formules 2026 ?",
        options: ["Cockpit", "Documents / GED", "Garanties 2026", "Progression"],
        correctIndex: 2,
        explanation: "La page « Garanties 2026 » présente l'architecture PSI et le comparateur PLI vérifié.",
      },
    ],
    linkedCaseIds: ["CASE-001"],
  },
  {
    moduleId: "M04",
    lexiconCategories: ["Remboursement"],
    course: [
      "Le calcul de remboursement suit toujours la même mécanique : Base de Remboursement de la Sécurité sociale (BRSS) → remboursement AMO → ticket modérateur → remboursement AMC → reste à charge (RAC).",
      "Le RAC ne peut jamais être négatif : le cumul AMO + AMC ne dépasse jamais le montant réellement facturé, quel que soit le pourcentage de garantie affiché.",
    ],
    example:
      "CASE-001 (cas vérifié) : facturé 80 €, BRSS 35 €, AMO à 70 % = 24,50 €. Avec une garantie à 150 % BRSS, l'AMC verse 28 € (52,50 € visés − 24,50 € déjà versés par l'AMO), pour un reste à charge de 27,50 €.",
    quiz: [
      {
        id: "M04-Q1",
        question: "Dans quel ordre s'effectue le calcul d'un remboursement ?",
        options: [
          "AMC puis AMO",
          "BRSS → AMO → AMC → RAC",
          "RAC → AMO → BRSS",
          "Il n'y a pas d'ordre fixe",
        ],
        correctIndex: 1,
        explanation: "La BRSS sert de base au calcul AMO, puis l'AMC intervient sur le solde, avant d'obtenir le RAC.",
      },
      {
        id: "M04-Q2",
        question: "Le reste à charge (RAC) peut-il être négatif ?",
        options: ["Oui, en cas de forte garantie", "Non, jamais", "Oui, uniquement en hospitalisation", "Cela dépend du BRSS"],
        correctIndex: 1,
        explanation: "Le cumul des remboursements ne dépasse jamais le montant facturé : le RAC est toujours ≥ 0.",
      },
      {
        id: "M04-Q3",
        question: "Sur CASE-001 (facturé 80 €, BRSS 35 €), combien rembourse l'AMO à 70 % ?",
        options: ["56 €", "35 €", "24,50 €", "80 €"],
        correctIndex: 2,
        explanation: "70 % × 35 € = 24,50 €, valeur vérifiée du cas CASE-001.",
      },
      {
        id: "M04-Q4",
        question: "Quel outil du prototype permet de refaire ce calcul avec vos propres montants ?",
        options: ["Le Lexique", "Le Simulateur de remboursement", "La FAQ", "L'Administration"],
        correctIndex: 1,
        explanation: "Le simulateur de remboursement (menu Simulateur) calcule BRSS/AMO/AMC/RAC en direct.",
      },
    ],
    linkedCaseIds: ["CASE-001"],
  },
  {
    moduleId: "M05",
    lexiconCategories: ["Hospitalisation"],
    course: [
      "Une hospitalisation combine plusieurs garanties : frais de séjour, honoraires de chirurgie, forfait journalier hospitalier et, en option, chambre particulière (par nuitée ou par jour en ambulatoire).",
      "Avant d'émettre une prise en charge (PEC), il faut toujours contrôler que les droits du bénéficiaire couvrent bien la date prévue des soins.",
    ],
    example:
      "CASE-005 : un séjour de 3 nuits avec un forfait chambre particulière à 80 €/nuit représente 240 € de garantie chambre, à ajouter au calcul des frais de séjour et honoraires.",
    quiz: [
      {
        id: "M05-Q1",
        question: "Que faut-il vérifier avant d'émettre une PEC hospitalière ?",
        options: [
          "Uniquement le montant facturé",
          "Les droits du bénéficiaire à la date prévue des soins",
          "Rien, la PEC est automatique",
          "Le numéro de sécurité sociale du médecin",
        ],
        correctIndex: 1,
        explanation: "Sans contrôle des droits à la date prévue, la PEC pourrait être émise pour une période non couverte.",
      },
      {
        id: "M05-Q2",
        question: "Le forfait chambre particulière ambulatoire se calcule généralement :",
        options: ["Par nuit", "Par jour", "Par mois", "Par séjour complet, sans plafond"],
        correctIndex: 1,
        explanation: "En ambulatoire (sans nuitée), le forfait chambre particulière est généralement exprimé par jour.",
      },
      {
        id: "M05-Q3",
        question: "Pour 3 nuits à 80 €/nuit de chambre particulière, quel est le montant garanti sur ce poste ?",
        options: ["80 €", "160 €", "240 €", "320 €"],
        correctIndex: 2,
        explanation: "3 × 80 € = 240 €.",
      },
    ],
    linkedCaseIds: ["CASE-005"],
  },
  {
    moduleId: "M06",
    lexiconCategories: ["Optique"],
    course: [
      "Un dossier optique repose sur trois pièces cohérentes : l'ordonnance, le devis (monture + verres détaillés) et la facture acquittée. La classe d'équipement (100 % Santé ou hors panier) conditionne le niveau de prise en charge.",
      "La date de renouvellement doit être comparée à la fréquence contractuelle : un renouvellement trop rapproché sans motif médical peut ne pas être intégralement couvert.",
    ],
    example:
      "CASE-003 : devis composé d'une monture à 120 € et de verres à 320 €, soit 440 € au total — chaque poste peut avoir une garantie différente.",
    quiz: [
      {
        id: "M06-Q1",
        question: "Quelle pièce médicale est généralement nécessaire pour un dossier optique ?",
        options: ["Une facture acquittée uniquement", "Une ordonnance", "Un RIB", "Une attestation de droits"],
        correctIndex: 1,
        explanation: "L'ordonnance justifie la prescription médicale de l'équipement optique.",
      },
      {
        id: "M06-Q2",
        question: "Pourquoi distinguer le prix de la monture de celui des verres sur un devis optique ?",
        options: [
          "Par simple convention esthétique",
          "Car les garanties peuvent différer selon la classe d'équipement",
          "Ce n'est jamais nécessaire",
          "Uniquement pour les enfants",
        ],
        correctIndex: 1,
        explanation: "La garantie peut appliquer des règles différentes à la monture et aux verres selon leur classe.",
      },
      {
        id: "M06-Q3",
        question: "Sur CASE-003, quel est le total du devis (monture 120 € + verres 320 €) ?",
        options: ["320 €", "120 €", "440 €", "560 €"],
        correctIndex: 2,
        explanation: "120 € + 320 € = 440 €.",
      },
    ],
    linkedCaseIds: ["CASE-003", "CASE-004", "CASE-009"],
  },
  {
    moduleId: "M07",
    lexiconCategories: ["Dentaire"],
    course: [
      "Le dentaire couvre les soins courants, les prothèses (avec ou sans 100 % Santé), l'orthodontie et l'implantologie. Chaque acte a un code identifiable sur le devis, à rapprocher de la bonne garantie.",
      "L'implantologie et l'orthodontie sont fréquemment plafonnées (par implant et par an, ou par forfait annuel) : il faut toujours vérifier le disponible avant de traiter la demande.",
    ],
    example:
      "CASE-012 : un plafond annuel implantologie de 1 200 € déjà consommé à hauteur de 600 € laisse 600 € disponibles pour la nouvelle demande.",
    quiz: [
      {
        id: "M07-Q1",
        question: "Que faut-il contrôler avant de traiter une demande d'implantologie ?",
        options: [
          "Uniquement le prix de l'implant",
          "Le plafond annuel et la consommation déjà enregistrée",
          "La couleur de la dent",
          "Rien de particulier",
        ],
        correctIndex: 1,
        explanation: "L'implantologie est souvent plafonnée par implant et par an : le disponible doit être calculé.",
      },
      {
        id: "M07-Q2",
        question: "Sur CASE-012 (plafond 1 200 €, déjà consommé 600 €), quel est le disponible ?",
        options: ["1 200 €", "600 €", "0 €", "1 800 €"],
        correctIndex: 1,
        explanation: "1 200 € − 600 € = 600 € disponibles.",
      },
      {
        id: "M07-Q3",
        question: "L'orthodontie pour un enfant nécessite souvent :",
        options: [
          "Un accord préalable et un contrôle de l'âge du bénéficiaire",
          "Aucune vérification particulière",
          "Uniquement une facture acquittée",
          "Un RIB valide",
        ],
        correctIndex: 0,
        explanation: "La prise en charge AMO de l'orthodontie est soumise à des règles d'âge et d'accord préalable.",
      },
    ],
    linkedCaseIds: ["CASE-002", "CASE-012"],
  },
  {
    moduleId: "M08",
    lexiconCategories: ["Audiologie"],
    course: [
      "Une aide auditive relève de la classe I (prix plafonné, éligible au 100 % Santé) ou de la classe II (tarifs libres). Le devis normalisé d'audioprothèse doit être cohérent avec l'ordonnance ORL et l'âge du bénéficiaire.",
      "Sans prescription valide, le dossier est incomplet : il faut la demander avant tout calcul de remboursement.",
    ],
    example:
      "CASE-006 illustre une demande d'aide auditive senior avec une prescription manquante à réclamer avant tout traitement.",
    quiz: [
      {
        id: "M08-Q1",
        question: "Quelle classe d'aide auditive est éligible au 100 % Santé ?",
        options: ["Classe I", "Classe II", "Les deux indifféremment", "Aucune"],
        correctIndex: 0,
        explanation: "La classe I regroupe les aides auditives à prix plafonné éligibles au 100 % Santé.",
      },
      {
        id: "M08-Q2",
        question: "Que faire si la prescription ORL est absente du dossier ?",
        options: [
          "Traiter quand même sur la base du devis",
          "La demander avant tout calcul de remboursement",
          "Rejeter définitivement le dossier",
          "Ignorer l'anomalie",
        ],
        correctIndex: 1,
        explanation: "Sans ordonnance, le dossier est incomplet et la pièce doit être réclamée avant liquidation.",
      },
    ],
    linkedCaseIds: ["CASE-006"],
  },
  {
    moduleId: "M09",
    lexiconCategories: ["100 % Santé"],
    course: [
      "Le 100 % Santé garantit un reste à charge nul sur un panier de soins réglementé (optique, dentaire, audiologie), à condition que l'offre proposée respecte les prix plafonnés et la qualité minimale définie.",
      "Une offre hors panier reste soumise aux garanties classiques du contrat, avec un reste à charge potentiel.",
    ],
    example:
      "Un équipement optique du panier 100 % Santé, correctement identifié sur le devis, doit afficher un reste à charge nul après cumul AMO + AMC.",
    quiz: [
      {
        id: "M09-Q1",
        question: "Que garantit le dispositif 100 % Santé sur le panier concerné ?",
        options: ["Un reste à charge nul", "Un remboursement de 50 %", "Rien de spécifique", "Un remboursement plafonné à 100 €"],
        correctIndex: 0,
        explanation: "Le panier 100 % Santé garantit un reste à charge nul, sous conditions de prix et de qualité.",
      },
      {
        id: "M09-Q2",
        question: "Une offre hors panier 100 % Santé est-elle remboursée différemment ?",
        options: ["Non, c'est identique", "Oui, selon les garanties classiques du contrat", "Elle n'est jamais remboursée", "Elle est toujours gratuite"],
        correctIndex: 1,
        explanation: "Hors panier réglementé, ce sont les garanties classiques (%, forfait) qui s'appliquent.",
      },
    ],
    linkedCaseIds: ["CASE-002"],
  },
  {
    moduleId: "M10",
    lexiconCategories: ["Flux"],
    course: [
      "Le tiers payant évite l'avance de frais à l'adhérent ; NOEMIE et la télétransmission désignent les échanges électroniques automatisés entre AMO et AMC. Mutalia ne simule aucun flux réel : ces notions restent purement pédagogiques ici.",
      "Un flux retour en anomalie signale un blocage (bénéficiaire non identifié, contrat inactif…) à analyser, jamais à ignorer.",
    ],
    example:
      "Dans un environnement réel, un flux NOEMIE automatiserait le passage du décompte AMO vers l'AMC. Dans Mutalia, cette étape reste manuelle et pédagogique.",
    quiz: [
      {
        id: "M10-Q1",
        question: "Mutalia simule-t-il des flux NOEMIE réels ?",
        options: ["Oui, en environnement de test", "Non, jamais", "Oui, uniquement le vendredi", "Seulement pour les formateurs"],
        correctIndex: 1,
        explanation: "Mutalia n'active aucun flux réel : NOEMIE et la télétransmission sont uniquement expliqués.",
      },
      {
        id: "M10-Q2",
        question: "Que signale un flux retour en anomalie ?",
        options: [
          "Un remboursement plus élevé",
          "Qu'un flux n'a pas pu être intégré automatiquement",
          "Qu'aucune action n'est requise",
          "Une confirmation de paiement",
        ],
        correctIndex: 1,
        explanation: "Un flux en anomalie doit être analysé manuellement avant retraitement.",
      },
    ],
    linkedCaseIds: [],
  },
  {
    moduleId: "M11",
    lexiconCategories: ["Prestations"],
    course: [
      "La liquidation pédagogique d'une prestation suit un enchaînement : contrôle des droits, lecture des pièces, calcul du remboursement, détection des anomalies éventuelles, puis décision (traiter, mettre en attente, ou demander une pièce complémentaire).",
      "Un rejet doit toujours être motivé et, si possible, accompagné d'une piste de régularisation plutôt que d'une fin de non-recevoir.",
    ],
    example:
      "CASE-007 illustre un document dont le bénéficiaire ne correspond pas au dossier courant : la bonne pratique est de suspendre et de réaffecter, pas de liquider en l'état.",
    quiz: [
      {
        id: "M11-Q1",
        question: "Quelle est la première étape avant de liquider une prestation ?",
        options: ["Le paiement", "Le contrôle des droits", "L'archivage", "La réclamation"],
        correctIndex: 1,
        explanation: "Le contrôle des droits du bénéficiaire à la date des soins précède tout calcul.",
      },
      {
        id: "M11-Q2",
        question: "Que faire si le bénéficiaire d'un document ne correspond pas au dossier ?",
        options: [
          "Liquider quand même",
          "Suspendre et réaffecter ou clarifier",
          "Supprimer le document",
          "Ignorer l'incohérence",
        ],
        correctIndex: 1,
        explanation: "Traiter sur le mauvais bénéficiaire expose à un remboursement indu.",
      },
    ],
    linkedCaseIds: ["CASE-007"],
  },
  {
    moduleId: "M12",
    lexiconCategories: ["Prestations", "Hospitalisation"],
    course: [
      "Un devis engage une estimation ; une prise en charge (PEC) engage l'organisme sur un montant garanti pour un acte précis (souvent hospitalier). Une PEC pédagogique doit toujours s'appuyer sur des droits vérifiés et une garantie contrôlée.",
      "En l'absence de donnée vérifiée sur un pourcentage ou un forfait, n'inventez jamais la valeur : affichez « Donnée 2026 à vérifier ».",
    ],
    example: "CASE-005 : émettre une PEC hospitalière pédagogique après avoir contrôlé les droits et la garantie chambre particulière.",
    quiz: [
      {
        id: "M12-Q1",
        question: "Une PEC engage-t-elle l'organisme différemment d'un simple devis ?",
        options: ["Non, c'est équivalent", "Oui, sur un montant garanti pour un acte précis", "Un devis engage plus qu'une PEC", "Aucun des deux n'engage l'organisme"],
        correctIndex: 1,
        explanation: "La PEC est un engagement plus fort que le devis, généralement utilisé en hospitalisation.",
      },
      {
        id: "M12-Q2",
        question: "Que faire si un pourcentage de garantie n'est pas vérifié dans le référentiel 2026 ?",
        options: ["L'estimer au mieux", "Utiliser la valeur 2022", "Afficher « Donnée 2026 à vérifier »", "Mettre 0 %"],
        correctIndex: 2,
        explanation: "La règle du prototype interdit d'inventer une valeur contractuelle non vérifiée.",
      },
    ],
    linkedCaseIds: ["CASE-005"],
  },
  {
    moduleId: "M13",
    lexiconCategories: ["Cotisations"],
    course: [
      "Une cotisation impayée suit un cadre de relance précis avant toute conséquence sur les droits — jamais de décision individuelle immédiate. Une régularisation ajuste le montant appelé après un changement de situation ou une erreur constatée.",
      "Ce module reste conceptuel en P0/P1 : le workflow complet de calcul et de régularisation de cotisation est prévu en P2.",
    ],
    example: "Un changement de formule en cours d'exercice peut entraîner une régularisation de cotisation, à expliquer clairement avec sa date d'effet.",
    quiz: [
      {
        id: "M13-Q1",
        question: "Une cotisation impayée entraîne-t-elle une suspension immédiate et individuelle des droits ?",
        options: ["Oui, systématiquement", "Non, un cadre de relance s'applique d'abord", "Cela dépend du gestionnaire", "Jamais aucune conséquence"],
        correctIndex: 1,
        explanation: "Un cadre contractuel de relance précède toute conséquence sur les droits.",
      },
      {
        id: "M13-Q2",
        question: "Qu'est-ce qu'une régularisation de cotisation ?",
        options: [
          "Un remboursement de prestation",
          "Un ajustement du montant appelé suite à un changement de situation",
          "Une résiliation automatique",
          "Un changement de bénéficiaire",
        ],
        correctIndex: 1,
        explanation: "Elle corrige un écart constaté (changement de situation, erreur, changement de formule).",
      },
    ],
    linkedCaseIds: [],
  },
  {
    moduleId: "M14",
    lexiconCategories: ["GED"],
    course: [
      "La GED pédagogique suit un cycle de statuts : Importé → À qualifier → Associé → Contrôlé → Conforme / Incomplet / Anomalie → Traité → Archivé. Chaque document doit être rattaché au bon bénéficiaire et à la bonne date.",
      "Un doublon, un document illisible ou une date incohérente sont des anomalies à tracer explicitement, jamais à ignorer silencieusement.",
    ],
    example: "CASE-004 illustre un doublon de facture optique : il ne faut liquider qu'une seule fois et tracer l'anomalie « doublon ».",
    quiz: [
      {
        id: "M14-Q1",
        question: "Quel est le statut initial d'un document importé dans la GED Mutalia ?",
        options: ["Conforme", "Importé", "Archivé", "Traité"],
        correctIndex: 1,
        explanation: "Un document démarre toujours au statut « Importé » avant qualification.",
      },
      {
        id: "M14-Q2",
        question: "Que faire face à un doublon de facture ?",
        options: [
          "Liquider les deux occurrences",
          "Ne liquider qu'une fois et tracer l'anomalie",
          "Supprimer les deux documents",
          "Ignorer le second document sans le signaler",
        ],
        correctIndex: 1,
        explanation: "Il faut liquider une seule fois et documenter explicitement l'anomalie « doublon ».",
      },
      {
        id: "M14-Q3",
        question: "Un document illisible doit être :",
        options: [
          "Interprété au mieux par le gestionnaire",
          "Classé en anomalie avec demande de nouvelle pièce",
          "Ignoré",
          "Automatiquement rejeté sans explication",
        ],
        correctIndex: 1,
        explanation: "Il ne faut jamais deviner une information sur un document illisible : mieux vaut demander une pièce lisible.",
      },
    ],
    linkedCaseIds: ["CASE-004", "CASE-009"],
  },
  {
    moduleId: "M15",
    lexiconCategories: ["Relation adhérent"],
    course: [
      "Expliquer un remboursement ou un rejet suppose de détailler chaque étape du calcul et de citer la règle contractuelle en cause, sans jargon non expliqué.",
      "Une réclamation impose de recontrôler le dossier initial avant de confirmer, corriger ou escalader la décision.",
    ],
    example: "CASE-008 : une réclamation sur un remboursement nécessite de relire le dossier, recalculer, puis répondre avec une explication précise.",
    quiz: [
      {
        id: "M15-Q1",
        question: "Comment bien expliquer un rejet à un adhérent ?",
        options: [
          "En citant uniquement le numéro de dossier",
          "En énonçant le motif précis et la règle contractuelle concernée",
          "En restant volontairement vague",
          "En renvoyant systématiquement vers un formateur",
        ],
        correctIndex: 1,
        explanation: "Une explication claire cite le document ou la garantie en cause et propose une solution si possible.",
      },
      {
        id: "M15-Q2",
        question: "Que faire en premier lors du traitement d'une réclamation ?",
        options: [
          "Escalader immédiatement",
          "Recontrôler le dossier initial (documents, calcul, garantie)",
          "Rembourser sans vérification",
          "Clore la réclamation sans réponse",
        ],
        correctIndex: 1,
        explanation: "Le recontrôle du dossier précède toute décision de confirmation, correction ou escalade.",
      },
    ],
    linkedCaseIds: ["CASE-008"],
  },
  {
    moduleId: "M16",
    lexiconCategories: ["Remboursement", "GED"],
    course: [
      "Les anomalies courantes incluent : pièce manquante, doublon, mauvais bénéficiaire, droits fermés, RIB invalide, plafond à contrôler, incohérence devis/facture. Chacune appelle une réponse spécifique, rarement un rejet immédiat.",
      "Un rejet définitif reste l'exception, réservé aux situations où le droit n'existe manifestement pas.",
    ],
    example: "CASE-011 : des droits fermés à la date des soins imposent de refuser tout traitement automatique et de rechercher une mise à jour ou une explication.",
    quiz: [
      {
        id: "M16-Q1",
        question: "Un rejet définitif doit-il être la réponse par défaut à toute anomalie ?",
        options: ["Oui, toujours par sécurité", "Non, c'est l'exception", "Oui, uniquement en optique", "Cela dépend du montant"],
        correctIndex: 1,
        explanation: "La mise en attente avec demande de complément est la réponse proportionnée dans la plupart des cas.",
      },
      {
        id: "M16-Q2",
        question: "Sur CASE-011, quelle anomalie est en jeu ?",
        options: ["RIB invalide", "Droits fermés à la date des soins", "Doublon", "Document illisible"],
        correctIndex: 1,
        explanation: "Les soins ont eu lieu après la fermeture des droits du bénéficiaire.",
      },
    ],
    linkedCaseIds: ["CASE-007", "CASE-010", "CASE-011"],
  },
  {
    moduleId: "M17",
    lexiconCategories: ["Adhésion"],
    course: [
      "La découverte des besoins distingue toujours deux axes : Soins (fréquence de consultations, dépassements attendus) et Équipements (optique, dentaire, audiologie prévisibles). Le profil du client (personne seule, couple, famille, senior) oriente l'analyse.",
      "Une bonne découverte des besoins s'appuie sur des questions ouvertes, pas uniquement sur le budget annoncé en premier.",
    ],
    example: "Un senior expose un besoin plus marqué sur l'hospitalisation et l'audiologie qu'un jeune actif sans antécédent.",
    quiz: [
      {
        id: "M17-Q1",
        question: "Quels sont les deux axes de la découverte des besoins ?",
        options: ["Prix et délai", "Soins et Équipements", "AMO et AMC", "Optique et Dentaire uniquement"],
        correctIndex: 1,
        explanation: "Le référentiel sépare systématiquement le module Soins du module Équipements.",
      },
      {
        id: "M17-Q2",
        question: "Pour un senior, quels postes sont souvent à renforcer en priorité ?",
        options: ["Orthodontie enfant", "Hospitalisation et audiologie", "Pharmacie uniquement", "Aucun poste particulier"],
        correctIndex: 1,
        explanation: "Le risque d'hospitalisation et le besoin en appareillage auditif augmentent avec l'âge.",
      },
    ],
    linkedCaseIds: [],
  },
  {
    moduleId: "M18",
    lexiconCategories: ["Garantie"],
    course: [
      "Un conseil de couverture solide justifie la formule proposée par les besoins identifiés, pas seulement par le prix. Comparer deux niveaux de garantie gagne à s'appuyer sur un exemple chiffré plutôt que sur des pourcentages abstraits.",
      "Éviter la sur-assurance : proposer systématiquement le niveau maximal sans besoin avéré augmente la cotisation sans bénéfice proportionné pour le client.",
    ],
    example: "Comparer deux formules sur un même acte (ex. reste à charge estimé sur une consultation) est plus parlant qu'une simple liste de pourcentages.",
    quiz: [
      {
        id: "M18-Q1",
        question: "Comment éviter la sur-assurance lors d'un conseil ?",
        options: [
          "En proposant systématiquement le niveau maximal",
          "En ajustant le niveau de garantie aux besoins réels identifiés",
          "En ignorant le budget du client",
          "En ne proposant qu'une seule formule",
        ],
        correctIndex: 1,
        explanation: "Le conseil doit toujours s'appuyer sur une découverte des besoins documentée.",
      },
      {
        id: "M18-Q2",
        question: "Quel argument doit primer dans la présentation d'une garantie ?",
        options: ["Le prix uniquement", "L'adéquation aux besoins identifiés", "La couleur de la brochure", "La durée de l'entretien"],
        correctIndex: 1,
        explanation: "Le prix n'intervient qu'en dernier lieu, comme critère d'arbitrage entre formules pertinentes.",
      },
    ],
    linkedCaseIds: [],
  },
  {
    moduleId: "M19",
    lexiconCategories: [],
    course: [
      "Les cas avancés combinent plusieurs documents, plusieurs bénéficiaires et parfois plusieurs anomalies simultanées. Ils demandent de mobiliser ensemble lecture documentaire, calcul, détection d'anomalie et justification.",
      "Ce module rassemble les 3 cas pratiques classés « avancé » du portefeuille pédagogique Mutalia : audiologie senior avec prescription manquante, droits fermés à contrôler, et plafond d'implantologie à calculer.",
    ],
    example:
      "CASE-012 combine un devis dentaire, un plafond annuel à récupérer, une consommation déjà enregistrée et un calcul de disponible — plusieurs compétences mobilisées sur un seul dossier.",
    quiz: [
      {
        id: "M19-Q1",
        question: "Qu'est-ce qui caractérise un cas pratique « avancé » dans Mutalia ?",
        options: [
          "Un seul document simple",
          "La combinaison de plusieurs compétences (lecture, calcul, anomalie, justification)",
          "L'absence de tout calcul",
          "Un cas toujours sans anomalie",
        ],
        correctIndex: 1,
        explanation: "Les cas avancés demandent de mobiliser plusieurs compétences simultanément sur un même dossier.",
      },
      {
        id: "M19-Q2",
        question: "Combien de cas de difficulté « avancé » sont seedés dans le portefeuille P0 ?",
        options: ["1", "2", "3", "12"],
        correctIndex: 2,
        explanation: "CASE-006, CASE-011 et CASE-012 sont classés « avancé ».",
      },
    ],
    linkedCaseIds: ["CASE-006", "CASE-011", "CASE-012"],
  },
];

export function getAcademyModuleContent(moduleId: string): AcademyModuleContent | undefined {
  return ACADEMY_MODULE_CONTENT.find((m) => m.moduleId === moduleId);
}
