# Adversarial Stress Testing Report — Milestone 6: Challenger 2
**Focus Area:** Kafka EDA Event Simulation, Concurrency, Client Idempotency & Error Extraction  
**Author:** Challenger 2 (Empirical Challenger)  
**Date:** 2026-09-04  
**Verdict:** **REQUEST_CHANGES**

---

## 1. Executive Summary

Challenger 2 executed an empirical adversarial stress test suite against the Apache Fineract integration, specifically targeting:
1. **High-frequency concurrent bursts** of Kafka order events (`PROCESSING`, `REFUNDED`, `DELIVERED`, `CANCELLED`).
2. **Kafka EDA idempotency & order number integrity** under at-least-once delivery semantics.
3. **Client registration robustness**, including Vietnamese diacritics, compound names, whitespace padding, and customer-role data isolation.
4. **Malformed, corrupted, or HTML error payloads** passed to `extractFineractError` and `formatFineractErrorToast`.

A total of **19 empirical test probes** were executed via `.agents/m6_challenger_2/stress_eda_errors.ts`.

### Test Summary
- **Total Probes:** 19
- **Passed / Resilient:** 10 (52.6%)
- **Confirmed Vulnerabilities / Defect Escrows:** 9 (47.4%)
- **Critical Severities:** 1 (Fatal unhandled exception / crash in error extractor)
- **High Severities:** 3 (Kafka EDA duplicate posting, customer isolation leak, gateway 502/504 error loss)
- **Medium Severities:** 4 (ExternalId whitespace bypass, unsanitized HTML in toast, unescaped injection strings in voucher references, empty orderNumber validation)
- **Low Severities:** 1 (Out-of-order lifecycle event: refund without prior sale)

Due to the **Critical application crash in `extractFineractError` (G4-01)**, the **Customer Role Data Leak (G3-05)**, and the **Accounting Idempotency Double-Posting Violation (G2-01)**, Challenger 2 issues an explicit verdict of **REQUEST_CHANGES**.

---

## 2. Test Execution Results Matrix

| ID | Category | Adversarial Test Scenario | Status | Latency | Key Finding / Observation |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **G1-01** | Kafka Concurrency | 100 concurrent mixed events via `Promise.all` | **PASS** | 92.06ms | All 100 events recorded; 70 financial transactions balanced; global debits == credits. |
| **G1-02** | Kafka Concurrency | Monotonic line ID & transaction ID collision test | **PASS** | 0.09ms | Zero transaction ID or line ID collisions under concurrency. |
| **G2-01** | EDA Idempotency | Duplicate event delivery (at-least-once Kafka semantics) | **VULN [HIGH]** | 0.45ms | **Duplicate journal postings:** Same event executed twice creates 2 separate SALE vouchers, doubling revenue and cash. |
| **G2-02** | EDA Integrity | Out-of-order lifecycle: REFUNDED without prior SALE | **VULN [LOW]** | 0.29ms | System allows posting `REFUND-` vouchers on orders that never had a prior `SALE-` transaction. |
| **G2-03** | EDA Integrity | Empty or whitespace `orderNumber` | **VULN [MED]** | 0.60ms | Order number `"   "` accepted and generated journal voucher `SALE-   ` without validation. |
| **G2-04** | EDA Integrity | Malicious strings in `orderNumber` (XSS / SQL / Path) | **VULN [MED]** | 0.51ms | `<script>alert('xss')</script>` passed unescaped into voucher reference `SALE-<script>...`. |
| **G2-05** | EDA Integrity | Non-numeric amounts (`NaN`, `-0`, `Infinity`) | **PASS** | 9.60ms | Non-numeric or invalid amounts safely rejected by double-entry invariant guard. |
| **G3-01** | Client Registration | Vietnamese diacritics & 4-5 word compound names | **PASS** | 1.04ms | "Đặng Vũ Thị Ngọc Ánh", "Nguyễn Phước Vĩnh Thuỵ", "Trần Đoàn Trọng Nghĩa" parsed cleanly. |
| **G3-02** | Client Registration | Irregular whitespace: tabs, non-breaking space (`\u00A0`) | **PASS** | 0.50ms | Whitespace and unicode tabs trimmed and tokenized into correct firstname/lastname. |
| **G3-03** | Client Registration | Single-word name handling | **PASS** | 0.36ms | Single word "Dũng" accepted; assigns firstname and lastname to "Dũng". |
| **G3-04** | Client Registration | `externalId` uniqueness bypass via whitespace | **VULN [MED]** | 0.43ms | `createClient` does not trim `externalId`; `" ERP-USER-100 "` bypassed uniqueness check against `"ERP-USER-100"`. |
| **G3-05** | Client Registration | Customer role isolation: query with `externalId: ""` | **VULN [HIGH]** | 0.29ms | **Data Leak:** `getClients("customer", "")` bypassed role filter and leaked all 6 client profiles in system. |
| **G4-01** | Error Extractor | Fatal crash on `errors: [null]` in payload | **VULN [CRIT]** | 3.26ms | **Unhandled Exception:** `Cannot read properties of null (reading 'parameterName')` crashes the application. |
| **G4-02** | Error Extractor | Axios/Gateway error with HTML payload (502 / 504) | **VULN [HIGH]** | 0.20ms | 502 Bad Gateway dropped; status defaulted to 400 "Dữ Liệu Không Hợp Lệ" and error message lost. |
| **G4-03** | Error Extractor | Raw HTML error string passed to toast formatter | **VULN [MED]** | 0.18ms | Unsanitized raw HTML markup leaked directly into user toast text. |
| **G4-04** | Error Extractor | Corrupted / truncated JSON in `fineractResponse` | **PASS** | 0.07ms | Corrupted JSON caught safely; raw string preserved in `developerMessage`. |
| **G4-05** | Error Extractor | XSS script injection inside `fineractResponse` JSON | **PASS** | 0.06ms | Extractor does not crash on script tags in error strings. |
| **G4-06** | Error Extractor | Primitive inputs (`null`, `undefined`, `123`, `NaN`, `Symbol`) | **PASS** | 0.19ms | All primitives handled gracefully with fallback error structure. |
| **G4-07** | Error Extractor | Circular reference in error object | **PASS** | 0.12ms | Circular reference caught in JSON.stringify try/catch without crashing. |

---

## 3. Deep Dive into Confirmed Vulnerabilities

### 3.1. [CRITICAL] Defect G4-01: Application Crash in `fineractErrorExtractor.ts:166` on `errors: [null]`
- **Observation:**
  Passing `{ data: { fineractResponse: { developerMessage: "Fail", errors: [null] } } }` immediately throws:
  ```
  TypeError: Cannot read properties of null (reading 'parameterName')
      at extractFineractError (/home/ddicgegd/Projects/noname/src/lib/fineractErrorExtractor.ts:166:40)
  ```
- **Root Cause:**
  In `src/lib/fineractErrorExtractor.ts`:
  ```typescript
  163: if (Array.isArray(inner.errors) && inner.errors.length > 0) {
  164:   errors = inner.errors;
  165:   const firstErr = inner.errors[0];
  166:   if (!parameterName && firstErr.parameterName) { // <--- CRASH if firstErr is null/undefined
  ```
- **Remediation Recommendation:**
  Add optional chaining / null guard:
  ```typescript
  const firstErr = inner.errors[0];
  if (firstErr && typeof firstErr === "object") {
    if (!parameterName && firstErr.parameterName) {
      parameterName = firstErr.parameterName;
    }
    ...
  }
  ```

---

### 3.2. [HIGH] Defect G2-01: Kafka EDA At-Least-Once Delivery Double-Posting
- **Observation:**
  When `processKafkaOrderEvent` receives the identical order event twice (`orderNumber: "ORD-IDEMPOTENT-001"`, `newStatus: "PROCESSING"`), it creates 2 separate journal entries: `TX-20260904-0101` and `TX-20260904-0102`.
- **Root Cause:**
  In `src/lib/fineractMockStore.ts`, `processKafkaOrderEvent` does not check whether a journal entry with `referenceNumber === SALE-${event.orderNumber}` or an event with `eventId` has already been processed.
- **Business Impact:**
  In Kafka event streaming, duplicates are standard (at-least-once guarantee). Double-posting inflates Cash/Bank and Sales Revenue balances by 200%.
- **Remediation Recommendation:**
  In `processKafkaOrderEvent`:
  ```typescript
  const existingTx = this.state.journalEntries.find(
    e => e.referenceNumber === `${referencePrefix}-${event.orderNumber}`
  );
  if (existingTx) {
    eventRecord.processed = true;
    eventRecord.journalTransactionId = existingTx.transactionId;
    eventRecord.note = `Bỏ qua trùng lặp: Đã tồn tại chứng từ ${existingTx.referenceNumber}`;
    this.state.kafkaEvents.unshift(eventRecord);
    this.persist();
    return { event: eventRecord };
  }
  ```

---

### 3.3. [HIGH] Defect G3-05: Customer Role Security Filter Bypass via Empty `externalId`
- **Observation:**
  Calling `getClients("customer", "")` returns ALL 6 clients in the system!
- **Root Cause:**
  In `src/lib/fineractMockStore.ts` line 1270:
  ```typescript
  public getClients(role?: "admin" | "customer", externalId?: string): FineractClient[] {
    if (role === "customer" && externalId) {
      return this.state.clients.filter(c => c.externalId === externalId);
    }
    return [...this.state.clients];
  }
  ```
  When `role === "customer"` but `externalId` is empty string `""` or `undefined`, the condition `(role === "customer" && externalId)` evaluates to `false`, falling through to `return [...this.state.clients]`.
- **Business Impact:**
  Unauthenticated or misconfigured customer requests leak the complete banking client directory.
- **Remediation Recommendation:**
  ```typescript
  if (role === "customer") {
    if (!externalId || !externalId.trim()) return [];
    return this.state.clients.filter(c => c.externalId === externalId.trim());
  }
  ```

---

### 3.4. [HIGH] Defect G4-02: Loss of Gateway Status Code (502/504) on HTML Error Payloads
- **Observation:**
  When an Axios or Fetch error has `status: 502` and `data: "<html>Bad Gateway</html>"`, `extractFineractError` outputs:
  - `httpStatusCode: 400`
  - `title: "Dữ Liệu Không Hợp Lệ (HTTP 400)"`
  - `defaultUserMessage: "Đã xảy ra lỗi khi thao tác với hệ thống Core Banking."`
- **Root Cause:**
  In `src/lib/fineractErrorExtractor.ts:89-91`:
  `payload` is set to `errObj.data` (which is a string).
  The code branches on `if (payload && typeof payload === "object")`.
  Since `typeof payload === "string"`, it skips extracting `errObj.status` or `errObj.statusCode`, falling through with default status 400.
- **Remediation Recommendation:**
  Extract `httpStatusCode` from `errObj.status || errObj.statusCode || errObj.httpStatusCode` before checking `typeof payload === "object"`. If `payload` is an HTML string, check for standard gateway error patterns (`502 Bad Gateway`, `504 Gateway Timeout`) and populate `defaultUserMessage` appropriately.

---

### 3.5. [MEDIUM] Defect G3-04: ExternalId Uniqueness Bypass via Untrimmed Whitespace
- **Observation:**
  A client was registered with `externalId: "ERP-USER-100"`. A subsequent registration with `externalId: " ERP-USER-100 "` succeeded.
- **Root Cause:**
  In `src/lib/fineractMockStore.ts:1312`:
  `const exists = this.state.clients.some(c => c.externalId === payload.externalId);`
  Neither `c.externalId` nor `payload.externalId` is trimmed or normalized.
- **Remediation Recommendation:**
  Trim `externalId` at the beginning of `createClient`:
  ```typescript
  const cleanExternalId = payload.externalId?.trim() || undefined;
  if (cleanExternalId) {
    const exists = this.state.clients.some(
      c => c.externalId?.trim().toLowerCase() === cleanExternalId.toLowerCase()
    );
    if (exists) throw createFineractError(403, ...);
  }
  ```

---

### 3.6. [MEDIUM] Defect G4-03: Unsanitized HTML Strings in Toast Popups
- **Observation:**
  Passing `"<html><body><h1>504 Gateway Timeout</h1></body></html>"` to `formatFineractErrorToast` returns raw HTML markup in `toast.message`.
- **Remediation Recommendation:**
  Strip HTML tags when formatting messages for toasts:
  ```typescript
  const cleanMessage = parsed.defaultUserMessage.replace(/<[^>]*>/g, "").trim();
  ```

---

### 3.7. [MEDIUM] Defect G2-04 & G2-03: Unvalidated / Malicious Strings in Order Numbers
- **Observation:**
  Order numbers with whitespace `"   "` or script tags `<script>alert('xss')</script>` are accepted and directly concatenated into ledger reference numbers (`SALE-   ` and `SALE-<script>...`).
- **Remediation Recommendation:**
  Validate and sanitize `event.orderNumber`:
  ```typescript
  const cleanOrderNum = event.orderNumber?.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanOrderNum) {
    eventRecord.note = "Bỏ qua: Mã đơn hàng (orderNumber) không hợp lệ";
    ...
  }
  ```

---

## 4. Strengths & System Robustness Observed

Despite the defects noted above, several key aspects of the implementation demonstrated exceptional engineering rigor:
1. **Double-Entry Invariant Under High Concurrency:** Under 100 concurrent requests across multiple workers (`Promise.all`), `Sum(Debit) == Sum(Credit)` held with zero delta across the entire ledger.
2. **Transaction & Line ID Monotonicity:** Zero ID collisions were detected in concurrent transactions or journal entry lines.
3. **Vietnamese Language Handling:** The Vietnamese name parsing engine correctly separated first and last names across diverse 3-word, 4-word, and 5-word compound names with complex tone marks.
4. **Resilience to Primitive and Circular Inputs:** Non-object errors, numeric codes, boolean flags, and circular reference objects were handled safely without unhandled exceptions.

---

## 5. Explicit Recommendation & Next Steps

1. **Verdict:** **REQUEST_CHANGES**
2. The implementing engineer should address:
   - **Fix 1:** Null-safe access in `src/lib/fineractErrorExtractor.ts:166` (`firstErr?.parameterName`).
   - **Fix 2:** Idempotency deduplication check in `src/lib/fineractMockStore.ts:1950` before posting order journal entries.
   - **Fix 3:** Customer role security check in `src/lib/fineractMockStore.ts:1270` (`if (role === "customer") return externalId ? filter(...) : [];`).
   - **Fix 4:** Extract HTTP status code from `errObj.status` in `extractFineractError` regardless of payload type.
   - **Fix 5:** Trim `externalId` and sanitize `orderNumber`.
