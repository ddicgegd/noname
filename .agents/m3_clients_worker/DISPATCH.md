## 2026-09-04T01:47:33Z

You are the Worker implementing Milestone 3 (M3: Clients Management Subsystem - fineract-clients - R2) for the Apache Fineract Core Banking integration.

Read the authoritative documents:
1. /home/ddicgegd/Projects/noname/.agents/ORIGINAL_REQUEST.md
2. /home/ddicgegd/Projects/noname/PROJECT.md
3. /home/ddicgegd/Projects/noname/TEST_READY.md
4. /home/ddicgegd/Projects/noname/.agents/spec_miner_survey/report.md
5. /home/ddicgegd/Projects/noname/.agents/m2_shell_worker/report.md

Your assigned working directory is /home/ddicgegd/Projects/noname/.agents/m3_clients_worker/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership files:
- src/components/fineract/FineractClients.tsx
- src/components/fineract/ClientDetailDrawer.tsx
- src/components/fineract/ClientRegistrationModal.tsx
- src/components/fineract/FineractDashboard.tsx (integrate <FineractClients /> when activeSubTab === "clients")

Scope of implementation:
1. src/components/fineract/FineractClients.tsx:
   - Header with title "Quản Lý Khách Hàng Tài Chính (Clients Subsystem)".
   - Role View Switcher: Admin (Staff) View (`GET /clients`) vs Customer View (`GET /clients?externalId={userId}`). Shows simulated current user ID or allows inputting an externalId.
   - Search bar: Filter clients in real-time by name, account number, mobile, external ID.
   - Status filters: All, Active, Pending.
   - High-density client directory table:
     * Avatar / ID badge
     * Full Display Name & Vietnamese parts (firstname, lastname)
     * Account Number (`accountNo`, monospace)
     * External ID (ERP User linkage)
     * Office Name (`officeName`)
     * Activation Date (`dd MMMM yyyy`)
     * Status badge (`Active` green, `Pending` amber, `Closed` slate)
     * Actions: "Xem Chi Tiết" (opens detail drawer)
   - "Đăng Ký Khách Hàng Mới" vermilion action button (opens registration modal).
   - Instant UI reactivity: creating a client immediately updates the table, selection counts, and overview stats.
2. src/components/fineract/ClientDetailDrawer.tsx:
   - Slide-out sheet or modal inspecting the selected client.
   - Comprehensive profile:
     * Display name, account number, external ID, status badge.
     * Legal form (Person / Thể nhân), branch office.
     * Contact details: Email address, mobile phone number.
     * Activation date and timeline.
     * Linked loan accounts list for this client (querying fineractService.getLoans(client.id)) with direct loan status badges and principal.
     * Quick actions: Copy account number, copy external ID.
3. src/components/fineract/ClientRegistrationModal.tsx:
   - Registration dialog for new clients:
     * Field for Full Name ("Họ và tên đầy đủ") with automatic Vietnamese name parsing into `firstname` and `lastname`, or separate fields.
     * External ID (ERP User ID).
     * Email address & Mobile phone number with regex validation.
     * Office ID (default: 1 - Trụ sở chính).
     * Legal Form (default: 1 - Person).
     * Activation Date (default: today with format `dd MMMM yyyy`).
     * Form validation: Blocks submission if required fields are missing; displays clear error hints.
     * Submission: Calls `fineractService.createClient(...)`.
     * Feedback: Triggers `toast.success(...)` on success or `toast.fineractError(...)` on failure.
     * Automatically closes modal and notifies parent to reload client directory.
4. Integrate with `FineractDashboard.tsx`:
   - Mount `<FineractClients />` in place of the placeholder when `activeSubTab === "clients"`.
   - Update quick stats or client count when clients change.

Styling & Aesthetics (design-taste-frontend):
- Strict dark technical cockpit aesthetic: `#0F1115` base, `#15181F` surfaces, `border-slate-800/80`, `#FF4D24` accent, monospace for IDs, accounts, and dates. Lucide icons with strokeWidth={1.75}.

Verification:
- Run `npm run build` (0 TypeScript / bundling errors).
- Run `npx tsx tests/fineract/run-tests.ts` (102/102 pass).
- Execute AGENTS.md service restart & health check sequence:
  1. fuser -k 3000/tcp 2>/dev/null || true
  2. npm run dev
  3. curl -s http://localhost:3000/api/health returns {"status":"ok",...}
- Write report in /home/ddicgegd/Projects/noname/.agents/m3_clients_worker/report.md and handoff in /home/ddicgegd/Projects/noname/.agents/m3_clients_worker/handoff.md.
- Send message to parent (conversation ID: 067cf0e6-5e76-4e91-929c-5e4ad25ae3b0) when complete.
