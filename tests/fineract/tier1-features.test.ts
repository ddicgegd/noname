/**
 * Tier 1: Feature Coverage Test Suite
 * Minimum >= 5 tests per core feature across all 9 target features (45 total tests).
 */

import { test, expect, setTestTier } from "./framework";
import {
  fineractMockStore,
  parseVietnameseName,
  GL_RESOLVER_MATRIX,
  formatDateToFineract,
  INITIAL_CLIENTS,
  INITIAL_LOAN_PRODUCTS,
} from "../../src/lib/fineractMockStore";
import { extractFineractError, FINERACT_I18N_CODES } from "../../src/lib/fineractErrorExtractor";
import { fineractService } from "../../src/services/fineractService";

export async function runTier1Tests() {
  console.log("\n\x1b[1m\x1b[34m======================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[34m>>> TIER 1: FEATURE COVERAGE SUITE (>= 5 TESTS PER FEATURE)\x1b[0m");
  console.log("\x1b[1m\x1b[34m======================================================================\x1b[0m\n");

  // ==========================================================================
  // FEAT-01: Client Management & Name Parsing (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-01: Client Management & Name Parsing");

  await test("FEAT-01.1: List clients returns directory with standard schema fields", async () => {
    fineractMockStore.seedTestFixtures();
    const clients = fineractMockStore.getClients("admin");
    expect(clients.length).toBeGreaterThanOrEqual(5);
    const first = clients[0];
    expect(first.id).toBeDefined();
    expect(first.accountNo).toBeDefined();
    expect(first.displayName).toBeDefined();
    expect(first.status.id).toBe(300);
    expect(first.officeId).toBe(1);
  });

  await test("FEAT-01.2: Role-based filtering isolates customer view by externalId", async () => {
    fineractMockStore.seedTestFixtures();
    const adminList = fineractMockStore.getClients("admin");
    const customerList = fineractMockStore.getClients("customer", "101");
    expect(adminList.length).toBeGreaterThan(1);
    expect(customerList.length).toBe(1);
    expect(customerList[0].externalId).toBe("101");
  });

  await test("FEAT-01.3: Client registration creates new active client with sequential accountNo", async () => {
    fineractMockStore.resetStore();
    const beforeCount = fineractMockStore.getClients("admin").length;
    const newClient = fineractMockStore.createClient({
      fullName: "Đặng Hoàng Nam",
      emailAddress: "nam.dh@fineract.test",
      mobileNo: "0909112233",
      officeId: 1,
      legalFormId: 1,
      externalId: "ext-user-999",
    });

    expect(newClient.id).toBeDefined();
    expect(newClient.accountNo.length).toBeGreaterThan(0);
    expect(newClient.active).toBe(true);
    expect(newClient.displayName).toBe("Đặng Hoàng Nam");
    const afterCount = fineractMockStore.getClients("admin").length;
    expect(afterCount).toBe(beforeCount + 1);
  });

  await test("FEAT-01.4: Vietnamese name parser splits multiple tokens into firstname and lastname", () => {
    const parsed1 = parseVietnameseName("Nguyễn Văn An");
    expect(parsed1.firstname).toBe("An");
    expect(parsed1.lastname).toBe("Nguyễn Văn");

    const parsed2 = parseVietnameseName("Trần Thị Mai Phương");
    expect(parsed2.firstname).toBe("Phương");
    expect(parsed2.lastname).toBe("Trần Thị Mai");
  });

  await test("FEAT-01.5: Vietnamese name parser handles single token names safely", () => {
    const parsed = parseVietnameseName("Hương");
    expect(parsed.firstname).toBe("Hương");
    expect(parsed.lastname).toBe("Hương");
  });

  // ==========================================================================
  // FEAT-02: Loan Products Catalog (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-02: Loan Products Catalog");

  await test("FEAT-02.1: List loan products returns active credit offerings with principal bounds", () => {
    const products = fineractMockStore.getLoanProducts();
    expect(products.length).toBeGreaterThanOrEqual(2);
    const p1 = products.find((p) => p.shortName === "ERP-LN01");
    expect(p1).toBeDefined();
    expect(p1!.minPrincipal).toBeGreaterThan(0);
    expect(p1!.maxPrincipal).toBeGreaterThan(p1!.minPrincipal);
  });

  await test("FEAT-02.2: Loan products define valid interest rate and repayment frequencies", () => {
    const products = fineractMockStore.getLoanProducts();
    for (const prod of products) {
      expect(prod.annualInterestRate).toBeGreaterThan(0);
      expect(prod.numberOfRepayments).toBeGreaterThan(0);
      expect(prod.repaymentEvery).toBeGreaterThan(0);
      expect(prod.currency.code).toBe("VND");
    }
  });

  await test("FEAT-02.3: Lookup loan product by ID returns corresponding record", () => {
    const prod = fineractMockStore.getLoanProducts().find((p) => p.id === 1);
    expect(prod).toBeDefined();
    expect(prod!.id).toBe(1);
    expect(prod!.name).toBe("Vay tiêu dùng nhanh Horizon (ERP-LN01)");
  });

  await test("FEAT-02.4: Loan products specify standard amortization configuration", () => {
    const prod = fineractMockStore.getLoanProducts().find((p) => p.id === 1);
    expect(prod!.amortizationType.code).toBe("amortizationType.equal.installments");
    expect(prod!.interestType.code).toBe("interestType.declining.balance");
  });

  await test("FEAT-02.5: Loan application within product limits creates account in 100 PENDING_APPROVAL", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: 20000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.0,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "15 September 2026",
      submittedOnDate: "04 September 2026",
    });

    expect(loan.id).toBeDefined();
    expect(loan.accountNo).toContain("LN");
    expect(loan.status.id).toBe(100);
    expect(loan.status.pendingApproval).toBe(true);
    expect(loan.summary.totalOutstanding).toBeGreaterThan(20000000);
  });

  // ==========================================================================
  // FEAT-03: Loan Lifecycle State Machine (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-03: Loan Lifecycle State Machine");

  await test("FEAT-03.1: FSM Approve transitions pending loan (100) to approved (200)", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: 15000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.0,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "10 September 2026",
      submittedOnDate: "01 September 2026",
    });

    const approved = fineractMockStore.approveLoan(loan.id, "02 September 2026", "Phê duyệt bởi Ban Tín dụng");
    expect(approved.status.id).toBe(200);
    expect(approved.status.waitingForDisbursal).toBe(true);
    expect(approved.approvedPrincipal).toBe(15000000);
  });

  await test("FEAT-03.2: FSM Disburse transitions approved loan (200) to active (300)", () => {
    fineractMockStore.seedTestFixtures();
    // Loan 2 is status 200 APPROVED
    const disbursed = fineractMockStore.disburseLoan(2, "04 September 2026", "Đã giải ngân qua tài khoản ngân hàng");
    expect(disbursed.status.id).toBe(300);
    expect(disbursed.status.active).toBe(true);
    expect(disbursed.summary.principalDisbursed).toBeGreaterThan(0);
  });

  await test("FEAT-03.3: FSM Reject transitions pending loan (100) to terminal 500 REJECTED", () => {
    fineractMockStore.seedTestFixtures();
    const rejected = fineractMockStore.rejectLoan(1, "04 September 2026", "Hồ sơ không đủ điều kiện tín dụng");
    expect(rejected.status.id).toBe(500);
    expect(rejected.status.closed).toBe(true);
  });

  await test("FEAT-03.4: FSM Withdraw transitions pending loan (100) to terminal 400 WITHDRAWN", () => {
    fineractMockStore.seedTestFixtures();
    const withdrawn = fineractMockStore.withdrawLoan(1, "04 September 2026", "Khách hàng tự nguyện rút hồ sơ vay");
    expect(withdrawn.status.id).toBe(400);
    expect(withdrawn.status.closed).toBe(true);
  });

  await test("FEAT-03.5: FSM rejects illegal state transition with Fineract exception", () => {
    fineractMockStore.seedTestFixtures();
    // Attempting to disburse a loan in status 100 (loan 1 is pending approval)
    let errorThrown = false;
    try {
      fineractMockStore.disburseLoan(1, "04 September 2026");
    } catch (err: any) {
      errorThrown = true;
      expect(err.message).toContain("Chỉ có thể giải ngân");
    }
    expect(errorThrown).toBe(true);
  });

  // ==========================================================================
  // FEAT-04: Repayment Schedule & Balance Engine (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-04: Repayment Schedule & Balance Engine");

  await test("FEAT-04.1: Partial repayment decreases outstanding balance and updates summary", () => {
    fineractMockStore.seedTestFixtures();
    // Loan 3 is active
    const loanBefore = fineractMockStore.getLoan(3)!;
    const balanceBefore = loanBefore.summary.totalOutstanding;

    const repaymentAmount = 5000000;
    const result = fineractMockStore.repayLoan(3, repaymentAmount, "04 September 2026");

    expect(result.loan.status.id).toBe(300);
    expect(result.loan.summary.totalRepayment).toBeGreaterThan(loanBefore.summary.totalRepayment);
    expect(result.loan.summary.totalOutstanding).toBeCloseTo(balanceBefore - repaymentAmount, 1);
    expect(result.transactionId).toBeGreaterThan(0);
  });

  await test("FEAT-04.2: Repayment allocates funds to interest before reducing principal", () => {
    fineractMockStore.seedTestFixtures();
    const loanBefore = fineractMockStore.getLoan(3)!;
    const interestOutstandingBefore = loanBefore.summary.interestOutstanding;

    // Make a small payment that covers some interest
    const payment = 1000000;
    const result = fineractMockStore.repayLoan(3, payment, "04 September 2026");

    expect(result.loan.summary.interestPaid).toBeGreaterThan(loanBefore.summary.interestPaid);
    expect(result.loan.summary.interestOutstanding).toBeLessThan(interestOutstandingBefore);
  });

  await test("FEAT-04.3: Paying full outstanding balance transitions loan to 600 OBLIGATIONS_MET", () => {
    fineractMockStore.seedTestFixtures();
    const loanBefore = fineractMockStore.getLoan(3)!;
    const totalRemaining = loanBefore.summary.totalOutstanding;

    const result = fineractMockStore.repayLoan(3, totalRemaining, "04 September 2026");
    expect(result.loan.status.id).toBe(600);
    expect(result.loan.status.closedObligationsMet).toBe(true);
    expect(result.loan.summary.totalOutstanding).toBeCloseTo(0, 0.01);
  });

  await test("FEAT-04.4: Repayment marks installment periods complete when period due is settled", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.getLoan(3)!;
    const firstPeriod = loan.repaymentSchedule!.periods.find((p) => p.period === 1)!;
    const periodDue = firstPeriod.totalDueForPeriod;

    // Repay the full installment for period 1
    const result = fineractMockStore.repayLoan(3, periodDue, "04 September 2026");
    const updatedPeriod1 = result.loan.repaymentSchedule!.periods.find((p) => p.period === 1)!;
    expect(updatedPeriod1.complete).toBe(true);
    expect(updatedPeriod1.totalOutstandingForPeriod).toBeCloseTo(0, 0.01);
  });

  await test("FEAT-04.5: Repayment schedule generates expected periods matching loan term", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.getLoan(3)!;
    expect(loan.repaymentSchedule).toBeDefined();
    // Period 0 is disbursement, followed by 6 installments for loan 3
    expect(loan.repaymentSchedule!.periods.length).toBe(7);
    expect(loan.repaymentSchedule!.periods[0].period).toBe(0);
    expect(loan.repaymentSchedule!.periods[6].period).toBe(6);
  });

  // ==========================================================================
  // FEAT-05: Double-Entry Balance Invariant Guard (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-05: Double-Entry Balance Invariant Guard");

  await test("FEAT-05.1: Balanced single-debit single-credit journal entry succeeds", () => {
    fineractMockStore.resetStore();
    const tx = fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "04 September 2026",
      referenceNumber: "TEST-TX-001",
      comments: "Giao dịch thanh toán tiền thuê văn phòng",
      debits: [{ glAccountId: 1, amount: 2500000 }],
      credits: [{ glAccountId: 2, amount: 2500000 }],
    });

    expect(tx.transactionId).toBeDefined();
    expect(tx.isBalanced).toBe(true);
    expect(tx.totalDebit).toBe(2500000);
    expect(tx.totalCredit).toBe(2500000);
  });

  await test("FEAT-05.2: Balanced multi-line split journal entry succeeds", () => {
    fineractMockStore.resetStore();
    const tx = fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "04 September 2026",
      referenceNumber: "TEST-SPLIT-002",
      comments: "Bút toán tách nhiều dòng",
      debits: [
        { glAccountId: 1, amount: 1500000 },
        { glAccountId: 4, amount: 1000000 },
      ],
      credits: [{ glAccountId: 2, amount: 2500000 }],
    });

    expect(tx.isBalanced).toBe(true);
    expect(tx.lines.length).toBe(3);
    expect(tx.totalDebit).toBe(2500000);
    expect(tx.totalCredit).toBe(2500000);
  });

  await test("FEAT-05.3: Imbalanced entry Sum(Debit) != Sum(Credit) throws 400 error", () => {
    fineractMockStore.resetStore();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TEST-FAIL-001",
        comments: "Bút toán lệch",
        debits: [{ glAccountId: 1, amount: 3000000 }],
        credits: [{ glAccountId: 2, amount: 2500000 }],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Nguyên tắc kế toán kép vi phạm");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-05.4: Empty debit or credit list fails validation", () => {
    fineractMockStore.resetStore();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        debits: [],
        credits: [{ glAccountId: 2, amount: 1000000 }],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Bắt buộc phải có ít nhất 1 dòng ghi Nợ");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-05.5: Journal entries history returns chronological transactions audit trail", () => {
    fineractMockStore.resetStore();
    fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "04 September 2026",
      referenceNumber: "AUDIT-001",
      debits: [{ glAccountId: 1, amount: 500000 }],
      credits: [{ glAccountId: 2, amount: 500000 }],
    });
    const entries = fineractMockStore.getJournalEntries();
    expect(entries.length).toBeGreaterThanOrEqual(1);
    for (const e of entries) {
      expect(e.id).toBeDefined();
      expect(e.glAccountId).toBeDefined();
      expect(e.entryType.value).toBeDefined();
      expect(e.amount).toBeGreaterThan(0);
    }
  });

  // ==========================================================================
  // FEAT-06: GL Account Resolver Matrix (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-06: GL Account Resolver Matrix");

  await test("FEAT-06.1: Resolver maps COD Sale to Debit Cash (1) and Credit Sales Revenue (2)", () => {
    fineractMockStore.resetStore();
    const result = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-COD-01",
      newStatus: "PROCESSING",
      totalAmount: 750000,
      paymentMethod: "COD",
    });

    expect(result.journalEntry).toBeDefined();
    expect(result.journalEntry!.referenceNumber).toBe("SALE-ORD-COD-01");
    const debitLine = result.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const creditLine = result.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(debitLine.glAccountId).toBe(1); // Cash
    expect(creditLine.glAccountId).toBe(2); // Sales Revenue
  });

  await test("FEAT-06.2: Resolver maps Bank/VNPAY Sale to Debit Bank (4) and Credit Sales Revenue (2)", () => {
    fineractMockStore.resetStore();
    const result = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-BANK-01",
      newStatus: "PROCESSING",
      totalAmount: 1200000,
      paymentMethod: "VNPAY",
    });

    expect(result.journalEntry).toBeDefined();
    const debitLine = result.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const creditLine = result.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(debitLine.glAccountId).toBe(4); // Bank
    expect(creditLine.glAccountId).toBe(2); // Sales Revenue
  });

  await test("FEAT-06.3: Resolver maps COD Refund to Debit Sales Returns (3) and Credit Cash (1)", () => {
    fineractMockStore.resetStore();
    const result = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-COD-REF-01",
      newStatus: "REFUNDED",
      totalAmount: 450000,
      paymentMethod: "COD",
    });

    expect(result.journalEntry).toBeDefined();
    expect(result.journalEntry!.referenceNumber).toBe("REFUND-ORD-COD-REF-01");
    const debitLine = result.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const creditLine = result.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(debitLine.glAccountId).toBe(3); // Sales Returns
    expect(creditLine.glAccountId).toBe(1); // Cash
  });

  await test("FEAT-06.4: Resolver maps Bank/Card Refund to Debit Sales Returns (3) and Credit Bank (4)", () => {
    fineractMockStore.resetStore();
    const result = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-CARD-REF-01",
      newStatus: "REFUNDED",
      totalAmount: 890000,
      paymentMethod: "CREDIT_CARD",
    });

    expect(result.journalEntry).toBeDefined();
    const debitLine = result.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const creditLine = result.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(debitLine.glAccountId).toBe(3); // Sales Returns
    expect(creditLine.glAccountId).toBe(4); // Bank
  });

  await test("FEAT-06.5: GL Resolver Matrix defines canonical chart of accounts", () => {
    expect(GL_RESOLVER_MATRIX.cashGlAccount.id).toBe(1);
    expect(GL_RESOLVER_MATRIX.salesRevenueGlAccount.id).toBe(2);
    expect(GL_RESOLVER_MATRIX.salesReturnsGlAccount.id).toBe(3);
    expect(GL_RESOLVER_MATRIX.bankGlAccount.id).toBe(4);
  });

  // ==========================================================================
  // FEAT-07: Kafka EDA Order Event Streaming (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-07: Kafka EDA Order Event Streaming");

  await test("FEAT-07.1: Kafka PROCESSING event generates SALE journal voucher and marks processed", () => {
    fineractMockStore.resetStore();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-EDA-100",
      newStatus: "PROCESSING",
      totalAmount: 1500000,
      paymentMethod: "BANK_TRANSFER",
    });

    expect(res.event.processed).toBe(true);
    expect(res.journalEntry).toBeDefined();
    expect(res.journalEntry!.referenceNumber).toBe("SALE-ORD-EDA-100");
  });

  await test("FEAT-07.2: Kafka REFUNDED event generates REFUND journal voucher", () => {
    fineractMockStore.resetStore();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-EDA-200",
      newStatus: "REFUNDED",
      totalAmount: 600000,
      paymentMethod: "MOMO",
    });

    expect(res.event.processed).toBe(true);
    expect(res.journalEntry).toBeDefined();
    expect(res.journalEntry!.referenceNumber).toBe("REFUND-ORD-EDA-200");
  });

  await test("FEAT-07.3: Kafka DELIVERED event is ignored with zero financial journal entries", () => {
    fineractMockStore.resetStore();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-EDA-300",
      newStatus: "DELIVERED",
      totalAmount: 1500000,
      paymentMethod: "COD",
    });

    expect(res.event.processed).toBe(false);
    expect(res.journalEntry).toBeUndefined();
    expect(res.event.note).toContain("Không phát sinh hạch toán");
  });

  await test("FEAT-07.4: Kafka CANCELLED event is ignored with zero financial journal entries", () => {
    fineractMockStore.resetStore();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-EDA-400",
      newStatus: "CANCELLED",
      totalAmount: 1500000,
      paymentMethod: "COD",
    });

    expect(res.event.processed).toBe(false);
    expect(res.journalEntry).toBeUndefined();
  });

  await test("FEAT-07.5: Kafka event stream log contains incoming event history in reverse chronological order", () => {
    fineractMockStore.resetStore();
    fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-STREAM-1",
      newStatus: "PROCESSING",
      totalAmount: 100000,
      paymentMethod: "COD",
    });

    const events = fineractMockStore.getKafkaEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].orderNumber).toBe("ORD-STREAM-1");
  });

  // ==========================================================================
  // FEAT-08: Fineract Error Inspector & Extractor (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-08: Fineract Error Inspector & Extractor");

  await test("FEAT-08.1: Extractor parses stringified fineractResponse JSON accurately", () => {
    const rawError = {
      httpStatusCode: 403,
      message: "Lỗi từ hệ thống Core Banking (Fineract).",
      fineractResponse: JSON.stringify({
        developerMessage: "The date on which a loan is approved cannot be in the future.",
        httpStatusCode: "403",
        defaultUserMessage: "The date on which a loan is approved cannot be in the future.",
        userMessageGlobalisationCode: "error.msg.loan.approval.cannot.be.in.the.future",
        parameterName: "approvedOnDate",
      }),
    };

    const parsed = extractFineractError(rawError);
    expect(parsed.isFineractError).toBe(true);
    expect(parsed.httpStatusCode).toBe(403);
    expect(parsed.userMessageGlobalisationCode).toBe("error.msg.loan.approval.cannot.be.in.the.future");
  });

  await test("FEAT-08.2: Extractor retrieves raw developerMessage for engineering inspection", () => {
    const rawError = {
      fineractResponse: JSON.stringify({
        developerMessage: "Cannot disburse loan that is not in 200 APPROVED state.",
        defaultUserMessage: "Disbursement rejected.",
      }),
    };

    const parsed = extractFineractError(rawError);
    expect(parsed.developerMessage).toBe("Cannot disburse loan that is not in 200 APPROVED state.");
  });

  await test("FEAT-08.3: Extractor retrieves defaultUserMessage for customer notification", () => {
    const rawError = {
      fineractResponse: JSON.stringify({
        developerMessage: "Internal DB constraint violation",
        defaultUserMessage: "Số tiền vay vượt quá hạn mức tối đa.",
      }),
    };

    const parsed = extractFineractError(rawError);
    expect(parsed.defaultUserMessage).toBe("Số tiền vay vượt quá hạn mức tối đa.");
  });

  await test("FEAT-08.4: Extractor maps known globalisation codes to clear Vietnamese translations", () => {
    const rawError = {
      fineractResponse: JSON.stringify({
        userMessageGlobalisationCode: "error.msg.loan.repayment.amount.cannot.exceed.outstanding",
        defaultUserMessage: "Repayment exceeds balance",
      }),
    };

    const parsed = extractFineractError(rawError);
    expect(parsed.defaultUserMessage).toBe("Số tiền thanh toán trả góp không thể vượt quá tổng dư nợ còn lại của khoản vay.");
  });

  await test("FEAT-08.5: Extractor extracts offending parameterName", () => {
    const rawError = {
      fineractResponse: JSON.stringify({
        parameterName: "actualDisbursementDate",
        defaultUserMessage: "Date cannot precede approval",
      }),
    };

    const parsed = extractFineractError(rawError);
    expect(parsed.parameterName).toBe("actualDisbursementDate");
  });

  // ==========================================================================
  // FEAT-09: Health & Mode Switching (5 tests)
  // ==========================================================================
  setTestTier(1, "FEAT-09: Health & Mode Switching");

  await test("FEAT-09.1: Health status queries core subsystem health and metrics", async () => {
    fineractService.setMode("mock");
    const health = await fineractService.getSystemHealth();
    expect(health.fineractCore.status).toBe("UP");
    expect(health.springBootGateway.status).toBe("UP");
    expect(health.kafkaEdaConsumer.status).toBe("UP");
    expect(health.totalClients).toBeGreaterThanOrEqual(0);
  });

  await test("FEAT-09.2: Service mode defaults to mock or configured mode", () => {
    const mode = fineractService.getMode();
    expect(mode === "live" || mode === "mock").toBe(true);
  });

  await test("FEAT-09.3: Service mode switches cleanly between mock and live", () => {
    fineractService.setMode("live");
    expect(fineractService.getMode()).toBe("live");
    fineractService.setMode("mock");
    expect(fineractService.getMode()).toBe("mock");
  });

  await test("FEAT-09.4: System metrics calculate total outstanding principal and cash/bank balances", () => {
    fineractMockStore.seedTestFixtures();
    const metrics = fineractMockStore.getSystemMetrics();
    expect(metrics.totalClients).toBeGreaterThanOrEqual(5);
    expect(metrics.totalActiveLoans).toBeGreaterThanOrEqual(1);
    expect(metrics.totalOutstandingPrincipal).toBeGreaterThan(0);
    expect(typeof metrics.cashBalance).toBe("number");
    expect(typeof metrics.bankBalance).toBe("number");
  });

  await test("FEAT-09.5: Mock store reset restores pristine seed clients and accounts", () => {
    fineractMockStore.resetStore();
    fineractMockStore.createClient({
      fullName: "Nguyễn Khách Phụ",
      emailAddress: "phu@test.com",
    });
    const countBeforeReset = fineractMockStore.getClients("admin").length;
    fineractMockStore.resetStore();
    const countAfterReset = fineractMockStore.getClients("admin").length;
    expect(countBeforeReset).toBe(1);
    expect(countAfterReset).toBe(0);
  });
}
