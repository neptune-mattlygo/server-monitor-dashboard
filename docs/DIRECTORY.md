# Server Monitor - Complete Directory Structure

```
apps/client-server/server-monitor/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.ts            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   ├── postcss.config.mjs        # PostCSS configuration
│   ├── jest.config.js            # Jest test configuration
│   ├── jest.setup.js             # Jest setup
│   ├── cypress.config.ts         # Cypress E2E configuration
│   ├── middleware.ts             # Next.js middleware (auth protection)
│   ├── .gitignore                # Git ignore rules
│   ├── .env.local                # Local environment variables
│   ├── .env.example              # Environment template
│   └── .env.development          # Production template
│
├── 📄 Documentation
│   ├── README.md                 # Main documentation
│   ├── SETUP.md                  # Detailed setup guide
│   ├── PROJECT_SUMMARY.md        # Project overview
│   ├── QUICKSTART.md             # Quick reference
│   └── DIRECTORY.md              # This file
│
├── 📂 app/                       # Next.js App Router
│   │
│   ├── 📂 api/                   # API Routes (server-side)
│   │   │
│   │   ├── 📂 auth/              # Authentication endpoints
│   │   │   ├── 📂 azure/
│   │   │   │   ├── 📂 login/
│   │   │   │   │   └── route.ts          # POST/GET - Initiate Azure login
│   │   │   │   ├── 📂 callback/
│   │   │   │   │   └── route.ts          # GET - Azure OAuth callback
│   │   │   │   └── 📂 logout/
│   │   │   │       └── route.ts          # POST - Logout user
│   │   │   └── 📂 session/
│   │   │       └── route.ts              # GET - Check session status
│   │   │
│   │   ├── 📂 webhooks/          # Webhook receivers (public with auth)
│   │   │   ├── 📂 uptimerobot/
│   │   │   │   └── route.ts              # POST - UptimeRobot webhooks
│   │   │   ├── 📂 filemaker/
│   │   │   │   └── route.ts              # POST - FileMaker webhooks
│   │   │   ├── 📂 backup/
│   │   │   │   └── route.ts              # POST - Backup notifications
│   │   │   └── 📂 aws-s3/
│   │   │       └── route.ts              # POST - AWS S3 notifications
│   │   │
│   │   ├── 📂 servers/           # Server management (protected)
│   │   │   ├── route.ts                  # GET all, POST create
│   │   │   └── 📂 [id]/
│   │   │       ├── route.ts              # GET, PATCH, DELETE server
│   │   │       └── 📂 events/
│   │   │           └── route.ts          # GET server events (filtered)
│   │   │
│   │   ├── 📂 users/             # User management (admin only)
│   │   │   ├── route.ts                  # GET all users
│   │   │   └── 📂 [id]/
│   │   │       └── route.ts              # GET, PATCH user
│   │   │
│   │   └── 📂 dashboard/         # Dashboard data
│   │       └── route.ts                  # GET aggregated data
│   │
│   ├── 📂 dashboard/             # Main dashboard page (protected)
│   │   └── page.tsx                      # Dashboard UI
│   │
│   ├── 📂 auth/                  # Auth pages (public)
│   │   └── 📂 error/
│   │       └── page.tsx                  # Auth error display
│   │
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Landing page (redirects)
│   └── globals.css                       # Global styles
│
├── 📂 components/                # React components
│   └── 📂 ui/                    # shadcn/ui components
│       ├── button.tsx                    # Button component
│       ├── card.tsx                      # Card component
│       ├── badge.tsx                     # Badge component
│       ├── table.tsx                     # Table component
│       ├── avatar.tsx                    # Avatar component
│       └── dropdown-menu.tsx             # Dropdown menu
│
├── 📂 lib/                       # Utility libraries
│   │
│   ├── 📂 auth/                  # Authentication logic
│   │   ├── azure-client.ts               # MSAL configuration & token handling
│   │   ├── session.ts                    # Session management & cookies
│   │   └── permissions.ts                # Role-based access control
│   │
│   ├── 📂 webhooks/              # Webhook processing
│   │   ├── types.ts                      # Type definitions
│   │   ├── parsers.ts                    # Payload parsers
│   │   └── validators.ts                 # Security validation
│   │
│   ├── supabase.ts               # Supabase client & types
│   └── utils.ts                  # Utility functions
│
├── 📂 supabase/                  # Supabase configuration
│   └── 📂 migrations/
│       └── 20241201000000_server_monitoring.sql  # Complete schema
│
└── 📂 cypress/                   # E2E testing
    └── 📂 e2e/
        └── app.cy.ts                     # Test specs

```

## 🗂️ File Categories

### 🔧 Configuration (Root Level)
Files that configure the application behavior, dependencies, and tooling.

### 📘 Documentation (Root Level)
Human-readable guides and references for developers.

### 🌐 API Routes (app/api/)
Server-side endpoints that handle HTTP requests. Each folder represents a route segment.

### 🎨 Pages (app/)
User-facing pages built with React Server Components.

### 🧩 Components (components/)
Reusable React components for building the UI.

### 📚 Libraries (lib/)
Business logic, utilities, and helper functions.

### 🗄️ Database (supabase/)
Database schema, migrations, and configuration.

### 🧪 Tests (cypress/)
End-to-end and integration tests.

## 📝 Key File Purposes

### Configuration
- **package.json**: NPM dependencies, scripts
- **next.config.ts**: Next.js settings, security headers
- **tsconfig.json**: TypeScript compiler options
- **middleware.ts**: Route protection, authentication checks

### Authentication
- **lib/auth/azure-client.ts**: Azure AD MSAL setup
- **lib/auth/session.ts**: Session creation, validation, cookies
- **lib/auth/permissions.ts**: RBAC helpers
- **app/api/auth/azure/**: Login, callback, logout endpoints

### Webhooks
- **lib/webhooks/parsers.ts**: Parse incoming webhooks
- **lib/webhooks/validators.ts**: Validate signatures, rate limit
- **app/api/webhooks/**: Webhook receiver endpoints

### Database
- **lib/supabase.ts**: Database client, type definitions
- **supabase/migrations/**: SQL schema and seed data

### API
- **app/api/servers/**: Server CRUD operations
- **app/api/users/**: User management
- **app/api/dashboard/**: Aggregated monitoring data

### UI
- **components/ui/**: Reusable UI components
- **app/dashboard/page.tsx**: Main application UI
- **app/globals.css**: Global styles, Tailwind directives

## 🔍 Finding Things

### "Where is the authentication logic?"
→ `lib/auth/` and `app/api/auth/azure/`

### "Where are the webhook parsers?"
→ `lib/webhooks/parsers.ts`

### "Where is the database schema?"
→ `supabase/migrations/20241201000000_server_monitoring.sql`

### "Where do I add a new API endpoint?"
→ Create folder in `app/api/` with `route.ts`

### "Where do I add a new page?"
→ Create folder in `app/` with `page.tsx`

### "Where are the UI components?"
→ `components/ui/` for base, create custom in `components/`

### "Where is the session management?"
→ `lib/auth/session.ts`

### "Where is the role-based access control?"
→ `lib/auth/permissions.ts`

### "Where are the webhook types?"
→ `lib/webhooks/types.ts`

## 📊 Architecture Layers

```
┌─────────────────────────────────────────┐
│          User Interface (React)         │
│         app/*.tsx, components/          │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│        API Routes (Next.js)             │
│            app/api/*/route.ts           │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│      Business Logic (TypeScript)        │
│        lib/auth/, lib/webhooks/         │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│       Database (Supabase/PostgreSQL)    │
│         supabase/migrations/            │
└─────────────────────────────────────────┘
```

## 🎯 Common Tasks & Files

### Add Authentication Check
Edit: `middleware.ts`, `lib/auth/session.ts`

### Add New Webhook Source
1. Add type to `lib/webhooks/types.ts`
2. Add parser to `lib/webhooks/parsers.ts`
3. Add validator to `lib/webhooks/validators.ts`
4. Create `app/api/webhooks/[source]/route.ts`

### Add New Permission
Edit: `lib/auth/permissions.ts`

### Add New Database Table
Create migration in `supabase/migrations/`

### Add New Page
Create folder in `app/` with `page.tsx`

### Add UI Component
Create in `components/` or install with `npx shadcn-ui@latest add [name]`

---

**Navigate with confidence!** This directory structure follows Next.js 15 conventions with clear separation of concerns.
