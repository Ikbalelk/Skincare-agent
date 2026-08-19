# Skincare & Haircare Agent — Starter

Starter fonctionnel : Next.js + Supabase + API Claude avec tool use.

## Ce que contient ce starter

```
schema.sql              → schéma Postgres à exécuter dans Supabase
lib/supabase.ts          → client Supabase (côté serveur uniquement)
lib/claude.ts             → tools, system prompt, boucle tool use
app/api/chat/route.ts    → endpoint API appelé par le frontend
app/page.tsx              → UI de chat minimale
.env.example              → variables d'environnement à renseigner
```

## Setup, étape par étape

### 1. Créer le projet Next.js

Si tu pars de zéro :

```bash
npx create-next-app@latest skincare-agent --typescript --app
```

Puis copie les fichiers de ce starter par-dessus (ils écrasent `app/page.tsx` et ajoutent le reste).

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un projet gratuit.
2. Dans **SQL Editor**, colle le contenu de `schema.sql` et exécute-le. Ça crée les 4 tables et une ligne de profil vide.
3. Dans **Project Settings > API**, récupère :
   - `Project URL` → variable `SUPABASE_URL`
   - `service_role` key (⚠️ pas la `anon` key — celle-ci a les droits complets, garde-la strictement côté serveur) → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Récupérer ta clé API Anthropic

Sur [console.anthropic.com](https://console.anthropic.com), section API Keys.

### 5. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplis les 3 valeurs (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### 6. Renseigner ton profil (optionnel mais recommandé)

Dans Supabase, table `profile`, édite directement la ligne existante avec ton type de peau, tes allergies, tes objectifs. Sinon l'agent démarre avec un profil vide et va simplement te poser des questions.

### 7. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Vérifier que le tool use fonctionne

Écris dans le chat : *"J'ai utilisé le sérum niacinamide ce matin"*.

Si tout est branché correctement :
1. Claude répond avec un `tool_use` pour `log_routine_entry`
2. Ton backend insère une ligne dans `routine_entries` (visible dans Supabase Table Editor)
3. Claude confirme en langage naturel dans le chat

Tu peux inspecter `toolLog` dans la réponse JSON de `/api/chat` (via les devtools réseau) pour voir exactement quel tool a été appelé et avec quels paramètres.

## Prochaines étapes suggérées

- **Vision (photos de listes INCI)** : ajouter un input file dans `app/page.tsx`, encoder en base64, et inclure un bloc `{ type: "image", source: {...} }` dans le message envoyé à `/api/chat`.
- **Nouveau tool `lookup_ingredient`** : brancher une recherche web ou une base INCI locale.
- **Déploiement** : push sur GitHub, connecte le repo à [Vercel](https://vercel.com), ajoute les mêmes variables d'environnement dans les settings du projet Vercel.

## Déploiement rapide (Vercel)

```bash
npm i -g vercel
vercel
```

Puis ajoute les 3 variables d'environnement dans le dashboard Vercel (Settings > Environment Variables) avant le premier déploiement en production.
