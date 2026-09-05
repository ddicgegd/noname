# Empirical Stress Testing & Adversarial Invariant Report

**Agent:** Challenger 1 (Empirical Challenger: Critic & Specialist)  
**Milestone:** Milestone 6 (Adversarial Stress Testing: FSM, Repayment Mathematics & Double-Entry Invariant)  
**Target Codebase:** Apache Fineract Core Banking Simulation Engine (`src/lib/fineractMockStore.ts`, `src/services/fineractService.ts`, `src/types/fineract.ts`)  
**Test Suite Script:** `.agents/m6_challenger_1/stress_fsm_ledger.ts`  
**Execution Timestamp:** 2026-09-04T02:05:30Z  
**Verdict:** `REQUEST_CHANGES` (5 defects detected: 2 CRITICAL, 2 HIGH, 1 MEDIUM)

---

## 1. Executive Summary

Challenger 1 conducted an adversarial stress test campaign targeting the core banking state machine, repayment arithmetic, general ledger double-entry invariants, and GL account routing. A custom empirical harness executing **50 distinct attack scenarios** across 5 categories was authored and run.

While the core state machine transitions, chronology enforcement, and basic balanced vouchers demonstrated strong resilience (45/50 scenarios passed, 90.0% pass rate), empirical fuzzing uncovered **5 security and integrity defects**, including two critical flaws:
1. **`NaN` floating-point poisoning** in repayment calculations corrupts account balances into `NaN`.
2. **Masked negative amounts** bypass double-entry validation and are posted to the General Ledger, violating the explicit specification contract in `PROJECT.md` ("All amounts > 0").
3. **Untrimmed payment method strings** cause COD cash transactions to misroute into Bank Deposit accounts.

Due to these invariant violations, the formal verdict is **`REQUEST_CHANGES`**.

---

## 2. Test Execution Metrics

| Category | Description | Executed | Passed | Failed | Pass Rate | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Category 1** | Illegal Loan Lifecycle FSM Transitions | 15 | 15 | 0 | 100.0% | **PASS** |
| **Category 2** | Floating Point Rounding & Repayment Math | 8 | 7 | 1 | 87.5% | **DEFECT** |
| **Category 3** | Loan Overpayment & Settlement Attacks | 7 | 7 | 0 | 100.0% | **PASS** |
| **Category 4** | General Ledger Double-Entry Invariant Attacks | 10 | 8 | 2 | 80.0% | **DEFECT** |
| **Category 5** | GL Account Resolver & Kafka EDA Attacks | 10 | 8 | 2 | 80.0% | **DEFECT** |
| **TOTAL** | **Adversarial Stress Test Suite** | **50** | **45** | **5** | **90.0%** | **REQUEST_CHANGES** |

---

## 3. Detailed Defect Findings

### Defect 1: `NaN` Repayment Injection Corrupts Loan State
- **Test ID:** `ADV-FP-05`
- **Severity:** `CRITICAL`
- **Component:** `src/lib/fineractMockStore.ts` (`repayLoan()`, lines 1650–1668)
- **Observation:**
  ```typescript
  fineractMockStore.repayLoan(3, NaN, "04 September 2026");
  ```
  Execution succeeds without throwing an exception. Following this call, `loan.summary.totalOutstanding` evaluates to `NaN`, and `loan.repaymentSchedule.periods[x].interestPaid` evaluates to `NaN`.
- **Root Cause:**
  In JavaScript IEEE 754 arithmetic, `NaN <= 0` evaluates to `false`, and `NaN > (limit)` evaluates to `false`. As a result, `amount = NaN` completely bypasses both boundary checks:
  ```typescript
  if (amount <= 0) { ... }
  if (amount > loan.summary.totalOutstanding + 0.01) { ... }
  ```
- **Blast Radius:** Corrupts loan balance and ledger records permanently with `NaN`, breaking downstream calculations and summary reporting.
- **Recommended Remediation:**
  Validate finite numeric status before arithmetic:
  ```typescript
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createFineractError(
      400,
      "Repayment amount must be a valid positive number",
      "Số tiền thanh toán phải là số dương hợp lệ.",
      "error.msg.loan.transaction.amount.must.be.greater.than.zero",
      "transactionAmount"
    );
  }
  ```

---

### Defect 2: Masked Negative Amounts in Double-Entry Line Items
- **Test ID:** `ADV-GL-08`
- **Severity:** `CRITICAL`
- **Component:** `src/lib/fineractMockStore.ts` (`validateDoubleEntryInvariant()`, lines 1768–1808)
- **Contract Specification:** `PROJECT.md` line 85:
  > - Every journal entry MUST satisfy: `abs(sum(debits.amount) - sum(credits.amount)) < 0.001`
  > - Number of debits >= 1 and number of credits >= 1.
  > - **All amounts > 0.**
- **Observation:**
  Posting a multi-line voucher containing a negative line item where the side sum remains positive:
  ```typescript
  fineractMockStore.createJournalEntry({
    officeId: 1,
    transactionDate: "04 September 2026",
    referenceNumber: "MASKED-NEGATIVE",
    debits: [
      { glAccountId: 1, amount: 600000 },
      { glAccountId: 4, amount: -100000 }
    ],
    credits: [{ glAccountId: 2, amount: 500000 }]
  });
  ```
  The transaction is accepted and posted. A negative DEBIT entry (`amount: -100000`) is inserted into `state.journalEntries`.
- **Root Cause:**
  `validateDoubleEntryInvariant()` only computes aggregate sums:
  ```typescript
  const totalDebit = payload.debits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalCredit = payload.credits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const isBalanced = diff < 0.001 && totalDebit > 0;
  ```
  It does not check that each individual line item satisfies `amount > 0`.
- **Blast Radius:**
  In `getSystemMetrics()` (lines 2043–2044):
  ```typescript
  if (entry.entryType.value === "DEBIT") cashBalance += entry.amount;
  ```
  A negative debit causes cash/bank balance to decrease on a DEBIT, reversing basic accounting principles.
- **Recommended Remediation:**
  In `validateDoubleEntryInvariant`, assert line item positivity:
  ```typescript
  for (const item of [...payload.debits, ...payload.credits]) {
    const amt = Number(item.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw createFineractError(
        400,
        "All journal entry line amounts must be strictly greater than zero",
        "Số tiền trong từng dòng định khoản phải lớn hơn 0.",
        "validation.msg.journalentry.line.amount.invalid",
        "amount"
      );
    }
  }
  ```

---

### Defect 3: Zero-Amount Line Items Allowed in Double-Entry Vouchers
- **Test ID:** `ADV-GL-09`
- **Severity:** `MEDIUM`
- **Component:** `src/lib/fineractMockStore.ts` (`validateDoubleEntryInvariant()`)
- **Observation:**
  Posting a voucher with a zero amount line (`debits: [{ glAccountId: 1, amount: 500000 }, { glAccountId: 4, amount: 0 }]`, `credits: [{ glAccountId: 2, amount: 500000 }]`) succeeds and posts dummy 0-amount lines into the ledger audit trail.
- **Root Cause:**
  Same as Defect 2; per-line validation `item.amount > 0` is omitted.
- **Recommended Remediation:**
  Enforcing `amt > 0` as described in Defect 2 automatically resolves Defect 3.

---

### Defect 4 & 5: Payment Method Whitespace Trimming in GL Resolver
- **Test IDs:** `ADV-RES-01`, `ADV-RES-02`
- **Severity:** `HIGH`
- **Component:** `src/lib/fineractMockStore.ts` (`resolveGlAccountsForOrder()`, line 1917)
- **Observation:**
  ```typescript
  fineractMockStore.resolveGlAccountsForOrder("  COD  ", false);
  // Returns debitAccountId: 4 (Bank Deposits) instead of 1 (Cash on Hand)
  
  fineractMockStore.resolveGlAccountsForOrder("  cOd  ", false);
  // Returns debitAccountId: 4 (Bank Deposits) instead of 1 (Cash on Hand)
  ```
- **Root Cause:**
  Line 1917 implements:
  ```typescript
  const isCod = paymentMethod?.toUpperCase() === "COD";
  ```
  Because `.trim()` is missing, `"  COD  ".toUpperCase() === "COD"` evaluates to `false`. The order is incorrectly classified as a non-COD electronic transaction and mapped to GL Account 4 (Bank Deposits).
- **Blast Radius:**
  Cash-on-delivery orders generated with whitespace padding in Kafka event payloads get credited/debited to bank deposit ledgers instead of physical cash drawers.
- **Recommended Remediation:**
  Add `.trim()` before normalization:
  ```typescript
  const cleanMethod = typeof paymentMethod === "string" ? paymentMethod.trim().toUpperCase() : "";
  const isCod = cleanMethod === "COD";
  ```

---

## 4. Robust Invariants Verified (45 Passed Tests)

1. **Terminal State Immutability (Status 600):**
   - Attempting `approveLoan`, `disburseLoan`, `rejectLoan`, `withdrawLoan`, or `repayLoan` on a closed loan in status 600 is unconditionally rejected with HTTP 403.
2. **Loan State Machine Progression:**
   - Disbursement before approval (100 -> 300) is strictly blocked.
   - Double-approval (200 -> 200) and double-disbursement (300 -> 300) are strictly blocked.
   - Closed states (400, 500, 600) cannot be approved or disbursed.
3. **Chronology Invariants:**
   - Future approval dates (e.g. year 2035) are strictly rejected with HTTP 403.
   - Disbursement dates preceding approval dates are rejected with HTTP 403.
4. **Overpayment & Monotonic Decrease:**
   - Gross overpayment (`2 * totalOutstanding`), 1 VND overpayment, and sub-cent overpayment beyond 0.01 tolerance are strictly rejected.
   - 50 consecutive micro-repayments monotonically reduce outstanding balance without dropping below zero (`Math.max(0, ...)` protection).
   - Race conditions on full settlement (sequential double payment) are blocked because the first payment transitions the loan to 600.
5. **Double-Entry Invariant Guard:**
   - Imbalanced vouchers (Dr != Cr) are rejected.
   - Differential `>= 0.001` strictly fails.
   - Differential `< 0.001` passes.
   - Missing debits or credits arrays (`[]`) are rejected.
   - 50-line multi-split balanced vouchers maintain precision and balance.
6. **Kafka EDA Balance Conservation:**
   - 20 alternating Sale and Refund Kafka events perfectly conserve net ledger balances.
   - Non-financial statuses (`DELIVERED`, `COMPLETED`) generate no financial vouchers.
   - Negative event amounts are ignored safely.

---

## 5. Verification Commands

To independently execute and verify this adversarial stress test suite:

```bash
# Execute Challenger 1 Adversarial Suite
npx tsx .agents/m6_challenger_1/stress_fsm_ledger.ts

# Execute Baseline 4-Tier Test Suite
npx tsx tests/fineract/run-tests.ts

# Verify Application Production Build
npm run build

# Verify Backend Dev Server Health
curl -s http://localhost:3000/api/health
```

---

## 6. Formal Milestone Verdict

**Verdict:** **`REQUEST_CHANGES`**

**Justification:**
While FSM lifecycle rules and happy-path accounting logic are solid, the existence of `NaN` state corruption in repayment math and masked negative lines passing the double-entry invariant violates strict core banking reliability criteria. Remediation of the 5 documented defects is recommended before production certification.
