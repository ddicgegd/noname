/**
 * Client Detail Inspection Drawer for Apache Fineract Subsystem
 * Slide-out sheet inspecting client profile, legal form, contact info,
 * activation timeline, and querying linked loan accounts in real-time.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  CreditCard,
  Building2,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgePercent,
  Layers
} from "lucide-react";
import { FineractClient, LoanAccount } from "@/types/fineract";
import { fineractService } from "@/services/fineractService";
import { formatVND } from "./FineractOverview";
import { useFineractToast } from "./FineractToast";

export interface ClientDetailDrawerProps {
  client: FineractClient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientDetailDrawer({
  client,
  isOpen,
  onClose
}: ClientDetailDrawerProps) {
  const { info } = useFineractToast();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loans, setLoans] = useState<LoanAccount[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Fetch linked loans when client changes
  useEffect(() => {
    if (isOpen && client) {
      let isMounted = true;
      setIsLoadingLoans(true);
      fineractService
        .getLoans(client.id)
        .then(res => {
          if (isMounted) {
            setLoans(res);
          }
        })
        .catch(err => {
          console.warn(`[ClientDetailDrawer] Failed to fetch loans for client ${client.id}:`, err);
          if (isMounted) setLoans([]);
        })
        .finally(() => {
          if (isMounted) setIsLoadingLoans(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLoans([]);
    }
  }, [isOpen, client]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    info(`Đã sao chép ${label}: ${text}`, "Sao chép thành công");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPending = client.status.id === 100;
  const isActive = client.status.id === 300;
  const isClosed = client.status.id === 600;

  const formattedActivationDate = Array.isArray(client.activationDate)
    ? `${client.activationDate[2]} / ${client.activationDate[1]} / ${client.activationDate[0]}`
    : client.activationDate;

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#15181F] border-l border-slate-800/90 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="h-1 bg-gradient-to-r from-[#FF4D24] via-amber-500 to-emerald-500" />

        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {/* Avatar Initials Badge */}
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#FF4D24] to-[#992207] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#15181F] rounded-[14px] flex items-center justify-center text-white font-bold text-lg font-sans">
                  {client.firstname ? client.firstname[0].toUpperCase() : "C"}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {client.displayName}
                  </h3>
                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                        : isPending
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/25"
                    }`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-400" />
                    )}
                    {client.status.value}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>Họ đệm: <strong className="text-slate-200">{client.lastname}</strong></span>
                  <span>•</span>
                  <span>Tên: <strong className="text-emerald-400">{client.firstname}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">ID #{client.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer"
              title="Đóng ngăn kéo (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Copy Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCopy(client.accountNo, "accountNo", "Mã tài khoản")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey === "accountNo" ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
              <span>TK: {client.accountNo}</span>
            </button>

            {client.externalId && (
              <button
                onClick={() => handleCopy(client.externalId!, "externalId", "Mã ERP")}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === "externalId" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
                <span>ERP ID: {client.externalId}</span>
              </button>
            )}

            <button
              onClick={() => handleCopy(String(client.id), "id", "ID Fineract")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey === "id" ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
              <span>Fineract ID: #{client.id}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Profile & Core Identity Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF4D24]" />
              Hồ Sơ Định Danh Khách Hàng (Core Identity)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Account No */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Số Tài Khoản (Account No)</div>
                <div className="text-sm font-bold font-mono text-sky-400 tracking-wider">
                  {client.accountNo}
                </div>
              </div>

              {/* External ID */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Mã Định Danh ERP (externalId)</div>
                <div className="text-sm font-bold font-mono text-amber-400">
                  {client.externalId ? client.externalId : <span className="text-slate-500 font-sans font-normal text-xs">Chưa gán liên kết</span>}
                </div>
              </div>

              {/* Legal Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Hình Thức Pháp Lý (Legal Form)</div>
                <div className="text-xs font-medium text-slate-200">
                  {client.legalFormId === 2 ? (
                    <span className="text-indigo-400 font-semibold">2 - Pháp nhân (Entity / Doanh nghiệp)</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">1 - Thể nhân (Person / Khách hàng cá nhân)</span>
                  )}
                </div>
              </div>

              {/* Branch Office */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Chi Nhánh Quản Lý (Office)</div>
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{client.officeName || `Trụ sở chính (Office ${client.officeId})`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              Thông Tin Liên Hệ (Contact Details)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Email Address */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">Địa chỉ Email</div>
                  <div className="text-xs font-medium text-slate-200">
                    {client.emailAddress ? (
                      <a
                        href={`mailto:${client.emailAddress}`}
                        className="text-sky-400 hover:underline hover:text-sky-300"
                      >
                        {client.emailAddress}
                      </a>
                    ) : (
                      <span className="text-slate-500">Chưa cung cấp</span>
                    )}
                  </div>
                </div>
                {client.emailAddress && (
                  <button
                    onClick={() => handleCopy(client.emailAddress!, "email", "Email")}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sao chép email"
                  >
                    {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Mobile Phone */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">Số điện thoại di động</div>
                  <div className="text-xs font-mono font-medium text-slate-200">
                    {client.mobileNo ? (
                      <a
                        href={`tel:${client.mobileNo}`}
                        className="text-emerald-400 hover:underline hover:text-emerald-300"
                      >
                        {client.mobileNo}
                      </a>
                    ) : (
                      <span className="text-slate-500 font-sans">Chưa cung cấp</span>
                    )}
                  </div>
                </div>
                {client.mobileNo && (
                  <button
                    onClick={() => handleCopy(client.mobileNo!, "mobile", "Số điện thoại")}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sao chép số điện thoại"
                  >
                    {copiedKey === "mobile" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Activation Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Dòng Thời Gian & Vòng Đời (Lifecycle & Timeline)
            </h4>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Ngày Nộp Hồ Sơ (Submitted Date):
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {client.timeline?.submittedOnDate
                    ? Array.isArray(client.timeline.submittedOnDate)
                      ? client.timeline.submittedOnDate.join("-")
                      : client.timeline.submittedOnDate
                    : "10 January 2026"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Ngày Phê Duyệt Kích Hoạt (Activation Date):
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formattedActivationDate}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D24]" />
                  Mã Trạng Thái Hệ Thống (Fineract Code):
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {client.status.code}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Linked Loan Accounts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#FF4D24]" />
                Hợp Đồng Vay & Hồ Sơ Tín Dụng ({loans.length})
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Query: GET /loans?clientId={client.id}
              </span>
            </div>

            {isLoadingLoans ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-[#FF4D24] border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách hợp đồng tín dụng...</span>
              </div>
            ) : loans.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Khách hàng hiện chưa mở bất kỳ hợp đồng vay tín dụng nào tại hệ thống Fineract.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map(loan => {
                  const isLoanPending = loan.status.id === 100;
                  const isLoanApproved = loan.status.id === 200;
                  const isLoanActive = loan.status.id === 300;
                  const isLoanClosed = loan.status.id === 600;

                  return (
                    <div
                      key={loan.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-sky-400">
                            {loan.accountNo}
                          </span>
                          <span className="text-xs text-white font-medium">
                            {loan.loanProductName}
                          </span>
                        </div>

                        {/* Loan Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLoanActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                              : isLoanApproved
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/25"
                              : isLoanPending
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                              : isLoanClosed
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/25"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/25"
                          }`}
                        >
                          {loan.status.value}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Số Tiền Gốc (Principal):</span>
                          <span className="font-bold text-white">{formatVND(loan.principal)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Dư Nợ Còn Lại:</span>
                          <span className="font-bold text-amber-400">
                            {formatVND(loan.summary?.totalOutstanding || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Kỳ Hạn Hoàn Trả:</span>
                          <span className="text-slate-300 font-sans">
                            {loan.numberOfRepayments} kỳ ({loan.interestRatePerPeriod}%/kỳ)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Đóng Ngăn Kéo
          </button>
        </div>
      </div>
    </div>
  );
}
