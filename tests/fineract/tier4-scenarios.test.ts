/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * Validates complex end-to-end multi-step banking and financial accounting workflows.
 */

import { test, expect, setTestTier } from "./framework";
import {
  fineractMockStore,
  formatDateToFineract,
} from "../../src/lib/fineractMockStore";
import { extractFineractError, formatFineractErrorToast } from "../../src/lib/fineractErrorExtractor";

export async function runTier4Tests() {
  console.log("\n\x1b[1m\x1b[32m======================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m>>> TIER 4: REAL-WORLD APPLICATION SCENARIOS (END-TO-END JOURNEYS)\x1b[0m");
  console.log("\x1b[1m\x1b[32m======================================================================\x1b[0m\n");

  setTestTier(4, "Tier 4: Real-World Application Scenarios");

  // ==========================================================================
  // SCENARIO-01: End-to-End Retail Borrower Journey
  // ==========================================================================
  await test("SCENARIO-01: End-to-End Retail Borrower Journey (Register -> Apply -> Approve -> Disburse -> Pay Period 1)", () => {
    fineractMockStore.resetStore();

    // 1. Register Client
    const client = fineractMockStore.createClient({
      fullName: "Nguyễn Thị Mai",
      emailAddress: "mai.nt@consumer.vn",
      mobileNo: "0988776655",
      officeId: 1,
      legalFormId: 1,
      externalId: "user-mai-101",
    });
    expect(client.id).toBeGreaterThan(0);
    expect(client.displayName).toBe("Nguyễn Thị Mai");

    // 2. Select Product & Submit Loan Application (10,000,000 VND, 6 months)
    const loan = fineractMockStore.createLoan({
      clientId: client.id,
      productId: 2, // Tiêu dùng cá nhân
      principal: 10000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.5,
      amortizationType: 1,
      interestType: 0,
      submittedOnDate: "01 September 2026",
      expectedDisbursementDate: "05 September 2026",
    });
    expect(loan.status.id).toBe(100);
    expect(loan.status.pendingApproval).toBe(true);

    // 3. Credit Committee Approves Loan
    const approved = fineractMockStore.approveLoan(loan.id, "03 September 2026", "Phê duyệt tín dụng hạn mức 10M");
    expect(approved.status.id).toBe(200);
    expect(approved.status.waitingForDisbursal).toBe(true);

    // 4. Treasury Disburses Loan Funds
    const disbursed = fineractMockStore.disburseLoan(loan.id, "04 September 2026", "Giải ngân tiền mặt");
    expect(disbursed.status.id).toBe(300);
    expect(disbursed.status.active).toBe(true);
    expect(disbursed.summary.principalDisbursed).toBe(10000000);

    // 5. Inspect Repayment Schedule
    const schedule = disbursed.repaymentSchedule!;
    expect(schedule.periods.length).toBe(7); // Period 0 + 6 installments
    const period1 = schedule.periods.find((p) => p.period === 1)!;
    expect(period1.complete).toBe(false);
    const installmentDue = period1.totalDueForPeriod;

    // 6. Borrower Pays Installment 1
    const repaymentRes = fineractMockStore.repayLoan(loan.id, installmentDue, "04 September 2026");
    expect(repaymentRes.loan.status.id).toBe(300); // Still active (5 periods remain)
    const updatedPeriod1 = repaymentRes.loan.repaymentSchedule!.periods.find((p) => p.period === 1)!;
    expect(updatedPeriod1.complete).toBe(true);
    expect(updatedPeriod1.totalOutstandingForPeriod).toBeCloseTo(0, 0.01);
    expect(repaymentRes.loan.summary.totalOutstanding).toBeLessThan(disbursed.summary.totalOutstanding);
  });

  // ==========================================================================
  // SCENARIO-02: Omnichannel Order-to-Cash & Automated Ledger Posting
  // ==========================================================================
  await test("SCENARIO-02: Omnichannel Order-to-Cash & Automated Ledger Posting (Sale -> Ledger -> Refund -> Reversal)", () => {
    fineractMockStore.resetStore();

    const orderNo = "ORD-20260904-9021";
    const orderTotal = 3500000;

    // 1. Checkout completed -> Emit PROCESSING event via VNPAY
    const saleResult = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: orderNo,
      newStatus: "PROCESSING",
      totalAmount: orderTotal,
      paymentMethod: "VNPAY",
    });

    expect(saleResult.event.processed).toBe(true);
    expect(saleResult.journalEntry).toBeDefined();
    expect(saleResult.journalEntry!.referenceNumber).toBe(`SALE-${orderNo}`);
    expect(saleResult.journalEntry!.isBalanced).toBe(true);

    // Verify Debited to Bank (4) and Credited to Sales Revenue (2)
    const saleDebit = saleResult.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const saleCredit = saleResult.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(saleDebit.glAccountId).toBe(4);
    expect(saleCredit.glAccountId).toBe(2);

    // 2. Customer Returns Items -> Emit REFUNDED event
    const refundResult = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: orderNo,
      newStatus: "REFUNDED",
      totalAmount: orderTotal,
      paymentMethod: "VNPAY",
    });

    expect(refundResult.event.processed).toBe(true);
    expect(refundResult.journalEntry).toBeDefined();
    expect(refundResult.journalEntry!.referenceNumber).toBe(`REFUND-${orderNo}`);
    expect(refundResult.journalEntry!.isBalanced).toBe(true);

    // Verify Debited to Sales Returns (3) and Credited to Bank (4)
    const refundDebit = refundResult.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const refundCredit = refundResult.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(refundDebit.glAccountId).toBe(3);
    expect(refundCredit.glAccountId).toBe(4);

    // 3. Confirm Complete Audit Trail in GL entries
    const allEntries = fineractMockStore.getJournalEntries();
    const relatedEntries = allEntries.filter(
      (e) => e.referenceNumber === `SALE-${orderNo}` || e.referenceNumber === `REFUND-${orderNo}`
    );
    expect(relatedEntries.length).toBe(4); // 2 lines for sale + 2 lines for refund
  });

  // ==========================================================================
  // SCENARIO-03: Early Loan Payoff & Obligations Met Settlement
  // ==========================================================================
  await test("SCENARIO-03: Early Loan Payoff & Obligations Met Settlement (Lump sum payment -> Zero balance -> Closure)", () => {
    fineractMockStore.seedTestFixtures();

    // 1. Create and disburse a 5,000,000 VND loan (Product 1: ERP-LN01 min 1M, max 50M)
    const loan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: 5000000,
      loanTermFrequency: 3,
      loanTermFrequencyType: 2,
      numberOfRepayments: 3,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.0,
      amortizationType: 1,
      interestType: 0,
      submittedOnDate: "01 September 2026",
      expectedDisbursementDate: "02 September 2026",
    });
    fineractMockStore.approveLoan(loan.id, "02 September 2026");
    const activeLoan = fineractMockStore.disburseLoan(loan.id, "03 September 2026");
    expect(activeLoan.status.id).toBe(300);

    const fullPayoffAmount = activeLoan.summary.totalOutstanding;
    expect(fullPayoffAmount).toBeGreaterThan(5000000);

    // 2. Early full payoff in single transaction
    const settlement = fineractMockStore.repayLoan(loan.id, fullPayoffAmount, "04 September 2026");
    expect(settlement.loan.status.id).toBe(600);
    expect(settlement.loan.status.closedObligationsMet).toBe(true);
    expect(settlement.loan.summary.totalOutstanding).toBeCloseTo(0, 0.001);

    // 3. Subsequent repayment attempt on closed loan is rejected
    let threw = false;
    try {
      fineractMockStore.repayLoan(loan.id, 100000, "05 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể thanh toán trả góp");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // SCENARIO-04: Operator Error Diagnosis & Remediation Flow
  // ==========================================================================
  await test("SCENARIO-04: Operator Error Diagnosis & Remediation Flow (Future date reject -> Diagnostic extract -> Remediation)", () => {
    fineractMockStore.seedTestFixtures();

    // Loan 1 is pending approval
    const loan1 = fineractMockStore.getLoan(1)!;
    expect(loan1.status.id).toBe(100);

    // 1. Operator inputs future date by mistake (year 2030)
    let caughtException: any = null;
    try {
      fineractMockStore.approveLoan(1, "15 October 2030", "Phê duyệt nhầm ngày");
    } catch (err: any) {
      caughtException = err;
    }

    expect(caughtException).toBeDefined();

    // 2. Diagnostic parser inspects error
    const parsed = extractFineractError(caughtException);
    expect(parsed.isFineractError).toBe(true);
    expect(parsed.userMessageGlobalisationCode).toBe("error.msg.loan.approval.cannot.be.in.the.future");
    expect(parsed.parameterName).toBe("approvedOnDate");

    const toast = formatFineractErrorToast(caughtException);
    expect(toast.title).toBe("Từ Chối Nghiệp Vụ (HTTP 403)");
    expect(toast.message).toContain("Ngày phê duyệt hồ sơ vay không thể ở tương lai");

    // 3. Operator remediates by submitting valid date (today's date)
    const validDate = formatDateToFineract(new Date());
    const remediatedLoan = fineractMockStore.approveLoan(1, validDate, "Phê duyệt lại đúng ngày");
    expect(remediatedLoan.status.id).toBe(200);
    expect(remediatedLoan.status.waitingForDisbursal).toBe(true);
  });
}
