# HANDOFF REPORT: BACKEND ARCHITECTURE, API PROXY, MOCK DATA & HEALTH CHECK SURVEY

> **Agent:** Explorer (`explorer_survey_backend`)  
> **Destination Path:** `/home/ddicgegd/Projects/noname/.agents/explorer_survey_backend/handoff.md`  
> **Recipient:** Orchestrator (`067cf0e6-5e76-4e91-929c-5e4ad25ae3b0`)  
> **Timestamp:** 2026-09-04T08:30:00+07:00  
> **Type:** Hard Handoff (Investigation & Survey Complete)

---

## 1. OBSERVATION

1. **Stack & Routing Architecture:**
   - In `package.json` (lines 6–14, 15–37):
     ```json
     "scripts": {
       "dev": "tsx server.ts",
       "prestart": "npm run build",
       "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
       "start": "NODE_ENV=production node dist/server.cjs",
       "lint": "tsc --noEmit"
     },
     "dependencies": {
       "express": "^4.21.2",
       "react": "^19.0.1",
       "vite": "^6.2.3"
     }
     ```
     The codebase does NOT use Next.js. There are no Next.js App Router files or `src/app/api/...` route handlers.
     Instead, it is a **Vite 6 + React 19 SPA** paired with an **Express 4 custom server** (`server.ts`).

2. **Health Check Endpoint:**
   - In `server.ts` (lines 32–35):
     ```typescript
     // Health check endpoint
     app.get("/api/health", (req, res) => {
       res.json({ status: "ok", message: "Server is healthy and running" });
     });
     ```
   - Running `curl -s http://localhost:3000/api/health` returned verbatim:
     ```json
     {"status":"ok","message":"Server is healthy and running"}
     ```
     Process listening on port 3000 was verified via `ss -tulpn | grep 3000` and `ps -f -p 479206` as `node dist/server.cjs`.

3. **CORS & Reverse Proxy Endpoint:**
   - In `server.ts` (lines 1580–1669):
     `app.all("/api/proxy", async (req, res) => { ... })` receives a target URL from `x-target-url` header or `?url=` query parameter, strips hop-by-hop/conflicting headers, performs server-side `fetch(targetUrl, { method, headers, body })`, and echoes back response status, headers, and body, or returns HTTP 502 Bad Gateway if the target server is unreachable.
     `app.options("/api/proxy", ...)` handles preflight CORS requests.

4. **Client-side API Client & Auth:**
   - In `src/lib/api.ts` (lines 9–11, 202–252, 254–337):
     `getApiBaseUrl()` returns `import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"`.
     `unifiedFetch` attaches `Authorization: Bearer <token>` and automatically intercepts 401 status to execute `executeRefreshToken()`.
     In `src/components/AuthReportDashboard.tsx` (line 532):
     Direct proxy calls are made as `const proxyUrl = '/api/proxy?url=' + encodeURIComponent(targetUrl)`.

5. **Page Navigation & Dashboard Container:**
   - In `src/App.tsx` (lines 64–77, 432–441):
     SPA path routing is handled by `getPageFromPath(window.location.pathname)`. Paths `/auth-report` and `/diagnostic` render `<AuthReportDashboard onNavigate={navigate} />`.
   - In `src/components/AuthReportDashboard.tsx` (lines 325, 785–851):
     Active tabs are currently `"diagnostics" | "jwt" | "redis" | "traffic" | "me-profile"`. Adding a new tab for Fineract requires adding `"fineract"` to the state union and rendering a new navigation tab button.

6. **Build & Lint Verification:**
   - `npm run build` executed `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` and exited with code 0 in 4.17s.
   - `npm run lint` (`tsc --noEmit`) revealed 3 pre-existing type errors in `src/components/OrderPage.tsx` (lines 664, 665, 682 regarding `availableColors`, `availableSizes`, `discount` on `CartItem`), but did not affect the Vite build or `/auth-report`.

7. **Fineract Technical Spec Constraints:**
   - Directly observed in `/home/ddicgegd/Projects/erp_springboot-experiment/docs/features/FINERACT_DESIGN_SPEC.md`:
     - Client creation requires `officeId: 1`, `legalFormId: 1`, `dateFormat: "dd MMMM yyyy"`, `locale: "en"`.
     - Loan lifecycle state machine: `100: PENDING_APPROVAL` -> `200: APPROVED` (via `/approve`) -> `300: ACTIVE` (via `/disburse`) -> `600: OBLIGATIONS_MET` (via `/repayments` until balance is 0). Reject (500) and Withdraw (400) originate from state 100.
     - General Ledger double-entry invariant: $\sum \text{Debit} \equiv \sum \text{Credit}$.
     - GL Account Resolver Matrix: COD -> Cash (GL 1); Bank/VNPAY -> Bank (GL 4); Sales Revenue (GL 2); Sales Returns (GL 3).
     - Kafka EDA events: `ORDER_STATUS_CHANGED` with `newStatus: "PROCESSING"` generates `SALE-{orderNumber}`; with `newStatus: "REFUNDED"` generates `REFUND-{orderNumber}`.
     - Fineract error response structure: `fineractResponse` JSON containing `developerMessage`, `defaultUserMessage`, `userMessageGlobalisationCode`.

---

## 2. LOGIC CHAIN

1. **Premise:** The user request asks how API routes are implemented (e.g. `src/app/api/...`), how proxying works, how `/api/health` works, and how mock fallbacks should be structured.
2. **Analysis of Stack (from Observation 1):** Because the project uses Vite + Express (and not Next.js), there is no Next.js App Router or Server Components. All backend logic is hosted in Express (`server.ts`), and the frontend is an SPA.
3. **Analysis of Health Check (from Observation 2):** Express handles `/api/health` synchronously at port 3000, returning `{ status: "ok", message: "Server is healthy and running" }`.
4. **Analysis of Proxying (from Observation 3 & 4):** Since Express provides `/api/proxy?url=...`, client-side code can call any external HTTP/HTTPS endpoint without browser CORS restrictions. When live backend is offline, `/api/proxy` returns HTTP 502 Bad Gateway.
5. **Analysis of Mock Requirement (from Observation 7 & ORIGINAL_REQUEST.md R1):** Because an external Apache Fineract instance or Spring Boot backend may not always be running during development or testing, a self-contained, reactive Mock Fallback Engine is essential. Providing an interactive Toggle between "Live API Proxy" and "Mock Fallback Data" satisfies Requirement R1.
6. **Integration Point (from Observation 5):** `AuthReportDashboard.tsx` is located at `/auth-report` and already contains a clean multi-tab layout. Adding a new tab `"fineract"` with sub-views (Overview, Clients, Loans, General Ledger, Kafka EDA Monitor, Error Inspector) integrates seamlessly into the existing page structure without breaking current tabs.
7. **Conclusion:** A hybrid architecture featuring a dedicated Fineract service (`src/services/fineractService.ts`), an in-memory/localStorage stateful mock engine (`src/lib/fineractMockStore.ts`), and an error extractor (`src/lib/fineractErrorExtractor.ts`) fulfills all requirements with zero build breakage.

---

## 3. CAVEATS

1. **Backend Connectivity:** In the current environment, no local Apache Fineract instance was found listening on port 8443, nor Spring Boot on port 8080. Therefore, the Mock Engine must be the default active mode on initial load so the dashboard is immediately interactive and fully functional.
2. **Pre-existing Lint Errors:** `tsc --noEmit` flags 3 property errors in `src/components/OrderPage.tsx`. These do not affect `vite build` or the `/auth-report` dashboard, but any newly created Fineract code should maintain 100% strict TypeScript typing.
3. **Dev Server Process:** A production build process (`node dist/server.cjs`) was currently running on port 3000. For development work, developers or agents should ensure the post-task service restart rule is adhered to (`fuser -k 3000/tcp 2>/dev/null || true` followed by `npm run dev` and health verification).

---

## 4. CONCLUSION

The system architecture is fully mapped. The recommended technical approach for implementing Fineract Core Banking inside `/auth-report` is:
1. **Types:** Define comprehensive data contracts in `src/types/fineract.ts`.
2. **Mock Engine:** Implement `src/lib/fineractMockStore.ts` with state machine transitions, double-entry balance validation, and Kafka event simulation.
3. **Error Extractor:** Implement `src/lib/fineractErrorExtractor.ts` for parsing `fineractResponse`.
4. **Service Layer:** Implement `src/services/fineractService.ts` supporting the Live Proxy vs Mock Toggle.
5. **UI Components:** Mount a new "Core Banking (Fineract)" tab in `src/components/AuthReportDashboard.tsx` linking to modular subsystem components in `src/components/fineract/`.

---

## 5. VERIFICATION METHOD

To independently verify these findings:

1. **Verify Health Check Endpoint:**
   ```bash
   curl -s http://localhost:3000/api/health
   ```
   *Expected output:* `{"status":"ok","message":"Server is healthy and running"}`.

2. **Verify Build Capability:**
   ```bash
   npm run build
   ```
   *Expected output:* Vite builds client assets into `dist/`, esbuild bundles `server.ts` into `dist/server.cjs`, exits with code 0.

3. **Inspect Proxy Implementation:**
   Inspect lines 1580–1669 of `/home/ddicgegd/Projects/noname/server.ts` to confirm `/api/proxy` parameter handling and CORS headers.

4. **Inspect Route Mounting in UI:**
   Inspect lines 64–77 and 432–441 of `/home/ddicgegd/Projects/noname/src/App.tsx` to confirm path resolution for `/auth-report`.

5. **Review Detailed Report:**
   Read `/home/ddicgegd/Projects/noname/.agents/explorer_survey_backend/report.md`.
