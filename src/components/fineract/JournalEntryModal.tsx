/**
 * Journal Entry Modal for Apache Fineract General Ledger (R4)
 * Multi-line double-entry journal voucher posting modal with real-time invariant guard:
 * Strictly enforces Sum(Debit) == Sum(Credit) before submission can be unlocked.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  Calendar,
  FileText,
  Building2,
  Info,
  Layers,
  Wand2
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import {
  GlAccountInfo,
  CreateJournalEntryPayload,
  JournalEntryTransaction
} from "@/types/fineract";
import { formatDateToFineract } from "@/lib/fineractMockStore";
import { useFineractToast } from "./FineractToast";
import { formatVND } from "./FineractOverview";

export interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: JournalEntryTransaction) => void;
  defaultGlAccounts?: GlAccountInfo[];
}

interface FormLineItem {
  id: string;
  glAccountId: number;
  amount: number | string;
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

function generateRefNo(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MANUAL-TX-${rand}`;
}

export default function JournalEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultGlAccounts
}: JournalEntryModalProps) {
  const { success, fineractError, warning } = useFineractToast();

  // GL Accounts
  const [glAccounts, setGlAccounts] = useState<GlAccountInfo[]>(defaultGlAccounts || []);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Form Fields
  const [dateInput, setDateInput] = useState<string>(getTodayInputString());
  const [referenceNumber, setReferenceNumber] = useState<string>(generateRefNo());
  const [comments, setComments] = useState<string>("Bút toán điều chỉnh định khoản sổ cái");
  const [officeId, setOfficeId] = useState<number>(1);

  // Debit and Credit line items
  const [debits, setDebits] = useState<FormLineItem[]>([
    { id: "deb-1", glAccountId: 1, amount: 500000 }
  ]);
  const [credits, setCredits] = useState<FormLineItem[]>([
    { id: "cred-1", glAccountId: 2, amount: 500000 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Load GL Accounts if not provided
  useEffect(() => {
    if (isOpen) {
      if (!defaultGlAccounts || defaultGlAccounts.length === 0) {
        setIsLoadingAccounts(true);
        fineractService
          .getGlAccounts()
          .then(accounts => setGlAccounts(accounts))
          .catch(err => console.error("Error loading GL accounts:", err))
          .finally(() => setIsLoadingAccounts(false));
      } else {
        setGlAccounts(defaultGlAccounts);
      }
      // Regenerate reference number when opened
      setReferenceNumber(generateRefNo());
    }
  }, [isOpen, defaultGlAccounts]);

  // Mathematical Sums & Invariant Guard
  const totalDebit = useMemo(() => {
    return debits.reduce((acc, item) => {
      const val = typeof item.amount === "number" ? item.amount : parseFloat(item.amount) || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);
  }, [debits]);

  const totalCredit = useMemo(() => {
    return credits.reduce((acc, item) => {
      const val = typeof item.amount === "number" ? item.amount : parseFloat(item.amount) || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);
  }, [credits]);

  const delta = useMemo(() => {
    return Math.abs(totalDebit - totalCredit);
  }, [totalDebit, totalCredit]);

  const isBalanced = useMemo(() => {
    return delta < 0.001 && totalDebit > 0;
  }, [delta, totalDebit]);

  // Handle Debit Line modifications
  const handleAddDebit = () => {
    setDebits(prev => [
      ...prev,
      {
        id: `deb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        glAccountId: glAccounts[0]?.id || 1,
        amount: ""
      }
    ]);
  };

  const handleRemoveDebit = (index: number) => {
    if (debits.length <= 1) {
      warning("Chứng từ phải có ít nhất 1 dòng Nợ (Debit).");
      return;
    }
    setDebits(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDebit = (index: number, field: keyof FormLineItem, value: any) => {
    setDebits(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle Credit Line modifications
  const handleAddCredit = () => {
    setCredits(prev => [
      ...prev,
      {
        id: `cred-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        glAccountId: glAccounts[1]?.id || 2,
        amount: ""
      }
    ]);
  };

  const handleRemoveCredit = (index: number) => {
    if (credits.length <= 1) {
      warning("Chứng từ phải có ít nhất 1 dòng Có (Credit).");
      return;
    }
    setCredits(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCredit = (index: number, field: keyof FormLineItem, value: any) => {
    setCredits(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Quick Balance Action
  const handleAutoBalance = () => {
    if (totalDebit > 0 && totalCredit === 0) {
      // Balance Credit to match Debit
      setCredits(prev => {
        const copy = [...prev];
        copy[copy.length - 1].amount = totalDebit;
        return copy;
      });
    } else if (totalCredit > 0 && totalDebit === 0) {
      // Balance Debit to match Credit
      setDebits(prev => {
        const copy = [...prev];
        copy[copy.length - 1].amount = totalCredit;
        return copy;
      });
    } else if (totalDebit > totalCredit) {
      // Add difference to last credit line
      setCredits(prev => {
        const copy = [...prev];
        const lastAmount =
          typeof copy[copy.length - 1].amount === "number"
            ? (copy[copy.length - 1].amount as number)
            : parseFloat(copy[copy.length - 1].amount as string) || 0;
        copy[copy.length - 1].amount = lastAmount + delta;
        return copy;
      });
    } else if (totalCredit > totalDebit) {
      // Add difference to last debit line
      setDebits(prev => {
        const copy = [...prev];
        const lastAmount =
          typeof copy[copy.length - 1].amount === "number"
            ? (copy[copy.length - 1].amount as number)
            : parseFloat(copy[copy.length - 1].amount as string) || 0;
        copy[copy.length - 1].amount = lastAmount + delta;
        return copy;
      });
    }
  };

  // Quick Preset Templates
  const handleApplyTemplate = (type: string) => {
    setActiveTemplate(type);
    switch (type) {
      case "cash-to-bank":
        setComments("Điều chuyển tiền mặt tại quỹ nộp vào tài khoản ngân hàng");
        setDebits([{ id: "deb-1", glAccountId: 4, amount: 10000000 }]); // Bank
        setCredits([{ id: "cred-1", glAccountId: 1, amount: 10000000 }]); // Cash
        break;
      case "bank-to-cash":
        setComments("Rút tiền gửi ngân hàng nhập quỹ tiền mặt");
        setDebits([{ id: "deb-1", glAccountId: 1, amount: 5000000 }]); // Cash
        setCredits([{ id: "cred-1", glAccountId: 4, amount: 5000000 }]); // Bank
        break;
      case "sale-cash":
        setComments("Ghi nhận doanh thu bán hàng thu tiền mặt trực tiếp (COD)");
        setDebits([{ id: "deb-1", glAccountId: 1, amount: 1500000 }]); // Cash
        setCredits([{ id: "cred-1", glAccountId: 2, amount: 1500000 }]); // Revenue
        break;
      case "sale-split":
        setComments("Bán hàng thanh toán kết hợp: 40% Tiền mặt + 60% Chuyển khoản ngân hàng");
        setDebits([
          { id: "deb-1", glAccountId: 1, amount: 2000000 }, // Cash 2M
          { id: "deb-2", glAccountId: 4, amount: 3000000 } // Bank 3M
        ]);
        setCredits([
          { id: "cred-1", glAccountId: 2, amount: 5000000 } // Revenue 5M
        ]);
        break;
      case "refund-bank":
        setComments("Khách trả hàng - Hoàn tiền qua chuyển khoản ngân hàng");
        setDebits([{ id: "deb-1", glAccountId: 3, amount: 750000 }]); // Returns (contra-revenue)
        setCredits([{ id: "cred-1", glAccountId: 4, amount: 750000 }]); // Bank
        break;
      default:
        break;
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      warning(
        `Nguyên tắc kế toán kép vi phạm: Tổng Nợ (${formatVND(totalDebit)}) khác Tổng Có (${formatVND(totalCredit)}). Chênh lệch: ${formatVND(delta)}. Không thể ghi sổ!`,
        "Cảnh Báo Cân Bằng Kế Toán"
      );
      return;
    }

    // Verify all line amounts > 0
    const debitsPayload = debits.map(d => ({
      glAccountId: Number(d.glAccountId),
      amount: typeof d.amount === "number" ? d.amount : parseFloat(d.amount) || 0
    }));
    const creditsPayload = credits.map(c => ({
      glAccountId: Number(c.glAccountId),
      amount: typeof c.amount === "number" ? c.amount : parseFloat(c.amount) || 0
    }));

    if (debitsPayload.some(d => d.amount <= 0) || creditsPayload.some(c => c.amount <= 0)) {
      warning("Tất cả các dòng định khoản phải có số tiền lớn hơn 0.", "Dữ liệu không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateJournalEntryPayload = {
        officeId,
        transactionDate: parseInputDateToFineract(dateInput),
        referenceNumber: referenceNumber.trim() || generateRefNo(),
        comments: comments.trim() || "Bút toán sổ cái thủ công",
        currencyCode: "VND",
        debits: debitsPayload,
        credits: creditsPayload
      };

      const result = await fineractService.createJournalEntry(payload);
      success(
        `Đã ghi nhận bút toán kép ${result.referenceNumber || result.transactionId} thành công vào Sổ Cái Kế Toán. Tổng phát sinh: ${formatVND(result.totalDebit)}.`,
        "Ghi Sổ Cái Thành Công"
      );
      onSuccess(result);
      onClose();
    } catch (err) {
      console.error("[JournalEntryModal] Submission error:", err);
      fineractError(err, "Không thể ghi nhận bút toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15181F] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Glow accent header */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF4D24]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D24] to-[#d6340c] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#15181F] rounded-[10px] flex items-center justify-center text-[#FF4D24]">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Ghi Bút Toán Sổ Cái Mới (Double-Entry Voucher)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                  R4 Invariant Guard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thực hiện hạch toán kế toán kép bảo toàn nghiêm ngặt nguyên tắc &Sigma; Nợ (Debit) &equiv; &Sigma; Có (Credit).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 text-xs">
          {/* Quick Preset Templates Bar */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Mẫu Định Khoản Nhanh (Preset Templates):
              </span>
              <span className="text-[11px] text-slate-400">Nhấp để áp dụng cấu hình tự động</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyTemplate("cash-to-bank")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTemplate === "cash-to-bank"
                    ? "bg-[#FF4D24]/20 border-[#FF4D24] text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>Nộp Quỹ &rarr; Ngân Hàng (10M)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("bank-to-cash")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTemplate === "bank-to-cash"
                    ? "bg-[#FF4D24]/20 border-[#FF4D24] text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>Rút Ngân Hàng &rarr; Quỹ Tiền Mặt (5M)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("sale-cash")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTemplate === "sale-cash"
                    ? "bg-[#FF4D24]/20 border-[#FF4D24] text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>Bán Hàng Thu Tiền Mặt (1.5M)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("sale-split")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTemplate === "sale-split"
                    ? "bg-[#FF4D24]/20 border-[#FF4D24] text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>Tách Nhiều Dòng (40% Tiền Mặt + 60% Bank)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("refund-bank")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTemplate === "refund-bank"
                    ? "bg-[#FF4D24]/20 border-[#FF4D24] text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>Hoàn Trả Hàng &rarr; Trả Lại Bank (750k)</span>
              </button>
            </div>
          </div>

          {/* Header Metadata Inputs: Date, Reference No, Office, Comments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF4D24]" />
                Ngày Giao Dịch (Transaction Date) <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                Số Chứng Từ / Tham Chiếu <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="MANUAL-TX-XXXX"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Đơn Vị Kế Toán / Chi Nhánh
              </label>
              <select
                value={officeId}
                onChange={e => setOfficeId(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF4D24] transition-colors cursor-pointer"
              >
                <option value={1}>1 - Trụ sở chính (Head Office)</option>
                <option value={2}>2 - Chi nhánh Hồ Chí Minh (Branch HCM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              Diễn Giải / Ghi Chú Nghiệp Vụ (Comments / Narration) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Nhập nội dung nghiệp vụ kinh tế phát sinh..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF4D24] transition-colors"
              required
            />
          </div>

          {/* Double-Entry Split Columns (Debits on Left, Credits on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: DEBITS */}
            <div className="bg-slate-950/70 border border-emerald-900/40 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400">Bên Nợ (Debits)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {debits.length} dòng
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddDebit}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Dòng Nợ
                </button>
              </div>

              {/* Debit Lines List */}
              <div className="space-y-3">
                {debits.map((line, idx) => (
                  <div
                    key={line.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 relative group hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        DÒNG NỢ #{idx + 1}
                      </span>
                      {debits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDebit(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <label className="text-[10px] text-slate-400 block mb-1">Tài Khoản GL</label>
                        <select
                          value={line.glAccountId}
                          onChange={e => handleUpdateDebit(idx, "glAccountId", Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {glAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              TK {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="text-[10px] text-slate-400 block mb-1">Số Tiền (VND)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={line.amount}
                          onChange={e => handleUpdateDebit(idx, "amount", e.target.value)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Debit Subtotal */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Tổng Phát Sinh Nợ:</span>
                <span className="font-mono text-sm text-emerald-400">{formatVND(totalDebit)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: CREDITS */}
            <div className="bg-slate-950/70 border border-rose-900/40 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-sm font-bold text-rose-400">Bên Có (Credits)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {credits.length} dòng
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCredit}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Dòng Có
                </button>
              </div>

              {/* Credit Lines List */}
              <div className="space-y-3">
                {credits.map((line, idx) => (
                  <div
                    key={line.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 relative group hover:border-rose-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        DÒNG CÓ #{idx + 1}
                      </span>
                      {credits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCredit(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <label className="text-[10px] text-slate-400 block mb-1">Tài Khoản GL</label>
                        <select
                          value={line.glAccountId}
                          onChange={e => handleUpdateCredit(idx, "glAccountId", Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          {glAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              TK {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="text-[10px] text-slate-400 block mb-1">Số Tiền (VND)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={line.amount}
                          onChange={e => handleUpdateCredit(idx, "amount", e.target.value)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-rose-400 text-right focus:outline-none focus:border-rose-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Credit Subtotal */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Tổng Phát Sinh Có:</span>
                <span className="font-mono text-sm text-rose-400">{formatVND(totalCredit)}</span>
              </div>
            </div>
          </div>

          {/* 3. Real-Time Double-Entry Invariant Guard Alert Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isBalanced
                ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                : "bg-rose-950/30 border-rose-800/60 text-rose-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {isBalanced ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                )}
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {isBalanced ? (
                      <span className="text-emerald-400">Bút Toán Cân Bằng (Balanced Invariant Satisfied)</span>
                    ) : (
                      <span className="text-rose-400">Nguyên Tắc Kế Toán Kép Vi Phạm (Imbalanced)</span>
                    )}
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300">
                      &Delta; = {formatVND(delta)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {isBalanced
                      ? `Tổng phát sinh Nợ (${formatVND(totalDebit)}) hoàn toàn khớp với Tổng phát sinh Có (${formatVND(totalCredit)}). Nút ghi nhận đã được mở khóa.`
                      : `Tổng Nợ (${formatVND(totalDebit)}) khác Tổng Có (${formatVND(totalCredit)}). Chênh lệch ${formatVND(delta)}. Nút ghi sổ bị khóa theo quy tắc bảo toàn.`}
                  </p>
                </div>
              </div>

              {!isBalanced && delta > 0 && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Cân Bằng Tự Động
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Modal Footer: Invariant Status Summary & Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TỔNG NỢ (DR)</span>
              <span className="font-bold text-emerald-400 text-sm">{formatVND(totalDebit)}</span>
            </div>
            <span className="text-slate-600 font-bold text-lg">=</span>
            <div>
              <span className="text-slate-500 block text-[10px]">TỔNG CÓ (CR)</span>
              <span className="font-bold text-rose-400 text-sm">{formatVND(totalCredit)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800/60 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isBalanced || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                isBalanced && !isSubmitting
                  ? "bg-[#FF4D24] hover:bg-[#FF4D24]/90 text-white shadow-[#FF4D24]/20 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{isSubmitting ? "Đang Ghi Sổ..." : "Ghi Nhận Bút Toán (Submit)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
