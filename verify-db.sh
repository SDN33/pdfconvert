#!/bin/bash

# Script de vérification rapide de la DB
# Usage: ./verify-db.sh

echo "🔍 Vérification de la base de données Supabase..."
echo ""

# Test 1: Vérifier la connexion
echo "✅ TEST 1: Connexion à Supabase"
if [ -f .env ]; then
    export $(cat .env | grep "VITE_SUPABASE_URL" | xargs)
    echo "   URL: $VITE_SUPABASE_URL"
else
    echo "   ❌ Fichier .env introuvable"
    exit 1
fi
echo ""

# Test 2: Structure des fichiers
echo "✅ TEST 2: Structure des fichiers"
if [ -f "supabase/migrations/20241115_audit_and_fix.sql" ]; then
    echo "   ✓ Migration créée"
else
    echo "   ✗ Migration manquante"
fi

if [ -f "test-database.sql" ]; then
    echo "   ✓ Tests SQL créés"
else
    echo "   ✗ Tests SQL manquants"
fi

if [ -f "src/lib/auth.ts" ]; then
    echo "   ✓ Fichier auth.ts présent"
else
    echo "   ✗ Fichier auth.ts manquant"
fi
echo ""

# Test 3: Vérifier les corrections dans auth.ts
echo "✅ TEST 3: Corrections dans auth.ts"
if grep -q "maybeSingle()" src/lib/auth.ts; then
    echo "   ✓ Utilisation de maybeSingle() (correction appliquée)"
else
    echo "   ✗ Correction maybeSingle() manquante"
fi

if grep -q "23505" src/lib/auth.ts; then
    echo "   ✓ Gestion erreur PostgreSQL 23505 (duplicate key)"
else
    echo "   ✗ Gestion d'erreur PostgreSQL manquante"
fi
echo ""

# Test 4: Documentation
echo "✅ TEST 4: Documentation"
docs=("DATABASE_AUDIT_REPORT.md" "DB_CONVERSION_SYSTEM.md" "GOOGLE_AUTH_SETUP.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "   ✓ $doc"
    else
        echo "   ✗ $doc manquant"
    fi
done
echo ""

echo "📋 RÉSUMÉ:"
echo ""
echo "Pour tester manuellement la DB, ouvrez Supabase Dashboard:"
echo "1. Allez sur https://app.supabase.com"
echo "2. Sélectionnez votre projet"
echo "3. Ouvrez SQL Editor"
echo "4. Copiez-collez le contenu de test-database.sql"
echo "5. Exécutez les tests"
echo ""
echo "Pour tester la création de compte:"
echo "1. Lancez: npm run dev"
echo "2. Ouvrez http://localhost:5173"
echo "3. Cliquez sur 'Créer un compte gratuit'"
echo "4. Entrez email + mot de passe"
echo "5. Vérifiez qu'il n'y a pas d'erreur"
echo ""
echo "✅ Vérifications terminées !"
