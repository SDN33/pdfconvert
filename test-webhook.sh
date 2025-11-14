#!/bin/bash

# Script de test du webhook Stripe
# Usage: ./test-webhook.sh

echo "🧪 Test du Webhook Stripe"
echo "=========================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="http://localhost:3000/api/webhook"
PRODUCTION_URL="https://markdownenpdf.vercel.app/api/webhook"

echo "📍 URLs disponibles :"
echo "  - Local: $WEBHOOK_URL"
echo "  - Production: $PRODUCTION_URL"
echo ""

# Test 1 : Vérifier que l'endpoint existe
echo "Test 1: Vérifier l'endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$WEBHOOK_URL")

if [ "$response" -eq 405 ]; then
  echo -e "${GREEN}✅ Endpoint accessible (405 Method Not Allowed - normal)${NC}"
else
  echo -e "${RED}❌ Endpoint non accessible (code: $response)${NC}"
  exit 1
fi
echo ""

# Test 2 : Test POST sans signature (devrait échouer)
echo "Test 2: POST sans signature Stripe..."
response=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}')

if [[ $response == *"Webhook Error"* ]]; then
  echo -e "${GREEN}✅ Rejet correct des requêtes non signées${NC}"
else
  echo -e "${RED}❌ Devrait rejeter les requêtes non signées${NC}"
fi
echo ""

# Test 3 : Instructions pour test complet
echo "Test 3: Test avec Stripe CLI"
echo -e "${YELLOW}Pour tester avec un vrai événement Stripe :${NC}"
echo ""
echo "1. Installer Stripe CLI :"
echo "   brew install stripe/stripe-brew/stripe"
echo ""
echo "2. Se connecter :"
echo "   stripe login"
echo ""
echo "3. Écouter les événements (local) :"
echo "   stripe listen --forward-to $WEBHOOK_URL"
echo ""
echo "4. Dans un autre terminal, déclencher un événement :"
echo "   stripe trigger checkout.session.completed"
echo ""
echo "5. Vérifier dans Supabase :"
echo "   SELECT * FROM premium_users ORDER BY created_at DESC LIMIT 1;"
echo ""

# Test 4 : Vérifier les variables d'environnement
echo "Test 4: Variables d'environnement..."
missing_vars=0

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo -e "${RED}❌ STRIPE_SECRET_KEY manquante${NC}"
  missing_vars=$((missing_vars + 1))
else
  echo -e "${GREEN}✅ STRIPE_SECRET_KEY présente${NC}"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET manquante (optionnel en local)${NC}"
else
  echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET présente${NC}"
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}❌ VITE_SUPABASE_URL manquante${NC}"
  missing_vars=$((missing_vars + 1))
else
  echo -e "${GREEN}✅ VITE_SUPABASE_URL présente${NC}"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY manquante${NC}"
else
  echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY présente${NC}"
fi

echo ""

# Test 5 : Test de production
echo "Test 5: Test de l'endpoint de production..."
echo -e "${YELLOW}Pour tester en production :${NC}"
echo ""
echo "1. Aller sur https://dashboard.stripe.com/webhooks"
echo "2. Cliquer sur votre webhook"
echo "3. Onglet 'Send test webhook'"
echo "4. Sélectionner 'checkout.session.completed'"
echo "5. Cliquer 'Send test webhook'"
echo "6. Vérifier dans Vercel logs et Supabase"
echo ""

# Résumé
echo "=========================="
echo "📊 Résumé des tests"
echo "=========================="
if [ $missing_vars -gt 0 ]; then
  echo -e "${RED}❌ $missing_vars variable(s) d'environnement manquante(s)${NC}"
  echo "   Créer un fichier .env à la racine avec :"
  echo "   STRIPE_SECRET_KEY=sk_live_..."
  echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
  echo "   VITE_SUPABASE_URL=https://..."
  echo "   SUPABASE_SERVICE_ROLE_KEY=eyJ..."
else
  echo -e "${GREEN}✅ Toutes les variables essentielles sont présentes${NC}"
fi

echo ""
echo "🎯 Prochaines étapes :"
echo "1. Lancer le serveur : npm run dev"
echo "2. Lancer Stripe CLI : stripe listen --forward-to http://localhost:3000/api/webhook"
echo "3. Tester un paiement : stripe trigger checkout.session.completed"
echo ""
echo "📚 Documentation complète : voir WEBHOOK_SETUP.md"
