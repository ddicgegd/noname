/**
 * Loan Application Modal Component (R3)
 * Allows initiating a new loan contract under an existing Fineract client,
 * selecting loan product, principal validation against limits, live repayment calculator preview,
 * and dispatching createLoan to Fineract Core.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CreditCard,
  User,
  DollarSign,
  Calendar,
  Percent,
  Calculator,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  Layers
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { FineractClient, LoanProduct, LoanAccount, CreateLoanPayload } from "@/types/fineract";
import { formatDateToFineract } from "@/lib/fineractMockStore";
import { useFineractToast } from "./FineractToast";
import { formatVND } from "./LoanActionModal";

export interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLoan: LoanAccount) => void;
  initialProductId?: number;
  initialClientId?: number;
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

export default function LoanApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  initialClientId
}: LoanApplicationModalProps) {
  const { success, fineractError, info } = useFineractToast();

  // Reference datasets
  const [clients, setClients] = useState<FineractClient[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState<boolean>(false);

  // Form inputs
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialClientId || null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(initialProductId || null);
  const [principal, setPrincipal] = useState<number>(10000000);
  const [numberOfRepayments, setNumberOfRepayments] = useState<number>(6);
  const [disbursementDate, setDisbursementDate] = useState<string>(getTodayInputString());
  const [externalId, setExternalId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load clients and products when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingRefs(true);
      Promise.all([
        fineractService.getClients("admin"),
        fineractService.getLoanProducts()
      ])
        .then(([clientList, productList]) => {
          setClients(clientList);
          setProducts(productList);

          // Defaults
          const activeClients = clientList.filter(c => c.active || c.status.id === 300);
          const firstClient = initialClientId
            ? clientList.find(c => c.id === initialClientId)
            : activeClients[0] || clientList[0];

          if (firstClient) {
            setSelectedClientId(firstClient.id);
          }

          const defaultProduct = initialProductId
            ? productList.find(p => p.id === initialProductId)
            : productList[0];

          if (defaultProduct) {
            setSelectedProductId(defaultProduct.id);
            setPrincipal(defaultProduct.principal);
            setNumberOfRepayments(defaultProduct.numberOfRepayments);
          }

          setDisbursementDate(getTodayInputString());
          setExternalId(`LOAN-APP-${Date.now().toString().slice(-6)}`);
          setFormError(null);
        })
        .catch(err => {
          console.error("[LoanApplicationModal] Failed to load reference data:", err);
          fineractError(err, "Không thể tải danh mục khách hàng và sản phẩm vay");
        })
        .finally(() => {
          setIsLoadingRefs(false);
        });
    }
  }, [isOpen, initialProductId, initialClientId, fineractError]);

  // Selected product metadata
  const currentProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Selected client metadata
  const currentClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Handle product change
  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setPrincipal(prod.principal);
      setNumberOfRepayments(prod.numberOfRepayments);
      setFormError(null);
    }
  };

  // Live Loan Calculation Preview
  const calculationPreview = useMemo(() => {
    if (!currentProduct || principal <= 0 || numberOfRepayments <= 0) {
      return null;
    }

    const rate = currentProduct.interestRatePerPeriod / 100;
    const totalInterest = Math.round(principal * rate * numberOfRepayments);
    const totalRepayment = principal + totalInterest;
    const monthlyInstallment = Math.round(totalRepayment / numberOfRepayments);
    const monthlyPrincipal = Math.round(principal / numberOfRepayments);
    const monthlyInterest = Math.round(totalInterest / numberOfRepayments);

    return {
      totalInterest,
      totalRepayment,
      monthlyInstallment,
      monthlyPrincipal,
      monthlyInterest
    };
  }, [currentProduct, principal, numberOfRepayments]);

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

  if (!isOpen) return null;

  // Validation
  const validateForm = (): boolean => {
    setFormError(null);

    if (!selectedClientId) {
      setFormError("Vui lòng chọn khách hàng đứng tên vay.");
      return false;
    }

    if (!currentProduct) {
      setFormError("Vui lòng chọn gói sản phẩm vay tín dụng.");
      return false;
    }

    if (isNaN(principal) || principal <= 0) {
      setFormError("Số tiền đề nghị vay phải lớn hơn 0.");
      return false;
    }

    if (principal < currentProduct.minPrincipal || principal > currentProduct.maxPrincipal) {
      setFormError(
        `Số tiền vay phải nằm trong hạn mức từ ${formatVND(currentProduct.minPrincipal)} đến ${formatVND(currentProduct.maxPrincipal)} của gói ${currentProduct.shortName}.`
      );
      return false;
    }

    if (isNaN(numberOfRepayments) || numberOfRepayments <= 0) {
      setFormError("Số kỳ hạn trả góp phải lớn hơn 0.");
      return false;
    }

    if (!disbursementDate) {
      setFormError("Vui lòng chọn ngày dự kiến giải ngân.");
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentProduct || !selectedClientId) return;

    setIsSubmitting(true);
    const fineractDateStr = parseInputDateToFineract(disbursementDate);

    const payload: CreateLoanPayload = {
      clientId: selectedClientId,
      productId: currentProduct.id,
      principal,
      loanTermFrequency: numberOfRepayments,
      loanTermFrequencyType: 2, // Months
      numberOfRepayments,
      repaymentEvery: 1,
      repaymentFrequencyType: 2, // Months
      interestRatePerPeriod: currentProduct.interestRatePerPeriod,
      amortizationType: 1, // Equal installments
      interestType: currentProduct.interestType.id || 0,
      expectedDisbursementDate: fineractDateStr,
      submittedOnDate: formatDateToFineract(new Date()),
      externalId: externalId.trim() || undefined
    };

    try {
      const newLoan = await fineractService.createLoan(payload);
      success(
        `Hồ sơ vay mới ${newLoan.accountNo} (${formatVND(newLoan.principal)}) đã được nộp thành công cho khách hàng ${newLoan.clientName}.`,
        "Nộp Hồ Sơ Vay Thành Công (100: PENDING)"
      );
      onSuccess(newLoan);
      onClose();
    } catch (err: any) {
      console.error("[LoanApplicationModal] Failed to create loan:", err);
      fineractError(err, "Không thể khởi tạo hồ sơ vay Fineract");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#15181F] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4D24] via-amber-500 to-sky-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Nộp Hồ Sơ Đề Nghị Vay Mới (Loan Application)
              </h3>
              <p className="text-xs text-slate-400">
                Khởi tạo hợp đồng tín dụng và đưa vào máy trạng thái Fineract FSM (100: PENDING_APPROVAL)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-50"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          {/* 1. Select Client */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF4D24]" />
                Khách Hàng Đứng Tên Vay (Borrower Client) <span className="text-rose-400">*</span>
              </span>
              {currentClient?.externalId && (
                <span className="text-[11px] font-mono text-sky-400">
                  ERP ID: #{currentClient.externalId}
                </span>
              )}
            </label>
            <select
              value={selectedClientId || ""}
              onChange={e => setSelectedClientId(Number(e.target.value))}
              disabled={isSubmitting || isLoadingRefs}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D24] transition-colors"
              required
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.displayName} ({client.accountNo}) -{" "}
                  {client.active ? "Đang hoạt động" : "Chờ duyệt"}
                  {client.externalId ? ` • ERP #${client.externalId}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Loan Product */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Gói Sản Phẩm Tín Dụng (Loan Product Catalog) <span className="text-rose-400">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(prod => {
                const isSelected = selectedProductId === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductSelect(prod.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FF4D24]/10 border-[#FF4D24] shadow-md shadow-[#FF4D24]/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-[#FF4D24]">
                        {prod.shortName}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {prod.interestRatePerPeriod}%/kỳ
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Hạn mức: {formatVND(prod.minPrincipal)} - {formatVND(prod.maxPrincipal)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Kỳ hạn mặc định: {prod.numberOfRepayments} kỳ ({prod.repaymentEvery} {prod.repaymentFrequencyType.value})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Principal Amount & Quick Select */}
          {currentProduct && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Số Tiền Đề Nghị Vay (Principal) <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Hạn mức: {formatVND(currentProduct.minPrincipal)} &ndash; {formatVND(currentProduct.maxPrincipal)}
                </span>
              </label>

              <div className="relative">
                <input
                  type="number"
                  min={currentProduct.minPrincipal}
                  max={currentProduct.maxPrincipal}
                  step={1000000}
                  value={principal || ""}
                  onChange={e => setPrincipal(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#FF4D24] transition-colors"
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  VND
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPrincipal(currentProduct.minPrincipal)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  Min ({formatVND(currentProduct.minPrincipal)})
                </button>
                {currentProduct.id === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPrincipal(10000000)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      10M
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrincipal(20000000)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      20M
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrincipal(30000000)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      30M
                    </button>
                  </>
                )}
                {currentProduct.id === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPrincipal(50000000)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      50M
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrincipal(100000000)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    >
                      100M
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPrincipal(currentProduct.maxPrincipal)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  Max ({formatVND(currentProduct.maxPrincipal)})
                </button>
              </div>
            </div>
          )}

          {/* 4. Terms, Disbursement Date & External ID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Kỳ Hạn (Kỳ) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={numberOfRepayments}
                onChange={e => setNumberOfRepayments(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Dự Kiến Giải Ngân <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={disbursementDate}
                onChange={e => setDisbursementDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Mã Liên Kết (ERP)
              </label>
              <input
                type="text"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                disabled={isSubmitting}
                placeholder="LOAN-EXT-..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-colors"
              />
            </div>
          </div>

          {/* 5. Live Repayment Calculator Preview Card */}
          {calculationPreview && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  Bảng Tính Dự Phóng Lịch Trả Nợ (Installment Estimator)
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Lãi suất: {currentProduct?.interestRatePerPeriod}%/tháng
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <div className="text-[11px] font-sans text-slate-400">Ước tính mỗi kỳ:</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {formatVND(calculationPreview.monthlyInstallment)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Gốc: {formatVND(calculationPreview.monthlyPrincipal)} + Lãi: {formatVND(calculationPreview.monthlyInterest)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-sans text-slate-400">Tổng tiền lãi vay:</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">
                    {formatVND(calculationPreview.totalInterest)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    ({numberOfRepayments} kỳ x {currentProduct?.interestRatePerPeriod}%)
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-sans text-slate-400">Tổng gốc + lãi phải trả:</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {formatVND(calculationPreview.totalRepayment)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Phương thức: Dư nợ đều
                  </div>
                </div>
              </div>
            </div>
          )}

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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF4D24] hover:bg-[#ff623d] shadow-lg shadow-[#FF4D24]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi hồ sơ tới Fineract...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nộp Hồ Sơ Đề Nghị Vay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
