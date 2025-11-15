# 🛠️ Fix Erreur Paiement Stripe

## Problème
Message d'erreur : "Erreur lors de la redirection vers le paiement. Veuillez réessayer."

## Diagnostic

### 1️⃣ Mode Développement Local
Si vous testez avec `npm run dev`, c'est **NORMAL** que le paiement ne fonctionne pas en local.

**Solution :**
- En local, un message de simulation s'affiche
- Pour tester le vrai paiement, **déployez sur Vercel**

---

### 2️⃣ Vérifier les logs console

Ouvrez la console navigateur (F12) et cherchez ces messages :

```
🛒 Démarrage du processus de paiement...
📧 Email: xxx
🔑 Stripe Public Key: Configurée ✓
```

#### **Cas A : "Stripe Public Key: MANQUANTE ✗"**
❌ **Problème :** Variable d'environnement manquante

✅ **Solution :**
1. Vérifiez `.env` :
```env
VITE_STRIPE_PUBLIC_KEY=pk_live_51STVfg1hBWMOXJEVnGYG3zhx6JOvYqT4nu0nZ5lUQCKeECTTiPLmd0folKykk2k6k2QjokE5HzRwPTKXc6Q78Frj00JuES5gj5
```

2. **Redémarrez le serveur** après modification de `.env`
```bash
npm run dev
```

#### **Cas B : "Failed to fetch" ou "NetworkError"**
❌ **Problème :** L'API `/api/create-checkout-session` n'est pas accessible

✅ **Solution :**
- En local : c'est normal, utilisez la simulation
- En production : vérifiez le déploiement Vercel

#### **Cas C : "404 Not Found"**
❌ **Problème :** L'API n'existe pas ou n'est pas déployée

✅ **Solution :**
1. Vérifiez que le dossier `api/` existe avec :
   - `create-checkout-session.ts`
   - `webhook.ts`
   - `verify-session.ts`

2. Vérifiez `vercel.json` (déjà corrigé) :
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

3. **Redéployez sur Vercel** :
```bash
git add .
git commit -m "Fix Stripe API config"
git push origin main
```

#### **Cas D : "500 Internal Server Error"**
❌ **Problème :** Erreur côté serveur (clé API Stripe invalide ou manquante)

✅ **Solution dans Vercel Dashboard :**

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Ajoutez ces variables :

```
STRIPE_SECRET_KEY=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

STRIPE_WEBHOOK_SECRET=whsec_YZLzhOSnz84IhDYpEar2MLuQaf1NzNNX

VITE_STRIPE_PUBLIC_KEY=pk_live_51STVfg1hBWMOXJEVnGYG3zhx6JOvYqT4nu0nZ5lUQCKeECTTiPLmd0folKykk2k6k2QjokE5HzRwPTKXc6Q78Frj00JuES5gj5

VITE_STRIPE_PRICE_ID=price_1STW1z1hBWMOXJEVjsamoo6b

VITE_STRIPE_PRODUCT_ID=prod_TQMlKmPKE71FwQ

VITE_SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co

VITE_SUPABASE_ANON_KEY=[votre_clé_anon]
```

5. **Redéployez** après ajout des variables

---

## ✅ Solution Rapide

### En LOCAL (développement) :
```bash
# 1. Vérifiez .env
cat .env

# 2. Redémarrez le serveur
npm run dev

# 3. Testez → Vous verrez une simulation
```

### En PRODUCTION (Vercel) :
```bash
# 1. Vérifiez vercel.json (déjà corrigé ✓)
cat vercel.json

# 2. Vérifiez les variables d'environnement Vercel
# (voir instructions ci-dessus)

# 3. Déployez
git add .
git commit -m "Fix Stripe payment config"
git push origin main

# 4. Attendez le déploiement (2-3 minutes)

# 5. Testez sur votre domaine de production
```

---

## 🧪 Test de validation

### Test 1 : Console navigateur
1. Ouvrez votre site
2. F12 → Console
3. Cliquez sur "Acheter Premium"
4. Vérifiez les logs :

**✅ Bon :**
```
🛒 Démarrage du processus de paiement...
📧 Email: test@example.com
🔑 Stripe Public Key: Configurée ✓
🌐 Appel de l'API pour créer la session de paiement...
📡 Réponse API: 200 OK
📦 Données reçues: { sessionId: "cs_test_..." }
✅ Session créée: cs_test_...
🔄 Redirection vers Stripe Checkout...
```

**❌ Mauvais :**
```
❌ Erreur HTTP: 404 Not Found
```
ou
```
❌ Stripe Public Key: MANQUANTE ✗
```

### Test 2 : Stripe Dashboard
1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Developers** → **Logs**
3. Vérifiez qu'une session de paiement est créée quand vous testez

### Test 3 : Vercel Logs
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. **Functions** → Vérifiez que les API functions sont listées :
   - `api/create-checkout-session`
   - `api/webhook`
   - `api/verify-session`

---

## 🔍 Diagnostic détaillé avec logs

Avec la nouvelle version du code, vous aurez des logs détaillés dans la console :

```javascript
// Logs de succès
🛒 Démarrage du processus de paiement...
📧 Email: user@example.com
🔑 Stripe Public Key: Configurée ✓
🌐 Appel de l'API pour créer la session de paiement...
📡 Réponse API: 200 OK
📦 Données reçues: { sessionId: "cs_test_a1b2c3..." }
✅ Session créée: cs_test_a1b2c3...
🔄 Redirection vers Stripe Checkout...

// Logs d'erreur
💥 Erreur dans redirectToCheckout: Error: ...
Type d'erreur: Error
Message: Failed to fetch
Stack: ...
```

Ces logs vous indiqueront exactement où le problème se situe.

---

## 📋 Checklist finale

- [ ] Fichier `vercel.json` configuré avec les functions
- [ ] Variables d'environnement dans `.env` (local)
- [ ] Variables d'environnement dans Vercel Dashboard (production)
- [ ] Dossier `api/` avec les 3 fichiers TypeScript
- [ ] Code déployé sur Vercel
- [ ] Test en console : logs sans erreur
- [ ] Test paiement : redirection vers Stripe

---

## 🆘 Toujours bloqué ?

### Option 1 : Test avec Stripe CLI (avancé)
```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhook
```

### Option 2 : Vérifier la clé Stripe
```bash
# Dans la console navigateur
console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
// Doit afficher : "pk_live_51STVfg..."
```

### Option 3 : Tester l'API manuellement
```bash
# En production
curl -X POST https://votre-domaine.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","priceId":"price_1STW1z1hBWMOXJEVjsamoo6b"}'

# Doit retourner : {"sessionId":"cs_test_..."}
```

---

## ✨ Résumé

1. **En local** : le paiement affiche une simulation (c'est normal)
2. **En production** : déployez sur Vercel avec les bonnes variables d'environnement
3. **Logs console** : activés pour diagnostic précis
4. **vercel.json** : corrigé pour supporter les API functions

Le paiement devrait maintenant fonctionner en production ! 🎉
