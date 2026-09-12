# Décompte AMO pédagogique

Le modèle PDF/PNG est copié sans transformation depuis Documents pour cas pratique. Le PDF généré charge une copie du PDF A4 et renseigne ses zones ; les fichiers sources restent immuables. Aucun document généré ne rejoint le corrigé du cas.

Vérification des API DILA (2026-09-12) : le catalogue officiel expose actuellement les datasets **api-lannuaire-administration-locale-competence-geographique** et **api-lannuaire-administration** (avec « lannuaire », contrairement aux identifiants plus anciens). Champs territoriaux : code_insee_commune, nom_commune, code_type_service_local, id_service_local (tableau JSON sérialisé). Type CPAM constaté : **cpam**. Le service expose id, nom, adresse et pivot, ces deux derniers étant des tableaux JSON sérialisés. Adresse de type « Adresse ».

Sources : [DILA / compétence géographique](https://www.data.gouv.fr/dataservices/api-annuaire-de-ladministration-competence-geographique-des-services-locaux), [catalogue officiel](https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets), [type CPAM](https://lannuaire.service-public.gouv.fr/navigation/cpam).

Résolution par commune exacte : aucune règle départementale, aucune déduction à partir du NIR. Meung-sur-Loire (45203) renvoie actuellement deux identifiants de services CPAM : l'application signale l'ambiguïté plutôt que choisir arbitrairement. DROM/arrondissements sont traités exclusivement selon les résultats officiels ; absence de correspondance exacte = vérification requise.

Cache SQLite public partagé (coordonnées de services, aucun assuré), 14 jours, conservé après expiration pour secours en cas de panne. Échecs/ambiguïtés mémorisés 5 minutes pour éviter les appels répétés lors du résumé puis de la génération. Déduplication des requêtes simultanées, timeout de 5 secondes par API. NIR accepté : préfixe DEMO et 15 chiffres synthétiques, donc inutilisable comme NIR réel. Recherche exacte côté serveur via POST ; index et résultats ne contiennent jamais le numéro complet.
