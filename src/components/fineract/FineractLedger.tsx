/**
 * Apache Fineract Double-Entry General Ledger Subsystem Component (R4)
 * Displays double-entry journal vouchers, line-item audit trail,
 * GL Account Resolver Matrix diagram, and manual posting modal with invariant guard.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  Scale,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import {
  JournalEntry,
  JournalEntryTransaction,
  GlAccountInfo,
  GlAccountResolverMatrix
} from "@/types/fineract";
import { GL_RESOLVER_MATRIX } from "@/lib/fineractMockStore";
import JournalEntryModal from "./JournalEntryModal";
import { useFineractToast } from "./FineractToast";
import { formatVND } from "./FineractOverview";

export interface FineractLedgerProps {
  onEntryCreated?: () => void;
  targetFilterReference?: string;
  onNavigateToEda?: () => void;
}

export default function FineractLedger({
  onEntryCreated,
  targetFilterReference,
  onNavigateToEda
}: FineractLedgerProps) {
  const { success, fineractError, info } = useFineractToast();

  // Datasets
  const [transactions, setTransactions] = useState<JournalEntryTransaction[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [glAccounts, setGlAccounts] = useState<GlAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState<string>(targetFilterReference || "");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "automated">("all");
  const [viewMode, setViewMode] = useState<"vouchers" | "rawLines">("vouchers");
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());

  // Copy Feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Interactive GL Matrix Route Tester
  const [simPaymentMethod, setSimPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "VNPAY">("COD");
  const [simEventType, setSimEventType] = useState<"SALE" | "REFUND">("SALE");

  // Load General Ledger Data
  const loadLedgerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txList, rawLines, accounts] = await Promise.all([
        fineractService.getJournalTransactions(),
        fineractService.getJournalEntries(),
        fineractService.getGlAccounts().catch(() => [])
      ]);

      setTransactions(txList);
      setEntries(rawLines);
      if (accounts && accounts.length > 0) {
        setGlAccounts(accounts);
      }
    } catch (err) {
      console.error("[FineractLedger] Error loading ledger data:", err);
      fineractError(err, "Không thể tải dữ liệu sổ cái");
    } finally {
      setIsLoading(false);
    }
  }, [fineractError]);

  useEffect(() => {
    loadLedgerData();
  }, [loadLedgerData]);

  // Sync external search filter if passed
  useEffect(() => {
    if (targetFilterReference) {
      setSearchTerm(targetFilterReference);
    }
  }, [targetFilterReference]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Toggle Row Expansion
  const toggleExpand = (txId: string) => {
    setExpandedTxIds(prev => {
      const copy = new Set(prev);
      if (copy.has(txId)) copy.delete(txId);
      else copy.add(txId);
      return copy;
    });
  };

  // Calculate Overall Ledger KPIs
  const { totalTxCount, totalDebitVolume, totalCreditVolume, isSystemBalanced } = useMemo(() => {
    const count = transactions.length;
    let sumDebit = 0;
    let sumCredit = 0;

    for (const tx of transactions) {
      sumDebit += tx.totalDebit || 0;
      sumCredit += tx.totalCredit || 0;
    }

    const diff = Math.abs(sumDebit - sumCredit);
    const balanced = diff < 0.001 && count > 0;

    return {
      totalTxCount: count,
      totalDebitVolume: sumDebit,
      totalCreditVolume: sumCredit,
      isSystemBalanced: balanced
    };
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return transactions.filter(tx => {
      // 1. Search filter
      const matchesSearch =
        !term ||
        tx.transactionId.toLowerCase().includes(term) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(term)) ||
        (tx.comments && tx.comments.toLowerCase().includes(term)) ||
        tx.lines.some(
          l =>
            l.glAccountName.toLowerCase().includes(term) ||
            l.glAccountCode.toLowerCase().includes(term) ||
            l.amount.toString().includes(term)
        );

      if (!matchesSearch) return false;

      // 2. Account filter
      if (accountFilter !== "all") {
        const hasAccount = tx.lines.some(l => l.glAccountId === Number(accountFilter));
        if (!hasAccount) return false;
      }

      // 3. Source filter (Manual vs Automated)
      if (sourceFilter === "manual" && !tx.manualEntry) return false;
      if (sourceFilter === "automated" && tx.manualEntry) return false;

      return true;
    });
  }, [transactions, searchTerm, accountFilter, sourceFilter]);

  // Filtered Raw Entries (for raw line view)
  const filteredRawEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return entries.filter(entry => {
      const matchesSearch =
        !term ||
        entry.transactionId.toLowerCase().includes(term) ||
        (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(term)) ||
        (entry.comments && entry.comments.toLowerCase().includes(term)) ||
        entry.glAccountName.toLowerCase().includes(term) ||
        entry.glAccountCode.toLowerCase().includes(term) ||
        entry.amount.toString().includes(term);

      if (!matchesSearch) return false;

      if (accountFilter !== "all") {
        if (entry.glAccountId !== Number(accountFilter)) return false;
      }

      if (sourceFilter === "manual" && !entry.manualEntry) return false;
      if (sourceFilter === "automated" && entry.manualEntry) return false;

      return true;
    });
  }, [entries, searchTerm, accountFilter, sourceFilter]);

  // Interactive GL Routing calculation
  const currentSimResolution = useMemo(() => {
    const isRefund = simEventType === "REFUND";
    const isCod = simPaymentMethod === "COD";

    const cashId = GL_RESOLVER_MATRIX.cashGlAccount.id; // 1
    const bankId = GL_RESOLVER_MATRIX.bankGlAccount.id; // 4
    const revId = GL_RESOLVER_MATRIX.salesRevenueGlAccount.id; // 2
    const returnId = GL_RESOLVER_MATRIX.salesReturnsGlAccount.id; // 3

    if (!isRefund) {
      // Sale: Debit Cash or Bank, Credit Sales Revenue
      return {
        debitAccount: isCod ? GL_RESOLVER_MATRIX.cashGlAccount : GL_RESOLVER_MATRIX.bankGlAccount,
        creditAccount: GL_RESOLVER_MATRIX.salesRevenueGlAccount,
        refPrefix: "SALE",
        desc: `Ghi nhận doanh thu bán hàng qua phương thức ${simPaymentMethod}. Tiền về ${isCod ? "Quỹ tiền mặt (1111)" : "Tài khoản ngân hàng (1121)"}.`
      };
    } else {
      // Refund: Debit Sales Returns, Credit Cash or Bank
      return {
        debitAccount: GL_RESOLVER_MATRIX.salesReturnsGlAccount,
        creditAccount: isCod ? GL_RESOLVER_MATRIX.cashGlAccount : GL_RESOLVER_MATRIX.bankGlAccount,
        refPrefix: "REFUND",
        desc: `Hoàn tiền trả hàng qua phương thức ${simPaymentMethod}. Giảm ${isCod ? "Quỹ tiền mặt (1111)" : "Tài khoản ngân hàng (1121)"}, tăng chi phí trả hàng (5212).`
      };
    }
  }, [simPaymentMethod, simEventType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Title, Overview KPIs & Invariant Checkmark */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4D24]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D24] to-[#c7320f] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#15181F] rounded-[10px] flex items-center justify-center text-[#FF4D24]">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Sổ Cái Kế Toán Kép (Double-Entry General Ledger)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                    R4 Standard
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý nhật ký chung, định khoản đa tài khoản, và bảo toàn bất biến &Sigma; Nợ (Debit) &equiv; &Sigma; Có (Credit).
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Ghi Bút Toán Mới & Làm Mới */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadLedgerData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Làm mới sổ cái"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#FF4D24]" : ""}`} />
              <span>Làm Mới</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF4D24] hover:bg-[#FF4D24]/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#FF4D24]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Bút Toán Mới</span>
            </button>
          </div>
        </div>

        {/* Top Deck KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* KPI 1: Total Journal Entries */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">TỔNG BÚT TOÁN (VOUCHERS)</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{totalTxCount}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{entries.length} dòng định khoản</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Total Debit Volume */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">TỔNG PHÁT SINH NỢ (DEBIT)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {formatVND(totalDebitVolume)}
              </span>
              <span className="text-[10px] text-emerald-500/70 font-mono mt-0.5 block">&Sigma; Nợ tăng tài sản / CP</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: Total Credit Volume */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">TỔNG PHÁT SINH CÓ (CREDIT)</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                {formatVND(totalCreditVolume)}
              </span>
              <span className="text-[10px] text-rose-500/70 font-mono mt-0.5 block">&Sigma; Có tăng doanh thu / nợ</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Balance Verification Status */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">TRẠNG THÁI CÂN ĐỐI</span>
              <div className="flex items-center gap-1.5 mt-1">
                {isSystemBalanced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Balanced (Cân Bằng)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span className="text-sm font-bold text-rose-400">Lệch Kế Toán</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                &Delta; = {formatVND(Math.abs(totalDebitVolume - totalCreditVolume))}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isSystemBalanced
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. GL Account Resolver Matrix & Visual Diagram Card */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Ma Trận Định Khoản Sổ Cái (GL Account Resolver Matrix)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Bảng quy tắc định tuyến tự động từ phương thức thanh toán thương mại sang hệ thống tài khoản Fineract.
            </p>
          </div>

          {/* Quick Route Tester Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium px-1">Mô phỏng định tuyến:</span>
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setSimEventType("SALE")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  simEventType === "SALE" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Bán Hàng (SALE)
              </button>
              <button
                type="button"
                onClick={() => setSimEventType("REFUND")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  simEventType === "REFUND" ? "bg-rose-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Hoàn Trả (REFUND)
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              {(["COD", "BANK_TRANSFER", "VNPAY"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSimPaymentMethod(m)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    simPaymentMethod === m ? "bg-[#FF4D24] text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Mapping Diagram with Active Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Card 1: Cash on Hand (1111) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              (simPaymentMethod === "COD" && simEventType === "SALE" && currentSimResolution.debitAccount.id === 1) ||
              (simPaymentMethod === "COD" && simEventType === "REFUND" && currentSimResolution.creditAccount.id === 1)
                ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                ASSET #1
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">TK 1111</span>
            </div>
            <h5 className="font-bold text-white text-xs mt-2">Tiền Mặt Tại Quỹ (Cash on Hand)</h5>
            <p className="text-[11px] text-slate-400 mt-1">Sử dụng khi khách hàng thanh toán qua hình thức COD trực tiếp.</p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Kênh ánh xạ:</span>
              <span className="text-emerald-400 font-bold">COD (Tiền mặt)</span>
            </div>
          </div>

          {/* Card 2: Bank Deposits (1121) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              (simPaymentMethod !== "COD" && simEventType === "SALE" && currentSimResolution.debitAccount.id === 4) ||
              (simPaymentMethod !== "COD" && simEventType === "REFUND" && currentSimResolution.creditAccount.id === 4)
                ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                ASSET #4
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">TK 1121</span>
            </div>
            <h5 className="font-bold text-white text-xs mt-2">Tiền Gửi Ngân Hàng (Bank Deposits)</h5>
            <p className="text-[11px] text-slate-400 mt-1">Sử dụng cho toàn bộ kênh điện tử: Chuyển khoản, VNPAY, MOMO, Thẻ.</p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Kênh ánh xạ:</span>
              <span className="text-sky-400 font-bold">BANK / VNPAY / MOMO</span>
            </div>
          </div>

          {/* Card 3: Sales Revenue (5111) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              simEventType === "SALE"
                ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                INCOME #2
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">TK 5111</span>
            </div>
            <h5 className="font-bold text-white text-xs mt-2">Doanh Thu Bán Hàng (Sales Revenue)</h5>
            <p className="text-[11px] text-slate-400 mt-1">Ghi nhận Bên Có khi đơn hàng chuyển sang trạng thái PROCESSING.</p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Hạch toán Có:</span>
              <span className="text-emerald-400 font-bold">SALE-[orderNumber]</span>
            </div>
          </div>

          {/* Card 4: Sales Returns (5212) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              simEventType === "REFUND"
                ? "bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                EXPENSE #3
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">TK 5212</span>
            </div>
            <h5 className="font-bold text-white text-xs mt-2">Hàng Bán Bị Trả Lại (Sales Returns)</h5>
            <p className="text-[11px] text-slate-400 mt-1">Tài khoản giảm trừ doanh thu (Ghi Nợ) khi khách hàng hoàn đơn.</p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Hạch toán Nợ:</span>
              <span className="text-rose-400 font-bold">REFUND-[orderNumber]</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Explanation Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24] shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white">Kết Quả Định Tuyến:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px]">
                Nợ: TK {currentSimResolution.debitAccount.code} ({currentSimResolution.debitAccount.name})
              </span>
              <span className="text-slate-500">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold text-[11px]">
                Có: TK {currentSimResolution.creditAccount.code} ({currentSimResolution.creditAccount.name})
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-amber-400 font-bold">
                Mẫu Ref: {currentSimResolution.refPrefix}-ORD-XXXX
              </span>
            </div>
            <p className="text-slate-400 mt-1 text-[11px]">{currentSimResolution.desc}</p>
          </div>
        </div>

        {/* Clear Reference Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-sans">
              <tr>
                <th className="px-4 py-2.5">Sự Kiện Kinh Tế</th>
                <th className="px-4 py-2.5">Hình Thức Thanh Toán</th>
                <th className="px-4 py-2.5">Bên Nợ (Debit)</th>
                <th className="px-4 py-2.5">Bên Có (Credit)</th>
                <th className="px-4 py-2.5">Quy Chuẩn Mã Chứng Từ</th>
                <th className="px-4 py-2.5">Cơ Chế Hạch Toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-900/30">
                <td className="px-4 py-2.5 font-sans font-bold text-emerald-400">Bán hàng (Sale)</td>
                <td className="px-4 py-2.5 text-amber-300">COD (Tiền mặt)</td>
                <td className="px-4 py-2.5 text-emerald-300">TK 1111 (Quỹ tiền mặt)</td>
                <td className="px-4 py-2.5 text-rose-300">TK 5111 (Doanh thu)</td>
                <td className="px-4 py-2.5 text-sky-400">SALE-{`{orderNumber}`}</td>
                <td className="px-4 py-2.5 text-slate-400 font-sans">Tăng Quỹ tiền mặt, tăng Doanh thu</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="px-4 py-2.5 font-sans font-bold text-emerald-400">Bán hàng (Sale)</td>
                <td className="px-4 py-2.5 text-amber-300">BANK / VNPAY / MOMO / CARD</td>
                <td className="px-4 py-2.5 text-emerald-300">TK 1121 (Tiền gửi NH)</td>
                <td className="px-4 py-2.5 text-rose-300">TK 5111 (Doanh thu)</td>
                <td className="px-4 py-2.5 text-sky-400">SALE-{`{orderNumber}`}</td>
                <td className="px-4 py-2.5 text-slate-400 font-sans">Tăng Tiền gửi NH, tăng Doanh thu</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="px-4 py-2.5 font-sans font-bold text-rose-400">Hoàn tiền (Refund)</td>
                <td className="px-4 py-2.5 text-amber-300">COD (Tiền mặt)</td>
                <td className="px-4 py-2.5 text-emerald-300">TK 5212 (Hàng bán trả lại)</td>
                <td className="px-4 py-2.5 text-rose-300">TK 1111 (Quỹ tiền mặt)</td>
                <td className="px-4 py-2.5 text-sky-400">REFUND-{`{orderNumber}`}</td>
                <td className="px-4 py-2.5 text-slate-400 font-sans">Tăng CP trả hàng, xuất Quỹ tiền mặt</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="px-4 py-2.5 font-sans font-bold text-rose-400">Hoàn tiền (Refund)</td>
                <td className="px-4 py-2.5 text-amber-300">BANK / VNPAY / MOMO / CARD</td>
                <td className="px-4 py-2.5 text-emerald-300">TK 5212 (Hàng bán trả lại)</td>
                <td className="px-4 py-2.5 text-rose-300">TK 1121 (Tiền gửi NH)</td>
                <td className="px-4 py-2.5 text-sky-400">REFUND-{`{orderNumber}`}</td>
                <td className="px-4 py-2.5 text-slate-400 font-sans">Tăng CP trả hàng, giảm Tiền gửi NH</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Filter Bar & Comprehensive Transactions Table */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số chứng từ (SALE-, MANUAL-), mã TX, tài khoản, diễn giải..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Right: Dropdowns & View Mode Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Account Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={accountFilter}
                onChange={e => setAccountFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer"
              >
                <option value="all">Tất cả tài khoản</option>
                <option value="1">TK 1111 - Tiền mặt tại quỹ</option>
                <option value="4">TK 1121 - Tiền gửi ngân hàng</option>
                <option value="2">TK 5111 - Doanh thu bán hàng</option>
                <option value="3">TK 5212 - Hàng bán bị trả lại</option>
              </select>
            </div>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer"
            >
              <option value="all">Nguồn: Tất cả</option>
              <option value="manual">Thủ công (Manual)</option>
              <option value="automated">Tự động (Kafka EDA)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("vouchers")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "vouchers"
                    ? "bg-[#FF4D24] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Nhật Ký Chứng Từ
              </button>
              <button
                type="button"
                onClick={() => setViewMode("rawLines")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "rawLines"
                    ? "bg-[#FF4D24] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sổ Chi Tiết Dòng
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Grouped Journal Transactions (Vouchers) */}
        {viewMode === "vouchers" && (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-sans">
                <tr>
                  <th className="px-4 py-3">Mã Bút Toán & Chứng Từ</th>
                  <th className="px-4 py-3">Ngày Hạch Toán</th>
                  <th className="px-4 py-3">Bên Nợ (Debits)</th>
                  <th className="px-4 py-3">Bên Có (Credits)</th>
                  <th className="px-4 py-3 text-right">Tổng Phát Sinh</th>
                  <th className="px-4 py-3">Diễn Giải Nghiệp Vụ</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                  <th className="px-4 py-3 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans italic">
                      Không tìm thấy bút toán sổ cái nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const isExpanded = expandedTxIds.has(tx.transactionId);
                    const debitLines = tx.lines.filter(l => l.entryType.value === "DEBIT");
                    const creditLines = tx.lines.filter(l => l.entryType.value === "CREDIT");

                    return (
                      <React.Fragment key={tx.transactionId}>
                        <tr className="hover:bg-slate-900/40 transition-colors">
                          {/* Transaction ID & Ref No */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sky-400">{tx.transactionId}</span>
                              <button
                                onClick={() => handleCopy(tx.transactionId)}
                                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                title="Sao chép mã giao dịch"
                              >
                                {copiedText === tx.transactionId ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-amber-300 font-bold">
                                {tx.referenceNumber || "AUTO-SEED"}
                              </span>
                              {tx.manualEntry ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  Thủ công
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                  Kafka EDA
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Transaction Date */}
                          <td className="px-4 py-3 text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{tx.transactionDate}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Trụ sở chính #1</span>
                          </td>

                          {/* Debits breakdown */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {debitLines.map((deb, idx) => (
                                <div key={deb.id || idx} className="flex items-center gap-1.5">
                                  <span className="text-amber-300 font-bold">TK {deb.glAccountCode}</span>
                                  <span className="text-slate-500">-</span>
                                  <span className="text-emerald-400 font-bold">{formatVND(deb.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Credits breakdown */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {creditLines.map((cred, idx) => (
                                <div key={cred.id || idx} className="flex items-center gap-1.5">
                                  <span className="text-amber-300 font-bold">TK {cred.glAccountCode}</span>
                                  <span className="text-slate-500">-</span>
                                  <span className="text-rose-400 font-bold">{formatVND(cred.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total Transaction Amount */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-white">{formatVND(tx.totalDebit)}</span>
                            <span className="text-[10px] text-slate-500 block font-sans">
                              {tx.lines.length} dòng định khoản
                            </span>
                          </td>

                          {/* Comments */}
                          <td className="px-4 py-3 font-sans text-slate-300 max-w-xs">
                            <p className="line-clamp-2 text-xs">{tx.comments || "Bút toán phát sinh"}</p>
                          </td>

                          {/* Balance Badge */}
                          <td className="px-4 py-3 text-center font-sans">
                            {tx.isBalanced ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Cân Bằng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-3 h-3" />
                                Lệch
                              </span>
                            )}
                          </td>

                          {/* Expand Details button */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(tx.transactionId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                              title={isExpanded ? "Thu gọn dòng" : "Xem chi tiết các dòng"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Drawer for Transaction Lines */}
                        {isExpanded && (
                          <tr className="bg-slate-900/30">
                            <td colSpan={8} className="p-4">
                              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                                    <Layers className="w-3.5 h-3.5 text-[#FF4D24]" />
                                    Chi Tiết Các Dòng Định Khoản Hạch Toán: {tx.transactionId}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    Tham chiếu: {tx.referenceNumber}
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-900/60 text-slate-400">
                                      <tr>
                                        <th className="px-3 py-2">ID Dòng</th>
                                        <th className="px-3 py-2">Tài Khoản GL</th>
                                        <th className="px-3 py-2">Tên Tài Khoản</th>
                                        <th className="px-3 py-2">Phân Loại</th>
                                        <th className="px-3 py-2">Loại Phát Sinh</th>
                                        <th className="px-3 py-2 text-right">Số Tiền (VND)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                      {tx.lines.map(line => (
                                        <tr key={line.id}>
                                          <td className="px-3 py-2 text-slate-500">#{line.id}</td>
                                          <td className="px-3 py-2 text-amber-300 font-bold">
                                            TK {line.glAccountCode}
                                          </td>
                                          <td className="px-3 py-2 font-sans text-white">
                                            {line.glAccountName}
                                          </td>
                                          <td className="px-3 py-2 text-slate-400">
                                            {line.glAccountType.value}
                                          </td>
                                          <td className="px-3 py-2">
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                line.entryType.value === "DEBIT"
                                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                              }`}
                                            >
                                              {line.entryType.value === "DEBIT" ? "NỢ (DEBIT)" : "CÓ (CREDIT)"}
                                            </span>
                                          </td>
                                          <td
                                            className={`px-3 py-2 text-right font-bold ${
                                              line.entryType.value === "DEBIT"
                                                ? "text-emerald-400"
                                                : "text-rose-400"
                                            }`}
                                          >
                                            {formatVND(line.amount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Raw Line Level Audit (Fineract Standard) */}
        {viewMode === "rawLines" && (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-sans">
                <tr>
                  <th className="px-4 py-3">Mã Dòng</th>
                  <th className="px-4 py-3">Mã Bút Toán (TX)</th>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Tài Khoản GL</th>
                  <th className="px-4 py-3">Phân Loại</th>
                  <th className="px-4 py-3">Bên Nợ (Debit)</th>
                  <th className="px-4 py-3">Bên Có (Credit)</th>
                  <th className="px-4 py-3">Số Chứng Từ</th>
                  <th className="px-4 py-3">Diễn Giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRawEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans italic">
                      Không tìm thấy dòng định khoản nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredRawEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-bold">#{entry.id}</td>
                      <td className="px-4 py-3 text-sky-400 font-bold">{entry.transactionId}</td>
                      <td className="px-4 py-3 text-slate-400">{entry.transactionDate}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-300 font-bold">TK {entry.glAccountCode}</span>
                        <span className="text-slate-400 font-sans ml-2 text-[11px] block sm:inline">
                          {entry.glAccountName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{entry.glAccountType.value}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">
                        {entry.entryType.value === "DEBIT" ? formatVND(entry.amount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-rose-400 font-bold">
                        {entry.entryType.value === "CREDIT" ? formatVND(entry.amount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-bold">
                        {entry.referenceNumber || "AUTO-SEED"}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-400 max-w-xs truncate">
                        {entry.comments || "Bút toán phát sinh"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Manual Double-Entry Posting Modal */}
      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultGlAccounts={glAccounts}
        onSuccess={newTx => {
          loadLedgerData();
          if (onEntryCreated) onEntryCreated();
        }}
      />
    </div>
  );
}
