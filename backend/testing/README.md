# Safe backend verification

Run from the project root:

```powershell
node --test backend/testing/database-safety.test.cjs
node backend/scripts/run-tests.cjs tests/authHardening.test.ts tests/auth.test.ts
node backend/scripts/run-tests.cjs
```

`npm run test:backend` and `npm --workspace=backend test` use the same guarded runner.
Direct `vitest` execution deliberately fails without a prepared, validated test target.
No dependency installation, development-database reset, or development migration is needed.

## Database selection and guard

Each run creates `backend/.test-databases/run-<random UUID>/test.db` and an exclusive
ownership marker. The wrapper sets process-local `NODE_ENV=test`, `DATABASE_URL`,
`PROFARM_TEST_DATABASE_URL` and `PROFARM_TEST_RUN_ID`; it does not edit environment
files or system variables. URLs must agree and identify exactly that run's absolute
local file. Missing configuration, development/outside paths, traversal, URL options,
symlinks/junctions, dangling links, hard links and invalid markers fail closed.

The guard runs before migration initialization, during Vitest configuration/setup,
before creating the application Prisma client, and before each operation through
that test client. The client also receives the validated datasource URL explicitly.
Test-mode application configuration never falls back to `.env` files.

The runner exclusively creates an empty disposable file and applies the existing
three migrations using `prisma migrate deploy`. It never resets or migrates the
application database. Test files run sequentially to avoid SQLite write contention.
The mandi key in tests is an inert placeholder; provider tests mock upstream fetches.

Cleanup revalidates the exact run path and marker, refuses aliases/hard links, and
removes only that owned run using checked file deletion and non-recursive directory
removal. No broad cleanup of older runs is performed. A forcibly killed process can
leave its disposable directory behind; review it before any later manual cleanup.

SHA-256 fingerprints of application SQLite files and existing journal/WAL/SHM files
under `backend/prisma` are compared before and after each run. A difference fails
verification; it is never repaired automatically. A concurrently running application
can also change these fingerprints and must be investigated separately.

Physical link tests report a skip if the host denies link creation. Separate simulated
filesystem tests still verify fail-closed alias/hard-link rejection. Loopback networking
is required by Supertest; a restricted host can report EACCES before HTTP assertions.

These guards prevent accidental configuration mistakes in the supported runner and
application client. They are not a security sandbox for deliberately malicious tests
that open arbitrary files or construct independent database clients.

## Authentication behavior

Registration/login consume the existing schema's trimmed lowercase email. Passwords
are never trimmed. Existing display-name validation remains unchanged. Compatibility
lookup compares SQLite `lower(trim(email, <ECMAScript whitespace>))` to the validated
ASCII email. A unique legacy identity may log in without rewriting its stored email;
multiple matches fail with generic invalid credentials. Registration rejects any
matching identity. No accounts are merged, renamed or migrated. Existing canonical
email uniqueness also handles concurrent inserts; unique conflicts return 409.

Registration creates the account and session in one transaction. Session lookup,
issuance and revocation operational failures return a sanitized 503 without stack
or database details. Logout clears this browser's cookie even on 503, but reports
success only after successful/idempotent server revocation. A copied token may remain
valid following a failed revocation. Cookie flags and Origin/CSRF checks are preserved.

Login and registration share the credential budget (10 requests/15 minutes outside
tests). Session checks/logout do not consume that budget; the general API limiter
still applies. The ordinary test router retains its higher test budget; regression
tests inject a small real limiter to exercise exhaustion without thousands of calls.

Compatibility lookup can scan the user table because no normalized-identity index is
added in this phase. A future approved migration can introduce an indexed canonical
identity after a collision review. Such a migration is not performed automatically.

## Static checks

```powershell
node node_modules/typescript/bin/tsc -p backend/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p backend/tsconfig.tests.json --noEmit
```

Run ESLint from `backend` against `src`, `tests/auth.test.ts`,
`tests/authHardening.test.ts` and `testing/setup.ts`. Existing unrelated test lint
issues do not justify changes to agricultural logic or frontend files.

Keep `testing/database-safety.cjs` alongside the backend when packaging it: compiled
configuration imports the guard from that project-local location. No frontend
authentication contract or visual change is required.

## Local demo account (development database only)

Created for manual UI checks against `backend/prisma/dev.db`; it does not exist in any other environment.

- Email: `demo.farmer@profarm.test`
- Password: `Demo-Field-6b7072be`
