# ProFarm V2: System Architecture Documentation

**Document Version:** 1.1.0 (Phase 3A Secure Authentication)  
**Status:** Approved & Implemented Foundation  

---

## 1. Overview & Architectural Principles

ProFarm V2 addresses the deep structural and security flaws identified in the Phase 1 audit of the legacy hackathon code. It departs from the legacy multi-page, unvalidated architecture in favor of a modern, decoupled monorepo architecture:

1. **Separation of Concerns:** Clear demarcation between presentation (React SPA), API services (Express REST), data abstraction (Prisma ORM), and storage (SQLite).
2. **Defensive by Default:** No sensitive credentials client-side; zero plaintext password storage; explicit CORS whitelist; payload size caps; rate limiting.
3. **Type Safety & Schema Integrity:** End-to-end TypeScript with runtime validation via Zod schemas and compile-time database constraints via Prisma.
4. **Environment Isolation:** Zero dependencies on external cloud services or hosted databases for baseline development; local self-contained SQLite database.
5. **Secure Authentication & Session Management:** Server-side sessions with opaque random tokens, stored securely as SHA-256 hashes in SQLite, delivered via HttpOnly, SameSite=Lax cookies, and protected by Argon2id password hashing and origin-based CSRF defenses.

---

## 2. Monorepo Organization

The project employs npm native workspaces:

```
ProFarm-V2/
├── backend/          # REST API, Auth & Database layer
├── frontend/         # React SPA client & Auth Context
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
    ├──> CookieParser ── Extracts profarm_sid session cookie
    ├──> CSRF         ── Origin header validation on state-changing requests (POST, PUT, DELETE)
    ├──> RateLimit    ── 200 req / 15 min window (10 req / 15 min on /api/auth)
    ├──> JSON Parser  ── 100kb payload size limit
    │
    ▼
[routes/]             ── Path dispatching & URL mapping (/api/health, /api/auth)
    │
    ▼
[middleware/]         ── Request validation (validateRequest) & Auth enforcement (requireAuth)
    │
    ▼
[controllers/]        ── Request extraction & HTTP status response formatting (auth.controller)
    │
    ▼
[services/]           ── Core business logic: auth.service (Argon2id, Session CRUD)
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
  - **CORS / CSRF Violations:** Formatted into 403 Forbidden responses.
  - **Internal Errors:** Redacts local filesystem paths and hides stack traces in production.

---

## 4. Authentication Architecture (Phase 3A)

### 4.1 Threat Model & Defenses
- **Password Hashing:** Implemented with `argon2` (Argon2id profile: 64 MiB memory, 3 iterations, 1 parallelism). Mitigates GPU/ASIC rainbow table and offline dictionary attacks.
- **Timing Attack Mitigation:** Authentication login path always computes Argon2 password verification against a pre-computed dummy hash when an email address is not found in the database.
- **Session Tokens:** 32 cryptographically secure random bytes generated via `crypto.randomBytes(32).toString('hex')`.
- **Database Token Storage:** Only the `SHA-256` hash of the raw session token is persisted in the database. If the database file is compromised, attackers cannot forge session cookies.
- **Cookie Security:** Cookies are issued with `HttpOnly: true` (inaccessible to JavaScript, defending against XSS cookie theft), `SameSite: 'Lax'` (defending against cross-site request forgery), `Path: '/'`, and `Secure: true` in production.
- **CSRF Defense-in-Depth:** State-changing requests (`POST`, `PUT`, `DELETE`, `PATCH`) must contain a valid `Origin` header matching `FRONTEND_ORIGIN`.
- **Brute-Force Rate Limiting:** All `/api/auth/*` routes are governed by an isolated rate limiter (10 attempts per 15-minute window in production).

### 4.2 Auth Endpoints
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Creates user with Argon2id hash, issues session cookie |
| `POST` | `/api/auth/login` | No | Validates credentials, issues session cookie |
| `GET` | `/api/auth/me` | Yes (`requireAuth`) | Returns current authenticated user profile |
| `POST` | `/api/auth/logout` | No / Yes | Revokes session from SQLite and clears `profarm_sid` |

---

## 5. Frontend Architecture

### 5.1 Component & Routing Topology
- **Single-Page Application (SPA):** Powered by Vite, React 18, and React Router 6.
- **Authentication Context (`AuthProvider` + `useAuth`):** Manages user session state, performs automatic session check (`api.getMe()`) on mount to restore sessions across page refreshes, and exposes `login`, `register`, and `logout`.
- **Protected Routing (`ProtectedRoute`):** Guards authenticated routes (such as `/dashboard`). Redirects unauthenticated users to `/login` with `state: { from: location }` for automatic return upon login.
- **Route Manifest (`routes.tsx`):**
  - `/` — `HomePage`: Platform introduction + real-time API and database health probe.
  - `/dashboard` — `DashboardPage`: **Protected** farmer management overview showing account info and farm status.
  - `/knowledge` — `KnowledgePage`: Soil Wiki & Crop Encyclopedia.
  - `/tools` — `ToolsPage`: Rainfall, Mandi Prices, and Yield models.
  - `/login` — `LoginPage`: Interactive login form with client validation, error banners, and redirect handling.
  - `/signup` — `SignupPage`: Interactive registration form with password confirmation and input validation.
  - `*` — `NotFoundPage`: Client-side 404 handler with return-to-home navigation.

### 5.2 Centralized API Client (`services/api.ts`)
- Configured with `credentials: 'include'` on all HTTP requests to ensure session cookies travel across cross-origin requests to `http://localhost:4000`.
- Typed methods: `api.register()`, `api.login()`, `api.logout()`, `api.getMe()`, `api.getHealth()`, `api.getDatabaseHealth()`.

---

## 6. Database Architecture (SQLite + Prisma)

### 6.1 Schema Specification
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  farms        Farm[]
  sessions     Session[]

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

model Session {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}
```

---

## 7. Security Foundations Summary

| Threat Category | Legacy Defect (Phase 1) | Modern Mitigation (Phase 3A) |
| :--- | :--- | :--- |
| **Credential Storage** | Plaintext in `data/users.json` | Argon2id password hashing (`$argon2id$...`). No plaintext passwords ever stored or logged. |
| **Session Forgery** | No authentication system | 32-byte cryptographically secure random session tokens; only SHA-256 hashes stored in DB. |
| **XSS Cookie Theft** | N/A | Session cookies configured with `HttpOnly: true`. Inaccessible to DOM scripts. |
| **CSRF Attacks** | N/A | `SameSite: Lax` cookie policy + strict `Origin` header validation on all state-changing endpoints. |
| **Brute-Force Attacks** | None | 10 requests / 15 minutes strict rate limiting on `/api/auth/*` routes. |
| **Enumeration / Timing** | Immediate rejection leaks user presence | Constant-time Argon2 verification against dummy hash when email does not exist. |
| **Exposed Secrets** | API keys hardcoded in client JavaScript | Strict `.env` isolation. Client builds contain zero private API tokens. |
| **DOM Injection (XSS)** | Direct `innerHTML` injection of unescaped text | React JSX automatically escapes dynamic values. |

---

## 8. Port Allocation

- **Backend Port:** `4000` (`http://localhost:4000`)
- **Frontend Port:** `5173` (`http://localhost:5173`)

---

## 9. Weather & Meteorological Subsystem (Phase 3C)

### 9.1 Open-Meteo Integration Proxy
- **Endpoint Structure:**
  - `GET /api/weather/locations?query=<string>`: Searches Indian locations filtered to `country_code=IN`.
  - `GET /api/weather/forecast?latitude=<num>&longitude=<num>&locationName=<string>`: Returns 7-day weather, current observations, dedicated rainfall intelligence, and farmer weather guidance.
- **Proxy Architecture:** Frontend never connects directly to external weather APIs. The Express backend handles external requests, timeouts (8s), error isolation, and schema normalization.
- **In-Memory Caching:**
  - Bounded `MemoryCache<T>` (500 capacity, LRU eviction).
  - Geocoding results: 24-hour TTL.
  - Forecast results: 15-minute TTL.
  - Coordinates rounded to 2 decimal places (~1 km grid).
- **Domain Normalization:**
  - Full WMO code dictionary (0–99) translated to localized descriptors and weather icons.
  - Dedicated rainfall intelligence separating probability (%) from accumulation (mm).
  - Deterministic rule engine for heavy rain, heat stress, wind gust, and dry spell farmer advisories.
  - Transparent Open-Meteo non-commercial attribution compliance.

---

## 10. Mandi Price & Market Intelligence Subsystem (Phase 3D)

### 10.1 data.gov.in / AGMARKNET Integration Proxy
- **Endpoint Structure:**
  - `GET /api/mandi/prices`: Queries authenticated daily APMC market prices filtered by commodity, state, district, and market, with bounded pagination (`limit`, `page`) and sorting (`modal_price_desc`, `modal_price_asc`, `arrival_date_desc`).
  - `GET /api/mandi/filters`: Returns curated list of 44+ Indian agricultural commodities and agricultural states with corresponding APMC districts.
  - `GET /api/mandi/trends`: Reports capability status transparently, explaining that the daily AGMARKNET snapshot feed publishes single-day observations without multi-week historical archives.
- **Proxy Architecture & Secret Protection:**
  - Official Government of India resource ID: `9ef84268-d588-465a-a308-a864a43d0070`.
  - Backend holds `DATA_GOV_IN_API_KEY`; key is never exposed to browser or client JavaScript builds.
  - 9-second bounded request timeout with graceful error recovery (502 for upstream failures, 504 for timeouts, 429 for rate limits).
- **In-Memory Caching:**
  - Mandi price queries: 15-minute TTL (`15 * 60 * 1000`).
  - Filter metadata: 24-hour TTL (`24 * 60 * 60 * 1000`).
  - Bounded capacity with LRU eviction.
- **Data Normalization & Integrity:**
  - Formats wholesale prices as `₹ / quintal` (100 kg).
  - Clear semantic separation between minimum, maximum, and modal price ("most commonly reported trading price").
  - Preserves original arrival date string (`DD/MM/YYYY`) from APMC mandis without timezone shifts.
  - Honest disclosure policy: zero artificial or synthetic historical trend interpolation.
