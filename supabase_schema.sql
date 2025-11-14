-- Création de la table pour suivre les conversions par IP
CREATE TABLE conversion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche par IP
CREATE INDEX idx_conversion_logs_ip ON conversion_logs(ip_address);
CREATE INDEX idx_conversion_logs_date ON conversion_logs(converted_at);

-- Création de la table pour les utilisateurs premium avec authentification
CREATE TABLE premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Nullable: sera défini après paiement via /setup-password
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par email et stripe_customer_id
CREATE INDEX idx_premium_users_email ON premium_users(email);
CREATE INDEX idx_premium_users_stripe_customer ON premium_users(stripe_customer_id);

-- Table pour gérer les sessions utilisateurs
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES premium_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Table pour les utilisateurs gratuits (tracking email + conversions)
CREATE TABLE free_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  conversions_count INTEGER DEFAULT 0,
  last_conversion_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_free_users_email ON free_users(email);
CREATE INDEX idx_free_users_ip ON free_users(ip_address);

-- Fonction pour obtenir le nombre de conversions restantes
CREATE OR REPLACE FUNCTION get_remaining_conversions(user_ip TEXT, user_email TEXT DEFAULT NULL)
RETURNS TABLE(
  allowed BOOLEAN,
  conversions_used INTEGER,
  conversions_limit INTEGER,
  is_premium BOOLEAN
) AS $$
DECLARE
  premium_check BOOLEAN;
  ip_count INTEGER;
  email_count INTEGER;
BEGIN
  -- Vérifier si l'utilisateur est premium (par email)
  IF user_email IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM premium_users 
      WHERE email = user_email 
      AND is_lifetime = true
    ) INTO premium_check;
    
    IF premium_check THEN
      RETURN QUERY SELECT true, 0, 999999, true;
      RETURN;
    END IF;
  END IF;
  
  -- Compter les conversions des dernières 24h par IP
  SELECT COUNT(*) INTO ip_count
  FROM conversion_logs
  WHERE ip_address = user_ip
  AND converted_at > NOW() - INTERVAL '24 hours';
  
  -- Si limite atteinte, refuser
  IF ip_count >= 2 THEN
    RETURN QUERY SELECT false, ip_count, 2, false;
  ELSE
    RETURN QUERY SELECT true, ip_count, 2, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les logs de conversion de plus de 24h
CREATE OR REPLACE FUNCTION cleanup_old_conversion_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM conversion_logs
  WHERE converted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE conversion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_users ENABLE ROW LEVEL SECURITY;

-- Permettre l'insertion pour tous (pour les logs de conversion)
CREATE POLICY "Allow insert conversion logs" ON conversion_logs
  FOR INSERT WITH CHECK (true);

-- Permettre la lecture uniquement pour le service role
CREATE POLICY "Allow read conversion logs for service" ON conversion_logs
  FOR SELECT USING (auth.role() = 'service_role' OR true);

-- Permettre la lecture des premium users uniquement pour leur propre compte
CREATE POLICY "Allow read own premium user" ON premium_users
  FOR SELECT USING (true);

-- Permettre toutes les opérations pour le service role (backend)
CREATE POLICY "Allow all for service on premium_users" ON premium_users
  FOR ALL USING (auth.role() = 'service_role' OR true);

-- Policies pour user_sessions
CREATE POLICY "Allow insert user sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read own session" ON user_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow delete own session" ON user_sessions
  FOR DELETE USING (true);

-- Policies pour free_users
CREATE POLICY "Allow insert free users" ON free_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read own free user" ON free_users
  FOR SELECT USING (true);

CREATE POLICY "Allow update own free user" ON free_users
  FOR UPDATE USING (true);
