/**
 * Client Registration Modal for Apache Fineract Subsystem
 * Supports automatic Vietnamese name parsing (firstname, lastname),
 * ERP user linkage (externalId), field validation, and Fineract Core API submission.
 */

import React, { useState, useEffect, useId } from "react";
import {
  X,
  UserPlus,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { FineractClient, CreateClientPayload } from "@/types/fineract";
import { parseVietnameseName, formatDateToFineract } from "@/lib/fineractMockStore";
import { useFineractToast } from "./FineractToast";

export interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClient: FineractClient) => void;
}

export default function ClientRegistrationModal({
  isOpen,
  onClose,
  onSuccess
}: ClientRegistrationModalProps) {
  const { success, fineractError } = useFineractToast();

  const [fullName, setFullName] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [showManualNameSplit, setShowManualNameSplit] = useState(false);

  const [externalId, setExternalId] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [officeId, setOfficeId] = useState<number>(1);
  const [legalFormId, setLegalFormId] = useState<number>(1);
  const [activationDate, setActivationDate] = useState<string>(() => formatDateToFineract(new Date()));
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync Vietnamese name parsing when fullName changes (if not in manual split override)
  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (!showManualNameSplit && value.trim()) {
      try {
        const parsed = parseVietnameseName(value);
        setFirstname(parsed.firstname);
        setLastname(parsed.lastname);
        if (errors.fullName) {
          setErrors(prev => {
            const next = { ...prev };
            delete next.fullName;
            return next;
          });
        }
      } catch {
        // Ignore while typing
      }
    } else if (!value.trim()) {
      setFirstname("");
      setLastname("");
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName("");
      setFirstname("");
      setLastname("");
      setShowManualNameSplit(false);
      setExternalId("");
      setEmailAddress("");
      setMobileNo("");
      setOfficeId(1);
      setLegalFormId(1);
      setActivationDate(formatDateToFineract(new Date()));
      setIsActive(true);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Keyboard navigation: Close on Escape key
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const effectiveFirstname = firstname.trim();
    const effectiveLastname = lastname.trim();

    if (!fullName.trim() && (!effectiveFirstname || !effectiveLastname)) {
      newErrors.fullName = "Vui lòng nhập họ và tên khách hàng.";
    } else if (!effectiveFirstname || !effectiveLastname) {
      newErrors.fullName = "Họ và tên cần bao gồm cả Họ đệm và Tên chính.";
    }

    if (emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress.trim())) {
        newErrors.emailAddress = "Định dạng email không hợp lệ (ví dụ: khachhang@example.com).";
      }
    }

    if (mobileNo.trim()) {
      const phoneRegex = /^[0-9+() -]{9,15}$/;
      if (!phoneRegex.test(mobileNo.trim())) {
        newErrors.mobileNo = "Số điện thoại không hợp lệ (từ 9 đến 15 ký tự số).";
      }
    }

    if (!activationDate.trim()) {
      newErrors.activationDate = "Vui lòng chọn ngày kích hoạt tài khoản.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateClientPayload = {
        officeId,
        legalFormId,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        fullName: fullName.trim(),
        externalId: externalId.trim() || undefined,
        emailAddress: emailAddress.trim() || undefined,
        mobileNo: mobileNo.trim() || undefined,
        active: isActive,
        activationDate: activationDate.trim(),
        dateFormat: "dd MMMM yyyy",
        locale: "en"
      };

      const created = await fineractService.createClient(payload);
      success(
        `Đã tạo thành công khách hàng "${created.displayName}" với Mã tài khoản ${created.accountNo}.`,
        "Đăng Ký Khách Hàng Thành Công"
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("[ClientRegistrationModal] Registration failed:", err);
      fineractError(err, "Đăng Ký Khách Hàng Thất Bại");
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
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4D24] via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Đăng Ký Khách Hàng Tài Chính Mới
              </h3>
              <p className="text-xs text-slate-400">
                Thêm hồ sơ khách hàng mới vào hệ thống Apache Fineract Core Banking
              </p>
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Full Name & Automatic Vietnamese Parser */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF4D24]" />
                Họ và Tên Đầy Đủ (Vietnamese Full Name) <span className="text-rose-400">*</span>
              </span>
              <button
                type="button"
                onClick={() => setShowManualNameSplit(!showManualNameSplit)}
                className="text-[11px] text-[#FF4D24] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showManualNameSplit ? (
                  <>Ẩn chỉnh sửa họ/tên riêng <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Tùy chỉnh họ / tên riêng <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={e => handleFullNameChange(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hoàng, Trần Thị Ánh Tuyết..."
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                  errors.fullName
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-800 focus:border-[#FF4D24] focus:ring-[#FF4D24]"
                }`}
              />
            </div>

            {errors.fullName && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.fullName}
              </p>
            )}

            {/* Live Vietnamese Name Parse Preview Badge */}
            {(firstname || lastname) && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Phân tích Fineract:
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  Họ đệm (lastname): <strong className="text-white">{lastname || "—"}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  Tên chính (firstname): <strong className="text-emerald-400">{firstname || "—"}</strong>
                </span>
              </div>
            )}

            {/* Manual Firstname / Lastname Override Fields */}
            {showManualNameSplit && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Họ đệm (Lastname)
                  </label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={e => setLastname(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF4D24]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Tên chính (Firstname)
                  </label>
                  <input
                    type="text"
                    value={firstname}
                    onChange={e => setFirstname(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF4D24]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. External ID & Legal Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* External ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Mã liên kết ERP (externalId)
              </label>
              <input
                type="text"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                placeholder="Ví dụ: 107 hoặc ERP-USER-107"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] focus:ring-1 focus:ring-[#FF4D24]"
              />
              <p className="text-[11px] text-slate-400">
                Đồng bộ với ID người dùng ERP để áp dụng phân quyền Customer View.
              </p>
            </div>

            {/* Legal Form */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Hình thức Pháp Lý (Legal Form)
              </label>
              <select
                value={legalFormId}
                onChange={e => setLegalFormId(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer"
              >
                <option value={1}>1 - Thể nhân (Person / Khách hàng cá nhân)</option>
                <option value={2}>2 - Pháp nhân (Entity / Doanh nghiệp & Tổ chức)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Mặc định: 1 - Thể nhân (Person) theo chuẩn Fineract Core.
              </p>
            </div>
          </div>

          {/* 3. Contact Information: Email & Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Địa chỉ Email
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="nguyenvanhoang@example.com"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                  errors.emailAddress
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-800 focus:border-[#FF4D24] focus:ring-[#FF4D24]"
                }`}
              />
              {errors.emailAddress && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.emailAddress}
                </p>
              )}
            </div>

            {/* Mobile No */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Số Điện Thoại Di Động
              </label>
              <input
                type="tel"
                value={mobileNo}
                onChange={e => setMobileNo(e.target.value)}
                placeholder="0912345678"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                  errors.mobileNo
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-800 focus:border-[#FF4D24] focus:ring-[#FF4D24]"
                }`}
              />
              {errors.mobileNo && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.mobileNo}
                </p>
              )}
            </div>
          </div>

          {/* 4. Branch Office & Activation Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Office */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Chi Nhánh Quản Lý (Office)
              </label>
              <select
                value={officeId}
                onChange={e => setOfficeId(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer"
              >
                <option value={1}>1 - Trụ sở chính (Head Office)</option>
                <option value={2}>2 - Chi nhánh Hà Nội (Hanoi Regional Branch)</option>
                <option value={3}>3 - Chi nhánh TP.HCM (HCMC Southern Branch)</option>
              </select>
            </div>

            {/* Activation Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Ngày Kích Hoạt (Activation Date) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={activationDate}
                onChange={e => setActivationDate(e.target.value)}
                placeholder="dd MMMM yyyy (ví dụ: 04 September 2026)"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                  errors.activationDate
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-800 focus:border-[#FF4D24] focus:ring-[#FF4D24]"
                }`}
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Định dạng chuẩn: dd MMMM yyyy (VD: 04 September 2026)
              </p>
            </div>
          </div>

          {/* 5. Active Immediately Switch */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Kích Hoạt Tài Khoản Ngay (Active Status)
              </div>
              <p className="text-[11px] text-slate-400">
                Khách hàng sẽ ở trạng thái <span className="text-emerald-400 font-mono">300: Active</span> thay vì chờ duyệt (<span className="text-amber-400 font-mono">100: Pending</span>).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF4D24] hover:bg-[#ff623d] shadow-lg shadow-[#FF4D24]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang Khởi Tạo...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Đăng Ký Khách Hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
