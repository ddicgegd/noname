# Apache Fineract Core Banking — Test Infrastructure & Quality Blueprint

This document defines the 4-Tier Testing Architecture, Feature Inventory, and Quality Assurance specifications for the Apache Fineract Core Banking & Financial Ledger dashboard integration within the enterprise web platform.

---

## 1. Quality & Testing Philosophy

The Apache Fineract Core Banking integration manages mission-critical financial assets, loan portfolios, ledger accounts, and event-driven transactional flows. Financial systems require absolute mathematical correctness, deterministic state transitions, idempotency, and robust error extraction.

To ensure end-to-end reliability, we follow a rigorous **4-Tier Testing Matrix**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               Tier 4: Real-World Application Scenarios                 │
│    (End-to-end multi-step flows, Order-to-Cash, Default Remediation)   │
├────────────────────────────────────────────────────────────────────────┤
│             Tier 3: Cross-Feature Combinations & Pairwise              │
│    (Interaction matrices, State-by-Role, Event-to-Ledger-Balance)     │
├────────────────────────────────────────────────────────────────────────┤
│             Tier 2: Boundary, Corner Cases & Adversarial               │
│    (Precision limits, zero/negative, future dates, malformed JSON)     │
├────────────────────────────────────────────────────────────────────────┤
│                  Tier 1: Core Feature Coverage (>=5/feat)              │
│    (State transitions, CRUD operations, invariant validation)          │
└────────────────────────────────────────────────────────────────────────┘
```

### Testing Mandates:
1. **Zero Facades**: Every test executes concrete domain logic against authoritative specifications from `PROJECT.md` and `FINERACT_DESIGN_SPEC.md`.
2. **Deterministic Isolation**: Tests are self-contained, reset their state before each suite, and do not leak state across test runs.
3. **Double-Entry Invariant**: $\sum_{i=1}^n \text{Debit}_i \equiv \sum_{j=1}^m \text{Credit}_j$ must be strictly satisfied within floating-point tolerance ($< 0.001$).
4. **FSM Conformance**: Only valid state transitions are permitted:
   - `100: PENDING_APPROVAL` $\rightarrow$ `200: APPROVED` | `500: REJECTED` | `400: WITHDRAWN`
   - `200: APPROVED` $\rightarrow$ `300: ACTIVE`
   - `300: ACTIVE` $\rightarrow$ `300: ACTIVE` (partial repayment) | `600: OBLIGATIONS_MET` (full settlement)
   - Disallowed transitions (e.g. `100 -> 300` directly, `500 -> 200`, `300 -> 100`) must be rejected with appropriate error semantics.

---

## 2. Target Feature Inventory

| Feature Code | Feature Name | Core Component / Target | Milestone |
| :--- | :--- | :--- | :--- |
| **FEAT-01** | Client Management & Name Parsing | `fineractService`, `fineractMockStore` | M1, M3 |
| **FEAT-02** | Loan Products Catalog | `fineractService`, `fineractMockStore` | M1, M4 |
| **FEAT-03** | Loan Lifecycle State Machine | `fineractMockStore`, `fineractService` | M1, M4 |
| **FEAT-04** | Repayment Schedule & Balance Engine | `fineractMockStore`, `fineractService` | M1, M4 |
| **FEAT-05** | Double-Entry Balance Invariant Guard | `fineractJournalService`, `fineractMockStore` | M1, M5 |
| **FEAT-06** | GL Account Resolver Matrix | `GlAccountResolver`, `fineractMockStore` | M1, M5 |
| **FEAT-07** | Kafka EDA Order Event Streaming | `OrderFineractConsumer`, `fineractMockStore` | M1, M5 |
| **FEAT-08** | Fineract Error Inspector & Extractor | `fineractErrorExtractor` | M1, M2 |
| **FEAT-09** | System Health & Mode Switching | `fineractService` | M1, M2 |

---

## 3. 4-Tier Test Specifications

### 3.1. Tier 1: Feature Coverage ($\ge$ 5 Tests Per Feature)

Tier 1 verifies primary functional pathways, standard contracts, and expected responses for each domain capability.

#### FEAT-01: Client Management & Name Parsing
1. `test_client_directory_listing`: Fetches all clients and confirms required schema fields (`id`, `accountNo`, `displayName`, `status`, `officeId`).
2. `test_client_role_filtering_admin_vs_customer`: Admin receives all records; customer filtered by `externalId` receives only their linked profile.
3. `test_client_registration_creates_entity`: Submits valid new client registration and asserts active status, sequential account number, and assigned ID.
4. `test_vietnamese_name_parser_standard`: Parses compound Vietnamese names (e.g. `"Nguyễn Văn A"` $\rightarrow$ `firstname: "A"`, `lastname: "Nguyễn Văn"`).
5. `test_vietnamese_name_parser_single_word`: Correctly handles single-token names (`"Thanh"` $\rightarrow$ `firstname: "Thanh"`, `lastname: "Thanh"`).

#### FEAT-02: Loan Products Catalog
1. `test_loan_products_list_retrieval`: Returns configured credit products with principal bounds (`minPrincipal`, `maxPrincipal`).
2. `test_loan_products_interest_rates`: Verifies interest rate per period and compounding calculation rules.
3. `test_loan_product_lookup_by_id`: Retrieves individual product details by ID and verifies term constraints.
4. `test_loan_product_amortization_types`: Validates equal installments vs equal principal amortization configurations.
5. `test_loan_creation_within_product_bounds`: Validates successful loan application submission when requested amount is within product limits.

#### FEAT-03: Loan Lifecycle State Machine
1. `test_fsm_approve_transition`: Transitions loan from `100: PENDING_APPROVAL` to `200: APPROVED` with approved date and audit note.
2. `test_fsm_disburse_transition`: Transitions approved loan (`200`) to `300: ACTIVE` with disbursement date, unlocking repayment.
3. `test_fsm_reject_transition`: Rejects pending loan (`100` $\rightarrow$ `500: REJECTED`) as terminal state.
4. `test_fsm_withdraw_transition`: Applicant withdraws pending loan (`100` $\rightarrow$ `400: WITHDRAWN`) as terminal state.
5. `test_fsm_illegal_transition_rejection`: Rejects invalid transitions (e.g. disbursing loan in `100` status or approving already rejected loan).

#### FEAT-04: Repayment Schedule & Balance Engine
1. `test_repayment_partial_reduces_principal`: Applying a partial repayment reduces `totalOutstanding` and updates `principalPaid`.
2. `test_repayment_allocates_interest_first`: Repayment allocates funds to outstanding interest before reducing principal.
3. `test_repayment_full_closure`: Repaying exact outstanding balance transitions loan to `600: OBLIGATIONS_MET`.
4. `test_repayment_schedule_installment_flags`: Marks individual period installments as `complete: true` when period due amount is met.
5. `test_repayment_schedule_generation`: Verifies repayment schedule generates correct number of installment periods matching loan term.

#### FEAT-05: Double-Entry Balance Invariant Guard
1. `test_double_entry_balanced_post_succeeds`: Single debit of 500,000 VND and single credit of 500,000 VND passes invariant.
2. `test_double_entry_multi_line_split`: Multi-split voucher (e.g., Dr 300k + Dr 200k = Cr 500k) correctly validates equality.
3. `test_double_entry_imbalance_rejected`: Throws error when $\sum \text{Debit} \neq \sum \text{Credit}$ (e.g. Dr 500k vs Cr 450k).
4. `test_double_entry_empty_lines_rejected`: Fails validation when debit list or credit list is empty.
5. `test_double_entry_journal_history_retrieval`: Returns chronological list of posted journal vouchers with reference numbers.

#### FEAT-06: GL Account Resolver Matrix
1. `test_resolver_sale_cod`: Resolves COD sale to Debit Cash (1) and Credit Sales Revenue (2) with `SALE-{orderNumber}` ref.
2. `test_resolver_sale_bank`: Resolves bank/VNPAY sale to Debit Bank (4) and Credit Sales Revenue (2).
3. `test_resolver_refund_cod`: Resolves COD refund to Debit Sales Returns (3) and Credit Cash (1) with `REFUND-{orderNumber}` ref.
4. `test_resolver_refund_bank`: Resolves bank refund to Debit Sales Returns (3) and Credit Bank (4).
5. `test_resolver_fallback_unconfigured_bank`: When bank GL account is null/unconfigured, safely falls back to Cash (1).

#### FEAT-07: Kafka EDA Order Event Streaming
1. `test_eda_order_processing_generates_sale`: Status `PROCESSING` triggers automatic `SALE-{orderNumber}` journal voucher.
2. `test_eda_order_refunded_generates_refund`: Status `REFUNDED` triggers automatic `REFUND-{orderNumber}` journal voucher.
3. `test_eda_order_delivered_ignored`: Status `DELIVERED` is recognized as non-financial and generates 0 ledger entries.
4. `test_eda_order_cancelled_ignored`: Status `CANCELLED` generates 0 ledger entries.
5. `test_eda_event_history_log`: Records simulated event messages in consumer stream history with timestamp and payload.

#### FEAT-08: Fineract Error Inspector & Extractor
1. `test_error_extractor_json_string_fineractResponse`: Successfully parses stringified `fineractResponse` JSON from Spring Boot exception.
2. `test_error_extractor_extracts_developer_message`: Extracts raw `developerMessage` for engineering troubleshooting.
3. `test_error_extractor_extracts_user_message`: Extracts `defaultUserMessage` for operator display.
4. `test_error_extractor_extracts_globalisation_code`: Identifies `userMessageGlobalisationCode` (e.g. `error.msg.loan.approval.cannot.be.in.the.future`).
5. `test_error_extractor_extracts_parameter_name`: Highlights offending input field (e.g. `approvedOnDate`).

#### FEAT-09: System Health & Mode Switching
1. `test_health_status_query`: Returns health states for Core API, Gateway Proxy, and Kafka EDA consumer.
2. `test_mode_toggle_live_to_mock`: Toggling mode switches data provider from live proxy to local mock store.
3. `test_mode_toggle_mock_to_live`: Toggling mode switches data provider back to live proxy.
4. `test_kpi_overview_metric_calculations`: Calculates aggregate portfolio metrics (total outstanding, cash/bank balances, client count).
5. `test_mock_store_reset`: Resets in-memory/mock store back to initial pristine seed data.

---

### 3.2. Tier 2: Boundary, Corner Cases & Adversarial ($\ge$ 5 Tests Per Feature)

Tier 2 stresses the engine against numerical boundaries, extreme values, malicious/malformed inputs, date chronology violations, and edge states.

#### FEAT-01: Client Boundaries
1. `test_client_name_leading_trailing_excessive_whitespace`: `"   Nguyễn    Văn   Đức   "` cleanly trims into first and last name.
2. `test_client_external_id_idempotency`: Attempting to create a client with existing `externalId` returns existing client without duplicate creation.
3. `test_client_special_characters_in_name`: Supports Vietnamese diacritics and hyphens (`"Trần-Lê Hoài Thương"`).
4. `test_client_missing_required_fields`: Registering client without mandatory names returns descriptive validation error.
5. `test_client_extreme_id_lookup`: Requesting non-existent client ID (e.g. `-1` or `99999999`) throws 404 Not Found error.

#### FEAT-02: Loan Product Boundaries
1. `test_loan_principal_below_minimum`: Requesting loan principal below `minPrincipal` is rejected.
2. `test_loan_principal_above_maximum`: Requesting loan principal above `maxPrincipal` is rejected.
3. `test_loan_principal_exact_boundaries`: Requesting loan principal at exact `minPrincipal` and exact `maxPrincipal` succeeds.
4. `test_loan_zero_or_negative_interest_rate`: Handles zero-interest promotional products cleanly without division by zero.
5. `test_loan_unsupported_product_id`: Applying for loan with non-existent product ID fails with 404/Bad Request.

#### FEAT-03: State Machine Boundary & Chronology Violations
1. `test_approval_date_in_future`: Reject approval if `approvedOnDate` is in the future relative to system date.
2. `test_disbursement_date_before_approval`: Reject disbursement if `actualDisbursementDate` precedes `approvedOnDate`.
3. `test_terminal_state_immutability`: Loans in terminal states (`500: REJECTED`, `400: WITHDRAWN`, `600: OBLIGATIONS_MET`) cannot transition to any other status.
4. `test_double_approval_prevention`: Calling approve on already approved loan (`200`) is rejected.
5. `test_double_disbursement_prevention`: Calling disburse on already active loan (`300`) is rejected.

#### FEAT-04: Repayment Engine Edge Cases
1. `test_repayment_amount_exceeds_outstanding`: Reject repayment where payment amount > `totalOutstanding`.
2. `test_repayment_exact_to_the_cent`: Repaying exact outstanding down to decimal accuracy leaves exactly 0 balance.
3. `test_repayment_zero_or_negative_amount`: Repaying amount $\le 0$ is rejected.
4. `test_repayment_on_unapproved_loan`: Repaying on loan in status `100` or `200` is rejected.
5. `test_repayment_fractional_currency_rounding`: Correctly rounds multi-decimal VND interest calculations.

#### FEAT-05: Double-Entry Invariant Stress
1. `test_double_entry_sub_cent_floating_point_precision`: Floating point rounding differences ($0.1 + 0.2 = 0.30000000000000004$) pass invariant via $< 0.001$ epsilon check.
2. `test_double_entry_delta_of_one_cent_fails`: Imbalance of 1 currency unit (0.01) is strictly rejected.
3. `test_double_entry_all_zeros_rejected`: Voucher with 0 debit and 0 credit is rejected as non-transactional.
4. `test_double_entry_negative_amount_rejected`: Negative line amount (e.g. Dr -500, Cr -500) is rejected; credit notes must use appropriate contra-accounts.
5. `test_double_entry_missing_gl_account_id`: Line items missing `glAccountId` fail schema validation.

#### FEAT-06: GL Account Resolver Edge Cases
1. `test_resolver_case_insensitive_payment_methods`: Recognizes `"cod"`, `"COD"`, `"vnpay"`, `"Bank_Transfer"`.
2. `test_resolver_unknown_payment_method_defaults_to_cash`: Unknown payment method (e.g. `"CRYPTO_BARTER"`) safely defaults to Cash (1).
3. `test_resolver_empty_or_null_order_number`: Rejects or flags invalid order numbers in reference generation.
4. `test_resolver_whitespace_padded_payment_method`: `"  COD  "` resolves identically to `"COD"`.
5. `test_resolver_all_four_standard_accounts_distinct`: Confirms Cash (1), Sales (2), Returns (3), Bank (4) resolve to distinct account IDs.

#### FEAT-07: Kafka EDA Edge Cases
1. `test_eda_order_amount_zero_ignored`: Event with `totalAmount = 0` is safely skipped without ledger entry.
2. `test_eda_order_amount_negative_ignored`: Event with `totalAmount < 0` is safely skipped.
3. `test_eda_order_missing_order_number`: Event missing `orderNumber` is rejected.
4. `test_eda_duplicate_event_idempotency`: Firing duplicate `PROCESSING` event for same order number is deduplicated or idempotent.
5. `test_eda_malformed_json_payload`: Handles corrupted event payload gracefully without crashing event stream.

#### FEAT-08: Error Inspector Corner Cases
1. `test_error_extractor_empty_string`: Empty string input returns fallback generic error object.
2. `test_error_extractor_raw_non_json_string`: Plain text stack trace string returns sanitized fallback with raw text preserved.
3. `test_error_extractor_nested_multi_error_array`: Extracts all field violations when `errors` array is present.
4. `test_error_extractor_missing_user_message_fallback`: Falls back to `developerMessage` if `defaultUserMessage` is null.
5. `test_error_extractor_html_gateway_timeout_error`: Parses upstream 504 Bad Gateway / HTML error page gracefully into friendly message.

#### FEAT-09: Health & Mode Edge Cases
1. `test_health_degraded_when_gateway_unreachable`: Simulates unreachable gateway, verifying health transitions to "degraded" or "offline".
2. `test_mock_store_persistence_recovery`: Mock store recovers and validates state across simulated page reloads.
3. `test_kpi_empty_store_metrics`: Correctly displays 0 values without `NaN` or crashes on an empty database.
4. `test_mode_switching_preserves_independent_state`: Switching live $\rightarrow$ mock $\rightarrow$ live does not corrupt mock data cache.
5. `test_concurrent_service_invocations`: Handles concurrent asynchronous reads and writes without state corruption.

---

### 3.3. Tier 3: Cross-Feature Combinations & Pairwise Interactions

Tier 3 tests how different subsystems interact and mutate shared ledger balances and state machines.

1. **TF3-01: Client Registration $\rightarrow$ Loan Origination $\rightarrow$ State Machine Approval**  
   Create new client with Vietnamese name parsing $\rightarrow$ apply for loan referencing client ID $\rightarrow$ approve loan $\rightarrow$ verify loan account references client accurately and status is `200`.

2. **TF3-02: Loan Disbursement $\rightarrow$ Active State $\rightarrow$ Installment Repayment $\rightarrow$ Closure**  
   Disburse approved loan $\rightarrow$ verify status is `300` $\rightarrow$ execute repayment of 50% $\rightarrow$ verify balance is halved $\rightarrow$ execute second repayment of remainder $\rightarrow$ verify transition to `600: OBLIGATIONS_MET`.

3. **TF3-03: Kafka EDA Sale Event $\rightarrow$ General Ledger Balance Mutation**  
   Simulate Kafka `PROCESSING` event for 2,500,000 VND (Payment: `BANK_TRANSFER`) $\rightarrow$ verify new `SALE-{orderNumber}` journal entry created $\rightarrow$ query GL balances $\rightarrow$ verify Bank Ledger balance increased by 2,500,000 VND.

4. **TF3-04: Kafka EDA Sale $\rightarrow$ Subsequent Refund Event $\rightarrow$ Contra-Ledger Reconciliation**  
   Simulate `PROCESSING` (Sale 1,000,000 VND COD) $\rightarrow$ verify Cash +1,000,000 $\rightarrow$ simulate `REFUNDED` for same order $\rightarrow$ verify `REFUND-{orderNumber}` created with Debit Sales Returns (3) and Credit Cash (1) $\rightarrow$ verify net Cash impact is 0.

5. **TF3-05: Loan FSM Invalid Action $\rightarrow$ Fineract Error Extraction $\rightarrow$ Toast Message Generation**  
   Attempt to disburse loan in `100: PENDING_APPROVAL` state $\rightarrow$ capture caught exception $\rightarrow$ pass through `fineractErrorExtractor` $\rightarrow$ verify `userMessageGlobalisationCode` contains `loan.disbursement.cannot.be.before.approval` $\rightarrow$ verify toast notification format.

6. **TF3-06: Customer Role-Based Security Filter vs Loan Accounts Listing**  
   Client A and Client B both hold loans $\rightarrow$ simulate query authenticated as Client A $\rightarrow$ verify only Client A's loans returned $\rightarrow$ query as Admin $\rightarrow$ verify both Client A and Client B loans returned.

7. **TF3-07: Manual Multi-Line Journal Voucher $\rightarrow$ General Ledger Audit Trail**  
   Post balanced 3-line journal voucher (Dr Cash 500k, Cr Revenue 400k, Cr Tax 100k) $\rightarrow$ inspect GL journal entries table $\rightarrow$ verify line items and transaction grouping match submitted voucher.

8. **TF3-08: High-Fidelity Mock Mode vs Live Gateway Proxy State Isolation**  
   Modify state in Mock Mode $\rightarrow$ toggle to Live Mode $\rightarrow$ toggle back to Mock Mode $\rightarrow$ verify mock state changes persisted without leakage into live proxy headers.

---

### 3.4. Tier 4: Real-World Application Scenarios

Tier 4 tests complete business journeys spanning the entire banking and ERP lifecycle.

1. **SCENARIO-01: End-to-End Retail Borrower Journey**  
   - Register customer "Nguyễn Thị Mai" with mobile and email.
   - Select 6-month consumer credit product (12% annual interest, 10,000,000 VND).
   - Submit loan application.
   - Credit committee approves loan with current timestamp.
   - Treasury disburses loan funds into borrower account.
   - Borrower pays Installment 1 on due date.
   - System updates repayment schedule: Period 1 marked `complete: true`, outstanding balance reduced.
   - Verify all intermediate states match Fineract Core Banking FSM.

2. **SCENARIO-02: Omnichannel Order-to-Cash & Automated Ledger Posting**  
   - ERP Order checkout completed with status `PROCESSING` for 3,500,000 VND via `VNPAY`.
   - Kafka EDA message emitted on `order-topic`.
   - Consumer intercepts event, executes GL Account Resolver $\rightarrow$ Bank GL (4) / Sales Revenue GL (2).
   - Automated journal entry `SALE-ORD-9021` posted into Fineract General Ledger.
   - Dashboard Overview KPI updates Bank balance and Transaction volume in real-time.
   - Customer subsequently returns defective item: Order transitioned to `REFUNDED`.
   - Consumer posts `REFUND-ORD-9021` reversing revenue into Sales Returns (3) and crediting Bank (4).
   - Audit trail shows complete double-entry integrity.

3. **SCENARIO-03: Early Loan Payoff & Obligations Met Settlement**  
   - Disbursed loan of 5,000,000 VND with 3 monthly installments.
   - In month 1, borrower pays total remaining principal and interest in one lump sum.
   - Repayment engine recalculates outstanding balance to 0.
   - System automatically transitions loan from `300: ACTIVE` to `600: OBLIGATIONS_MET`.
   - Subsequent repayment attempts on the closed loan are rejected with `loan.already.closed` diagnostic.

4. **SCENARIO-04: Operator Error Diagnosis & Remediation Flow**  
   - Operator submits backdated or future-dated loan approval date by mistake.
   - System catches Fineract 403 response with stringified `fineractResponse`.
   - Diagnostic parser extracts `parameterName: "approvedOnDate"` and human-readable explanation.
   - UI Error Inspector displays diagnostic modal with copyable globalisation code.
   - Operator corrects date to today's date and resubmits successfully.

---

## 4. Test Runner Execution Protocol

The test runner is implemented in TypeScript and executed in Node.js via `npx tsx`:

```bash
# Execute entire test suite across all 4 tiers
npx tsx tests/fineract/run-tests.ts

# Run with verbose diagnostic logging
VERBOSE=true npx tsx tests/fineract/run-tests.ts
```

### Pass/Fail Invariant:
- Total test count across all 4 tiers $\ge 80$ assertions.
- 100% test pass rate required for `TEST_READY.md` certification.
