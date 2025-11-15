# Configuration de l'authentification Google avec Supabase

## Étapes de configuration

### 1. Activer Google Auth dans Supabase

1. Allez dans votre projet Supabase
2. Naviguez vers **Authentication** > **Providers**
3. Trouvez **Google** dans la liste des providers
4. Activez le provider Google

### 2. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API **Google+ API**

### 3. Configurer OAuth 2.0

1. Dans Google Cloud Console, allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Choisissez **Web application**
4. Configurez les URLs autorisées :

**Authorized JavaScript origins:**
```
http://localhost:5173
https://votre-domaine.com
```

**Authorized redirect URIs:**
```
https://votre-projet.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
https://votre-domaine.com/auth/callback
```

### 4. Configurer Supabase

1. Copiez le **Client ID** et **Client Secret** depuis Google Cloud Console
2. Dans Supabase, collez-les dans la configuration du provider Google :
   - **Client ID** → Google OAuth Client ID
   - **Client Secret** → Google OAuth Client Secret
3. Cliquez sur **Save**

### 5. Tester l'authentification

1. Lancez votre application : `npm run dev`
2. Cliquez sur le bouton "Continuer avec Google"
3. Autorisez l'application
4. Vous serez redirigé vers `/auth/callback` puis vers la page d'accueil

## Structure du flux d'authentification

```
User clicks "Continuer avec Google"
  ↓
loginWithGoogle() → Supabase Auth OAuth
  ↓
Google consent screen
  ↓
Redirect to /auth/callback
  ↓
handleOAuthCallback() → Create/get user in premium_users
  ↓
Create session token
  ↓
Store in localStorage
  ↓
Redirect to home with ?welcome=true
```

## Fichiers modifiés

- ✅ `src/lib/auth.ts` - Ajout de `loginWithGoogle()` et `handleOAuthCallback()`
- ✅ `src/components/LoginModal.tsx` - Ajout du bouton Google
- ✅ `src/pages/AuthCallback.tsx` - Page de callback OAuth
- ✅ `src/main.tsx` - Route `/auth/callback` ajoutée

## Base de données

La table `premium_users` accepte déjà les utilisateurs Google :
- `password_hash` peut être `NULL` pour les utilisateurs OAuth
- `is_lifetime` = `false` par défaut (compte gratuit)
- `subscription_status` = `'free'` par défaut

## Notes importantes

⚠️ **En développement** : Utilisez `http://localhost:5173` dans les URLs autorisées
⚠️ **En production** : Remplacez par votre domaine réel
⚠️ **Supabase callback URL** : Utilisez toujours l'URL Supabase exacte (pas votre domaine)

## Sécurité

- Les tokens Google sont gérés par Supabase Auth (sécurisé)
- Les sessions utilisent notre système de tokens custom (30 jours)
- Les utilisateurs OAuth ont `password_hash = null` (normal)
- Le système de conversions gratuites/premium fonctionne identique
