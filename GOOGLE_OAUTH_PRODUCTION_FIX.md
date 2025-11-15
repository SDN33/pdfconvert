# 🔧 Fix Google OAuth Redirect en Production

## Problème
Après connexion Google, l'application redirige vers `http://localhost:3000` au lieu du domaine de production.

## Solution en 3 étapes

### ✅ Étape 1 : Configuration Supabase

1. **Allez sur le Dashboard Supabase :**
   ```
   https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn/auth/url-configuration
   ```

2. **Site URL (URL principale) :**
   ```
   https://markdownenpdf.com
   ```
   ⚠️ Remplacez par votre vrai domaine de production

3. **Redirect URLs (Autorisées) :**
   ```
   http://localhost:3000/**
   https://markdownenpdf.com/**
   https://www.markdownenpdf.com/**
   ```
   
   📝 **Important :** Ajoutez `**` à la fin pour autoriser tous les sous-chemins
   
   - La première ligne est pour le développement local
   - Les deux suivantes sont pour la production (avec et sans www)

4. **Cliquez sur "Save"**

---

### ✅ Étape 2 : Configuration Google Cloud Console

1. **Allez sur Google Cloud Console :**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Sélectionnez votre projet** (celui utilisé pour OAuth)

3. **Cliquez sur votre OAuth 2.0 Client ID** (Web application)

4. **Dans "Authorized redirect URIs", vérifiez qu'il y a :**
   ```
   https://oohbiwmyoylbwgalmcgn.supabase.co/auth/v1/callback
   ```
   
   ⚠️ Cette URL **doit** pointer vers Supabase, pas vers votre domaine !

5. **Cliquez sur "Save"**

---

### ✅ Étape 3 : Variables d'environnement Production

Si vous utilisez Vercel, Netlify ou autre :

1. Allez dans les paramètres de votre projet
2. Ajoutez/vérifiez ces variables :

```env
VITE_SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
```

3. **Redéployez l'application** après modification des variables

---

## 🧪 Test de validation

### Après la configuration :

1. **En local (localhost:3000) :**
   - Cliquez sur "Continuer avec Google"
   - Après connexion, doit rediriger vers `http://localhost:3000/auth/callback`
   - Vérifiez la console : doit afficher `🔐 Google OAuth redirect URL: http://localhost:3000/auth/callback`

2. **En production (votre domaine) :**
   - Cliquez sur "Continuer avec Google"
   - Après connexion, doit rediriger vers `https://votre-domaine.com/auth/callback`
   - Vérifiez la console : doit afficher `🔐 Google OAuth redirect URL: https://votre-domaine.com/auth/callback`

---

## 🔍 Diagnostic si ça ne marche toujours pas

### Vérifier le log console :
Ouvrez la console développeur (F12) et cherchez :
```
🔐 Google OAuth redirect URL: ...
```

### Cas 1 : Le log affiche localhost alors que vous êtes en prod
❌ **Problème :** Le code JavaScript n'a pas été redéployé
✅ **Solution :** Redéployer l'application (commit + push + rebuild)

### Cas 2 : Le log affiche le bon domaine mais redirige quand même vers localhost
❌ **Problème :** La redirect URL n'est pas autorisée dans Supabase
✅ **Solution :** Retournez à l'Étape 1, vérifiez les Redirect URLs dans Supabase

### Cas 3 : Erreur "redirect_uri_mismatch" de Google
❌ **Problème :** L'URI de callback Supabase n'est pas autorisée dans Google Cloud
✅ **Solution :** Retournez à l'Étape 2, ajoutez l'URI Supabase dans Google Cloud Console

---

## 📝 Configuration complète exemple

### Supabase Dashboard :
```
Site URL: https://markdownenpdf.com

Redirect URLs:
  - http://localhost:3000/**
  - https://markdownenpdf.com/**
  - https://www.markdownenpdf.com/**
```

### Google Cloud Console :
```
Authorized redirect URIs:
  - https://oohbiwmyoylbwgalmcgn.supabase.co/auth/v1/callback
```

### Variables d'environnement (.env) :
```env
VITE_SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Checklist finale

- [ ] Site URL configurée dans Supabase
- [ ] Redirect URLs (avec `**`) ajoutées dans Supabase
- [ ] URI de callback Supabase ajoutée dans Google Cloud Console
- [ ] Variables d'environnement correctes en production
- [ ] Application redéployée après les modifications
- [ ] Test en local : ✅
- [ ] Test en production : ✅

---

## 🆘 Besoin d'aide ?

Si le problème persiste après ces étapes :

1. **Vérifiez les logs Supabase :**
   ```
   https://supabase.com/dashboard/project/oohbiwmyoylbwgalmcgn/logs
   ```

2. **Vérifiez la console navigateur** pour les erreurs JavaScript

3. **Testez avec un navigateur en mode incognito** (pour éviter les problèmes de cache)

4. **Attendez 5-10 minutes** après modification de la config Google (propagation des changements)
