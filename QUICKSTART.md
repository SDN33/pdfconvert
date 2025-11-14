# 🚀 Guide de démarrage rapide - MarkdownEnPDF.com

## ⚡ Installation (5 minutes)

### 1. Cloner et installer
```bash
cd /Users/stephane/Documents/pdfconvert
npm install
```

### 2. Configurer Supabase (2 minutes)

1. **Créer un compte** : https://supabase.com
2. **Créer un projet** (choisir région proche)
3. **Exécuter le SQL** :
   - Dashboard → SQL Editor
   - Copier/coller le contenu de `supabase_schema.sql`
   - Cliquer "Run"
4. **Récupérer les clés** :
   - Settings → API
   - Copier "Project URL" et "anon public"

### 3. Configurer Stripe (1 minute)

1. **Créer un compte** : https://dashboard.stripe.com
2. **Mode Test** : Activé par défaut
3. **Récupérer la clé** :
   - Developers → API keys
   - Copier "Publishable key" (pk_test_xxx)

### 4. Variables d'environnement (30 secondes)

Créer `.env` à la racine :
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx...
```

### 5. Lancer le projet
```bash
npm run dev
```

Ouvrir : http://localhost:5173

## ✅ Tester les fonctionnalités

### Test 1 : Conversion normale
1. Coller du Markdown
2. Cliquer "Télécharger en PDF"
3. ✅ Le PDF se télécharge

### Test 2 : Limite IP
1. Convertir 2 fois
2. À la 3ème tentative → Modal "Limite atteinte"
3. ✅ Modal s'affiche

### Test 3 : Paiement Stripe (Mode Test)
1. Cliquer "Passer à la version illimitée"
2. Utiliser carte test : `4242 4242 4242 4242`
3. Date : n'importe quelle date future
4. CVC : n'importe quel 3 chiffres
5. ✅ Redirection vers /success

### Test 4 : Cookies
1. Recharger la page
2. ✅ Banner cookies apparaît en bas à droite
3. Cliquer "Accepter"
4. ✅ Banner disparaît (ne réapparaît plus)

### Test 5 : Mentions légales
1. Cliquer "Mentions légales" en footer
2. ✅ Page dédiée avec toutes les infos

## 🚢 Déployer sur Vercel (5 minutes)

### 1. Push sur GitHub
```bash
git add .
git commit -m "feat: backend supabase + stripe + mentions légales"
git push origin main
```

### 2. Connecter à Vercel
1. Aller sur https://vercel.com
2. "Import Project" → Sélectionner votre repo
3. Ajouter les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`
4. Cliquer "Deploy"

### 3. Configurer le domaine (si Hostinger)
1. Dans Hostinger → DNS
2. Ajouter un enregistrement A/CNAME pointant vers Vercel
3. Dans Vercel → Settings → Domains → Ajouter votre domaine

## 📊 Vérifier que tout fonctionne

### Dashboard Supabase
- Table Editor → `conversion_logs` → Devrait avoir des entrées
- Table Editor → `premium_users` → Vide au départ

### Dashboard Stripe
- Payments → Devrait voir les paiements test
- Customers → Devrait voir les clients test

## 🔧 En cas de problème

### Erreur "Supabase client not configured"
→ Vérifier que `.env` contient les bonnes variables

### Erreur "Stripe not loading"
→ Vérifier la clé Stripe (doit commencer par `pk_test_`)

### Modal ne s'affiche pas après 2 conversions
→ Vérifier que les tables Supabase sont bien créées
→ Check console navigateur pour les erreurs

### Paiement Stripe échoue
→ Utiliser carte test : 4242 4242 4242 4242
→ Mode test activé dans Stripe Dashboard

## 🎯 Prochaines étapes

### Optionnel - Webhook Stripe (Production)
Pour synchroniser automatiquement les paiements :
1. Créer `/api/webhook.ts` (voir `api-webhook-example.ts`)
2. Configurer webhook dans Stripe Dashboard
3. Ajouter `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`

### Optionnel - Email de confirmation
Intégrer un service email (SendGrid, Resend, etc.)

### Optionnel - Analytics
Ajouter Google Analytics ou Plausible

## 📞 Besoin d'aide ?

Email : contact@stillinov.com

## 🎉 Félicitations !

Votre site est maintenant :
- ✅ Fonctionnel avec limitation IP
- ✅ Monétisé avec Stripe  
- ✅ Conforme RGPD
- ✅ Prêt pour la production !
