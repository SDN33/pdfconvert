# 🔗 Configuration du Webhook Stripe

## 📋 Vue d'ensemble

Le webhook Stripe automatise la création d'utilisateurs premium dans Supabase après un paiement réussi. Quand un client achète l'offre à 2,99€, Stripe envoie automatiquement une notification à votre serveur, qui crée l'utilisateur dans la base de données.

## 🎯 Fonctionnalités

✅ **Création automatique** des utilisateurs premium après paiement  
✅ **Mise à jour** si l'utilisateur existe déjà  
✅ **Gestion des remboursements** (désactivation du statut premium)  
✅ **Logs détaillés** pour debugging  
✅ **Sécurisé** avec vérification de signature Stripe  

## 🚀 Configuration (5 étapes)

### 1. Obtenir la clé Service Role de Supabase

1. Aller sur https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn
2. **Settings** → **API**
3. Descendre jusqu'à "**Service Role Key**" (section "Project API keys")
4. Cliquer sur "Reveal" et copier la clé (commence par `eyJ...`)
5. Ajouter dans **Vercel** :
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **Important** : Cette clé est différente de la clé `anon` publique. Elle permet d'écrire dans les tables protégées.

### 2. Déployer sur Vercel

```bash
# Push le code sur GitHub
git add .
git commit -m "feat: add stripe webhook"
git push origin main

# Vercel va détecter automatiquement le dossier /api
# L'endpoint sera disponible à : https://votre-site.vercel.app/api/webhook
```

### 3. Ajouter les variables d'environnement dans Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet **pdfconvert**
3. **Settings** → **Environment Variables**
4. Ajouter ces variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_51STVfg...` | Clé secrète Stripe (déjà configurée) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret du webhook (étape 4) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJ...` | Clé service Supabase (étape 1) |
| `VITE_SUPABASE_URL` | `https://oohbiwmyoylbwgalmcgn.supabase.co` | URL Supabase |

### 4. Configurer le Webhook dans Stripe

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer "**Add endpoint**"
3. **Endpoint URL** : `https://votre-site.vercel.app/api/webhook`
   - Exemple : `https://markdownenpdf.vercel.app/api/webhook`
4. **Events to send** → Cliquer "**Select events**"
5. Cocher ces événements :
   - ✅ `checkout.session.completed` (paiement réussi)
   - ✅ `charge.refunded` (remboursement)
6. Cliquer "**Add endpoint**"
7. Copier le "**Signing secret**" (commence par `whsec_...`)
8. Retourner dans Vercel → Ajouter `STRIPE_WEBHOOK_SECRET=whsec_...`

### 5. Tester le Webhook

#### Test 1 : Paiement factice (Stripe CLI)
```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Se connecter
stripe login

# Écouter les événements
stripe listen --forward-to https://votre-site.vercel.app/api/webhook

# Déclencher un événement de test
stripe trigger checkout.session.completed
```

#### Test 2 : Paiement réel (Mode Test)
1. Basculer Stripe en **mode test**
2. Faire un achat avec carte test : `4242 4242 4242 4242`
3. Vérifier dans Supabase :
   ```sql
   SELECT * FROM premium_users ORDER BY created_at DESC LIMIT 1;
   ```
4. L'utilisateur doit apparaître avec `is_lifetime = true`

## 📊 Vérifications

### Dans Stripe Dashboard
1. **Webhooks** → Votre endpoint
2. Cliquer sur un événement récent
3. Vérifier :
   - ✅ Status : `200 OK`
   - ✅ Response : `{"received": true}`
   - ✅ Logs sans erreurs

### Dans Supabase
```sql
-- Vérifier les utilisateurs premium créés
SELECT 
  email, 
  is_lifetime, 
  subscription_status, 
  purchased_at,
  created_at
FROM premium_users 
ORDER BY created_at DESC;
```

### Dans Vercel Logs
1. **Deployments** → Votre déploiement
2. **Functions** → `api/webhook`
3. Vérifier les logs :
   ```
   Webhook event received: checkout.session.completed
   Processing payment for: user@email.com
   Creating new premium user...
   Premium user processed successfully: user@email.com
   ```

## 🔍 Debugging

### Erreur : "Webhook signature verification failed"
**Cause** : `STRIPE_WEBHOOK_SECRET` incorrect ou manquant  
**Solution** :
1. Vérifier que le secret dans Vercel correspond à celui de Stripe
2. Redéployer après modification des variables

### Erreur : "Database insert error"
**Cause** : `SUPABASE_SERVICE_ROLE_KEY` incorrect ou permissions manquantes  
**Solution** :
1. Vérifier la clé Service Role dans Supabase → Settings → API
2. Vérifier les policies RLS sur `premium_users` :
   ```sql
   -- Autoriser service role à insérer
   CREATE POLICY "Allow service role insert" ON premium_users
   FOR INSERT
   WITH CHECK (true);
   ```

### Erreur : "No customer email in session"
**Cause** : Email non fourni lors du checkout  
**Solution** :
1. Vérifier que `redirectToCheckout()` inclut `customerEmail`
2. Dans `src/lib/stripe.ts`, vérifier :
   ```typescript
   customerEmail: email, // Doit être présent
   ```

### Webhook ne reçoit rien
**Cause** : URL incorrecte ou déploiement échoué  
**Solution** :
1. Tester l'endpoint manuellement :
   ```bash
   curl -X POST https://votre-site.vercel.app/api/webhook
   # Devrait retourner : {"error":"Method not allowed"}
   ```
2. Vérifier que le dossier `/api` est bien dans le repo

## 🎯 Flux Complet

```
1. Utilisateur clique "🚀 Illimité 2,99€"
   ↓
2. Redirection vers Stripe Checkout
   ↓
3. Utilisateur entre email + carte bancaire
   ↓
4. Paiement validé par Stripe
   ↓
5. Stripe envoie webhook → /api/webhook
   ↓
6. Webhook vérifie la signature
   ↓
7. Webhook créé/update utilisateur dans Supabase
   ↓
8. Redirection vers /success
   ↓
9. Utilisateur clique "Connexion"
   ↓
10. Entre son email → ✅ Accès premium activé
```

## 📝 Événements Gérés

| Événement Stripe | Action | Statut dans Supabase |
|------------------|--------|----------------------|
| `checkout.session.completed` | Créer/mettre à jour utilisateur | `subscription_status: 'active'` |
| `charge.refunded` | Désactiver premium | `subscription_status: 'refunded'`, `is_lifetime: false` |

## 🔐 Sécurité

✅ **Vérification de signature** : Stripe signe chaque webhook  
✅ **Service Role uniquement** : Seul le backend peut écrire dans `premium_users`  
✅ **HTTPS obligatoire** : Vercel force HTTPS  
✅ **Logs détaillés** : Traçabilité complète  
✅ **Idempotence** : Gère les doublons (update si existe déjà)  

## 🚨 Limites & Considérations

⚠️ **Retry Stripe** : Si le webhook échoue, Stripe réessaye automatiquement  
⚠️ **Délai** : Peut prendre 2-3 secondes entre paiement et création dans DB  
⚠️ **Mode Test vs Live** : Utiliser deux webhooks différents (un pour test, un pour live)  
⚠️ **Rate limiting** : Stripe peut throttle si trop de webhooks échouent  

## 📧 Prochaine Étape : Email de Confirmation

Ajouter l'envoi d'email après création :

```typescript
// Installer
npm install resend

// Dans api/webhook.ts après création utilisateur
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'MarkdownEnPDF <noreply@markdownenpdf.com>',
  to: session.customer_email,
  subject: '🎉 Bienvenue dans la version Premium !',
  html: `
    <h1>Bienvenue !</h1>
    <p>Votre accès illimité est maintenant actif.</p>
    <p>Connectez-vous avec cet email sur le site.</p>
  `
});
```

## ✅ Checklist Finale

- [ ] Clé Service Role ajoutée dans Vercel
- [ ] Webhook créé dans Stripe Dashboard
- [ ] Webhook Secret ajouté dans Vercel
- [ ] Endpoint testé : `https://votre-site.vercel.app/api/webhook`
- [ ] Test paiement effectué (mode test)
- [ ] Utilisateur créé dans Supabase
- [ ] Connexion fonctionne avec email d'achat
- [ ] Logs Vercel sans erreurs
- [ ] Webhooks Stripe en mode Live configuré

---

🎉 **Votre webhook est prêt ! Les paiements créeront automatiquement des utilisateurs premium.**
