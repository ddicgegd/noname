/**
 * Adversarial Stress Testing Harness: Core Engine FSM, Repayment Math & General Ledger Invariants
 * Milestone 6 — Challenger 1
 * 
 * Target Domains:
 * 1. Illegal Loan Lifecycle FSM Transitions
 * 2. Floating-Point Rounding & Precision Attacks
 * 3. Loan Overpayment & Settlement Attacks
 * 4. General Ledger Double-Entry Balance Invariant Attacks
 * 5. GL Account Resolver & Kafka EDA Invariant Attacks
 */

import { fineractMockStore, FineractMockStore, GL_RESOLVER_MATRIX } from "../../src/lib/fineractMockStore";
import { CreateJournalEntryPayload, KafkaOrderEvent } from "../../src/types/fineract";

export interface StressTestCase {
  id: string;
  category: string;
  description: string;
  execute: () => Promise<void> | void;
}

export interface StressTestReportItem {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  expectedBehavior: string;
  actualBehavior: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  durationMs: number;
  errorDetail?: string;
}

const reportItems: StressTestReportItem[] = [];

function recordResult(
  id: string,
  category: string,
  description: string,
  passed: boolean,
  expectedBehavior: string,
  actualBehavior: string,
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  durationMs: number,
  errorDetail?: string
) {
  reportItems.push({
    id,
    category,
    description,
    passed,
    expectedBehavior,
    actualBehavior,
    severity,
    durationMs,
    errorDetail
  });

  const icon = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
  const sevTag = `\x1b[33m[${severity}]\x1b[0m`;
  console.log(`  ${icon} ${sevTag} ${id}: ${description} (${durationMs.toFixed(2)}ms)`);
  if (!passed) {
    console.log(`         \x1b[91mExpected: ${expectedBehavior}\x1b[0m`);
    console.log(`         \x1b[91mActual:   ${actualBehavior}\x1b[0m`);
    if (errorDetail) console.log(`         \x1b[90mDetails:  ${errorDetail}\x1b[0m`);
  }
}

async function runTest(
  id: string,
  category: string,
  description: string,
  expectedBehavior: string,
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  fn: () => Promise<{ actual: string; passed?: boolean }> | { actual: string; passed?: boolean }
) {
  const start = performance.now();
  let passed = true;
  let actualBehavior = "";
  let errorDetail: string | undefined;

  try {
    const res = await fn();
    actualBehavior = res.actual;
    passed = res.passed !== undefined ? res.passed : true;
  } catch (err: any) {
    passed = false;
    actualBehavior = `Unexpected exception: ${err.message || String(err)}`;
    errorDetail = err.stack;
  }

  const durationMs = performance.now() - start;
  recordResult(id, category, description, passed, expectedBehavior, actualBehavior, severity, durationMs, errorDetail);
}

// ============================================================================
// SUITE EXECUTION
// ============================================================================

export async function runAllStressTests() {
  console.log("\x1b[1m\x1b[35m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[35m  MILIESTONE 6 CHALLENGER 1: ADVERSARIAL STRESS TEST (FSM, REPAYMENT & GL INVARIANTS)   \x1b[0m");
  console.log("\x1b[1m\x1b[35m========================================================================================\x1b[0m\n");

  // ==========================================================================
  // 1. ILLEGAL LOAN FSM TRANSITIONS
  // ==========================================================================
  console.log("\x1b[1m\x1b[36m>>> [CATEGORY 1] ILLEGAL LOAN LIFECYCLE FSM TRANSITION ATTACKS\x1b[0m");

  // C1.01: Disburse on Pending Approval (100 -> 300 directly without 200)
  await runTest(
    "ADV-FSM-01",
    "FSM Transitions",
    "Disbursement attempted on unapproved pending loan (status 100)",
    "Throws HTTP 403 error.msg.loan.disbursement.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.disburseLoan(1, "04 September 2026");
        return { passed: false, actual: "Operation succeeded without throwing error" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403 && String(err.message).includes("Chỉ có thể giải ngân khoản vay đã được Phê duyệt");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.02: Approve on already Approved loan (200 -> 200)
  await runTest(
    "ADV-FSM-02",
    "FSM Transitions",
    "Approval attempted on already approved loan (status 200)",
    "Throws HTTP 403 error.msg.loan.approval.not.allowed.in.current.state",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(2, "04 September 2026");
        return { passed: false, actual: "Double approval succeeded without error" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403 && String(err.message).includes("Chỉ có thể phê duyệt hồ sơ khoản vay đang ở trạng thái Chờ duyệt");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.03: Approve on Active loan (300 -> 200)
  await runTest(
    "ADV-FSM-03",
    "FSM Transitions",
    "Approval attempted on active disbursed loan (status 300)",
    "Throws HTTP 403 error.msg.loan.approval.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(3, "04 September 2026");
        return { passed: false, actual: "Approval on active loan succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.04: Approve on Withdrawn loan (400 -> 200)
  await runTest(
    "ADV-FSM-04",
    "FSM Transitions",
    "Approval attempted on withdrawn loan (status 400)",
    "Throws HTTP 403 error.msg.loan.approval.not.allowed.in.current.state",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(6, "04 September 2026");
        return { passed: false, actual: "Approval on withdrawn loan succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.05: Approve on Rejected loan (500 -> 200)
  await runTest(
    "ADV-FSM-05",
    "FSM Transitions",
    "Approval attempted on rejected loan (status 500)",
    "Throws HTTP 403 error.msg.loan.approval.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(5, "04 September 2026");
        return { passed: false, actual: "Approval on rejected loan succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.06: Disburse on Rejected loan (500 -> 300)
  await runTest(
    "ADV-FSM-06",
    "FSM Transitions",
    "Disbursement attempted on rejected loan (status 500)",
    "Throws HTTP 403 error.msg.loan.disbursement.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.disburseLoan(5, "04 September 2026");
        return { passed: false, actual: "Disbursement on rejected loan succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.07: Disburse on Withdrawn loan (400 -> 300)
  await runTest(
    "ADV-FSM-07",
    "FSM Transitions",
    "Disbursement attempted on withdrawn loan (status 400)",
    "Throws HTTP 403 error.msg.loan.disbursement.not.allowed.in.current.state",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.disburseLoan(6, "04 September 2026");
        return { passed: false, actual: "Disbursement on withdrawn loan succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.08: Disburse on already Active loan (300 -> 300 double disbursement)
  await runTest(
    "ADV-FSM-08",
    "FSM Transitions",
    "Disbursement attempted on active loan (status 300)",
    "Throws HTTP 403 error.msg.loan.disbursement.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.disburseLoan(3, "04 September 2026");
        return { passed: false, actual: "Double disbursement succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.09: Actions on Closed / Obligations Met Loan (Status 600)
  await runTest(
    "ADV-FSM-09",
    "FSM Transitions",
    "Approve attempted on terminal closed loan (status 600)",
    "Throws HTTP 403 error",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(4, "04 September 2026");
        return { passed: false, actual: "Approve on closed loan succeeded" };
      } catch (err: any) {
        return { passed: err.httpStatusCode === 403, actual: `Blocked with status ${err.httpStatusCode}` };
      }
    }
  );

  await runTest(
    "ADV-FSM-10",
    "FSM Transitions",
    "Disburse attempted on terminal closed loan (status 600)",
    "Throws HTTP 403 error",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.disburseLoan(4, "04 September 2026");
        return { passed: false, actual: "Disburse on closed loan succeeded" };
      } catch (err: any) {
        return { passed: err.httpStatusCode === 403, actual: `Blocked with status ${err.httpStatusCode}` };
      }
    }
  );

  await runTest(
    "ADV-FSM-11",
    "FSM Transitions",
    "Reject attempted on terminal closed loan (status 600)",
    "Throws HTTP 403 error",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.rejectLoan(4, "04 September 2026");
        return { passed: false, actual: "Reject on closed loan succeeded" };
      } catch (err: any) {
        return { passed: err.httpStatusCode === 403, actual: `Blocked with status ${err.httpStatusCode}` };
      }
    }
  );

  await runTest(
    "ADV-FSM-12",
    "FSM Transitions",
    "Withdraw attempted on terminal closed loan (status 600)",
    "Throws HTTP 403 error",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.withdrawLoan(4, "04 September 2026");
        return { passed: false, actual: "Withdraw on closed loan succeeded" };
      } catch (err: any) {
        return { passed: err.httpStatusCode === 403, actual: `Blocked with status ${err.httpStatusCode}` };
      }
    }
  );

  await runTest(
    "ADV-FSM-13",
    "FSM Transitions",
    "Repayment attempted on terminal closed loan (status 600)",
    "Throws HTTP 403 error.msg.loan.repayment.not.allowed.in.current.state",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(4, 500000, "04 September 2026");
        return { passed: false, actual: "Repayment on closed loan succeeded" };
      } catch (err: any) {
        return { passed: err.httpStatusCode === 403, actual: `Blocked with status ${err.httpStatusCode}` };
      }
    }
  );

  // C1.14: Chronology violation — Disburse date prior to Approval date
  await runTest(
    "ADV-FSM-14",
    "FSM Transitions",
    "Disbursement date precedes loan approval date",
    "Throws HTTP 403 error.msg.loan.disbursement.cannot.be.before.approval",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        // Loan 2 approved on 15 August 2026; attempt disburse on 10 August 2026
        fineractMockStore.disburseLoan(2, "10 August 2026");
        return { passed: false, actual: "Disbursement prior to approval succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403 && String(err.message).includes("không thể trước ngày phê duyệt");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C1.15: Future Date Approval Attack
  await runTest(
    "ADV-FSM-15",
    "FSM Transitions",
    "Approval attempted with far future calendar date (e.g. 2035)",
    "Throws HTTP 403 error.msg.loan.approval.cannot.be.in.the.future",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.approveLoan(1, "15 December 2035");
        return { passed: false, actual: "Future approval date succeeded" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403 && String(err.message).includes("không thể ở tương lai");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // ==========================================================================
  // 2. FLOATING POINT ROUNDING & REPAYMENT ARITHMETIC ATTACKS
  // ==========================================================================
  console.log("\n\x1b[1m\x1b[36m>>> [CATEGORY 2] FLOATING POINT ROUNDING & REPAYMENT ARITHMETIC ATTACKS\x1b[0m");

  // C2.01: High-precision irrational repayment split (1/3rd split)
  await runTest(
    "ADV-FP-01",
    "Floating Point Math",
    "Irrational 3-part equal split of exact outstanding balance (e.g. 1/3 each)",
    "All principal paid, totalOutstanding == 0, terminal status 600 reached without residual float drift",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      // Loan 3 is active, totalExpected = 66,840,000, 2 payments made (11,140,000 total)
      const loan = fineractMockStore.getLoan(3);
      const outstanding = loan.summary.totalOutstanding; // 55,700,000
      
      const part1 = Math.floor(outstanding / 3);
      const part2 = Math.floor(outstanding / 3);
      const part3 = outstanding - part1 - part2;

      fineractMockStore.repayLoan(3, part1, "04 September 2026");
      fineractMockStore.repayLoan(3, part2, "04 September 2026");
      const finalRes = fineractMockStore.repayLoan(3, part3, "04 September 2026");

      const finalLoan = finalRes.loan;
      const ok = finalLoan.status.id === 600 && finalLoan.summary.totalOutstanding === 0;
      return {
        passed: ok,
        actual: `Final status: ${finalLoan.status.id}, totalOutstanding: ${finalLoan.summary.totalOutstanding}, principalOutstanding: ${finalLoan.summary.principalOutstanding}`
      };
    }
  );

  // C2.02: 50 micro-repayments monotonic decrease and non-negative invariant
  await runTest(
    "ADV-FP-02",
    "Floating Point Math",
    "Stress sequence of 50 micro-repayments: verifies strict monotonic balance decrease and non-negativity",
    "Outstanding balance decreases monotonically at each step and never drops below zero",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      let previousBal = fineractMockStore.getLoan(3).summary.totalOutstanding;
      const step = 100000; // 100k per step

      for (let i = 0; i < 50; i++) {
        const { loan } = fineractMockStore.repayLoan(3, step, "04 September 2026");
        const currentBal = loan.summary.totalOutstanding;
        if (currentBal >= previousBal || currentBal < 0) {
          return { passed: false, actual: `Invariant broken at step ${i}: prev=${previousBal}, curr=${currentBal}` };
        }
        previousBal = currentBal;
      }
      return { passed: true, actual: `50 consecutive steps verified strictly monotonic; final balance: ${previousBal}` };
    }
  );

  // C2.03: Sub-cent rounding boundary check near 0 (remaining <= 0.001)
  await runTest(
    "ADV-FP-03",
    "Floating Point Math",
    "Payment leaving sub-cent floating residual (e.g. 0.0005 remaining)",
    "Triggers status 600 closure automatically due to delta <= 0.001 tolerance",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const initialOut = fineractMockStore.getLoan(3).summary.totalOutstanding;
      // Pay initialOut - 0.0005
      const payment = initialOut - 0.0005;
      const { loan } = fineractMockStore.repayLoan(3, payment, "04 September 2026");

      const ok = loan.status.id === 600;
      return {
        passed: ok,
        actual: `Loan status: ${loan.status.id}, remaining: ${loan.summary.totalOutstanding}`
      };
    }
  );

  // C2.04: Sub-cent rounding boundary check outside tolerance (remaining = 0.002)
  await runTest(
    "ADV-FP-04",
    "Floating Point Math",
    "Payment leaving 0.002 residual (exceeds 0.001 threshold)",
    "Loan remains in active status 300, not closed",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const initialOut = fineractMockStore.getLoan(3).summary.totalOutstanding;
      const payment = initialOut - 0.002;
      const { loan } = fineractMockStore.repayLoan(3, payment, "04 September 2026");

      const ok = loan.status.id === 300;
      return {
        passed: ok,
        actual: `Loan status: ${loan.status.id}, remaining: ${loan.summary.totalOutstanding}`
      };
    }
  );

  // C2.05: NaN Repayment Amount Injection Attack
  await runTest(
    "ADV-FP-05",
    "Floating Point Math",
    "Repayment attempted with NaN amount (JavaScript floating point vulnerability)",
    "Rejected by validation without corrupting loan balances with NaN",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(3, NaN, "04 September 2026");
        const loanAfter = fineractMockStore.getLoan(3);
        const isCorrupted = Number.isNaN(loanAfter.summary.totalOutstanding);
        if (isCorrupted) {
          return { passed: false, actual: "VULNERABILITY FOUND: NaN bypassed checks and corrupted loan balance!" };
        }
        return { passed: false, actual: "Operation accepted NaN without throwing" };
      } catch (err: any) {
        return { passed: true, actual: `Safely rejected with error: ${err.message}` };
      }
    }
  );

  // C2.06: Infinity Repayment Amount Injection Attack
  await runTest(
    "ADV-FP-06",
    "Floating Point Math",
    "Repayment attempted with Infinity amount",
    "Rejected with HTTP 403 or 400 error",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(3, Infinity, "04 September 2026");
        return { passed: false, actual: "Operation accepted Infinity without throwing" };
      } catch (err: any) {
        return { passed: true, actual: `Rejected with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C2.07: -Infinity Repayment Amount Injection Attack
  await runTest(
    "ADV-FP-07",
    "Floating Point Math",
    "Repayment attempted with -Infinity amount",
    "Rejected with HTTP 400 validation error",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(3, -Infinity, "04 September 2026");
        return { passed: false, actual: "Operation accepted -Infinity without throwing" };
      } catch (err: any) {
        return { passed: true, actual: `Rejected with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C2.08: Schedule waterfall allocation integrity under fractional cent installments
  await runTest(
    "ADV-FP-08",
    "Floating Point Math",
    "Schedule installment waterfall allocation across interest and principal under odd amounts",
    "Sum of period paid interest and principal equals totalRepayment precisely",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const amount = 3333333.33;
      const { loan } = fineractMockStore.repayLoan(3, amount, "04 September 2026");
      
      let sumPeriodsPaid = 0;
      for (const p of loan.repaymentSchedule!.periods) {
        if (p.period === 0) continue;
        sumPeriodsPaid += (p.principalPaid + p.interestPaid);
      }

      const diff = Math.abs(sumPeriodsPaid - loan.summary.totalRepayment);
      const ok = diff < 0.05;
      return {
        passed: ok,
        actual: `Sum of schedule periods paid: ${sumPeriodsPaid}, loan summary totalRepayment: ${loan.summary.totalRepayment} (diff: ${diff})`
      };
    }
  );

  // ==========================================================================
  // 3. OVERPAYMENT ATTACKS
  // ==========================================================================
  console.log("\n\x1b[1m\x1b[36m>>> [CATEGORY 3] OVERPAYMENT ATTACKS\x1b[0m");

  // C3.01: Gross Overpayment (2x outstanding balance)
  await runTest(
    "ADV-OVP-01",
    "Overpayment",
    "Gross overpayment (amount = 2 * totalOutstanding)",
    "Throws HTTP 403 error.msg.loan.repayment.amount.cannot.exceed.outstanding",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      const out = fineractMockStore.getLoan(3).summary.totalOutstanding;
      try {
        fineractMockStore.repayLoan(3, out * 2, "04 September 2026");
        return { passed: false, actual: "Gross overpayment accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403 && String(err.message).includes("không thể vượt quá tổng dư nợ còn lại");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C3.02: 1-Dong Overpayment Attack (amount = totalOutstanding + 1 VND)
  await runTest(
    "ADV-OVP-02",
    "Overpayment",
    "1-Dong overpayment beyond tolerance (amount = totalOutstanding + 1)",
    "Throws HTTP 403 error.msg.loan.repayment.amount.cannot.exceed.outstanding",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const out = fineractMockStore.getLoan(3).summary.totalOutstanding;
      try {
        fineractMockStore.repayLoan(3, out + 1, "04 September 2026");
        return { passed: false, actual: "1 VND overpayment accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C3.03: 0.05 Cent Overpayment Attack (amount = totalOutstanding + 0.05)
  await runTest(
    "ADV-OVP-03",
    "Overpayment",
    "Sub-cent overpayment beyond 0.01 tolerance (amount = totalOutstanding + 0.05)",
    "Throws HTTP 403 error",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const out = fineractMockStore.getLoan(3).summary.totalOutstanding;
      try {
        fineractMockStore.repayLoan(3, out + 0.05, "04 September 2026");
        return { passed: false, actual: "0.05 overpayment accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C3.04: Allowed boundary overpayment within 0.01 tolerance (amount = totalOutstanding + 0.005)
  await runTest(
    "ADV-OVP-04",
    "Overpayment",
    "Allowed boundary overpayment within 0.01 tolerance (amount = totalOutstanding + 0.005)",
    "Accepted without crashing, clamps balance to exact zero, transitions to 600",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const out = fineractMockStore.getLoan(3).summary.totalOutstanding;
      const { loan } = fineractMockStore.repayLoan(3, out + 0.005, "04 September 2026");
      const ok = loan.status.id === 600 && loan.summary.totalOutstanding === 0;
      return {
        passed: ok,
        actual: `Loan status: ${loan.status.id}, totalOutstanding: ${loan.summary.totalOutstanding}`
      };
    }
  );

  // C3.05: Sequential Race: Double Full-Settlement Repayment
  await runTest(
    "ADV-OVP-05",
    "Overpayment",
    "Double full-settlement repayment: 1st settles to 600, 2nd must be rejected",
    "Second repayment rejected with HTTP 403 because loan is no longer in active status",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      const out = fineractMockStore.getLoan(3).summary.totalOutstanding;
      // 1st repayment
      fineractMockStore.repayLoan(3, out, "04 September 2026");
      // 2nd repayment
      try {
        fineractMockStore.repayLoan(3, out, "04 September 2026");
        return { passed: false, actual: "Second repayment succeeded on closed loan" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 403;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C3.06: Zero amount repayment (amount = 0)
  await runTest(
    "ADV-OVP-06",
    "Overpayment",
    "Zero repayment amount (amount = 0)",
    "Throws HTTP 400 error.msg.loan.transaction.amount.must.be.greater.than.zero",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(3, 0, "04 September 2026");
        return { passed: false, actual: "Zero repayment accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400 && String(err.message).includes("phải lớn hơn 0");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C3.07: Negative amount repayment (amount = -100,000)
  await runTest(
    "ADV-OVP-07",
    "Overpayment",
    "Negative repayment amount (amount = -100,000)",
    "Throws HTTP 400 error.msg.loan.transaction.amount.must.be.greater.than.zero",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.repayLoan(3, -100000, "04 September 2026");
        return { passed: false, actual: "Negative repayment accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // ==========================================================================
  // 4. DOUBLE-ENTRY INVARIANT & LEDGER ATTACKS
  // ==========================================================================
  console.log("\n\x1b[1m\x1b[36m>>> [CATEGORY 4] GENERAL LEDGER DOUBLE-ENTRY INVARIANT ATTACKS\x1b[0m");

  // C4.01: Classic Imbalanced Voucher (Dr 10M != Cr 9M)
  await runTest(
    "ADV-GL-01",
    "Double-Entry Invariant",
    "Manual voucher with Dr 10,000,000 and Cr 9,000,000 (diff = 1M)",
    "Throws HTTP 400 error.msg.gl.double.entry.imbalanced",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          referenceNumber: "IMBALANCED-01",
          debits: [{ glAccountId: 1, amount: 10000000 }],
          credits: [{ glAccountId: 2, amount: 9000000 }]
        });
        return { passed: false, actual: "Imbalanced voucher accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400 && String(err.message).includes("Nguyên tắc kế toán kép vi phạm");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.02: Sub-cent Delta at Exact Threshold 0.001
  await runTest(
    "ADV-GL-02",
    "Double-Entry Invariant",
    "Voucher with differential = 0.001 (threshold is strictly diff < 0.001)",
    "Throws HTTP 400 error.msg.gl.double.entry.imbalanced",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          referenceNumber: "THRESHOLD-0.001",
          debits: [{ glAccountId: 1, amount: 1000000.001 }],
          credits: [{ glAccountId: 2, amount: 1000000.000 }]
        });
        return { passed: false, actual: "Differential of 0.001 accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.03: Sub-cent Delta within Threshold 0.0005 (< 0.001)
  await runTest(
    "ADV-GL-03",
    "Double-Entry Invariant",
    "Voucher with differential = 0.0005 (within delta < 0.001 tolerance)",
    "Voucher accepted and posted to journal entries",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const tx = fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TOLERANCE-0.0005",
        debits: [{ glAccountId: 1, amount: 1000000.0005 }],
        credits: [{ glAccountId: 2, amount: 1000000.0000 }]
      });
      const ok = tx.isBalanced && tx.lines.length === 2;
      return { passed: ok, actual: `Posted transaction ${tx.transactionId}, isBalanced: ${tx.isBalanced}` };
    }
  );

  // C4.04: Missing Debits Array (`debits: []`)
  await runTest(
    "ADV-GL-04",
    "Double-Entry Invariant",
    "Voucher with empty debits array (`debits: []`)",
    "Throws HTTP 400 validation.msg.journalentry.debits.empty",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          debits: [],
          credits: [{ glAccountId: 2, amount: 500000 }]
        });
        return { passed: false, actual: "Voucher with empty debits accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400 && String(err.message).includes("Bắt buộc phải có ít nhất 1 dòng ghi Nợ");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.05: Missing Credits Array (`credits: []`)
  await runTest(
    "ADV-GL-05",
    "Double-Entry Invariant",
    "Voucher with empty credits array (`credits: []`)",
    "Throws HTTP 400 validation.msg.journalentry.credits.empty",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          debits: [{ glAccountId: 1, amount: 500000 }],
          credits: []
        });
        return { passed: false, actual: "Voucher with empty credits accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400 && String(err.message).includes("Bắt buộc phải có ít nhất 1 dòng ghi Có");
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.06: Zero Amounts on Both Sides (Dr 0 == Cr 0)
  await runTest(
    "ADV-GL-06",
    "Double-Entry Invariant",
    "Voucher with Dr 0 and Cr 0 (non-transactional dummy entry)",
    "Throws HTTP 400 error because totalDebit must be > 0",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          debits: [{ glAccountId: 1, amount: 0 }],
          credits: [{ glAccountId: 2, amount: 0 }]
        });
        return { passed: false, actual: "Zero-sum voucher accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.07: Pure Negative Amounts on Both Sides (Dr -500k == Cr -500k)
  await runTest(
    "ADV-GL-07",
    "Double-Entry Invariant",
    "Voucher with Dr -500k and Cr -500k",
    "Throws HTTP 400 error because totalDebit must be > 0",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      try {
        fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          debits: [{ glAccountId: 1, amount: -500000 }],
          credits: [{ glAccountId: 2, amount: -500000 }]
        });
        return { passed: false, actual: "Negative voucher accepted" };
      } catch (err: any) {
        const ok = err.httpStatusCode === 400;
        return { passed: ok, actual: `Blocked with status ${err.httpStatusCode}: ${err.message}` };
      }
    }
  );

  // C4.08: Masked Negative Line Item (Dr: [+600k, -100k] == Cr: [+500k])
  await runTest(
    "ADV-GL-08",
    "Double-Entry Invariant",
    "Masked negative line item where totalDebit > 0 (PROJECT.md specifies: 'All amounts > 0')",
    "Rejected by system or detected as invariant violation ('All amounts > 0')",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      try {
        const tx = fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          referenceNumber: "MASKED-NEGATIVE",
          debits: [
            { glAccountId: 1, amount: 600000 },
            { glAccountId: 4, amount: -100000 }
          ],
          credits: [{ glAccountId: 2, amount: 500000 }]
        });
        // In PROJECT.md: "All amounts > 0". Check if negative line got through
        const hasNegativeLine = tx.lines.some(l => l.amount <= 0);
        if (hasNegativeLine) {
          return {
            passed: false,
            actual: "VULNERABILITY DETECTED: Masked negative amount line was posted to the General Ledger!"
          };
        }
        return { passed: true, actual: "Handled without posting negative line" };
      } catch (err: any) {
        return { passed: true, actual: `Correctly rejected negative line: ${err.message}` };
      }
    }
  );

  // C4.09: Zero Amount Line Mixed with Positive Line (Dr: [+500k, 0] == Cr: [+500k])
  await runTest(
    "ADV-GL-09",
    "Double-Entry Invariant",
    "Zero amount line item mixed with positive lines (PROJECT.md: 'All amounts > 0')",
    "Rejected or sanitized to exclude non-positive line items",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      try {
        const tx = fineractMockStore.createJournalEntry({
          officeId: 1,
          transactionDate: "04 September 2026",
          referenceNumber: "ZERO-LINE",
          debits: [
            { glAccountId: 1, amount: 500000 },
            { glAccountId: 4, amount: 0 }
          ],
          credits: [{ glAccountId: 2, amount: 500000 }]
        });
        const hasZeroLine = tx.lines.some(l => l.amount === 0);
        if (hasZeroLine) {
          return {
            passed: false,
            actual: "DEFECT DETECTED: Zero amount line was allowed and posted to General Ledger lines"
          };
        }
        return { passed: true, actual: "Zero line prevented or sanitized" };
      } catch (err: any) {
        return { passed: true, actual: `Rejected zero-line entry: ${err.message}` };
      }
    }
  );

  // C4.10: 50-Line Multi-Split High-Precision Floating Summation
  await runTest(
    "ADV-GL-10",
    "Double-Entry Invariant",
    "50-line multi-split balanced voucher testing floating-point accumulator precision",
    "Successfully posts with totalDebit == totalCredit and isBalanced == true",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const debits = [];
      let total = 0;
      for (let i = 0; i < 25; i++) {
        const amt = 40000.12;
        debits.push({ glAccountId: 1, amount: amt });
        total += amt;
      }
      const credits = [];
      for (let i = 0; i < 25; i++) {
        const amt = 40000.12;
        credits.push({ glAccountId: 2, amount: amt });
      }

      const tx = fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "MULTI-SPLIT-50",
        debits,
        credits
      });

      const ok = tx.isBalanced && Math.abs(tx.totalDebit - tx.totalCredit) < 0.001;
      return {
        passed: ok,
        actual: `Posted 50 lines. totalDebit: ${tx.totalDebit}, totalCredit: ${tx.totalCredit}, isBalanced: ${tx.isBalanced}`
      };
    }
  );

  // ==========================================================================
  // 5. GL ACCOUNT RESOLVER & KAFKA EDA ATTACKS
  // ==========================================================================
  console.log("\n\x1b[1m\x1b[36m>>> [CATEGORY 5] GL ACCOUNT RESOLVER & KAFKA EDA ATTACKS\x1b[0m");

  // C5.01: Untrimmed COD Payment Method String ("  COD  ")
  await runTest(
    "ADV-RES-01",
    "GL Account Resolver",
    "Payment method with surrounding spaces: '  COD  '",
    "Correctly trims and resolves to Cash account (ID: 1)",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("  COD  ", false);
      const isCash = resolved.debitAccountId === 1;
      return {
        passed: isCash,
        actual: `Resolved debitAccountId: ${resolved.debitAccountId} (Expected: 1 for Cash)`
      };
    }
  );

  // C5.02: Mixed-case Untrimmed COD ("  cOd  ")
  await runTest(
    "ADV-RES-02",
    "GL Account Resolver",
    "Mixed-case untrimmed COD: '  cOd  '",
    "Correctly trims, case-normalizes, and resolves to Cash account (ID: 1)",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("  cOd  ", false);
      const isCash = resolved.debitAccountId === 1;
      return {
        passed: isCash,
        actual: `Resolved debitAccountId: ${resolved.debitAccountId} (Expected: 1 for Cash)`
      };
    }
  );

  // C5.03: Unknown Payment Method Safe Fallback ("CRYPTO_TOKEN")
  await runTest(
    "ADV-RES-03",
    "GL Account Resolver",
    "Unrecognized payment method string ('CRYPTO_TOKEN')",
    "Safely falls back to Bank account (ID: 4) without crashing",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("CRYPTO_TOKEN", false);
      const isBank = resolved.debitAccountId === 4;
      return {
        passed: isBank,
        actual: `Resolved debitAccountId: ${resolved.debitAccountId} (Expected: 4 for Bank)`
      };
    }
  );

  // C5.04: Empty string payment method ("")
  await runTest(
    "ADV-RES-04",
    "GL Account Resolver",
    "Empty string payment method ('')",
    "Safely falls back to Bank account (ID: 4) with default description",
    "LOW",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("", false);
      const isBank = resolved.debitAccountId === 4;
      return {
        passed: isBank,
        actual: `Resolved debitAccountId: ${resolved.debitAccountId}, description: ${resolved.description}`
      };
    }
  );

  // C5.05: Refund for COD Order
  await runTest(
    "ADV-RES-05",
    "GL Account Resolver",
    "Refund event resolution for COD payment method",
    "Debit: Sales Returns (ID: 3), Credit: Cash (ID: 1)",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("COD", true);
      const ok = resolved.debitAccountId === 3 && resolved.creditAccountId === 1;
      return {
        passed: ok,
        actual: `Debit: ${resolved.debitAccountId}, Credit: ${resolved.creditAccountId}`
      };
    }
  );

  // C5.06: Refund for Bank Transfer Order
  await runTest(
    "ADV-RES-06",
    "GL Account Resolver",
    "Refund event resolution for BANK_TRANSFER payment method",
    "Debit: Sales Returns (ID: 3), Credit: Bank (ID: 4)",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const resolved = fineractMockStore.resolveGlAccountsForOrder("BANK_TRANSFER", true);
      const ok = resolved.debitAccountId === 3 && resolved.creditAccountId === 4;
      return {
        passed: ok,
        actual: `Debit: ${resolved.debitAccountId}, Credit: ${resolved.creditAccountId}`
      };
    }
  );

  // C5.07: Kafka Event with Negative Amount
  await runTest(
    "ADV-EDA-01",
    "Kafka EDA Simulator",
    "Order event with negative totalAmount (-500,000)",
    "Safely ignored without creating any journal entry or mutating balances",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      const initialEntryCount = fineractMockStore.getJournalEntries().length;
      const res = fineractMockStore.processKafkaOrderEvent({
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "ORD-NEG-01",
        newStatus: "PROCESSING",
        totalAmount: -500000,
        paymentMethod: "COD"
      });

      const entryCountAfter = fineractMockStore.getJournalEntries().length;
      const ok = res.journalEntry === undefined && entryCountAfter === initialEntryCount;
      return {
        passed: ok,
        actual: `journalEntry defined: ${res.journalEntry !== undefined}, note: ${res.event.note}`
      };
    }
  );

  // C5.08: Kafka Event with Non-Financial Status ("COMPLETED", "DELIVERED")
  await runTest(
    "ADV-EDA-02",
    "Kafka EDA Simulator",
    "Order event with non-financial terminal status (COMPLETED)",
    "Safely ignored without posting journal entry",
    "MEDIUM",
    () => {
      fineractMockStore.resetStore();
      const initialEntryCount = fineractMockStore.getJournalEntries().length;
      const res = fineractMockStore.processKafkaOrderEvent({
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "ORD-COMPLETED-01",
        newStatus: "COMPLETED",
        totalAmount: 1500000,
        paymentMethod: "VNPAY"
      });

      const entryCountAfter = fineractMockStore.getJournalEntries().length;
      const ok = res.journalEntry === undefined && entryCountAfter === initialEntryCount;
      return {
        passed: ok,
        actual: `journalEntry defined: ${res.journalEntry !== undefined}, note: ${res.event.note}`
      };
    }
  );

  // C5.09: Alternating Sale & Refund Double-Entry Balance Conservation
  await runTest(
    "ADV-EDA-03",
    "Kafka EDA Simulator",
    "Stress test: 20 alternating Sale and Refund events conserve General Ledger balance invariant",
    "All generated journal entries strictly maintain sum(Debit) == sum(Credit) and non-negative net cash",
    "HIGH",
    () => {
      fineractMockStore.resetStore();
      const baseMetrics = fineractMockStore.getSystemMetrics();

      for (let i = 0; i < 10; i++) {
        // Sale
        fineractMockStore.processKafkaOrderEvent({
          eventType: "ORDER_STATUS_CHANGED",
          orderNumber: `ORD-CONSERV-SALE-${i}`,
          newStatus: "PROCESSING",
          totalAmount: 1000000,
          paymentMethod: "BANK_TRANSFER"
        });
        // Refund
        fineractMockStore.processKafkaOrderEvent({
          eventType: "ORDER_STATUS_CHANGED",
          orderNumber: `ORD-CONSERV-REFUND-${i}`,
          newStatus: "REFUNDED",
          totalAmount: 1000000,
          paymentMethod: "BANK_TRANSFER"
        });
      }

      const postMetrics = fineractMockStore.getSystemMetrics();
      // Bank balance should net to baseMetrics.bankBalance
      const netBankDiff = Math.abs(postMetrics.bankBalance - baseMetrics.bankBalance);
      const ok = netBankDiff < 0.001;
      return {
        passed: ok,
        actual: `Initial bank: ${baseMetrics.bankBalance}, Post 10 Sale+Refund cycles: ${postMetrics.bankBalance} (diff: ${netBankDiff})`
      };
    }
  );

  // C5.10: NaN Event Total Amount Injection Attack
  await runTest(
    "ADV-EDA-04",
    "Kafka EDA Simulator",
    "Order event with NaN totalAmount injection",
    "Safely ignored or rejected without generating corrupted NaN ledger voucher",
    "CRITICAL",
    () => {
      fineractMockStore.resetStore();
      const initialEntryCount = fineractMockStore.getJournalEntries().length;
      try {
        const res = fineractMockStore.processKafkaOrderEvent({
          eventType: "ORDER_STATUS_CHANGED",
          orderNumber: "ORD-NAN-01",
          newStatus: "PROCESSING",
          totalAmount: NaN,
          paymentMethod: "COD"
        });

        if (res.journalEntry) {
          return { passed: false, actual: "VULNERABILITY DETECTED: NaN amount generated a journal voucher!" };
        }
        return { passed: true, actual: `Ignored with note: ${res.event.note}` };
      } catch (err: any) {
        return { passed: true, actual: `Safely threw error: ${err.message}` };
      }
    }
  );

  // ==========================================================================
  // FINAL SUMMARY REPORT
  // ==========================================================================
  const total = reportItems.length;
  const passed = reportItems.filter(r => r.passed).length;
  const failed = reportItems.filter(r => !r.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log("\n\x1b[1m\x1b[37m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[37m                          ADVERSARIAL STRESS TEST SUITE SUMMARY                         \x1b[0m");
  console.log("\x1b[1m\x1b[37m========================================================================================\x1b[0m");
  console.log(`\x1b[1mTotal Scenarios Executed:\x1b[0m ${total}`);
  console.log(`\x1b[1mScenarios Passed:\x1b[0m         \x1b[32m${passed}\x1b[0m`);
  console.log(`\x1b[1mScenarios Failed (Bugs):\x1b[0m  ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`\x1b[1mPass Rate:\x1b[0m                ${failed === 0 ? `\x1b[32m${passRate}%\x1b[0m` : `\x1b[31m${passRate}%\x1b[0m`}`);

  return { total, passed, failed, passRate, reportItems };
}

runAllStressTests();
