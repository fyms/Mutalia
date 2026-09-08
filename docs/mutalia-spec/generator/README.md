# Générateur

Le prototype doit utiliser ce principe pour produire des dossiers aléatoires contrôlés. Le script fourni génère le squelette JSON. Les PDFs des 12 cas de `samples/` montrent les gabarits à reproduire.

Commande : `python generate_cases.py --count 25 --seed 12345 --out ./generated_cases`

Le seed rend les jeux reproductibles. Aucun identifiant administratif/bancaire valide ne doit être créé.
