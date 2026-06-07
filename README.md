# Rook — API Credit Bundling Platform

> Bundle all your API services into one predictable monthly subscription. Like a telecom data plan, but for APIs.

## Architecture

```
rook/
├── backend/           # Express + TypeScript API server (port 4000)
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── routes/            # API routes (auth, dashboard, admin)
│   │   ├── services/          # Business logic (pooling, billing)
│   │   ├── middleware/        # Auth middleware (JWT)
│   │   ├── migrations/        # DB schema & seed data
│   │   ├── models/            # Database connection (sql.js)
│   │   └── types/             # TypeScript type definitions
│   └── package.json
├── frontend/          # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx            # Main app with auth & routing
│   │   ├── pages/             # LoginPage, DashboardPage
│   │   └── main.tsx           # React entry
│   └── package.json
└── .gitignore
```

## Quick Start

### Backend
```bash
cd backend
npm install
npx tsx src/migrations/seed.ts    # Creates DB with demo data
npx tsx src/index.ts               # Starts server on :4000
```

### Frontend
```bash
cd frontend
npm install
npx vite build                     # Builds to dist/
```

### Demo Credentials
- **Customer**: `demo@acmecorp.com` / `demo1234`
- **Admin**: `admin@rook.dev` / `admin123`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/register` | Register new customer |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/dashboard/usage` | Usage history |
| GET | `/api/dashboard/billing` | Billing history |
| GET | `/api/admin/stats` | Admin stats |
| GET | `/api/admin/users` | User list |

## Business Model

- **Starter**: $500/mo — 100K credits — 5 APIs
- **Growth**: $2,000/mo — 1M credits — 15 APIs
- **Enterprise**: Custom pricing — Custom pool — Unlimited
