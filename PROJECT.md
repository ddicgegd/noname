# Project: Apache Fineract Core Banking & Financial Ledger Dashboard

## Architecture
- **Tech Stack:** React 19 + Vite 6 (SPA) with Express 4 backend server (`server.ts`).
- **Dashboard Host:** `/auth-report` route in `src/App.tsx`, hosted inside `src/components/AuthReportDashboard.tsx`.
- **Fineract Module Root:** `src/components/fineract/` (encapsulated, modular architecture).
- **Core Engine & Mock Store:** `src/lib/fineractMockStore.ts` and `src/services/fineractService.ts`.
- **Proxy Gateway:** `/api/proxy` on Node.js server forward requests to Spring Boot backend (`http://localhost:8080/api/v1/erp/...`) or upstream Fineract (`https://localhost:8443/...`), with instant seamless fallback to high-fidelity mock store when offline or toggled.
- **Styling:** Tailwind CSS v4, Base UI primitives (`@base-ui/react`), Lucide React icons, dark cockpit enterprise theme matching `/auth-report`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Shell Container & Overview Metrics | Main dashboard container at `/auth-report` with KPI cards (Outstanding Principal, Cash/Bank Ledger Balances, Client Count, Health) | M2 | ORIGINAL_REQUEST R1 |
| F2 | Live Proxy / Mock Data Toggle | Toggle switch between live backend proxy and high-fidelity mock fallback store | M2 | ORIGINAL_REQUEST R1 |
| F3 | Subsystem Health Monitoring | Health status pills for Fineract Core API, Spring Boot Gateway, and Kafka EDA | M2 | ORIGINAL_REQUEST R1 |
| F4 | Clients Management Directory | Client table with search, status badges, and Admin vs Customer role views | M3 | ORIGINAL_REQUEST R2 |
| F5 | Client Detail Drawer | Slide-out sheet inspecting full client profile, office, and external ID | M3 | ORIGINAL_REQUEST R2 |
| F6 | Client Registration Form | Modal form with Vietnamese name parsing, validation, and instant creation | M3 | ORIGINAL_REQUEST R2 |
| F7 | Loan Product Catalog | Catalog cards displaying credit limits, interest rates, and installment periods | M4 | ORIGINAL_REQUEST R3 |
| F8 | Loan Accounts Manager | Loans listing with lifecycle status badges (100 to 600) | M4 | ORIGINAL_REQUEST R3 |
| F9 | Repayment Schedule View | Interactive installment schedule table showing principal, interest, paid, and outstanding | M4 | ORIGINAL_REQUEST R3 |
| F10 | Loan Lifecycle State Machine | Transitions: Approve (100->200), Disburse (200->300), Reject (100->500), Withdraw (100->400), Repay (300->600) | M4 | ORIGINAL_REQUEST R3 |
| F11 | General Ledger Journal Entries | Audit browser displaying GL transactions, dates, reference numbers, debits, credits | M5 | ORIGINAL_REQUEST R4 |
| F12 | Manual Journal Entry Posting | Modal dialog for posting custom multi-line journal vouchers | M5 | ORIGINAL_REQUEST R4 |
| F13 | Double-Entry Balance Invariant Guard | Real-time validation enforcing Sum(Debit) == Sum(Credit), blocking submit when unbalanced | M5 | ORIGINAL_REQUEST R4 |
| F14 | GL Account Resolver Matrix Table | Visual table showing COD and Bank mapping to Cash (1), Bank (4), Sales Revenue (2), Returns (3) | M5 | ORIGINAL_REQUEST R4 |
| F15 | Kafka EDA Order-Topic Event Monitor | Live event stream monitor for Kafka `order-topic` messages | M5 | ORIGINAL_REQUEST R5 |
| F16 | Kafka EDA Event Simulator | Interactive event emitter: `PROCESSING` -> `SALE-{orderNumber}`, `REFUNDED` -> `REFUND-{orderNumber}` | M5 | ORIGINAL_REQUEST R5 |
| F17 | Application-Wide Toast Feedback | Toast notification system for success, warning, and error actions | M2 | ORIGINAL_REQUEST R6 |
| F18 | Fineract Error Inspector | Diagnostic parser extracting `developerMessage`, `defaultUserMessage`, and i18n codes | M2 | ORIGINAL_REQUEST R6 |
| F19 | E2E Integration & Service Restart | Tab coexistence, build verification (`npm run build`), server restart & health check | M6 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Engine, Types & Mock Store | Domain types, stateful mock store, state machine logic, GL invariant, unified service client | none | PLANNED |
| M2 | Dashboard Shell, Toasts & Overview | Tab button in AuthReportDashboard, FineractDashboard shell, Overview KPIs, Toast & Error Inspector | M1 | PLANNED |
| M3 | Clients Management Subsystem | Client directory, Admin vs Customer view, detail drawer, registration modal | M1, M2 | PLANNED |
| M4 | Loan Products & Lifecycle FSM | Loan products catalog, accounts manager, repayment schedule, Approve/Disburse/Repay controls | M1, M2 | PLANNED |
| M5 | General Ledger & Kafka EDA Events | Journal entries browser, double-entry form, GL Account matrix, Kafka simulator & monitor | M1, M2 | PLANNED |
| M6 | Final E2E Verification & Health Check | Complete E2E integration test, build verification, restart dev server, verify `/api/health` | M1-M5 | PLANNED |

## Interface Contracts

### Data Layer ↔ UI Subsystems
`src/services/fineractService.ts`:
```typescript
export interface IFineractService {
  // Mode & Configuration
  getMode(): "live" | "mock";
  setMode(mode: "live" | "mock"): void;
  getSystemHealth(): Promise<FineractHealthStatus>;

  // Clients
  getClients(role?: "admin" | "customer", externalId?: string): Promise<FineractClient[]>;
  getClient(id: number): Promise<FineractClient>;
  createClient(payload: CreateClientPayload): Promise<FineractClient>;

  // Loan Products & Accounts
  getLoanProducts(): Promise<LoanProduct[]>;
  getLoans(clientId?: number): Promise<LoanAccount[]>;
  getLoan(id: number): Promise<LoanAccount>;
  createLoan(payload: CreateLoanPayload): Promise<LoanAccount>;
  approveLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  disburseLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  rejectLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  withdrawLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  repayLoan(id: number, amount: number, date: string): Promise<{ loan: LoanAccount; transactionId: number }>;

  // General Ledger
  getJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(payload: CreateJournalEntryPayload): Promise<JournalEntry>;

  // Kafka EDA
  simulateKafkaOrderEvent(event: KafkaOrderEvent): Promise<{ event: KafkaOrderEvent; journalEntry?: JournalEntry }>;
  getKafkaEvents(): Promise<KafkaOrderEvent[]>;
}
```

### Double-Entry Invariant
- Every journal entry MUST satisfy:
  `abs(sum(debits.amount) - sum(credits.amount)) < 0.001`
- Number of debits >= 1 and number of credits >= 1.
- All amounts > 0.

### Fineract Error Contract
- Payload contains `fineractResponse` stringified or parsed object.
- Extractor parses:
  - `developerMessage`: string
  - `defaultUserMessage`: string
  - `userMessageGlobalisationCode`: string
  - `parameterName`: string

## Code Layout
```
src/
├── components/
│   ├── AuthReportDashboard.tsx           # Existing tab container, modified to mount "fineract" tab
│   └── fineract/
│       ├── FineractDashboard.tsx         # Main Fineract container & sub-navigation
│       ├── FineractOverview.tsx          # R1: KPI cards & gateway health
│       ├── FineractClients.tsx           # R2: Clients directory & actions
│       ├── ClientDetailDrawer.tsx        # R2: Detail inspection drawer
│       ├── ClientRegistrationModal.tsx   # R2: Registration modal form
│       ├── FineractLoans.tsx             # R3: Loan products, accounts & state machine
│       ├── LoanDetailModal.tsx           # R3: Loan contract & repayment schedule
│       ├── LoanActionModal.tsx           # R3: Approve / Disburse / Reject / Withdraw / Repay modals
│       ├── FineractLedger.tsx            # R4: Double-entry ledger browser & GL matrix
│       ├── JournalEntryModal.tsx         # R4: Manual journal voucher form with invariant guard
│       ├── FineractEdaEvents.tsx         # R5: Kafka order event streaming monitor & simulator
│       ├── FineractToast.tsx             # R6: Toast provider & notification alerts
│       └── FineractErrorInspector.tsx    # R6: Diagnostic drawer for fineractResponse
├── types/
│   └── fineract.ts                       # Authoritative TypeScript interfaces & enums
├── lib/
│   ├── fineractMockStore.ts              # In-memory & LocalStorage stateful simulation engine
│   └── fineractErrorExtractor.ts         # Diagnostic parser for Fineract exceptions
└── services/
    └── fineractService.ts                # Unified API client (live proxy + mock fallback)
```
