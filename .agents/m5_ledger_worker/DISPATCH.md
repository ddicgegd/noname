## 2026-09-04T01:57:18Z

You are the Worker implementing Milestone 5 (M5: Double-Entry General Ledger & Kafka EDA Order-to-Ledger Event Monitor - fineract-ledger & fineract-eda-events - R4, R5) for the Apache Fineract Core Banking integration.

Read the authoritative documents:
1. /home/ddicgegd/Projects/noname/.agents/ORIGINAL_REQUEST.md
2. /home/ddicgegd/Projects/noname/PROJECT.md
3. /home/ddicgegd/Projects/noname/TEST_READY.md
4. /home/ddicgegd/Projects/noname/.agents/spec_miner_survey/report.md
5. /home/ddicgegd/Projects/noname/.agents/m4_loans_worker/report.md

Your assigned working directory is /home/ddicgegd/Projects/noname/.agents/m5_ledger_worker/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership files:
- src/components/fineract/FineractLedger.tsx (R4: General Ledger Subsystem)
- src/components/fineract/JournalEntryModal.tsx (R4: Manual Journal Posting Modal with Double-Entry Guard)
- src/components/fineract/FineractEdaEvents.tsx (R5: Kafka EDA Event Monitor & Simulator)
- src/components/fineract/FineractDashboard.tsx (integrate <FineractLedger /> when activeSubTab === "ledger", integrate <FineractEdaEvents /> when activeSubTab === "eda-events")

Scope of implementation:
1. R4: Double-Entry General Ledger Subsystem (src/components/fineract/FineractLedger.tsx):
   - Header with title "Sổ Cái Kế Toán Kép (Double-Entry General Ledger)".
   - Summary KPIs: Total Journal Entries, Total Debit Volume, Total Credit Volume, Balance Verification Status (Balanced invariant checkmark).
   - Filter bar: Real-time search (reference number, comments, GL account, amount), date range or account filter.
   - Comprehensive General Ledger Transactions Table:
     * Transaction ID & Reference Number (`referenceNumber`, monospace)
     * Transaction Date (`transactionDate`, e.g. `dd MMMM yyyy`)
     * Office Name
     * Debits column: breakdown of accounts debited (e.g. `TK 1111 - 500,000 VND`)
     * Credits column: breakdown of accounts credited (e.g. `TK 5111 - 500,000 VND`)
     * Total Transaction Amount
     * Comments / Narration (`comments`)
     * Balance badge: `Balanced (Cân Bằng)` in green
   - GL Account Resolver Matrix Reference Table / Diagram:
     * Interactive visual reference diagram explaining how payment methods map to accounts:
       - Cash on hand (TK 1111 - ID 1, Asset)
       - Bank deposits (TK 1121 - ID 4, Asset)
       - Sales Revenue (TK 5111 - ID 2, Revenue)
       - Sales Returns (TK 5212 - ID 3, Contra-Revenue / Expense)
     * Clear table mapping:
       - Sale COD -> Dr 1111 Cash, Cr 5111 Revenue (Ref: `SALE-{orderNumber}`)
       - Sale Bank/VNPAY/Card -> Dr 1121 Bank, Cr 5111 Revenue (Ref: `SALE-{orderNumber}`)
       - Refund COD -> Dr 5212 Returns, Cr 1111 Cash (Ref: `REFUND-{orderNumber}`)
       - Refund Bank/VNPAY/Card -> Dr 5212 Returns, Cr 1121 Bank (Ref: `REFUND-{orderNumber}`)
   - "Ghi Bút Toán Mới" action button to open `JournalEntryModal.tsx`.

2. R4: Manual Journal Entry Posting Form with Invariant Guard (src/components/fineract/JournalEntryModal.tsx):
   - Modal dialog for posting custom multi-line double-entry journal vouchers:
     * Transaction date (default: today, format `dd MMMM yyyy`).
     * Reference number (e.g. `MANUAL-TX-XXXX`, auto-generated or editable).
     * Comments / Narration.
     * Dynamic Line Editor for Debits:
       - GL account dropdown (TK 1111 Cash, TK 1121 Bank, TK 5111 Sales, TK 5212 Returns, etc.)
       - Amount input
       - Add/Remove debit lines (supports multi-line splits)
     * Dynamic Line Editor for Credits:
       - GL account dropdown
       - Amount input
       - Add/Remove credit lines
     * **REAL-TIME DOUBLE-ENTRY BALANCE INVARIANT ENFORCEMENT**:
       - Calculate `sum(debits)` and `sum(credits)`.
       - Differential display: `Delta = abs(sum(debits) - sum(credits))`.
       - When `Delta > 0.001`: Lock/disable Submit button, show prominent amber/red alert: "Nguyên tắc kế toán kép vi phạm: Tổng Nợ (...) khác Tổng Có (...). Chênh lệch: ...".
       - When `Delta < 0.001` and `sum > 0`: Enable Submit button, show green badge: "Bút toán cân bằng".
     * Submit calls `fineractService.createJournalEntry(...)`, displays responsive toast via `useFineractToast()`, refreshes ledger table, and updates parent dashboard balances.

3. R5: Kafka EDA Order-to-Ledger Event Monitor & Simulator (src/components/fineract/FineractEdaEvents.tsx):
   - Stream Monitor Header & Topology:
     * Kafka Topic: `order-topic`
     * Consumer Group: `fineract-order-group`
     * Health status badge & message throughput counter.
   - Interactive Event Simulator Card:
     * Order Number input (e.g. `ORD-20260904-XXXX` with quick "Tạo mã đơn ngẫu nhiên" button).
     * Order Total Amount (e.g. `1,250,000 VND`).
     * Payment Method selector (`COD`, `BANK_TRANSFER`, `VNPAY`, `MOMO`, `CREDIT_CARD`).
     * Target Status selector:
       - `PROCESSING` -> Simulates order payment, triggering automatic ledger creation `SALE-{orderNumber}`.
       - `REFUNDED` -> Simulates customer return, triggering automatic ledger creation `REFUND-{orderNumber}`.
       - `DELIVERED`, `CANCELLED`, `COMPLETED` -> Non-financial statuses (demonstrating safe skip).
     * "Phát Sự Kiện (Emit Kafka Event)" button.
     * Real-time preview card explaining what the consumer will do upon receiving this event.
   - Live Event Stream Table:
     * Timestamp (monospace)
     * Event Type (`ORDER_STATUS_CHANGED`, `ORDER_CREATED`)
     * Order Number (monospace)
     * New Status (status badges)
     * Order Amount & Payment Method
     * Action Result: "Đã hạch toán SALE-..." / "Đã hạch toán REFUND-..." / "Bỏ qua (Phi tài chính)"
     * Direct Link / button to view the corresponding journal voucher in the Ledger tab.
   - Instant reactivity: Emitting an event immediately updates the EDA event log, generates the journal voucher in the Ledger, updates Cash or Bank balances in Overview, and displays a success toast.

4. Integrate with `FineractDashboard.tsx`:
   - Mount `<FineractLedger />` when `activeSubTab === "ledger"`.
   - Mount `<FineractEdaEvents />` when `activeSubTab === "eda-events"`.
   - Synchronize counts and state across tabs.

Styling & Aesthetics (design-taste-frontend):
- Dark technical cockpit: `#0F1115` base, `#15181F` surfaces, `border-slate-800/80`, `#FF4D24` vermilion accent, monospace fonts for references, amounts, and dates. Lucide icons.

Verification:
- Run `npm run build` (0 TypeScript / bundling errors).
- Run `npx tsx tests/fineract/run-tests.ts` (102/102 pass).
- Execute AGENTS.md restart & health check sequence:
  1. fuser -k 3000/tcp 2>/dev/null || true
  2. npm run dev
  3. curl -s http://localhost:3000/api/health returns {"status":"ok",...}
- Write report in /home/ddicgegd/Projects/noname/.agents/m5_ledger_worker/report.md and handoff in /home/ddicgegd/Projects/noname/.agents/m5_ledger_worker/handoff.md.
- Send message to parent (conversation ID: 067cf0e6-5e76-4e91-929c-5e4ad25ae3b0) when complete.
