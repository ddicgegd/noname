/**
 * Apache Fineract High-Fidelity Stateful Simulation Engine & Mock Store
 * Features LocalStorage persistence, strict FSM loan state machine,
 * double-entry GL balance validation, GL resolver matrix, and Kafka EDA processing.
 */

import {
  FineractClient,
  CreateClientPayload,
  LoanProduct,
  LoanAccount,
  LoanStatus,
  LoanStatusCode,
  LoanTransaction,
  RepaymentSchedule,
  RepaymentSchedulePeriod,
  CreateLoanPayload,
  JournalEntry,
  JournalEntryTransaction,
  CreateJournalEntryPayload,
  GlAccountInfo,
  GlAccountResolverMatrix,
  KafkaOrderEvent,
  FineractHealthStatus
} from "../types/fineract";

// ============================================================================
// Storage Key & Environment Utilities
// ============================================================================

export const FINERACT_MOCK_STORAGE_KEY = "fineract_mock_store_v1";

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[FineractMockStore] Failed to read from localStorage:", err);
    return defaultValue;
  }
}

function saveToLocalStorage<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[FineractMockStore] Failed to save to localStorage:", err);
  }
}

// ============================================================================
// Date & Currency Helpers
// ============================================================================

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function formatDateToFineract(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function parseFineractDate(dateInput: string | [number, number, number] | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  if (Array.isArray(dateInput)) {
    return new Date(dateInput[0], dateInput[1] - 1, dateInput[2]);
  }
  if (typeof dateInput === "string") {
    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      return new Date(dateInput);
    }
    // Try "DD MMMM YYYY"
    const parts = dateInput.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthIndex = MONTH_NAMES.findIndex(
        m => m.toLowerCase() === parts[1].toLowerCase()
      );
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function isDateInFuture(dateInput: string | Date): boolean {
  const target = parseFineractDate(dateInput);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return target.getTime() > today.getTime();
}

// ============================================================================
// Vietnamese Name Parser
// ============================================================================

export function parseVietnameseName(fullName: string): { firstname: string; lastname: string } {
  if (!fullName || fullName.trim().length === 0) {
    throw createFineractError(
      400,
      "The parameter fullName cannot be empty or null.",
      "Họ và tên khách hàng không được để trống.",
      "error.msg.client.name.required",
      "fullName"
    );
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstname: parts[0], lastname: parts[0] };
  }

  const firstname = parts[parts.length - 1];
  const lastname = parts.slice(0, parts.length - 1).join(" ");
  return { firstname, lastname };
}

// ============================================================================
// Authentic Fineract Error Factory
// ============================================================================

export function createFineractError(
  httpStatusCode: number,
  developerMessage: string,
  defaultUserMessage: string,
  userMessageGlobalisationCode: string,
  parameterName?: string
) {
  const fineractResponse = {
    developerMessage,
    httpStatusCode: String(httpStatusCode),
    defaultUserMessage,
    userMessageGlobalisationCode,
    parameterName
  };

  const err: any = new Error(defaultUserMessage);
  err.httpStatusCode = httpStatusCode;
  err.status = httpStatusCode;
  err.data = {
    status: "error",
    httpStatusCode,
    message: defaultUserMessage,
    fineractResponse: JSON.stringify(fineractResponse)
  };
  return err;
}

// ============================================================================
// Status Helper Factory
// ============================================================================

export function createLoanStatus(code: LoanStatusCode): LoanStatus {
  switch (code) {
    case 100:
      return {
        id: 100,
        code: "loanStatusType.submitted.and.pending.approval",
        value: "Chờ phê duyệt (Pending Approval)",
        pendingApproval: true,
        waitingForDisbursal: false,
        active: false,
        closedObligationsMet: false,
        closed: false,
        overpaid: false
      };
    case 200:
      return {
        id: 200,
        code: "loanStatusType.approved",
        value: "Đã phê duyệt (Approved)",
        pendingApproval: false,
        waitingForDisbursal: true,
        active: false,
        closedObligationsMet: false,
        closed: false,
        overpaid: false
      };
    case 300:
      return {
        id: 300,
        code: "loanStatusType.active",
        value: "Đang hoạt động (Active)",
        pendingApproval: false,
        waitingForDisbursal: false,
        active: true,
        closedObligationsMet: false,
        closed: false,
        overpaid: false
      };
    case 400:
      return {
        id: 400,
        code: "loanStatusType.withdrawn.by.applicant",
        value: "Đã rút hồ sơ (Withdrawn)",
        pendingApproval: false,
        waitingForDisbursal: false,
        active: false,
        closedObligationsMet: false,
        closed: true,
        overpaid: false
      };
    case 500:
      return {
        id: 500,
        code: "loanStatusType.rejected",
        value: "Bị từ chối (Rejected)",
        pendingApproval: false,
        waitingForDisbursal: false,
        active: false,
        closedObligationsMet: false,
        closed: true,
        overpaid: false
      };
    case 600:
      return {
        id: 600,
        code: "loanStatusType.closed.obligations.met",
        value: "Đã tất toán (Obligations Met)",
        pendingApproval: false,
        waitingForDisbursal: false,
        active: false,
        closedObligationsMet: true,
        closed: true,
        overpaid: false
      };
    default:
      return createLoanStatus(100);
  }
}

// ============================================================================
// Repayment Schedule Generator
// ============================================================================

export function generateRepaymentSchedule(
  principal: number,
  numberOfRepayments: number,
  interestRatePerPeriod: number,
  startDateInput: string | Date = new Date()
): RepaymentSchedule {
  const startDate = parseFineractDate(startDateInput);
  const periods: RepaymentSchedulePeriod[] = [];

  // Period 0: Disbursement event
  periods.push({
    period: 0,
    dueDate: formatDateToFineract(startDate),
    principalOriginalDue: 0,
    principalDue: 0,
    principalPaid: 0,
    principalOutstanding: principal,
    interestOriginalDue: 0,
    interestDue: 0,
    interestPaid: 0,
    interestOutstanding: 0,
    feeChargesDue: 0,
    feeChargesPaid: 0,
    feeChargesOutstanding: 0,
    penaltyChargesDue: 0,
    penaltyChargesPaid: 0,
    penaltyChargesOutstanding: 0,
    totalOriginalDueForPeriod: 0,
    totalDueForPeriod: 0,
    totalPaidForPeriod: 0,
    totalPaidInAdvanceForPeriod: 0,
    totalPaidLateForPeriod: 0,
    totalOutstandingForPeriod: 0,
    complete: true
  });

  const principalPerPeriod = Math.round(principal / numberOfRepayments);
  let remainingPrincipal = principal;
  let totalInterest = 0;

  for (let i = 1; i <= numberOfRepayments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    // Last period absorbs rounding differences
    const principalDue = i === numberOfRepayments ? remainingPrincipal : principalPerPeriod;
    remainingPrincipal -= principalDue;

    // Interest on remaining balance at this period
    const interestDue = Math.round((principal * (interestRatePerPeriod / 100)));
    totalInterest += interestDue;
    const totalDue = principalDue + interestDue;

    periods.push({
      period: i,
      dueDate: formatDateToFineract(dueDate),
      principalOriginalDue: principalDue,
      principalDue,
      principalPaid: 0,
      principalOutstanding: principalDue,
      interestOriginalDue: interestDue,
      interestDue,
      interestPaid: 0,
      interestOutstanding: interestDue,
      feeChargesDue: 0,
      feeChargesPaid: 0,
      feeChargesOutstanding: 0,
      penaltyChargesDue: 0,
      penaltyChargesPaid: 0,
      penaltyChargesOutstanding: 0,
      totalOriginalDueForPeriod: totalDue,
      totalDueForPeriod: totalDue,
      totalPaidForPeriod: 0,
      totalPaidInAdvanceForPeriod: 0,
      totalPaidLateForPeriod: 0,
      totalOutstandingForPeriod: totalDue,
      complete: false
    });
  }

  const totalRepaymentExpected = principal + totalInterest;

  return {
    currency: {
      code: "VND",
      name: "Vietnamese Dong",
      decimalPlaces: 0
    },
    loanTermInDays: numberOfRepayments * 30,
    totalPrincipalDisbursed: principal,
    totalPrincipalExpected: principal,
    totalPrincipalPaid: 0,
    totalInterestCharged: totalInterest,
    totalFeeChargesCharged: 0,
    totalPenaltyChargesCharged: 0,
    totalWaived: 0,
    totalWrittenOff: 0,
    totalRepaymentExpected,
    totalRepayment: 0,
    totalOutstanding: totalRepaymentExpected,
    periods
  };
}

// ============================================================================
// Initial Seed Data Definitions
// ============================================================================

export const INITIAL_GL_ACCOUNTS: GlAccountInfo[] = [
  {
    id: 1,
    code: "1111",
    name: "Tiền mặt tại quỹ (Cash on Hand)",
    type: "ASSET",
    description: "Tài khoản tiền mặt thanh toán trực tiếp hoặc thu hộ COD"
  },
  {
    id: 2,
    code: "5111",
    name: "Doanh thu bán hàng hóa (Sales Revenue)",
    type: "INCOME",
    description: "Doanh thu ghi nhận từ đơn hàng thương mại điện tử thành công"
  },
  {
    id: 3,
    code: "5212",
    name: "Hàng bán bị trả lại (Sales Returns)",
    type: "EXPENSE",
    description: "Tài khoản giảm trừ doanh thu khi hoàn tiền hoặc trả hàng"
  },
  {
    id: 4,
    code: "1121",
    name: "Tiền gửi ngân hàng (Bank Deposits)",
    type: "ASSET",
    description: "Tài khoản cổng thanh toán ngân hàng, VNPAY, Thẻ, Ví điện tử"
  }
];

export const GL_RESOLVER_MATRIX: GlAccountResolverMatrix = {
  cashGlAccount: INITIAL_GL_ACCOUNTS[0],
  salesRevenueGlAccount: INITIAL_GL_ACCOUNTS[1],
  salesReturnsGlAccount: INITIAL_GL_ACCOUNTS[2],
  bankGlAccount: INITIAL_GL_ACCOUNTS[3]
};

export const INITIAL_CLIENTS: FineractClient[] = [];

export const INITIAL_LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: 1,
    name: "Vay tiêu dùng nhanh Horizon (ERP-LN01)",
    shortName: "ERP-LN01",
    description: "Gói tín dụng tiêu dùng tín chấp trả góp linh hoạt từ 1 triệu đến 50 triệu VND",
    currency: { code: "VND", name: "Vietnamese Dong", decimalPlaces: 0 },
    principal: 10000000,
    minPrincipal: 1000000,
    maxPrincipal: 50000000,
    numberOfRepayments: 6,
    repaymentEvery: 1,
    repaymentFrequencyType: { id: 2, code: "repaymentFrequency.months", value: "Tháng (Months)" },
    interestRatePerPeriod: 1.2,
    annualInterestRate: 14.4,
    amortizationType: { id: 1, code: "amortizationType.equal.installments", value: "Trả góp định kỳ đều" },
    interestType: { id: 0, code: "interestType.declining.balance", value: "Dư nợ giảm dần" },
    status: "ACTIVE"
  },
  {
    id: 2,
    name: "Tín dụng tiểu thương ERP (ERP-LN02)",
    shortName: "ERP-LN02",
    description: "Hạn mức vốn lưu động kinh doanh cho đối tác bán hàng từ 10 triệu đến 200 triệu VND",
    currency: { code: "VND", name: "Vietnamese Dong", decimalPlaces: 0 },
    principal: 50000000,
    minPrincipal: 10000000,
    maxPrincipal: 200000000,
    numberOfRepayments: 12,
    repaymentEvery: 1,
    repaymentFrequencyType: { id: 2, code: "repaymentFrequency.months", value: "Tháng (Months)" },
    interestRatePerPeriod: 0.95,
    annualInterestRate: 11.4,
    amortizationType: { id: 1, code: "amortizationType.equal.installments", value: "Trả góp định kỳ đều" },
    interestType: { id: 0, code: "interestType.declining.balance", value: "Dư nợ giảm dần" },
    status: "ACTIVE"
  }
];

function buildInitialLoans(): LoanAccount[] {
  return [];
}

function buildInitialJournalEntries(): { entries: JournalEntry[]; transactions: JournalEntryTransaction[] } {
  return { entries: [], transactions: [] };
}

export const INITIAL_KAFKA_EVENTS: KafkaOrderEvent[] = [];

// ============================================================================
// Internal Store State Schema
// ============================================================================

export interface FineractMockState {
  clients: FineractClient[];
  loanProducts: LoanProduct[];
  loans: LoanAccount[];
  glAccounts: GlAccountInfo[];
  journalEntries: JournalEntry[];
  journalTransactions: JournalEntryTransaction[];
  kafkaEvents: KafkaOrderEvent[];
  lastTransactionSequence: number;
}

// ============================================================================
// Core Stateful Store Implementation
// ============================================================================

export class FineractMockStore {
  private state: FineractMockState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private createFreshSeedState(): FineractMockState {
    const { entries, transactions } = buildInitialJournalEntries();
    return {
      clients: JSON.parse(JSON.stringify(INITIAL_CLIENTS)),
      loanProducts: JSON.parse(JSON.stringify(INITIAL_LOAN_PRODUCTS)),
      loans: buildInitialLoans(),
      glAccounts: JSON.parse(JSON.stringify(INITIAL_GL_ACCOUNTS)),
      journalEntries: entries,
      journalTransactions: transactions,
      kafkaEvents: JSON.parse(JSON.stringify(INITIAL_KAFKA_EVENTS)),
      lastTransactionSequence: 100
    };
  }

  private loadInitialState(): FineractMockState {
    const saved = loadFromLocalStorage<FineractMockState | null>(FINERACT_MOCK_STORAGE_KEY, null);
    if (saved && Array.isArray(saved.clients) && Array.isArray(saved.loans) && Array.isArray(saved.journalEntries)) {
      return saved;
    }
    const fresh = this.createFreshSeedState();
    saveToLocalStorage(FINERACT_MOCK_STORAGE_KEY, fresh);
    return fresh;
  }

  private persist(): void {
    saveToLocalStorage(FINERACT_MOCK_STORAGE_KEY, this.state);
  }

  /**
   * Reset store to pristine initial state (empty fake data)
   */
  public resetStore(): void {
    this.state = this.createFreshSeedState();
    this.persist();
  }

  /**
   * Seed standard test fixtures dynamically for test suites
   */
  public seedTestFixtures(): void {
    this.resetStore();
    
    // Seed 5 test clients
    const c1 = this.createClient({ fullName: "Nguyễn Văn An", emailAddress: "nguyenvanan@example.com", mobileNo: "0901234567", externalId: "101" });
    const c2 = this.createClient({ fullName: "Trần Thị Mai", emailAddress: "tranthimai@example.com", mobileNo: "0912345678", externalId: "102" });
    const c3 = this.createClient({ fullName: "Lê Hoàng Long", emailAddress: "lehoanglong@example.com", mobileNo: "0923456789", externalId: "103" });
    const c4 = this.createClient({ fullName: "Phạm Minh Đức", emailAddress: "phamminhduc@example.com", mobileNo: "0934567890", externalId: "104" });
    const c5 = this.createClient({ fullName: "Hoàng Thu Thảo", emailAddress: "hoangthuthao@example.com", mobileNo: "0945678901", externalId: "105" });

    // Seed 1 pending loan (Loan 1)
    this.createLoan({
      clientId: c1.id,
      productId: 1,
      principal: 15000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "15 September 2026",
      submittedOnDate: "10 August 2026"
    });

    // Seed 1 approved loan (Loan 2)
    const l2 = this.createLoan({
      clientId: c2.id,
      productId: 1,
      principal: 20000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "20 August 2026",
      submittedOnDate: "05 August 2026"
    });
    this.approveLoan(l2.id, "15 August 2026", "Approved for test");

    // Seed 1 active loan (Loan 3)
    const l3 = this.createLoan({
      clientId: c3.id,
      productId: 1,
      principal: 25000000,
      loanTermFrequency: 6,
      loanTermFrequencyType: 2,
      numberOfRepayments: 6,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "01 July 2026",
      submittedOnDate: "25 June 2026"
    });
    this.approveLoan(l3.id, "28 June 2026", "Approved for test");
    this.disburseLoan(l3.id, "01 July 2026", "Disbursed for test");

    // Seed 1 closed loan (Loan 4)
    const l4 = this.createLoan({
      clientId: c4.id,
      productId: 1,
      principal: 10000000,
      loanTermFrequency: 3,
      loanTermFrequencyType: 2,
      numberOfRepayments: 3,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 1.2,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "01 May 2026",
      submittedOnDate: "25 April 2026"
    });
    this.approveLoan(l4.id, "28 April 2026", "Approved for test");
    const d4 = this.disburseLoan(l4.id, "01 May 2026", "Disbursed for test");
    this.repayLoan(l4.id, d4.summary.totalOutstanding, "01 August 2026");

    // Seed 1 rejected loan (Loan 5)
    const l5 = this.createLoan({
      clientId: c5.id,
      productId: 2,
      principal: 50000000,
      loanTermFrequency: 12,
      loanTermFrequencyType: 2,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 0.95,
      amortizationType: 1,
      interestType: 0,
      expectedDisbursementDate: "01 June 2026",
      submittedOnDate: "01 June 2026"
    });
    this.rejectLoan(l5.id, "05 June 2026", "Rejected for test");

    this.persist();
  }

  // ==========================================================================
  // Client Subsystem Methods
  // ==========================================================================

  public getClients(role?: "admin" | "customer", externalId?: string): FineractClient[] {
    if (role === "customer" && externalId) {
      return this.state.clients.filter(c => c.externalId === externalId);
    }
    return [...this.state.clients];
  }

  public getClient(id: number): FineractClient {
    const client = this.state.clients.find(c => c.id === id);
    if (!client) {
      throw createFineractError(
        404,
        `Client with identifier ${id} does not exist`,
        `Không tìm thấy khách hàng với mã ${id}.`,
        "error.msg.client.id.invalid",
        "id"
      );
    }
    return JSON.parse(JSON.stringify(client));
  }

  public createClient(payload: CreateClientPayload): FineractClient {
    let firstname = payload.firstname?.trim() || "";
    let lastname = payload.lastname?.trim() || "";

    if ((!firstname || !lastname) && payload.fullName) {
      const parsed = parseVietnameseName(payload.fullName);
      firstname = parsed.firstname;
      lastname = parsed.lastname;
    }

    if (!firstname || !lastname) {
      throw createFineractError(
        400,
        "The parameter firstname and lastname cannot be empty",
        "Họ và tên khách hàng là bắt buộc, không được để trống.",
        "error.msg.client.name.required",
        "firstname"
      );
    }

    // Check externalId uniqueness
    if (payload.externalId) {
      const exists = this.state.clients.some(c => c.externalId === payload.externalId);
      if (exists) {
        throw createFineractError(
          403,
          `Client with externalId ${payload.externalId} already exists`,
          `Khách hàng với mã liên kết ${payload.externalId} đã tồn tại trong hệ thống.`,
          "error.msg.client.externalId.already.exists",
          "externalId"
        );
      }
    }

    const nextId = this.state.clients.length > 0 ? Math.max(...this.state.clients.map(c => c.id)) + 1 : 1;
    const accountNo = String(nextId).padStart(9, "0");
    const activationDateStr = payload.activationDate || formatDateToFineract();

    const newClient: FineractClient = {
      id: nextId,
      accountNo,
      status: {
        id: payload.active !== false ? 300 : 100,
        code: payload.active !== false ? "clientStatusType.active" : "clientStatusType.pending",
        value: payload.active !== false ? "Hoạt động (Active)" : "Chờ duyệt (Pending)"
      },
      active: payload.active !== false,
      activationDate: activationDateStr,
      firstname,
      lastname,
      displayName: `${lastname} ${firstname}`,
      officeId: payload.officeId || 1,
      officeName: "Trụ sở chính (Head Office)",
      externalId: payload.externalId,
      emailAddress: payload.emailAddress,
      mobileNo: payload.mobileNo,
      legalFormId: payload.legalFormId || 1,
      timeline: {
        submittedOnDate: formatDateToFineract(),
        activatedOnDate: payload.active !== false ? activationDateStr : undefined
      }
    };

    this.state.clients.push(newClient);
    this.persist();
    return JSON.parse(JSON.stringify(newClient));
  }

  // ==========================================================================
  // Loan Subsystem & State Machine Methods
  // ==========================================================================

  public getLoanProducts(): LoanProduct[] {
    return [...this.state.loanProducts];
  }

  public getLoans(clientId?: number): LoanAccount[] {
    if (typeof clientId === "number") {
      return this.state.loans.filter(l => l.clientId === clientId);
    }
    return [...this.state.loans];
  }

  public getLoan(id: number): LoanAccount {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(
        404,
        `Loan with identifier ${id} does not exist`,
        `Không tìm thấy hồ sơ khoản vay với mã ${id}.`,
        "error.msg.loan.id.invalid",
        "id"
      );
    }
    return JSON.parse(JSON.stringify(loan));
  }

  public createLoan(payload: CreateLoanPayload): LoanAccount {
    const client = this.getClient(payload.clientId);
    const product = this.state.loanProducts.find(p => p.id === payload.productId);

    if (!product) {
      throw createFineractError(
        404,
        `Loan product with identifier ${payload.productId} does not exist`,
        `Gói sản phẩm vay ${payload.productId} không tồn tại.`,
        "error.msg.loan.product.invalid",
        "productId"
      );
    }

    if (payload.principal <= 0) {
      throw createFineractError(
        400,
        "The principal amount cannot be zero or negative",
        "Số tiền đề nghị vay phải lớn hơn 0.",
        "error.msg.loan.principal.amount.cannot.be.zero.or.negative",
        "principal"
      );
    }

    if (payload.principal < product.minPrincipal || payload.principal > product.maxPrincipal) {
      throw createFineractError(
        403,
        `Principal must be between ${product.minPrincipal} and ${product.maxPrincipal}`,
        `Số tiền vay phải nằm trong khoảng từ ${product.minPrincipal.toLocaleString()} ₫ đến ${product.maxPrincipal.toLocaleString()} ₫.`,
        "error.msg.loan.principal.out.of.bounds",
        "principal"
      );
    }

    const nextId = this.state.loans.length > 0 ? Math.max(...this.state.loans.map(l => l.id)) + 1 : 1;
    const accountNo = `LN${String(nextId).padStart(9, "0")}`;
    const schedule = generateRepaymentSchedule(
      payload.principal,
      payload.numberOfRepayments || product.numberOfRepayments,
      payload.interestRatePerPeriod || product.interestRatePerPeriod,
      payload.expectedDisbursementDate || new Date()
    );

    const newLoan: LoanAccount = {
      id: nextId,
      accountNo,
      externalId: payload.externalId || `LOAN-EXT-${nextId}`,
      clientId: client.id,
      clientName: client.displayName,
      clientAccountNo: client.accountNo,
      loanProductId: product.id,
      loanProductName: product.name,
      loanProductDescription: product.description,
      status: createLoanStatus(100),
      principal: payload.principal,
      approvedPrincipal: payload.principal,
      numberOfRepayments: payload.numberOfRepayments || product.numberOfRepayments,
      repaymentEvery: payload.repaymentEvery || product.repaymentEvery,
      repaymentFrequencyType: product.repaymentFrequencyType,
      interestRatePerPeriod: payload.interestRatePerPeriod || product.interestRatePerPeriod,
      annualInterestRate: product.annualInterestRate,
      termFrequency: payload.loanTermFrequency || product.numberOfRepayments,
      termPeriodFrequencyType: product.repaymentFrequencyType,
      submittedOnDate: payload.submittedOnDate || formatDateToFineract(),
      expectedDisbursementDate: payload.expectedDisbursementDate || formatDateToFineract(),
      summary: {
        currency: { code: "VND", decimalPlaces: 0 },
        principalDisbursed: 0,
        principalPaid: 0,
        principalOutstanding: payload.principal,
        interestCharged: schedule.totalInterestCharged,
        interestPaid: 0,
        interestOutstanding: schedule.totalInterestCharged,
        feeChargesCharged: 0,
        feeChargesPaid: 0,
        feeChargesOutstanding: 0,
        penaltyChargesCharged: 0,
        penaltyChargesPaid: 0,
        penaltyChargesOutstanding: 0,
        totalExpectedRepayment: schedule.totalRepaymentExpected,
        totalRepayment: 0,
        totalOutstanding: schedule.totalRepaymentExpected
      },
      repaymentSchedule: schedule,
      transactions: []
    };

    this.state.loans.push(newLoan);
    this.persist();
    return JSON.parse(JSON.stringify(newLoan));
  }

  /**
   * FSM Transition: 100 (PENDING_APPROVAL) -> 200 (APPROVED)
   */
  public approveLoan(id: number, dateStr: string, _note?: string): LoanAccount {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(404, `Loan ${id} not found`, "Không tìm thấy hồ sơ khoản vay.", "error.msg.loan.not.found", "id");
    }

    if (loan.status.id !== 100) {
      throw createFineractError(
        403,
        `Loan is in status ${loan.status.id}. Only loans in status 100 can be approved.`,
        "Chỉ có thể phê duyệt hồ sơ khoản vay đang ở trạng thái Chờ duyệt (Pending Approval).",
        "error.msg.loan.approval.not.allowed.in.current.state",
        "id"
      );
    }

    if (isDateInFuture(dateStr)) {
      throw createFineractError(
        403,
        "The date on which a loan is approved cannot be in the future.",
        "Ngày phê duyệt khoản vay không thể ở tương lai.",
        "error.msg.loan.approval.cannot.be.in.the.future",
        "approvedOnDate"
      );
    }

    loan.status = createLoanStatus(200);
    loan.approvedOnDate = dateStr;
    this.persist();
    return JSON.parse(JSON.stringify(loan));
  }

  /**
   * FSM Transition: 200 (APPROVED) -> 300 (ACTIVE)
   */
  public disburseLoan(id: number, dateStr: string, _note?: string): LoanAccount {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(404, `Loan ${id} not found`, "Không tìm thấy hồ sơ khoản vay.", "error.msg.loan.not.found", "id");
    }

    if (loan.status.id !== 200) {
      throw createFineractError(
        403,
        `Loan is in status ${loan.status.id}. Only approved loans (status 200) can be disbursed.`,
        "Chỉ có thể giải ngân khoản vay đã được Phê duyệt (Approved).",
        "error.msg.loan.disbursement.not.allowed.in.current.state",
        "id"
      );
    }

    const disburseDate = parseFineractDate(dateStr);
    const approvedDate = parseFineractDate(loan.approvedOnDate || loan.submittedOnDate);

    if (disburseDate.getTime() < approvedDate.getTime()) {
      throw createFineractError(
        403,
        "Actual disbursement date cannot be before approval date.",
        "Ngày giải ngân thực tế không thể trước ngày phê duyệt khoản vay.",
        "error.msg.loan.disbursement.cannot.be.before.approval",
        "actualDisbursementDate"
      );
    }

    loan.status = createLoanStatus(300);
    loan.actualDisbursementDate = dateStr;
    loan.summary.principalDisbursed = loan.principal;

    // Recalculate schedule starting from actual disbursement date
    loan.repaymentSchedule = generateRepaymentSchedule(
      loan.principal,
      loan.numberOfRepayments,
      loan.interestRatePerPeriod,
      dateStr
    );

    // Add disbursement transaction
    const txId = ++this.state.lastTransactionSequence;
    loan.transactions = loan.transactions || [];
    loan.transactions.push({
      id: txId,
      officeId: 1,
      type: { id: 1, code: "loanTransactionType.disbursement", value: "Giải ngân (Disbursement)" },
      date: dateStr,
      currency: { code: "VND" },
      amount: loan.principal,
      outstandingLoanBalance: loan.principal,
      manuallyReversed: false,
      transactionDate: dateStr
    });

    this.persist();
    return JSON.parse(JSON.stringify(loan));
  }

  /**
   * FSM Transition: 100 (PENDING_APPROVAL) -> 500 (REJECTED)
   */
  public rejectLoan(id: number, dateStr: string, _note?: string): LoanAccount {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(404, `Loan ${id} not found`, "Không tìm thấy hồ sơ khoản vay.", "error.msg.loan.not.found", "id");
    }

    if (loan.status.id !== 100) {
      throw createFineractError(
        403,
        `Loan is in status ${loan.status.id}. Only pending loans can be rejected.`,
        "Chỉ có thể từ chối hồ sơ khoản vay đang ở trạng thái Chờ duyệt (Pending Approval).",
        "error.msg.loan.reject.not.allowed.in.current.state",
        "id"
      );
    }

    loan.status = createLoanStatus(500);
    loan.closedOnDate = dateStr;
    this.persist();
    return JSON.parse(JSON.stringify(loan));
  }

  /**
   * FSM Transition: 100 (PENDING_APPROVAL) -> 400 (WITHDRAWN)
   */
  public withdrawLoan(id: number, dateStr: string, _note?: string): LoanAccount {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(404, `Loan ${id} not found`, "Không tìm thấy hồ sơ khoản vay.", "error.msg.loan.not.found", "id");
    }

    if (loan.status.id !== 100) {
      throw createFineractError(
        403,
        `Loan is in status ${loan.status.id}. Only pending loans can be withdrawn.`,
        "Chỉ có thể rút lại hồ sơ vay khi đang ở trạng thái Chờ duyệt (Pending Approval).",
        "error.msg.loan.withdraw.not.allowed.in.current.state",
        "id"
      );
    }

    loan.status = createLoanStatus(400);
    loan.closedOnDate = dateStr;
    this.persist();
    return JSON.parse(JSON.stringify(loan));
  }

  /**
   * FSM Transition: 300 (ACTIVE) -> 300 or 600 (OBLIGATIONS_MET when balance reaches 0)
   */
  public repayLoan(
    id: number,
    amount: number,
    dateStr: string
  ): { loan: LoanAccount; transactionId: number } {
    const loan = this.state.loans.find(l => l.id === id);
    if (!loan) {
      throw createFineractError(404, `Loan ${id} not found`, "Không tìm thấy hồ sơ khoản vay.", "error.msg.loan.not.found", "id");
    }

    if (loan.status.id !== 300) {
      throw createFineractError(
        403,
        `Loan is in status ${loan.status.id}. Only active loans can accept repayments.`,
        "Chỉ có thể thanh toán trả góp cho khoản vay đang ở trạng thái Hoạt động (Active).",
        "error.msg.loan.repayment.not.allowed.in.current.state",
        "id"
      );
    }

    if (amount <= 0) {
      throw createFineractError(
        400,
        "Repayment amount must be greater than zero",
        "Số tiền thanh toán phải lớn hơn 0.",
        "error.msg.loan.transaction.amount.must.be.greater.than.zero",
        "transactionAmount"
      );
    }

    if (amount > loan.summary.totalOutstanding + 0.01) {
      throw createFineractError(
        403,
        `Repayment amount (${amount}) exceeds total outstanding (${loan.summary.totalOutstanding})`,
        `Số tiền thanh toán (${amount.toLocaleString()} ₫) không thể vượt quá tổng dư nợ còn lại (${loan.summary.totalOutstanding.toLocaleString()} ₫).`,
        "error.msg.loan.repayment.amount.cannot.exceed.outstanding",
        "transactionAmount"
      );
    }

    // Waterfall repayment allocation across schedule periods
    let remainingPayment = amount;
    let principalPaidThisTx = 0;
    let interestPaidThisTx = 0;

    if (loan.repaymentSchedule && loan.repaymentSchedule.periods) {
      for (const period of loan.repaymentSchedule.periods) {
        if (period.period === 0 || period.complete) continue;
        if (remainingPayment <= 0) break;

        // Pay interest first
        const interestDue = period.interestOutstanding;
        if (interestDue > 0) {
          const interestPay = Math.min(remainingPayment, interestDue);
          period.interestPaid += interestPay;
          period.interestOutstanding -= interestPay;
          remainingPayment -= interestPay;
          interestPaidThisTx += interestPay;
        }

        // Pay principal second
        const principalDue = period.principalOutstanding;
        if (principalDue > 0 && remainingPayment > 0) {
          const principalPay = Math.min(remainingPayment, principalDue);
          period.principalPaid += principalPay;
          period.principalOutstanding -= principalPay;
          remainingPayment -= principalPay;
          principalPaidThisTx += principalPay;
        }

        period.totalPaidForPeriod = period.principalPaid + period.interestPaid;
        period.totalOutstandingForPeriod = period.principalOutstanding + period.interestOutstanding;
        if (period.totalOutstandingForPeriod <= 0.001) {
          period.complete = true;
          period.totalOutstandingForPeriod = 0;
        }
      }
    } else {
      principalPaidThisTx = amount;
    }

    // Update loan summary
    loan.summary.principalPaid += principalPaidThisTx;
    loan.summary.principalOutstanding = Math.max(0, loan.summary.principalDisbursed - loan.summary.principalPaid);
    loan.summary.interestPaid += interestPaidThisTx;
    loan.summary.interestOutstanding = Math.max(0, loan.summary.interestCharged - loan.summary.interestPaid);
    loan.summary.totalRepayment += amount;
    loan.summary.totalOutstanding = Math.max(0, loan.summary.totalExpectedRepayment - loan.summary.totalRepayment);

    // Record transaction
    const txId = ++this.state.lastTransactionSequence;
    loan.transactions = loan.transactions || [];
    loan.transactions.push({
      id: txId,
      officeId: 1,
      type: { id: 2, code: "loanTransactionType.repayment", value: "Thanh toán trả nợ (Repayment)" },
      date: dateStr,
      currency: { code: "VND" },
      amount,
      principalPortion: principalPaidThisTx,
      interestPortion: interestPaidThisTx,
      outstandingLoanBalance: loan.summary.totalOutstanding,
      manuallyReversed: false,
      transactionDate: dateStr
    });

    // Check terminal obligations met transition: 300 -> 600
    if (loan.summary.totalOutstanding <= 0.001) {
      loan.status = createLoanStatus(600);
      loan.closedOnDate = dateStr;
    }

    this.persist();
    return {
      loan: JSON.parse(JSON.stringify(loan)),
      transactionId: txId
    };
  }

  // ==========================================================================
  // General Ledger Subsystem Methods
  // ==========================================================================

  public getGlAccounts(): GlAccountInfo[] {
    return [...this.state.glAccounts];
  }

  public getJournalEntries(): JournalEntry[] {
    return [...this.state.journalEntries].reverse();
  }

  public getJournalTransactions(): JournalEntryTransaction[] {
    return [...this.state.journalTransactions].reverse();
  }

  /**
   * Validate double-entry invariant: Sum(Debit) == Sum(Credit)
   */
  public validateDoubleEntryInvariant(payload: CreateJournalEntryPayload): {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  } {
    if (!payload.debits || payload.debits.length === 0) {
      throw createFineractError(
        400,
        "At least one debit entry is required",
        "Bắt buộc phải có ít nhất 1 dòng ghi Nợ (Debit).",
        "validation.msg.journalentry.debits.empty",
        "debits"
      );
    }

    if (!payload.credits || payload.credits.length === 0) {
      throw createFineractError(
        400,
        "At least one credit entry is required",
        "Bắt buộc phải có ít nhất 1 dòng ghi Có (Credit).",
        "validation.msg.journalentry.credits.empty",
        "credits"
      );
    }

    const totalDebit = payload.debits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalCredit = payload.credits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = diff < 0.001 && totalDebit > 0;

    if (!isBalanced) {
      throw createFineractError(
        400,
        `Double entry invariant violated: sum(Debits)=${totalDebit} != sum(Credits)=${totalCredit}`,
        `Nguyên tắc kế toán kép vi phạm: Tổng Nợ (${totalDebit.toLocaleString()} ₫) khác Tổng Có (${totalCredit.toLocaleString()} ₫).`,
        "error.msg.gl.double.entry.imbalanced",
        "debits"
      );
    }

    return { totalDebit, totalCredit, isBalanced };
  }

  /**
   * Post manual double-entry journal voucher
   */
  public createJournalEntry(payload: CreateJournalEntryPayload): JournalEntryTransaction {
    const { totalDebit, totalCredit } = this.validateDoubleEntryInvariant(payload);

    const now = new Date();
    const dateStr = payload.transactionDate || formatDateToFineract(now);
    const txId = `TX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(++this.state.lastTransactionSequence).padStart(4, "0")}`;

    let nextLineId = this.state.journalEntries.length > 0
      ? Math.max(...this.state.journalEntries.map(e => e.id)) + 1
      : 1;

    const lines: JournalEntry[] = [];

    // Create Debit lines
    for (const d of payload.debits) {
      const glAccount = this.state.glAccounts.find(a => a.id === d.glAccountId) || {
        id: d.glAccountId,
        code: String(d.glAccountId),
        name: `Tài khoản #${d.glAccountId}`,
        type: "ASSET" as const
      };

      lines.push({
        id: nextLineId++,
        officeId: payload.officeId || 1,
        officeName: "Trụ sở chính (Head Office)",
        glAccountId: glAccount.id,
        glAccountName: glAccount.name,
        glAccountCode: glAccount.code,
        glAccountType: { id: 1, code: glAccount.type, value: glAccount.type },
        transactionDate: dateStr,
        entryType: { id: 1, code: "DEBIT", value: "DEBIT" },
        amount: d.amount,
        transactionId: txId,
        manualEntry: true,
        referenceNumber: payload.referenceNumber,
        comments: payload.comments,
        currency: { code: payload.currencyCode || "VND", name: "Vietnamese Dong", decimalPlaces: 0 },
        submittedOnDate: dateStr
      });
    }

    // Create Credit lines
    for (const c of payload.credits) {
      const glAccount = this.state.glAccounts.find(a => a.id === c.glAccountId) || {
        id: c.glAccountId,
        code: String(c.glAccountId),
        name: `Tài khoản #${c.glAccountId}`,
        type: "INCOME" as const
      };

      lines.push({
        id: nextLineId++,
        officeId: payload.officeId || 1,
        officeName: "Trụ sở chính (Head Office)",
        glAccountId: glAccount.id,
        glAccountName: glAccount.name,
        glAccountCode: glAccount.code,
        glAccountType: { id: 2, code: glAccount.type, value: glAccount.type },
        transactionDate: dateStr,
        entryType: { id: 2, code: "CREDIT", value: "CREDIT" },
        amount: c.amount,
        transactionId: txId,
        manualEntry: true,
        referenceNumber: payload.referenceNumber,
        comments: payload.comments,
        currency: { code: payload.currencyCode || "VND", name: "Vietnamese Dong", decimalPlaces: 0 },
        submittedOnDate: dateStr
      });
    }

    const tx: JournalEntryTransaction = {
      transactionId: txId,
      transactionDate: dateStr,
      referenceNumber: payload.referenceNumber,
      comments: payload.comments,
      currency: payload.currencyCode || "VND",
      officeId: payload.officeId || 1,
      manualEntry: true,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      createdAt: now.toISOString()
    };

    this.state.journalEntries.push(...lines);
    this.state.journalTransactions.push(tx);
    this.persist();

    return JSON.parse(JSON.stringify(tx));
  }

  // ==========================================================================
  // GL Account Resolver Matrix & EDA Processor
  // ==========================================================================

  public resolveGlAccountsForOrder(paymentMethod: string, isRefund: boolean): {
    debitAccountId: number;
    creditAccountId: number;
    referencePrefix: string;
    description: string;
  } {
    const isCod = paymentMethod?.toUpperCase() === "COD";
    const cashId = GL_RESOLVER_MATRIX.cashGlAccount.id; // 1
    const bankId = GL_RESOLVER_MATRIX.bankGlAccount.id || cashId; // 4 (fallback: 1)
    const salesRevId = GL_RESOLVER_MATRIX.salesRevenueGlAccount.id; // 2
    const salesReturnId = GL_RESOLVER_MATRIX.salesReturnsGlAccount.id; // 3

    if (!isRefund) {
      // Sale: Debit Cash/Bank, Credit Sales Revenue
      return {
        debitAccountId: isCod ? cashId : bankId,
        creditAccountId: salesRevId,
        referencePrefix: "SALE",
        description: `Doanh thu bán hàng qua ${paymentMethod || "Cổng thanh toán"}`
      };
    } else {
      // Refund: Debit Sales Returns, Credit Cash/Bank
      return {
        debitAccountId: salesReturnId,
        creditAccountId: isCod ? cashId : bankId,
        referencePrefix: "REFUND",
        description: `Hoàn tiền trả hàng qua ${paymentMethod || "Cổng thanh toán"}`
      };
    }
  }

  /**
   * Process incoming Kafka order event according to EDA specifications
   */
  public processKafkaOrderEvent(event: KafkaOrderEvent): {
    event: KafkaOrderEvent;
    journalEntry?: JournalEntryTransaction;
  } {
    const now = new Date();
    const eventRecord: KafkaOrderEvent = {
      ...event,
      eventId: event.eventId || `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: event.timestamp || now.toISOString(),
      processed: false
    };

    // Filter non-financial statuses
    const ignoredStatuses = ["DELIVERED", "CANCELLED", "COMPLETED"];
    if (ignoredStatuses.includes(event.newStatus)) {
      eventRecord.note = `Bỏ qua sự kiện trạng thái ${event.newStatus} (Không phát sinh hạch toán tài chính)`;
      this.state.kafkaEvents.unshift(eventRecord);
      this.persist();
      return { event: eventRecord };
    }

    if (event.totalAmount <= 0) {
      eventRecord.note = `Bỏ qua: Giá trị đơn hàng không hợp lệ (${event.totalAmount.toLocaleString()} ₫)`;
      this.state.kafkaEvents.unshift(eventRecord);
      this.persist();
      return { event: eventRecord };
    }

    const isSale = event.newStatus === "PROCESSING" || (event.eventType === "ORDER_CREATED" && event.initialStatus === "PROCESSING");
    const isRefund = event.newStatus === "REFUNDED";

    if (!isSale && !isRefund) {
      eventRecord.note = `Không có quy tắc hạch toán cho trạng thái: ${event.newStatus}`;
      this.state.kafkaEvents.unshift(eventRecord);
      this.persist();
      return { event: eventRecord };
    }

    const { debitAccountId, creditAccountId, referencePrefix, description } =
      this.resolveGlAccountsForOrder(event.paymentMethod, isRefund);

    const refNo = `${referencePrefix}-${event.orderNumber}`;
    const comment = `${description} - Đơn hàng ${event.orderNumber}`;

    // Create journal entry with invariant check
    const journalTx = this.createJournalEntry({
      officeId: 1,
      transactionDate: formatDateToFineract(now),
      referenceNumber: refNo,
      comments: comment,
      currencyCode: "VND",
      debits: [{ glAccountId: debitAccountId, amount: event.totalAmount }],
      credits: [{ glAccountId: creditAccountId, amount: event.totalAmount }]
    });

    eventRecord.processed = true;
    eventRecord.journalTransactionId = journalTx.transactionId;
    eventRecord.note = `Đã tự động hạch toán bút toán ${refNo} (Nợ TK #${debitAccountId}, Có TK #${creditAccountId})`;

    this.state.kafkaEvents.unshift(eventRecord);
    this.persist();

    return {
      event: eventRecord,
      journalEntry: journalTx
    };
  }

  public getKafkaEvents(): KafkaOrderEvent[] {
    return [...this.state.kafkaEvents];
  }

  // ==========================================================================
  // Metrics & Health Computation
  // ==========================================================================

  public getSystemMetrics(): {
    totalClients: number;
    totalActiveLoans: number;
    totalOutstandingPrincipal: number;
    cashBalance: number;
    bankBalance: number;
  } {
    const totalClients = this.state.clients.length;
    const activeLoans = this.state.loans.filter(l => l.status.id === 300);
    const totalActiveLoans = activeLoans.length;
    const totalOutstandingPrincipal = activeLoans.reduce(
      (sum, l) => sum + (l.summary.principalOutstanding || 0),
      0
    );

    // Calculate Cash (TK 1111, ID 1) balance: sum(Debit) - sum(Credit)
    let cashBalance = 0;
    // Calculate Bank (TK 1121, ID 4) balance: sum(Debit) - sum(Credit)
    let bankBalance = 0;

    for (const entry of this.state.journalEntries) {
      if (entry.glAccountId === 1) {
        if (entry.entryType.value === "DEBIT") cashBalance += entry.amount;
        else cashBalance -= entry.amount;
      } else if (entry.glAccountId === 4) {
        if (entry.entryType.value === "DEBIT") bankBalance += entry.amount;
        else bankBalance -= entry.amount;
      }
    }

    return {
      totalClients,
      totalActiveLoans,
      totalOutstandingPrincipal,
      cashBalance,
      bankBalance
    };
  }

  public getHealthStatus(): FineractHealthStatus {
    const metrics = this.getSystemMetrics();
    return {
      fineractCore: {
        status: "UP",
        latencyMs: 12,
        endpoint: "mock://fineract-provider/api/v1",
        message: "High-fidelity mock sandbox engine operational",
        lastChecked: new Date().toISOString()
      },
      springBootGateway: {
        status: "UP",
        latencyMs: 8,
        endpoint: "mock://localhost:8080/api/v1/erp",
        message: "In-memory stateful gateway active",
        lastChecked: new Date().toISOString()
      },
      kafkaEdaConsumer: {
        status: "UP",
        latencyMs: 5,
        endpoint: "order-topic [group: fineract-order-group]",
        message: "Kafka EDA simulator ready",
        lastChecked: new Date().toISOString()
      },
      mode: "mock",
      ...metrics,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton export
export const fineractMockStore = new FineractMockStore();
