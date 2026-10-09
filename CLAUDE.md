# FieldGuide
Site web 3D : 3 sports (basket, foot US, baseball), joueurs cliquables par poste.

## Stack
Vite, React, TypeScript strict, @react-three/fiber, @react-three/drei, Zustand, Tailwind.

## Commandes
- npm run dev / npm run build / npm run lint / npm run check-links

## Conventions
- Données des postes UNIQUEMENT dans src/data/*.json, typées par src/types.ts
- Unités 3D : 1 unité = 1 mètre. Centre du terrain = (0,0,0)
- Joueurs = composants procéduraux (pas de modèles externes sans validation)
- Aucun logo ni nom d'équipe réelle

## Règles
- Ne jamais inventer d'URL Wikipedia : lancer npm run check-links après modif des données
- Toujours lancer npm run build avant de dire qu'une tâche est finie