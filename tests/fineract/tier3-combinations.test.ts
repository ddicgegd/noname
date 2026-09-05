/**
 * Tier 3: Cross-Feature Combinations & Pairwise Interactions Test Suite
 * Validates complex interactions across multiple subsystems and state mutations.
 */

import { test, expect, setTestTier } from "./framework";
import {
  fineractMockStore,
  formatDateToFineract,
} from "../../src/lib/fineractMockStore";
import { extractFineractError, formatFineractErrorToast } from "../../src/lib/fineractErrorExtractor";
import { fineractService } from "../../src/services/fineractService";

export async function runTier3Tests() {
  console.log("\n\x1b[1m\x1b[36m======================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m>>> TIER 3: CROSS-FEATURE COMBINATIONS & PAIRWISE INTERACTIONS\x1b[0m");
  console.log("\x1b[1m\x1b[36m======================================================================\x1b[0m\n");

  setTestTier(3, "Tier 3: Pairwise & Cross-Feature Integrations");

  // ==========================================================================
  // TF3-01: Client Registration -> Loan Origination -> FSM Approval
  // ==========================================================================
  await test("TF3-01: Client Registration -> Loan Origination -> State Machine Approval", () => {
    fineractMockStore.resetStore();

    // Step 1: Register a new client with Vietnamese name
    const client = fineractMockStore.createClient({
      fullName: "Nguyễn Văn Hùng",
      emailAddress: "hung.nv@example.com",
      mobileNo: "0912998877",
      officeId: 1,
      legalFormId: 1,
    });
    expect(client.id).toBeDefined();
    expect(client.displayName).toBe("Nguyễn Văn Hùng");

    // Step 2: Originate a loan under this client's ID
    const loan = fineractMockStore.createLoan({
      clientId: client.id,
      productId: 1, // SME Loan
      principal: 25000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.0,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "10 September 2026",
      submittedOnDate: "04 September 2026",
    });
    expect(loan.clientId).toBe(client.id);
    expect(loan.clientName).toBe("Nguyễn Văn Hùng");
    expect(loan.status.id).toBe(100);

    // Step 3: Approve the loan
    const approvedLoan = fineractMockStore.approveLoan(loan.id, "04 September 2026", "Phê duyệt hạn mức 25M");
    expect(approvedLoan.status.id).toBe(200);
    expect(approvedLoan.approvedPrincipal).toBe(25000000);
  });

  // ==========================================================================
  // TF3-02: Loan Disbursement -> Active State -> Repayments -> Closure
  // ==========================================================================
  await test("TF3-02: Loan Disbursement -> Active State -> Installment Repayment -> Closure", () => {
    fineractMockStore.seedTestFixtures();

    // Step 1: Disburse seed loan 2 (which is 200 APPROVED)
    const disbursed = fineractMockStore.disburseLoan(2, "04 September 2026", "Giải ngân khoản vay 2");
    expect(disbursed.status.id).toBe(300);
    expect(disbursed.status.active).toBe(true);
    const initialOutstanding = disbursed.summary.totalOutstanding;

    // Step 2: Pay half of outstanding
    const partialAmount = Math.round(initialOutstanding / 2);
    const partialResult = fineractMockStore.repayLoan(2, partialAmount, "04 September 2026");
    expect(partialResult.loan.status.id).toBe(300);
    expect(partialResult.loan.summary.totalOutstanding).toBeCloseTo(initialOutstanding - partialAmount, 1);

    // Step 3: Settle remaining balance completely
    const remainingBalance = partialResult.loan.summary.totalOutstanding;
    const finalResult = fineractMockStore.repayLoan(2, remainingBalance, "04 September 2026");
    expect(finalResult.loan.status.id).toBe(600);
    expect(finalResult.loan.status.closedObligationsMet).toBe(true);
    expect(finalResult.loan.summary.totalOutstanding).toBeCloseTo(0, 0.01);
  });

  // ==========================================================================
  // TF3-03: Kafka EDA Sale Event -> General Ledger Balance Mutation
  // ==========================================================================
  await test("TF3-03: Kafka EDA Sale Event -> General Ledger Balance Mutation", () => {
    fineractMockStore.resetStore();

    const metricsBefore = fineractMockStore.getSystemMetrics();
    const bankBefore = metricsBefore.bankBalance;

    // Emit Bank Transfer order processing event
    const saleAmount = 3500000;
    const edaResult = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-PAIRWISE-01",
      newStatus: "PROCESSING",
      totalAmount: saleAmount,
      paymentMethod: "BANK_TRANSFER",
    });

    expect(edaResult.journalEntry).toBeDefined();
    expect(edaResult.journalEntry!.isBalanced).toBe(true);

    const metricsAfter = fineractMockStore.getSystemMetrics();
    expect(metricsAfter.bankBalance).toBeCloseTo(bankBefore + saleAmount, 0.01);
  });

  // ==========================================================================
  // TF3-04: Kafka EDA Sale -> Refund Event -> Net Cash Ledger Reconciliation
  // ==========================================================================
  await test("TF3-04: Kafka EDA Sale -> Subsequent Refund Event -> Net Cash Ledger Reconciliation", () => {
    fineractMockStore.resetStore();

    const metrics0 = fineractMockStore.getSystemMetrics();
    const cash0 = metrics0.cashBalance;

    const orderAmount = 1800000;

    // 1. Order Sale via COD
    fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-RECON-01",
      newStatus: "PROCESSING",
      totalAmount: orderAmount,
      paymentMethod: "COD",
    });

    const metrics1 = fineractMockStore.getSystemMetrics();
    expect(metrics1.cashBalance).toBeCloseTo(cash0 + orderAmount, 0.01);

    // 2. Order Refund via COD
    fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-RECON-01",
      newStatus: "REFUNDED",
      totalAmount: orderAmount,
      paymentMethod: "COD",
    });

    const metrics2 = fineractMockStore.getSystemMetrics();
    // Cash balance should return to initial cash0!
    expect(metrics2.cashBalance).toBeCloseTo(cash0, 0.01);
  });

  // ==========================================================================
  // TF3-05: Loan FSM Invalid Action -> Fineract Error Extraction -> Toast Generation
  // ==========================================================================
  await test("TF3-05: Loan FSM Invalid Action -> Fineract Error Extraction -> Toast Message Generation", () => {
    fineractMockStore.seedTestFixtures();

    try {
      // Disbursing loan 1 (which is 100 PENDING) must fail
      fineractMockStore.disburseLoan(1, "04 September 2026");
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      // Error extractor handles the caught exception
      const parsed = extractFineractError(err);
      expect(parsed.isFineractError).toBe(true);
      expect(parsed.userMessageGlobalisationCode).toBe("error.msg.loan.disbursement.not.allowed.in.current.state");

      // Toast formatting extracts friendly UI message
      const toast = formatFineractErrorToast(err);
      expect(toast.title).toBe("Từ Chối Nghiệp Vụ (HTTP 403)");
      expect(toast.message).toContain("Chỉ có thể giải ngân khi khoản vay đã được Phê duyệt");
    }
  });

  // ==========================================================================
  // TF3-06: Customer Role-Based Security Filter vs Loan Accounts Listing
  // ==========================================================================
  await test("TF3-06: Customer Role-Based Security Filter vs Loan Accounts Listing", () => {
    fineractMockStore.seedTestFixtures();

    // Admin sees all loans
    const allLoans = fineractMockStore.getLoans();
    expect(allLoans.length).toBeGreaterThanOrEqual(4);

    // Filter by client 1 (only client 1's loans)
    const client1Loans = fineractMockStore.getLoans(1);
    expect(client1Loans.length).toBeGreaterThanOrEqual(1);
    for (const l of client1Loans) {
      expect(l.clientId).toBe(1);
    }

    // Filter by client 2
    const client2Loans = fineractMockStore.getLoans(2);
    for (const l of client2Loans) {
      expect(l.clientId).toBe(2);
    }
  });

  // ==========================================================================
  // TF3-07: Manual Multi-Line Journal Voucher -> General Ledger Audit Trail
  // ==========================================================================
  await test("TF3-07: Manual Multi-Line Journal Voucher -> General Ledger Audit Trail", () => {
    fineractMockStore.resetStore();

    const voucherRef = "VOUCHER-AUDIT-99";
    const tx = fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "04 September 2026",
      referenceNumber: voucherRef,
      comments: "Bút toán phân bổ chi phí hoạt động chi nhánh",
      debits: [
        { glAccountId: 1, amount: 600000 },
        { glAccountId: 4, amount: 400000 },
      ],
      credits: [{ glAccountId: 2, amount: 1000000 }],
    });

    expect(tx.isBalanced).toBe(true);

    // Verify lines appear in the general journal entries listing
    const allEntries = fineractMockStore.getJournalEntries();
    const matched = allEntries.filter((e) => e.referenceNumber === voucherRef);
    expect(matched.length).toBe(3);
    const sumDebit = matched
      .filter((e) => e.entryType.value === "DEBIT")
      .reduce((acc, e) => acc + e.amount, 0);
    const sumCredit = matched
      .filter((e) => e.entryType.value === "CREDIT")
      .reduce((acc, e) => acc + e.amount, 0);

    expect(sumDebit).toBe(1000000);
    expect(sumCredit).toBe(1000000);
  });

  // ==========================================================================
  // TF3-08: High-Fidelity Mock Mode vs Live Gateway Configuration Isolation
  // ==========================================================================
  await test("TF3-08: High-Fidelity Mock Mode vs Live Gateway Configuration Isolation", () => {
    fineractService.setMode("mock");
    expect(fineractService.getMode()).toBe("mock");

    // Perform operation in mock mode
    fineractMockStore.resetStore();
    const initialClients = fineractMockStore.getClients("admin").length;

    // Toggle to live mode
    fineractService.setMode("live");
    expect(fineractService.getMode()).toBe("live");

    // Toggle back to mock mode
    fineractService.setMode("mock");
    expect(fineractService.getMode()).toBe("mock");

    // Mock store data remains intact
    const afterClients = fineractMockStore.getClients("admin").length;
    expect(afterClients).toBe(initialClients);
  });
}
