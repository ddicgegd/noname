import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Calendar, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BirthdayDatePickerProps {
  value: string; // ISO yyyy-MM-dd
  onChange: (value: string) => void;
  onSaveImmediate?: (dateIso: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const DMY_REGEX = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
const YMD_REGEX = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/;
const DIGITS_8_REGEX = /^\d{8}$/;
const CLEAN_INPUT_REGEX = /[^0-9\/\-\.]/g;

function calculateAge(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function BirthdayDatePicker({
  value,
  onChange,
  onSaveImmediate,
  disabled = false,
  className,
  error: externalError
}: BirthdayDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const minValidYear = currentYear - 120;

  const initialLoadedIsoRef = useRef<string>(value || "");
  const [typedInput, setTypedInput] = useState<string>(() => isoToDisplay(value));
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync initial loaded value ref
  useEffect(() => {
    if (!initialLoadedIsoRef.current && value) {
      initialLoadedIsoRef.current = value;
    }
    if (!userInteracted) {
      setTypedInput(isoToDisplay(value));
    }
  }, [value, userInteracted]);

  // Validation helper
  const validateDateString = useCallback((inputStr: string): {
    isComplete: boolean;
    isValid: boolean;
    errorMsg: string;
    isoDate?: string;
  } => {
    const cleaned = inputStr.trim();
    if (!cleaned) {
      return { isComplete: false, isValid: false, errorMsg: "" };
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = cleaned.match(DMY_REGEX);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10);
      const y = parseInt(dmyMatch[3], 10);

      if (y < minValidYear || y > currentYear) {
        return { isComplete: true, isValid: false, errorMsg: "Năm sinh không hợp lệ." };
      }
      if (m < 1 || m > 12) {
        return { isComplete: true, isValid: false, errorMsg: "Tháng sinh không hợp lệ (1-12)." };
      }
      const maxDays = new Date(y, m, 0).getDate();
      if (d < 1 || d > maxDays) {
        return { isComplete: true, isValid: false, errorMsg: `Ngày sinh không hợp lệ (Tháng ${m} có ${maxDays} ngày).` };
      }

      const age = calculateAge(y, m, d);
      if (age < 13) {
        return { isComplete: true, isValid: false, errorMsg: "Hội viên phải từ 13 tuổi trở lên." };
      }

      const paddedM = String(m).padStart(2, "0");
      const paddedD = String(d).padStart(2, "0");
      return {
        isComplete: true,
        isValid: true,
        errorMsg: "",
        isoDate: `${y}-${paddedM}-${paddedD}`
      };
    }

    // Match YYYY-MM-DD
    const ymdMatch = cleaned.match(YMD_REGEX);
    if (ymdMatch) {
      const y = parseInt(ymdMatch[1], 10);
      const m = parseInt(ymdMatch[2], 10);
      const d = parseInt(ymdMatch[3], 10);

      if (y < minValidYear || y > currentYear) {
        return { isComplete: true, isValid: false, errorMsg: "Năm sinh không hợp lệ." };
      }
      if (m < 1 || m > 12) {
        return { isComplete: true, isValid: false, errorMsg: "Tháng sinh không hợp lệ (1-12)." };
      }
      const maxDays = new Date(y, m, 0).getDate();
      if (d < 1 || d > maxDays) {
        return { isComplete: true, isValid: false, errorMsg: `Ngày sinh không hợp lệ (Tháng ${m} có ${maxDays} ngày).` };
      }

      const age = calculateAge(y, m, d);
      if (age < 13) {
        return { isComplete: true, isValid: false, errorMsg: "Hội viên phải từ 13 tuổi trở lên." };
      }

      const paddedM = String(m).padStart(2, "0");
      const paddedD = String(d).padStart(2, "0");
      return {
        isComplete: true,
        isValid: true,
        errorMsg: "",
        isoDate: `${y}-${paddedM}-${paddedD}`
      };
    }

    // Match 8 digits: DDMMYYYY
    if (DIGITS_8_REGEX.test(cleaned)) {
      const d = parseInt(cleaned.slice(0, 2), 10);
      const m = parseInt(cleaned.slice(2, 4), 10);
      const y = parseInt(cleaned.slice(4, 8), 10);
      return validateDateString(`${d}/${m}/${y}`);
    }

    return { isComplete: false, isValid: false, errorMsg: "" };
  }, [currentYear, minValidYear]);

  const validation = useMemo(() => validateDateString(typedInput), [validateDateString, typedInput]);

  // Is the date modified from the initial loaded value and valid
  const isDateModifiedAndValid = useMemo(() => {
    if (!validation.isValid || !validation.isoDate) return false;
    return Boolean(userInteracted && validation.isoDate !== initialLoadedIsoRef.current);
  }, [validation, userInteracted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(CLEAN_INPUT_REGEX, "");
    setTypedInput(raw);
    setUserInteracted(true);

    const res = validateDateString(raw);
    if (res.isComplete) {
      if (res.isValid && res.isoDate) {
        setValidationError("");
        onChange(res.isoDate);
      } else {
        setValidationError(res.errorMsg);
      }
    } else {
      setValidationError("");
    }
  };

  const handleConfirmClick = async () => {
    if (!validation.isValid || !validation.isoDate || disabled || isSubmitting) return;

    onChange(validation.isoDate);
    initialLoadedIsoRef.current = validation.isoDate;
    setUserInteracted(false);

    if (onSaveImmediate) {
      try {
        setIsSubmitting(true);
        await onSaveImmediate(validation.isoDate);
      } catch (err) {
        console.warn("Save birthday immediate error:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const effectiveError = validationError || externalError;

  return (
    <div className={cn("relative space-y-1.5", className)}>
      {/* 1. LABEL */}
      <label className="text-[11px] font-bold text-slate-600 block">
        Ngày tháng năm sinh
      </label>

      {/* 2. INPUT FIELD WITH LEFT ICON & RIGHT ACTION BUTTON */}
      <div className="relative group">
        <input
          type="text"
          value={typedInput}
          onChange={handleInputChange}
          placeholder="DD/MM/YYYY (ví dụ: 26/09/1998)"
          disabled={disabled}
          maxLength={10}
          className={cn(
            "w-full bg-slate-50/80 focus:bg-white border-t border-t-slate-200/90 border-b border-b-slate-300/60 border-x border-x-slate-200/80 focus:border-[#FF4D24] focus:ring-2 focus:ring-[#FF4D24]/15 text-xs px-3.5 py-2.5 rounded-2xl outline-none transition-all text-[#111111] font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_1px_0_rgba(255,255,255,0.9)] pl-9.5 pr-20 font-mono disabled:opacity-50",
            effectiveError && "border-red-400! ring-2 ring-red-400/20 focus:border-red-500"
          )}
        />

        {/* Left Calendar Icon */}
        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Right Success Action Button (3D Bevel Pill) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {isDateModifiedAndValid ? (
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={disabled || isSubmitting}
              title="Xác nhận áp dụng ngày sinh mới"
              className="px-2.5 py-1 bg-gradient-to-b from-emerald-50/95 via-emerald-50/80 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-150 border-t border-t-white border-b border-b-emerald-300/80 border-x border-x-emerald-200/80 text-emerald-800 text-[10px] font-mono font-bold rounded-xl shadow-[0_1.5px_4px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] flex items-center gap-1 cursor-pointer active:scale-95 transition-all select-none"
            >
              <Check className="w-3 h-3 text-emerald-600 stroke-[2.8]" />
              <span>Áp dụng</span>
            </button>
          ) : effectiveError ? (
            <span
              className="p-1 text-red-500 flex items-center justify-center mr-1"
              title={effectiveError}
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. ERROR MESSAGE CALLOUT */}
      {effectiveError && (
        <div className="text-[10px] font-bold font-mono text-red-500 flex items-center gap-1 mt-1 pl-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{effectiveError}</span>
        </div>
      )}
    </div>
  );
}
