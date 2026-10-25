# ProFarm Legacy Feature Mapping & Modernization Plan

This document maps all legacy features discovered during the Phase 1 audit of `ProFarm-NASA-space-apps--main` to their planned modern destinations in `ProFarm-V2`.

**Status:** Planning & Reference Only (Features remain unmigrated until future phases).

---

## Feature-by-Feature Migration Matrix

| Legacy Feature | Original Source Location | Current Legacy Status | Proposed Modern Module | Priority | Target Dependencies | Key Defects in Legacy Implementation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Authentication** | `app.js#L23-L51`<br>`public/login/*` | ⚠️ Insecure & Incomplete | `backend/src/routes/auth.routes.ts`<br>`frontend/src/pages/LoginPage.tsx` | **Critical (P0)** | `argon2`, `jsonwebtoken`, `cookie-parser` | Passwords stored in plaintext in `users.json`; no sessions or JWT issued; login response returns dummy greeting. |
| **Homepage Farming Form** | `public/index.html`<br>`public/index.js` | ❌ Non-functional | `frontend/src/components/forms/FarmingInputForm.tsx`<br>`backend/src/routes/recommendation.routes.ts` | **High (P1)** | React Hook Form, Zod | `index.js` was never imported into HTML; form submission just reloaded page via GET parameters. |
| **Soil Knowledge Wiki** | `public/soilwiki/*`<br>`public/soilwiki/Soil/*` | ❌ Runtime Crashes | `frontend/src/pages/KnowledgePage.tsx`<br>`frontend/src/components/knowledge/SoilWiki.tsx` | **High (P1)** | None (local structured JSON / DB) | `soil.js` crashes immediately with `TypeError: null addEventListener`; external image links broken; missing pages for silt and peat. |
| **Crop Encyclopedia** | `public/crop/*` | ❌ Corrupt DOM & Broken Script | `frontend/src/pages/KnowledgePage.tsx`<br>`frontend/src/components/knowledge/CropEncyclopedia.tsx` | **High (P1)** | Lucide Icons, Clean Assets | File contains 3 nested `<!DOCTYPE>` and `<body>` tags; leftover form handlers crashed script; broken image paths (`/wheat.jpg`). |
| **Farm Management Dashboard** | `public/farm-dashboard/*` | ⚠️ Orphaned & Exposed Keys | `frontend/src/pages/DashboardPage.tsx`<br>`backend/src/routes/weather.routes.ts` | **High (P1)** | Recharts / Chart.js, OpenWeather API | Page was completely unlinked from site navigation; API keys hardcoded client-side; calls non-existent domain `api.marketprices.com`. |
| **Rainfall / Precipitation Analysis** | `public/precipitation/*` | ⚠️ Static / Broken CSS | `frontend/src/pages/ToolsPage.tsx`<br>`frontend/src/components/tools/RainfallAnalysis.tsx` | **Medium (P2)** | Recharts, IMD / NASA POWER API | Missing stylesheet link (referenced `style.css` instead of `styles.css`); static Excel-dump JSON containing empty records. |
| **Crop Yield Prediction** | `public/maps/cropyeild.html`<br>`public/maps/app.js` | ❌ Incomplete / Mock Echo | `frontend/src/pages/ToolsPage.tsx`<br>`backend/src/services/agronomy.service.ts` | **Medium (P2)** | Leaflet / MapLibre, Agronomic Algorithm | Form merely echoes input values back into innerHTML with comment `<!-- Add your prediction result here -->`; typo in filename. |
| **Mandi Commodity Prices** | `public/maps/dataindex.html`<br>`public/maps/data.json` | ⚠️ Severe Performance Lag | `frontend/src/pages/ToolsPage.tsx`<br>`backend/src/routes/mandi.routes.ts` | **Medium (P2)** | TanStack Table, AGMARKNET API / SQLite | 4.75 MB JSON loaded directly into unpaginated DOM table, freezing browser; pie chart renders 100+ unreadable slices. |
| **Farmers Reminder System** | `public/reminders/*` | ⚠️ Buggy / Browser-Only | `frontend/src/pages/ToolsPage.tsx`<br>`backend/src/routes/reminders.routes.ts` | **Medium (P2)** | FullCalendar / custom grid, Web Push | Reminders stored only in browser `localStorage`; critical array index mismatch bug corrupts/deletes wrong reminders. |
| **NASA Earth Observation Data** | *None in legacy* | ❌ Missing Entirely | `backend/src/services/nasa.service.ts` | **High (P1)** | NASA POWER API, Axios | Zero NASA integration despite being a NASA Space Apps project; needs daily solar radiation, rainfall, and soil moisture. |

---

## Migration Prerequisites

1. **Do not migrate legacy `users.json`:** Test user records with plaintext passwords must be permanently discarded.
2. **Sanitize datasets:**
   - The Mandi dataset (`maps/data.json`, 4.75 MB) and Rainfall dataset (`precipitation/data.json`, 213 KB) must be transformed and seeded into SQLite or indexed via API rather than bundled into frontend client memory.
3. **Asset Migration:**
   - Image assets (`millet.jpeg`, `rice.jpg`, `wheat.jpg`, `ProFarmlogo.png`) must be optimized, compressed to WebP, and moved to `frontend/public/assets/`.
