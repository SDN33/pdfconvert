# 🚀 Guide de Configuration Upstash Redis (Rate Limiting)

## Pourquoi Upstash ?

Upstash Redis est nécessaire pour activer le **rate limiting** sur vos API endpoints. Sans rate limiting, votre application est vulnérable aux :
- 🚨 Attaques par force brute
- 🚨 Attaques DoS (Denial of Service)
- 🚨 Credential stuffing
- 🚨 Abus de l'API Stripe

**Coût** : **GRATUIT** (Free tier : 10,000 requêtes/jour - largement suffisant)

---

## 📋 Étapes d'Installation

### 1. Créer un compte Upstash (2 minutes)

1. Allez sur [upstash.com](https://upstash.com/)
2. Cliquez sur **"Get Started Free"**
3. Inscrivez-vous avec :
   - Email
   - Ou GitHub (recommandé - plus rapide)
   - Ou Google

### 2. Créer une base Redis (1 minute)

1. Une fois connecté, cliquez sur **"Create Database"**
2. Configurez :
   - **Name** : `pdfconvert-ratelimit` (ou n'importe quel nom)
   - **Type** : `Regional` (plus rapide)
   - **Region** : Choisissez la plus proche de votre région Vercel
     - EU : `eu-west-1` (Irlande)
     - US : `us-east-1` (Virginie)
     - APAC : `ap-southeast-1` (Singapour)
   - **TLS** : ✅ Activé (par défaut)
   - **Eviction** : `allkeys-lru` (par défaut)

3. Cliquez sur **"Create"**

### 3. Copier les Credentials (30 secondes)

Une fois la base créée, vous verrez deux informations importantes :

```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

**Option 1** : Copie manuelle
- Cliquez sur l'icône 👁️ pour révéler le token
- Copiez les deux valeurs

**Option 2** : Copie automatique
- Cliquez sur l'onglet **"REST API"**
- Cliquez sur **"Copy"** à côté de **".env format"**

### 4. Ajouter à Vercel (1 minute)

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `pdfconvert`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les deux variables :

| Key | Value |
|-----|-------|
| `UPSTASH_REDIS_REST_URL` | `https://YOUR-DB.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `AZa...` (votre token) |

5. **Scope** : Sélectionnez **Production**, **Preview**, **Development**
6. Cliquez sur **"Save"**

### 5. Ajouter au fichier .env local (optionnel - pour dev)

Si vous voulez tester le rate limiting en local :

```bash
# Dans /Users/stephane/Documents/pdfconvert/.env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZa...votre_token
```

⚠️ **Attention** : Ne commitez JAMAIS ce fichier !

---

## ✅ Vérification

### Test 1 : Vérifier le déploiement

1. Attendez que Vercel redéploie (automatique après le push)
2. Vérifiez les logs Vercel :
   - Aucun message d'erreur concernant Upstash
   - Déploiement réussi ✅

### Test 2 : Tester le rate limiting

```bash
# Remplacez par votre domaine
DOMAIN="https://markdownenpdf.com"

# Faire 15 requêtes rapides (limite = 10/min)
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST "$DOMAIN/api/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","priceId":"price_test"}' \
    -i | grep -E "HTTP|X-RateLimit|error"
  echo "---"
done
```

**Résultat attendu** :
- Requêtes 1-10 : `200 OK` avec headers `X-RateLimit-Remaining`
- Requêtes 11+ : `429 Too Many Requests` avec message "Trop de requêtes"

### Test 3 : Vérifier les headers

```bash
curl -I https://markdownenpdf.com/api/create-checkout-session
```

Vous devriez voir :
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1731632400
```

---

## 🔧 Dépannage

### Erreur : "Redis connection failed"

**Cause** : Variables Upstash non configurées dans Vercel

**Solution** :
1. Vérifiez que les variables sont dans Vercel Settings
2. Redéployez : `git commit --allow-empty -m "Redeploy" && git push`

### Erreur : "Invalid credentials"

**Cause** : Token Upstash incorrect

**Solution** :
1. Retournez sur Upstash Dashboard
2. Régénérez le token (onglet **"REST API"** → **"Rotate Token"**)
3. Mettez à jour dans Vercel

### Rate limiting ne fonctionne pas

**Diagnostic** :
```bash
# Vérifiez que les variables existent en production
vercel env ls
```

**Solution** : Si absentes, ajoutez-les via Vercel Dashboard

---

## 💡 Limites du Free Tier

| Métrique | Limite Gratuite | Dépassement |
|----------|-----------------|-------------|
| Requêtes/jour | 10,000 | $0.20 par 100K |
| Stockage | 256 MB | $0.25 par GB/mois |
| Bande passante | 200 MB/jour | $0.15 par GB |
| Concurrent connections | 1,000 | - |

**Pour pdfconvert** :
- Avec 10 req/min = 14,400 req/jour → **Payant** (~$0.88/mois)
- Avec 5 req/min = 7,200 req/jour → **Gratuit**

**Recommandation** : Commencez gratuit, upgradez si nécessaire ($2/mois pour 200K req/jour).

---

## 📊 Monitoring

### Dashboard Upstash

1. Allez sur [console.upstash.com](https://console.upstash.com/)
2. Sélectionnez votre base `pdfconvert-ratelimit`
3. Onglet **"Metrics"** :
   - Graphique des requêtes/seconde
   - Utilisation mémoire
   - Latence moyenne

### Vercel Logs

```bash
vercel logs --follow
```

Recherchez :
- `Rate limit exceeded` : Attaque détectée ✅
- `Redis error` : Problème de connexion ⚠️

---

## 🎯 Prochaines Étapes

Après configuration Upstash :

1. ✅ **Tester** le rate limiting (voir section Vérification)
2. 🔒 **Ajouter headers de sécurité** (CSP, HSTS) dans `vercel.json`
3. 🐛 **Fixer npm vulnerabilities** : `npm audit fix`
4. 📈 **Monitorer** les métriques Upstash pendant 7 jours
5. 🎨 **Optimiser bundle size** (code splitting) - 863kB → <500kB

---

**Temps total** : ~5 minutes  
**Coût** : GRATUIT (jusqu'à 10K req/jour)  
**Impact sécurité** : +2.0 points (6.5 → 8.5)

---

## 📞 Support

- **Upstash Docs** : [docs.upstash.com/redis](https://docs.upstash.com/redis)
- **Discord Upstash** : [discord.gg/w9SenAtbme](https://discord.gg/w9SenAtbme)
- **Vercel Support** : [vercel.com/support](https://vercel.com/support)
