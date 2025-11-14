# Guide de Migration - Système d'Authentification avec Mot de Passe

## 🎯 Objectif
Migrer du système d'authentification par email simple vers un système complet avec mots de passe et sessions persistantes.

## ⚠️ Changements Majeurs

### Avant (Ancien système)
- Authentification par email uniquement
- Stockage: `localStorage('premium_email')`
- Vérification directe dans la table `premium_users`
- Pas de sessions persistantes
- Tracking des conversions par IP uniquement

### Après (Nouveau système)
- Authentification par email + mot de passe (bcrypt)
- Stockage: `localStorage('session_token')`
- Sessions avec expiration (30 jours)
- Tracking des conversions par IP + email
- Table `free_users` pour les utilisateurs gratuits
- Fonction SQL centralisée `get_remaining_conversions()`

## 📋 Étapes de Migration

### 1. Exécuter le Nouveau Schéma SQL

Connectez-vous à votre projet Supabase:
1. Allez sur https://supabase.com
2. Ouvrez votre projet `oohbiwmyoylbwgalmcgn`
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Créez une nouvelle requête
5. Copiez-collez le contenu de `supabase_schema.sql`
6. Cliquez sur **Run** (Exécuter)

**Note**: Si les tables existent déjà, vous devrez d'abord les supprimer ou les modifier:

```sql
-- Pour réinitialiser complètement (⚠️ PERD TOUTES LES DONNÉES)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS free_users CASCADE;
DROP TABLE IF EXISTS conversion_logs CASCADE;
DROP TABLE IF EXISTS premium_users CASCADE;
DROP FUNCTION IF EXISTS get_remaining_conversions(TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_old_conversion_logs();

-- Puis exécutez supabase_schema.sql
```

**Alternative pour une migration sans perte de données**:

```sql
-- Ajouter les nouveaux champs à premium_users (si la table existe)
ALTER TABLE premium_users 
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Créer les nouvelles tables
-- (Copier les CREATE TABLE de supabase_schema.sql pour user_sessions et free_users)
```

### 2. Configurer un Mot de Passe Temporaire pour les Utilisateurs Existants

Si vous avez déjà des utilisateurs premium (créés via Stripe), ils n'ont pas de mot de passe. Options:

**Option A: Mot de passe temporaire**
```sql
-- Générer un hash bcrypt pour "ChangeMe2025"
-- (Utiliser bcrypt en ligne ou Node.js)
UPDATE premium_users 
SET password_hash = '$2b$10$YourBcryptHashHere' 
WHERE password_hash IS NULL;
```

**Option B: Email de réinitialisation** (recommandé)
- Les utilisateurs devront créer leur mot de passe à la première connexion
- Implémenter un flow "Créer votre mot de passe" après achat Stripe

### 3. Mettre à Jour le Webhook Stripe

Le webhook actuel (`api/webhook.ts`) crée des utilisateurs sans mot de passe. Modifiez-le pour:

```typescript
// Option 1: Générer un mot de passe aléatoire et l'envoyer par email
const tempPassword = generateRandomPassword();
const passwordHash = await bcrypt.hash(tempPassword, 10);

// Option 2: Créer sans mot de passe et envoyer un lien de configuration
const passwordHash = null; // Nécessite UPDATE du schéma pour permettre NULL
```

### 4. Tester le Nouveau Système

1. **Inscription**:
   - Cliquez sur "Créer un compte gratuit"
   - Remplissez email + mot de passe
   - Vérifiez que le compte est créé dans `premium_users`
   - Vérifiez que `session_token` est dans `localStorage`

2. **Connexion**:
   - Cliquez sur "Se connecter"
   - Entrez email + mot de passe
   - Vérifiez que la session est créée dans `user_sessions`

3. **Conversions**:
   - Testez une conversion gratuite
   - Vérifiez que le compteur s'affiche (X/2)
   - Vérifiez que les logs sont dans `conversion_logs`
   - Vérifiez que `free_users` est mis à jour si un email est fourni

4. **Premium**:
   - Connectez-vous avec un compte premium
   - Vérifiez que le compteur disparaît
   - Vérifiez que les conversions sont illimitées

### 5. Migration des Données Utilisateur (si nécessaire)

Si vous avez des utilisateurs qui utilisaient l'ancien système:

```sql
-- Identifier les utilisateurs qui ont besoin d'un mot de passe
SELECT email FROM premium_users WHERE password_hash IS NULL;

-- Option: Les notifier par email pour créer leur mot de passe
```

## 🔒 Sécurité

### Mots de passe
- ✅ Bcrypt avec SALT_ROUNDS = 10
- ✅ Jamais stockés en clair
- ✅ Validation côté client (min 8 caractères)

### Sessions
- ✅ Tokens UUID aléatoires
- ✅ Expiration automatique (30 jours)
- ✅ Stockage dans table `user_sessions`
- ✅ Suppression à la déconnexion

### RLS (Row Level Security)
- ✅ Activé sur toutes les tables
- ✅ Policies restrictives
- ✅ Service role pour le backend

## 📊 Structure des Tables

### `premium_users`
```sql
- id (UUID)
- email (TEXT, UNIQUE)
- password_hash (TEXT) -- NOUVEAU
- stripe_customer_id (TEXT)
- is_lifetime (BOOLEAN)
- last_login (TIMESTAMP) -- NOUVEAU
```

### `user_sessions` (NOUVEAU)
```sql
- id (UUID)
- user_id (UUID FK → premium_users)
- session_token (TEXT, UNIQUE)
- expires_at (TIMESTAMP)
```

### `free_users` (NOUVEAU)
```sql
- id (UUID)
- email (TEXT, UNIQUE)
- ip_address (TEXT)
- conversions_count (INTEGER)
- last_conversion_at (TIMESTAMP)
```

### `conversion_logs` (inchangé)
```sql
- id (UUID)
- ip_address (TEXT)
- converted_at (TIMESTAMP)
- user_agent (TEXT)
```

## 🧪 Tests Post-Migration

### Checklist
- [ ] Schéma SQL exécuté sans erreur
- [ ] Inscription fonctionne (email + password)
- [ ] Connexion fonctionne
- [ ] Session persiste après refresh
- [ ] Déconnexion supprime la session
- [ ] Conversions gratuites limitées à 2/24h
- [ ] Conversions premium illimitées
- [ ] Compteur affiche le bon nombre
- [ ] IP détectée correctement
- [ ] Webhook Stripe crée des utilisateurs
- [ ] Utilisateurs existants peuvent se connecter

## 🚀 Déploiement

### Variables d'environnement
Vérifiez que vous avez:
```env
VITE_SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé>
SUPABASE_SERVICE_ROLE_KEY=<clé_service> (pour le webhook)
STRIPE_SECRET_KEY=<clé_stripe>
STRIPE_WEBHOOK_SECRET=<webhook_secret>
```

### Commandes
```bash
# Installer les dépendances
npm install

# Vérifier les erreurs TypeScript
npm run build

# Déployer sur Vercel
vercel --prod
```

## 📝 Notes Importantes

1. **Mot de passe perdu**: Le système inclut `requestPasswordReset()` mais l'envoi d'email n'est pas encore implémenté. À faire:
   - Configurer un service d'email (SendGrid, Resend, etc.)
   - Implémenter l'envoi de lien de réinitialisation
   - Créer une page de réinitialisation

2. **Migration utilisateurs existants**: Les utilisateurs créés via Stripe avant cette migration n'ont pas de mot de passe. Ils devront:
   - Cliquer sur "Créer un compte" avec leur email
   - Ou recevoir un email pour configurer leur mot de passe

3. **Webhook Stripe**: Le webhook crée actuellement des utilisateurs **sans mot de passe**. Vous devez:
   - Soit envoyer un email de bienvenue avec lien de configuration
   - Soit générer un mot de passe temporaire et l'envoyer par email

4. **Conversions gratuites**: Le système track maintenant par IP **ET** email (si fourni). Un utilisateur peut s'inscrire pour suivre ses conversions même sans payer.

## 🐛 Dépannage

### Erreur "duplicate key value"
```
L'email existe déjà dans premium_users
→ L'utilisateur doit se connecter au lieu de s'inscrire
```

### Session invalide après refresh
```
Le token est expiré ou invalide
→ Vérifier que expires_at > NOW() dans user_sessions
→ Vérifier que le token est bien stocké dans localStorage
```

### Conversions illimitées ne fonctionnent pas
```
→ Vérifier que is_lifetime = true dans premium_users
→ Vérifier que la session est valide
→ Vérifier que isPremium = true dans l'état React
```

### Webhook Stripe échoue
```
→ Vérifier que password_hash accepte NULL ou générer un hash
→ Vérifier les logs dans Stripe Dashboard
→ Vérifier que SUPABASE_SERVICE_ROLE_KEY est défini
```

## 📞 Support

En cas de problème, vérifiez:
1. Les logs de Supabase (SQL Editor → Logs)
2. Les logs de Vercel (Dashboard → Functions → Logs)
3. Les logs de Stripe (Dashboard → Webhooks → Events)
4. La console du navigateur (F12)

---

**Date de migration**: [À COMPLÉTER]
**Version**: 2.0.0 (Système d'authentification avec mots de passe)
