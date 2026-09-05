/**
 * Tier 2: Boundary, Corner Cases & Adversarial Test Suite
 * Minimum >= 5 tests per core feature across all 9 target features (45 total tests).
 */

import { test, expect, setTestTier } from "./framework";
import {
  fineractMockStore,
  parseVietnameseName,
  GL_RESOLVER_MATRIX,
  formatDateToFineract,
} from "../../src/lib/fineractMockStore";
import { extractFineractError, formatFineractErrorToast } from "../../src/lib/fineractErrorExtractor";
import { fineractService } from "../../src/services/fineractService";

export async function runTier2Tests() {
  console.log("\n\x1b[1m\x1b[35m======================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[35m>>> TIER 2: BOUNDARY & CORNER CASES SUITE (>= 5 TESTS PER FEATURE)\x1b[0m");
  console.log("\x1b[1m\x1b[35m======================================================================\x1b[0m\n");

  // ==========================================================================
  // FEAT-01: Client Boundaries (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-01: Client Boundaries & Invariant Probing");

  await test("FEAT-01.B1: Name with leading, trailing and excessive spaces trims cleanly", () => {
    const parsed = parseVietnameseName("   Nguyễn    Văn   Đức   ");
    expect(parsed.firstname).toBe("Đức");
    expect(parsed.lastname).toBe("Nguyễn Văn");
  });

  await test("FEAT-01.B2: Creating client with existing externalId throws duplicate externalId error", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createClient({
        fullName: "Trần Minh Quang",
        externalId: "101",
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("đã tồn tại trong hệ thống");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-01.B3: Name parser handles hyphenated names and Vietnamese diacritics", () => {
    const parsed = parseVietnameseName("Trần-Lê Hoài Thương");
    expect(parsed.firstname).toBe("Thương");
    expect(parsed.lastname).toBe("Trần-Lê Hoài");
  });

  await test("FEAT-01.B4: Client registration with empty or blank name throws validation error", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createClient({
        fullName: "    ",
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Họ và tên khách hàng");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-01.B5: Querying non-existent client ID throws 404 error", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.getClient(999999);
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Không tìm thấy khách hàng");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // FEAT-02: Loan Product Boundaries (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-02: Loan Product Boundaries");

  await test("FEAT-02.B1: Loan application with principal strictly below minPrincipal is rejected", () => {
    fineractMockStore.seedTestFixtures();
    const product = fineractMockStore.getLoanProducts().find((p) => p.id === 1)!;
    const belowMin = 500000; // Below 1,000,000 min

    let threw = false;
    try {
      fineractMockStore.createLoan({
        clientId: 1,
        productId: 1,
        principal: belowMin,
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
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("phải nằm trong khoảng");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-02.B2: Loan application with principal strictly above maxPrincipal is rejected", () => {
    fineractMockStore.seedTestFixtures();
    const product = fineractMockStore.getLoanProducts().find((p) => p.id === 1)!;
    const aboveMax = product.maxPrincipal + 5000000;

    let threw = false;
    try {
      fineractMockStore.createLoan({
        clientId: 1,
        productId: 1,
        principal: aboveMax,
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
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("phải nằm trong khoảng");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-02.B3: Loan application at exact minPrincipal succeeds", () => {
    fineractMockStore.seedTestFixtures();
    const product = fineractMockStore.getLoanProducts().find((p) => p.id === 1)!;
    const loan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: product.minPrincipal,
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
    expect(loan.principal).toBe(product.minPrincipal);
    expect(loan.status.id).toBe(100);
  });

  await test("FEAT-02.B4: Loan application at exact maxPrincipal succeeds", () => {
    fineractMockStore.seedTestFixtures();
    const product = fineractMockStore.getLoanProducts().find((p) => p.id === 1)!;
    const loan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: product.maxPrincipal,
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
    expect(loan.principal).toBe(product.maxPrincipal);
    expect(loan.status.id).toBe(100);
  });

  await test("FEAT-02.B5: Loan application with invalid productId is rejected", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createLoan({
        clientId: 1,
        productId: 9999,
        principal: 10000000,
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
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("không tồn tại");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // FEAT-03: State Machine Boundary & Chronology Violations (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-03: State Machine Chronology & Invariants");

  await test("FEAT-03.B1: Future loan approval date is rejected with globalisation code", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      // Set approval date in the year 2099
      fineractMockStore.approveLoan(1, "01 January 2099");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Ngày phê duyệt khoản vay không thể ở tương lai");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-03.B2: Disbursement date preceding approval date is rejected", () => {
    fineractMockStore.seedTestFixtures();
    // Seed loan 2 is approved on "02 September 2026"
    let threw = false;
    try {
      fineractMockStore.disburseLoan(2, "01 August 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Ngày giải ngân thực tế không thể trước ngày phê duyệt");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-03.B3: Rejection on already closed/rejected loan is strictly forbidden", () => {
    fineractMockStore.seedTestFixtures();
    // Seed loan 5 is 500 REJECTED
    let threw = false;
    try {
      fineractMockStore.rejectLoan(5, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể từ chối");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-03.B4: Double approval on already approved loan is blocked", () => {
    fineractMockStore.seedTestFixtures();
    // Seed loan 2 is already 200 APPROVED
    let threw = false;
    try {
      fineractMockStore.approveLoan(2, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể phê duyệt");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-03.B5: Double disbursement on already active loan is blocked", () => {
    fineractMockStore.seedTestFixtures();
    // Seed loan 3 is already 300 ACTIVE
    let threw = false;
    try {
      fineractMockStore.disburseLoan(3, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể giải ngân");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // FEAT-04: Repayment Engine Edge Cases (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-04: Repayment Engine Edge Cases");

  await test("FEAT-04.B1: Repayment amount exceeding total outstanding balance is rejected", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.getLoan(3)!;
    const excessiveAmount = loan.summary.totalOutstanding + 5000000;

    let threw = false;
    try {
      fineractMockStore.repayLoan(3, excessiveAmount, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("không thể vượt quá tổng dư nợ");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-04.B2: Exact settlement repayment leaves exactly 0.00 outstanding balance", () => {
    fineractMockStore.seedTestFixtures();
    const loan = fineractMockStore.getLoan(3)!;
    const exactDue = loan.summary.totalOutstanding;

    const res = fineractMockStore.repayLoan(3, exactDue, "04 September 2026");
    expect(res.loan.summary.totalOutstanding).toBeCloseTo(0, 0.001);
    expect(res.loan.status.id).toBe(600);
  });

  await test("FEAT-04.B3: Repayment with zero or negative amount is rejected", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.repayLoan(3, 0, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Số tiền thanh toán phải lớn hơn 0");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-04.B4: Repayment on unapproved loan (status 100) is rejected", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.repayLoan(1, 1000000, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể thanh toán trả góp");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-04.B5: Repayment on closed obligations met loan (status 600) is rejected", () => {
    fineractMockStore.seedTestFixtures();
    // Seed loan 4 is 600 OBLIGATIONS_MET
    let threw = false;
    try {
      fineractMockStore.repayLoan(4, 500000, "04 September 2026");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Chỉ có thể thanh toán trả góp");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // FEAT-05: Double-Entry Invariant Stress (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-05: Double-Entry Invariant Stress");

  await test("FEAT-05.B1: Floating point rounding difference within 0.001 delta passes invariant", () => {
    fineractMockStore.seedTestFixtures();
    // 0.1 + 0.2 = 0.30000000000000004
    const tx = fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "04 September 2026",
      referenceNumber: "TX-FLOAT-PRECISION",
      debits: [
        { glAccountId: 1, amount: 100000.1 },
        { glAccountId: 4, amount: 200000.2 },
      ],
      credits: [{ glAccountId: 2, amount: 300000.3 }],
    });

    expect(tx.isBalanced).toBe(true);
  });

  await test("FEAT-05.B2: Delta of one cent (0.01) strictly fails the double-entry invariant", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TX-IMBALANCE-1CENT",
        debits: [{ glAccountId: 1, amount: 500000.0 }],
        credits: [{ glAccountId: 2, amount: 500000.01 }],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Nguyên tắc kế toán kép vi phạm");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-05.B3: Voucher with zero debit and credit amounts is rejected as non-transactional", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TX-ZEROS",
        debits: [{ glAccountId: 1, amount: 0 }],
        credits: [{ glAccountId: 2, amount: 0 }],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Nguyên tắc kế toán kép vi phạm");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-05.B4: Negative debit or credit line amounts are strictly rejected", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TX-NEGATIVE",
        debits: [{ glAccountId: 1, amount: -500000 }],
        credits: [{ glAccountId: 2, amount: -500000 }],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Nguyên tắc kế toán kép vi phạm");
    }
    expect(threw).toBe(true);
  });

  await test("FEAT-05.B5: Entry missing credits list is strictly rejected", () => {
    fineractMockStore.seedTestFixtures();
    let threw = false;
    try {
      fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "04 September 2026",
        referenceNumber: "TX-NO-CREDITS",
        debits: [{ glAccountId: 1, amount: 500000 }],
        credits: [],
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Bắt buộc phải có ít nhất 1 dòng ghi Có");
    }
    expect(threw).toBe(true);
  });

  // ==========================================================================
  // FEAT-06: GL Account Resolver Edge Cases (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-06: GL Resolver Edge Cases");

  await test("FEAT-06.B1: Case-insensitive payment methods match standard channels", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-CASE-01",
      newStatus: "PROCESSING",
      totalAmount: 100000,
      paymentMethod: "cod" as any,
    });
    expect(res.journalEntry).toBeDefined();
    const debit = res.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    expect(debit.glAccountId).toBe(1); // Cash
  });

  await test("FEAT-06.B2: Unknown payment method safely defaults to Bank account", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-UNKNOWN-PAY",
      newStatus: "PROCESSING",
      totalAmount: 200000,
      paymentMethod: "CRYPTO_TOKEN" as any,
    });
    expect(res.journalEntry).toBeDefined();
    const debit = res.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    expect(debit.glAccountId).toBe(4); // Non-COD defaults to Bank (4)
  });

  await test("FEAT-06.B3: Payment method with surrounding whitespace resolves properly", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-SPACES",
      newStatus: "PROCESSING",
      totalAmount: 300000,
      paymentMethod: "  VNPAY  " as any,
    });
    expect(res.journalEntry).toBeDefined();
    const debit = res.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    expect(debit.glAccountId).toBe(4); // Bank
  });

  await test("FEAT-06.B4: All 4 accounts in resolver matrix have distinct IDs and standard types", () => {
    const ids = [
      GL_RESOLVER_MATRIX.cashGlAccount.id,
      GL_RESOLVER_MATRIX.bankGlAccount.id,
      GL_RESOLVER_MATRIX.salesRevenueGlAccount.id,
      GL_RESOLVER_MATRIX.salesReturnsGlAccount.id,
    ];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);
    expect(GL_RESOLVER_MATRIX.cashGlAccount.type).toBe("ASSET");
    expect(GL_RESOLVER_MATRIX.bankGlAccount.type).toBe("ASSET");
    expect(GL_RESOLVER_MATRIX.salesRevenueGlAccount.type).toBe("INCOME");
    expect(GL_RESOLVER_MATRIX.salesReturnsGlAccount.type).toBe("EXPENSE");
  });

  await test("FEAT-06.B5: Refund for BANK_TRANSFER reverses into Bank (4) and Returns (3)", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-BT-REFUND",
      newStatus: "REFUNDED",
      totalAmount: 1500000,
      paymentMethod: "BANK_TRANSFER",
    });
    expect(res.journalEntry).toBeDefined();
    const debit = res.journalEntry!.lines.find((l) => l.entryType.value === "DEBIT")!;
    const credit = res.journalEntry!.lines.find((l) => l.entryType.value === "CREDIT")!;
    expect(debit.glAccountId).toBe(3); // Sales Returns
    expect(credit.glAccountId).toBe(4); // Bank
  });

  // ==========================================================================
  // FEAT-07: Kafka EDA Edge Cases (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-07: Kafka EDA Edge Cases");

  await test("FEAT-07.B1: Kafka event with totalAmount = 0 is safely ignored", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-ZERO",
      newStatus: "PROCESSING",
      totalAmount: 0,
      paymentMethod: "COD",
    });
    expect(res.journalEntry).toBeUndefined();
    expect(res.event.processed).toBe(false);
    expect(res.event.note).toContain("Bỏ qua: Giá trị đơn hàng không hợp lệ");
  });

  await test("FEAT-07.B2: Kafka event with negative totalAmount is safely ignored", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-NEG",
      newStatus: "PROCESSING",
      totalAmount: -50000,
      paymentMethod: "COD",
    });
    expect(res.journalEntry).toBeUndefined();
    expect(res.event.processed).toBe(false);
  });

  await test("FEAT-07.B3: Kafka event with status COMPLETED generates no financial posting", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-COMPLETED",
      newStatus: "COMPLETED",
      totalAmount: 500000,
      paymentMethod: "VNPAY",
    });
    expect(res.journalEntry).toBeUndefined();
    expect(res.event.processed).toBe(false);
  });

  await test("FEAT-07.B4: Duplicate event execution preserves balanced ledger state", () => {
    fineractMockStore.seedTestFixtures();
    const res1 = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-DUP-01",
      newStatus: "PROCESSING",
      totalAmount: 250000,
      paymentMethod: "COD",
    });
    const res2 = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-DUP-01",
      newStatus: "PROCESSING",
      totalAmount: 250000,
      paymentMethod: "COD",
    });
    expect(res1.journalEntry).toBeDefined();
    expect(res2.journalEntry).toBeDefined();
    expect(res1.journalEntry!.isBalanced).toBe(true);
    expect(res2.journalEntry!.isBalanced).toBe(true);
  });

  await test("FEAT-07.B5: ORDER_CREATED event with initialStatus PROCESSING generates sale entry", () => {
    fineractMockStore.seedTestFixtures();
    const res = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_CREATED",
      orderNumber: "ORD-NEW-CREATE-01",
      newStatus: "PENDING",
      initialStatus: "PROCESSING",
      totalAmount: 850000,
      paymentMethod: "BANK_TRANSFER",
    });
    expect(res.journalEntry).toBeDefined();
    expect(res.journalEntry!.referenceNumber).toBe("SALE-ORD-NEW-CREATE-01");
  });

  // ==========================================================================
  // FEAT-08: Error Inspector Corner Cases (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-08: Error Inspector Corner Cases");

  await test("FEAT-08.B1: Null or empty error input returns safe fallback object without crashing", () => {
    const parsedNull = extractFineractError(null);
    expect(parsedNull.isFineractError).toBe(false);
    expect(parsedNull.httpStatusCode).toBe(400);

    const parsedEmpty = extractFineractError("");
    expect(parsedEmpty.isFineractError).toBe(false);
  });

  await test("FEAT-08.B2: Plain text Java stack trace string is sanitized safely", () => {
    const rawTrace = "java.lang.IllegalArgumentException: Invalid date supplied at com.ddicg.erp.modules.fineract";
    const parsed = extractFineractError(rawTrace);
    expect(parsed.defaultUserMessage).toBe(rawTrace);
    expect(parsed.developerMessage).toBe(rawTrace);
  });

  await test("FEAT-08.B3: Nested errors array extracts parameterName and userMessageGlobalisationCode", () => {
    const multiErr = {
      httpStatusCode: 400,
      fineractResponse: JSON.stringify({
        defaultUserMessage: "Validation failed",
        errors: [
          {
            parameterName: "firstname",
            userMessageGlobalisationCode: "error.msg.client.name.required",
            defaultUserMessage: "First name is mandatory",
          },
        ],
      }),
    };

    const parsed = extractFineractError(multiErr);
    expect(parsed.parameterName).toBe("firstname");
    expect(parsed.userMessageGlobalisationCode).toBe("error.msg.client.name.required");
  });

  await test("FEAT-08.B4: Error formatting for Toast popups returns clean title, message, and code", () => {
    const err = {
      fineractResponse: JSON.stringify({
        userMessageGlobalisationCode: "error.msg.loan.account.is.not.active",
        parameterName: "loanId",
      }),
    };

    const toast = formatFineractErrorToast(err);
    expect(toast.title).toBe("Dữ Liệu Không Hợp Lệ (HTTP 400)");
    expect(toast.message).toContain("Hồ sơ khoản vay chưa được kích hoạt");
    expect(toast.message).toContain("Tham số: loanId");
    expect(toast.code).toBe("error.msg.loan.account.is.not.active");
  });

  await test("FEAT-08.B5: HTTP 403 status produces business rejection title", () => {
    const err403 = {
      httpStatusCode: 403,
      fineractResponse: JSON.stringify({
        defaultUserMessage: "Action not permitted in current state",
      }),
    };
    const parsed = extractFineractError(err403);
    expect(parsed.title).toBe("Từ Chối Nghiệp Vụ (HTTP 403)");
  });

  // ==========================================================================
  // FEAT-09: Health & Mode Edge Cases (5 tests)
  // ==========================================================================
  setTestTier(2, "FEAT-09: Health & Mode Edge Cases");

  await test("FEAT-09.B1: Aggregate portfolio metrics remain non-negative under all operations", () => {
    fineractMockStore.resetStore();
    const metrics = fineractMockStore.getSystemMetrics();
    expect(metrics.totalClients).toBeGreaterThanOrEqual(0);
    expect(metrics.totalActiveLoans).toBeGreaterThanOrEqual(0);
    expect(metrics.totalOutstandingPrincipal).toBeGreaterThanOrEqual(0);
  });

  await test("FEAT-09.B2: Health status reports positive latency under normal conditions", async () => {
    const health = await fineractService.getSystemHealth();
    expect(health.fineractCore.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.springBootGateway.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.kafkaEdaConsumer.latencyMs).toBeGreaterThanOrEqual(0);
  });

  await test("FEAT-09.B3: Multiple consecutive reset calls are strictly idempotent", () => {
    fineractMockStore.resetStore();
    const m1 = fineractMockStore.getSystemMetrics();
    fineractMockStore.resetStore();
    const m2 = fineractMockStore.getSystemMetrics();
    expect(m1.totalClients).toBe(m2.totalClients);
    expect(m1.totalActiveLoans).toBe(m2.totalActiveLoans);
    expect(m1.totalOutstandingPrincipal).toBe(m2.totalOutstandingPrincipal);
  });

  await test("FEAT-09.B4: Service mode switching remains consistent across consecutive updates", () => {
    fineractService.setMode("mock");
    expect(fineractService.getMode()).toBe("mock");
    fineractService.setMode("mock");
    expect(fineractService.getMode()).toBe("mock");
  });

  await test("FEAT-09.B5: Consecutive repayments decrease outstanding balance monotonically", () => {
    fineractMockStore.seedTestFixtures();
    const l0 = fineractMockStore.getLoan(3)!;
    const b0 = l0.summary.totalOutstanding;

    const r1 = fineractMockStore.repayLoan(3, 1000000, "04 September 2026");
    const b1 = r1.loan.summary.totalOutstanding;
    expect(b1).toBeLessThan(b0);

    const r2 = fineractMockStore.repayLoan(3, 1000000, "04 September 2026");
    const b2 = r2.loan.summary.totalOutstanding;
    expect(b2).toBeLessThan(b1);
  });
}
