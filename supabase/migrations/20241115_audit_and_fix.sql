-- Migration pour auditer et corriger la structure de la DB
-- Date: 2024-11-15

-- ============================================
-- PARTIE 1: CRÉATION/CORRECTION DES TABLES
-- ============================================

-- Table conversion_logs (tracking des conversions par IP)
CREATE TABLE IF NOT EXISTS conversion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversion_logs_ip ON conversion_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_conversion_logs_date ON conversion_logs(converted_at);

-- Table premium_users (utilisateurs avec compte)
CREATE TABLE IF NOT EXISTS premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULLABLE: pour OAuth ou paiement avant création
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free', -- 'free', 'active', 'cancelled'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT false, -- false par défaut, true après paiement Stripe
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_premium_users_email ON premium_users(email);
CREATE INDEX IF NOT EXISTS idx_premium_users_stripe_customer ON premium_users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_premium_users_status ON premium_users(subscription_status, is_lifetime);

-- Table user_sessions (gestion des sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES premium_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Table free_users (statistiques des comptes gratuits)
CREATE TABLE IF NOT EXISTS free_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  conversions_count INTEGER DEFAULT 0,
  last_conversion_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_users_email ON free_users(email);
CREATE INDEX IF NOT EXISTS idx_free_users_ip ON free_users(ip_address);

-- ============================================
-- PARTIE 2: FONCTION PRINCIPALE get_remaining_conversions
-- ============================================

CREATE OR REPLACE FUNCTION get_remaining_conversions(user_ip TEXT, user_email TEXT DEFAULT NULL)
RETURNS TABLE(
  allowed BOOLEAN,
  conversions_used INTEGER,
  conversions_limit INTEGER,
  is_premium BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  premium_check BOOLEAN := false;
  ip_count INTEGER := 0;
  final_count INTEGER := 0;
BEGIN
  -- 1. Vérifier si l'utilisateur est PREMIUM
  IF user_email IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM premium_users 
      WHERE email = user_email 
      AND is_lifetime = true
      AND subscription_status = 'active'
    ) INTO premium_check;
    
    -- Si premium → conversions illimitées
    IF premium_check THEN
      RETURN QUERY SELECT true, 0, 999999, true, 'premium_unlimited'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- 2. Compter les conversions par IP dans les dernières 24h
  SELECT COUNT(*) INTO ip_count
  FROM conversion_logs
  WHERE ip_address = user_ip
  AND converted_at > NOW() - INTERVAL '24 hours';
  
  final_count := ip_count;
  
  -- 3. Vérifier la limite (2 conversions/24h)
  IF final_count >= 2 THEN
    RETURN QUERY SELECT 
      false, 
      final_count, 
      2, 
      false, 
      CASE 
        WHEN user_email IS NOT NULL THEN 'free_account_limit_reached'
        ELSE 'anonymous_limit_reached'
      END::TEXT;
  ELSE
    RETURN QUERY SELECT 
      true, 
      final_count, 
      2, 
      false,
      CASE 
        WHEN user_email IS NOT NULL THEN 'free_account_allowed'
        ELSE 'anonymous_allowed'
      END::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTIE 3: FONCTION DE NETTOYAGE
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_conversion_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM conversion_logs
  WHERE converted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTIE 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE conversion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow insert conversion logs" ON conversion_logs;
DROP POLICY IF EXISTS "Allow read conversion logs for service" ON conversion_logs;
DROP POLICY IF EXISTS "Allow read own premium user" ON premium_users;
DROP POLICY IF EXISTS "Allow all for service on premium_users" ON premium_users;
DROP POLICY IF EXISTS "Allow insert user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow read own session" ON user_sessions;
DROP POLICY IF EXISTS "Allow delete own session" ON user_sessions;
DROP POLICY IF EXISTS "Allow insert free users" ON free_users;
DROP POLICY IF EXISTS "Allow read own free user" ON free_users;
DROP POLICY IF EXISTS "Allow update own free user" ON free_users;

-- Policies pour conversion_logs
CREATE POLICY "Allow insert conversion logs" ON conversion_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read conversion logs" ON conversion_logs
  FOR SELECT USING (true);

-- Policies pour premium_users (lecture/insertion pour tous, via RPC sécurisé)
CREATE POLICY "Allow read premium users" ON premium_users
  FOR SELECT USING (true);

CREATE POLICY "Allow insert premium users" ON premium_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update premium users" ON premium_users
  FOR UPDATE USING (true);

-- Policies pour user_sessions
CREATE POLICY "Allow insert user sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read user sessions" ON user_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow delete user sessions" ON user_sessions
  FOR DELETE USING (true);

-- Policies pour free_users
CREATE POLICY "Allow insert free users" ON free_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read free users" ON free_users
  FOR SELECT USING (true);

CREATE POLICY "Allow update free users" ON free_users
  FOR UPDATE USING (true);

-- ============================================
-- PARTIE 5: CORRECTION DES DONNÉES EXISTANTES
-- ============================================

-- S'assurer que tous les utilisateurs gratuits ont subscription_status = 'free'
UPDATE premium_users 
SET subscription_status = 'free' 
WHERE is_lifetime = false 
AND subscription_status != 'free';

-- S'assurer que tous les utilisateurs premium ont subscription_status = 'active'
UPDATE premium_users 
SET subscription_status = 'active' 
WHERE is_lifetime = true 
AND subscription_status != 'active';

-- Nettoyer les logs de conversion de plus de 24h (pour démarrer propre)
DELETE FROM conversion_logs
WHERE converted_at < NOW() - INTERVAL '24 hours';

-- ============================================
-- PARTIE 6: TRIGGER POUR AUTO-CLEANUP
-- ============================================

-- Fonction trigger pour nettoyer automatiquement
CREATE OR REPLACE FUNCTION auto_cleanup_old_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les logs de plus de 25h (marge de sécurité)
  DELETE FROM conversion_logs
  WHERE converted_at < NOW() - INTERVAL '25 hours';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS cleanup_logs_on_insert ON conversion_logs;

-- Créer le trigger (s'exécute après chaque batch d'insertions)
CREATE TRIGGER cleanup_logs_on_insert
  AFTER INSERT ON conversion_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_old_logs();

-- ============================================
-- PARTIE 7: FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir les stats de conversion par IP
CREATE OR REPLACE FUNCTION get_conversion_stats_by_ip(check_ip TEXT, hours_ago INTEGER DEFAULT 24)
RETURNS TABLE(
  ip_address TEXT,
  conversions_count BIGINT,
  first_conversion TIMESTAMP WITH TIME ZONE,
  last_conversion TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.ip_address,
    COUNT(*) as conversions_count,
    MIN(cl.converted_at) as first_conversion,
    MAX(cl.converted_at) as last_conversion
  FROM conversion_logs cl
  WHERE cl.ip_address = check_ip
  AND cl.converted_at > NOW() - (hours_ago || ' hours')::INTERVAL
  GROUP BY cl.ip_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT FINAL
-- ============================================

-- Vue pour auditer la structure
CREATE OR REPLACE VIEW audit_database_structure AS
SELECT 
  'Tables' as category,
  tablename as name,
  'Table' as type
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('conversion_logs', 'premium_users', 'user_sessions', 'free_users')
UNION ALL
SELECT 
  'Functions' as category,
  routine_name as name,
  'Function' as type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_remaining_conversions', 'cleanup_old_conversion_logs', 'auto_cleanup_old_logs', 'get_conversion_stats_by_ip')
UNION ALL
SELECT 
  'Indexes' as category,
  indexname as name,
  'Index' as type
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversion_logs', 'premium_users', 'user_sessions', 'free_users')
ORDER BY category, name;

-- Afficher le résultat de l'audit
SELECT * FROM audit_database_structure;
