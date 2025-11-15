-- Script de test pour la base de données
-- À exécuter dans le SQL Editor de Supabase

-- ============================================
-- TEST 1: Vérifier la structure des tables
-- ============================================
SELECT 
  tablename,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('conversion_logs', 'premium_users', 'user_sessions', 'free_users')
ORDER BY tablename;

-- ============================================
-- TEST 2: Vérifier les fonctions
-- ============================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_remaining_conversions', 'cleanup_old_conversion_logs')
ORDER BY routine_name;

-- ============================================
-- TEST 3: Tester get_remaining_conversions pour utilisateur anonyme
-- ============================================
-- Devrait retourner: allowed=true, conversions_used=0, limit=2
SELECT * FROM get_remaining_conversions('192.168.1.100', NULL);

-- ============================================
-- TEST 4: Simuler des conversions et tester la limite
-- ============================================
-- Insérer 2 conversions pour une IP
INSERT INTO conversion_logs (ip_address, user_agent)
VALUES 
  ('192.168.1.200', 'Test Browser 1'),
  ('192.168.1.200', 'Test Browser 2');

-- Tester la limite (devrait retourner allowed=false)
SELECT * FROM get_remaining_conversions('192.168.1.200', NULL);

-- Nettoyer les tests
DELETE FROM conversion_logs WHERE ip_address = '192.168.1.200';

-- ============================================
-- TEST 5: Tester un utilisateur premium
-- ============================================
-- Créer un utilisateur premium de test
INSERT INTO premium_users (email, is_lifetime, subscription_status)
VALUES ('test_premium@example.com', true, 'active')
ON CONFLICT (email) DO NOTHING;

-- Tester (devrait retourner allowed=true, limit=999999, is_premium=true)
SELECT * FROM get_remaining_conversions('192.168.1.300', 'test_premium@example.com');

-- ============================================
-- TEST 6: Tester un compte gratuit
-- ============================================
-- Créer un compte gratuit de test
INSERT INTO premium_users (email, is_lifetime, subscription_status)
VALUES ('test_free@example.com', false, 'free')
ON CONFLICT (email) DO NOTHING;

-- Tester sans conversions (devrait être autorisé)
SELECT * FROM get_remaining_conversions('192.168.1.400', 'test_free@example.com');

-- Ajouter 2 conversions sur cette IP
INSERT INTO conversion_logs (ip_address, user_agent)
VALUES 
  ('192.168.1.400', 'Test Free 1'),
  ('192.168.1.400', 'Test Free 2');

-- Re-tester (devrait être bloqué car IP limite atteinte)
SELECT * FROM get_remaining_conversions('192.168.1.400', 'test_free@example.com');

-- Nettoyer
DELETE FROM conversion_logs WHERE ip_address = '192.168.1.400';
DELETE FROM premium_users WHERE email IN ('test_premium@example.com', 'test_free@example.com');

-- ============================================
-- TEST 7: Vérifier les indexes
-- ============================================
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversion_logs', 'premium_users', 'user_sessions', 'free_users')
ORDER BY tablename, indexname;

-- ============================================
-- TEST 8: Vérifier RLS (Row Level Security)
-- ============================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- TEST 9: Statistiques actuelles
-- ============================================
SELECT 
  'Total conversion logs (24h)' as metric,
  COUNT(*) as value
FROM conversion_logs
WHERE converted_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'Total premium users',
  COUNT(*)
FROM premium_users
WHERE is_lifetime = true
UNION ALL
SELECT 
  'Total free accounts',
  COUNT(*)
FROM premium_users
WHERE is_lifetime = false
UNION ALL
SELECT 
  'Active sessions',
  COUNT(*)
FROM user_sessions
WHERE expires_at > NOW();

-- ============================================
-- TEST 10: Top IPs avec le plus de conversions (24h)
-- ============================================
SELECT 
  ip_address,
  COUNT(*) as conversions,
  MIN(converted_at) as first_conversion,
  MAX(converted_at) as last_conversion
FROM conversion_logs
WHERE converted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY conversions DESC
LIMIT 10;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
/*
Si tout fonctionne correctement, vous devriez voir :

TEST 1: 4 tables avec leurs colonnes
TEST 2: 2 fonctions (get_remaining_conversions, cleanup_old_conversion_logs)
TEST 3: allowed=true pour nouvelle IP
TEST 4: allowed=false après 2 conversions
TEST 5: Premium users = illimité (999999)
TEST 6: Free users = bloqué par IP (même limite que anonyme)
TEST 7-8: Tous les indexes et policies en place
TEST 9: Stats actuelles
TEST 10: Top 10 des IPs

✅ Si tous les tests passent, la DB est correctement configurée !
*/
