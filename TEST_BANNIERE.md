# 🎯 Guide de Test - Nouvelle Bannière Premium

## ✅ Ce qui a été implémenté

### 1. **Bannière Premium Repositionnée** 
- ✅ Déplacée **sous l'éditeur** (après le bouton de téléchargement)
- ✅ Design **plus compact et élégant**
- ✅ Moins imposante visuellement

### 2. **Détecteur IP Intégré**
- ✅ Récupération automatique de l'IP au chargement via `api.ipify.org`
- ✅ Affichage de l'IP avec bouton "Voir mon IP" (click pour afficher/masquer)
- ✅ Icône globe pour indiquer le tracking IP

### 3. **Compteur Intelligent**
- ✅ Actif **UNIQUEMENT** pour les utilisateurs non-premium
- ✅ Récupération du nombre de conversions au chargement
- ✅ Mise à jour en temps réel après chaque conversion
- ✅ Affichage visuel avec pastilles ✓/✗ (2/2)

### 4. **Logique Premium**
- ✅ Utilisateurs premium : **aucune limite**, pas de tracking IP
- ✅ Utilisateurs gratuits : **2 conversions max par 24h**
- ✅ Enregistrement dans Supabase **seulement si non-premium**

## 🎨 Design de la Nouvelle Bannière

### Version Non-Premium (Gratuit)
```
┌─────────────────────────────────────────────────────┐
│ 🎯 Conversions gratuites [2/2 restantes]          │
│                                                     │
│ ✓ ✓  par 24h                                      │
│ 🌐 Voir mon IP                                     │
│                                                     │
│ [🚀 Illimité 2,99€]  [Connexion]                  │
└─────────────────────────────────────────────────────┘
```

### Version Premium (Connecté)
```
┌─────────────────────────────────────────────────────┐
│ ✨ Premium Actif                    [Déconnexion]  │
│ user@email.com • Conversions illimitées ♾️        │
└─────────────────────────────────────────────────────┘
```

## 🧪 Scénarios de Test

### Test 1 : Utilisateur Gratuit (Première fois)
1. **Ouvrir** le site
2. **Observer** :
   - IP récupérée automatiquement
   - Bannière affiche "2/2 restantes"
   - Pastilles vertes ✓✓
3. **Convertir** un document
4. **Vérifier** :
   - Compteur passe à "1/2 restantes"
   - Une pastille devient grise ✓✗
5. **Convertir** à nouveau
6. **Vérifier** :
   - Compteur à "0/2 restantes"
   - Les deux pastilles grises ✗✗
7. **Convertir** une 3ème fois
8. **Résultat attendu** :
   - ❌ Modal "Limite atteinte" s'affiche
   - Proposition d'upgrade ou connexion

### Test 2 : Affichage IP
1. Bannière affiche "Voir mon IP"
2. **Cliquer** sur le lien
3. **Vérifier** : IP s'affiche (ex: "IP: 123.45.67.89")
4. **Re-cliquer** : IP se cache à nouveau

### Test 3 : Utilisateur Premium
1. **Cliquer** "Connexion" dans la bannière
2. **Entrer** email premium valide
3. **Se connecter**
4. **Observer** :
   - Bannière devient **verte**
   - Affiche "✨ Premium Actif"
   - Email affiché
   - "Conversions illimitées ♾️"
5. **Convertir** plusieurs fois
6. **Vérifier** :
   - Aucune limite
   - Pas de modal
   - Pas d'enregistrement dans `conversion_logs`

### Test 4 : Déconnexion Premium
1. En étant connecté premium
2. **Cliquer** "Déconnexion"
3. **Observer** :
   - Bannière redevient **blanche/orange**
   - Compteur réapparaît
   - Limites réactivées

### Test 5 : Persistance Compteur
1. Faire 1 conversion
2. **Fermer** le navigateur
3. **Réouvrir** le site
4. **Vérifier** :
   - Compteur affiche "1/2 restantes"
   - IP identique
   - Limite persiste

### Test 6 : Reset 24h
1. Dans Supabase, **modifier** la date d'une conversion
2. Mettre `converted_at` à plus de 24h dans le passé
3. **Recharger** la page
4. **Vérifier** :
   - Compteur se réinitialise à "2/2"
   - Anciennes conversions ignorées

## 📊 Vérifications Supabase

### Table `conversion_logs`
```sql
-- Voir les conversions récentes
SELECT * FROM conversion_logs 
ORDER BY converted_at DESC 
LIMIT 10;

-- Compter conversions par IP
SELECT ip_address, COUNT(*) as conversions
FROM conversion_logs
WHERE converted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address;
```

### Table `premium_users`
```sql
-- Vérifier les utilisateurs premium
SELECT email, is_lifetime, purchased_at 
FROM premium_users 
WHERE is_lifetime = true;
```

## 🎯 Comportements Attendus

| Scénario | IP Tracking | Compteur Visible | Limite | Logs Supabase |
|----------|-------------|------------------|--------|---------------|
| Gratuit (0 conv) | ✅ Oui | ✅ 2/2 | ✅ 2 max | ✅ Enregistré |
| Gratuit (1 conv) | ✅ Oui | ✅ 1/2 | ✅ 1 rest | ✅ Enregistré |
| Gratuit (2 conv) | ✅ Oui | ✅ 0/2 | ❌ Bloqué | ❌ Refusé |
| Premium connecté | ❌ Non | ✅ Badge vert | ♾️ Illimité | ❌ Pas loggé |

## 🚨 Points de Vigilance

### Sécurité
- ✅ IP récupérée côté client (api.ipify.org)
- ✅ Validation dans Supabase
- ✅ RLS activé sur les tables
- ⚠️ Possible de contourner avec VPN (acceptable pour freemium)

### UX
- ✅ Bannière discrète sous l'éditeur
- ✅ Ne gêne pas la conversion
- ✅ Visible après avoir utilisé l'outil
- ✅ CTA clairs : "Illimité 2,99€" + "Connexion"

### Performance
- ✅ 1 seul appel IP au chargement
- ✅ Mise à jour compteur après conversion
- ✅ Pas de polling inutile
- ✅ Cache dans localStorage pour email premium

## 📱 Responsive

### Desktop
```
[Éditeur Markdown] [Aperçu]
[Télécharger en PDF]
┌────────────────────────┐
│ 🎯 Conversions: 2/2   │
│ [Illimité] [Connexion] │
└────────────────────────┘
```

### Mobile
```
[Éditeur Markdown]
[Aperçu]
[Télécharger en PDF]
┌──────────────────┐
│ 🎯 Conv: 2/2    │
│ [Illimité]      │
│ [Connexion]     │
└──────────────────┘
```

## ✅ Checklist Finale

- [ ] Bannière positionnée sous l'éditeur
- [ ] IP détectée et affichée (click to show)
- [ ] Compteur 2/2 au premier chargement
- [ ] Décrémente après conversion (gratuit)
- [ ] Bloque à 0/2 avec modal upgrade
- [ ] Premium : bannière verte, pas de limite
- [ ] Premium : pas de logs dans Supabase
- [ ] Déconnexion fonctionne
- [ ] Responsive mobile/desktop
- [ ] Pas d'erreurs console

## 🚀 Commandes Utiles

```bash
# Lancer le dev
npm run dev

# Voir les logs en temps réel (dans la console du navigateur)
# Network tab → api.ipify.org (IP fetch)
# Supabase → conversion_logs (après conversion)

# Tester avec différentes IPs
# → Utiliser VPN ou mode navigation privée
```

## 🎉 Résultat Final

**Avant** : Bannière orange ÉNORME en haut, difficile à ignorer
**Après** : Bannière **élégante et compacte** sous l'éditeur, avec :
- ✅ Détecteur IP intégré
- ✅ Compteur intelligent (seulement pour gratuit)
- ✅ Design minimaliste
- ✅ CTA efficaces
- ✅ Logique premium parfaite

---

🎯 **Tout est prêt pour tester !**
