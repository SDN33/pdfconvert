# 📧 Supabase Edge Functions - Email de Bienvenue

## 🎯 Vue d'Ensemble

Cette Edge Function Supabase envoie automatiquement un email de bienvenue lors de la création d'un compte (gratuit ou premium).

---

## 📁 Structure

```
supabase/functions/
└── send-welcome-email/
    └── index.ts          # Edge Function principale
```

---

## 🚀 Déploiement

### 1. Installer Supabase CLI

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Autres systèmes
npm install -g supabase
```

### 2. Se Connecter à Supabase

```bash
supabase login
```

### 3. Lier le Projet

```bash
supabase link --project-ref oohbiwmyoylbwgalmcgn
```

### 4. Configurer les Secrets

```bash
# Resend API Key (pour envoyer les emails)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase URL (déjà configuré)
supabase secrets set SUPABASE_URL=https://oohbiwmyoylbwgalmcgn.supabase.co

# Supabase Service Role Key (déjà dans .env)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 5. Déployer la Function

```bash
supabase functions deploy send-welcome-email
```

### 6. Vérifier le Déploiement

```bash
supabase functions list
```

---

## 🔑 Configuration Resend

### 1. Créer un Compte Resend

Allez sur : https://resend.com

### 2. Obtenir une API Key

1. Dashboard → API Keys
2. Créer une nouvelle clé
3. Copier la clé : `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Vérifier un Domaine (Recommandé)

Pour envoyer depuis `contact@stillinov.com` :

1. Dashboard → Domains → Add Domain
2. Entrer : `stillinov.com`
3. Ajouter les enregistrements DNS :

```
Type: TXT
Name: _resend
Value: [copier depuis Resend]

Type: CNAME
Name: resend._domainkey
Value: [copier depuis Resend]
```

4. Attendre la vérification (quelques minutes)

**Alternative (Test)** : Utilisez `onboarding@resend.dev` (100 emails/jour gratuit)

---

## 📊 Table email_logs (Optionnel)

Pour logger les emails envoyés :

```sql
-- Créer la table dans Supabase
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'welcome_premium' ou 'welcome_free'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX idx_email_logs_email ON email_logs(email);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Row Level Security (RLS)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy : Seulement les admins peuvent lire
CREATE POLICY "Service role can read email logs"
ON email_logs FOR SELECT
TO service_role
USING (true);

-- Policy : Seulement la fonction peut insérer
CREATE POLICY "Service role can insert email logs"
ON email_logs FOR INSERT
TO service_role
WITH CHECK (true);
```

---

## 🔗 Intégration dans l'Application

### Option 1 : Appel Direct depuis le Frontend

Dans `src/components/RegisterModal.tsx` après création de compte :

```typescript
// Après création du compte réussie
const sendWelcomeEmail = async (email: string, isPremium: boolean) => {
  try {
    const response = await fetch(
      'https://oohbiwmyoylbwgalmcgn.supabase.co/functions/v1/send-welcome-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          isPremium,
          userName: email.split('@')[0], // Optionnel
        }),
      }
    );

    if (response.ok) {
      console.log('✅ Welcome email sent');
    }
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Ne pas bloquer la création de compte si l'email échoue
  }
};

// Appeler après succès
await sendWelcomeEmail(email, false);
```

### Option 2 : Trigger Supabase (Automatique)

Créer un Database Trigger qui appelle la fonction automatiquement :

```sql
-- Fonction qui appelle l'Edge Function
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT := 'https://oohbiwmyoylbwgalmcgn.supabase.co/functions/v1/send-welcome-email';
  service_role_key TEXT := '[VOTRE_SERVICE_ROLE_KEY]';
BEGIN
  -- Appeler l'Edge Function de manière asynchrone
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'isPremium', NEW.is_premium,
        'userName', NEW.email
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table users
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();
```

**Installer l'extension pg_net** (si pas déjà fait) :

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 🧪 Tester la Function

### Test Local

```bash
supabase functions serve send-welcome-email
```

Puis dans un autre terminal :

```bash
curl -X POST \
  http://localhost:54321/functions/v1/send-welcome-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "email": "test@example.com",
    "isPremium": true,
    "userName": "Test User"
  }'
```

### Test en Production

```bash
curl -X POST \
  https://oohbiwmyoylbwgalmcgn.supabase.co/functions/v1/send-welcome-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "email": "votre@email.com",
    "isPremium": false
  }'
```

---

## 📧 Templates d'Email

### Email Premium (2 versions)

**Version 1** : Email HTML avec gradient cyan/bleu
- Titre : "🎉 Bienvenue Premium !"
- Avantages : Conversions illimitées, pas d'abonnement, etc.
- CTA : "Commencer à convertir"

**Version 2** : Email Gratuit avec gradient violet
- Titre : "👋 Bienvenue !"
- CTA : "Passez à Premium pour 2,99€"
- Promotion : Débloquez l'illimité

---

## 🔐 Sécurité

- ✅ CORS configuré
- ✅ Authorization header requis
- ✅ Validation des inputs (email obligatoire)
- ✅ Service Role Key utilisée pour Supabase
- ✅ Logs des erreurs
- ✅ Rate limiting Resend (100 emails/heure gratuit)

---

## 💰 Coûts

### Supabase Edge Functions
- **Gratuit** : 500K invocations/mois
- **Pro** : 2M invocations/mois (25$/mois)

### Resend
- **Gratuit** : 100 emails/jour (3000/mois)
- **Payant** : 20$/mois pour 50K emails

**Estimation** : Pour 100 nouveaux comptes/jour = **GRATUIT** 🎉

---

## 📊 Monitoring

### Logs Supabase

```bash
# Voir les logs en temps réel
supabase functions logs send-welcome-email --tail
```

### Dashboard Resend

https://resend.com/dashboard → Emails → Voir les emails envoyés

### Dashboard Supabase

https://supabase.com/dashboard → Edge Functions → Metrics

---

## 🐛 Troubleshooting

### Erreur : "Missing authorization header"
➡️ Ajouter le header `Authorization: Bearer [ANON_KEY]`

### Erreur : "Failed to send email: 403"
➡️ Vérifier que `RESEND_API_KEY` est configurée

### Erreur : "Domain not verified"
➡️ Utiliser `onboarding@resend.dev` ou vérifier le domaine sur Resend

### Email non reçu
➡️ Vérifier les spams / Vérifier les logs Resend

---

## 🚀 Améliorations Futures

1. **Email de confirmation** (double opt-in)
2. **Email de reset password**
3. **Email de reçu après paiement Stripe**
4. **Newsletter mensuelle**
5. **Email de rappel** (utilisateurs inactifs)
6. **Email de feedback** après 7 jours

---

## 📞 Support

Pour toute question sur les Edge Functions :
- **Docs Supabase** : https://supabase.com/docs/guides/functions
- **Docs Resend** : https://resend.com/docs
- **Email** : contact@stillinov.com

---

**Date** : 15 novembre 2025  
**Statut** : ✅ Prêt à déployer  
**Prochaine étape** : Déployer avec `supabase functions deploy send-welcome-email`
