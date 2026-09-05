/**
 * Loan Detail Modal & Interactive Repayment Schedule Component (R3)
 * Provides comprehensive contract summary, FSM state transition triggers,
 * and complete installment schedule breakdown (Periods 0..N).
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Building2,
  ArrowRight,
  Sparkles,
  Ban,
  Undo2,
  Receipt,
  Layers,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { LoanAccount, LoanStatusCode, RepaymentSchedulePeriod } from "@/types/fineract";
import { useFineractToast } from "./FineractToast";
import { formatVND, LoanActionType } from "./LoanActionModal";

export interface LoanDetailModalProps {
  isOpen: boolean;
  loan: LoanAccount | null;
  onClose: () => void;
  onOpenAction: (action: LoanActionType, loan: LoanAccount) => void;
}

export function formatFineractDateDisplay(dateInput?: string | [number, number, number]): string {
  if (!dateInput) return "Chưa cập nhật";
  if (Array.isArray(dateInput)) {
    return `${String(dateInput[2]).padStart(2, "0")}/${String(dateInput[1]).padStart(2, "0")}/${dateInput[0]}`;
  }
  return String(dateInput);
}

export default function LoanDetailModal({
  isOpen,
  loan,
  onClose,
  onOpenAction
}: LoanDetailModalProps) {
  const { info } = useFineractToast();
  const [activeTab, setActiveTab] = useState<"schedule" | "transactions">("schedule");
  const [copiedAccountNo, setCopiedAccountNo] = useState<boolean>(false);

  // Keyboard close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyAccount = (accountNo: string) => {
    navigator.clipboard.writeText(accountNo);
    setCopiedAccountNo(true);
    info(`Đã sao chép mã hợp đồng: ${accountNo}`, "Sao chép thành công");
    setTimeout(() => setCopiedAccountNo(false), 2000);
  };

  // Schedule summary aggregates
  const scheduleAggregates = useMemo(() => {
    if (!loan?.repaymentSchedule?.periods) {
      return {
        totalPrincipalDue: loan?.principal || 0,
        totalPrincipalPaid: loan?.summary?.principalPaid || 0,
        totalInterestDue: loan?.summary?.interestCharged || 0,
        totalInterestPaid: loan?.summary?.interestPaid || 0,
        totalPaid: loan?.summary?.totalRepayment || 0,
        netOutstanding: loan?.summary?.totalOutstanding || 0
      };
    }

    const periods = loan.repaymentSchedule.periods.filter(p => p.period > 0);
    const totalPrincipalDue = periods.reduce((acc, p) => acc + (p.principalDue || p.principalOriginalDue || 0), 0);
    const totalPrincipalPaid = periods.reduce((acc, p) => acc + (p.principalPaid || 0), 0);
    const totalInterestDue = periods.reduce((acc, p) => acc + (p.interestDue || p.interestOriginalDue || 0), 0);
    const totalInterestPaid = periods.reduce((acc, p) => acc + (p.interestPaid || 0), 0);
    const totalPaid = totalPrincipalPaid + totalInterestPaid;
    const netOutstanding = loan.summary?.totalOutstanding ?? (totalPrincipalDue + totalInterestDue - totalPaid);

    return {
      totalPrincipalDue,
      totalPrincipalPaid,
      totalInterestDue,
      totalInterestPaid,
      totalPaid,
      netOutstanding: Math.max(0, netOutstanding)
    };
  }, [loan]);

  if (!isOpen || !loan) return null;

  // Render Status Badge
  const renderStatusBadge = (code: LoanStatusCode, label: string) => {
    const styles: Record<LoanStatusCode, { bg: string; text: string; border: string; icon: any }> = {
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

    const currentStyle = styles[code] || styles[100];
    const StatusIcon = currentStyle.icon;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${currentStyle.bg} ${currentStyle.text} border ${currentStyle.border}`}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        [{code}] {label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#15181F] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4D24] via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF4D24] to-[#c7320f] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#15181F] rounded-[14px] flex items-center justify-center text-[#FF4D24]">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Hồ Sơ Khoản Vay #{loan.id}
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(loan.accountNo)}
                  className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sao chép số hợp đồng"
                >
                  {loan.accountNo}
                  {copiedAccountNo ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-sky-400" />
                  )}
                </button>
                {loan.externalId && (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ERP: {loan.externalId}
                  </span>
                )}
                {renderStatusBadge(loan.status.id, loan.status.value)}
              </div>

              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <User className="w-3.5 h-3.5 text-[#FF4D24]" />
                  Khách hàng: <strong className="text-white">{loan.clientName}</strong> (Mã KH: {loan.clientAccountNo || loan.clientId})
                </span>
                <span>•</span>
                <span className="text-slate-300">{loan.loanProductName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Contract Summary Cards Deck */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400">Số Tiền Gốc Duyệt</div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatVND(loan.principal)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Kỳ hạn: {loan.numberOfRepayments} kỳ ({loan.repaymentEvery} {loan.repaymentFrequencyType.value})
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400">Dư Nợ Còn Lại</div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  loan.status.id === 600
                    ? "text-purple-400"
                    : loan.status.id === 300
                    ? "text-emerald-400"
                    : "text-slate-300"
                }`}
              >
                {formatVND(loan.summary?.totalOutstanding || 0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Đã thanh toán: {formatVND(loan.summary?.totalRepayment || 0)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400">Lãi Suất Áp Dụng</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {loan.interestRatePerPeriod}% <span className="text-xs font-sans text-slate-400">/kỳ</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Quy đổi năm: {loan.annualInterestRate}%/năm
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400">Mốc Thời Gian</div>
              <div className="text-xs font-mono text-slate-300 mt-1 space-y-0.5">
                <div>Nộp: {formatFineractDateDisplay(loan.submittedOnDate)}</div>
                {loan.approvedOnDate && (
                  <div className="text-sky-400">Duyệt: {formatFineractDateDisplay(loan.approvedOnDate)}</div>
                )}
                {loan.actualDisbursementDate && (
                  <div className="text-emerald-400">Giải ngân: {formatFineractDateDisplay(loan.actualDisbursementDate)}</div>
                )}
                {loan.closedOnDate && (
                  <div className="text-purple-400">Tất toán: {formatFineractDateDisplay(loan.closedOnDate)}</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. State Transition Action Controls Banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FF4D24]" />
                Điều Khiển Chuyển Trạng Thái (Fineract FSM State Controls)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {loan.status.id === 100 && "Hồ sơ đang chờ thẩm định. Bạn có thể phê duyệt, từ chối hoặc khách hàng rút hồ sơ."}
                {loan.status.id === 200 && "Khoản vay đã được phê duyệt. Vui lòng giải ngân để kích hoạt lịch trả nợ."}
                {loan.status.id === 300 && "Hợp đồng đang hoạt động. Bạn có thể hạch toán thu nợ định kỳ hoặc tất toán sớm."}
                {(loan.status.id === 600 || loan.status.id === 400 || loan.status.id === 500) &&
                  "Hồ sơ này đã ở trạng thái đóng (Terminal state). Không thể thực hiện chuyển trạng thái tiếp theo."}
              </div>
            </div>

            {/* Action Buttons based on status */}
            <div className="flex flex-wrap items-center gap-2">
              {loan.status.id === 100 && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAction("approve", loan)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt Vay (Approve)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAction("reject", loan)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Từ Chối</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAction("withdraw", loan)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Rút Hồ Sơ</span>
                  </button>
                </>
              )}

              {loan.status.id === 200 && (
                <button
                  type="button"
                  onClick={() => onOpenAction("disburse", loan)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Giải Ngân Vốn (Disburse)</span>
                </button>
              )}

              {loan.status.id === 300 && (
                <button
                  type="button"
                  onClick={() => onOpenAction("repay", loan)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4D24] hover:bg-[#ff623d] text-white shadow-lg shadow-[#FF4D24]/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Thu Nợ / Trả Góp (Repayment)</span>
                </button>
              )}

              {(loan.status.id === 600 || loan.status.id === 400 || loan.status.id === 500) && (
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                  Terminal Closed State
                </span>
              )}
            </div>
          </div>

          {/* 3. Sub-Tabs: Schedule vs Transactions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "schedule"
                    ? "bg-[#FF4D24] text-white shadow-md shadow-[#FF4D24]/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch Trả Nợ Từng Kỳ ({loan.repaymentSchedule?.periods?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "transactions"
                    ? "bg-[#FF4D24] text-white shadow-md shadow-[#FF4D24]/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Nhật Ký Giao Dịch ({loan.transactions?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: REPAYMENT SCHEDULE TABLE */}
            {activeTab === "schedule" && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/70 shadow-inner">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-sans">
                      <tr>
                        <th className="px-3.5 py-2.5 text-center">Kỳ</th>
                        <th className="px-3.5 py-2.5">Ngày Đáo Hạn</th>
                        <th className="px-3.5 py-2.5 text-right">Gốc Phải Trả</th>
                        <th className="px-3.5 py-2.5 text-right">Gốc Đã Trả</th>
                        <th className="px-3.5 py-2.5 text-right">Lãi Phải Trả</th>
                        <th className="px-3.5 py-2.5 text-right">Lãi Đã Trả</th>
                        <th className="px-3.5 py-2.5 text-right">Tổng Số Kỳ</th>
                        <th className="px-3.5 py-2.5 text-right">Dư Nợ Còn Lại</th>
                        <th className="px-3.5 py-2.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {loan.repaymentSchedule?.periods && loan.repaymentSchedule.periods.length > 0 ? (
                        loan.repaymentSchedule.periods.map(period => (
                          <tr
                            key={period.period}
                            className={`transition-colors ${
                              period.period === 0
                                ? "bg-sky-950/20 text-sky-200 font-semibold"
                                : period.complete
                                ? "bg-emerald-950/10 text-slate-300"
                                : "hover:bg-slate-900/40 text-white"
                            }`}
                          >
                            {/* Period # */}
                            <td className="px-3.5 py-2.5 text-center">
                              {period.period === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                  Giải ngân
                                </span>
                              ) : (
                                <span className="font-bold text-slate-300">#{period.period}</span>
                              )}
                            </td>

                            {/* Due Date */}
                            <td className="px-3.5 py-2.5">
                              {formatFineractDateDisplay(period.dueDate)}
                            </td>

                            {/* Principal Due */}
                            <td className="px-3.5 py-2.5 text-right">
                              {period.period === 0 ? "-" : formatVND(period.principalDue || period.principalOriginalDue || 0)}
                            </td>

                            {/* Principal Paid */}
                            <td className="px-3.5 py-2.5 text-right text-emerald-400">
                              {period.period === 0 ? "-" : formatVND(period.principalPaid || 0)}
                            </td>

                            {/* Interest Due */}
                            <td className="px-3.5 py-2.5 text-right text-amber-300">
                              {period.period === 0 ? "-" : formatVND(period.interestDue || period.interestOriginalDue || 0)}
                            </td>

                            {/* Interest Paid */}
                            <td className="px-3.5 py-2.5 text-right text-emerald-400">
                              {period.period === 0 ? "-" : formatVND(period.interestPaid || 0)}
                            </td>

                            {/* Total Due For Period */}
                            <td className="px-3.5 py-2.5 text-right font-bold text-white">
                              {period.period === 0 ? "-" : formatVND(period.totalDueForPeriod || period.totalOriginalDueForPeriod || 0)}
                            </td>

                            {/* Outstanding */}
                            <td className="px-3.5 py-2.5 text-right font-bold">
                              <span
                                className={
                                  period.totalOutstandingForPeriod > 0
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }
                              >
                                {formatVND(period.totalOutstandingForPeriod || 0)}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="px-3.5 py-2.5 text-center">
                              {period.period === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-sky-400">
                                  <Check className="w-3.5 h-3.5" />
                                  Đã giải ngân
                                </span>
                              ) : period.complete ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Đã trả
                                </span>
                              ) : period.totalPaidForPeriod > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Trả 1 phần
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                                  Chưa đến hạn
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                            Chưa khởi tạo bảng tính lịch trả nợ cho hợp đồng này.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Summary Footer */}
                    <tfoot className="bg-slate-900/90 border-t-2 border-slate-700 text-slate-200 font-bold font-mono">
                      <tr>
                        <td colSpan={2} className="px-3.5 py-3 font-sans text-white">
                          TỔNG CỘNG LỊCH TRẢ NỢ:
                        </td>
                        <td className="px-3.5 py-3 text-right text-white">
                          {formatVND(scheduleAggregates.totalPrincipalDue)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-emerald-400">
                          {formatVND(scheduleAggregates.totalPrincipalPaid)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-amber-300">
                          {formatVND(scheduleAggregates.totalInterestDue)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-emerald-400">
                          {formatVND(scheduleAggregates.totalInterestPaid)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-white">
                          {formatVND(scheduleAggregates.totalPrincipalDue + scheduleAggregates.totalInterestDue)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-emerald-400">
                          {formatVND(scheduleAggregates.netOutstanding)}
                        </td>
                        <td className="px-3.5 py-3 text-center font-sans text-xs">
                          {scheduleAggregates.netOutstanding <= 0.001 ? (
                            <span className="text-purple-400">Tất toán 100%</span>
                          ) : (
                            <span className="text-amber-400">Còn nợ</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSACTIONS AUDIT LIST */}
            {activeTab === "transactions" && (
              <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/70 shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-sans">
                    <tr>
                      <th className="px-4 py-2.5">Mã Giao Dịch</th>
                      <th className="px-4 py-2.5">Ngày Thực Hiện</th>
                      <th className="px-4 py-2.5">Loại Nghiệp Vụ</th>
                      <th className="px-4 py-2.5 text-right">Số Tiền Giao Dịch</th>
                      <th className="px-4 py-2.5 text-right">Trừ Nợ Gốc</th>
                      <th className="px-4 py-2.5 text-right">Trừ Nợ Lãi</th>
                      <th className="px-4 py-2.5 text-right">Dư Nợ Sau GD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {loan.transactions && loan.transactions.length > 0 ? (
                      loan.transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-2.5 text-sky-400 font-bold">#{tx.id}</td>
                          <td className="px-4 py-2.5">{formatFineractDateDisplay(tx.date)}</td>
                          <td className="px-4 py-2.5 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.type.code.includes("disbursement")
                                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {tx.type.value}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-white">
                            {formatVND(tx.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-emerald-400">
                            {tx.principalPortion ? formatVND(tx.principalPortion) : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-amber-300">
                            {tx.interestPortion ? formatVND(tx.interestPortion) : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-200">
                            {typeof tx.outstandingLoanBalance === "number"
                              ? formatVND(tx.outstandingLoanBalance)
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                          Chưa ghi nhận giao dịch tài chính nào trên hợp đồng này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/80 bg-slate-900/50 text-xs text-slate-400">
          <div className="font-mono text-[11px]">
            Hệ thống Core Banking Fineract v1.9 • Phương pháp: Equal Installments (Trả góp định kỳ đều)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
}
