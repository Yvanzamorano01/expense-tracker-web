# Diagrammes UML - ExpenseTracker Pro

Ce document contient tous les diagrammes UML du système ExpenseTracker Pro en format Mermaid.

**Comment visualiser ces diagrammes:**
1. **VS Code**: Installer l'extension "Markdown Preview Mermaid Support"
2. **En ligne**: Copier le code sur [mermaid.live](https://mermaid.live)
3. **GitHub/GitLab**: Les diagrammes s'affichent automatiquement

---

## Table des Matières

1. [Class Diagram](#1-class-diagram)
2. [Use Case Diagram](#2-use-case-diagram)
3. [Sequence Diagrams](#3-sequence-diagrams)
   - [3.1 Add Expense](#31-add-expense)
   - [3.2 Generate Report and Export](#32-generate-report-and-export)
   - [3.3 View Budget with Status Alert](#33-view-budget-with-status-alert)
   - [3.4 Backup and Restore Data](#34-backup-and-restore-data)
   - [3.5 Search and Filter Expenses](#35-search-and-filter-expenses)

---

## 1. CLASS DIAGRAM

Ce diagramme représente les entités principales du système et leurs relations.

### Entités Principales
- **User**: Utilisateur du système avec ses préférences
- **Expense**: Dépense avec montant, catégorie, date
- **Category**: Catégorie de dépense avec couleur et icône
- **Budget**: Budget mensuel par catégorie

### Services et Utilitaires
- **StorageHelpers**: Gestion de la persistance (API)
- **DataHelpers**: Calculs et statistiques
- **CurrencyHelpers**: Conversion de devises
- **ReportGenerator**: Génération de rapports
- **NotificationHelpers**: Gestion des notifications

```mermaid
classDiagram
    class User {
        +int userId
        +string username
        +string passwordHash
        +string currency
        +string theme
        +boolean isPasswordProtected
        +string dateFormat
        +datetime createdAt
        +datetime updatedAt
        +authenticate(password) boolean
        +setPassword(password) void
        +updateSettings(settings) void
        +getSettings() object
    }

    class Expense {
        +int expenseId
        +decimal amount
        +date date
        +int categoryId
        +string description
        +string paymentMethod
        +string originalCurrency
        +string location
        +boolean isRecurring
        +string recurringFrequency
        +int userId
        +datetime createdAt
        +datetime updatedAt
        +getExpenseById(id) Expense
        +getAllExpenses(userId, limit, offset) Expense[]
        +getExpensesByDateRange(start, end) Expense[]
        +getExpensesByCategory(categoryId) Expense[]
        +searchExpenses(searchTerm) Expense[]
        +getTotalAmount(expenses) decimal
    }

    class Category {
        +int categoryId
        +string name
        +string color
        +boolean isDefault
        +string icon
        +datetime createdAt
        +datetime updatedAt
        +getAllCategories() Category[]
        +getCategoryById(id) Category
        +getTotalSpentByCategory(month, year) decimal
        +canDelete() boolean
    }

    class Budget {
        +int budgetId
        +decimal amount
        +int categoryId
        +int month
        +int year
        +int userId
        +string originalCurrency
        +datetime createdAt
        +datetime updatedAt
        +getBudgetByCategory(categoryId, month, year) Budget
        +getAllBudgets(month, year) Budget[]
        +getSpentAmount() decimal
        +getRemainingAmount() decimal
        +getPercentageUsed() decimal
        +isOverBudget() boolean
        +isWarningThreshold() boolean
        +getStatus() object
    }

    class StorageHelpers {
        <<service>>
        +loadExpenses() Expense[]
        +saveExpense(expense) Expense
        +updateExpense(id, updates) Expense
        +deleteExpense(id) void
        +loadCategories() Category[]
        +saveCategories(categories) void
        +loadBudgets(month, year) Budget[]
        +saveBudget(data, existingId) Budget
        +deleteBudget(id) void
        +loadSettings() object
        +saveSettings(settings) void
    }

    class DataHelpers {
        <<utility>>
        +calculateStats(expenses) object
        +getCategoryStats(categories, expenses) object
        +getCategoryInfo(categoryId, categories) Category
        +calculateTrendData(expenses, period) object
        +getMonthlyExpenses(expenses) Expense[]
        +getExpensesByPeriod(expenses, period) Expense[]
        +isDataCleared() boolean
    }

    class CurrencyHelpers {
        <<utility>>
        +getExchangeRates() object
        +setExchangeRates(rates) void
        +convertCurrency(amount, from, to) decimal
        +convertExpenseAmount(expense, target) decimal
        +formatCurrency(amount, currency) string
        +getCurrentCurrency() string
        +getCurrencySymbol(currency) string
    }

    class ReportGenerator {
        <<service>>
        +generateReportData(config, expenses, categories) object
        +exportToPDF(reportData, config, charts) void
        +exportToCSV(reportData, config) void
        +exportToJSON(reportData, config) void
    }

    class NotificationHelpers {
        <<utility>>
        +createNotification(title, message, type) object
        +getNotificationSettings() object
        +shouldShowDailyReminder() boolean
        +shouldShowWeeklyReport() boolean
    }

    User "1" --> "*" Expense : owns
    User "1" --> "*" Budget : manages
    Category "1" --> "*" Expense : categorizes
    Category "1" --> "0..*" Budget : has budget
    StorageHelpers ..> Expense : manages
    StorageHelpers ..> Category : manages
    StorageHelpers ..> Budget : manages
    DataHelpers ..> Expense : analyzes
    CurrencyHelpers ..> Expense : converts
    ReportGenerator ..> Expense : reports
    ReportGenerator ..> Category : reports
```

---

## 2. USE CASE DIAGRAM

Ce diagramme montre toutes les fonctionnalités accessibles à l'utilisateur.

### Catégories de Fonctionnalités
- **Gestion des dépenses**: Ajouter, modifier, supprimer, visualiser, rechercher
- **Gestion des catégories**: Créer et gérer les catégories
- **Gestion des budgets**: Définir budgets, voir statut, recevoir alertes
- **Rapports et Analytics**: Générer rapports, exporter, voir insights
- **Données**: Sauvegarder, restaurer, effacer
- **Paramètres**: Devise, thème, préférences

```mermaid
flowchart TB
    subgraph System["ExpenseTracker Pro"]
        subgraph Expenses["Gestion des Dépenses"]
            UC1((Add Expense))
            UC2((Edit Expense))
            UC3((Delete Expense))
            UC4((View Expenses))
            UC5((Search & Filter))
        end

        subgraph Categories["Catégories"]
            UC6((Manage Categories))
        end

        subgraph Budgets["Budgets"]
            UC7((Set Budget))
            UC8((View Budget Status))
            UC9((Receive Alerts))
        end

        subgraph Reports["Rapports & Analytics"]
            UC10((Generate Report))
            UC11((Export Report))
            UC12((View Analytics))
            UC13((View Insights))
        end

        subgraph Data["Gestion des Données"]
            UC14((Backup Data))
            UC15((Restore Data))
            UC16((Clear Data))
        end

        subgraph Settings["Paramètres"]
            UC17((Change Settings))
            UC18((Change Currency))
            UC19((Change Theme))
        end
    end

    User((User))

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    User --> UC16
    User --> UC17
    User --> UC18
    User --> UC19

    UC10 -.->|includes| UC11
    UC8 -.->|includes| UC9
    UC17 -.->|includes| UC18
    UC17 -.->|includes| UC19
```

---

## 3. SEQUENCE DIAGRAMS

### 3.1 Add Expense

Ce diagramme montre le flux complet pour ajouter une nouvelle dépense, incluant:
- Chargement des budgets pour l'avertissement
- Validation du formulaire
- Sauvegarde via API
- Notification de mise à jour

```mermaid
sequenceDiagram
    actor User
    participant UI as AddEditExpense
    participant Form as ExpenseForm
    participant Warning as BudgetWarning
    participant Storage as StorageHelpers
    participant API as ExpenseService
    participant DB as Database

    User->>UI: Click "Add Expense"
    activate UI
    UI->>Storage: getCurrentBudgets()
    Storage->>API: budgetService.getCurrent()
    API->>DB: SELECT budgets
    DB-->>API: budgets[]
    API-->>Storage: budgets[]
    Storage-->>UI: budgetMap

    UI->>Form: Render form
    activate Form

    User->>Form: Fill amount, category, date
    Form->>Form: handleInputChange()
    Form->>Form: validateField()

    Form->>Warning: Check budget status
    activate Warning
    Warning->>Warning: getCategoryBudget()
    Warning->>Warning: Calculate percentage
    alt percentage >= 80%
        Warning-->>Form: Show warning alert
    else percentage >= 100%
        Warning-->>Form: Show exceeded alert
    end
    deactivate Warning

    User->>Form: Click "Save Expense"
    Form->>Form: validateForm()

    alt Validation passes
        Form->>Form: normalizePaymentMethod()
        Form->>Form: Build expenseData
        Form->>Storage: saveExpense(expenseData)
        Storage->>API: expenseService.create(data)
        API->>DB: INSERT expense
        DB-->>API: newExpense
        API-->>Storage: expense
        Storage->>Storage: resetDataClearedFlag()
        Storage-->>Form: success

        Form->>UI: dispatchEvent('expensesUpdated')
        Form->>UI: Navigate to /expenses-management
        UI-->>User: Show success message
    else Validation fails
        Form-->>User: Show validation errors
    end

    deactivate Form
    deactivate UI
```

---

### 3.2 Generate Report and Export

Ce diagramme montre le processus de génération de rapport avec:
- Configuration des options (période, format, etc.)
- Chargement des données
- Génération des statistiques et graphiques
- Export en PDF, CSV ou JSON

```mermaid
sequenceDiagram
    actor User
    participant UI as ReportGenerator
    participant Page as AnalyticsReports
    participant Gen as reportGenerator.js
    participant Chart as ChartRenderer
    participant Storage as StorageHelpers
    participant API as Services

    User->>UI: Configure report options
    UI->>UI: Update reportConfig state

    User->>UI: Click "Generate Report"
    activate UI
    UI->>Page: handleGenerateReport(config)
    activate Page

    Page->>Storage: loadExpenses()
    Storage->>API: expenseService.getAll()
    API-->>Storage: expenses[]
    Storage-->>Page: expenses

    Page->>Storage: loadCategoriesWithBudgets()
    Storage->>API: categoryService.getAll()
    API-->>Storage: categories[]
    Storage-->>Page: categories

    Page->>Gen: generateReportData(config, expenses, categories)
    activate Gen
    Gen->>Gen: getDateRangeForPeriod()
    Gen->>Gen: filterExpensesByDateRange()
    Gen->>Gen: calculateReportStatistics()
    Gen->>Gen: calculateCategoryBreakdown()
    Gen->>Gen: calculateTopExpenses()
    Gen->>Gen: getPreviousPeriodRange()
    Gen->>Gen: calculateBudgetSummary()
    Gen->>Gen: calculateProjection()
    Gen-->>Page: reportData
    deactivate Gen

    alt format === 'pdf' AND includeCharts
        Page->>Chart: generateChartImagesForPDF()
        activate Chart
        Chart->>Chart: Create pie chart
        Chart->>Chart: Create bar chart
        Chart->>Chart: Create line chart
        Chart->>Chart: Create budget chart
        Chart->>Chart: Convert to PNG dataUrl
        Chart-->>Page: chartImages[]
        deactivate Chart
    end

    alt format === 'pdf'
        Page->>Gen: exportToPDF(reportData, config, chartImages)
        Gen->>Gen: Create jsPDF document
        Gen->>Gen: Add styled header
        Gen->>Gen: Add executive summary boxes
        Gen->>Gen: Add projection section
        Gen->>Gen: Add budget progress bar
        Gen->>Gen: Add top 5 expenses table
        Gen->>Gen: Add category breakdown
        Gen->>Gen: Add charts
        Gen->>Gen: Add transactions table
        Gen->>Gen: Add footer to all pages
        Gen->>Gen: doc.save(filename)
        Gen-->>User: Download PDF file
    else format === 'csv'
        Page->>Gen: exportToCSV(reportData, config)
        Gen->>Gen: Build CSV sections
        Gen->>Gen: Create Blob
        Gen-->>User: Download CSV file
    else format === 'json'
        Page->>Gen: exportToJSON(reportData, config)
        Gen->>Gen: Structure JSON data
        Gen->>Gen: Create Blob
        Gen-->>User: Download JSON file
    end

    Page->>Page: Update localStorage stats
    Page-->>UI: Show success notification
    deactivate Page
    deactivate UI
```

---

### 3.3 View Budget with Status Alert

Ce diagramme montre comment les budgets sont affichés avec:
- Chargement parallèle des données
- Calcul des dépenses par catégorie
- Conversion de devises
- Génération et affichage des alertes

```mermaid
sequenceDiagram
    actor User
    participant UI as BudgetManagement
    participant Overview as BudgetOverview
    participant Cards as CategoryBudgetCard
    participant Alerts as BudgetAlerts
    participant Storage as StorageHelpers
    participant API as Services
    participant Notif as NotificationHelpers

    User->>UI: Navigate to Budget Management
    activate UI

    UI->>UI: Get currentMonth, currentYear

    par Load data in parallel
        UI->>Storage: loadCategories()
        Storage->>API: categoryService.getAll()
        API-->>Storage: categories[]
        Storage-->>UI: categories
    and
        UI->>Storage: loadExpenses()
        Storage->>API: expenseService.getAll()
        API-->>Storage: expenses[]
        Storage-->>UI: expenses
    and
        UI->>Storage: loadBudgets(month, year)
        Storage->>API: budgetService.getAll()
        API-->>Storage: budgets[]
        Storage-->>UI: budgets
    end

    UI->>UI: Create budgetMap by categoryId

    loop For each category
        UI->>UI: Filter expenses by category & month
        UI->>UI: Calculate spent amount
        UI->>UI: convertExpenseAmount() to user currency
        UI->>UI: Get budget from budgetMap
        UI->>UI: convertBudgetAmount() to user currency
        UI->>UI: Calculate percentage used
    end

    UI->>UI: Calculate overall totals
    UI->>Overview: Render with totals
    activate Overview
    Overview->>Overview: Calculate spentPercentage
    alt percentage > 100
        Overview->>Overview: Show ERROR status (red)
    else percentage > 80
        Overview->>Overview: Show WARNING status (yellow)
    else
        Overview->>Overview: Show SUCCESS status (green)
    end
    Overview-->>UI: Display progress bar
    deactivate Overview

    UI->>Cards: Render category cards
    activate Cards
    Cards->>Cards: Display budget vs spent
    Cards->>Cards: Show progress indicator
    Cards-->>UI: Category cards displayed
    deactivate Cards

    UI->>UI: Generate budget alerts
    loop For each category where spent > budget * 0.8
        UI->>UI: Calculate alert percentage
        alt spent > budget
            UI->>UI: Create 'exceeded' alert
        else
            UI->>UI: Create 'warning' alert
        end
    end

    UI->>Alerts: Render alerts
    activate Alerts
    loop For each alert
        Alerts->>Notif: addNotification(alert)
        Notif-->>User: Show toast notification
    end
    Alerts-->>UI: Display alert cards
    deactivate Alerts

    UI-->>User: Show complete budget view
    deactivate UI
```

---

### 3.4 Backup and Restore Data

Ce diagramme montre les deux flux:
- **Backup (Export)**: Collecte des données et téléchargement en JSON
- **Restore (Import)**: Lecture du fichier, validation et importation

```mermaid
sequenceDiagram
    actor User
    participant UI as DataManagement
    participant Storage as StorageHelpers
    participant API as Services
    participant File as FileSystem
    participant DB as Database

    rect rgb(200, 230, 200)
        Note over User,DB: BACKUP (Export) Flow
        User->>UI: Click "Export as JSON"
        activate UI

        UI->>Storage: loadExpenses()
        Storage->>API: expenseService.getAll()
        API->>DB: SELECT expenses
        DB-->>API: expenses[]
        API-->>Storage: expenses
        Storage-->>UI: expenses

        UI->>Storage: loadCategoriesWithBudgets()
        Storage->>API: categoryService.getAll()
        API->>DB: SELECT categories
        DB-->>API: categories[]
        API-->>Storage: categories
        Storage-->>UI: categories

        UI->>UI: Build exportData object
        Note right of UI: {expenses, categories,<br/>exportDate, version}

        UI->>UI: JSON.stringify(exportData)
        UI->>UI: Create Blob
        UI->>File: Download expense-backup-YYYY-MM-DD.json
        File-->>User: File downloaded

        UI-->>User: Show success alert
        deactivate UI
    end

    rect rgb(200, 200, 230)
        Note over User,DB: RESTORE (Import) Flow
        User->>UI: Click "Import Data File"
        activate UI

        UI->>File: Open file picker (.json)
        User->>File: Select backup file
        File-->>UI: File selected

        UI->>UI: FileReader.readAsText(file)
        UI->>UI: JSON.parse(content)

        UI->>UI: Validate importedData
        alt Invalid format
            UI-->>User: Show error alert
        else Valid format
            UI->>Storage: loadCategories()
            Storage-->>UI: existingCategories

            loop For each imported category
                UI->>UI: Check if name exists
                alt Category NOT exists
                    UI->>API: categoryService.create(category)
                    API->>DB: INSERT category
                    DB-->>API: newCategory
                end
            end

            UI->>Storage: loadCategories() [refresh]
            Storage-->>UI: allCategories

            loop For each imported expense
                UI->>UI: Find matching category
                alt Category found
                    UI->>API: expenseService.create(expense)
                    API->>DB: INSERT expense
                    DB-->>API: newExpense
                end
            end

            UI-->>User: Show success with counts
            UI->>UI: window.location.reload()
        end
        deactivate UI
    end
```

---

### 3.5 Search and Filter Expenses

Ce diagramme montre le système de recherche et filtrage avec:
- Chargement initial des données
- Application des filtres multiples
- Tri des résultats
- Infinite scroll pour la pagination

```mermaid
sequenceDiagram
    actor User
    participant UI as ExpensesManagement
    participant Filters as ExpenseFilters
    participant List as ExpenseList
    participant Card as ExpenseCard
    participant Storage as StorageHelpers
    participant API as ExpenseService

    User->>UI: Navigate to Expenses
    activate UI

    par Load data
        UI->>Storage: loadExpenses()
        Storage->>API: getAll()
        API-->>Storage: expenses[]
        Storage-->>UI: expenses
    and
        UI->>Storage: loadCategories()
        Storage-->>UI: categories
    end

    UI->>UI: setExpenses(expenses)
    UI->>UI: setCategories(categories)

    UI->>UI: Register event listeners
    Note right of UI: 'storage' and<br/>'expensesUpdated' events

    UI->>Filters: Render with categories
    activate Filters
    Filters-->>UI: Filter UI displayed
    deactivate Filters

    UI->>List: Render with expenses
    activate List
    List->>List: slice(0, 20) for pagination
    loop For each expense
        List->>Card: Render ExpenseCard
        Card->>Card: getCategoryInfo()
        Card->>Card: formatExpenseAmount()
        Card-->>List: Card displayed
    end
    List-->>UI: Initial list shown
    deactivate List

    rect rgb(255, 240, 200)
        Note over User,Card: User applies filters

        User->>Filters: Enter search text
        Filters->>UI: onFiltersChange('search', value)

        User->>Filters: Select category
        Filters->>UI: onFiltersChange('category', value)

        User->>Filters: Select date range
        Filters->>UI: onFiltersChange('dateFrom', value)
        Filters->>UI: onFiltersChange('dateTo', value)

        User->>Filters: Set amount range
        Filters->>UI: onFiltersChange('amountMin', value)
        Filters->>UI: onFiltersChange('amountMax', value)

        User->>Filters: Select sort order
        Filters->>UI: onFiltersChange('sortBy', value)
    end

    UI->>UI: useMemo: filteredExpenses
    activate UI
    Note right of UI: Apply filters sequentially

    UI->>UI: Filter by search term
    Note right of UI: description, amount,<br/>category (case-insensitive)

    UI->>UI: Filter by category
    UI->>UI: Filter by payment method
    UI->>UI: Filter by date range
    UI->>UI: Filter by amount range

    UI->>UI: Apply sort order
    Note right of UI: date-desc, date-asc,<br/>amount-desc, amount-asc,<br/>category-asc, category-desc

    deactivate UI

    UI->>Filters: Update result count
    Filters-->>User: Show "X expenses found"

    UI->>List: Re-render with filtered data
    activate List
    List->>List: Reset to first 20 items
    List-->>UI: Filtered list shown
    deactivate List

    rect rgb(230, 230, 250)
        Note over User,List: Infinite scroll
        User->>List: Scroll down
        List->>List: Check scroll position
        alt Near bottom (< 1000px)
            List->>List: loadMore()
            List->>List: Add next 20 items
            List-->>User: More items loaded
        end
    end

    deactivate UI
```

---

## Annexes

### Filtres Disponibles (Search & Filter)

| Filtre | Type | Description |
|--------|------|-------------|
| search | texte | Recherche dans description, montant, catégorie |
| category | select | Filtre par catégorie unique |
| paymentMethod | select | Cash, Card, Bank Transfer, Digital Wallet, Other |
| dateFrom | date | Date de début (inclusive) |
| dateTo | date | Date de fin (inclusive) |
| amountMin | number | Montant minimum |
| amountMax | number | Montant maximum |
| sortBy | select | date-desc, date-asc, amount-desc, amount-asc, category-asc, category-desc |

### Niveaux d'Alerte Budget

| Niveau | Condition | Couleur |
|--------|-----------|---------|
| Normal | < 80% | Vert |
| Warning | 80% - 100% | Jaune |
| Exceeded | > 100% | Rouge |

### Formats d'Export

| Format | Extension | Contenu |
|--------|-----------|---------|
| PDF | .pdf | Rapport complet avec graphiques |
| CSV | .csv | Données tabulaires |
| JSON | .json | Données structurées complètes |

---

*Document généré pour ExpenseTracker Pro - Décembre 2024*
