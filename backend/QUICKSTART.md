# 🚀 Quick Start Guide - ExpenseTracker Pro Backend

Guide rapide pour démarrer le backend en 5 minutes.

## ⚡ Installation Rapide

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm run dev
```

Le serveur démarre sur **http://localhost:5000** 🎉

## ✅ Vérifier que ça fonctionne

Ouvrez votre navigateur ou utilisez curl:

```bash
# Test de santé
curl http://localhost:5000/health

# Réponse attendue:
{
  "success": true,
  "message": "ExpenseTracker Pro API is running",
  "version": "1.0.0"
}
```

## 📝 Premiers Tests

### 1. Voir les catégories par défaut

```bash
curl http://localhost:5000/api/categories
```

Vous verrez les 13 catégories par défaut (Food & Dining, Transportation, etc.)

### 2. Créer une dépense

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50,
    "date": "2025-01-18",
    "categoryId": 1,
    "description": "Coffee and breakfast",
    "paymentMethod": "Card"
  }'
```

### 3. Voir toutes les dépenses

```bash
curl http://localhost:5000/api/expenses
```

### 4. Créer un budget mensuel

```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "categoryId": 1,
    "month": 1,
    "year": 2025
  }'
```

### 5. Voir le statut du budget

```bash
curl http://localhost:5000/api/budgets/status
```

Vous verrez si vous êtes dans la zone normale, warning (>80%), ou exceeded (>100%)

## 🎨 Tester avec le Frontend

Le frontend React est configuré pour utiliser `http://localhost:4028`. Le backend utilise le port 5000.

Pour connecter le frontend au backend:

1. Démarrer le backend: `npm run dev` (dans /backend)
2. Démarrer le frontend: `npm start` (dans /frontend)
3. Configurer axios dans le frontend pour pointer vers `http://localhost:5000/api`

## 🔐 Activer la Protection par Mot de Passe (Optionnel)

```bash
# 1. Activer la protection
curl -X POST http://localhost:5000/api/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{
    "password": "MonMotDePasseSecurise123!",
    "confirmPassword": "MonMotDePasseSecurise123!"
  }'

# 2. Se connecter
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "MonMotDePasseSecurise123!"}'

# Vous recevrez un token JWT

# 3. Utiliser le token pour les requêtes
curl http://localhost:5000/api/expenses \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

## 💾 Créer un Backup

```bash
# Créer une sauvegarde
curl -X POST http://localhost:5000/api/backup/create

# Lister les sauvegardes
curl http://localhost:5000/api/backup/list
```

## 📊 Endpoints Analytics

```bash
# Dashboard
curl http://localhost:5000/api/analytics/dashboard

# Graphique en camembert (répartition par catégorie)
curl http://localhost:5000/api/analytics/pie-chart

# Graphique en barres (comparaison mensuelle)
curl http://localhost:5000/api/analytics/bar-chart

# Graphique linéaire (tendances)
curl http://localhost:5000/api/analytics/line-chart
```

## 📥 Exporter des Données

```bash
# Exporter en CSV
curl http://localhost:5000/api/reports/export/csv > expenses.csv

# Avec filtrage par dates
curl "http://localhost:5000/api/reports/export/csv?startDate=2025-01-01&endDate=2025-01-31" > january_expenses.csv
```

## 🛠️ Configuration Avancée

Éditez le fichier `.env` pour personnaliser:

```env
# Changer le port
PORT=3000

# Activer l'encryption des backups
ENCRYPTION_ENABLED=true
ENCRYPTION_KEY=votre-cle-32-caracteres-ici

# Changer la devise par défaut
DEFAULT_CURRENCY=EUR

# Changer le thème par défaut
DEFAULT_THEME=dark
```

## 🔍 Déboguer

```bash
# Voir les logs en temps réel
tail -f logs/app.log

# Voir les erreurs
tail -f logs/error.log
```

## 📁 Structure des Fichiers Créés

Après le premier lancement, vous verrez:

```
backend/
├── database/
│   └── expensetracker.db    # Base de données SQLite
├── backups/                  # Sauvegardes
├── logs/
│   ├── app.log              # Logs généraux
│   └── error.log            # Logs d'erreurs
└── exports/
    ├── pdf/                 # Exports PDF
    └── csv/                 # Exports CSV
```

## ⚠️ Problèmes Courants

### Port déjà utilisé
```bash
# Changer le port dans .env
PORT=3000
```

### Base de données verrouillée
```bash
# Redémarrer le serveur
# Ctrl+C puis npm run dev
```

### Module non trouvé
```bash
# Réinstaller
rm -rf node_modules
npm install
```

## 🎯 Prochaines Étapes

1. ✅ Le backend fonctionne
2. 📱 Intégrer avec le frontend React
3. 🔐 Activer la protection par mot de passe si nécessaire
4. 💾 Configurer des backups automatiques
5. 🎨 Personnaliser les catégories
6. 📊 Explorer les analytics

## 📚 Plus d'Informations

- `README.md` - Documentation complète
- `API_EXAMPLES.md` - Exemples d'API détaillés
- Diagrammes UML dans le dossier parent

Bon développement! 🚀
