# APACHE FINERACT CORE BANKING & FINANCIAL LEDGER INTEGRATION
## AUTHORITATIVE SPECIFICATION SURVEY & REQUIREMENTS REPORT

> **Document Version:** 1.0.0  
> **Author:** Specification Miner Agent  
> **Target System:** Frontend Dashboard (`noname` at `/auth-report`) & Backend ERP (`com.ddicg.erp.modules.fineract`)  
> **Authoritative Sources Analyzed:**  
> 1. `/home/ddicgegd/Projects/noname/.agents/ORIGINAL_REQUEST.md`  
> 2. `/home/ddicgegd/Projects/erp_springboot-experiment/docs/features/FINERACT_DESIGN_SPEC.md`  
> 3. Spring Boot Backend Source Files: `FineractClientController.java`, `FineractClientService.java`, `FineractLoanController.java`, `FineractLoanService.java`, `FineractLoanProductController.java`, `FineractJournalController.java`, `FineractJournalService.java`, `GlAccountResolver.java`, `OrderFineractConsumer.java`, `FineractExceptionHandler.java`, `FineractProperties.java`, DTOs, and unit tests (`FineractLoanServiceTest.java`, `FineractClientServiceTest.java`, `OrderFineractConsumerTest.java`)  
> 4. Frontend Integration Context: `src/components/AuthReportDashboard.tsx`, `server.ts` (`/api/proxy` & `/api/health`), `src/lib/api.ts`  

---

## 1. Executive Summary & Domain Overview

The Apache Fineract integration serves as the **Core Banking & Financial Ledger Gateway** for the ERP platform. It bridges commercial enterprise business operations (Identity & Access Management, Order Checkout, Payment Processing) with an institutional-grade core banking engine (Apache Fineract 1.x/CN/CN-like platform).

### Core Responsibilities:
1. **Financial Client Identity Management:** Synchronizes ERP `User` entities with Fineract `Client` records with idempotent externalId lookup and Vietnamese name parsing.
2. **Loan Products & Portfolio Lifecycle Management:** Provides a catalog of installment loan products, loan application submission, and enforces a strict finite state machine (FSM) across approval, disbursement, repayment installments, and obligations closure.
3. **Double-Entry General Ledger (GL):** Enforces real-time balance invariants ($\sum \text{Debit} \equiv \sum \text{Credit}$) across all manual and automated journal entries.
4. **Event-Driven Architecture (EDA) Order Synchronization:** Asynchronously listens to Kafka `order-topic` events (`PROCESSING`, `REFUNDED`) and automatically hạch toán (posts journal entries) for sales revenue and sales returns.
5. **High-Density Operator Dashboard:** Embedded inside `/auth-report` of the frontend application (`noname`), complete with live API proxying, mock fallback toggling, and deep Fineract error inspection.

---

## 2. System Architecture & Connection Infrastructure

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ERP Modular Monolith                                     │
│                                                                                        │
│  ┌─────────────────────────┐                  ┌─────────────────────────────────────┐  │
│  │   Module: IAM (User)    │                  │        Module: Order (Checkout)     │  │
│  └───────────┬─────────────┘                  └──────────────────┬──────────────────┘  │
│              │ getOrCreateFineractClient                         │ Domain Event        │
│              ▼                                                   ▼                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           Module: Fineract Gateway                               │  │
│  │                                                                                  │  │
│  │  [FineractClientService]      [FineractLoanService]     [FineractJournalService] │  │
│  │             │                            │                          ▲            │  │
│  │             └───────────────┬────────────┘                          │            │  │
│  │                             │                                       │            │  │
│  │                             ▼                                       │            │  │
│  │                [Spring RestClient + SSL Bypass]                      │            │  │
│  │             (Basic Auth + Fineract Tenant Header)                    │            │  │
│  └─────────────────────────────┼───────────────────────────────────────┼────────────┘  │
│                                │ HTTP/REST                             │               │
└────────────────────────────────┼───────────────────────────────────────┼───────────────┘
                                 │                                       │
                                 │                             ┌─────────┴──────────┐
                                 │                             │ OrderFineractConsumer
                                 │                             │ (Kafka @KafkaListener)
                                 │                             └─────────▲──────────┘
                                 ▼                                       │
                ┌───────────────────────────────────┐                    │ Kafka Broker
                │     Apache Fineract Core API      │                    │ Topic: order-topic
                │   (Multi-tenant Core Banking)     │                    │ Group: fineract-order-group
                │  - Clients Management             │                    │
                │  - Loan Products & Portfolio      │                    │
                │  - General Ledger (Double-Entry)  │                    │
                └───────────────────────────────────┘                    │
                                 ▲                                       │
                                 └───────────────────────────────────────┘
```

### Connection & Configuration Parameters:

| Configuration Property | Java Property | Environment Variable | Default Value | Business & Architectural Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Base URL** | `fineract.baseUrl` | `FINERACT_BASE_URL` | `https://localhost:8443/fineract-provider/api/v1` | Fineract Core REST API root endpoint |
| **Tenant ID** | `fineract.tenantId` | `FINERACT_TENANT_ID` | `default` | Mandatory `Fineract-Platform-TenantId` HTTP header |
| **Username** | `fineract.username` | `FINERACT_USERNAME` | `mifos` | Fineract Administrative Basic Auth username |
| **Password** | `fineract.password` | `FINERACT_PASSWORD` | `password` | Fineract Administrative Basic Auth password |
| **Office ID** | `fineract.officeId` | `FINERACT_OFFICE_ID` | `1` | Default Branch Office (1 = Head Office) |
| **Legal Form ID** | `fineract.legalFormId` | `FINERACT_LEGAL_FORM_ID` | `1` | Client Entity Type (1 = Person / Thể nhân, 2 = Entity) |
| **Date Format** | `fineract.dateFormat` | `FINERACT_DATE_FORMAT` | `dd MMMM yyyy` | Mandatory date format for Fineract payloads (e.g. `04 September 2026`) |
| **Locale** | `fineract.locale` | `FINERACT_LOCALE` | `en` | Number & Date parsing locale |
| **Currency Code** | `fineract.currencyCode` | `FINERACT_CURRENCY_CODE` | `VND` | Operating currency for all ledger postings |
| **SSL Bypass** | `fineract.sslBypass` | `FINERACT_SSL_BYPASS` | `true` | Allows self-signed TLS certs in development |
| **Feature Flag** | `app.fineract.enabled` | `APP_FINERACT_ENABLED` | `true` | Controls background Kafka consumer activation |
| **Cash GL Account ID** | `fineract.cashGlAccountId` | `FINERACT_CASH_GL_ACCOUNT_ID` | `1` | Asset account for Cash on Hand (Tiền mặt) |
| **Bank GL Account ID** | `fineract.bankGlAccountId` | `FINERACT_BANK_GL_ACCOUNT_ID` | `4` | Asset account for Bank Deposits (Tiền gửi ngân hàng) |
| **Sales Revenue GL Account ID** | `fineract.salesRevenueGlAccountId` | `FINERACT_SALES_REVENUE_GL_ACCOUNT_ID` | `2` | Revenue account for Sales (Doanh thu bán hàng) |
| **Sales Returns GL Account ID** | `fineract.salesReturnsGlAccountId` | `FINERACT_SALES_RETURNS_GL_ACCOUNT_ID` | `3` | Contra-revenue account for Returns (Hàng bán bị trả lại) |

---

## 3. Features Discovered Catalog

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | **Overview (R1)** | KPI Metric Cards | Summarizes portfolio metrics: Total Outstanding Principal, Cash & Bank balances, Client Count, Gateway & EDA Health | System state or live API feeds | Metric cards with currency formatting (`VND`), counts, and status pills | Displays fallback values or error badges if metrics unavailable | `ORIGINAL_REQUEST.md` (R1) & `FINERACT_DESIGN_SPEC.md` §1 |
| 2 | **Overview (R1)** | Live Proxy / Mock Data Toggle | Allows operator to switch dashboard between live backend calls (via `/api/proxy`) and mock fallback state | UI toggle switch in header | Switches data source for all tabs; triggers refetch | Graceful warning notification if live proxy target fails | `ORIGINAL_REQUEST.md` (R1) & `server.ts` line 1580 |
| 3 | **Overview (R1)** | Subsystem Health Monitoring | Monitors Fineract Core API, Spring Boot Gateway, and Kafka EDA consumer health | Health checks / ping endpoints | Latency (ms), status badge (Operational, Degraded, Down) | Flags unhealthy nodes with warning/error alert banners | `ORIGINAL_REQUEST.md` (R1) & `FINERACT_DESIGN_SPEC.md` §1.1 |
| 4 | **Clients (R2)** | Client Directory Listing | Lists clients with pagination, status badges, and search filtering | `GET /api/v1/erp/clients` (or upstream `GET /clients`) | Array of `pageItems` with client IDs, names, account numbers, active status | Returns empty list if client not found or unauthorized | `FINERACT_DESIGN_SPEC.md` §2.2 & `FineractClientController.java` |
| 5 | **Clients (R2)** | Role-Based Client Visibility | Filters client list based on authenticated role: Admin/Staff sees all clients; Customer sees only own profile | User JWT token / security context | Filtered client list (Staff: `/clients`; Customer: `/clients?externalId={userId}`) | Returns empty list `{"totalFilteredRecords": 0, "pageItems": []}` for unlinked users | `FINERACT_DESIGN_SPEC.md` §2.2 & `FineractClientService.java` |
| 6 | **Clients (R2)** | Client Detail Inspection Drawer | Shows comprehensive profile: office, activation date, external ID, linked accounts, contact info | `clientId: Long` via `GET /api/v1/erp/clients/{clientId}` | Complete client object from Fineract Core | 404 Not Found toast if client does not exist | `FINERACT_DESIGN_SPEC.md` §2.2 & `FineractClientController.java` |
| 7 | **Clients (R2)** | Client Registration Form | Modal dialog to register a new client with name parsing, office ID, legal form, and contact info | `FineractClientCreateRequestDTO` (firstname, lastname, email, mobile, etc.) | Created client record with `clientId` and `resourceId` | 400 Bad Request with `fieldErrors` if firstname/lastname blank | `FINERACT_DESIGN_SPEC.md` §2.2 & `FineractClientService.java` |
| 8 | **Clients (R2)** | Identity Synchronization & Idempotency | Auto-resolves ERP `userId` to Fineract `clientId` by checking existing `externalId` before creating | ERP `User` entity | `clientId: String` | Reuses existing ID if found; fails safely if user profile incomplete | `FINERACT_DESIGN_SPEC.md` §2.1 & `FineractClientService.java` |
| 9 | **Loans (R3)** | Loan Product Catalog | Displays available credit and installment loan products with term limits and interest rates | `GET /api/v1/erp/loan-products` | List of products: `minPrincipal`, `maxPrincipal`, `interestRatePerPeriod`, etc. | Empty list if no products configured on Fineract | `FINERACT_DESIGN_SPEC.md` §3.1 & `FineractLoanProductController.java` |
| 10 | **Loans (R3)** | Loan Accounts Management | Lists all loan accounts with status pills, principal, disbursed amount, outstanding balance | `GET /api/v1/erp/loans` | List of loan accounts (filtered for customer, all for staff) | Empty list for new/unlinked customer accounts | `FINERACT_DESIGN_SPEC.md` §3.3 & `FineractLoanController.java` |
| 11 | **Loans (R3)** | Loan Application Submission | Creates new loan application under client's profile with calculation rules and disbursement date | Loan application payload (`POST /api/v1/erp/loans`) | `loanId: Long`, `resourceId: Long` | 400/403 with `fineractResponse` if principal out of product bounds | `FINERACT_DESIGN_SPEC.md` §3.3 & `FineractLoanService.java` |
| 12 | **Loans (R3)** | Loan Application Auto-Enrichment | Injects `clientId` from logged-in user into loan payload if omitted | Application payload without `clientId` | Enriched payload sent upstream with resolved `clientId` | Throws `UNAUTHORIZED` if user not logged in | `FINERACT_DESIGN_SPEC.md` §3.3 & `FineractLoanService.java` |
| 13 | **Loans (R3)** | Loan Details & Repayment Schedule | Retrieves loan contract details, totals, and full installment schedule (`periods`) | `GET /api/v1/erp/loans/{loanId}?associations=all` | Full loan object including `repaymentSchedule.periods` | 404 if loan ID invalid | `FINERACT_DESIGN_SPEC.md` §3.3 & `FineractLoanService.java` |
| 14 | **Loans (R3)** | Approve Loan State Transition | Approves pending loan application (`100: PENDING_APPROVAL` -> `200: APPROVED`) | `POST /api/v1/erp/loans/{id}/approve` with `approvedOnDate` | Updated loan command response | 403 error if approved date in future or invalid state | `FINERACT_DESIGN_SPEC.md` §3.2, §3.3 & `FineractLoanController.java` |
| 15 | **Loans (R3)** | Disburse Loan State Transition | Disburses approved loan funds (`200: APPROVED` -> `300: ACTIVE`) | `POST /api/v1/erp/loans/{id}/disburse` with `actualDisbursementDate` | Updated loan command response | 403 error if disbursement date precedes approval date | `FINERACT_DESIGN_SPEC.md` §3.2, §3.3 & `FineractLoanController.java` |
| 16 | **Loans (R3)** | Reject Loan State Transition | Rejects pending loan application (`100: PENDING_APPROVAL` -> `500: REJECTED`) | `POST /api/v1/erp/loans/{id}/reject` with `rejectedOnDate` | Updated loan command response | 403 error if loan not in pending approval state | `FINERACT_DESIGN_SPEC.md` §3.2, §3.3 & `FineractLoanController.java` |
| 17 | **Loans (R3)** | Withdraw Loan State Transition | Applicant withdraws pending loan application (`100: PENDING_APPROVAL` -> `400: WITHDRAWN`) | `POST /api/v1/erp/loans/{id}/withdraw` with `withdrawnOnDate` | Updated loan command response | 403 error if loan already approved/disbursed | `FINERACT_DESIGN_SPEC.md` §3.2, §3.3 & `FineractLoanController.java` |
| 18 | **Loans (R3)** | Repayment Transaction | Posts installment repayment transaction against active loan (`300: ACTIVE`) | `POST /api/v1/erp/loans/{id}/repayments` with amount & date | Transaction `resourceId`, updates balance; transitions to 600 if balance == 0 | 403 error if amount exceeds total outstanding or before disbursement | `FINERACT_DESIGN_SPEC.md` §3.2, §3.3 & `FineractLoanController.java` |
| 19 | **Ledger (R4)** | Journal Entries Audit Browser | Displays general ledger transactions with date, reference number, debits, credits, and comments | `GET /api/v1/erp/journalentries` | List of journal entry transactions and line items | Empty list if no ledger entries posted | `FINERACT_DESIGN_SPEC.md` §4.3 & `FineractJournalController.java` |
| 20 | **Ledger (R4)** | Manual Journal Entry Posting | Modal dialog to post custom double-entry journal vouchers | `JournalEntryRequestDTO` (`officeId`, `debits[]`, `credits[]`, etc.) | Created transaction ID (`officeId`, `transactionId`) | Fails if double-entry invariant violated or GL account invalid | `FINERACT_DESIGN_SPEC.md` §4.3 & `FineractJournalController.java` |
| 21 | **Ledger (R4)** | Real-time Double-Entry Balance Invariant | Validates $\sum \text{Debit} \equiv \sum \text{Credit}$ before allowing posting; disables button on imbalance | Debit & Credit amounts in form state | Balance status indicator, differential amount ($\Delta$) | Button disabled if $\Delta \neq 0$; backend throws 500 `IllegalArgumentException` | `ORIGINAL_REQUEST.md` (R4) & `FineractJournalService.java` line 101 |
| 22 | **Ledger (R4)** | GL Account Resolver Matrix Table | Reference UI display showing how payment methods map to Cash (1), Bank (4), Sales Revenue (2), Returns (3) | Visual matrix in UI | Interactive table explaining debit/credit rules | N/A (Static reference and documentation) | `FINERACT_DESIGN_SPEC.md` §4.2 & `GlAccountResolver.java` |
| 23 | **EDA Events (R5)** | Kafka Event Simulator & Monitor | Simulates and monitors Kafka `order-topic` messages for automated ledger posting | `orderNumber`, `eventType`, `newStatus`, `totalAmount`, `paymentMethod` | Generated ledger entry (`SALE-{orderNumber}` or `REFUND-{orderNumber}`) | Logs warning and skips if order amount $\le 0$ or status unrecognized | `ORIGINAL_REQUEST.md` (R5) & `OrderFineractConsumer.java` |
| 24 | **EDA Events (R5)** | Processing Order Automated Sale Posting | Generates `SALE-{orderNumber}` entry: Debit Cash/Bank, Credit Sales Revenue | Event `ORDER_STATUS_CHANGED` with `newStatus: PROCESSING` | Ledger entry: Dr 1/4, Cr 2, Ref: `SALE-{orderNumber}` | Idempotency guard / error logged if Fineract rejects | `FINERACT_DESIGN_SPEC.md` §5.2 & `OrderFineractConsumer.java` |
| 25 | **EDA Events (R5)** | Refunded Order Automated Refund Posting | Generates `REFUND-{orderNumber}` entry: Debit Sales Returns, Credit Cash/Bank | Event `ORDER_STATUS_CHANGED` with `newStatus: REFUNDED` | Ledger entry: Dr 3, Cr 1/4, Ref: `REFUND-{orderNumber}` | Idempotency guard / error logged if Fineract rejects | `FINERACT_DESIGN_SPEC.md` §5.2 & `OrderFineractConsumer.java` |
| 26 | **Diagnostics (R6)** | Application-Wide Toast Notifications | Toast system for operation feedback (success, error, warning, info) | Action results & errors | Responsive toast alert popups with dismiss timer | Graceful fallback message if error unparsed | `ORIGINAL_REQUEST.md` (R6) |
| 27 | **Diagnostics (R6)** | Fineract Error Inspector Modal / Parser | Deep JSON extractor for `fineractResponse` extracting `developerMessage`, `defaultUserMessage`, and i18n code | Backend error response containing stringified `fineractResponse` | Human-readable explanation, error code, offending parameter name | Handles unparseable strings by displaying raw error text | `ORIGINAL_REQUEST.md` (R6) & `FineractExceptionHandler.java` |

---

## 4. Edge Cases & Invariant Probing Matrix

| # | Feature | Input / Condition | Observed & Enforced Behavior | Source / Rule Reference |
|---|---------|-------------------|------------------------------|-------------------------|
| 1 | Client Synchronization | User already has `fineractClientId` in database | Returns `clientId` immediately with **zero external HTTP requests** | `FineractClientService.java` line 133; `FineractClientServiceTest` |
| 2 | Client Synchronization | User has `null` or empty `fullName` | Throws `BusinessException(ErrorCode.USER_PROFILE_INCOMPLETE)`; **zero dummy clients created** | `FineractClientService.java` line 138; `FineractClientServiceTest` |
| 3 | Client Idempotency | User `fineractClientId` is null, but externalId exists on Fineract | Queries `GET /clients?externalId={userId}`, reuses found `clientId`, saves to DB, does NOT create duplicate | `FineractClientService.java` lines 143-150; `FineractClientServiceTest` |
| 4 | Client Role Access | Non-admin/Customer user requests `GET /clients` | Upstream automatically routed to `GET /clients?externalId={userId}`; user cannot view other clients | `FineractClientService.java` line 39; `FineractClientController.java` |
| 5 | Loan List Access | Customer user has not yet been linked to Fineract client | Returns safe empty JSON `{"totalFilteredRecords": 0, "pageItems": []}` instead of 404 or 500 error | `FineractLoanService.java` lines 44-48; `FineractLoanServiceTest` |
| 6 | Loan Application | Payload omitted `clientId` | `FineractLoanService` automatically triggers `getOrCreateCurrentClient()` and enriches payload | `FineractLoanService.java` lines 102-109; `FineractLoanServiceTest` |
| 7 | Loan Approval | Approval date is set in the future | Fineract returns HTTP 403 with `userMessageGlobalisationCode: "error.msg.loan.approval.cannot.be.in.the.future"` | `FINERACT_DESIGN_SPEC.md` §6.1 |
| 8 | Loan Disbursement | Disbursement attempted on non-approved loan (State != 200) | Fineract rejects with HTTP 403: loan must be in approved status before disbursement | `FINERACT_DESIGN_SPEC.md` §3.2 |
| 9 | Loan Repayment | Repayment amount exceeds total outstanding balance | Fineract rejects with HTTP 403: transaction amount cannot exceed balance | `FINERACT_DESIGN_SPEC.md` §3.2 |
| 10 | Loan Repayment | Repayment brings outstanding balance to exactly 0 | Loan state transitions from `300: ACTIVE` to `600: OBLIGATIONS_MET` (Terminal closure) | `FINERACT_DESIGN_SPEC.md` §3.2 (State Machine) |
| 11 | Journal Posting | Debit lines sum does not equal Credit lines sum | Backend throws `IllegalArgumentException`: "Nguyên tắc kế toán kép vi phạm: Tổng Nợ (...) khác Tổng Có (...)"; Frontend submit button disabled | `FineractJournalService.java` lines 101-103; `ORIGINAL_REQUEST.md` (R4) |
| 12 | Journal Posting | Empty debits or empty credits list | Validation failure: `@NotEmpty(message = "At least one credit entry is required")` -> HTTP 400 Bad Request | `JournalEntryRequestDTO.java` lines 32, 36 |
| 13 | Journal Line | Line item has `amount <= 0` or missing `glAccountId` | Validation fails; rejected by Fineract Core API | `JournalEntryRequestDTO.java` & Fineract Core Schema |
| 14 | GL Account Resolver | Bank payment method used, but `bankGlAccountId` is null | Automatically falls back to `cashGlAccountId` (1) to prevent null pointer exceptions | `GlAccountResolver.java` lines 27-29 |
| 15 | Kafka Consumer | Order message with status `DELIVERED` or `CANCELLED` | Consumer explicitly ignores message; **zero ledger entries created** | `OrderFineractConsumer.java` lines 56-69; `FINERACT_DESIGN_SPEC.md` §5.2 |
| 16 | Kafka Consumer | Order message contains `orderNumber` not found in DB or `totalAmount <= 0` | Consumer logs `WARN` and safely skips without crashing thread or blocking subsequent messages | `OrderFineractConsumer.java` lines 77-80, 93-96 |
| 17 | Kafka Consumer | Fineract API unreachable during Kafka event handling | Caught in `try-catch`, logged as `ERROR` with stack trace; does not crash consumer container | `OrderFineractConsumer.java` lines 86-88, 102-104 |
| 18 | Error Parsing | `fineractResponse` is a stringified JSON string within an outer JSON error object | Error inspector must parse inner string to extract `developerMessage` and `userMessageGlobalisationCode` | `FineractExceptionHandler.java` line 24; `ORIGINAL_REQUEST.md` (R6) |

---

## 5. Domain Models & Subsystem Requirements Breakdown

### 5.1. Subsystem R1: Shell Container & Overview Metrics (`fineract-overview`)

The Shell Container is embedded inside the `/auth-report` view of `noname`. It provides:
1. **Header & Control Bar:**
   - Subsystem title: "Apache Fineract Core Banking & Financial Ledger".
   - Environment & Health indicators: Live status of Fineract Core API (`https://localhost:8443`), Spring Boot Gateway (`http://localhost:8080`), and Kafka EDA consumer (`order-topic`).
   - **Mode Switcher:** Toggle between **"Live Gateway API"** (requests proxied through `/api/proxy` to `http://localhost:8080`) and **"High-Fidelity Mock Sandbox"** (in-memory test data allowing complete offline interaction).
   - Quick Action buttons: Refresh all datasets, Trigger mock Kafka event, Export ledger statement.
2. **KPI Metrics Grid (Top Deck):**
   - **Total Outstanding Principal:** Formatted currency in VND (e.g. `124,500,000 ₫`) with active loan count.
   - **Cash Ledger Balance (TK 1):** Real-time sum of debits minus credits on Account 1 (e.g. `45,200,000 ₫`).
   - **Bank Ledger Balance (TK 4):** Real-time sum of debits minus credits on Account 4 (e.g. `89,800,000 ₫`).
   - **Active Fineract Clients:** Total registered institutional and retail clients (e.g. `42 Clients`).
   - **EDA Gateway Throughput:** Messages consumed and automated journal vouchers posted.
3. **Sub-Tab Navigation:**
   - `overview`: KPI dashboards, health diagnostics, topology diagram.
   - `clients`: Client directory, profile drawer, registration modal.
   - `loans`: Loan product catalog, accounts list, repayment schedules, state machine controls.
   - `ledger`: Journal entries table, double-entry manual posting modal, GL Account Resolver matrix.
   - `eda-events`: Kafka event simulator, live event log, automated voucher reconciler.

---

### 5.2. Subsystem R2: Financial Clients Management (`fineract-clients`)

#### Client Entity Schema (Fineract Standard):
```typescript
export interface FineractClient {
  id: number;
  accountNo: string;
  status: {
    id: number; // 100: Pending, 300: Active, 600: Closed
    code: string; // "clientStatusType.active"
    value: string; // "Active"
  };
  active: boolean;
  activationDate: [number, number, number] | string; // [2026, 9, 4] or "04 September 2026"
  firstname: string;
  lastname: string;
  displayName: string;
  officeId: number;
  officeName: string;
  externalId?: string; // Maps to ERP userId
  emailAddress?: string;
  mobileNo?: string;
  legalFormId?: number; // 1 = Person, 2 = Entity
}
```

#### Client Registration Payload:
```json
{
  "officeId": 1,
  "legalFormId": 1,
  "firstname": "Văn A",
  "lastname": "Nguyễn",
  "externalId": "42",
  "emailAddress": "nguyenvana@example.com",
  "mobileNo": "0912345678",
  "active": true,
  "activationDate": "04 September 2026",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Vietnamese Name Parser Logic:
- Input: `user.fullName` (e.g. `"Ngô Ngọc Định"`)
- Algorithm:
  - Trim and split by whitespace into parts.
  - If single word: `firstname = word`, `lastname = word`.
  - If multiple words: `firstname = parts[last]`, `lastname = parts[0...last-1].join(" ")`.
  - Result for `"Ngô Ngọc Định"`: `firstname: "Định"`, `lastname: "Ngô Ngọc"`.
  - Result for `"Nguyễn Văn A"`: `firstname: "A"`, `lastname: "Nguyễn Văn"`.

---

### 5.3. Subsystem R3: Loan Products & Lifecycle State Machine (`fineract-loans`)

#### Finite State Machine (FSM) Specification:

```
                      ┌──────────────────────┐
                      │   [Submit Loan]      │
                      │   POST /erp/loans    │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ 100: PENDING_APPROVAL│
                      └──────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ Command: approve      │ Command: reject       │ Command: withdrawnBy
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐    ┌──────────────────┐
│  200: APPROVED   │   │  500: REJECTED   │    │  400: WITHDRAWN  │
└────────┬─────────┘   └──────────────────┘    └──────────────────┘
         │                  (Terminal)              (Terminal)
         │ Command: disburse
         ▼
┌──────────────────┐
│   300: ACTIVE    │◄────────────────────────┐
└────────┬─────────┘                         │
         │                                   │ Repayment Installment
         │ Transaction: repayment            │ (Outstanding > 0)
         ▼                                   │
   [Balance == 0 ?] ─── No ──────────────────┘
         │
         │ Yes (All principal & interest cleared)
         ▼
┌──────────────────────┐
│ 600: OBLIGATIONS_MET │ (Terminal Closed State)
└──────────────────────┘
```

#### State Transition Actions & Command Endpoints:

| Action | Allowed From Status | Target Status | ERP Endpoint | Upstream Fineract Command | Required Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Approve** | `100: PENDING_APPROVAL` | `200: APPROVED` | `POST /api/v1/erp/loans/{id}/approve` | `/loans/{id}?command=approve` | `{"approvedOnDate": "04 September 2026", "dateFormat": "dd MMMM yyyy", "locale": "en", "note": "..."}` |
| **Disburse** | `200: APPROVED` | `300: ACTIVE` | `POST /api/v1/erp/loans/{id}/disburse` | `/loans/{id}?command=disburse` | `{"actualDisbursementDate": "04 September 2026", "dateFormat": "dd MMMM yyyy", "locale": "en", "note": "..."}` |
| **Reject** | `100: PENDING_APPROVAL` | `500: REJECTED` | `POST /api/v1/erp/loans/{id}/reject` | `/loans/{id}?command=reject` | `{"rejectedOnDate": "04 September 2026", "dateFormat": "dd MMMM yyyy", "locale": "en", "note": "..."}` |
| **Withdraw** | `100: PENDING_APPROVAL` | `400: WITHDRAWN` | `POST /api/v1/erp/loans/{id}/withdraw` | `/loans/{id}?command=withdrawnByApplicant` | `{"withdrawnOnDate": "04 September 2026", "dateFormat": "dd MMMM yyyy", "locale": "en", "note": "..."}` |
| **Repayment** | `300: ACTIVE` | `300: ACTIVE` (or `600: OBLIGATIONS_MET`) | `POST /api/v1/erp/loans/{id}/repayments` | `/loans/{id}/transactions?command=repayment` | `{"transactionDate": "04 September 2026", "transactionAmount": 1800000, "dateFormat": "dd MMMM yyyy", "locale": "en"}` |

#### Repayment Schedule Structure (`associations=all`):
```typescript
export interface RepaymentSchedulePeriod {
  period: number; // 0 = disbursement, 1..N = installments
  dueDate: [number, number, number] | string; // e.g. [2026, 10, 4]
  principalOriginalDue: number;
  principalDue: number;
  principalPaid: number;
  principalOutstanding: number;
  interestOriginalDue: number;
  interestDue: number;
  interestPaid: number;
  interestOutstanding: number;
  feeChargesDue: number;
  feeChargesPaid: number;
  feeChargesOutstanding: number;
  penaltyChargesDue: number;
  penaltyChargesPaid: number;
  penaltyChargesOutstanding: number;
  totalOriginalDueForPeriod: number;
  totalDueForPeriod: number;
  totalPaidForPeriod: number;
  totalPaidInAdvanceForPeriod: number;
  totalPaidLateForPeriod: number;
  totalOutstandingForPeriod: number;
  complete: boolean; // true when installment is fully cleared
}
```

---

### 5.4. Subsystem R4: Double-Entry General Ledger (`fineract-ledger`)

#### Invariant Formulation:
$$\sum_{i=1}^{n} \text{Debit}_i \equiv \sum_{j=1}^{m} \text{Credit}_j$$

#### GL Account Resolver Matrix:
The GL Account Resolver maps commercial ERP operations and checkout payment methods to institutional Chart of Accounts (COA) numbers in Apache Fineract:

| Business Event | Payment Method | Debit Account (Nợ) | Credit Account (Có) | Reference Number Pattern | Note / Narration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sale (Bán hàng)** | `COD` (Tiền mặt) | **TK Tiền mặt** (`cashGlAccountId`: 1) | **TK Doanh thu bán hàng** (`salesRevenueGlAccountId`: 2) | `SALE-{orderNumber}` | Doanh thu bán hàng đơn {orderNumber} |
| **Sale (Bán hàng)** | `VNPAY`, `BANK_TRANSFER`, `CREDIT_CARD`, `MOMO`, `PAYPAL` | **TK Ngân hàng** (`bankGlAccountId`: 4) | **TK Doanh thu bán hàng** (`salesRevenueGlAccountId`: 2) | `SALE-{orderNumber}` | Doanh thu bán hàng đơn {orderNumber} |
| **Refund (Hoàn tiền)** | `COD` | **TK Hàng bán bị trả lại** (`salesReturnsGlAccountId`: 3) | **TK Tiền mặt** (`cashGlAccountId`: 1) | `REFUND-{orderNumber}` | Hoàn tiền trả hàng đơn {orderNumber} |
| **Refund (Hoàn tiền)** | `VNPAY`, `BANK_TRANSFER`, `CREDIT_CARD`, `MOMO`, `PAYPAL` | **TK Hàng bán bị trả lại** (`salesReturnsGlAccountId`: 3) | **TK Ngân hàng** (`bankGlAccountId`: 4) | `REFUND-{orderNumber}` | Hoàn tiền trả hàng đơn {orderNumber} |

*Safety Fallback:* If `bankGlAccountId` (4) is unconfigured or null, system defaults gracefully to `cashGlAccountId` (1).

#### Journal Entry Request Contract (`JournalEntryRequestDTO`):
```json
{
  "officeId": 1,
  "transactionDate": "04 September 2026",
  "currencyCode": "VND",
  "referenceNumber": "MANUAL-TX-9901",
  "comments": "Bút toán điều chỉnh chi phí phát sinh",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "debits": [
    {
      "glAccountId": 1,
      "amount": 500000.00
    }
  ],
  "credits": [
    {
      "glAccountId": 2,
      "amount": 500000.00
    }
  ]
}
```

---

### 5.5. Subsystem R5: Kafka EDA Order-Topic Event Monitor (`fineract-eda-events`)

#### Topic & Consumer Topology:
- **Topic Name:** `order-topic` (`KafkaTopics.ORDER_TOPIC`)
- **Consumer Group:** `fineract-order-group`
- **Offset Reset:** `earliest`
- **Auto Commit:** `false` (Manual commit / At-Least-Once Delivery)
- **Feature Flag:** `app.fineract.enabled = true`

#### Event Message JSON Schema:
```json
{
  "eventType": "ORDER_STATUS_CHANGED",
  "orderNumber": "ORD-20260904-9876",
  "orderId": "ORD-20260904-9876",
  "newStatus": "PROCESSING",
  "previousStatus": "PENDING"
}
```

#### Event Dispatch & Action Matrix:

| Event Type | Field Evaluated | Condition Value | Triggered Service Action | Resulting Ledger Reference |
| :--- | :--- | :--- | :--- | :--- |
| `ORDER_STATUS_CHANGED` | `newStatus` | `"PROCESSING"` | `fineractJournalService.recordSale(orderNumber, amount, ...)` | `SALE-{orderNumber}` |
| `ORDER_STATUS_CHANGED` | `newStatus` | `"REFUNDED"` | `fineractJournalService.recordRefund(orderNumber, amount, ...)` | `REFUND-{orderNumber}` |
| `ORDER_CREATED` | `initialStatus` | `"PROCESSING"` | `fineractJournalService.recordSale(orderNumber, amount, ...)` | `SALE-{orderNumber}` |
| `ORDER_STATUS_CHANGED` | `newStatus` | `"DELIVERED"`, `"CANCELLED"`, `"COMPLETED"` | **Ignored** (No financial impact) | None |

#### Simulator Requirements:
The frontend must provide an interactive Kafka Event Simulator where operators can:
1. Select event type (`ORDER_STATUS_CHANGED`, `ORDER_CREATED`).
2. Input order number (e.g. `ORD-TEST-001`), total amount (e.g. `1,250,000 VND`), and payment method (`COD` vs `BANK_TRANSFER`/`VNPAY`).
3. Select target status (`PROCESSING` or `REFUNDED`).
4. Emit simulated message to observe live ledger voucher creation (`SALE-ORD-TEST-001` or `REFUND-ORD-TEST-001`) in real-time.

---

### 5.6. Subsystem R6: Toast Feedback & Fineract Error Inspector

#### Backend Error Formats:
When upstream Apache Fineract rejects a command, `FineractExceptionHandler` intercepts `RestClientResponseException` and formats the error:

```json
{
  "status": "error",
  "httpStatusCode": 403,
  "message": "Lỗi từ hệ thống Core Banking (Fineract).",
  "fineractResponse": "{\"developerMessage\":\"The date on which a loan is approved cannot be in the future.\",\"httpStatusCode\":\"403\",\"defaultUserMessage\":\"The date on which a loan is approved cannot be in the future.\",\"userMessageGlobalisationCode\":\"error.msg.loan.approval.cannot.be.in.the.future\",\"parameterName\":\"approvedOnDate\"}"
}
```

#### Fineract Core Error Object Fields:
- `developerMessage`: Detailed technical message from Fineract platform engineers.
- `defaultUserMessage`: Standard English user-facing error description.
- `userMessageGlobalisationCode`: Key string for internationalized client error dictionaries (e.g., `error.msg.loan.approval.cannot.be.in.the.future`, `error.msg.loan.disbursement.cannot.be.before.approval`).
- `parameterName`: The offending parameter name in the request JSON (e.g., `approvedOnDate`, `actualDisbursementDate`, `transactionAmount`).
- `errors`: Optional array of multiple field errors.

#### Error Inspector Component Requirements:
1. Parse the stringified `fineractResponse` JSON automatically.
2. Present a high-visibility Error Diagnostic Banner or Drawer with:
   - High-level alert message.
   - Clean translation or user-friendly message (`defaultUserMessage`).
   - Globalisation Code badge with copy button (`userMessageGlobalisationCode`).
   - Offending parameter highlight (`parameterName`).
   - Technical developer details collapsible accordion (`developerMessage`).
   - Raw JSON viewer for deep engineering diagnosis.

---

## 6. Frontend Integration Blueprint (`noname`)

### Tab Structure in `/auth-report`:
In `src/components/AuthReportDashboard.tsx`, the tab system currently includes:
`"diagnostics" | "jwt" | "redis" | "traffic" | "me-profile"`

Add the new tab:
`"fineract"` (labeled **"Core Banking & Ledger"** with a `Landmark` or `Building2` icon).

### Network Proxy Routing:
- The Express server in `server.ts` provides `/api/proxy`.
- To call the backend via proxy:
  - Header: `x-target-url: http://localhost:8080/api/v1/erp/clients`
  - Or query: `/api/proxy?url=http://localhost:8080/api/v1/erp/clients`
  - Includes Bearer token from `getUnifiedAccessToken()`.
- If the backend is down or unreachable (e.g. returns 502/504), the dashboard automatically falls back to high-fidelity mock datasets with an ambient warning indicator.

---

## 7. Authoritative API Endpoints Reference Matrix

| # | Action / Purpose | ERP Gateway Path | HTTP Method | Upstream Fineract URL | Upstream Method | Auth Role |
|---|------------------|------------------|-------------|-----------------------|-----------------|-----------|
| 1 | List Clients | `/api/v1/erp/clients` | `GET` | `/clients` (or `/clients?externalId={userId}`) | `GET` | Admin / Customer |
| 2 | Get Client Details | `/api/v1/erp/clients/{clientId}` | `GET` | `/clients/{clientId}` | `GET` | Admin / Customer |
| 3 | Create Client | `/api/v1/erp/clients` | `POST` | `/clients` | `POST` | Admin / Customer |
| 4 | List Loan Products | `/api/v1/erp/loan-products` | `GET` | `/loanproducts` | `GET` | Any authenticated |
| 5 | List Loan Accounts | `/api/v1/erp/loans` | `GET` | `/loans` (or `/loans?clientId={clientId}`) | `GET` | Admin / Customer |
| 6 | Get Loan Details & Schedule | `/api/v1/erp/loans/{loanId}` | `GET` | `/loans/{loanId}?associations=all` | `GET` | Admin / Customer |
| 7 | Get Loan Template | `/api/v1/erp/loans/template` | `GET` | `/loans/template?productId={id}&clientId={id}` | `GET` | Admin / Customer |
| 8 | Apply for Loan | `/api/v1/erp/loans` | `POST` | `/loans` | `POST` | Admin / Customer |
| 9 | Approve Loan | `/api/v1/erp/loans/{loanId}/approve` | `POST` | `/loans/{loanId}?command=approve` | `POST` | Staff / Admin |
| 10 | Disburse Loan | `/api/v1/erp/loans/{loanId}/disburse` | `POST` | `/loans/{loanId}?command=disburse` | `POST` | Staff / Admin |
| 11 | Reject Loan | `/api/v1/erp/loans/{loanId}/reject` | `POST` | `/loans/{loanId}?command=reject` | `POST` | Staff / Admin |
| 12 | Withdraw Loan | `/api/v1/erp/loans/{loanId}/withdraw` | `POST` | `/loans/{loanId}?command=withdrawnByApplicant` | `POST` | Customer / Admin |
| 13 | Make Loan Repayment | `/api/v1/erp/loans/{loanId}/repayments` | `POST` | `/loans/{loanId}/transactions?command=repayment` | `POST` | Customer / Staff |
| 14 | List Journal Entries | `/api/v1/erp/journalentries` | `GET` | `/journalentries` | `GET` | Staff / Admin |
| 15 | Post Journal Entry | `/api/v1/erp/journalentries` | `POST` | `/journalentries` | `POST` | Staff / Admin |

---

## 8. Verification & Acceptance Criteria

1. **Build & Compiles:** `npm run build` succeeds cleanly with zero TypeScript errors.
2. **Server Health:** Port 3000 starts (`npm run dev`) and `curl -s http://localhost:3000/api/health` returns `{"status":"ok",...}`.
3. **Tab Coexistence:** `/auth-report` renders the new Fineract tab smoothly without regression to Diagnostics, JWT, Redis, Traffic, or Me-Profile tabs.
4. **Client Subsystem:** Client directory lists records, drawer shows details, registration modal validates input and creates clients.
5. **Loan State Machine:** State badges accurately reflect Fineract state machine; Approve, Disburse, and Repay modals execute valid state transitions.
6. **Double-Entry Invariant:** Journal posting form enforces $\sum \text{Debit} == \sum \text{Credit}$, blocking submission when unbalanced.
7. **EDA Simulation:** Simulating Kafka order status changes to `PROCESSING` and `REFUNDED` automatically registers `SALE-{orderNumber}` and `REFUND-{orderNumber}` entries in the ledger.
8. **Error Diagnostics:** Fineract API errors display formatted `developerMessage`, `defaultUserMessage`, and `userMessageGlobalisationCode` in an inspector view.
