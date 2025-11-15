# Système de gestion des conversions via DB

## Architecture complète

### 🎯 Principe : Tout est géré via la base de données

Le système de blocage IP et de comptage des conversions est entièrement géré par la fonction SQL `get_remaining_conversions()`. Plus aucune logique métier côté client.

## 📊 Tables utilisées

### 1. `conversion_logs`
```sql
- ip_address (TEXT) - Adresse IP de l'utilisateur
- user_agent (TEXT) - Navigateur
- converted_at (TIMESTAMP) - Date de conversion
```

**Rôle** : Enregistre TOUTES les conversions (anonymes, comptes gratuits, premium)
**Nettoyage** : Logs > 24h supprimés automatiquement

### 2. `premium_users`
```sql
- email (TEXT)
- is_lifetime (BOOLEAN) - True si paiement effectué
- subscription_status (TEXT) - 'free', 'active', 'cancelled'
```

**Rôle** : Identifier les utilisateurs premium (conversions illimitées)

### 3. `free_users`
```sql
- email (TEXT)
- ip_address (TEXT)
- conversions_count (INTEGER) - Stats totales
- last_conversion_at (TIMESTAMP)
```

**Rôle** : Statistiques sur les comptes gratuits (pas utilisé pour le blocage)

## 🔒 Logique de blocage (fonction SQL)

### `get_remaining_conversions(user_ip, user_email)`

```sql
RETURNS TABLE(
  allowed BOOLEAN,
  conversions_used INTEGER,
  conversions_limit INTEGER,
  is_premium BOOLEAN,
  reason TEXT
)
```

### Étapes de vérification :

#### 1️⃣ Utilisateur Premium ?
```sql
IF user_email IS NOT NULL THEN
  CHECK premium_users WHERE email = user_email AND is_lifetime = true
  → Si OUI : RETURN (allowed=true, limit=999999, is_premium=true)
```

#### 2️⃣ Compte gratuit ou anonyme ?
```sql
COUNT conversions dans conversion_logs WHERE:
  - ip_address = user_ip
  - converted_at > NOW() - 24 hours
```

#### 3️⃣ Limite atteinte ?
```sql
IF count >= 2:
  → RETURN (allowed=false, conversions_used=count, reason='limit_reached')
ELSE:
  → RETURN (allowed=true, conversions_used=count)
```

## 🎨 Flux de conversion

### Utilisateur anonyme (sans compte)
```
1. checkConversionAllowed(ip, null) → DB compte par IP
2. Si allowed=true → Conversion autorisée
3. logConversion(ip, userAgent, null) → Enregistre dans conversion_logs
4. Prochaine vérification → count mis à jour automatiquement
```

### Compte gratuit (avec email)
```
1. checkConversionAllowed(ip, email) → DB vérifie premium puis compte par IP
2. Si allowed=true → Conversion autorisée
3. logConversion(ip, userAgent, email) → Enregistre dans conversion_logs + free_users
4. Prochaine vérification → count mis à jour automatiquement
```

### Utilisateur premium
```
1. checkConversionAllowed(ip, email) → DB détecte is_lifetime=true
2. TOUJOURS allowed=true (illimité)
3. PAS d'enregistrement dans conversion_logs (inutile)
4. Aucune limite
```

## 📝 Enregistrement des conversions

### `logConversion(ip, userAgent, email?)`

**Anonyme** :
- Insert dans `conversion_logs` uniquement

**Compte gratuit** :
- Insert dans `conversion_logs` (pour blocage IP)
- Insert/Update dans `free_users` (pour stats)

**Premium** :
- Rien (pas besoin de tracker)

## 🔐 Sécurité anti-abus

### Stratégie : Blocage par IP (pas par email)

**Pourquoi ?**
- Empêche la création de multiples comptes gratuits sur la même IP
- Un utilisateur anonyme ne peut pas créer 10 comptes pour avoir 20 conversions
- Même avec un compte gratuit, la limite reste 2/jour par IP

**Exemple** :
```
IP: 192.168.1.1

Anonyme fait 2 conversions → Bloqué
Crée un compte gratuit → Toujours bloqué (même IP)
Crée 5 comptes différents → Toujours bloqué (même IP)

Solution : Payer 2,99€ → Illimité ✅
```

## 🔄 Nettoyage automatique

### Fonction : `cleanup_old_conversion_logs()`
```sql
DELETE FROM conversion_logs
WHERE converted_at < NOW() - INTERVAL '24 hours'
```

**Exécution** : Cron job / Trigger automatique (à configurer dans Supabase)

## 📈 Messages d'erreur personnalisés

```typescript
if (reason === 'free_account_limit_reached'):
  → "Vous avez atteint votre limite de 2 conversions gratuites par jour. 
     Passez à l'illimité pour seulement 2,99€ !"

if (reason === 'anonymous_limit_reached'):
  → "Limite de 2 conversions atteinte. 
     Créez un compte gratuit ou passez à l'illimité !"

if (reason === 'premium_unlimited'):
  → Aucun message (conversions illimitées)
```

## ✅ Avantages de ce système

1. **Centralisé** : Toute la logique dans la DB (une seule source de vérité)
2. **Sécurisé** : Impossible de contourner côté client (RPC Supabase)
3. **Performant** : Une seule requête SQL pour tout vérifier
4. **Anti-abus** : Blocage par IP (pas de multiples comptes)
5. **Flexible** : Facile de changer la limite (2 → 5 par ex.)

## 🔧 Configuration Supabase requise

### 1. Exécuter le SQL
```bash
# Copier le contenu de supabase_schema.sql
# L'exécuter dans Supabase SQL Editor
```

### 2. Activer RLS (Row Level Security)
- Déjà configuré dans le schéma
- Policies pour conversion_logs, premium_users, etc.

### 3. Configurer le nettoyage automatique
```sql
-- Option 1 : Cron extension (recommandé)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-conversions',
  '0 */6 * * *', -- Toutes les 6 heures
  'SELECT cleanup_old_conversion_logs();'
);

-- Option 2 : Trigger sur insertion
CREATE OR REPLACE FUNCTION auto_cleanup_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM conversion_logs
  WHERE converted_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_on_insert
  AFTER INSERT ON conversion_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_trigger();
```

## 📊 Monitoring

### Requêtes utiles

```sql
-- Conversions par IP dans les dernières 24h
SELECT ip_address, COUNT(*) as conversions
FROM conversion_logs
WHERE converted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY conversions DESC;

-- IPs bloquées (>= 2 conversions)
SELECT ip_address, COUNT(*) as conversions
FROM conversion_logs
WHERE converted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 2;

-- Stats comptes gratuits
SELECT 
  COUNT(*) as total_free_accounts,
  AVG(conversions_count) as avg_conversions,
  MAX(conversions_count) as max_conversions
FROM free_users;

-- Utilisateurs premium actifs
SELECT COUNT(*) 
FROM premium_users 
WHERE is_lifetime = true 
AND subscription_status = 'active';
```

## 🎯 Résumé

- ✅ Blocage par IP géré en DB (pas en client)
- ✅ Comptage automatique des conversions (24h glissantes)
- ✅ Anti-abus : même IP = même limite (avec ou sans compte)
- ✅ Premium bypass automatique (is_lifetime=true)
- ✅ Messages personnalisés selon le type d'utilisateur
- ✅ Nettoyage automatique des logs > 24h
- ✅ Une seule fonction SQL pour tout gérer
