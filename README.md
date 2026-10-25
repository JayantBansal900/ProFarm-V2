# ProFarm V2: Sustainable Agricultural Knowledge Platform

ProFarm V2 is a modernized, full-stack agricultural platform designed to empower farmers with accessible, reliable agricultural insights, crop management assistance, resource conservation tools, and sustainable farming practices. 

Initially tailored to Indian agriculture (state/district contexts and APMC Mandis), the system architecture is built from the ground up to support international expansion and global NASA Earth observation datasets.

---

## Technology Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS 3, React Router 6
- **Backend:** Node.js, Express 4, TypeScript 5 (REST architecture)
- **Database & ORM:** SQLite, Prisma ORM 5
- **Security:** Helmet, strict CORS origin controls, Zod request validation, API rate limiting, safe error handling
- **Testing:** Vitest, Supertest, React Testing Library, ESLint 9 (Flat Config), TypeScript strict type checking

---

## Prerequisites

- **Node.js:** `>= 20.0.0` (Tested on `v24.20.0`)
- **npm:** `>= 10.0.0` (Tested on `11.19.0`)
- **Operating System:** Windows, macOS, or Linux

---

## Installation & Setup

### 1. Clone & Navigate to Workspace
```bash
cd "E:\All Project\ProFarm-V2"
```

### 2. Configure Environment Files
Copy the example environment files for both backend and frontend:

**Backend:**
```bash
cp backend/.env.example backend/.env
```
Default backend port is set to `4000` (port 3001 was already occupied by an existing system service on this host).

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```
Default frontend API URL is `http://localhost:4000`.

### 3. Install Monorepo Dependencies
From the repository root:
```bash
npm install
```

### 4. Initialize Database & Run Migrations
Generate Prisma Client and apply migrations to create the local SQLite database (`dev.db`):
```bash
cd backend
npx prisma migrate dev --name init
cd ..
```

---

## Local Development Commands

Run both services concurrently or individually from the monorepo root:

| Command | Description |
| :--- | :--- |
| `npm run dev:backend` | Start Express backend with live hot-reloading (`tsx watch`) on `http://localhost:4000` |
| `npm run dev:frontend` | Start Vite React dev server on `http://localhost:5173` |

### Direct Service Execution
```bash
# Backend only
cd backend
npm run dev

# Frontend only
cd frontend
npm run dev
```

---

## Quality Assurance & Testing

Run all quality checks across the entire monorepo:

```bash
# Run ESLint across frontend and backend
npm run lint

# Run TypeScript strict type-checking across frontend and backend
npm run typecheck

# Run automated unit and integration tests (Vitest + Supertest)
npm run test

# Compile production builds
npm run build
```

---

## Project Structure

```
ProFarm-V2/
├── backend/
│   ├── prisma/
│   │   ├── migrations/            # Version-controlled database migrations
│   │   └── schema.prisma          # Database models (User, Farm)
│   ├── src/
│   │   ├── config/                # Zod environment validation (env.ts)
│   │   ├── controllers/           # HTTP controllers (health.controller.ts)
│   │   ├── lib/                   # Database client singletons (prisma.ts)
│   │   ├── middleware/            # Security: CORS, Helmet, RateLimiter, ErrorHandler
│   │   ├── routes/                # Express route declarations
│   │   ├── services/              # Business logic (database.service.ts)
│   │   ├── validators/            # Zod validation schemas
│   │   ├── app.ts                 # Express application configuration
│   │   └── server.ts              # HTTP server startup & graceful shutdown
│   ├── tests/                     # Automated Vitest/Supertest test suites
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── public/                    # Static assets & favicons
│   ├── src/
│   │   ├── app/                   # Root App component and React Router setup
│   │   ├── components/            # Layout (Header, Footer) & common components
│   │   ├── pages/                 # Minimal route pages (Home, Dashboard, Knowledge, Tools, Login, NotFound)
│   │   ├── services/              # Centralized API client (api.ts)
│   │   ├── styles/                # Tailwind CSS globals
│   │   └── types/                 # TypeScript interfaces
│   ├── tests/                     # Component & routing tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   ├── architecture/              # System architecture documentation
│   ├── migration/                 # Legacy feature mapping and migration plan
│   └── reports/                   # Phase audit and completion reports
├── .env.example                   # Monorepo environment variable template
├── .gitignore                     # Git ignore rules for databases, node_modules, secrets
└── package.json                   # Monorepo workspace configuration
```

---

## License

ISC / Proprietary — ProFarm Project.
