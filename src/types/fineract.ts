/**
 * Apache Fineract Core Banking & Financial Ledger Type Definitions
 * Matching Apache Fineract 1.x REST API & Spring Boot ERP Gateway Contracts
 */

// ==========================================
// 1. Client Subsystem Types
// ==========================================

export interface ClientStatus {
  id: number; // 100: Pending, 300: Active, 600: Closed
  code: string; // e.g. "clientStatusType.active"
  value: string; // e.g. "Active", "Pending", "Closed"
}

export interface FineractClient {
  id: number;
  accountNo: string;
  status: ClientStatus;
  active: boolean;
  activationDate: [number, number, number] | string;
  firstname: string;
  lastname: string;
  displayName: string;
  officeId: number;
  officeName: string;
  externalId?: string; // Maps to ERP userId
  emailAddress?: string;
  mobileNo?: string;
  legalFormId?: number; // 1 = Person (Thể nhân), 2 = Entity (Pháp nhân)
  timeline?: {
    submittedOnDate?: [number, number, number] | string;
    activatedOnDate?: [number, number, number] | string;
  };
}

export interface CreateClientPayload {
  officeId?: number;
  legalFormId?: number;
  firstname?: string;
  lastname?: string;
  fullName?: string; // Automatically parsed to firstname/lastname if provided
  externalId?: string;
  emailAddress?: string;
  mobileNo?: string;
  active?: boolean;
  activationDate?: string; // e.g. "04 September 2026"
  dateFormat?: string;
  locale?: string;
}

// ==========================================
// 2. Loan Subsystem & Finite State Machine Types
// ==========================================

export type LoanStatusCode = 100 | 200 | 300 | 400 | 500 | 600;

export interface LoanStatus {
  id: LoanStatusCode;
  code: string;
  value: string;
  pendingApproval: boolean;
  waitingForDisbursal: boolean;
  active: boolean;
  closedObligationsMet: boolean;
  closed: boolean;
  overpaid: boolean;
}

export interface RepaymentSchedulePeriod {
  period: number; // 0 = disbursement event, 1..N = installment periods
  dueDate: [number, number, number] | string;
  principalOriginalDue: number;
  principalDue: number;
  principalPaid: number;
  principalOutstanding: number;
  interestOriginalDue: number;
  interestDue: number;
  interestPaid: number;
  interestOutstanding: number;
  feeChargesDue: number;
  feeChargesPaid: number;
  feeChargesOutstanding: number;
  penaltyChargesDue: number;
  penaltyChargesPaid: number;
  penaltyChargesOutstanding: number;
  totalOriginalDueForPeriod: number;
  totalDueForPeriod: number;
  totalPaidForPeriod: number;
  totalPaidInAdvanceForPeriod: number;
  totalPaidLateForPeriod: number;
  totalOutstandingForPeriod: number;
  complete: boolean;
}

export interface RepaymentSchedule {
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  loanTermInDays: number;
  totalPrincipalDisbursed: number;
  totalPrincipalExpected: number;
  totalPrincipalPaid: number;
  totalInterestCharged: number;
  totalFeeChargesCharged: number;
  totalPenaltyChargesCharged: number;
  totalWaived: number;
  totalWrittenOff: number;
  totalRepaymentExpected: number;
  totalRepayment: number;
  totalOutstanding: number;
  periods: RepaymentSchedulePeriod[];
}

export interface LoanProduct {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  principal: number;
  minPrincipal: number;
  maxPrincipal: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  interestRatePerPeriod: number;
  annualInterestRate: number;
  amortizationType: {
    id: number;
    code: string;
    value: string;
  };
  interestType: {
    id: number;
    code: string;
    value: string;
  };
  status?: string;
}

export interface LoanTransaction {
  id: number;
  officeId: number;
  type: {
    id: number;
    code: string;
    value: string; // e.g. "Disbursement", "Repayment"
  };
  date: [number, number, number] | string;
  currency: {
    code: string;
  };
  amount: number;
  principalPortion?: number;
  interestPortion?: number;
  outstandingLoanBalance?: number;
  manuallyReversed: boolean;
  transactionDate?: string;
}

export interface LoanSummary {
  currency: {
    code: string;
    decimalPlaces: number;
  };
  principalDisbursed: number;
  principalPaid: number;
  principalOutstanding: number;
  interestCharged: number;
  interestPaid: number;
  interestOutstanding: number;
  feeChargesCharged: number;
  feeChargesPaid: number;
  feeChargesOutstanding: number;
  penaltyChargesCharged: number;
  penaltyChargesPaid: number;
  penaltyChargesOutstanding: number;
  totalExpectedRepayment: number;
  totalRepayment: number;
  totalOutstanding: number;
}

export interface LoanAccount {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId: number;
  clientName: string;
  clientAccountNo?: string;
  loanProductId: number;
  loanProductName: string;
  loanProductDescription?: string;
  status: LoanStatus;
  principal: number;
  approvedPrincipal: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  interestRatePerPeriod: number;
  annualInterestRate: number;
  termFrequency: number;
  termPeriodFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  submittedOnDate: [number, number, number] | string;
  approvedOnDate?: [number, number, number] | string;
  expectedDisbursementDate?: [number, number, number] | string;
  actualDisbursementDate?: [number, number, number] | string;
  closedOnDate?: [number, number, number] | string;
  summary: LoanSummary;
  repaymentSchedule?: RepaymentSchedule;
  transactions?: LoanTransaction[];
}

export interface CreateLoanPayload {
  clientId: number;
  productId: number;
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number; // 2 = Months
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number; // 2 = Months
  interestRatePerPeriod: number;
  amortizationType: number; // 1 = Equal installments
  interestType: number; // 0 = Declining Balance, 1 = Flat
  expectedDisbursementDate: string;
  submittedOnDate: string;
  dateFormat?: string;
  locale?: string;
  externalId?: string;
  linkAccountId?: number;
}

// ==========================================
// 3. General Ledger & Double-Entry Invariant Types
// ==========================================

export type GlAccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface GlAccountInfo {
  id: number;
  code: string;
  name: string;
  type: GlAccountType;
  description?: string;
}

export interface GlAccountResolverMatrix {
  cashGlAccount: GlAccountInfo; // ID: 1, 1111 - Tiền mặt tại quỹ (Cash on Hand)
  bankGlAccount: GlAccountInfo; // ID: 4, 1121 - Tiền gửi ngân hàng (Bank Deposits)
  salesRevenueGlAccount: GlAccountInfo; // ID: 2, 5111 - Doanh thu bán hàng hóa (Sales Revenue)
  salesReturnsGlAccount: GlAccountInfo; // ID: 3, 5212 - Hàng bán bị trả lại (Sales Returns)
}

export interface JournalEntry {
  id: number;
  officeId: number;
  officeName?: string;
  glAccountId: number;
  glAccountName: string;
  glAccountCode: string;
  glAccountType: {
    id: number;
    code: string;
    value: GlAccountType;
  };
  transactionDate: [number, number, number] | string;
  entryType: {
    id: number;
    code: string;
    value: "DEBIT" | "CREDIT";
  };
  amount: number;
  transactionId: string;
  manualEntry: boolean;
  referenceNumber?: string;
  comments?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  submittedOnDate?: [number, number, number] | string;
  createdDate?: string;
}

export interface JournalEntryTransaction {
  transactionId: string;
  transactionDate: string;
  referenceNumber?: string;
  comments?: string;
  currency: string;
  officeId: number;
  manualEntry: boolean;
  lines: JournalEntry[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdAt?: string;
}

export interface JournalEntryLineItem {
  glAccountId: number;
  amount: number;
}

export interface CreateJournalEntryPayload {
  officeId: number;
  transactionDate: string;
  currencyCode?: string;
  referenceNumber?: string;
  comments?: string;
  dateFormat?: string;
  locale?: string;
  debits: JournalEntryLineItem[];
  credits: JournalEntryLineItem[];
}

// ==========================================
// 4. Kafka Event-Driven Architecture (EDA) Types
// ==========================================

export type KafkaOrderEventType = "ORDER_STATUS_CHANGED" | "ORDER_CREATED";
export type OrderStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "COMPLETED";
export type PaymentMethod = "COD" | "VNPAY" | "BANK_TRANSFER" | "CREDIT_CARD" | "MOMO" | "PAYPAL";

export interface KafkaOrderEvent {
  eventId?: string;
  timestamp?: string;
  eventType: KafkaOrderEventType;
  orderNumber: string;
  orderId?: string;
  newStatus: OrderStatus;
  previousStatus?: OrderStatus;
  initialStatus?: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  itemsCount?: number;
  processed?: boolean;
  journalTransactionId?: string;
  note?: string;
}

// ==========================================
// 5. Error Diagnostics & Parser Types
// ==========================================

export interface FineractErrorField {
  developerMessage?: string;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  parameterName?: string;
  value?: any;
  args?: any[];
}

export interface FineractInnerResponse {
  developerMessage?: string;
  httpStatusCode?: string | number;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  parameterName?: string;
  errors?: FineractErrorField[];
}

export interface FineractErrorResponse {
  status?: string;
  httpStatusCode?: number;
  message?: string;
  fineractResponse?: string | FineractInnerResponse;
  timestamp?: string;
}

export interface FineractParsedError {
  httpStatusCode: number;
  title: string;
  defaultUserMessage: string;
  developerMessage: string;
  userMessageGlobalisationCode: string;
  parameterName?: string;
  rawResponse?: string;
  isFineractError: boolean;
  errors?: FineractErrorField[];
}

// ==========================================
// 6. System Health Monitoring Types
// ==========================================

export interface SubsystemHealth {
  status: "UP" | "DEGRADED" | "DOWN";
  latencyMs: number;
  endpoint?: string;
  message?: string;
  lastChecked: string;
}

export interface FineractHealthStatus {
  fineractCore: SubsystemHealth;
  springBootGateway: SubsystemHealth;
  kafkaEdaConsumer: SubsystemHealth;
  mode: "live" | "mock";
  totalClients: number;
  totalActiveLoans: number;
  totalOutstandingPrincipal: number;
  cashBalance: number;
  bankBalance: number;
  timestamp?: string;
}

// ==========================================
// 7. Unified Service Interface Contract
// ==========================================

export interface IFineractService {
  // Mode & Configuration
  getMode(): "live" | "mock";
  setMode(mode: "live" | "mock"): void;
  getSystemHealth(): Promise<FineractHealthStatus>;

  // Clients
  getClients(role?: "admin" | "customer", externalId?: string): Promise<FineractClient[]>;
  getClient(id: number): Promise<FineractClient>;
  createClient(payload: CreateClientPayload): Promise<FineractClient>;

  // Loan Products & Accounts
  getLoanProducts(): Promise<LoanProduct[]>;
  getLoans(clientId?: number): Promise<LoanAccount[]>;
  getLoan(id: number): Promise<LoanAccount>;
  createLoan(payload: CreateLoanPayload): Promise<LoanAccount>;
  approveLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  disburseLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  rejectLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  withdrawLoan(id: number, date: string, note?: string): Promise<LoanAccount>;
  repayLoan(id: number, amount: number, date: string): Promise<{ loan: LoanAccount; transactionId: number }>;

  // General Ledger
  getJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(payload: CreateJournalEntryPayload): Promise<JournalEntryTransaction>;

  // Kafka EDA
  simulateKafkaOrderEvent(event: KafkaOrderEvent): Promise<{ event: KafkaOrderEvent; journalEntry?: JournalEntryTransaction }>;
  getKafkaEvents(): Promise<KafkaOrderEvent[]>;
}
