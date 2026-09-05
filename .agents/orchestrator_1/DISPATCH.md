## 2026-09-04T01:27:05Z
You are the Project Orchestrator for this project.
Your assigned working directory is: /home/ddicgegd/Projects/noname/.agents/orchestrator_1/
The project root is: /home/ddicgegd/Projects/noname
The original user request is stored at: /home/ddicgegd/Projects/noname/.agents/ORIGINAL_REQUEST.md
Reference spec is available at: /home/ddicgegd/Projects/erp_springboot-experiment/docs/features/FINERACT_DESIGN_SPEC.md

Maintain your BRIEFING.md and progress.md in your working directory (/home/ddicgegd/Projects/noname/.agents/orchestrator_1/).

Please implement the user request thoroughly:
Build a high-density, functional Core Banking & Financial Ledger (Apache Fineract) management dashboard inside the existing React/Tailwind frontend at /auth-report.
Integrity mode: development

Requirements:
- R1. Shell Container & Overview Metrics (fineract-overview):
  Create main Fineract dashboard container within /auth-report with KPI cards (Total Outstanding Principal, Cash & Bank Ledger Balances, Fineract Client Count, Gateway & Kafka EDA Health Status) and a toggle between live backend API proxy and high-fidelity mock fallback data.
- R2. Clients Management Subsystem (fineract-clients):
  Client directory with Admin vs Customer role views (upstream GET /clients vs GET /clients?externalId={userId}), client detail drawer/modal, and client registration modal form with field validation and toast notifications.
- R3. Loan Products & Loan Lifecycle State Machine (fineract-loans):
  Loan Product catalog and comprehensive Loan Accounts manager. Loan detail views with interactive Repayment Schedules. Implement state transition controls matching Fineract's strict state machine: Approve (POST /loans/{id}/approve), Disburse (POST /loans/{id}/disburse), Reject (POST /loans/{id}/reject), Withdraw (POST /loans/{id}/withdraw), and Repayment (POST /loans/{id}/repayments), with confirmation modals and date pickers.
- R4. Double-Entry General Ledger Subsystem (fineract-ledger):
  Display all general ledger journal entries (GET /journalentries) and manual journal entry posting form. Enforce real-time validation of double-entry invariant: Sum(Debit) == Sum(Credit) before submission. Include GL Account Resolver matrix reference diagram/table (Cash, Bank, Sales Revenue, Sales Returns).
- R5. Kafka EDA Order-to-Ledger Event Monitor (fineract-eda-events):
  Event streaming monitor and simulator for order-topic messages that demonstrates automatic ledger posting: PROCESSING triggering SALE-{orderNumber} and REFUNDED triggering REFUND-{orderNumber}.
- R6. Toast Feedback & Error Inspector:
  Application-wide toast system for success/error feedback. When backend errors occur, extract and format fineractResponse JSON (developerMessage, defaultUserMessage, userMessageGlobalisationCode) for human-readable diagnostics.

Acceptance Criteria:
- Verification & Build:
  - npm run build succeeds with zero TypeScript or bundling errors.
  - Dev server restarts on port 3000 (npm run dev) and curl -s http://localhost:3000/api/health returns status "ok".
  - Navigating to /auth-report displays the new Fineract Core Banking tab seamlessly without breaking existing tabs.
- Functional Integrity:
  - Clients can be listed, filtered, and newly created with instant UI update.
  - Loans display current state badges; state transitions (Approve, Disburse, Repay) update loan status and outstanding balance.
  - Double-entry form blocks submission when Debit != Credit and enables submission when balanced.
  - Kafka event simulator generates corresponding SALE/REFUND journal entries in the ledger view.
  - All actions provide responsive toast feedback; errors show detailed Fineract diagnostics.

Strict directives from AGENTS.md / GEMINI.md:
- Direct execution: execute the requested task directly.
- Mandatory post-task service restart & health check sequence:
  1. Kill old process on port 3000: fuser -k 3000/tcp 2>/dev/null || true
  2. Launch dev server in background: npm run dev
  3. Verify health endpoint: curl -s http://localhost:3000/api/health returns {"status":"ok",...}
- No git reset or revert.

Notify me when complete with full details of changes and verification.
