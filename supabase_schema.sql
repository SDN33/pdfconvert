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

-- Création de la table pour les utilisateurs premium
CREATE TABLE premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par email et stripe_customer_id
CREATE INDEX idx_premium_users_email ON premium_users(email);
CREATE INDEX idx_premium_users_stripe_customer ON premium_users(stripe_customer_id);

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

-- Permettre l'insertion pour tous (pour les logs de conversion)
CREATE POLICY "Allow insert conversion logs" ON conversion_logs
  FOR INSERT WITH CHECK (true);

-- Permettre la lecture uniquement pour le service role
CREATE POLICY "Allow read conversion logs for service" ON conversion_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Permettre la lecture des premium users uniquement pour leur propre compte
CREATE POLICY "Allow read own premium user" ON premium_users
  FOR SELECT USING (auth.email() = email);

-- Permettre toutes les opérations pour le service role (backend)
CREATE POLICY "Allow all for service on premium_users" ON premium_users
  FOR ALL USING (auth.role() = 'service_role');
