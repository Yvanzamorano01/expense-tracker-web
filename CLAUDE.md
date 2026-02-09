# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start                # Start dev server on port 4028
npm run build            # Production build (outputs to /build directory)
npm run serve            # Preview production build
```

## Project Overview

ExpenseTracker Pro is an offline-first expense tracking application built with React 18, Vite, and TailwindCSS. The app uses localStorage for all data persistence - there is no backend or Redux store. All state is managed locally within components or via localStorage.

## Architecture

### Data Storage & State Management
- **No Redux**: Despite Redux Toolkit being listed in dependencies (rocketCritical section), the app does NOT use Redux or any global state management
- **LocalStorage as Database**: All expenses, categories, budgets, and user preferences are stored in localStorage
- **Component-level State**: React hooks (useState, useEffect) manage all UI state
- **Data Keys**: Settings use specific localStorage keys: `selectedCurrency`, `selectedTheme`, `dateFormat`, `notificationSettings`, `defaultSettings`

### Module Resolution
- **Base Path**: Import from `src/` without relative paths (configured in jsconfig.json)
- Examples:
  - `import Header from 'components/ui/Header'` (not `../../components/ui/Header`)
  - `import Icon from 'components/AppIcon'`

### Routing Structure
All routes defined in `src/Routes.jsx`:
- `/` and `/dashboard` - Dashboard (main page)
- `/add-edit-expense` - Add or edit expenses
- `/expenses-management` - View and filter expenses
- `/categories-management` - Manage expense categories
- `/budget-management` - Budget tracking and alerts
- `/analytics-reports` - Charts and spending insights
- `/settings-preferences` - User preferences and data management

### Component Architecture

**Layout Components:**
- `Header` - Top navigation bar
- `BottomNavigation` - Mobile bottom nav
- `FloatingActionButton` - Quick add expense FAB
- `ErrorBoundary` - Error handling wrapper
- `ScrollToTop` - Scroll restoration on route changes

**Page Structure:**
Each page (in `src/pages/`) follows this pattern:
- Main page component (index.jsx)
- Sub-components folder with specialized components
- Example: `dashboard/index.jsx` + `dashboard/components/SummaryCard.jsx`

**UI Components (`src/components/ui/`):**
- Built with Radix UI primitives and class-variance-authority (CVA)
- `Button` - Supports variants (default/destructive/outline/etc), sizes, icons, loading states
- `Input`, `Select`, `Checkbox` - Form controls with consistent styling
- All use the `cn()` utility from `src/utils/cn.js` for className merging

### Styling System

**Tailwind Configuration:**
- Dark mode: class-based (toggle `.dark` on documentElement)
- Theme: CSS variables in tailwind.config.js (e.g., `var(--color-primary)`)
- Custom colors: primary, secondary, destructive, muted, accent, success, warning, error
- Custom z-indices: navigation (100), fab (200), dropdown (300), modal (1000)
- Custom animations: fade-in, slide-in, scale-in

**Theme System:**
- Theme applied in `App.jsx` on mount
- Supports 3 modes: light, dark, auto (follows system preference)
- Theme stored in localStorage as `selectedTheme`

### Icons
- **Library**: lucide-react
- **Usage**: Import via `AppIcon` component: `<Icon name="DollarSign" size={24} />`
- Falls back to HelpCircle if icon name not found

### Data Management
- Export: JSON and CSV formats (see `DataManagement.jsx`)
- Import: File upload with FileReader API
- Clear data: Preserves user preferences while removing expense data
- All data operations are client-side only

## Critical Dependencies

The `rocketCritical` section in package.json marks essential dependencies. Do not remove:
- @dhiwise/component-tagger
- React core libraries
- Redux packages (even though not actively used)
- React Router
- Vite and build tools
- TailwindCSS

## Development Notes

### Vite Configuration
- Dev server: localhost:4028
- Build output: `build/` directory (not `dist/`)
- Source maps enabled in production builds
- Path aliases configured via vite-tsconfig-paths

### Date Formatting
- Uses date-fns library (v4.1.0)
- User-configurable date formats stored in localStorage

### Mock Data
Most pages use hardcoded mock data for demonstration. When adding features:
1. Check if localStorage has real data first
2. Fall back to mock data for empty states
3. Follow the pattern in `DataManagement.jsx` for localStorage operations

### Error Handling
- ErrorBoundary wraps all routes in Routes.jsx
- Components use optional chaining extensively (`data?.property`)
- Icon component gracefully handles missing icon names
