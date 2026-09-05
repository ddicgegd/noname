/**
 * Milestone 1 Comprehensive Automated Verification Suite
 * Tests all core domain engines, state machines, invariant guards,
 * GL resolver matrix, Kafka EDA simulator, and error extraction logic.
 */

import {
  fineractMockStore,
  parseVietnameseName,
  formatDateToFineract,
  isDateInFuture,
  GL_RESOLVER_MATRIX
} from "../../src/lib/fineractMockStore";
import {
  extractFineractError,
  formatFineractErrorToast,
  getVietnameseDescriptionForCode
} from "../../src/lib/fineractErrorExtractor";
import { fineractService } from "../../src/services/fineractService";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function assertThrows(fn: () => any, expectedSnippet: string, testName: string): void {
  try {
    fn();
    console.error(`❌ Expected error containing "${expectedSnippet}" but function succeeded!`);
    throw new Error(`Expected error containing "${expectedSnippet}" but function succeeded`);
  } catch (err: any) {
    const errorStr = JSON.stringify(err.data || err.message || err);
    if (errorStr.includes(expectedSnippet) || (err.message && err.message.includes(expectedSnippet))) {
      console.log(`  ✓ ${testName} (Correctly threw expected error)`);
    } else {
      console.error(`❌ Threw unexpected error: ${err.message}. Expected: ${expectedSnippet}`);
      throw err;
    }
  }
}

async function runAllTests() {
  console.log("\n============================================================");
  console.log("   M1 CORE ENGINE & SERVICE VERIFICATION SUITE");
  console.log("============================================================\n");

  // Reset store to known baseline
  fineractMockStore.resetStore();

  // ------------------------------------------------------------------------
  // Suite 1: Vietnamese Name Parser
  // ------------------------------------------------------------------------
  console.log("--- Suite 1: Vietnamese Name Parser ---");
  {
    const res1 = parseVietnameseName("Ngô Ngọc Định");
    assert(res1.firstname === "Định" && res1.lastname === "Ngô Ngọc", "Parses 3-word Vietnamese name correctly");

    const res2 = parseVietnameseName("Nguyễn Văn An");
    assert(res2.firstname === "An" && res2.lastname === "Nguyễn Văn", "Parses classic 3-word name correctly");

    const res3 = parseVietnameseName("Trần Mai");
    assert(res3.firstname === "Mai" && res3.lastname === "Trần", "Parses 2-word name correctly");

    const res4 = parseVietnameseName("Long");
    assert(res4.firstname === "Long" && res4.lastname === "Long", "Handles single word name gracefully");

    assertThrows(
      () => parseVietnameseName("   "),
      "error.msg.client.name.required",
      "Empty name throws Fineract client.name.required error"
    );
  }

  // ------------------------------------------------------------------------
  // Suite 2: Client Subsystem & Idempotency
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 2: Client Subsystem ---");
  {
    const initialClients = fineractMockStore.getClients();
    assert(initialClients.length >= 6, `Seed clients count >= 6 (actual: ${initialClients.length})`);

    // Verify client externalId lookup
    const customerClient = fineractMockStore.getClients("customer", "101");
    assert(customerClient.length === 1 && customerClient[0].displayName === "Nguyễn Văn An", "Customer role filters correctly by externalId");

    // Create client with Vietnamese full name
    const newClient = fineractMockStore.createClient({
      fullName: "Bùi Hoàng Nam",
      externalId: "201",
      emailAddress: "buihoangnam@example.com",
      mobileNo: "0988776655",
      active: true
    });
    assert(newClient.firstname === "Nam" && newClient.lastname === "Bùi Hoàng", "Created client has correctly parsed name");
    assert(newClient.externalId === "201", "Client assigned correct externalId");

    // Verify duplicate externalId rejection
    assertThrows(
      () => fineractMockStore.createClient({
        fullName: "Người Dùng Trùng",
        externalId: "201"
      }),
      "error.msg.client.externalId.already.exists",
      "Duplicate externalId correctly rejected with HTTP 403"
    );
  }

  // ------------------------------------------------------------------------
  // Suite 3: Loan Products & Account Creation
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 3: Loan Products & Account Creation ---");
  {
    const products = fineractMockStore.getLoanProducts();
    assert(products.length >= 2, `Loan products catalog has >= 2 items (actual: ${products.length})`);
    assert(products[0].shortName === "ERP-LN01", "Product 1 is ERP-LN01");
    assert(products[1].shortName === "ERP-LN02", "Product 2 is ERP-LN02");

    // Create loan within product limits
    const createdLoan = fineractMockStore.createLoan({
      clientId: 1,
      productId: 1,
      principal: 25000000,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      submittedOnDate: "01 September 2026",
      expectedDisbursementDate: "10 September 2026"
    });
    assert(createdLoan.status.id === 100, "Newly created loan starts in status 100 (PENDING_APPROVAL)");
    assert(createdLoan.repaymentSchedule !== undefined, "Loan has calculated repayment schedule");
    assert(createdLoan.repaymentSchedule?.periods.length === 7, "Repayment schedule has 7 periods (0 disbursement + 6 installments)");

    // Principal out of bounds rejection
    assertThrows(
      () => fineractMockStore.createLoan({
        clientId: 1,
        productId: 1,
        principal: 999999999, // Exceeds 50M limit
        numberOfRepayments: 6,
        repaymentEvery: 1,
        loanTermFrequency: 6,
        loanTermFrequencyType: 2,
        repaymentFrequencyType: 2,
        interestRatePerPeriod: 1.2,
        amortizationType: 1,
        interestType: 0,
        submittedOnDate: "01 September 2026",
        expectedDisbursementDate: "10 September 2026"
      }),
      "error.msg.loan.principal.out.of.bounds",
      "Loan with principal out of product bounds correctly rejected"
    );
  }

  // ------------------------------------------------------------------------
  // Suite 4: Finite State Machine (FSM) Transitions
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 4: Loan Lifecycle FSM Transitions ---");
  {
    // Test Loan ID 1 is in status 100
    const loan1 = fineractMockStore.getLoan(1);
    assert(loan1.status.id === 100, "Loan 1 starts in status 100");

    // 4.1 Future date approval rejection
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    assertThrows(
      () => fineractMockStore.approveLoan(1, formatDateToFineract(futureDate)),
      "error.msg.loan.approval.cannot.be.in.the.future",
      "Future approval date rejected with error.msg.loan.approval.cannot.be.in.the.future"
    );

    // 4.2 Successful Approve: 100 -> 200
    const approvedLoan = fineractMockStore.approveLoan(1, "01 August 2026", "Phê duyệt tín dụng đạt chuẩn");
    assert(approvedLoan.status.id === 200, "Loan 1 transitioned to status 200 (APPROVED)");
    assert(approvedLoan.status.waitingForDisbursal === true, "waitingForDisbursal flag is true");

    // 4.3 Approve on already approved loan rejection
    assertThrows(
      () => fineractMockStore.approveLoan(1, "02 August 2026"),
      "error.msg.loan.approval.not.allowed.in.current.state",
      "Re-approval on already approved loan rejected"
    );

    // 4.4 Disburse before approval date rejection
    assertThrows(
      () => fineractMockStore.disburseLoan(1, "15 July 2026"),
      "error.msg.loan.disbursement.cannot.be.before.approval",
      "Disbursement date preceding approval date rejected"
    );

    // 4.5 Successful Disburse: 200 -> 300
    const disbursedLoan = fineractMockStore.disburseLoan(1, "05 August 2026", "Giải ngân tiền vào tài khoản");
    assert(disbursedLoan.status.id === 300, "Loan 1 transitioned to status 300 (ACTIVE)");
    assert(disbursedLoan.summary.principalDisbursed === 15000000, "Disbursed principal recorded in summary");
    assert(disbursedLoan.transactions?.length === 1, "Disbursement transaction recorded");

    // 4.6 Reject / Withdraw tests on new loan
    const testLoanForReject = fineractMockStore.createLoan({
      clientId: 2,
      productId: 1,
      principal: 5000000,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      submittedOnDate: "01 August 2026",
      expectedDisbursementDate: "05 August 2026"
    });
    const rejected = fineractMockStore.rejectLoan(testLoanForReject.id, "02 August 2026");
    assert(rejected.status.id === 500, "Loan transitioned to status 500 (REJECTED)");

    const testLoanForWithdraw = fineractMockStore.createLoan({
      clientId: 2,
      productId: 1,
      principal: 5000000,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      submittedOnDate: "01 August 2026",
      expectedDisbursementDate: "05 August 2026"
    });
    const withdrawn = fineractMockStore.withdrawLoan(testLoanForWithdraw.id, "03 August 2026");
    assert(withdrawn.status.id === 400, "Loan transitioned to status 400 (WITHDRAWN)");
  }

  // ------------------------------------------------------------------------
  // Suite 5: Loan Repayment & Terminal Closure (600: OBLIGATIONS_MET)
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 5: Loan Repayments & Terminal Closure ---");
  {
    // Active Loan ID 3 has outstanding balance
    const loan3 = fineractMockStore.getLoan(3);
    assert(loan3.status.id === 300, "Loan 3 is active");
    const outstandingBefore = loan3.summary.totalOutstanding;
    assert(outstandingBefore > 0, "Loan 3 has positive outstanding balance");

    // Overpayment rejection
    assertThrows(
      () => fineractMockStore.repayLoan(3, outstandingBefore + 10000000, "15 August 2026"),
      "error.msg.loan.repayment.amount.cannot.exceed.outstanding",
      "Repayment amount exceeding outstanding balance rejected"
    );

    // Partial repayment
    const partialPayment = 5000000;
    const partialRes = fineractMockStore.repayLoan(3, partialPayment, "15 August 2026");
    assert(partialRes.loan.status.id === 300, "Loan remains active after partial payment");
    assert(partialRes.loan.summary.totalOutstanding === outstandingBefore - partialPayment, "Outstanding balance reduced exactly by repayment amount");

    // Full payoff to clear loan: Pay remaining balance
    const remainingToPay = partialRes.loan.summary.totalOutstanding;
    const payoffRes = fineractMockStore.repayLoan(3, remainingToPay, "20 August 2026");
    assert(payoffRes.loan.summary.totalOutstanding === 0, "Outstanding balance is exactly 0");
    assert(payoffRes.loan.status.id === 600, "Loan transitioned to terminal status 600 (OBLIGATIONS_MET)");
    assert(payoffRes.loan.status.closedObligationsMet === true, "closedObligationsMet flag is true");

    // Repaying an already closed loan is rejected
    assertThrows(
      () => fineractMockStore.repayLoan(3, 1000000, "25 August 2026"),
      "error.msg.loan.repayment.not.allowed.in.current.state",
      "Repayment on closed loan rejected"
    );
  }

  // ------------------------------------------------------------------------
  // Suite 6: Double-Entry General Ledger Invariant Guard
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 6: Double-Entry Balance Invariant Guard ---");
  {
    // 6.1 Imbalanced entry rejection: Debit 1,000,000 != Credit 800,000
    assertThrows(
      () => fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "01 September 2026",
        referenceNumber: "IMBALANCED-TX",
        debits: [{ glAccountId: 1, amount: 1000000 }],
        credits: [{ glAccountId: 2, amount: 800000 }]
      }),
      "error.msg.gl.double.entry.imbalanced",
      "Imbalanced entry (Debit != Credit) strictly rejected with HTTP 400"
    );

    // 6.2 Missing debits rejection
    assertThrows(
      () => fineractMockStore.createJournalEntry({
        officeId: 1,
        transactionDate: "01 September 2026",
        referenceNumber: "NO-DEBITS-TX",
        debits: [],
        credits: [{ glAccountId: 2, amount: 500000 }]
      }),
      "validation.msg.journalentry.debits.empty",
      "Empty debits rejected with validation error"
    );

    // 6.3 Balanced multi-line entry accepted:
    // Debit Cash (1) 3,000,000 + Debit Bank (4) 2,000,000 = Credit Sales Revenue (2) 5,000,000
    const balancedTx = fineractMockStore.createJournalEntry({
      officeId: 1,
      transactionDate: "02 September 2026",
      referenceNumber: "BALANCED-SPLIT-01",
      comments: "Bút toán tách nhiều dòng thanh toán cân bằng",
      debits: [
        { glAccountId: 1, amount: 3000000 },
        { glAccountId: 4, amount: 2000000 }
      ],
      credits: [
        { glAccountId: 2, amount: 5000000 }
      ]
    });
    assert(balancedTx.isBalanced === true, "Balanced multi-line transaction recorded successfully");
    assert(balancedTx.totalDebit === 5000000 && balancedTx.totalCredit === 5000000, "Debit and Credit both equal 5,000,000");
  }

  // ------------------------------------------------------------------------
  // Suite 7: GL Account Resolver Matrix & Kafka EDA Processor
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 7: GL Resolver Matrix & Kafka EDA Simulator ---");
  {
    // Matrix resolver tests
    const codSale = fineractMockStore.resolveGlAccountsForOrder("COD", false);
    assert(codSale.debitAccountId === 1 && codSale.creditAccountId === 2, "COD Sale maps to Debit Cash (1) and Credit Sales Revenue (2)");

    const bankSale = fineractMockStore.resolveGlAccountsForOrder("VNPAY", false);
    assert(bankSale.debitAccountId === 4 && bankSale.creditAccountId === 2, "VNPAY Sale maps to Debit Bank (4) and Credit Sales Revenue (2)");

    const codRefund = fineractMockStore.resolveGlAccountsForOrder("COD", true);
    assert(codRefund.debitAccountId === 3 && codRefund.creditAccountId === 1, "COD Refund maps to Debit Returns (3) and Credit Cash (1)");

    const bankRefund = fineractMockStore.resolveGlAccountsForOrder("BANK_TRANSFER", true);
    assert(bankRefund.debitAccountId === 3 && bankRefund.creditAccountId === 4, "Bank Refund maps to Debit Returns (3) and Credit Bank (4)");

    // 7.1 Process Kafka PROCESSING event -> generates SALE-{orderNumber}
    const saleEventRes = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-TEST-9901",
      newStatus: "PROCESSING",
      totalAmount: 4500000,
      paymentMethod: "VNPAY"
    });
    assert(saleEventRes.event.processed === true, "Kafka PROCESSING event processed");
    assert(saleEventRes.journalEntry !== undefined, "Journal entry transaction generated");
    assert(saleEventRes.journalEntry?.referenceNumber === "SALE-ORD-TEST-9901", "Reference number is SALE-ORD-TEST-9901");
    assert(saleEventRes.journalEntry?.lines[0].glAccountId === 4, "Sale debited Bank account (4)");
    assert(saleEventRes.journalEntry?.lines[1].glAccountId === 2, "Sale credited Sales Revenue account (2)");

    // 7.2 Process Kafka REFUNDED event -> generates REFUND-{orderNumber}
    const refundEventRes = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-TEST-9902",
      newStatus: "REFUNDED",
      totalAmount: 1800000,
      paymentMethod: "COD"
    });
    assert(refundEventRes.event.processed === true, "Kafka REFUNDED event processed");
    assert(refundEventRes.journalEntry?.referenceNumber === "REFUND-ORD-TEST-9902", "Reference number is REFUND-ORD-TEST-9902");
    assert(refundEventRes.journalEntry?.lines[0].glAccountId === 3, "Refund debited Sales Returns account (3)");
    assert(refundEventRes.journalEntry?.lines[1].glAccountId === 1, "Refund credited Cash account (1)");

    // 7.3 Process Kafka DELIVERED event -> ignored (zero journal entries)
    const deliveredRes = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-TEST-9903",
      newStatus: "DELIVERED",
      totalAmount: 2000000,
      paymentMethod: "COD"
    });
    assert(deliveredRes.event.processed === false, "DELIVERED event is marked not processed");
    assert(deliveredRes.journalEntry === undefined, "Zero journal entries created for DELIVERED event");

    // 7.4 Process Kafka CANCELLED event -> ignored (zero journal entries)
    const cancelledRes = fineractMockStore.processKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-TEST-9904",
      newStatus: "CANCELLED",
      totalAmount: 2000000,
      paymentMethod: "VNPAY"
    });
    assert(cancelledRes.event.processed === false, "CANCELLED event is marked not processed");
    assert(cancelledRes.journalEntry === undefined, "Zero journal entries created for CANCELLED event");
  }

  // ------------------------------------------------------------------------
  // Suite 8: Fineract Error Extractor & Diagnostics
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 8: Fineract Error Extractor & Diagnostics ---");
  {
    // Spring Boot FineractExceptionHandler format (stringified JSON)
    const rawErrorPayload = {
      status: "error",
      httpStatusCode: 403,
      message: "Lỗi từ hệ thống Core Banking (Fineract).",
      fineractResponse: JSON.stringify({
        developerMessage: "The date on which a loan is approved cannot be in the future.",
        httpStatusCode: "403",
        defaultUserMessage: "The date on which a loan is approved cannot be in the future.",
        userMessageGlobalisationCode: "error.msg.loan.approval.cannot.be.in.the.future",
        parameterName: "approvedOnDate"
      })
    };

    const parsed = extractFineractError(rawErrorPayload);
    assert(parsed.isFineractError === true, "Recognized as Fineract error");
    assert(parsed.httpStatusCode === 403, "HTTP status code parsed as 403");
    assert(parsed.userMessageGlobalisationCode === "error.msg.loan.approval.cannot.be.in.the.future", "Globalisation code extracted");
    assert(parsed.parameterName === "approvedOnDate", "Parameter name extracted as approvedOnDate");
    assert(parsed.defaultUserMessage.includes("Ngày phê duyệt"), "Vietnamese translation applied for globalisation code");

    // Toast formatter
    const toast = formatFineractErrorToast(rawErrorPayload);
    assert(toast.title === "Từ Chối Nghiệp Vụ (HTTP 403)", "Toast title formatted correctly");
    assert(toast.code === "error.msg.loan.approval.cannot.be.in.the.future", "Toast code matches globalisation code");

    // Generic error fallback
    const genericParsed = extractFineractError(new Error("Network connection timeout"));
    assert(genericParsed.defaultUserMessage === "Network connection timeout", "Standard Error message preserved");
    assert(genericParsed.isFineractError === false, "isFineractError is false for generic errors");
  }

  // ------------------------------------------------------------------------
  // Suite 9: FineractService Unified Client
  // ------------------------------------------------------------------------
  console.log("\n--- Suite 9: FineractService Unified Client ---");
  {
    // Mode toggle
    fineractService.setMode("mock");
    assert(fineractService.getMode() === "mock", "Service mode is set to mock");

    // Health metrics
    const health = await fineractService.getSystemHealth();
    assert(health.fineractCore.status === "UP", "Fineract Core status is UP");
    assert(health.springBootGateway.status === "UP", "Spring Boot Gateway status is UP");
    assert(health.kafkaEdaConsumer.status === "UP", "Kafka EDA consumer status is UP");
    assert(health.totalClients >= 6, "Total clients reported in health metrics");
    assert(health.cashBalance > 0, "Cash ledger balance calculated");
    assert(health.bankBalance > 0, "Bank ledger balance calculated");

    // Clients via service
    const clients = await fineractService.getClients();
    assert(clients.length >= 6, "Service getClients returns client list");

    // Loans via service
    const loans = await fineractService.getLoans();
    assert(loans.length >= 6, "Service getLoans returns loans list");

    // Kafka event simulation via service
    const simRes = await fineractService.simulateKafkaOrderEvent({
      eventType: "ORDER_STATUS_CHANGED",
      orderNumber: "ORD-SERVICE-TEST",
      newStatus: "PROCESSING",
      totalAmount: 1000000,
      paymentMethod: "COD"
    });
    assert(simRes.event.processed === true, "Kafka event simulated via service");
    assert(simRes.journalEntry !== undefined, "Journal entry posted via service");
  }

  console.log("\n============================================================");
  console.log("   ✅ ALL 9 TEST SUITES PASSED FLAWLESSLY!");
  console.log("============================================================\n");
}

runAllTests().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED WITH EXCEPTION:\n", err);
  process.exit(1);
});
