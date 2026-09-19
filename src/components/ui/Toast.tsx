/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Key,
  Mail,
  X,
} from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration: number = 4200): string => {
      const id = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      // Stacked deck: maximum 3 items, newest sits on top and shrinks previous items
      setToasts((prev) => {
        const trimmed = prev.slice(-2);
        return [...trimmed, { id, message, type, title, duration }];
      });

      return id;
    },
    [dismissToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, "success", title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, "error", title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, "warning", title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, "info", title), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        clearAll,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Global Stacked Deck Toast Notification Container */}
      <div className="fixed top-28 sm:top-32 right-4 sm:right-6 z-[999999] pointer-events-none w-full max-w-sm h-16">
        <AnimatePresence>
          {toasts.map((toast, i) => {
            const reversedIndex = toasts.length - 1 - i;
            const isFront = reversedIndex === 0;
            const scale = reversedIndex === 0 ? 1 : reversedIndex === 1 ? 0.93 : 0.86;
            const y = reversedIndex === 0 ? 0 : reversedIndex === 1 ? -8 : -16;
            const opacity = reversedIndex === 0 ? 1 : reversedIndex === 1 ? 0.65 : 0.35;
            const zIndex = 30 - reversedIndex * 10;

            const msgLower = (toast.message || "").toLowerCase();

            return (
              <motion.div
                key={toast.id}
                initial={{ x: 160, opacity: 0, scale: 0.96 }}
                animate={{ x: 0, opacity, scale, y }}
                exit={{ x: 160, opacity: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{ zIndex, transformOrigin: "top center" }}
                className={`absolute top-0 right-0 w-full flex items-center justify-between gap-3 overflow-visible rounded-2xl border-t border-t-white/95 border-b border-b-slate-400/40 border-x border-x-white/70 dark:border-white/20 bg-white/75 dark:bg-zinc-900/80 p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2),0_10px_25px_-5px_rgba(255,77,36,0.12),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-2xl backdrop-saturate-200 select-none text-left ${
                  isFront ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                {/* Ambient tint overlay identical to bottom bar */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent"
                />

                {/* Left Content: Badge Icon and Message */}
                <div className="relative z-10 flex items-center gap-3 min-w-0 pr-1 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                    {toast.type === "error" ? (
                      <AlertCircle className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />
                    ) : toast.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />
                    ) : toast.type === "info" ? (
                      msgLower.includes("token") || msgLower.includes("khôi phục") || msgLower.includes("mật khẩu") ? (
                        <Key className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />
                      ) : msgLower.includes("email") || msgLower.includes("gửi liên kết") ? (
                        <Mail className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />
                      ) : (
                        <Info className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />
                      )
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#FF4D24] stroke-[2.4]" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    {toast.title && (
                      <span className="font-sans font-semibold text-xs sm:text-[13px] text-[#111111] dark:text-white leading-tight">
                        {toast.title}
                      </span>
                    )}
                    <span
                      className={`font-sans ${
                        toast.title
                          ? "font-normal text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words"
                          : "font-bold text-xs sm:text-[13px] text-[#111111] dark:text-white leading-snug"
                      }`}
                    >
                      {toast.message}
                    </span>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="relative z-10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
