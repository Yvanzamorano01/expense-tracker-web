# ExpenseTracker Pro - Backend API

Backend API pour l'application Offline Expense Tracker Pro. Construit avec Node.js, Express, TypeScript, et SQLite.

## 🚀 Caractéristiques

- ✅ **API RESTful complète** avec tous les endpoints CRUD
- ✅ **SQLite** - Base de données locale (offline-first)
- ✅ **TypeScript** - Type safety et meilleure DX
- ✅ **JWT Authentication** - Protection par mot de passe optionnelle
- ✅ **Encryption AES-256** - Pour DB et backups
- ✅ **Budget Alerts** - Alertes à 80% et 100%
- ✅ **Export CSV** - Export des dépenses
- ✅ **Backup/Restore** - Sauvegarde et restauration
- ✅ **Analytics** - Tableaux de bord et graphiques
- ✅ **Validation** - Validation complète des données avec Joi
- ✅ **Error Handling** - Gestion d'erreurs centralisée
- ✅ **Logging** - Logs avec Winston

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0

## 🛠️ Installation

```bash
# 1. Naviguer dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (copier depuis .env.example)
cp .env.example .env

# 4. (Optionnel) Modifier les variables d'environnement dans .env
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du dossier backend :

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_PATH=./database/expensetracker.db
DATABASE_BACKUP_PATH=./backups

# JWT
JWT_SECRET=votre-secret-jwt-unique-et-securise
JWT_EXPIRES_IN=7d

# Encryption (optionnel)
ENCRYPTION_ENABLED=false
ENCRYPTION_KEY=

# Security
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME=15

# Defaults
DEFAULT_CURRENCY=USD
DEFAULT_THEME=light
DEFAULT_DATE_FORMAT=MM/DD/YYYY
```

## 🏃 Démarrage

```bash
# Mode développement (avec hot reload)
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Run tests
npm test
```

Le serveur démarrera sur `http://localhost:5000`

## 📡 API Endpoints

### Authentication

```
GET    /api/auth/status                  # Check auth status
POST   /api/auth/setup-password          # Setup password protection
POST   /api/auth/login                   # Login
GET    /api/auth/verify                  # Verify token
PUT    /api/auth/change-password         # Change password
DELETE /api/auth/password-protection     # Disable password protection
```

### Expenses

```
GET    /api/expenses                     # Get all expenses
GET    /api/expenses/:id                 # Get expense by ID
POST   /api/expenses                     # Create expense
PUT    /api/expenses/:id                 # Update expense
DELETE /api/expenses/:id                 # Delete expense
GET    /api/expenses/search              # Search expenses
GET    /api/expenses/date-range          # Get by date range
GET    /api/expenses/summary             # Get summary
```

### Categories

```
GET    /api/categories                   # Get all categories
GET    /api/categories/:id               # Get category by ID
POST   /api/categories                   # Create category
PUT    /api/categories/:id               # Update category
DELETE /api/categories/:id               # Delete category
GET    /api/categories/:id/total         # Get category total
GET    /api/categories/:id/stats         # Get category stats
```

### Budgets

```
GET    /api/budgets                      # Get all budgets
GET    /api/budgets/:id                  # Get budget by ID
POST   /api/budgets                      # Create budget
PUT    /api/budgets/:id                  # Update budget
DELETE /api/budgets/:id                  # Delete budget
GET    /api/budgets/current              # Get current month
GET    /api/budgets/status               # Get budget status
GET    /api/budgets/alerts               # Get active alerts
```

### Analytics

```
GET    /api/analytics/dashboard          # Dashboard summary
GET    /api/analytics/pie-chart          # Category distribution
GET    /api/analytics/bar-chart          # Monthly comparison
GET    /api/analytics/line-chart         # Trend analysis
```

### Reports

```
POST   /api/reports/generate             # Generate report
GET    /api/reports/export/csv           # Export to CSV
GET    /api/reports/export/pdf           # Export to PDF (coming soon)
```

### Backup

```
POST   /api/backup/create                # Create backup
POST   /api/backup/restore               # Restore backup
GET    /api/backup/list                  # List backups
DELETE /api/backup/:filename             # Delete backup
```

### Settings

```
GET    /api/settings                     # Get user settings
PUT    /api/settings                     # Update settings
```

## 📝 Exemples d'Utilisation

### Créer une dépense

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45.50,
    "date": "2025-01-15",
    "categoryId": 1,
    "description": "Lunch at restaurant",
    "paymentMethod": "Card"
  }'
```

### Créer un budget

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

### Obtenir le statut des budgets

```bash
curl http://localhost:5000/api/budgets/status?month=1&year=2025
```

## 🔐 Authentification

### Sans protection par mot de passe
Par défaut, l'API est accessible sans authentification.

### Avec protection par mot de passe

1. **Activer la protection** :
```bash
curl -X POST http://localhost:5000/api/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{
    "password": "votre-mot-de-passe",
    "confirmPassword": "votre-mot-de-passe"
  }'
```

2. **Se connecter** :
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "votre-mot-de-passe"
  }'
```

Réponse :
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

3. **Utiliser le token** :
```bash
curl http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗂️ Structure du Projet

```
backend/
├── src/
│   ├── config/           # Configuration (DB, encryption, env)
│   ├── controllers/      # Contrôleurs (logique métier)
│   ├── models/           # Modèles Sequelize
│   ├── routes/           # Définition des routes
│   ├── middleware/       # Middlewares (auth, validation, errors)
│   ├── utils/            # Utilitaires (logger, seeders)
│   └── app.ts            # Application Express
├── database/             # Base de données SQLite
├── backups/              # Sauvegardes
├── logs/                 # Fichiers de logs
├── package.json
├── tsconfig.json
└── .env
```

## 📊 Modèle de Données

### Expense
- expenseId (PK)
- amount
- date
- categoryId (FK)
- description
- paymentMethod
- userId (FK)
- createdAt, updatedAt

### Category
- categoryId (PK)
- name (unique)
- color
- isDefault
- icon

### Budget
- budgetId (PK)
- amount
- categoryId (FK, nullable)
- month
- year
- userId (FK)

### User
- userId (PK)
- username
- passwordHash (nullable)
- currency
- theme
- isPasswordProtected
- dateFormat

## 🧪 Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🔧 Développement

```bash
# Linter
npm run lint

# Formatter
npm run format

# Build
npm run build
```

## 📦 Scripts Disponibles

- `npm run dev` - Démarre le serveur en mode développement
- `npm run build` - Build le projet TypeScript
- `npm start` - Démarre le serveur en production
- `npm test` - Exécute les tests
- `npm run lint` - Vérifie le code avec ESLint
- `npm run format` - Formate le code avec Prettier

## 🐛 Résolution de Problèmes

### Erreur: "Database locked"
- Fermer toutes les connexions à la base de données
- Redémarrer le serveur

### Erreur: "EADDRINUSE"
- Le port 5000 est déjà utilisé
- Changer le PORT dans `.env`
- Ou tuer le processus: `lsof -ti:5000 | xargs kill`

### Erreur: "Module not found"
- Réinstaller les dépendances: `rm -rf node_modules && npm install`

## 📈 Performance

- Répond en < 2 secondes pour 95% des opérations (NFR-P1)
- Supporte jusqu'à 50,000 enregistrements (NFR-SC1)
- Indexation optimale de la base de données
- Requêtes SQL optimisées avec Sequelize

## 🔒 Sécurité

- **Encryption AES-256** pour DB et backups (NFR-S1, NFR-S4)
- **Password hashing** avec bcrypt (NFR-S2)
- **SQL Injection prevention** avec parameterized queries (NFR-S3)
- **Rate limiting** sur login (3 tentatives max)
- **JWT tokens** pour authentification
- **Helmet.js** pour headers de sécurité

## 📚 Documentation Technique

Pour plus de détails sur l'architecture et les diagrammes UML, consultez :
- `diagrams_viewer.html` - Diagrammes UML interactifs
- `class_diagram.mermaid` - Diagramme de classes
- `sequence_diagrams.mermaid` - Diagrammes de séquence
- `SRS_Offline_Expense_Tracker.md` - Spécifications complètes

## 🤝 Contribution

Ce projet suit les spécifications du SRS (Software Requirements Specification) et implémente tous les functional requirements (FR-x.x) et non-functional requirements (NFR-x.x).

## 📄 Licence

MIT

## 👤 Auteur

Développé dans le cadre du projet RHI405 - Design Project

---

**Note**: Ce backend est conçu pour fonctionner en mode offline-first avec SQLite. Pour une utilisation en production avec plusieurs utilisateurs, envisagez PostgreSQL ou MySQL.
