# Audit final du prototype — 11 septembre 2026

Base : Codex `41f9d67`. Audit applicatif ciblé, sans PDF, extraction ni modification du référentiel.

| Niveau | Trouvés | Corrigés | Restants |
|---|---:|---:|---:|
| P0 reproductibles | 0 | 0 | 0 identifié |
| P1 applicatifs reproductibles | 0 | 0 | 0 identifié |
| P2 | 5 | 0 | 5 |

Aucune correction fonctionnelle ni refactoring : aucun défaut P0/P1 établi dans les scénarios contrôlés. Ce constat ne constitue pas une certification exhaustive.

## P2 conservés

- À 820 px, les identifiants longs et boutons de Prestations se replient excessivement ; ils restent accessibles. Dossiers et Agenda défilent dans leur conteneur, sans débordement de page (820/820 px mesurés).
- La recherche des archives n’indique pas le statut clôturé ; les actions rapides restent proposées sur leur fiche, avant contrôle métier à l’enregistrement.
- Un rechargement d’une URL `action=add` rouvre le formulaire bénéficiaire déjà utilisé ; Annuler ou les actions rapides permettent de poursuivre.
- Sémantique visuelle encore hétérogène entre certains badges du Cockpit, de la fiche, des Anomalies et de l’Agenda ; textes conservés. Liens « Fiche adhérent » / « Contact créé » trop rapprochés.
- Le taux AMO 60 % porte le libellé « Auxiliaires médicaux » dans le simulateur générique, peu adapté au cas dentaire ; calcul exact et taux personnalisé disponible.

## Vérifications

- Suite applicative complète exécutée une fois : **23 fichiers, 124 tests réussis**. Tests existants de domaine, composants, isolation de comptes, sessions HTTP, déconnexion/reconnexion, récupération, cycles de vie et conservation des seeds inclus. `typecheck` et `lint` réussis. Avertissement Vite de configuration non bloquant.
- Build **non validé** : Turbopack échoue sur la création d’un processus/port interne (`Operation not permitted`, globals.css). Une relance avec permission étendue reproduit le blocage système. Aucun changement de configuration pour le masquer ; à terminer dans un environnement autorisant ce port. Aucun smoke-test du bundle de production possible.
- Navigateur, serveur de développement : création de Camille AuditFinal ; ajout Alex (conjoint) et Lou (enfant), modification ville, détachement enfant, divorce conjoint, clôture, retrait des actifs, récupération par archives et recherche, historique conservé après rechargement.
- Agenda : date/heure, changement de durée et d’heure au clavier (18:01–18:46 persisté), alerte de chevauchement, annulation conservée, statut Réalisé, présence préalable dans 360°/Cockpit, conversion manuelle en contact. Confirmation conservant deux créneaux chevauchants et interdiction après clôture également couvertes par les tests existants. La saisie automatisée `fill` des heures a nécessité une vérification au clavier ; elle n’est pas retenue comme défaut applicatif.
- Prestation fictive 440 €/BRSS 120/AMO 60 % sans garantie : calcul bloqué, dossier de contrôle et anomalie liés, historique accessible après clôture.
- Simulateur navigateur : prothèse fixe 2691 B à 340 % BR → **AMO 72 €, AMC 336 €, RAC 32 €**. PSI123 documenté mais condition/consommation inconnue : champs et calcul désactivés, provenance visible. PLI211 candidat non proposé au calcul. Tests : verified simple autorisé, needs_review bloqué, not_extracted absent, références isolées.
- UX 1440/820 : navigation et écrans métier, états vides, champs, focus visible, confirmations et tableaux inspectés. Fiche/archives, Dossiers, Cockpit, Agenda, Garanties/Simulateur, Prestations, PEC/Devis, Cotisations, Anomalies, Relation et GED consultés. Boutons de création PEC/devis, échéance et réclamation ouverts puis abandonnés ; workflows détaillés couverts par tests, pas tous rejoués de bout en bout au navigateur.
- Connexion : formulaire existant inspecté, session authentifiée utilisée ; authentification valide/invalide et sécurité contrôlées par tests HTTP, sans ressaisir le mot de passe utilisateur. GED : liste/filtres inspectés ; ni import ni ouverture PDF, conformément au périmètre.

## Limites et données de l’audit

Prototype pédagogique : aucun paiement, prélèvement, email/SMS ni télétransmission réel. Référentiel particuliers incomplet et calcul volontairement bloqué quand ses conditions ne sont pas déterminées. Audit UX ponctuel, pas une certification d’accessibilité ou de sécurité.
Le foyer fictif **Camille AuditFinal** reste clôturé dans le compte utilisé, avec ses deux anciens bénéficiaires, deux rendez-vous (Annulé/Réalisé), un contact, une prestation bloquée et ses liens de contrôle ; aucune suppression ni modification des foyers pédagogiques. Le build reste la réserve à lever avant une validation de production.
