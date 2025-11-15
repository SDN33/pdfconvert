#!/bin/bash

# Script pour pousser la migration vers Supabase
# Usage: ./push-migration.sh

echo "🔍 Audit et correction de la base de données Supabase..."
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -E "^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)" | xargs)
else
    echo "❌ Fichier .env introuvable"
    exit 1
fi

# Vérifier que les variables sont définies
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables d'environnement Supabase manquantes"
    exit 1
fi

echo "✅ Variables d'environnement chargées"
echo "📍 URL Supabase: $VITE_SUPABASE_URL"
echo ""

# Extraire l'ID du projet depuis l'URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([a-z0-9]+)\.supabase\.co|\1|')
echo "📦 Project Ref: $PROJECT_REF"
echo ""

# Lier le projet Supabase
echo "🔗 Liaison avec le projet Supabase..."
supabase link --project-ref $PROJECT_REF 2>&1 | grep -v "password" || {
    echo "⚠️  Projet déjà lié ou erreur de liaison"
}
echo ""

# Pousser la migration
echo "🚀 Application de la migration..."
supabase db push --include-all

echo ""
echo "✅ Migration terminée !"
echo ""
echo "📊 Pour vérifier l'état de la DB, exécutez:"
echo "   supabase db diff --linked"
echo ""
echo "🔍 Pour voir les logs SQL:"
echo "   supabase db logs --local"
