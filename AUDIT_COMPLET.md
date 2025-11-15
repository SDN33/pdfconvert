# 🔍 AUDIT COMPLET - Application MarkdownEnPDF.com

**Date:** 15 Novembre 2025  
**Version:** 2.0  
**Auditeur:** GitHub Copilot  
**Périmètre:** Backend, Sécurité, Design, Conversion PDF

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Audit Backend & API](#audit-backend--api)
3. [Audit Sécurité](#audit-sécurité)
4. [Audit Design & UX](#audit-design--ux)
5. [Audit Conversion PDF](#audit-conversion-pdf)
6. [Propositions d'Amélioration](#propositions-damélioration)
7. [Plan d'Action Prioritaire](#plan-daction-prioritaire)

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Points Forts
- ✨ **Architecture solide** : Séparation claire frontend/backend avec Vercel serverless functions
- 🔒 **Sécurité correcte** : RLS activé, tokens de session, bcrypt pour les mots de passe
- 🎨 **Design moderne** : UI professionnelle avec Tailwind CSS et animations
- 📄 **Conversion fonctionnelle** : Support complet du Markdown standard avec jsPDF
- 💳 **Paiement intégré** : Stripe Live en production avec webhook configuré

### ⚠️ Points Critiques à Améliorer
- 🔴 **CRITIQUE** : Clés API exposées dans le fichier .env (risque de commit accidentel)
- 🟠 **IMPORTANT** : Pas de rate limiting sur les API endpoints
- 🟠 **IMPORTANT** : Validation insuffisante des entrées utilisateur
- 🟡 **MOYEN** : Messages d'erreur trop verbeux (fuite d'informations)
- 🟡 **MOYEN** : Performance de conversion non optimisée pour gros documents

### 📈 Score Global
- **Backend & API** : 7.5/10
- **Sécurité** : 6.5/10
- **Design & UX** : 8.5/10
- **Conversion PDF** : 7/10
- **SCORE TOTAL** : **7.4/10** ⭐

---

## 🔧 AUDIT BACKEND & API

### ✅ Points Positifs

#### 1. Architecture Serverless Vercel
```typescript
// api/create-checkout-session.ts
// api/webhook.ts
// api/verify-session.ts
```
- ✅ Séparation claire des responsabilités
- ✅ Scalabilité automatique
- ✅ Déploiement simplifié

#### 2. Gestion Stripe Webhook
```typescript
// api/webhook.ts (lignes 77-83)
subscription_status: 'active',
is_lifetime: true,
stripe_customer_id: session.customer as string
```
- ✅ Mise à jour automatique DB après paiement
- ✅ Vérification signature webhook
- ✅ Gestion des événements checkout.session.completed et charge.refunded

#### 3. Fonction SQL Sécurisée
```sql
-- get_remaining_conversions() avec SECURITY DEFINER
WHERE is_lifetime = true AND subscription_status = 'active'
```
- ✅ Logique centralisée dans la DB
- ✅ Performance optimale (indexes)
- ✅ Évite les injections SQL

### ⚠️ Problèmes Détectés

#### 🔴 CRITIQUE 1 : Validation Insuffisante des Entrées

**Fichier:** `api/create-checkout-session.ts`
```typescript
// PROBLÈME : Pas de validation de l'email
const { email, priceId } = req.body;
```

**Impact:** Risque d'injection, données corrompues dans Stripe

**Solution recommandée:**
```typescript
// AMÉLIORATION PROPOSÉE
import validator from 'validator';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, priceId } = req.body;

    // VALIDATION EMAIL
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // VALIDATION PRICE ID (whitelist)
    const validPriceIds = [process.env.VITE_STRIPE_PRICE_ID];
    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    // Limiter la longueur de l'email
    if (email.length > 255) {
      return res.status(400).json({ error: 'Email trop long' });
    }

    // Continue...
  }
}
```

#### 🟠 IMPORTANT 2 : Pas de Rate Limiting

**Fichier:** `api/create-checkout-session.ts`, `api/verify-session.ts`

**Problème:** Aucune protection contre les attaques brute force ou spam

**Impact:** 
- Abus possible des API endpoints
- Coûts Vercel/Stripe potentiellement élevés
- DoS possible

**Solution recommandée:**
```typescript
// INSTALLER: npm install @vercel/edge-rate-limit
import rateLimit from '@vercel/edge-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export default async function handler(req: any, res: any) {
  // Rate limiting par IP
  const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    await limiter.check(res, 10, identifier); // Max 10 requêtes/minute
  } catch {
    return res.status(429).json({ 
      error: 'Trop de requêtes. Réessayez dans 1 minute.' 
    });
  }

  // Continue le traitement...
}
```

#### 🟠 IMPORTANT 3 : Messages d'Erreur Verbeux

**Fichier:** `api/create-checkout-session.ts` (ligne 42)
```typescript
res.status(500).json({ error: error.message || 'Internal server error' });
```

**Problème:** Expose les détails internes en production

**Solution recommandée:**
```typescript
// AMÉLIORATION
} catch (error: any) {
  console.error('Error creating checkout session:', error);
  
  // En production, ne pas exposer les détails
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    error: isDev ? error.message : 'Une erreur est survenue. Veuillez réessayer.' 
  });
}
```

#### 🟡 MOYEN 4 : Pas de Timeout sur les Requêtes API

**Impact:** Risque de blocage si Stripe ne répond pas

**Solution recommandée:**
```typescript
// Ajouter un timeout
const TIMEOUT = 15000; // 15 secondes

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout')), TIMEOUT);
});

const session = await Promise.race([
  stripe.checkout.sessions.create({...}),
  timeoutPromise
]);
```

#### 🟡 MOYEN 5 : Pas de Logs Structurés

**Problème:** Debugging difficile en production

**Solution recommandée:**
```typescript
// INSTALLER: npm install pino
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

export default async function handler(req: any, res: any) {
  logger.info({ 
    method: req.method, 
    path: req.url,
    email: email 
  }, 'Checkout session requested');
  
  // ...
}
```

---

## 🔒 AUDIT SÉCURITÉ

### ✅ Points Positifs

#### 1. Authentification Sécurisée
```typescript
// src/lib/auth.ts
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS); // 10 rounds ✅
```

#### 2. Row Level Security (RLS)
```sql
-- supabase/migrations/20241115_audit_and_fix.sql
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read premium users" ON premium_users FOR SELECT USING (true);
```

#### 3. Tokens de Session
```typescript
// Génération aléatoire sécurisée
function generateSessionToken(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
```

#### 4. Webhook Stripe Vérifié
```typescript
// api/webhook.ts (lignes 33-42)
event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```

### ⚠️ Vulnérabilités Détectées

#### 🔴 CRITIQUE 1 : Clés Secrètes dans .env (Risque de Commit)

**Fichier:** `.env` (TOUT LE FICHIER)
```env
# PROBLÈME : .env contient les clés en clair
STRIPE_SECRET_KEY=sk_live_51STVfg1hBWMOXJEV...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
STRIPE_WEBHOOK_SECRET=whsec_YZLzhOSnz84IhDYpEar...
```

**Impact:** 
- ⚠️ Si commité sur GitHub → **FUITE TOTALE DES CLÉS**
- ⚠️ Accès complet à Stripe et Supabase
- ⚠️ Vol de données clients + transactions frauduleuses

**Solution IMMÉDIATE:**
```bash
# 1. VÉRIFIER .gitignore
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "Remove .env from tracking"

# 2. CRÉER .env.example (sans valeurs)
cp .env .env.example
# Remplacer toutes les valeurs par des placeholders
sed -i '' 's/=.*/=YOUR_KEY_HERE/g' .env.example
git add .env.example
git commit -m "Add .env.example template"

# 3. VÉRIFIER HISTORIQUE GIT
git log --all --full-history -- .env
# Si trouvé → RÉGÉNÉRER TOUTES LES CLÉS IMMÉDIATEMENT
```

**Fichier `.env.example` à créer:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Stripe Configuration (LIVE MODE - PRODUCTION)
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
VITE_STRIPE_PRODUCT_ID=prod_YOUR_PRODUCT_ID_HERE
VITE_STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Secret Keys (NEVER COMMIT THESE)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

#### 🔴 CRITIQUE 2 : Token de Session Faible

**Fichier:** `src/lib/auth.ts` (ligne 104)
```typescript
// PROBLÈME : Math.random() n'est PAS cryptographiquement sécurisé
function generateSessionToken(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
```

**Impact:** Risque de prédiction/collision de tokens → vol de session

**Solution recommandée:**
```typescript
// AMÉLIORATION : Utiliser crypto API
import { randomBytes } from 'crypto';

function generateSessionToken(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(32).toString('hex'); // 64 caractères hex
  return `${timestamp}_${randomPart}`;
}

// Ou encore mieux : UUID v4
import { v4 as uuidv4 } from 'uuid';

function generateSessionToken(): string {
  return uuidv4(); // Format: 550e8400-e29b-41d4-a716-446655440000
}
```

#### 🟠 IMPORTANT 3 : Pas de Protection CSRF

**Problème:** Les formulaires et API calls ne vérifient pas l'origine

**Impact:** Possible attaque CSRF (Cross-Site Request Forgery)

**Solution recommandée:**
```typescript
// AJOUTER dans les composants de formulaire
import { csrfToken } from '../lib/csrf';

// Dans LoginModal.tsx, RegisterModal.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const token = await csrfToken();
  
  const result = await loginPremium(email, password, token);
  // ...
};

// Créer src/lib/csrf.ts
export async function csrfToken(): Promise<string> {
  const response = await fetch('/api/csrf-token');
  const { token } = await response.json();
  return token;
}

// Créer api/csrf-token.ts
import { randomBytes } from 'crypto';

const tokens = new Map<string, number>();

export default function handler(req: any, res: any) {
  const token = randomBytes(32).toString('hex');
  const expiry = Date.now() + 3600000; // 1 heure
  
  tokens.set(token, expiry);
  
  // Nettoyer les tokens expirés
  for (const [t, exp] of tokens.entries()) {
    if (exp < Date.now()) tokens.delete(t);
  }
  
  res.status(200).json({ token });
}
```

#### 🟠 IMPORTANT 4 : Headers de Sécurité Manquants

**Fichier:** `vercel.json`

**Problème:** Pas de headers de sécurité (CSP, HSTS, etc.)

**Solution recommandée:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com;"
        }
      ]
    }
  ]
}
```

#### 🟡 MOYEN 5 : localStorage Non Chiffré

**Fichier:** `src/App.tsx`, `src/components/LoginModal.tsx`, etc.

**Problème:** Le token de session est stocké en clair dans localStorage

**Impact:** Accessible via XSS ou accès physique

**Solution recommandée:**
```typescript
// CRÉER src/lib/secureStorage.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-me';

export function setSecureItem(key: string, value: string): void {
  const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
  localStorage.setItem(key, encrypted);
}

export function getSecureItem(key: string): string | null {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

// UTILISATION
import { setSecureItem, getSecureItem } from '../lib/secureStorage';

// Au lieu de:
localStorage.setItem('session_token', token);

// Faire:
setSecureItem('session_token', token);

// Au lieu de:
const token = localStorage.getItem('session_token');

// Faire:
const token = getSecureItem('session_token');
```

#### 🟡 MOYEN 6 : Pas de Protection Brute Force Login

**Fichier:** `src/lib/auth.ts` - fonction `loginPremium()`

**Problème:** Pas de limitation de tentatives de connexion

**Solution recommandée:**
```typescript
// AJOUTER dans Supabase une table login_attempts
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempted_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);

// Fonction SQL pour vérifier
CREATE OR REPLACE FUNCTION can_attempt_login(check_email TEXT, check_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  failed_attempts INTEGER;
BEGIN
  -- Compter les échecs dans les 15 dernières minutes
  SELECT COUNT(*) INTO failed_attempts
  FROM login_attempts
  WHERE (email = check_email OR ip_address = check_ip)
  AND attempted_at > NOW() - INTERVAL '15 minutes'
  AND success = false;
  
  -- Bloquer après 5 échecs
  RETURN failed_attempts < 5;
END;
$$ LANGUAGE plpgsql;

// Dans auth.ts
export async function loginPremium(email: string, password: string): Promise<...> {
  try {
    // Vérifier si autorisé à tenter
    const { data: canAttempt } = await supabase
      .rpc('can_attempt_login', { 
        check_email: email, 
        check_ip: await getClientIP() 
      });
    
    if (!canAttempt) {
      return { 
        success: false, 
        error: 'Trop de tentatives échouées. Réessayez dans 15 minutes.' 
      };
    }
    
    // Tentative de connexion...
    const { data: user } = await supabase...
    
    // Logger la tentative
    await supabase.from('login_attempts').insert([{
      email,
      ip_address: await getClientIP(),
      success: isPasswordValid
    }]);
    
    // ...
  }
}
```

---

## 🎨 AUDIT DESIGN & UX

### ✅ Points Positifs

#### 1. Design Moderne et Professionnel
- ✅ Tailwind CSS bien utilisé
- ✅ Gradients et animations fluides
- ✅ Cohérence visuelle sur toute l'app
- ✅ Logo et branding clairs

#### 2. Responsive Design
```tsx
// Classes responsive bien utilisées
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
<div className="flex flex-col sm:flex-row items-start sm:items-center">
```

#### 3. Accessibilité Correcte
```tsx
// Labels et ARIA présents
<label htmlFor="email" className="...">Email</label>
aria-label="Télécharger le document en format PDF"
role="region"
```

#### 4. Preview en Temps Réel
```tsx
// App.tsx (lignes 1149-1488)
// Preview PDF avec tous les styles appliqués ✅
```

### ⚠️ Problèmes Détectés

#### 🟠 IMPORTANT 1 : Pas de Dark Mode

**Impact:** Confort réduit pour utilisateurs en soirée

**Solution recommandée:**
```typescript
// CRÉER src/hooks/useDarkMode.ts
import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

// Dans App.tsx
const [isDarkMode, setIsDarkMode] = useDarkMode();

// Ajouter bouton toggle
<button
  onClick={() => setIsDarkMode(!isDarkMode)}
  className="fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 p-3 rounded-full shadow-lg"
>
  {isDarkMode ? '☀️' : '🌙'}
</button>

// Modifier tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

#### 🟡 MOYEN 2 : Pas de Loading States Cohérents

**Problème:** Certains boutons montrent un spinner, d'autres non

**Solution recommandée:**
```typescript
// CRÉER src/components/Button.tsx
interface ButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function Button({ loading, children, onClick, disabled, variant = 'primary' }: ButtonProps) {
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-xl font-bold transition-all ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
```

#### 🟡 MOYEN 3 : Pas de Toasts/Notifications

**Problème:** Feedback utilisateur parfois via alert() → expérience dégradée

**Solution recommandée:**
```bash
npm install react-hot-toast
```

```typescript
// Dans App.tsx
import toast, { Toaster } from 'react-hot-toast';

// Remplacer tous les alert() par:
alert(result.message); // AVANT
toast.error(result.message); // APRÈS

toast.success('Conversion réussie !');
toast.error('Limite atteinte');
toast.loading('Conversion en cours...');

// Ajouter dans le JSX
<Toaster position="top-right" />
```

#### 🟡 MOYEN 4 : Mobile UX à Améliorer

**Problèmes:**
- Boutons trop petits sur mobile
- Inputs parfois difficiles à toucher
- Preview pas optimisé pour petit écran

**Solution recommandée:**
```tsx
// Augmenter taille touch targets
<button className="px-8 py-4 text-lg"> // Au lieu de px-6 py-3
<input className="py-4 text-lg"> // Au lieu de py-3

// Preview responsive
<div className="h-96 md:h-[600px] lg:h-96">
  {/* Preview content */}
</div>
```

#### 🟡 MOYEN 5 : Pas de Keyboard Shortcuts

**Solution recommandée:**
```typescript
// Dans App.tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl+Enter ou Cmd+Enter pour convertir
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (markdown.trim() && !isConverting) {
        handleConvert();
      }
    }
    
    // Ctrl+K pour ouvrir settings
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowSettings(!showSettings);
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [markdown, isConverting, showSettings]);

// Ajouter hint dans l'UI
<p className="text-xs text-gray-500">
  Astuce : Ctrl+Entrée pour convertir, Ctrl+K pour les réglages
</p>
```

---

## 📄 AUDIT CONVERSION PDF

### ✅ Points Positifs

#### 1. Support Markdown Complet
- ✅ Titres H1-H3
- ✅ Listes à puces et numérotées
- ✅ Blocs de code avec fond gris
- ✅ Citations (blockquotes)
- ✅ Formatage inline (gras, italique, code)
- ✅ Liens hypertextes
- ✅ Séparateurs

#### 2. Personnalisation Avancée
- ✅ 10 couleurs de thème
- ✅ Marges configurables
- ✅ Tailles de police ajustables
- ✅ Bordures décoratives (5 styles)
- ✅ En-têtes/pieds de page custom
- ✅ Numérotation de pages
- ✅ Watermark

#### 3. Preview en Temps Réel
```tsx
// App.tsx (lignes 1149-1488)
// Rendu fidèle au PDF final ✅
```

### ⚠️ Problèmes Détectés

#### 🟠 IMPORTANT 1 : Performance sur Gros Documents

**Problème:** App.tsx (lignes 214-763) - Boucle synchrone bloque l'UI

**Impact:** 
- Freeze de l'interface sur documents > 1000 lignes
- Pas de feedback de progression
- Risque de timeout navigateur

**Solution recommandée:**
```typescript
// AMÉLIORER avec Web Workers
// 1. Créer public/pdfWorker.js
self.addEventListener('message', async (e) => {
  const { markdown, settings } = e.data;
  
  // Import jsPDF dans le worker
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf;
  
  const pdf = new jsPDF();
  // ... conversion ...
  
  const pdfData = pdf.output('datauristring');
  self.postMessage({ pdfData, progress: 100 });
});

// 2. Dans App.tsx
const performConversion = async () => {
  setIsConverting(true);
  
  const worker = new Worker('/pdfWorker.js');
  
  worker.postMessage({ markdown, settings });
  
  worker.onmessage = (e) => {
    const { pdfData, progress } = e.data;
    
    if (progress) {
      setConversionProgress(progress); // Barre de progression
    }
    
    if (pdfData) {
      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = 'document.pdf';
      link.click();
      
      setIsConverting(false);
      worker.terminate();
    }
  };
};
```

#### 🟡 MOYEN 2 : Pas de Support Tableaux

**Problème:** Les tableaux Markdown ne sont pas convertis

**Exemple non supporté:**
```markdown
| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Valeur 1  | Valeur 2  |
```

**Solution recommandée:**
```typescript
// Dans performConversion(), ajouter:
// Détecter les tableaux Markdown
if (line.startsWith('|')) {
  if (!inTable) {
    inTable = true;
    tableRows = [];
    tableHeaders = line.split('|').filter(c => c.trim());
  } else if (line.match(/^\|[\s-:]+\|/)) {
    // Ligne de séparation, skip
    continue;
  } else {
    const cells = line.split('|').filter(c => c.trim());
    tableRows.push(cells);
  }
  continue;
}

if (inTable && !line.startsWith('|')) {
  // Fin du tableau, le dessiner
  inTable = false;
  
  const colWidths = tableHeaders.map(() => contentWidth / tableHeaders.length);
  const rowHeight = 10;
  
  // Headers
  pdf.setFillColor(240, 240, 240);
  pdf.rect(settings.marginLeft, y, contentWidth, rowHeight, 'F');
  pdf.setFont('helvetica', 'bold');
  
  tableHeaders.forEach((header, i) => {
    const x = settings.marginLeft + (i * colWidths[i]);
    pdf.text(header, x + 2, y + 6);
  });
  
  y += rowHeight;
  
  // Rows
  pdf.setFont('helvetica', 'normal');
  tableRows.forEach(row => {
    row.forEach((cell, i) => {
      const x = settings.marginLeft + (i * colWidths[i]);
      pdf.text(cell, x + 2, y + 6);
    });
    y += rowHeight;
  });
  
  // Bordure
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(settings.marginLeft, y - ((tableRows.length + 1) * rowHeight), contentWidth, (tableRows.length + 1) * rowHeight);
}
```

#### 🟡 MOYEN 3 : Pas de Support Images

**Problème:** Les images Markdown ne sont pas intégrées au PDF

**Solution recommandée:**
```typescript
// Détecter les images: ![alt](url)
const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

if (imageRegex.test(line)) {
  const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (match) {
    const [, alt, imageUrl] = match;
    
    try {
      // Charger l'image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Calculer dimensions
      const maxWidth = contentWidth;
      const ratio = img.width / img.height;
      let imgWidth = Math.min(maxWidth, img.width);
      let imgHeight = imgWidth / ratio;
      
      // Ajouter au PDF
      addNewPageIfNeeded(imgHeight + 10);
      pdf.addImage(img, 'JPEG', settings.marginLeft, y, imgWidth, imgHeight);
      y += imgHeight + 10;
      
      // Légende si alt text
      if (alt) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(alt, settings.marginLeft, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(settings.fontSize);
      }
    } catch (error) {
      console.error('Erreur chargement image:', imageUrl);
      // Fallback : afficher le texte alt
      pdf.text(`[Image: ${alt || imageUrl}]`, settings.marginLeft, y);
      y += settings.fontSize * settings.lineHeight;
    }
  }
  continue;
}
```

#### 🟡 MOYEN 4 : Pas de Cache/Optimisation

**Problème:** Chaque conversion recalcule tout depuis zéro

**Solution recommandée:**
```typescript
// Mémoriser les lignes parsées
import { useMemo } from 'react';

const parsedLines = useMemo(() => {
  return markdown.split('\n').map(line => ({
    raw: line,
    type: detectLineType(line), // 'h1', 'h2', 'list', 'code', etc.
    content: extractContent(line)
  }));
}, [markdown]);

function detectLineType(line: string): string {
  if (line.startsWith('# ')) return 'h1';
  if (line.startsWith('## ')) return 'h2';
  if (line.startsWith('### ')) return 'h3';
  if (line.match(/^[-*+]\s/)) return 'list';
  if (line.startsWith('```')) return 'code-fence';
  if (line.startsWith('> ')) return 'blockquote';
  if (!line.trim()) return 'empty';
  return 'paragraph';
}
```

#### 🟡 MOYEN 5 : Pas d'Export en Autres Formats

**Impact:** Limitation à PDF uniquement

**Solution recommandée:**
```typescript
// Ajouter boutons export
<div className="flex gap-2">
  <button onClick={handleConvertPDF}>📄 PDF</button>
  <button onClick={handleConvertDOCX}>📝 DOCX</button>
  <button onClick={handleConvertHTML}>🌐 HTML</button>
</div>

// Export HTML
const handleConvertHTML = () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; margin: ${settings.marginTop}px ${settings.marginRight}px; }
          h1 { font-size: ${settings.titleSize}px; color: ${themeColors[settings.themeColor]}; }
          /* ... autres styles ... */
        </style>
      </head>
      <body>${convertMarkdownToHTML(markdown)}</body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'document.html';
  link.click();
};
```

---

## 🚀 PROPOSITIONS D'AMÉLIORATION

### 🔥 Top 10 Améliorations Prioritaires

#### 1. 🔴 **URGENT : Sécuriser les Clés API**
**Fichier:** `.env`, `.gitignore`
**Temps estimé:** 30 minutes
**Impact:** ⭐⭐⭐⭐⭐ (Critique)

**Actions:**
1. Vérifier que `.env` est dans `.gitignore`
2. Créer `.env.example` avec placeholders
3. Vérifier historique Git pour fuites passées
4. Si détecté → Régénérer TOUTES les clés Stripe et Supabase
5. Ajouter pre-commit hook pour bloquer les commits de secrets

```bash
# Installer git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws
git secrets --add 'sk_live_[0-9a-zA-Z]+'
git secrets --add 'whsec_[0-9a-zA-Z]+'
```

#### 2. 🔴 **URGENT : Améliorer les Tokens de Session**
**Fichier:** `src/lib/auth.ts`
**Temps estimé:** 1 heure
**Impact:** ⭐⭐⭐⭐⭐

```typescript
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

function generateSessionToken(): string {
  // Option 1 : UUID v4 (recommandé)
  return uuidv4();
  
  // Option 2 : Random bytes + timestamp
  const timestamp = Date.now();
  const random = randomBytes(32).toString('hex');
  return `${timestamp}_${random}`;
}
```

#### 3. 🟠 **Important : Ajouter Rate Limiting**
**Fichiers:** `api/create-checkout-session.ts`, `api/verify-session.ts`
**Temps estimé:** 2 heures
**Impact:** ⭐⭐⭐⭐

```bash
npm install @vercel/edge-rate-limit
```

```typescript
import rateLimit from '@vercel/edge-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export default async function handler(req, res) {
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  
  try {
    await limiter.check(res, 10, identifier); // Max 10/min
  } catch {
    return res.status(429).json({ error: 'Trop de requêtes' });
  }
  
  // ...
}
```

#### 4. 🟠 **Important : Validation des Entrées**
**Fichiers:** Tous les API endpoints
**Temps estimé:** 3 heures
**Impact:** ⭐⭐⭐⭐

```bash
npm install validator zod
```

```typescript
import { z } from 'zod';

const checkoutSchema = z.object({
  email: z.string().email().max(255),
  priceId: z.string().regex(/^price_[0-9a-zA-Z]+$/)
});

export default async function handler(req, res) {
  try {
    const validated = checkoutSchema.parse(req.body);
    // validated.email et validated.priceId sont sûrs
  } catch (error) {
    return res.status(400).json({ error: 'Données invalides' });
  }
}
```

#### 5. 🟠 **Important : Headers de Sécurité**
**Fichier:** `vercel.json`
**Temps estimé:** 30 minutes
**Impact:** ⭐⭐⭐⭐

Ajouter la section `"headers"` avec CSP, HSTS, X-Frame-Options (voir section Sécurité)

#### 6. 🟡 **Moyen : Web Worker pour Conversion**
**Fichier:** `src/App.tsx`, `public/pdfWorker.js`
**Temps estimé:** 4 heures
**Impact:** ⭐⭐⭐

Déplacer la logique de conversion PDF dans un Web Worker pour ne pas bloquer l'UI

#### 7. 🟡 **Moyen : Support Tableaux Markdown**
**Fichier:** `src/App.tsx` (performConversion)
**Temps estimé:** 3 heures
**Impact:** ⭐⭐⭐

Ajouter parsing et rendu des tableaux Markdown (voir section Conversion)

#### 8. 🟡 **Moyen : Protection Brute Force Login**
**Fichier:** `src/lib/auth.ts`, nouvelle table SQL
**Temps estimé:** 2 heures
**Impact:** ⭐⭐⭐

Limiter tentatives de connexion à 5 par 15 minutes

#### 9. 🟡 **Moyen : Dark Mode**
**Fichiers:** `src/hooks/useDarkMode.ts`, `tailwind.config.js`
**Temps estimé:** 2 heures
**Impact:** ⭐⭐

Améliore confort utilisateur

#### 10. 🟡 **Moyen : Toasts au lieu d'Alerts**
**Fichier:** `src/App.tsx` et tous les composants
**Temps estimé:** 1 heure
**Impact:** ⭐⭐

```bash
npm install react-hot-toast
```

### 💡 Améliorations Bonus (Optionnelles)

#### 11. Support Images dans PDF
- Temps : 4h
- Impact : ⭐⭐

#### 12. Export DOCX/HTML
- Temps : 5h
- Impact : ⭐⭐

#### 13. Éditeur Markdown avec Syntax Highlighting
- Temps : 3h
- Impact : ⭐⭐

```bash
npm install @codemirror/lang-markdown @uiw/react-codemirror
```

#### 14. Sauvegarde Auto dans LocalStorage
- Temps : 1h
- Impact : ⭐

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('markdown_draft', markdown);
  }, 1000);
  
  return () => clearTimeout(timer);
}, [markdown]);
```

#### 15. Templates Markdown Prédéfinis
- Temps : 2h
- Impact : ⭐⭐

```typescript
const templates = {
  resume: '# Mon CV\n\n## Expérience\n...',
  blog: '# Titre de l\'article\n\n**Date:** ...',
  documentation: '# Documentation\n\n## Installation\n...'
};
```

---

## 📅 PLAN D'ACTION PRIORITAIRE

### 🚨 Phase 1 : Sécurité Critique (À faire IMMÉDIATEMENT)

**Durée estimée:** 2-3 heures

✅ **Étape 1.1 : Sécuriser .env** (30 min)
```bash
# Vérifier .gitignore
cat .gitignore | grep ".env"

# Si absent, ajouter
echo ".env" >> .gitignore
git rm --cached .env
git add .gitignore
git commit -m "chore: Ensure .env is not tracked"

# Créer .env.example
cp .env .env.example
# Remplacer valeurs par placeholders
git add .env.example
git commit -m "docs: Add .env.example template"

# Vérifier historique
git log --all --full-history -- .env
```

✅ **Étape 1.2 : Améliorer Tokens** (1h)
```bash
npm install uuid
```
Modifier `src/lib/auth.ts` - fonction `generateSessionToken()`

✅ **Étape 1.3 : Valider Entrées API** (1h)
```bash
npm install zod validator
```
Modifier tous les endpoints `api/*.ts`

### 🛡️ Phase 2 : Sécurité Avancée (Semaine 1)

**Durée estimée:** 1 jour

✅ **Étape 2.1 : Rate Limiting** (2h)
```bash
npm install @vercel/edge-rate-limit
```

✅ **Étape 2.2 : Headers de Sécurité** (30 min)
Modifier `vercel.json`

✅ **Étape 2.3 : Protection Brute Force** (2h)
Créer table `login_attempts` + fonction SQL

✅ **Étape 2.4 : Chiffrement localStorage** (1h)
```bash
npm install crypto-js
```

✅ **Étape 2.5 : CSRF Protection** (2h)
Créer `api/csrf-token.ts` + `src/lib/csrf.ts`

### ⚡ Phase 3 : Performance & UX (Semaine 2)

**Durée estimée:** 2-3 jours

✅ **Étape 3.1 : Web Worker PDF** (4h)

✅ **Étape 3.2 : Toasts Notifications** (1h)
```bash
npm install react-hot-toast
```

✅ **Étape 3.3 : Dark Mode** (2h)

✅ **Étape 3.4 : Loading States** (2h)

✅ **Étape 3.5 : Keyboard Shortcuts** (1h)

### 📄 Phase 4 : Amélioration Conversion (Semaine 3)

**Durée estimée:** 2 jours

✅ **Étape 4.1 : Support Tableaux** (3h)

✅ **Étape 4.2 : Support Images** (4h)

✅ **Étape 4.3 : Cache & Optimisation** (2h)

✅ **Étape 4.4 : Export Multi-formats** (5h)

### 🧪 Phase 5 : Tests & Monitoring (Semaine 4)

**Durée estimée:** 2-3 jours

✅ **Étape 5.1 : Tests Unitaires** (1 jour)
```bash
npm install --save-dev vitest @testing-library/react
```

✅ **Étape 5.2 : Logs Structurés** (2h)
```bash
npm install pino pino-pretty
```

✅ **Étape 5.3 : Monitoring Erreurs** (2h)
```bash
npm install @sentry/react @sentry/node
```

✅ **Étape 5.4 : Analytics Avancées** (1h)
Ajouter events custom dans Vercel Analytics

---

## 📊 CHECKLIST DE DÉPLOIEMENT

### Avant de Déployer en Production

#### Sécurité
- [ ] `.env` dans `.gitignore`
- [ ] `.env.example` créé
- [ ] Historique Git vérifié (pas de secrets)
- [ ] Tokens de session cryptographiques
- [ ] Rate limiting activé
- [ ] Headers de sécurité configurés
- [ ] Validation entrées API
- [ ] Protection brute force login

#### Performance
- [ ] Web Worker pour PDF (si gros documents)
- [ ] Images optimisées (compression)
- [ ] Code splitting activé
- [ ] Cache headers configurés

#### Monitoring
- [ ] Logs structurés (Pino ou Winston)
- [ ] Sentry ou Rollbar configuré
- [ ] Vercel Analytics activé
- [ ] Webhooks Stripe testés

#### Tests
- [ ] Tests unitaires clés (auth, conversion)
- [ ] Test E2E paiement Stripe
- [ ] Test responsive mobile
- [ ] Test accessibilité (WCAG AA)

#### Documentation
- [ ] README.md à jour
- [ ] CHANGELOG.md créé
- [ ] API documentation générée
- [ ] Guide déploiement écrit

---

## 🎯 CONCLUSION

### Résumé des Priorités

#### 🔴 CRITIQUE - À Faire Cette Semaine
1. Sécuriser `.env` (vérifier historique Git)
2. Améliorer génération tokens de session
3. Valider toutes les entrées API

#### 🟠 IMPORTANT - À Faire Ce Mois
1. Ajouter rate limiting
2. Configurer headers de sécurité
3. Implémenter Web Worker pour performance
4. Ajouter protection brute force login

#### 🟡 MOYEN - À Faire Ce Trimestre
1. Dark mode
2. Support tableaux Markdown
3. Support images dans PDF
4. Export multi-formats

### Score Final : **7.4/10** ⭐

Avec les améliorations proposées : **9.2/10** 🚀

---

**Généré le:** 15 Novembre 2025  
**Prochaine révision:** 15 Février 2026  
**Contact:** contact@stillinov.com
