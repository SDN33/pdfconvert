# ✅ CHECKLIST: Variables d'Environnement Vercel

## 🚨 PROBLÈME ACTUEL
La redirection Stripe ne fonctionne ni en dev ni en production.

## 🔍 DIAGNOSTIC

### 1. Vérifier les Variables d'Environnement Vercel

Allez sur : https://vercel.com/sdn33/pdfconvert/settings/environment-variables

**Variables OBLIGATOIRES** :

#### Backend (API)
- ✅ `STRIPE_SECRET_KEY` = `sk_live_...` (commence par sk_live_ en prod)
- ✅ `STRIPE_PRICE_ID_LIFETIME` = `price_1QULQEP7W0mQAYPWdxPNYKoV`
- ✅ `SUPABASE_URL` = `https://oohbiwmyoylbwgalmcgn.supabase.co`
- ✅ `SUPABASE_SERVICE_KEY` = `eyJhbGc...` (Service Role key)

#### Frontend (VITE)
- ✅ `VITE_STRIPE_PUBLIC_KEY` = `pk_live_...` (commence par pk_live_ en prod)
- ✅ `VITE_STRIPE_PRICE_ID` = `price_1QULQEP7W0mQAYPWdxPNYKoV`
- ✅ `VITE_SUPABASE_URL` = `https://oohbiwmyoylbwgalmcgn.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...` (Anon/Public key)

#### Optionnel (Rate Limiting)
- ⏳ `UPSTASH_REDIS_REST_URL` = `https://...`
- ⏳ `UPSTASH_REDIS_REST_TOKEN` = `...`

---

## 🛠️ ÉTAPES DE CORRECTION

### Étape 1 : Vérifier les Clés Stripe Locales

```bash
cat .env | grep STRIPE
```

**Vous devriez voir** :
```
STRIPE_SECRET_KEY=sk_live_51QULJXP7W0mQAYPW...
VITE_STRIPE_PUBLIC_KEY=pk_live_51QULJXP7W0mQAYPW...
VITE_STRIPE_PRICE_ID=price_1QULQEP7W0mQAYPWdxPNYKoV
STRIPE_PRICE_ID_LIFETIME=price_1QULQEP7W0mQAYPWdxPNYKoV
```

---

### Étape 2 : Configurer Vercel Environment Variables

1. **Allez sur Vercel Dashboard** :
   ```
   https://vercel.com/sdn33/pdfconvert/settings/environment-variables
   ```

2. **Pour CHAQUE variable**, cliquez sur "Add New" :

   **Variable 1** :
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_51QULJXP7W0mQAYPW...` (copiez depuis .env)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2** :
   - Name: `VITE_STRIPE_PUBLIC_KEY`
   - Value: `pk_live_51QULJXP7W0mQAYPW...`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3** :
   - Name: `VITE_STRIPE_PRICE_ID`
   - Value: `price_1QULQEP7W0mQAYPWdxPNYKoV`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 4** :
   - Name: `STRIPE_PRICE_ID_LIFETIME`
   - Value: `price_1QULQEP7W0mQAYPWdxPNYKoV`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variables Supabase** (répéter pour les 4 variables Supabase)

3. **Cliquez sur "Save"** après chaque variable

---

### Étape 3 : Redéployer l'Application

**Option A : Via Git Push (Recommandé)**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

**Option B : Via Vercel Dashboard**
1. Allez sur : https://vercel.com/sdn33/pdfconvert
2. Cliquez sur l'onglet "Deployments"
3. Trouvez le dernier déploiement
4. Cliquez sur les 3 points → "Redeploy"
5. Sélectionnez "Use existing Build Cache" = ❌ OFF
6. Cliquez "Redeploy"

---

### Étape 4 : Tester la Redirection Stripe

1. **Ouvrez** : https://markdownenpdf.com
2. **Cliquez** sur "🚀 Illimité 2,99€" (sans vous connecter)
3. **Résultat attendu** : Redirection vers `checkout.stripe.com`
4. **Si ça ne marche pas** : Ouvrez la console (F12) et copiez les erreurs

---

## 🐛 ERREURS COURANTES

### Erreur : "Stripe Public Key: MANQUANTE ✗"
**Cause** : `VITE_STRIPE_PUBLIC_KEY` non configurée sur Vercel
**Solution** : Ajoutez la variable sur Vercel (voir Étape 2)

### Erreur : "Prix non autorisé"
**Cause** : `STRIPE_PRICE_ID_LIFETIME` différent de `VITE_STRIPE_PRICE_ID`
**Solution** : Les 2 variables doivent avoir la même valeur : `price_1QULQEP7W0mQAYPWdxPNYKoV`

### Erreur : "Erreur serveur (500)"
**Cause** : `STRIPE_SECRET_KEY` manquante ou invalide
**Solution** : 
1. Vérifiez que la clé commence par `sk_live_` (pas `sk_test_`)
2. Allez sur https://dashboard.stripe.com/apikeys
3. Copiez la "Secret key" (révélez-la si nécessaire)
4. Mettez à jour sur Vercel

### Erreur : "Failed to fetch"
**Cause** : API route `/api/create-checkout-session` non trouvée
**Solution** : Vérifiez que le dossier `api/` est bien déployé sur Vercel

---

## 🧪 TEST EN LOCAL

Pour tester en local SANS déployer sur Vercel :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Télécharger les variables d'env depuis Vercel
vercel env pull

# Lancer en mode production local
vercel dev
```

Ensuite ouvrez http://localhost:3000 et testez le bouton "Débloquer".

---

## 📞 SI ÇA NE MARCHE TOUJOURS PAS

Envoyez-moi :

1. **Screenshot de la console** (F12 → Console) avec l'erreur
2. **Variables d'environnement Vercel** (screenshot de la page settings/environment-variables)
3. **Logs du déploiement** (Vercel Dashboard → Deployments → Latest → Function Logs)

**Commande pour vérifier les logs** :
```bash
vercel logs https://markdownenpdf.com --follow
```

---

**Date** : 15 novembre 2025  
**Statut** : 🔴 BLOQUANT - À configurer IMMÉDIATEMENT
