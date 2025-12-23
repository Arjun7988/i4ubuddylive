# FinanceAI - AI-Styled Personal Finance Manager

A beautiful, production-ready personal finance management application with a futuristic AI aesthetic. Built with React, TypeScript, Supabase, and featuring real-time charts and budget tracking.

## Features

- **AI-Styled Design**: Sleek, glowing interface with purple-teal gradients
- **Complete Auth System**: Email/password + magic link authentication
- **Transaction Management**: Full CRUD operations with filtering and search
- **Budget Tracking**: Set monthly budgets and track spending with visual progress bars
- **Interactive Reports**: Beautiful charts showing income vs expenses and category breakdowns
- **Multi-Account Support**: Manage multiple bank accounts, credit cards, and investments
- **Real-time Data**: All data synced instantly across devices
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Secure**: Bank-level security with Supabase RLS policies

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom AI theme
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## Quick Start

### 1. Database Setup

The app uses Supabase for database and authentication. To set up the database:

1. Go to your Supabase project's SQL Editor
2. Copy the contents of `supabase-setup.sql`
3. Run the SQL to create all tables, RLS policies, and triggers
4. The database is now ready!

### 2. Environment Variables

Your `.env` file is already configured with:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app!

## Pages

- **Landing Page** (`/`) - Beautiful hero section with gradient effects
- **Auth Page** (`/auth`) - Sign in, sign up, or use magic link
- **Dashboard** (`/dashboard`) - Overview with charts and recent transactions
- **Transactions** (`/transactions`) - Manage all transactions with filters
- **Budgets** (`/budgets`) - Create and track monthly budgets
- **Reports** (`/reports`) - Visual reports and analytics
- **Accounts** (`/accounts`) - Manage financial accounts
- **Settings** (`/settings`) - Profile settings and preferences

## First-Time Setup

When you first sign up:

1. **Create an Account**: Use the auth page to sign up with email/password
2. **Add Categories**: Default categories are automatically created
3. **Add an Account**: Go to Accounts → Add Account (e.g., "Main Checking")
4. **Add Transactions**: Start adding your income and expenses
5. **Set Budgets**: Create monthly budgets for spending categories
6. **View Reports**: Check your dashboard for visual insights

## Key Features Explained

### Authentication
- Email/password authentication
- Magic link sign-in (passwordless)
- Secure session management
- Protected routes

### Transactions
- Add income and expenses
- Categorize transactions
- Filter by type, category, or search
- Edit and delete transactions
- Date-based tracking

### Budgets
- Set monthly spending limits per category
- Visual progress bars showing spending vs budget
- Over-budget warnings
- Edit and delete budgets

### Reports
- 6-month income vs expense trends
- Category breakdown charts
- Top income sources
- Top expense categories
- Beautiful data visualizations

### Accounts
- Multiple account support
- Track different account types (checking, savings, credit cards, etc.)
- See total net worth
- Manage account balances

## Design System

The app uses a custom AI-inspired design system:

- **Primary Gradient**: Purple lavender (`#6A5AE0` to `#A084E8`)
- **Accent Gradient**: Aqua-neon (`#00C9A7` to `#92FE9D`)
- **Dark Mode**: Default with `#0D0D0F` background
- **Glass Effects**: Translucent cards with backdrop blur
- **Glow Effects**: Subtle neon glows on hover
- **Fonts**: Inter (body) + Space Grotesk (headings)

## Security

- All tables protected with Row Level Security (RLS)
- Users can only access their own data
- Authentication required for all protected routes
- Secure password hashing
- HTTPS-only in production

## Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder, ready to deploy!

## License

MIT License - Feel free to use this for your own projects!

---

Built with 💜 using AI-powered design principles.
