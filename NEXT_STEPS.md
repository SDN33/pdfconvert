# 🎯 PROCHAINES ACTIONS RECOMMANDÉES

## ⚡ URGENT (Aujourd'hui - 5 min)

### Configurer Upstash Redis pour Activer le Rate Limiting

**Pourquoi** : Le code de rate limiting est implémenté mais **désactivé** sans Upstash.

**Étapes** :
1. 📖 Ouvrir `UPSTASH_SETUP_GUIDE.md`
2. ⏱️ Suivre le guide (5 minutes)
3. ✅ Vérifier que le rate limiting fonctionne

**Impact** : Protection contre attaques DoS et brute force **activée**

---

## 🔒 IMPORTANT (Cette Semaine - 1h)

### 1. Ajouter les Headers de Sécurité HTTP (30 min)

**Fichier** : `vercel.json`

**Headers à ajouter** :
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://oohbiwmyoylbwgalmcgn.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Gain de score** : 8.5/10 → **9.0/10** (+0.5)

---

### 2. Vérifier l'Historique Git du .env (15 min)

**Commande** :
```bash
git log --all --full-history --pretty=format:"%H %s" -- .env
```

**Si vide** : ✅ Parfait, aucune fuite

**Si résultats** : ⚠️ URGENT
1. Régénérer **toutes** les clés Stripe et Supabase
2. Supprimer les commits avec BFG Repo-Cleaner
3. Force push après nettoyage

---

### 3. Optimiser le Bundle Size (2-3h)

**Problème** : Bundle principal = 863 KB (⚠️ trop gros)

**Solution** : Code splitting avec React.lazy()

**Fichier** : `src/App.tsx`

```typescript
// Ajouter en haut du fichier
import { lazy, Suspense } from 'react';

// Lazy loading des modals
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));

// Dans le JSX, wrapper avec Suspense
{showLoginModal && (
  <Suspense fallback={<div>Chargement...</div>}>
    <LoginModal 
      onClose={() => setShowLoginModal(false)}
      onLoginSuccess={handleLoginSuccess}
    />
  </Suspense>
)}
```

**Gain attendu** : 863 KB → 500-600 KB (-30%)

---

## 📊 MONITORING (1h)

### Configurer Vercel Analytics + Upstash Dashboard

**Vercel** :
1. Dashboard → Projet → Analytics
2. Activer Speed Insights (gratuit)
3. Configurer alertes (erreurs 5xx)

**Upstash** :
1. Dashboard → Metrics
2. Monitorer :
   - Requêtes/seconde
   - Rate limit hits
   - Latence

**Sentry (optionnel)** :
```bash
npm install @sentry/react
```

---

## 🛡️ SÉCURITÉ AVANCÉE (Optionnel - 1 jour)

### Migration vers Vercel Edge Runtime

**Avantages** :
- ✅ Plus rapide (cold start <50ms vs 200ms)
- ✅ Plus sécurisé (pas de Node.js runtime)
- ✅ Résout vulnérabilités npm automatiquement
- ✅ Moins coûteux (moins de CPU)

**Migration** :
```typescript
// api/create-checkout-session.ts
export const config = {
  runtime: 'edge',
};

// Remplacer imports Node.js par edge-compatible
import { Redis } from '@upstash/redis';
```

**Temps estimé** : 4-6 heures

---

## 📈 PERFORMANCE (2-3h)

### 1. Image Optimization

**Problème** : Logo en PNG (non optimisé)

**Solution** :
```bash
npm install sharp
npx sharp public/logo.png --resize 80x80 --webp -o public/logo.webp
```

**Fichier** : `src/App.tsx`
```tsx
<img 
  src="/logo.webp" 
  alt="Logo MarkdownEnPDF"
  width={80}
  height={80}
  loading="lazy"
/>
```

---

### 2. Preload Critical Assets

**Fichier** : `index.html`
```html
<head>
  <link rel="preload" href="/logo.webp" as="image">
  <link rel="preconnect" href="https://oohbiwmyoylbwgalmcgn.supabase.co">
  <link rel="preconnect" href="https://api.stripe.com">
</head>
```

---

### 3. Service Worker pour Cache

```bash
npm install workbox-webpack-plugin
```

**Objectif** : PDF précédemment générés en cache → Offline support

---

## 🧪 TESTS (1-2 jours)

### Tests Unitaires avec Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Tester** :
- ✅ Validation Zod schemas
- ✅ Génération tokens (uuid v4)
- ✅ Rate limiting logic
- ✅ Markdown parsing

**Fichier** : `src/__tests__/auth.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { generateSessionToken } from '../lib/auth';

describe('Session Token Generation', () => {
  it('should generate unique tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).not.toBe(token2);
  });

  it('should match uuid v4 format', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^\d+_[0-9a-f-]{36}$/);
  });
});
```

---

## 📋 CHECKLIST GLOBALE

### Sécurité ✅ FAIT
- [x] Tokens sécurisés (uuid v4)
- [x] Validation Zod
- [x] Rate limiting implémenté
- [ ] ⏳ Upstash configuré (5 min)
- [ ] Headers HTTP sécurité (30 min)
- [ ] Audit Git .env (15 min)

### Performance ⏳ À FAIRE
- [ ] Code splitting (2-3h)
- [ ] Image optimization (30 min)
- [ ] Preload assets (15 min)
- [ ] Service Worker cache (1h)

### Monitoring ⏳ À FAIRE
- [ ] Vercel Analytics (15 min)
- [ ] Upstash Dashboard (15 min)
- [ ] Sentry error tracking (30 min)
- [ ] Alertes configurées (30 min)

### Tests ⏳ FUTUR
- [ ] Tests unitaires (1 jour)
- [ ] Tests e2e Playwright (2 jours)
- [ ] CI/CD GitHub Actions (1h)

---

## 🎯 ROADMAP RECOMMANDÉE

### Semaine 1
1. ⚡ **Upstash** (5 min)
2. 🔒 **Headers sécurité** (30 min)
3. 🔍 **Audit Git** (15 min)
4. 📊 **Monitoring** (1h)

**Total** : ~2h

### Semaine 2
5. ⚡ **Code splitting** (2-3h)
6. 🖼️ **Image optimization** (30 min)
7. 🚀 **Preload assets** (15 min)

**Total** : ~3-4h

### Mois 1
8. 🧪 **Tests unitaires** (1-2 jours)
9. 🛡️ **Edge Runtime migration** (1 jour)

**Total** : ~3-4 jours

---

## 📞 SUPPORT

**Questions** ? Consultez :
- 📖 `SECURITY_SUMMARY.md` (vue d'ensemble)
- 📖 `UPSTASH_SETUP_GUIDE.md` (configuration Redis)
- 📖 `SECURITY_IMPROVEMENTS.md` (détails techniques)
- 📖 `AUDIT_COMPLET.md` (audit initial)

---

**Dernière mise à jour** : 15 novembre 2025  
**Statut** : 3/3 actions urgentes ✅ | Upstash ⏳ | Headers 📋
