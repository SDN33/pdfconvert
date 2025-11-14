# MarkdownEnPDF.com - Configuration Backend

## 🚀 Configuration Supabase

### 1. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé API anonyme

### 2. Exécuter le schéma SQL
1. Dans le dashboard Supabase, allez dans "SQL Editor"
2. Copiez le contenu de `supabase_schema.sql`
3. Exécutez le script pour créer les tables

### 3. Variables d'environnement
Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 💳 Configuration Stripe

### 1. Créer un compte Stripe
1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte
3. Activez le mode test

### 2. Créer le produit
Le produit existe déjà :
- **ID Produit**: `prod_TQMWGf7E3gBpEo`
- **ID Prix**: `price_1STVnY1EwbZGw1D0m4lKdc4H`
- **Prix**: 2,99€
- **Type**: Paiement unique (pas d'abonnement)

### 3. Récupérer les clés API
1. Dashboard Stripe → Developers → API keys
2. Notez la clé publique (commence par `pk_test_`)
3. Ajoutez-la dans `.env`

### 4. Webhook (optionnel pour production)
Pour gérer automatiquement les paiements :

```bash
stripe listen --forward-to localhost:5173/api/webhook
```

## 🌐 Déploiement

### Vercel
1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`

### Hostinger (domaine)
1. Configurez votre domaine markdownenpdf.com
2. Pointez les DNS vers Vercel

## 📊 Fonctionnalités

### Limitation IP
- 2 conversions gratuites par 24h par IP
- Les logs sont automatiquement nettoyés après 24h
- Les utilisateurs premium ne sont pas limités

### Paiement Stripe
- Paiement unique de 2,99€
- Accès illimité à vie
- Pas d'abonnement récurrent
- Redirection automatique après paiement

### Cookies
- Banner de consentement minimaliste
- Cookie stocké 1 an après acceptation
- Conforme RGPD

### Mentions légales
- Page dédiée `/mentions-legales`
- Contact: contact@stillinov.com
- Géré par Stéphane Dei-Negri

## 🔧 Développement

```bash
# Installer les dépendances
npm install

# Lancer en dev
npm run dev

# Build pour production
npm run build
```

## 📦 Dépendances ajoutées
- `@supabase/supabase-js` - Client Supabase
- `@stripe/stripe-js` - Client Stripe
- `js-cookie` - Gestion des cookies
- `react-router-dom` - Routing

## 🔐 Sécurité
- Les données de conversion sont anonymes (IP uniquement)
- Pas de stockage des fichiers Markdown
- Les paiements sont gérés par Stripe (PCI compliant)
- RLS activé sur Supabase

## 📝 Support
Email: contact@stillinov.com
