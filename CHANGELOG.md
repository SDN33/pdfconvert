# 🔐 Système d'Authentification & Gestion des Conversions - v2.0

## ✨ Améliorations Réalisées

### 1. **Authentification Sécurisée avec Mot de Passe**

#### Avant (v1.0)
- ❌ Authentification par email uniquement
- ❌ Pas de mot de passe
- ❌ Sessions non persistantes
- ❌ Sécurité limitée

#### Après (v2.0)
- ✅ **Email + Mot de passe** (bcrypt avec SALT_ROUNDS = 10)
- ✅ **Sessions persistantes** (30 jours)
- ✅ **Tokens sécurisés** (UUID uniques)
- ✅ **Gestion des sessions** dans Supabase

### 2. **Gestion Centralisée des Conversions**

#### Avant
```typescript
// Logique dispersée dans App.tsx
const { allowed } = await canConvert(ipAddress);
```

#### Après
```typescript
// Fonction SQL centralisée
const result = await checkConversionAllowed(ipAddress, email);
// Returns: { allowed, conversionsUsed, conversionsLimit, isPremium }
```

**Avantages**:
- 🎯 Logique centralisée dans la base de données
- 📊 Tracking par IP **ET** email
- 🔄 Cohérence des données garantie
- 🚀 Performance optimisée (une seule requête)

### 3. **Table `free_users` pour le Tracking**

Nouvelle table pour suivre les utilisateurs gratuits:
```sql
CREATE TABLE free_users (
  id UUID,
  email TEXT UNIQUE,
  ip_address TEXT,
  conversions_count INTEGER,
  last_conversion_at TIMESTAMP
);
```

**Utilité**:
- Permet aux utilisateurs gratuits de créer un compte
- Track les conversions même sans paiement
- Facilite la migration vers premium
- Analyse des utilisateurs actifs

### 4. **Nouveaux Composants React**

#### `RegisterModal.tsx` (Nouveau)
- Inscription avec email + mot de passe
- Validation côté client (min 8 caractères)
- Confirmation du mot de passe
- Création automatique de session
- Design cohérent avec le reste du site

#### `LoginModal.tsx` (Amélioré)
- Ajout du champ mot de passe
- Utilisation de `loginPremium()` au lieu de vérification simple
- Gestion des sessions
- Messages d'erreur explicites

#### `App.tsx` (Refactorisé)
- Utilisation de `verifySession()` au lieu de `isPremiumUser()`
- Intégration de `checkConversionAllowed()`
- Gestion du modal d'inscription
- Bouton "Créer un compte gratuit"

### 5. **Nouvelle Structure de Base de Données**

```
premium_users (Modifié)
├── password_hash (NOUVEAU)
├── last_login (NOUVEAU)
└── ... (champs existants)

user_sessions (NOUVEAU)
├── id
├── user_id (FK → premium_users)
├── session_token (UNIQUE)
└── expires_at

free_users (NOUVEAU)
├── id
├── email (UNIQUE)
├── ip_address
├── conversions_count
└── last_conversion_at

conversion_logs (Inchangé)
├── id
├── ip_address
├── converted_at
└── user_agent
```

### 6. **Fonction SQL Centralisée**

```sql
CREATE FUNCTION get_remaining_conversions(user_ip TEXT, user_email TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  conversions_used INTEGER,
  conversions_limit INTEGER,
  is_premium BOOLEAN
)
```

**Logique**:
1. Vérifie si l'utilisateur est premium (par email)
2. Si premium → conversions illimitées
3. Sinon → compte les conversions des 24h par IP
4. Retourne l'état complet

### 7. **Sécurité Renforcée**

#### Mots de passe
- ✅ Bcrypt avec salt (10 rounds)
- ✅ Jamais stockés en clair
- ✅ Validation minimale (8 caractères)
- ✅ Comparaison sécurisée

#### Sessions
- ✅ Tokens UUID aléatoires
- ✅ Expiration automatique (30 jours)
- ✅ Stockage dans base de données
- ✅ Suppression à la déconnexion

#### RLS (Row Level Security)
- ✅ Activé sur toutes les tables
- ✅ Policies pour `user_sessions`
- ✅ Policies pour `free_users`
- ✅ Service role pour le backend

## 📂 Fichiers Modifiés

### Nouveaux fichiers
- ✨ `src/components/RegisterModal.tsx` - Modal d'inscription
- ✨ `src/lib/auth.ts` - Module d'authentification complet
- ✨ `MIGRATION_GUIDE.md` - Guide de migration détaillé
- ✨ `CHANGELOG.md` - Ce fichier

### Fichiers modifiés
- 🔧 `src/App.tsx` - Intégration du nouveau système
- 🔧 `src/components/LoginModal.tsx` - Ajout du mot de passe
- 🔧 `src/lib/supabase.ts` - Fonction centralisée
- 🔧 `supabase_schema.sql` - Nouvelles tables et fonction

### Dépendances ajoutées
```json
{
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.2"
}
```

## 🎯 Fonctionnalités Disponibles

### Pour les Utilisateurs Gratuits
1. **Conversions limitées**: 2 par 24h (tracking par IP)
2. **Création de compte**: Email + mot de passe pour suivre les conversions
3. **Persistance**: Les sessions durent 30 jours
4. **Bannière premium**: Affiche le compteur de conversions restantes

### Pour les Utilisateurs Premium
1. **Conversions illimitées**: Pas de limite
2. **Authentification**: Email + mot de passe sécurisés
3. **Session persistante**: Reste connecté pendant 30 jours
4. **Bannière verte**: Affiche "Accès illimité"

## 🔄 Flux d'Utilisation

### Inscription (Nouveau Compte)
```
1. Clic sur "Créer un compte gratuit"
2. Remplir email + mot de passe (min 8 caractères)
3. Confirmation du mot de passe
4. → Création dans premium_users (is_lifetime = false)
5. → Création automatique de session (30 jours)
6. → Stockage du token dans localStorage
7. → Redirection vers l'éditeur
```

### Connexion (Compte Existant)
```
1. Clic sur "Se connecter"
2. Email + mot de passe
3. → Vérification du hash bcrypt
4. → Création de session
5. → Stockage du token
6. → Connexion réussie
```

### Conversion (Utilisateur Gratuit)
```
1. Écriture du Markdown
2. Clic sur "Télécharger en PDF"
3. → Appel à checkConversionAllowed(ip, email)
4. → Fonction SQL vérifie les conversions des 24h
5. Si < 2 conversions:
   - Conversion autorisée
   - Log dans conversion_logs
   - Update dans free_users (si email)
   - Mise à jour du compteur
6. Si >= 2 conversions:
   - Modal d'upgrade affiché
   - Message explicatif
```

### Conversion (Utilisateur Premium)
```
1. Écriture du Markdown
2. Clic sur "Télécharger en PDF"
3. → Vérification session + is_lifetime
4. → Conversion immédiate (pas de log)
5. → Pas de compteur affiché
```

## 🧪 Tests à Effectuer

### Checklist
- [ ] **Inscription**: Créer un compte avec email + mot de passe
- [ ] **Connexion**: Se connecter avec le compte créé
- [ ] **Session**: Refresh la page, vérifier que l'utilisateur reste connecté
- [ ] **Déconnexion**: Cliquer sur "Se déconnecter", vérifier que la session est supprimée
- [ ] **Conversion gratuite #1**: Faire une première conversion (compteur: 1/2)
- [ ] **Conversion gratuite #2**: Faire une deuxième conversion (compteur: 2/2)
- [ ] **Conversion gratuite #3**: Tenter une troisième (modal upgrade affiché)
- [ ] **Achat premium**: Acheter via Stripe (2,99€)
- [ ] **Webhook**: Vérifier que `is_lifetime` est mis à `true`
- [ ] **Connexion premium**: Se connecter avec le compte premium
- [ ] **Conversion premium**: Vérifier que les conversions sont illimitées
- [ ] **Compteur premium**: Vérifier que le compteur n'est pas affiché
- [ ] **IP détection**: Vérifier que l'IP est correctement affichée

## 🚀 Déploiement

### 1. Mettre à jour Supabase
```bash
# Aller dans Supabase Dashboard > SQL Editor
# Copier-coller le contenu de supabase_schema.sql
# Exécuter le script
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Vérifier la compilation
```bash
npm run build
```

### 4. Déployer sur Vercel
```bash
vercel --prod
```

### 5. Tester en production
- Créer un compte
- Se connecter
- Faire des conversions
- Acheter premium
- Vérifier les webhooks Stripe

## 📊 Métriques & Analytics

### Nouvelles Données Disponibles

#### Table `free_users`
```sql
-- Nombre total d'utilisateurs gratuits
SELECT COUNT(*) FROM free_users;

-- Utilisateurs actifs (dernière conversion < 7 jours)
SELECT COUNT(*) FROM free_users 
WHERE last_conversion_at > NOW() - INTERVAL '7 days';

-- Top utilisateurs (plus de conversions)
SELECT email, conversions_count 
FROM free_users 
ORDER BY conversions_count DESC 
LIMIT 10;
```

#### Table `user_sessions`
```sql
-- Sessions actives
SELECT COUNT(*) FROM user_sessions 
WHERE expires_at > NOW();

-- Sessions expirées à nettoyer
SELECT COUNT(*) FROM user_sessions 
WHERE expires_at < NOW();
```

#### Table `premium_users`
```sql
-- Utilisateurs premium actifs
SELECT COUNT(*) FROM premium_users 
WHERE is_lifetime = true;

-- Dernières connexions
SELECT email, last_login 
FROM premium_users 
WHERE last_login > NOW() - INTERVAL '7 days'
ORDER BY last_login DESC;
```

## 🔮 Améliorations Futures

### Court terme
- [ ] **Reset de mot de passe**: Implémenter l'envoi d'email
- [ ] **Vérification email**: Envoyer un lien de confirmation
- [ ] **2FA**: Authentification à deux facteurs
- [ ] **Sessions multiples**: Permettre plusieurs appareils

### Moyen terme
- [ ] **Statistiques utilisateur**: Dashboard personnel
- [ ] **Historique conversions**: Liste des PDF générés
- [ ] **Templates sauvegardés**: Sauvegarder les paramètres
- [ ] **Partage de documents**: URLs temporaires

### Long terme
- [ ] **API publique**: Accès programmatique
- [ ] **Webhooks utilisateur**: Notifications personnalisées
- [ ] **Intégrations**: Zapier, Make, etc.
- [ ] **Application mobile**: iOS + Android

## 🐛 Problèmes Connus

### 1. Webhook Stripe
**Problème**: Les utilisateurs créés via Stripe n'ont pas de mot de passe.

**Solutions**:
- Option A: Envoyer un email "Créez votre mot de passe"
- Option B: Générer un mot de passe temporaire et l'envoyer
- Option C: Permettre connexion sans mot de passe (via lien email)

### 2. Migration des Utilisateurs Existants
**Problème**: Les utilisateurs existants (avant v2.0) n'ont pas de `password_hash`.

**Solution**: 
```sql
-- Identifier les utilisateurs sans mot de passe
SELECT email FROM premium_users WHERE password_hash IS NULL;

-- Leur envoyer un email pour créer leur mot de passe
```

### 3. Nettoyage des Sessions Expirées
**Problème**: Les sessions expirées s'accumulent.

**Solution**: Créer une tâche cron pour nettoyer:
```sql
DELETE FROM user_sessions WHERE expires_at < NOW();
```

## 📞 Support & Contact

- **Email**: contact@stillinov.com
- **Website**: https://markdownenpdf.com
- **GitHub**: [Votre repo si applicable]

## 📄 Licence

© 2025 MarkdownEnPDF.com - Stéphane Dei-Negri

---

**Version**: 2.0.0  
**Date**: 2025-01-XX  
**Auteur**: GitHub Copilot + Stéphane Dei-Negri
