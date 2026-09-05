## 2026-09-04T01:52:15Z

You are the Worker implementing Milestone 4 (M4: Loan Products & Loan Lifecycle State Machine - fineract-loans - R3) for the Apache Fineract Core Banking integration.

Read the authoritative documents:
1. /home/ddicgegd/Projects/noname/.agents/ORIGINAL_REQUEST.md
2. /home/ddicgegd/Projects/noname/PROJECT.md
3. /home/ddicgegd/Projects/noname/TEST_READY.md
4. /home/ddicgegd/Projects/noname/.agents/spec_miner_survey/report.md
5. /home/ddicgegd/Projects/noname/.agents/m3_clients_worker/report.md

Your assigned working directory is /home/ddicgegd/Projects/noname/.agents/m4_loans_worker/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership files:
- src/components/fineract/FineractLoans.tsx
- src/components/fineract/LoanDetailModal.tsx
- src/components/fineract/LoanActionModal.tsx
- src/components/fineract/LoanApplicationModal.tsx (optional or separate modal for loan application)
- src/components/fineract/FineractDashboard.tsx (integrate <FineractLoans /> when activeSubTab === "loans")

Scope of implementation:
1. Loan Products Catalog & KPI Deck:
   - Display loan products (e.g. ERP-LN01, ERP-LN02):
     * Name, description, principal limits (minPrincipal - maxPrincipal), interest rate per period, repayment every, number of repayments.
     * "Nộp Hồ Sơ Vay Mới" action button to open loan application dialog.
   - Summary KPIs: Total Loans, Active Loans, Total Portfolio Principal, Total Outstanding Balance.
2. Comprehensive Loan Accounts Manager:
   - Table of loan accounts with real-time search (accountNo, clientName, externalId) and status filters (All, 100: Pending, 200: Approved, 300: Active, 600: Obligations Met, 400: Withdrawn, 500: Rejected).
   - Columns: ID, Account No (monospace), Borrower Name, Loan Product, Principal, Total Outstanding (formatted VND), Expected Total, State Badge (100 to 600 with distinct color tokens), Action triggers.
3. Loan Detail Modal & Interactive Repayment Schedule (src/components/fineract/LoanDetailModal.tsx):
   - Contract summary: Borrower, product, principal, term, disbursement date.
   - Interactive Repayment Schedule table:
     * Column headers: Kỳ (Period #), Ngày đáo hạn (Due Date), Gốc phải trả (Principal Due), Gốc đã trả (Paid), Lãi phải trả (Interest Due), Lãi đã trả (Paid), Tổng số kỳ (Total Due), Dư nợ còn lại (Outstanding), Trạng thái (Complete badge / checkmark).
     * Period 0 (Disbursement) and Periods 1..N.
     * Summary footer: Sum of Principal, Sum of Interest, Sum of Paid, Net Outstanding.
4. State Transition Controls & Action Modals (src/components/fineract/LoanActionModal.tsx):
   - Strict Fineract state machine controls available per loan status:
     * When status == 100 (Pending): "Duyệt Vay" (Approve), "Từ Chối" (Reject), "Rút Hồ Sơ" (Withdraw)
     * When status == 200 (Approved): "Giải Ngân" (Disburse)
     * When status == 300 (Active): "Thu Nợ / Trả Góp" (Repayment)
     * When status == 600, 400, 500: Terminal state, no state transition buttons
   - Modals with confirmation:
     * Approve: Date picker (approvedOnDate, default today), notes field. Calls `fineractService.approveLoan(...)`.
     * Disburse: Date picker (actualDisbursementDate, default today), notes field. Calls `fineractService.disburseLoan(...)`.
     * Reject: Date picker (rejectedOnDate), notes field. Calls `fineractService.rejectLoan(...)`.
     * Withdraw: Date picker (withdrawnOnDate), notes field. Calls `fineractService.withdrawLoan(...)`.
     * Repay: Date picker (transactionDate), Amount input (transactionAmount, defaults to next period due, cannot exceed total outstanding), payment method selection (Cash / Bank / VNPAY). Calls `fineractService.repayLoan(...)`. When balance reaches 0, loan automatically transitions to 600: OBLIGATIONS_MET.
   - All actions provide responsive toast feedback via `useFineractToast()` and display detailed Fineract diagnostics upon error (`fineractError`).
   - Instant UI reactivity: Action execution immediately updates table, detail view, loan balance, and parent dashboard KPIs.
5. Integrate with `FineractDashboard.tsx`:
   - Mount `<FineractLoans />` in place of the placeholder when `activeSubTab === "loans"`.
   - Update quick stats or loans count when loans mutate.

Styling & Aesthetics (design-taste-frontend):
- Dark technical cockpit aesthetic: `#0F1115` base, `#15181F` surfaces, `border-slate-800/80`, `#FF4D24` vermilion accent, emerald for active/complete states, monospace typography for numbers and dates.

Verification:
- Run `npm run build` (0 TypeScript / bundling errors).
- Run `npx tsx tests/fineract/run-tests.ts` (102/102 pass).
- Execute AGENTS.md restart & health check:
  1. fuser -k 3000/tcp 2>/dev/null || true
  2. npm run dev
  3. curl -s http://localhost:3000/api/health returns {"status":"ok",...}
- Write report in /home/ddicgegd/Projects/noname/.agents/m4_loans_worker/report.md and handoff in /home/ddicgegd/Projects/noname/.agents/m4_loans_worker/handoff.md.
- Send message to parent (conversation ID: 067cf0e6-5e76-4e91-929c-5e4ad25ae3b0) when complete.
