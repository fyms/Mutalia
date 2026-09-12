# Documents runtime

Métadonnées et événements génériques dans SQLite (`runtime_documents`, `runtime_document_events`) ; fichiers privés dans `dataDir/uploads` (par défaut `.data/uploads`, ignoré par Git). Noms physiques UUID, répertoire 0700 et fichiers 0600. `documentFiles` est l'adaptateur binaire remplaçable par un stockage objet.

Les anciens BLOB AMO du compte sont migrés à la première lecture vers ce même stockage, puis retirés du champ binaire SQLite après écriture du fichier et de la métadonnée. Le snapshot d'audit AMO reste conservé et les anciennes URL restent valides. Les nouveaux AMO utilisent directement le stockage commun.

Les imports sont limités à 10 Mo, PDF/JPEG/PNG, avec extension, MIME et signature binaire concordants. Aucun OCR ni extraction. Les noms comportant un NIR/IBAN sont refusés. Le formulaire requiert la confirmation d'un document fictif.

Toute lecture, qualification ou suppression runtime contrôle propriétaire + foyer + identifiant documentaire. Seuls les imports peuvent être supprimés, après confirmation ; l'événement générique survit à la suppression. Les cas, fixtures, modèles et corrigés ne sont jamais modifiés. La réinitialisation du profil n'efface ni imports ni documents générés.
