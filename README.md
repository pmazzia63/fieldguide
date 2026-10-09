# FieldGuide

Site web 3D pour découvrir les postes de trois sports : basket, football américain et baseball.

## Démarrer

```sh
npm install
npm run dev
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run lint` | ESLint (règles typées strictes) |
| `npm run check-links` | Vérifie les URL Wikipedia de `src/data/*.json` |

## Stack

Vite · React · TypeScript strict · @react-three/fiber · @react-three/drei · Zustand · Tailwind CSS v4

Déployé sur Vercel (voir `vercel.json`).
