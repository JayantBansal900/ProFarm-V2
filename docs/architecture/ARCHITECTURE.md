# ProFarm V2: System Architecture Documentation

**Document Version:** 1.0.0 (Phase 2 Foundation)  
**Status:** Approved & Verified Foundation  

---

## 1. Overview & Architectural Principles

ProFarm V2 addresses the deep structural and security flaws identified in the Phase 1 audit of the legacy hackathon code. It departs from the legacy multi-page, unvalidated architecture in favor of a modern, decoupled monorepo architecture:

1. **Separation of Concerns:** Clear demarcation between presentation (React SPA), API services (Express REST), data abstraction (Prisma ORM), and storage (SQLite).
2. **Defensive by Default:** No sensitive credentials client-side; zero plaintext password storage; explicit CORS whitelist; payload size caps; rate limiting.
3. **Type Safety & Schema Integrity:** End-to-end TypeScript with runtime validation via Zod schemas and compile-time database constraints via Prisma.
4. **Environment Isolation:** Zero dependencies on external cloud services or hosted databases for baseline development; local self-contained SQLite database.

---

## 2. Monorepo Organization

The project employs npm native workspaces:

```
ProFarm-V2/
├── backend/          # REST API & Database layer
├── frontend/         # React SPA client
└── docs/             # Technical specifications & reports
```

### Workspaces Configuration
Declared in root `package.json`:
```json
{
  "workspaces": ["backend", "frontend"]
}
```
This enables unified script execution (`npm run test`, `npm run build`, `npm run lint`) while maintaining strict boundary separation.

---

## 3. Backend Architecture

### 3.1 Layered Design
```
HTTP Client
    │
    ▼
[server.ts]           ── Listener & Graceful Shutdown (SIGINT, SIGTERM)
    │
    ▼
[app.ts]              ── Express Application Assembly
    │
    ├──> Helmet       ── Security headers (nosniff, frameguard, etc.)
    ├──> CORS         ── Origin verification (env.FRONTEND_ORIGIN)
    ├──> RateLimit    ── 200 req / 15 min window
    ├──> JSON Parser  ── 100kb payload size limit
    │
    ▼
[routes/]             ── Path dispatching & URL mapping
    │
    ▼
[middleware/]         ── Request validation via Zod schemas (validate.ts)
    │
    ▼
[controllers/]        ── Request extraction & HTTP status response formatting
    │
    ▼
[services/]           ── Core business logic & database queries
    │
    ▼
[lib/prisma.ts]       ── Prisma client singleton
    │
    ▼
SQLite Engine (`dev.db`)
```

### 3.2 Request Lifecycle & Error Handling
- Requests matching known routes proceed through middleware to controllers.
- Unmatched routes fall through to `notFoundHandler` returning standardized JSON:
  ```json
  {
    "status": "error",
    "message": "Resource not found: GET /unknown"
  }
  ```
- Any unhandled exception is intercepted by `errorHandler`:
  - **Zod Validation Errors:** Formatted into structured 400 Bad Request responses with field-level diagnostics.
  - **CORS Violations:** Formatted into 403 Forbidden responses.
  - **Internal Errors:** Redacts local filesystem paths and hides stack traces in production.

---

## 4. Frontend Architecture

### 4.1 Component & Routing Topology
- **Single-Page Application (SPA):** Powered by Vite, React 18, and React Router 6.
- **Root Shell (`AppLayout`):** Contains consistent, accessible navigation (`Header`), dynamic page container (`<Outlet />`), and status footer (`Footer`).
- **Route Manifest (`routes.tsx`):**
  - `/` — `HomePage`: Platform introduction + real-time API and database health probe.
  - `/dashboard` — `DashboardPage`: Placeholder for unified farm analytics.
  - `/knowledge` — `KnowledgePage`: Placeholder for Soil Wiki & Crop Encyclopedia.
  - `/tools` — `ToolsPage`: Placeholder for Rainfall, Mandi Prices, and Yield models.
  - `/login` — `LoginPage`: Placeholder for farmer authentication.
  - `*` — `NotFoundPage`: Client-side 404 handler with return-to-home navigation.

### 4.2 Centralized API Client (`services/api.ts`)
- Wraps native browser `fetch` with typed generics: `request<T>(endpoint, options)`.
- Automatically injects base backend URL from `import.meta.env.VITE_API_BASE_URL`.
- Transforms HTTP failure statuses into strongly-typed `ApiError` instances containing structured error payloads.

---

## 5. Database Architecture (SQLite + Prisma)

### 5.1 Models & Relational Constraints
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  farms        Farm[]

  @@map("users")
}

model Farm {
  id        String   @id @default(uuid())
  userId    String
  name      String
  state     String
  district  String
  pincode   String?
  soilType  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("farms")
}
```

### 5.2 Key Design Choices:
- **UUID Primary Keys:** Prevent predictable ID enumeration attacks.
- **Relational Integrity:** Foreign key `userId` references `User(id)` with `onDelete: Cascade`, ensuring no orphaned farm records when a user is deleted.
- **Security by Design:** Passwords will only be stored as hashes (`passwordHash`). Plaintext credentials from legacy `users.json` are permanently deprecated and excluded.

---

## 6. Security Foundations

| Threat Category | Legacy Defect (Phase 1) | Modern Mitigation (Phase 2) |
| :--- | :--- | :--- |
| **Credential Storage** | Plaintext in `data/users.json` | Schema strictly mandates `passwordHash`. Hashing will be implemented in Phase 3 using Argon2id. |
| **Exposed Secrets** | API keys hardcoded in client JavaScript | Strict `.env` isolation. Client builds contain zero private API tokens. External calls will proxy through backend. |
| **DOM Injection (XSS)** | Direct `innerHTML` injection of unescaped text | React JSX automatically escapes dynamic values. |
| **Denial of Service** | Unbounded request parsing & polling | 100kb JSON body limits, `express-rate-limit` (200 requests / 15 minutes). |
| **Cross-Origin Abuse** | No CORS configuration | Explicit origin whitelist matching `FRONTEND_ORIGIN` (`http://localhost:5173`). |
| **HTTP Headers** | Default Express fingerprinting | `helmet()` adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and removes `X-Powered-By`. |

---

## 7. Port Allocation Strategy

- **Backend Port:** `4000` (Assigned because port 3001 was already occupied by an existing system service on this development machine).
- **Frontend Port:** `5173` (Standard Vite development server port).
