# Original User Request

## 2026-09-04T01:26:37Z

Build a high-density, functional Core Banking & Financial Ledger (Apache Fineract) management dashboard inside the existing React/Tailwind frontend at /auth-report.

Working directory: /home/ddicgegd/Projects/noname
Integrity mode: development

Reference: /home/ddicgegd/Projects/erp_springboot-experiment/docs/features/FINERACT_DESIGN_SPEC.md

## Requirements

### R1. Shell Container & Overview Metrics (fineract-overview)
Create the main Fineract dashboard container within /auth-report featuring KPI cards (Total Outstanding Principal, Cash & Bank Ledger Balances, Fineract Client Count, Gateway & Kafka EDA Health Status) and a toggle between live backend API proxy and high-fidelity mock fallback data.

### R2. Clients Management Subsystem (fineract-clients)
Implement Fineract client directory with support for Admin vs Customer role views (upstream GET /clients vs GET /clients?externalId={userId}), client detail drawer/modal, and client registration modal form with field validation and toast notifications.

### R3. Loan Products & Loan Lifecycle State Machine (fineract-loans)
Provide a Loan Product catalog and comprehensive Loan Accounts manager. Include loan detail views with interactive Repayment Schedules. Implement state transition controls matching Fineract's strict state machine: Approve (POST /loans/{id}/approve), Disburse (POST /loans/{id}/disburse), Reject (POST /loans/{id}/reject), Withdraw (POST /loans/{id}/withdraw), and Repayment (POST /loans/{id}/repayments), with confirmation modals and date pickers.

### R4. Double-Entry General Ledger Subsystem (fineract-ledger)
Display all general ledger journal entries (GET /journalentries) and provide a manual journal entry posting form. Enforce real-time validation of the double-entry invariant: Sum(Debit) == Sum(Credit) before allowing submission. Include a reference diagram/table of the GL Account Resolver matrix (Cash, Bank, Sales Revenue, Sales Returns).

### R5. Kafka EDA Order-to-Ledger Event Monitor (fineract-eda-events)
Build an event streaming monitor and simulator for order-topic messages that demonstrates automatic ledger posting: PROCESSING triggering SALE-{orderNumber} and REFUNDED triggering REFUND-{orderNumber}.

### R6. Toast Feedback & Error Inspector
Implement an application-wide toast system for success/error feedback. When backend errors occur, extract and format fineractResponse JSON (developerMessage, defaultUserMessage, userMessageGlobalisationCode) to give human-readable diagnostic information.

## Acceptance Criteria

### Verification & Build
- [ ] npm run build succeeds with zero TypeScript or bundling errors.
- [ ] Dev server restarts on port 3000 (npm run dev) and curl -s http://localhost:3000/api/health returns status "ok".
- [ ] Navigating to /auth-report displays the new Fineract Core Banking tab seamlessly without breaking existing tabs.

### Functional Integrity
- [ ] Clients can be listed, filtered, and newly created with instant UI update.
- [ ] Loans display current state badges; state transitions (Approve, Disburse, Repay) update loan status and outstanding balance.
- [ ] Double-entry form blocks submission when Debit != Credit and enables submission when balanced.
- [ ] Kafka event simulator generates corresponding SALE/REFUND journal entries in the ledger view.
- [ ] All actions provide responsive toast feedback; errors show detailed Fineract diagnostics.
