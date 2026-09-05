/**
 * Apache Fineract Loan Products & Loan Lifecycle State Machine Subsystem (R3)
 * Provides Loan Product catalog, KPI deck, loan accounts directory with real-time search,
 * status filters (100..600), interactive repayment schedule modal, and FSM transition controls.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Ban,
  Undo2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Building2,
  User,
  Shield,
  Percent,
  Calendar,
  Wallet,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { LoanAccount, LoanProduct, LoanStatusCode } from "@/types/fineract";
import { useFineractToast } from "./FineractToast";
import LoanDetailModal, { formatFineractDateDisplay } from "./LoanDetailModal";
import LoanActionModal, { formatVND, LoanActionType } from "./LoanActionModal";
import LoanApplicationModal from "./LoanApplicationModal";

export interface FineractLoansProps {
  onLoanCreated?: () => void;
  onLoanUpdated?: () => void;
}

export default function FineractLoans({
  onLoanCreated,
  onLoanUpdated
}: FineractLoansProps) {
  const { success, fineractError, info } = useFineractToast();

  // Data state
  const [loans, setLoans] = useState<LoanAccount[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LoanStatusCode>("ALL");

  // Modals state
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<LoanAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [selectedLoanForAction, setSelectedLoanForAction] = useState<LoanAccount | null>(null);
  const [actionType, setActionType] = useState<LoanActionType | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);

  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState<boolean>(false);
  const [preselectedProductId, setPreselectedProductId] = useState<number | undefined>(undefined);

  // Copy feedback
  const [copiedAccountNo, setCopiedAccountNo] = useState<string | null>(null);

  // Fetch loans and products
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loanList, productList] = await Promise.all([
        fineractService.getLoans(),
        fineractService.getLoanProducts()
      ]);
      setLoans(loanList);
      setProducts(productList);
    } catch (err: any) {
      console.error("[FineractLoans] Error fetching loans:", err);
      fineractError(err, "Không thể nạp danh sách hồ sơ vay");
    } finally {
      setIsLoading(false);
    }
  }, [fineractError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Copy Account Number
  const handleCopyAccount = (accountNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accountNo);
    setCopiedAccountNo(accountNo);
    info(`Đã sao chép mã hợp đồng: ${accountNo}`, "Sao chép thành công");
    setTimeout(() => setCopiedAccountNo(null), 2000);
  };

  // KPI Deck Aggregations
  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status.id === 300).length;
    const pendingLoans = loans.filter(l => l.status.id === 100).length;
    const approvedLoans = loans.filter(l => l.status.id === 200).length;
    const closedLoans = loans.filter(l => l.status.id === 600).length;

    // Total Portfolio Principal: sum of principals of disbursed/active/closed loans
    const totalPortfolioPrincipal = loans
      .filter(l => l.status.id === 300 || l.status.id === 600 || l.summary?.principalDisbursed > 0)
      .reduce((acc, l) => acc + (l.summary?.principalDisbursed || l.principal), 0);

    // Total Outstanding Balance: sum of current outstanding balances
    const totalOutstandingBalance = loans
      .filter(l => l.status.id === 300 || l.status.id === 100 || l.status.id === 200)
      .reduce((acc, l) => acc + (l.summary?.totalOutstanding || 0), 0);

    return {
      totalLoans,
      activeLoans,
      pendingLoans,
      approvedLoans,
      closedLoans,
      totalPortfolioPrincipal,
      totalOutstandingBalance
    };
  }, [loans]);

  // Real-time filtered loans
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      // Status filter
      if (statusFilter !== "ALL" && l.status.id !== statusFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchAccount = l.accountNo?.toLowerCase().includes(term);
        const matchName = l.clientName?.toLowerCase().includes(term);
        const matchExternal = l.externalId?.toLowerCase().includes(term);
        const matchProduct = l.loanProductName?.toLowerCase().includes(term);
        const matchClientAcc = l.clientAccountNo?.toLowerCase().includes(term);

        return (
          matchAccount ||
          matchName ||
          matchExternal ||
          matchProduct ||
          matchClientAcc
        );
      }

      return true;
    });
  }, [loans, statusFilter, searchTerm]);

  // Open Detail Modal
  const handleOpenDetail = (loan: LoanAccount) => {
    setSelectedLoanForDetail(loan);
    setIsDetailModalOpen(true);
  };

  // Open Action Modal
  const handleOpenAction = (action: LoanActionType, loan: LoanAccount) => {
    setSelectedLoanForAction(loan);
    setActionType(action);
    setIsActionModalOpen(true);
  };

  // Open Application Modal
  const handleOpenApplication = (productId?: number) => {
    setPreselectedProductId(productId);
    setIsApplicationModalOpen(true);
  };

  // Handlers for state updates
  const handleActionSuccess = (updatedLoan: LoanAccount) => {
    fetchData();
    onLoanUpdated?.();
    if (selectedLoanForDetail && selectedLoanForDetail.id === updatedLoan.id) {
      setSelectedLoanForDetail(updatedLoan);
    }
  };

  const handleLoanCreatedSuccess = (newLoan: LoanAccount) => {
    fetchData();
    onLoanCreated?.();
    onLoanUpdated?.();
    setSelectedLoanForDetail(newLoan);
    setIsDetailModalOpen(true);
  };

  // Render Status Badge
  const renderStatusBadge = (code: LoanStatusCode, label: string) => {
    const badgeStyles: Record<LoanStatusCode, { bg: string; text: string; border: string; icon: any }> = {
      100: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
        icon: Clock
      },
      200: {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/20",
        icon: CheckCircle2
      },
      300: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        icon: CheckCircle2
      },
      400: {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/20",
        icon: Undo2
      },
      500: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
        icon: Ban
      },
      600: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
        icon: Sparkles
      }
    };

    const current = badgeStyles[code] || badgeStyles[100];
    const Icon = current.icon;

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold inline-flex items-center gap-1.5 ${current.bg} ${current.text} border ${current.border}`}
      >
        <Icon className="w-3 h-3" />
        [{code}] {label}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Primary Action Deck */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24] shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Quản Trị Tín Dụng & Vòng Đời Khoản Vay (Loan Lifecycle FSM)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                    R3 Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý danh mục gói sản phẩm tín dụng, lịch trả góp định kỳ và máy trạng thái Fineract FSM (100 &rarr; 200 &rarr; 300 &rarr; 600).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchData();
                success("Đã đồng bộ lại danh mục gói vay và hồ sơ hợp đồng.", "Làm mới dữ liệu");
              }}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách khoản vay"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#FF4D24]" : ""}`} />
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleOpenApplication()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF4D24] hover:bg-[#ff623d] shadow-lg shadow-[#FF4D24]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nộp Hồ Sơ Vay Mới</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Deck */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Tổng Số Khoản Vay</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.totalLoans}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.pendingLoans} chờ duyệt • {stats.approvedLoans} đã duyệt
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Đang Hoạt Động (Active)
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {stats.activeLoans}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.closedLoans} hợp đồng đã tất toán
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Tổng Danh Mục Giải Ngân
            </div>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1">
              {formatVND(stats.totalPortfolioPrincipal)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Vốn lưu động cung ứng ra thị trường
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Tổng Dư Nợ Đang Lưu Hành
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {formatVND(stats.totalOutstandingBalance)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Bao gồm nợ gốc và lãi dự thu
            </div>
          </div>
        </div>
      </div>

      {/* 3. Loan Products Catalog Section */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Danh Mục Gói Sản Phẩm Tín Dụng (Loan Products Catalog)
              </h4>
              <p className="text-[11px] text-slate-400">
                Các gói tín dụng tiêu chuẩn được cấu hình trên Core Banking Apache Fineract
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {products.length} gói sẵn sàng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(prod => (
            <div
              key={prod.id}
              className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D24]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF4D24]/10 transition-colors" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                    {prod.shortName}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    {prod.interestRatePerPeriod}% / kỳ ({prod.annualInterestRate}% / năm)
                  </span>
                </div>

                <h5 className="text-sm font-bold text-white mt-3 group-hover:text-[#FF4D24] transition-colors">
                  {prod.name}
                </h5>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Hạn mức tín dụng:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatVND(prod.minPrincipal)} &ndash; {formatVND(prod.maxPrincipal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Kỳ hạn trả góp:</span>
                  <span className="font-mono text-slate-300">
                    {prod.numberOfRepayments} kỳ ({prod.repaymentEvery} {prod.repaymentFrequencyType.value})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Phương thức tính lãi:</span>
                  <span className="text-slate-300">
                    {prod.amortizationType.value} • {prod.interestType.value}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenApplication(prod.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-[#FF4D24] border border-slate-800 hover:border-[#FF4D24] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Đăng Ký Gói Này</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Comprehensive Loan Accounts Manager */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Quản Trị Hồ Sơ Hợp Đồng Khoản Vay (Loan Accounts Directory)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                {filteredLoans.length} / {loans.length} hồ sơ
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Theo dõi tình trạng hợp đồng, dư nợ theo thời gian thực và thực thi các bước chuyển tiếp máy trạng thái FSM.
            </p>
          </div>
        </div>

        {/* Search Bar & Status Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          {/* Real-time search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số hợp đồng, tên khách hàng, mã ERP..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full hide-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-[#FF4D24] text-white font-bold shadow-md shadow-[#FF4D24]/20"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80"
              }`}
            >
              Tất Cả ({loans.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(100)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 100
                  ? "bg-amber-600 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-amber-400/80 hover:text-amber-400 border border-slate-800/80"
              }`}
            >
              [100] Chờ Duyệt ({stats.pendingLoans})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(200)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 200
                  ? "bg-sky-600 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-sky-400/80 hover:text-sky-400 border border-slate-800/80"
              }`}
            >
              [200] Đã Duyệt ({stats.approvedLoans})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(300)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 300
                  ? "bg-emerald-600 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-emerald-400/80 hover:text-emerald-400 border border-slate-800/80"
              }`}
            >
              [300] Hoạt Động ({stats.activeLoans})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(600)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 600
                  ? "bg-purple-600 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-purple-400/80 hover:text-purple-400 border border-slate-800/80"
              }`}
            >
              [600] Tất Toán ({stats.closedLoans})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(400)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 400
                  ? "bg-slate-700 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-300 border border-slate-800/80"
              }`}
            >
              [400] Đã Rút ({loans.filter(l => l.status.id === 400).length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(500)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 500
                  ? "bg-rose-700 text-white font-bold shadow-md"
                  : "bg-slate-950/60 text-rose-400/80 hover:text-rose-400 border border-slate-800/80"
              }`}
            >
              [500] Từ Chối ({loans.filter(l => l.status.id === 500).length})
            </button>
          </div>
        </div>

        {/* High-Density Loans Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/60 shadow-inner">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-sans">
              <tr>
                <th className="px-4 py-3">Mã Hợp Đồng</th>
                <th className="px-4 py-3">Người Vay Vốn</th>
                <th className="px-4 py-3">Gói Tín Dụng</th>
                <th className="px-4 py-3 text-right">Số Tiền Gốc</th>
                <th className="px-4 py-3 text-right">Dư Nợ Còn Lại</th>
                <th className="px-4 py-3 text-right">Tổng Kỳ Vọng</th>
                <th className="px-4 py-3 text-center">Trạng Thái FSM</th>
                <th className="px-4 py-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLoans.length > 0 ? (
                filteredLoans.map(loan => {
                  const isCopied = copiedAccountNo === loan.accountNo;
                  return (
                    <tr
                      key={loan.id}
                      onClick={() => handleOpenDetail(loan)}
                      className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    >
                      {/* Account No & External ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sky-400 group-hover:text-sky-300">
                            {loan.accountNo}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleCopyAccount(loan.accountNo, e)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Sao chép số tài khoản vay"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {loan.externalId && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ERP: {loan.externalId}
                          </div>
                        )}
                      </td>

                      {/* Borrower Name */}
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-[11px] text-[#FF4D24] shrink-0">
                            {loan.clientName.split(" ").pop()?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-[#FF4D24] transition-colors">
                              {loan.clientName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              Mã KH: {loan.clientAccountNo || loan.clientId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Loan Product */}
                      <td className="px-4 py-3 font-sans">
                        <div className="text-slate-300 font-medium line-clamp-1">
                          {loan.loanProductName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {loan.numberOfRepayments} kỳ • {loan.interestRatePerPeriod}%/kỳ
                        </div>
                      </td>

                      {/* Principal */}
                      <td className="px-4 py-3 text-right text-white font-bold">
                        {formatVND(loan.principal)}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="px-4 py-3 text-right font-bold">
                        <span
                          className={
                            loan.status.id === 300
                              ? "text-emerald-400"
                              : loan.status.id === 600
                              ? "text-purple-400"
                              : "text-slate-400"
                          }
                        >
                          {formatVND(loan.summary?.totalOutstanding || 0)}
                        </span>
                      </td>

                      {/* Expected Total */}
                      <td className="px-4 py-3 text-right text-slate-300">
                        {formatVND(loan.summary?.totalExpectedRepayment || loan.principal)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {renderStatusBadge(loan.status.id, loan.status.value)}
                      </td>

                      {/* Action Triggers */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick State Machine Transition Trigger */}
                          {loan.status.id === 100 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAction("approve", loan)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-600 hover:bg-sky-500 text-white shadow transition-all cursor-pointer flex items-center gap-1"
                              title="Phê duyệt khoản vay"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                          )}

                          {loan.status.id === 200 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAction("disburse", loan)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer flex items-center gap-1"
                              title="Giải ngân vốn vay"
                            >
                              <ArrowRight className="w-3 h-3" />
                              <span>Giải Ngân</span>
                            </button>
                          )}

                          {loan.status.id === 300 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAction("repay", loan)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FF4D24] hover:bg-[#ff623d] text-white shadow transition-all cursor-pointer flex items-center gap-1"
                              title="Thu nợ trả góp"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Thu Nợ</span>
                            </button>
                          )}

                          {/* Detail Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(loan)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                            title="Xem chi tiết & lịch trả nợ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-sans">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    Không tìm thấy hồ sơ khoản vay nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <LoanDetailModal
        isOpen={isDetailModalOpen}
        loan={selectedLoanForDetail}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenAction={(action, loan) => {
          setIsDetailModalOpen(false);
          handleOpenAction(action, loan);
        }}
      />

      {/* Action Transition Modal */}
      <LoanActionModal
        isOpen={isActionModalOpen}
        action={actionType}
        loan={selectedLoanForAction}
        onClose={() => setIsActionModalOpen(false)}
        onSuccess={handleActionSuccess}
      />

      {/* Loan Application Modal */}
      <LoanApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSuccess={handleLoanCreatedSuccess}
        initialProductId={preselectedProductId}
      />
    </div>
  );
}
