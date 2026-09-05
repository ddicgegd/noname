/**
 * Application-Wide Toast System for Apache Fineract Subsystem
 * Provides rich alerts (success, error, warning, info) with deep Fineract exception diagnostics.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bug,
  Terminal
} from "lucide-react";
import { formatFineractErrorToast, extractFineractError } from "@/lib/fineractErrorExtractor";

export type FineractToastType = "success" | "error" | "warning" | "info";

export interface FineractToastItem {
  id: string;
  type: FineractToastType;
  title: string;
  message: string;
  details?: string;
  code?: string;
  parameterName?: string;
  duration?: number;
  rawError?: any;
  onInspect?: () => void;
}

export interface FineractToastContextType {
  toasts: FineractToastItem[];
  showToast: (toast: Omit<FineractToastItem, "id">) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string, details?: string, code?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  fineractError: (error: unknown, fallbackTitle?: string, onInspect?: () => void) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const FineractToastContext = createContext<FineractToastContextType | null>(null);

export function useFineractToast(): FineractToastContextType {
  const ctx = useContext(FineractToastContext);
  if (!ctx) {
    throw new Error("useFineractToast must be used within a FineractToastProvider");
  }
  return ctx;
}

interface FineractToastProviderProps {
  children: React.ReactNode;
  onGlobalInspectError?: (error: any) => void;
}

export function FineractToastProvider({ children, onGlobalInspectError }: FineractToastProviderProps) {
  const [toasts, setToasts] = useState<FineractToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<FineractToastItem, "id">): string => {
      const id = `fineract-toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = toast.duration ?? (toast.type === "error" ? 8000 : 5000);

      const newItem: FineractToastItem = {
        ...toast,
        id
      };

      setToasts(prev => [newItem, ...prev.slice(0, 4)]); // Keep max 5 toasts visible

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timeoutsRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title = "Thao tác thành công"): string => {
      return showToast({ type: "success", title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title = "Lỗi thực thi", details?: string, code?: string): string => {
      return showToast({ type: "error", title, message, details, code });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = "Cảnh báo nghiệp vụ"): string => {
      return showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title = "Thông tin hệ thống"): string => {
      return showToast({ type: "info", title, message });
    },
    [showToast]
  );

  const fineractError = useCallback(
    (err: unknown, fallbackTitle?: string, onInspect?: () => void): string => {
      const formatted = formatFineractErrorToast(err);
      const parsed = extractFineractError(err);

      const inspectHandler = onInspect || (onGlobalInspectError ? () => onGlobalInspectError(err) : undefined);

      return showToast({
        type: "error",
        title: fallbackTitle || formatted.title,
        message: formatted.message,
        details: formatted.details,
        code: formatted.code,
        parameterName: formatted.parameterName,
        rawError: parsed,
        onInspect: inspectHandler
      });
    },
    [showToast, onGlobalInspectError]
  );

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(timer => clearTimeout(timer));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return (
    <FineractToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        fineractError,
        dismissToast,
        clearAll
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4"
        aria-live="polite"
        role="region"
      >
        {toasts.map(toast => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";
          const isInfo = toast.type === "info";

          const borderBgColor = isError
            ? "border-rose-500/50 bg-[#15181F]/95 shadow-rose-950/30"
            : isSuccess
            ? "border-emerald-500/50 bg-[#15181F]/95 shadow-emerald-950/30"
            : isWarning
            ? "border-amber-500/50 bg-[#15181F]/95 shadow-amber-950/30"
            : "border-sky-500/50 bg-[#15181F]/95 shadow-sky-950/30";

          const icon = isError ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          );

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderBgColor}`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{toast.title}</h4>
                    {toast.parameterName && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {toast.parameterName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>

                  {/* Fineract Globalisation Code */}
                  {toast.code && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                      <Terminal className="w-3 h-3 text-[#FF4D24]" />
                      <span className="truncate">{toast.code}</span>
                    </div>
                  )}

                  {/* Optional Diagnostic Action Trigger */}
                  {toast.onInspect && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toast.onInspect?.();
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF4D24] hover:text-[#ff6b47] transition-colors cursor-pointer"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        Xem chi tiết chẩn đoán Core Banking &rarr;
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
                  title="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </FineractToastContext.Provider>
  );
}
