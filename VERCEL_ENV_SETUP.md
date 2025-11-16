# Configuration des Variables d'Environnement sur Vercel

## 🚨 Problème Actuel

L'erreur **"Configuration Stripe invalide"** indique que les variables d'environnement ne sont pas configurées sur Vercel.

## ✅ Solution : Configurer les Variables sur Vercel

### Étape 1 : Accéder aux Paramètres Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `pdfconvert`
3. Cliquer sur **Settings** (en haut)
4. Cliquer sur **Environment Variables** (menu latéral)

### Étape 2 : Ajouter les Variables d'Environnement

Ajouter **UNE PAR UNE** les variables suivantes (cocher **Production**, **Preview** et **Development**) :

#### 🔐 Variables Stripe (OBLIGATOIRES pour le paiement)

```bash
STRIPE_SECRET_KEY=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

STRIPE_WEBHOOK_SECRET=whsec_YZLzhOSnz84IhDYpEar2MLuQaf1NzNNX

STRIPE_PRICE_ID_LIFETIME=price_1STW1z1hBWMOXJEVjsamoo6b
```

#### 🔐 Variables Supabase (OBLIGATOIRES pour la base de données)

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGJpd215b3lsYndnYWxtY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjI3NCwiZXhwIjoyMDc4NzMyMjc0fQ.3ElTS3uH9OS6F8Xj34xctUKr3ZDuUSypvfDHfxnyB7c

VITE_SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGJpd215b3lsYndnYWxtY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTYyNzQsImV4cCI6MjA3ODczMjI3NH0.YDr4boZh4JadX3w7Ec2M948cwaD0FanEvnNEyEHR61Q
```

#### 🔐 Variables Upstash Redis (RECOMMANDÉ pour rate-limiting)

```bash
UPSTASH_REDIS_REST_URL=https://promoted-poodle-36070.upstash.io

UPSTASH_REDIS_REST_TOKEN=AYzmAAIncDE0N2JlOGRiMzZjN2E0ZTRmODY1MzdjYTg4NjM3ZjljY3AxMzYwNzA
```

#### 🔐 Variables Resend (RECOMMANDÉ pour emails)

```bash
RESEND_API_KEY=re_2ZFSLfKD_5XEKvpmMMtsMiKV51tp1YFip
```

#### 📦 Variables Stripe côté client (publiques)

```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_51STVfg1hBWMOXJEVnGYG3zhx6JOvYqT4nu0nZ5lUQCKeECTTiPLmd0folKykk2k6k2QjokE5HzRwPTKXc6Q78Frj00JuES5gj5

VITE_STRIPE_PRODUCT_ID=prod_TQMlKmPKE71FwQ

VITE_STRIPE_PRICE_ID=price_1STW1z1hBWMOXJEVjsamoo6b
```

### Étape 3 : Redéployer

Après avoir ajouté toutes les variables :

1. Cliquer sur **Deployments** (en haut)
2. Trouver le dernier déploiement
3. Cliquer sur les **trois points** (•••) à droite
4. Cliquer sur **Redeploy**
5. Cliquer sur **Redeploy** dans la modale de confirmation

**OU** simplement pousser un nouveau commit :

```bash
git commit --allow-empty -m "Trigger redeploy after env vars"
git push origin main
```

### Étape 4 : Vérifier

1. Attendre la fin du déploiement (1-2 minutes)
2. Aller sur https://www.markdownenpdf.com
3. Tester le bouton **"Essayez gratuitement"**
4. Le paiement devrait maintenant fonctionner ✅

## 🔍 Vérification Rapide

Pour vérifier si les variables sont bien configurées, vous pouvez :

1. Aller dans **Settings** > **Environment Variables**
2. Vérifier que vous voyez au minimum :
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`

## ⚠️ Notes Importantes

- Les variables préfixées par `VITE_` sont exposées côté client
- Les autres (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) restent privées côté serveur
- **NE JAMAIS** committer le fichier `.env` dans Git (déjà dans `.gitignore`)
- Les variables doivent être configurées pour **Production**, **Preview** ET **Development**

## 🐛 Debug

Si l'erreur persiste après configuration :

1. Vérifier les logs Vercel : **Deployments** > Cliquer sur le déploiement > **Function Logs**
2. Chercher les logs côté serveur :
   ```
   ❌ Stripe authentication failed - check STRIPE_SECRET_KEY
   ❌ STRIPE_SECRET_KEY is not set
   ```
3. Si vous voyez ces logs, la variable n'est pas correctement configurée

## 📚 Ressources

- [Documentation Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Supabase Settings](https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn/settings/api)
