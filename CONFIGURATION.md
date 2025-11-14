# ✅ Configuration terminée !

## 🔑 Identifiants mis à jour

### Supabase
- **URL** : `https://oohbiwmyoylbwgalmcgn.supabase.co`
- **Project ID** : `oohbiwmyoylbwgalmcgn`
- ✅ Clé publique configurée dans `.env`

### Stripe (LIVE MODE - PRODUCTION ⚠️)
- **Produit** : `prod_TQMlKmPKE71FwQ`
- **Prix** : `price_1STW1z1hBWMOXJEVjsamoo6b` (2,99€)
- **Description** : "CONVERSION ILLIMITÉ A VIE !"
- ✅ Clé publique configurée dans `.env`
- ✅ Clé secrète configurée (pour webhook backend)

## ⚠️ IMPORTANT - Mode LIVE Activé

Vous utilisez maintenant les clés **LIVE** de Stripe, ce qui signifie :
- ✅ Les paiements sont **RÉELS**
- ✅ Les cartes bancaires seront **DÉBITÉES**
- ✅ Vous recevrez l'argent sur votre compte Stripe

### Pour tester en mode TEST :
1. Aller sur https://dashboard.stripe.com
2. Basculer en mode "Test" (en haut à droite)
3. Récupérer les clés de test (`pk_test_...` et `sk_test_...`)
4. Remplacer temporairement dans `.env`

## 📋 Prochaines étapes

### 1. Créer les tables Supabase (2 min)
```bash
# Ouvrir le SQL Editor dans Supabase Dashboard
```
1. Aller sur https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn
2. Cliquer sur "SQL Editor" dans le menu gauche
3. Copier tout le contenu de `supabase_schema.sql`
4. Coller dans l'éditeur SQL
5. Cliquer "Run" (ou Ctrl+Enter)

### 2. Tester localement
```bash
npm run dev
```
Ouvrir http://localhost:5173

### 3. Tester les fonctionnalités

#### Test 1 : Conversion normale
1. Coller du Markdown
2. Cliquer "Télécharger en PDF"
3. ✅ Le PDF se télécharge
4. ✅ Dans Supabase > Table Editor > conversion_logs : une ligne apparaît

#### Test 2 : Limite IP (2 conversions max)
1. Faire 2 conversions
2. À la 3ème tentative → Modal "Limite atteinte" s'affiche
3. ✅ Modal propose de passer à la version illimitée

#### Test 3 : Paiement RÉEL ⚠️
**ATTENTION** : Vous êtes en mode LIVE, la carte sera débitée !

Si vous voulez tester sans débiter :
- Basculer en mode TEST dans Stripe
- Utiliser carte test : `4242 4242 4242 4242`

### 4. Déployer sur Vercel

```bash
# Push sur GitHub
git add .env.example .env.local.template src/lib/stripe.ts
git commit -m "feat: configuration Stripe et Supabase"
git push origin main
```

**Dans Vercel Dashboard :**
1. Importer votre repo
2. Ajouter les variables d'environnement :
   - `VITE_SUPABASE_URL` = `https://oohbiwmyoylbwgalmcgn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (votre clé publique Supabase)
   - `VITE_STRIPE_PUBLIC_KEY` = `pk_live_51STVfg1hBWMOXJEVnGYG3zhx6JOvYqT4nu0nZ5lUQCKeECTTiPLmd0folKykk2k6k2QjokE5HzRwPTKXc6Q78Frj00JuES5gj5`
   - `VITE_STRIPE_PRODUCT_ID` = `prod_TQMlKmPKE71FwQ`
   - `VITE_STRIPE_PRICE_ID` = `price_1STW1z1hBWMOXJEVjsamoo6b`

3. Déployer

## 📊 Monitoring

### Supabase Dashboard
https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn

- **Table Editor** → `conversion_logs` : Voir les conversions
- **Table Editor** → `premium_users` : Voir les utilisateurs premium
- **SQL Editor** : Exécuter des requêtes

### Stripe Dashboard  
https://dashboard.stripe.com

- **Paiements** : Voir les transactions
- **Clients** : Voir les clients
- **Produits** : Gérer "CONVERSION ILLIMITÉ A VIE !"

## 🔐 Sécurité

✅ Le fichier `.env` est dans `.gitignore` - vos clés ne seront **PAS** poussées sur GitHub

**Ne JAMAIS partager :**
- `sk_live_...` (clé secrète Stripe)
- Clé Supabase Service Role

**Partageables :**
- `pk_live_...` (clé publique Stripe)
- Clé Supabase Anon (déjà dans le code frontend)

## 📞 Support

Email : contact@stillinov.com

---

✅ **Configuration terminée ! Votre site est prêt pour la production.**
