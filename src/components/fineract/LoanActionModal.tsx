/**
 * Loan Action Modal for Apache Fineract Subsystem
 * Implements strict Fineract Finite State Machine (FSM) state transitions:
 * - Approve (100 -> 200)
 * - Disburse (200 -> 300)
 * - Reject (100 -> 500)
 * - Withdraw (100 -> 400)
 * - Repay (300 -> 300 or 600: OBLIGATIONS_MET)
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  Building2,
  Ban,
  Undo2,
  Check,
  Sparkles,
  ShieldAlert,
  Percent,
  Wallet
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { LoanAccount, LoanStatusCode } from "@/types/fineract";
import { formatDateToFineract, parseFineractDate } from "@/lib/fineractMockStore";
import { useFineractToast } from "./FineractToast";

export type LoanActionType = "approve" | "disburse" | "reject" | "withdraw" | "repay";

export interface LoanActionModalProps {
  isOpen: boolean;
  action: LoanActionType | null;
  loan: LoanAccount | null;
  onClose: () => void;
  onSuccess: (updatedLoan: LoanAccount) => void;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}

function getTodayInputString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseInputDateToFineract(val: string): string {
  if (!val) return formatDateToFineract(new Date());
  const [y, m, d] = val.split("-").map(Number);
  return formatDateToFineract(new Date(y, m - 1, d));
}

export default function LoanActionModal({
  isOpen,
  action,
  loan,
  onClose,
  onSuccess
}: LoanActionModalProps) {
  const { success, fineractError, info } = useFineractToast();

  // Form State
  const [dateInput, setDateInput] = useState<string>(getTodayInputString());
  const [note, setNote] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"BANK" | "CASH" | "VNPAY">("BANK");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Determine next period due amount for default repayment
  const nextPeriodDue = useMemo(() => {
    if (!loan || !loan.repaymentSchedule?.periods) {
      return loan?.summary?.totalOutstanding || 0;
    }
    const nextIncomplete = loan.repaymentSchedule.periods.find(
      p => p.period > 0 && !p.complete && p.totalOutstandingForPeriod > 0
    );
    if (nextIncomplete) {
      return nextIncomplete.totalOutstandingForPeriod;
    }
    return loan.summary?.totalOutstanding || 0;
  }, [loan]);

  // Reset form when modal opens or action/loan changes
  useEffect(() => {
    if (isOpen && loan) {
      setDateInput(getTodayInputString());
      setNote("");
      setFormError(null);
      setIsSubmitting(false);

      if (action === "repay") {
        setRepayAmount(Math.min(nextPeriodDue, loan.summary.totalOutstanding));
        setPaymentMethod("BANK");
      }
    }
  }, [isOpen, action, loan, nextPeriodDue]);

  // Keyboard close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !loan || !action) return null;

  // Remaining balance calculation during repayment
  const balanceAfterRepay = Math.max(0, (loan.summary.totalOutstanding || 0) - repayAmount);
  const willCompleteLoan = action === "repay" && (balanceAfterRepay <= 0.001 || repayAmount >= (loan.summary.totalOutstanding || 0));

  // Form validation
  const validateForm = (): boolean => {
    setFormError(null);

    if (!dateInput) {
      setFormError("Vui lòng chọn ngày thực hiện giao dịch.");
      return false;
    }

    if (action === "disburse") {
      const disburseDate = new Date(dateInput);
      const approvedDateStr = loan.approvedOnDate || loan.submittedOnDate;
      const approvedDate = parseFineractDate(approvedDateStr);
      // Reset hours for comparison
      disburseDate.setHours(0, 0, 0, 0);
      approvedDate.setHours(0, 0, 0, 0);

      if (disburseDate.getTime() < approvedDate.getTime()) {
        setFormError(
          `Ngày giải ngân thực tế không thể trước ngày phê duyệt (${formatDateToFineract(approvedDate)}).`
        );
        return false;
      }
    }

    if (action === "repay") {
      if (isNaN(repayAmount) || repayAmount <= 0) {
        setFormError("Số tiền thanh toán phải lớn hơn 0.");
        return false;
      }
      if (repayAmount > (loan.summary.totalOutstanding || 0) + 0.01) {
        setFormError(
          `Số tiền thanh toán (${formatVND(repayAmount)}) không thể vượt quá tổng dư nợ còn lại (${formatVND(loan.summary.totalOutstanding)}).`
        );
        return false;
      }
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const fineractDateStr = parseInputDateToFineract(dateInput);

    try {
      let updated: LoanAccount;

      switch (action) {
        case "approve": {
          updated = await fineractService.approveLoan(loan.id, fineractDateStr, note.trim() || undefined);
          success(
            `Hồ sơ vay ${loan.accountNo} đã được phê duyệt thành công vào ngày ${fineractDateStr}.`,
            "Phê Duyệt Thành Công (200: APPROVED)"
          );
          break;
        }

        case "disburse": {
          updated = await fineractService.disburseLoan(loan.id, fineractDateStr, note.trim() || undefined);
          success(
            `Đã giải ngân số tiền ${formatVND(loan.principal)} cho hợp đồng ${loan.accountNo}. Khoản vay hiện đang hoạt động.`,
            "Giải Ngân Vốn Thành Công (300: ACTIVE)"
          );
          break;
        }

        case "reject": {
          updated = await fineractService.rejectLoan(loan.id, fineractDateStr, note.trim() || undefined);
          info(
            `Hồ sơ vay ${loan.accountNo} đã bị từ chối vào ngày ${fineractDateStr}.`,
            "Đã Từ Chối Hồ Sơ (500: REJECTED)"
          );
          break;
        }

        case "withdraw": {
          updated = await fineractService.withdrawLoan(loan.id, fineractDateStr, note.trim() || undefined);
          info(
            `Người vay đã rút hồ sơ hợp đồng ${loan.accountNo}.`,
            "Đã Rút Hồ Sơ Vay (400: WITHDRAWN)"
          );
          break;
        }

        case "repay": {
          const res = await fineractService.repayLoan(loan.id, repayAmount, fineractDateStr);
          updated = res.loan;
          if (updated.status.id === 600) {
            success(
              `Khoản vay ${loan.accountNo} đã được thanh toán toàn bộ và tất toán thành công (Mã GD #${res.transactionId}).`,
              "Tất Toán Thành Công (600: OBLIGATIONS_MET)"
            );
          } else {
            success(
              `Đã thu nợ ${formatVND(repayAmount)} cho hợp đồng ${loan.accountNo}. Dư nợ còn lại: ${formatVND(updated.summary.totalOutstanding)}.`,
              "Thanh Toán Trả Góp Thành Công"
            );
          }
          break;
        }

        default:
          throw new Error("Loại hành động không hợp lệ.");
      }

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("[LoanActionModal] Action failed:", err);
      fineractError(err, `Lỗi xử lý ${action.toUpperCase()} hồ sơ vay`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Action Specific Titles, Colors & Icons
  const actionConfig = {
    approve: {
      title: "Phê Duyệt Hồ Sơ Vay (Loan Approval)",
      subTitle: "Chuyển trạng thái từ Chờ duyệt (100) sang Đã duyệt (200: APPROVED)",
      icon: CheckCircle2,
      color: "sky",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      btnText: "Xác Nhận Phê Duyệt",
      btnClass: "bg-sky-600 hover:bg-sky-500 shadow-sky-900/30 text-white"
    },
    disburse: {
      title: "Giải Ngân Vốn Vay (Loan Disbursement)",
      subTitle: "Chuyển trạng thái từ Đã duyệt (200) sang Đang hoạt động (300: ACTIVE)",
      icon: ArrowRight,
      color: "emerald",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      btnText: "Xác Nhận Giải Ngân",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 text-white"
    },
    reject: {
      title: "Từ Chối Hồ Sơ Vay (Loan Rejection)",
      subTitle: "Đóng hồ sơ với trạng thái Bị từ chối (500: REJECTED - Terminal)",
      icon: Ban,
      color: "rose",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      btnText: "Xác Nhận Từ Chối",
      btnClass: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/30 text-white"
    },
    withdraw: {
      title: "Rút Hồ Sơ Vay (Loan Withdrawal)",
      subTitle: "Đóng hồ sơ do khách hàng rút đơn (400: WITHDRAWN - Terminal)",
      icon: Undo2,
      color: "slate",
      badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      btnText: "Xác Nhận Rút Hồ Sơ",
      btnClass: "bg-slate-700 hover:bg-slate-600 shadow-slate-900/30 text-white"
    },
    repay: {
      title: "Thu Nợ / Trả Góp Định Kỳ (Loan Repayment)",
      subTitle: "Hạch toán khoản trả nợ gốc và lãi vào tài khoản hợp đồng",
      icon: DollarSign,
      color: "emerald",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      btnText: willCompleteLoan ? "Tất Toán Toàn Bộ Khoản Vay" : "Xác Nhận Thu Nợ",
      btnClass: willCompleteLoan
        ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30 text-white"
        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 text-white"
    }
  }[action];

  const ActionIcon = actionConfig.icon;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#15181F] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            action === "approve"
              ? "bg-sky-500"
              : action === "disburse"
              ? "bg-emerald-500"
              : action === "reject"
              ? "bg-rose-500"
              : action === "withdraw"
              ? "bg-slate-500"
              : "bg-gradient-to-r from-emerald-500 via-[#FF4D24] to-purple-500"
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                action === "approve"
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : action === "disburse"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : action === "reject"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : action === "withdraw"
                  ? "bg-slate-500/10 border-slate-500/20 text-slate-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              <ActionIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {actionConfig.title}
              </h3>
              <p className="text-xs text-slate-400">{actionConfig.subTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-50"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Contract Overview Pill */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Mã hợp đồng vay:</span>
              <span className="font-mono text-xs font-bold text-sky-400">{loan.accountNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Khách hàng vay vốn:</span>
              <span className="text-xs font-semibold text-white">{loan.clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Gói tín dụng:</span>
              <span className="text-xs text-slate-300">{loan.loanProductName}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400">Số tiền gốc / Dư nợ:</span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {formatVND(loan.principal)} / {formatVND(loan.summary?.totalOutstanding || 0)}
              </span>
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          {/* Specific Inputs: Approve / Disburse / Reject / Withdraw */}
          <div className="space-y-4">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF4D24]" />
                {action === "approve"
                  ? "Ngày Phê Duyệt (approvedOnDate)"
                  : action === "disburse"
                  ? "Ngày Giải Ngân Thực Tế (actualDisbursementDate)"
                  : action === "reject"
                  ? "Ngày Từ Chối (rejectedOnDate)"
                  : action === "withdraw"
                  ? "Ngày Rút Hồ Sơ (withdrawnOnDate)"
                  : "Ngày Thu Nợ / Giao Dịch (transactionDate)"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
              <div className="text-[11px] font-mono text-slate-500">
                Định dạng Fineract gửi đi: {parseInputDateToFineract(dateInput)}
              </div>
            </div>

            {/* Repayment Specific Controls */}
            {action === "repay" && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                {/* Repayment Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Số Tiền Thanh Toán (VND) <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Tối đa: {formatVND(loan.summary.totalOutstanding)}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={loan.summary.totalOutstanding}
                      step={1000}
                      value={repayAmount || ""}
                      onChange={e => setRepayAmount(Number(e.target.value))}
                      disabled={isSubmitting}
                      placeholder="Nhập số tiền cần thanh toán..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      VND
                    </div>
                  </div>

                  {/* Quick Select Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setRepayAmount(Math.min(nextPeriodDue, loan.summary.totalOutstanding))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      Kỳ tiếp theo ({formatVND(nextPeriodDue)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(Math.round(loan.summary.totalOutstanding / 2))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      50% Dư nợ ({formatVND(Math.round(loan.summary.totalOutstanding / 2))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(loan.summary.totalOutstanding)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-colors cursor-pointer"
                    >
                      Tất toán toàn bộ ({formatVND(loan.summary.totalOutstanding)})
                    </button>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-sky-400" />
                    Kênh Thanh Toán (Payment Channel)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === "BANK"
                          ? "bg-sky-500/10 border-sky-500 text-white shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold">Ngân Hàng</div>
                      <div className="text-[10px] text-slate-400">Chuyển khoản (TK 4)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === "CASH"
                          ? "bg-emerald-500/10 border-emerald-500 text-white shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold">Tiền Mặt</div>
                      <div className="text-[10px] text-slate-400">Thu tại quỹ (TK 1)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VNPAY")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === "VNPAY"
                          ? "bg-amber-500/10 border-amber-500 text-white shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold">VNPAY / Thẻ</div>
                      <div className="text-[10px] text-slate-400">Cổng trực tuyến</div>
                    </button>
                  </div>
                </div>

                {/* Dynamic Balance Projection Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Dư nợ sau thanh toán:</span>
                  <span
                    className={`text-sm font-bold ${
                      willCompleteLoan ? "text-purple-400" : "text-emerald-400"
                    }`}
                  >
                    {formatVND(balanceAfterRepay)}
                  </span>
                </div>

                {willCompleteLoan && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      Giao dịch này sẽ xóa toàn bộ dư nợ. Khoản vay sẽ tự động chuyển sang trạng thái{" "}
                      <strong>600: OBLIGATIONS_MET</strong> (Đã tất toán).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Note / Memo input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Ghi Chú / Nội Dung Xác Thực ({action === "reject" ? "Lý do từ chối" : "Tùy chọn"})
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={isSubmitting}
                placeholder={
                  action === "approve"
                    ? "Hồ sơ đáp ứng điều kiện tín dụng..."
                    : action === "disburse"
                    ? "Giải ngân qua tài khoản thụ hưởng..."
                    : action === "reject"
                    ? "Không đủ điều kiện cấp tín dụng..."
                    : action === "withdraw"
                    ? "Khách hàng yêu cầu rút hồ sơ..."
                    : "Nội dung trả góp kỳ này..."
                }
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-colors resize-none"
              />
            </div>

            {/* Warning Banner for Terminal States */}
            {(action === "reject" || action === "withdraw") && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Cảnh báo Fineract FSM:</strong> Thao tác này sẽ đưa hồ sơ vay vào trạng thái kết thúc (Terminal State).
                  Hồ sơ sẽ không thể phê duyệt hoặc giải ngân được nữa.
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${actionConfig.btnClass}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý trên Fineract...</span>
                </>
              ) : (
                <>
                  <ActionIcon className="w-4 h-4" />
                  <span>{actionConfig.btnText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
