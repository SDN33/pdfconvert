# ⚡ Guide de Déploiement Express

## 🎯 En 10 minutes chrono

### ✅ Pré-requis
- [x] Code pushé sur GitHub
- [x] Compte Vercel
- [x] Compte Stripe
- [x] Projet Supabase créé
- [x] Schema SQL exécuté

---

## 📝 Étape 1 : Récupérer les clés (5 min)

### Supabase
1. https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn
2. **Settings** → **API**
3. Copier :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` (Reveal) → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. https://dashboard.stripe.com/apikeys
2. Copier :
   - `Publishable key` → `VITE_STRIPE_PUBLIC_KEY`
   - `Secret key` (Reveal) → `STRIPE_SECRET_KEY`
3. Produits → Votre produit :
   - ID produit → `VITE_STRIPE_PRODUCT_ID`
   - Prix → ID prix → `VITE_STRIPE_PRICE_ID`

---

## 🚀 Étape 2 : Déployer sur Vercel (2 min)

### Via Dashboard
1. https://vercel.com/new
2. **Import Git Repository**
3. Sélectionner `SDN33/pdfconvert`
4. **Deploy** (sans variables pour l'instant)

### Via CLI (alternatif)
```bash
npm i -g vercel
vercel --prod
```

---

## ⚙️ Étape 3 : Configurer Variables (2 min)

1. Vercel Dashboard → Votre projet
2. **Settings** → **Environment Variables**
3. Ajouter (cliquer "Add" pour chaque) :

| Variable | Valeur | Source |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | `https://oohbiwmyoylbwgalmcgn.supabase.co` | Supabase API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Supabase API |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_live_51STVfg...` | Stripe API keys |
| `VITE_STRIPE_PRODUCT_ID` | `prod_TQMlKmPKE71FwQ` | Stripe Produits |
| `VITE_STRIPE_PRICE_ID` | `price_1STW1z1hBWMOXJEVjsamoo6b` | Stripe Prix |
| `STRIPE_SECRET_KEY` | `sk_live_51STVfg...` | Stripe API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` | Supabase API |

4. **Save**
5. **Deployments** → 3 points → **Redeploy** (pour appliquer les variables)

---

## 🔗 Étape 4 : Webhook Stripe (1 min)

1. https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. **Endpoint URL** : `https://votre-projet.vercel.app/api/webhook`
   - Copier l'URL depuis Vercel (onglet Domains)
4. **Events** :
   - ✅ `checkout.session.completed`
   - ✅ `charge.refunded`
5. **Add endpoint**
6. Copier le **Signing secret** (`whsec_...`)
7. Retour Vercel → Add variable :
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
8. **Redeploy** à nouveau

---

## ✅ Étape 5 : Tester (3 min)

### Test 1 : Site fonctionne
```bash
open https://votre-projet.vercel.app
```
- Bannière premium visible ✅
- Éditeur Markdown fonctionne ✅
- Compteur "2/2" affiché ✅

### Test 2 : Conversion gratuite
1. Coller du Markdown
2. Télécharger PDF
3. Vérifier dans Supabase :
   ```sql
   SELECT * FROM conversion_logs ORDER BY created_at DESC LIMIT 1;
   ```
   → Une ligne doit apparaître ✅

### Test 3 : Paiement test
1. Passer Stripe en **mode Test** (toggle en haut)
2. Sur votre site, cliquer "🚀 Illimité 2,99€"
3. Entrer email + carte : `4242 4242 4242 4242`
4. Valider
5. Vérifier webhook Stripe :
   - Dashboard → Webhooks → Votre endpoint
   - Dernier événement : `200 OK` ✅
6. Vérifier Supabase :
   ```sql
   SELECT * FROM premium_users ORDER BY created_at DESC LIMIT 1;
   ```
   → Utilisateur créé ✅

### Test 4 : Connexion premium
1. Sur le site, cliquer "Connexion"
2. Entrer l'email utilisé au test 3
3. Se connecter
4. Bannière devient verte ✅
5. Convertir plusieurs fois → Pas de limite ✅

---

## 🎉 C'est terminé !

### Basculer en mode Live (Production)

1. **Stripe** : Toggle "Test mode" → OFF
2. **Vercel** : Vérifier que `VITE_STRIPE_PUBLIC_KEY` commence par `pk_live_`
3. **Webhook** : Créer un 2ème endpoint pour LIVE
   - URL : même URL
   - Mode : Live (pas Test)
   - Events : mêmes
   - Secret : copier le nouveau `whsec_...` (différent du test)
   - Mettre à jour dans Vercel : `STRIPE_WEBHOOK_SECRET`

### Domaine personnalisé

1. Vercel → Settings → Domains
2. Add : `markdownenpdf.com`
3. Dans Hostinger (DNS) :
   - Type : `CNAME`
   - Host : `@`
   - Value : `cname.vercel-dns.com`
4. Attendre propagation (5-10 min)

---

## 🔍 Checklist Finale

- [ ] Site accessible sur Vercel URL
- [ ] Variables d'environnement configurées (8 au total)
- [ ] Webhook Stripe créé et testé
- [ ] Conversion gratuite fonctionne
- [ ] Paiement test fonctionne
- [ ] Utilisateur créé dans Supabase
- [ ] Connexion premium fonctionne
- [ ] Compteur se met à jour
- [ ] Bannière premium s'affiche
- [ ] Mode Live activé
- [ ] Domaine personnalisé configuré (optionnel)

---

## 📞 En cas de problème

### Site ne charge pas
→ Check Build logs : Vercel → Deployments → Logs

### Webhook échoue
→ Check Function logs : Vercel → Functions → `api/webhook`

### Variables manquantes
→ Settings → Environment Variables → Vérifier les 8 variables

### Utilisateur non créé
→ Stripe → Webhooks → Events → Status des webhooks

---

## 🎯 URLs Importantes

- **Site** : https://votre-projet.vercel.app
- **Vercel** : https://vercel.com/dashboard
- **Supabase** : https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn
- **Stripe** : https://dashboard.stripe.com
- **Webhook** : https://votre-projet.vercel.app/api/webhook

---

⚡ **Déployé en 10 minutes !**

Temps réel moyen :
- Récupération clés : 5 min
- Déploiement Vercel : 2 min
- Configuration variables : 2 min
- Webhook Stripe : 1 min
- Tests : 3 min

**Total : ~13 minutes** ⏱️
