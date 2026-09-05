/**
 * Apache Fineract Deep Error Inspector & Diagnostics Drawer/Dialog
 * Parses fineractResponse JSON to present developerMessage, defaultUserMessage,
 * globalisation code, and parameterName in high-density engineering detail.
 */

import React, { useState, useMemo } from "react";
import {
  Bug,
  X,
  Copy,
  Check,
  Code,
  Terminal,
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Play,
  FileJson,
  Layers
} from "lucide-react";
import {
  extractFineractError,
  FINERACT_I18N_CODES
} from "@/lib/fineractErrorExtractor";
import { FineractParsedError } from "@/types/fineract";

export interface FineractErrorInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  error?: unknown;
  onSelectTestError?: (testKey: string) => void;
}

// Built-in test cases matching Fineract 1.x real engine errors
export const SAMPLE_FINERACT_ERRORS: Record<string, { label: string; payload: any }> = {
  futureApproval: {
    label: "Duyệt ngày tương lai (HTTP 403)",
    payload: {
      status: "error",
      httpStatusCode: 403,
      message: "Lỗi từ hệ thống Core Banking (Fineract).",
      fineractResponse: JSON.stringify({
        developerMessage: "The date on which a loan is approved cannot be in the future.",
        httpStatusCode: "403",
        defaultUserMessage: "The date on which a loan is approved cannot be in the future.",
        userMessageGlobalisationCode: "error.msg.loan.approval.cannot.be.in.the.future",
        parameterName: "approvedOnDate",
        errors: [
          {
            developerMessage: "The date on which a loan is approved cannot be in the future.",
            defaultUserMessage: "The date on which a loan is approved cannot be in the future.",
            userMessageGlobalisationCode: "error.msg.loan.approval.cannot.be.in.the.future",
            parameterName: "approvedOnDate",
            value: "2030-01-01"
          }
        ]
      })
    }
  },
  disbursementBeforeApproval: {
    label: "Giải ngân trước ngày duyệt (HTTP 403)",
    payload: {
      status: "error",
      httpStatusCode: 403,
      message: "Lỗi từ hệ thống Core Banking (Fineract).",
      fineractResponse: JSON.stringify({
        developerMessage: "The date on which a loan is disbursed cannot be before the approval date.",
        httpStatusCode: "403",
        defaultUserMessage: "The date on which a loan is disbursed cannot be before the approval date.",
        userMessageGlobalisationCode: "error.msg.loan.disbursement.cannot.be.before.approval",
        parameterName: "actualDisbursementDate"
      })
    }
  },
  doubleEntryImbalance: {
    label: "Bút toán kép lệch Nợ/Có (HTTP 400)",
    payload: {
      status: "error",
      httpStatusCode: 400,
      message: "Nguyên tắc kế toán kép bị vi phạm: Tổng Nợ phải bằng Tổng Có.",
      fineractResponse: JSON.stringify({
        developerMessage: "Double-entry balance check failed: Total Debit (1,500,000) != Total Credit (1,200,000).",
        httpStatusCode: "400",
        defaultUserMessage: "Nguyên tắc kế toán kép bị vi phạm: Tổng Nợ (Debit) phải luôn bằng Tổng Có (Credit).",
        userMessageGlobalisationCode: "error.msg.gl.double.entry.imbalanced",
        parameterName: "debits_credits_delta"
      })
    }
  },
  repaymentExceedsOutstanding: {
    label: "Trả nợ vượt dư nợ (HTTP 400)",
    payload: {
      status: "error",
      httpStatusCode: 400,
      message: "Lỗi thanh toán khoản vay Fineract.",
      fineractResponse: JSON.stringify({
        developerMessage: "Repayment amount 50,000,000 exceeds total outstanding principal and interest 24,150,000.",
        httpStatusCode: "400",
        defaultUserMessage: "Số tiền thanh toán trả góp không thể vượt quá tổng dư nợ còn lại của khoản vay.",
        userMessageGlobalisationCode: "error.msg.loan.repayment.amount.cannot.exceed.outstanding",
        parameterName: "transactionAmount"
      })
    }
  },
  duplicateExternalId: {
    label: "Trùng mã khách hàng ERP (HTTP 400)",
    payload: {
      status: "error",
      httpStatusCode: 400,
      message: "Lỗi đăng ký khách hàng.",
      fineractResponse: JSON.stringify({
        developerMessage: "Client with externalId 'USR-8821' already exists in Core Banking database.",
        httpStatusCode: "400",
        defaultUserMessage: "Khách hàng với mã liên kết hệ thống (externalId) này đã tồn tại trên Core Banking.",
        userMessageGlobalisationCode: "error.msg.client.externalId.already.exists",
        parameterName: "externalId"
      })
    }
  }
};

export default function FineractErrorInspector({
  isOpen,
  onClose,
  error,
  onSelectTestError
}: FineractErrorInspectorProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [rawJsonExpanded, setRawJsonExpanded] = useState(false);
  const [activeSampleKey, setActiveSampleKey] = useState<string>("futureApproval");

  // Determine current error to inspect: either passed in prop or selected sample
  const currentErrorInput = useMemo(() => {
    if (error) return error;
    return SAMPLE_FINERACT_ERRORS[activeSampleKey]?.payload;
  }, [error, activeSampleKey]);

  const parsedError: FineractParsedError = useMemo(() => {
    return extractFineractError(currentErrorInput);
  }, [currentErrorInput]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (parsedError.userMessageGlobalisationCode) {
      navigator.clipboard.writeText(parsedError.userMessageGlobalisationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyJson = () => {
    const textToCopy = parsedError.rawResponse || JSON.stringify(parsedError, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const isHttp403 = parsedError.httpStatusCode === 403;
  const isHttp400 = parsedError.httpStatusCode === 400;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#15181F] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-[#FF4D24] to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Chẩn Đoán Lỗi Core Banking (Fineract Error Inspector)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    isHttp403
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : isHttp400
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  HTTP {parsedError.httpStatusCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Bộ giải mã `fineractResponse` chi tiết cho kỹ sư vận hành tài chính & hệ thống
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng cửa sổ chẩn đoán"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans hide-scrollbar">
          {/* Sample Switcher Tabs (for live testing) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Play className="w-3 h-3 text-[#FF4D24]" /> Kịch bản kiểm thử chẩn đoán nhanh:
              </span>
              {error && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  ● Đang hiển thị lỗi từ thao tác thực tế vừa xảy ra
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SAMPLE_FINERACT_ERRORS).map(([key, item]) => {
                const isSelected = (!error && activeSampleKey === key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveSampleKey(key);
                      onSelectTestError?.(key);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#FF4D24]/10 text-white border-[#FF4D24]"
                        : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Display Message Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px]">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>THÔNG BÁO CHO NGƯỜI DÙNG CUỐI (defaultUserMessage):</span>
            </div>
            <p className="text-sm font-medium text-slate-100 pl-6 leading-relaxed">
              {parsedError.defaultUserMessage}
            </p>
          </div>

          {/* Developer Technical Message Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px]">
              <Terminal className="w-4 h-4 text-[#FF4D24]" />
              <span>THÔNG ĐIỆP KỸ THUẬT NỘI BỘ (developerMessage):</span>
            </div>
            <div className="pl-6 font-mono text-xs text-rose-300/90 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-slate-900">
              {parsedError.developerMessage || "Không có thông điệp kỹ thuật bổ sung"}
            </div>
          </div>

          {/* Detailed Diagnostic Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Globalisation Code */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-sky-400" /> Mã Chuẩn Hoá (Globalisation Code):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#FF4D24] hover:text-[#ff6b47] transition-colors cursor-pointer"
                  title="Sao chép mã lỗi i18n"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-sky-300 font-semibold bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate">
                {parsedError.userMessageGlobalisationCode || "N/A (Mặc định)"}
              </div>
            </div>

            {/* Offending Parameter */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Tham Số Gây Lỗi (parameterName):
                </span>
              </div>
              <div className="flex items-center gap-2">
                {parsedError.parameterName ? (
                  <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                    {parsedError.parameterName}
                  </span>
                ) : (
                  <span className="text-slate-500 italic font-mono text-xs">Không xác định tham số cụ thể</span>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Raw JSON Response Viewer */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <button
              onClick={() => setRawJsonExpanded(!rawJsonExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {rawJsonExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-300 text-xs">
                  Phản Hồi Thô (Raw fineractResponse Payload)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {rawJsonExpanded ? "Thu gọn" : "Mở rộng để kiểm tra JSON"}
                </span>
              </div>
            </button>

            {rawJsonExpanded && (
              <div className="p-4 border-t border-slate-800 relative">
                <button
                  onClick={handleCopyJson}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedJson ? "Đã sao chép JSON" : "Sao chép JSON"}
                </button>
                <pre className="font-mono text-[11px] text-emerald-400/90 overflow-x-auto p-3 rounded-lg bg-black/60 border border-slate-900 max-h-56">
                  {parsedError.rawResponse || JSON.stringify(parsedError, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-[11px]">Hệ thống: Apache Fineract 1.x & Spring Boot ERP Gateway</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer text-xs"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
