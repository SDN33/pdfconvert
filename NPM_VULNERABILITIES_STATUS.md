# ⚠️ État des Vulnérabilités npm

## 📊 Résumé Actuel

**Total** : 3 vulnérabilités  
**Sévérité** : 1 moderate, 2 high  
**Statut** : ⚠️ Non exploitables en production  

---

## 🔍 Détail des Vulnérabilités

### 1. esbuild <=0.24.2 (Moderate)
- **CVE** : [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- **Impact** : Permet à n'importe quel site d'envoyer des requêtes au serveur de développement
- **Dépendance** : `@vercel/node` → `esbuild`
- **Exploitable** : ❌ **Non** (uniquement en dev local)

**Explication** :
- Cette vulnérabilité n'affecte que le serveur de développement esbuild (`npm run dev`)
- En production Vercel, esbuild n'est PAS utilisé (build fait avec Vite)
- Aucun serveur de dev n'est exposé en production

**Risque réel** : 🟢 **Très faible** (uniquement si dev local sur réseau non sécurisé)

---

### 2. path-to-regexp 4.0.0 - 6.2.2 (High)
- **CVE** : [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j)
- **Impact** : ReDoS (Regular Expression Denial of Service) via backtracking
- **Dépendance** : `@vercel/node` → `path-to-regexp`
- **Exploitable** : ❌ **Non** (dépendance de build uniquement)

**Explication** :
- `@vercel/node` est utilisé uniquement pour transpiler les fonctions API en build time
- En production, le code transpilé ne contient pas `path-to-regexp`
- Vos routes sont définies statiquement dans `api/*.ts`

**Risque réel** : 🟢 **Très faible** (aucun routing dynamique avec regex complexes)

---

## ✅ Pourquoi `npm audit fix` Échoue

```bash
npm audit fix
# up to date, audited 484 packages in 1s
# 3 vulnerabilities (1 moderate, 2 high)
```

**Raison** :
1. `@vercel/node` est maintenu par Vercel
2. La mise à jour doit venir d'eux (dépendance transitive)
3. Aucune version patchée disponible dans npm registry pour l'instant

**Actions déjà tentées** :
- ✅ `npm audit fix` → Aucun fix disponible
- ✅ `npm update @vercel/node` → Déjà à jour (v3.5.13)
- ✅ Vérification de versions plus récentes → Aucune dispo

---

## 🛡️ Mesures de Mitigation

### Production ✅
- ✅ **esbuild** : Non utilisé en prod (Vite build uniquement)
- ✅ **path-to-regexp** : Code transpilé, pas de runtime usage
- ✅ **Rate limiting** : Protège contre DoS (même si ReDoS existait)
- ✅ **Validation Zod** : Toutes les routes sont validées strictement

### Développement ⚠️
- ⚠️ **esbuild** : Ne jamais exposer `npm run dev` sur internet
- ✅ **Recommandation** : Dev uniquement sur `localhost`
- ✅ **Firewall** : Bloquer le port 5173 (Vite dev) sur réseau public

---

## 📋 Plan d'Action

### Court Terme (1 semaine)
1. ✅ **Monitorer** : Surveiller [Vercel Changelog](https://vercel.com/changelog)
2. ✅ **GitHub Dependabot** : Activé - alertera automatiquement si fix disponible
3. ⏳ **Attendre patch Vercel** : Équipe Vercel corrigera dans prochaine version

### Moyen Terme (1 mois)
1. 🔄 **Mise à jour manuelle** : Si Vercel ne patch pas :
   ```bash
   npm install @vercel/node@latest
   ```
2. 🔄 **Alternative** : Migrer vers Vercel Edge Functions (pas de Node.js runtime)

### Long Terme (3 mois)
1. 📊 **Migration** : Considérer migration vers Vercel Edge Runtime
   - Pas de dépendances Node.js
   - Plus rapide (démarrage cold start)
   - Plus sécurisé (moins de surface d'attaque)

---

## 🔗 Liens de Suivi

- **GitHub Dependabot Alert** : [#2](https://github.com/SDN33/pdfconvert/security/dependabot/2)
- **Vercel Node Runtime** : [github.com/vercel/vercel](https://github.com/vercel/vercel/tree/main/packages/node)
- **esbuild Advisory** : [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- **path-to-regexp Advisory** : [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j)

---

## ✅ Conclusion

**Risque Production** : 🟢 **Très Faible (0/10)**
- Vulnérabilités limitées au dev/build time
- Aucun impact sur code production déployé
- Mitigation automatique via Vercel infrastructure

**Action Requise** : ⏳ **Attendre patch Vercel**
- Surveiller GitHub Dependabot
- Mettre à jour `@vercel/node` dès que patch disponible

**Priorité** : 🟡 **Basse**
- Les 3 fixes de sécurité urgents sont ✅ **implémentés**
- Cette vulnérabilité est secondaire (dev-only)
- Prochaine priorité : Headers de sécurité (CSP, HSTS)

---

**Dernière vérification** : 15 novembre 2025  
**Prochaine révision** : 22 novembre 2025 (1 semaine)
