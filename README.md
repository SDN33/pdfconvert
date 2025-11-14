# 🚀 MarkdownEnPDF.com - Convertisseur Markdown vers PDF

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SDN33/pdfconvert)

> Convertisseur professionnel de Markdown en PDF avec système de paiement intégré et gestion premium

## 📋 Vue d'ensemble

Application web moderne permettant de convertir des fichiers Markdown en PDF avec :
- ✅ **Conversion gratuite** : 2 conversions par jour (limité par IP)
- ✅ **Version Premium** : Accès illimité à vie pour 2,99€
- ✅ **Système de login** : Connexion avec email pour les utilisateurs premium
- ✅ **Paiement Stripe** : Intégration complète avec webhook automatisé
- ✅ **Backend Supabase** : Base de données PostgreSQL avec RLS
- ✅ **10 thèmes** : Personnalisation complète du rendu PDF
- ✅ **5 styles de bordures** : Simple, double, arrondi, décoratif, gradient

## 🎯 Fonctionnalités

### Pour tous les utilisateurs
- Éditeur Markdown avec aperçu en temps réel
- 16 options de mise en page (marges, polices, couleurs, etc.)
- Support complet Markdown (titres, listes, code, liens, citations, etc.)
- Détecteur IP automatique
- Compteur de conversions (2/jour)
- Conversion instantanée dans le navigateur (100% privé)

### Pour les utilisateurs Premium
- ♾️ Conversions illimitées
- 🎨 Tous les thèmes et styles débloqués
- ⚡ Pas de limitation IP
- 🔐 Connexion avec email
- 💾 Historique sauvegardé

## 🏗️ Architecture

```
Frontend (React + TypeScript + Vite)
    ↓
Backend (Supabase PostgreSQL)
    ├── conversion_logs (tracking IP)
    └── premium_users (utilisateurs payants)
    ↓
Paiement (Stripe)
    ├── Checkout (2,99€ one-time)
    └── Webhook (création auto utilisateur)
    ↓
Déploiement (Vercel)
    ├── SPA routing
    └── Serverless functions (/api/webhook)
```

## 🚀 Installation

### 1. Cloner le repo
```bash
git clone https://github.com/SDN33/pdfconvert.git
cd pdfconvert
npm install
```

### 2. Configuration Supabase
1. Créer un projet sur https://supabase.com
2. Exécuter `supabase_schema.sql` dans SQL Editor
3. Récupérer les clés API (Settings → API)

### 3. Configuration Stripe
1. Créer un compte sur https://stripe.com
2. Créer un produit "Conversion Illimitée" à 2,99€
3. Récupérer les clés API (Developers → API keys)

### 4. Variables d'environnement
Créer `.env` à la racine :
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_STRIPE_PRODUCT_ID=prod_...
VITE_STRIPE_PRICE_ID=price_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Lancer en local
```bash
npm run dev
```

## 📦 Déploiement

### Sur Vercel
```bash
git push origin main
```

Vercel détecte automatiquement :
- Build command : `npm run build`
- Output directory : `dist`
- Serverless functions : `/api`

Ajouter les variables d'environnement dans Vercel Dashboard.

### Webhook Stripe
1. Déployer sur Vercel
2. Configurer webhook : `https://votre-site.vercel.app/api/webhook`
3. Events : `checkout.session.completed`, `charge.refunded`
4. Copier le secret dans Vercel

📚 **Voir [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) pour le guide complet**

## 📁 Structure du projet

```
pdfconvert/
├── src/
│   ├── components/
│   │   ├── CookieBanner.tsx      # Bannière cookies RGPD
│   │   ├── LoginModal.tsx        # Modal de connexion premium
│   │   ├── PremiumBanner.tsx     # Bannière offre premium
│   │   └── UpgradeModal.tsx      # Modal upgrade (limite atteinte)
│   ├── lib/
│   │   ├── supabase.ts           # Client Supabase + logique IP
│   │   ├── stripe.ts             # Client Stripe + checkout
│   │   └── cookies.ts            # Gestion cookies
│   ├── pages/
│   │   ├── MentionsLegales.tsx   # Page légale
│   │   └── Success.tsx           # Page post-paiement
│   ├── App.tsx                   # Composant principal
│   └── main.tsx                  # Entry point + router
├── api/
│   └── webhook.ts                # Webhook Stripe (serverless)
├── public/
│   └── logo.png                  # Logo du site
├── supabase_schema.sql           # Schéma BDD
├── vercel.json                   # Config routing Vercel
├── .env                          # Variables d'environnement
└── WEBHOOK_SETUP.md              # Guide webhook
```

## 🔧 Technologies utilisées

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS
- **PDF** : jsPDF (génération côté client)
- **Markdown** : marked.js (parsing)
- **Backend** : Supabase (PostgreSQL + RLS)
- **Paiement** : Stripe (Checkout + Webhooks)
- **Déploiement** : Vercel (SPA + Serverless)
- **Routing** : React Router DOM

## 🧪 Tests

### Test local
```bash
npm run dev
```

### Test webhook
```bash
./test-webhook.sh
```

### Test Stripe CLI
```bash
stripe listen --forward-to http://localhost:3000/api/webhook
stripe trigger checkout.session.completed
```

## 📊 Base de données

### Table `conversion_logs`
```sql
- id (uuid)
- ip_address (text)
- converted_at (timestamp)
- user_agent (text)
- created_at (timestamp)
```
Nettoyage automatique après 24h (fonction SQL).

### Table `premium_users`
```sql
- id (uuid)
- email (text, unique)
- stripe_customer_id (text)
- subscription_status (text)
- is_lifetime (boolean)
- purchased_at (timestamp)
- expires_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🔐 Sécurité

- ✅ RLS (Row Level Security) activé sur Supabase
- ✅ Vérification de signature Stripe sur webhooks
- ✅ Clés secrètes jamais exposées au client
- ✅ Cookies RGPD avec consentement
- ✅ IP tracking pour limites (24h uniquement)
- ✅ HTTPS obligatoire (Vercel)

## 📈 Métriques

### KPIs à suivre
- Conversions gratuites par jour
- Taux de conversion (gratuit → premium)
- Nombre d'utilisateurs premium
- Revenu total
- Taux d'abandon (limite atteinte)

### Dans Supabase
```sql
-- Conversions des dernières 24h
SELECT COUNT(*) FROM conversion_logs 
WHERE converted_at > NOW() - INTERVAL '24 hours';

-- Utilisateurs premium actifs
SELECT COUNT(*) FROM premium_users 
WHERE is_lifetime = true;

-- Revenu total (2,99€ par utilisateur)
SELECT COUNT(*) * 2.99 as revenue 
FROM premium_users 
WHERE is_lifetime = true;
```

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Guide de démarrage rapide
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration Stripe & Supabase
- [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) - Configuration webhook Stripe
- [WEBHOOK_INTEGRATION.md](WEBHOOK_INTEGRATION.md) - Résumé intégration
- [FEATURES_PREMIUM.md](FEATURES_PREMIUM.md) - Fonctionnalités premium
- [TEST_BANNIERE.md](TEST_BANNIERE.md) - Tests de la bannière
- [SETUP.md](SETUP.md) - Setup complet
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Résumé technique

## 🐛 Troubleshooting

### Problème : Conversions non comptées
- Vérifier que l'IP est récupérée : Console → Network → api.ipify.org
- Vérifier les logs Supabase : Table Editor → conversion_logs

### Problème : Webhook ne fonctionne pas
- Tester l'endpoint : `curl -X POST https://votre-site.vercel.app/api/webhook`
- Vérifier les logs Vercel : Functions → api/webhook
- Vérifier le secret dans Vercel et Stripe Dashboard

### Problème : Utilisateur non créé après paiement
- Vérifier les événements Stripe : Dashboard → Webhooks → Votre endpoint
- Vérifier la clé Service Role : Supabase → Settings → API
- Vérifier les policies RLS sur `premium_users`

## 🤝 Contribution

Ce projet est géré par **Stéphane Dei-Negri** / **StillInov**.

Contact : contact@stillinov.com

## 📄 Licence

Propriétaire : Stéphane Dei-Negri

Domaine : markdownenpdf.com (hébergé sur Hostinger)

## 🎉 Roadmap

### Court terme
- [x] Système de paiement Stripe
- [x] Webhook automatisé
- [x] Login utilisateur premium
- [x] Bannière élégante
- [ ] Email de confirmation (Resend)
- [ ] Analytics (Plausible)

### Moyen terme
- [ ] Dashboard utilisateur (historique)
- [ ] Thèmes exclusifs premium
- [ ] Export batch (plusieurs MD → PDF)
- [ ] API REST publique

### Long terme
- [ ] Plans mensuels
- [ ] Intégration GitHub/VS Code
- [ ] App mobile (React Native)
- [ ] Mode collaboratif

---

Made with ❤️ by [StillInov](https://stillinov.com)

🔗 [markdownenpdf.com](https://markdownenpdf.com)
