/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  WifiOff,
  ShieldAlert,
  ServerOff,
  AlertCircle,
  FileQuestion,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AppErrorCode =
  | "NETWORK_OFFLINE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export interface AppErrorInfo {
  code: AppErrorCode;
  status?: number;
  title: string;
  message: string;
  badge: string;
}

/**
 * Bảng mã lỗi cố định toàn ứng dụng (Dùng trực tiếp, không phụ thuộc chuỗi regex)
 */
export const APP_ERROR_MAP: Record<AppErrorCode, AppErrorInfo> = {
  NETWORK_OFFLINE: {
    code: "NETWORK_OFFLINE",
    status: 0,
    title: "Lỗi hệ thống",
    message: "Lỗi hệ thống. Vui lòng thử lại sau.",
    badge: "LỖI HỆ THỐNG",
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    status: 401,
    title: "Hết phiên đăng nhập",
    message: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
    badge: "MÃ 401",
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    status: 403,
    title: "Không có quyền truy cập",
    message: "Bạn không có quyền thực hiện thao tác này.",
    badge: "MÃ 403",
  },
  BAD_REQUEST: {
    code: "BAD_REQUEST",
    status: 400,
    title: "Yêu cầu không hợp lệ",
    message: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
    badge: "MÃ 400",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    status: 404,
    title: "Không tìm thấy dữ liệu",
    message: "Dữ liệu yêu cầu không tồn tại.",
    badge: "MÃ 404",
  },
  CONFLICT: {
    code: "CONFLICT",
    status: 409,
    title: "Dữ liệu bị trùng lặp",
    message: "Dữ liệu đã tồn tại trên hệ thống.",
    badge: "MÃ 409",
  },
  INTERNAL_SERVER_ERROR: {
    code: "INTERNAL_SERVER_ERROR",
    status: 500,
    title: "Lỗi hệ thống",
    message: "Lỗi hệ thống. Vui lòng thử lại sau.",
    badge: "LỖI HỆ THỐNG",
  },
  SERVICE_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    status: 503,
    title: "Lỗi hệ thống",
    message: "Lỗi hệ thống. Vui lòng thử lại sau.",
    badge: "LỖI HỆ THỐNG",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    title: "Lỗi hệ thống",
    message: "Lỗi hệ thống. Vui lòng thử lại sau.",
    badge: "LỖI HỆ THỐNG",
  },
};

/**
 * Trích xuất và ánh xạ lỗi xác định (Deterministic Error Resolver)
 * Luôn trả về tiêu đề và thông điệp chuẩn xác, không cần dùng toán tử fallback '||'.
 */
export function resolveAppError(error: unknown): AppErrorInfo {
  if (error === null || error === undefined) {
    return APP_ERROR_MAP.UNKNOWN_ERROR;
  }

  // Trường hợp error đã là đối tượng AppErrorInfo
  if (typeof error === "object" && "code" in error && typeof (error as any).code === "string") {
    const code = (error as any).code as AppErrorCode;
    if (APP_ERROR_MAP[code]) {
      return {
        ...APP_ERROR_MAP[code],
        ...(error as Partial<AppErrorInfo>),
      };
    }
  }

  // Trường hợp error là HTTP status code dạng số
  if (typeof error === "number") {
    if (error === 401) return APP_ERROR_MAP.UNAUTHORIZED;
    if (error === 403) return APP_ERROR_MAP.FORBIDDEN;
    if (error === 400) return APP_ERROR_MAP.BAD_REQUEST;
    if (error === 404) return APP_ERROR_MAP.NOT_FOUND;
    if (error === 409) return APP_ERROR_MAP.CONFLICT;
    if (error === 500) return APP_ERROR_MAP.INTERNAL_SERVER_ERROR;
    if (error === 502 || error === 503 || error === 504) return APP_ERROR_MAP.SERVICE_UNAVAILABLE;
    return {
      ...APP_ERROR_MAP.UNKNOWN_ERROR,
      status: error,
      badge: `HTTP ${error}`,
    };
  }

  // Trường hợp error là chuỗi
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (!trimmed) {
      return APP_ERROR_MAP.UNKNOWN_ERROR;
    }
    const lower = trimmed.toLowerCase();
    if (
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("network error") ||
      lower.includes("econnrefused") ||
      lower.includes("connection refused") ||
      lower.includes("không thể kết nối") ||
      lower.includes("backend") ||
      lower.includes("localhost") ||
      lower.includes("spring boot") ||
      lower.includes("core banking") ||
      lower.includes("graphql") ||
      lower.includes("gateway") ||
      lower.includes("máy chủ") ||
      lower.includes("websocket") ||
      lower.includes("offline") ||
      lower.includes("http://") ||
      lower.includes("https://")
    ) {
      return APP_ERROR_MAP.NETWORK_OFFLINE;
    }
    if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("hết hạn")) {
      return APP_ERROR_MAP.UNAUTHORIZED;
    }
    if (lower.includes("403") || lower.includes("forbidden") || lower.includes("quyền")) {
      return APP_ERROR_MAP.FORBIDDEN;
    }
    if (lower.includes("404") || lower.includes("not found")) {
      return APP_ERROR_MAP.NOT_FOUND;
    }
    if (lower.includes("409") || lower.includes("conflict") || lower.includes("đã tồn tại")) {
      return APP_ERROR_MAP.CONFLICT;
    }
    if (lower.includes("503") || lower.includes("502") || lower.includes("504") || lower.includes("unavailable")) {
      return APP_ERROR_MAP.SERVICE_UNAVAILABLE;
    }
    if (lower.includes("500") || lower.includes("internal server") || lower.includes("lỗi máy chủ")) {
      return APP_ERROR_MAP.INTERNAL_SERVER_ERROR;
    }
    return {
      ...APP_ERROR_MAP.UNKNOWN_ERROR,
      message: trimmed,
    };
  }

  // Trường hợp error là Error instance hoặc response error object
  if (typeof error === "object") {
    const errObj = error as any;

    // Kiểm tra status code
    const status = typeof errObj.status === "number" ? errObj.status : undefined;
    if (status === 401) return APP_ERROR_MAP.UNAUTHORIZED;
    if (status === 403) return APP_ERROR_MAP.FORBIDDEN;
    if (status === 400) {
      if (typeof errObj.detail === "string" && errObj.detail.trim()) {
        return { ...APP_ERROR_MAP.BAD_REQUEST, message: errObj.detail.trim() };
      }
      return APP_ERROR_MAP.BAD_REQUEST;
    }
    if (status === 404) return APP_ERROR_MAP.NOT_FOUND;
    if (status === 409) return APP_ERROR_MAP.CONFLICT;
    if (status === 500) return APP_ERROR_MAP.INTERNAL_SERVER_ERROR;
    if (status === 502 || status === 503 || status === 504) return APP_ERROR_MAP.SERVICE_UNAVAILABLE;

    // Kiểm tra lỗi mạng / mất kết nối (TypeError, AbortError, status 0)
    const errName = typeof errObj.name === "string" ? errObj.name : "";
    const errMsg = typeof errObj.message === "string" ? errObj.message : "";
    const lowerMsg = errMsg.toLowerCase();

    if (
      status === 0 ||
      errName === "TypeError" ||
      errName === "AbortError" ||
      lowerMsg.includes("failed to fetch") ||
      lowerMsg.includes("networkerror") ||
      lowerMsg.includes("network error") ||
      lowerMsg.includes("econnrefused") ||
      lowerMsg.includes("connection refused") ||
      lowerMsg.includes("backend") ||
      lowerMsg.includes("localhost") ||
      lowerMsg.includes("spring boot") ||
      lowerMsg.includes("core banking") ||
      lowerMsg.includes("graphql") ||
      lowerMsg.includes("gateway") ||
      lowerMsg.includes("máy chủ") ||
      lowerMsg.includes("websocket") ||
      lowerMsg.includes("offline") ||
      lowerMsg.includes("http://") ||
      lowerMsg.includes("https://")
    ) {
      return APP_ERROR_MAP.NETWORK_OFFLINE;
    }

    // Kiểm tra errorCode cụ thể từ backend
    const errorCode = typeof errObj.errorCode === "string" ? errObj.errorCode.toUpperCase() : "";
    if (errorCode === "UNAUTHORIZED" || errorCode === "AUTH_401") return APP_ERROR_MAP.UNAUTHORIZED;
    if (errorCode === "FORBIDDEN" || errorCode === "AUTH_403") return APP_ERROR_MAP.FORBIDDEN;
    if (errorCode === "VALIDATION_FAILED" || errorCode === "BAD_REQUEST") return APP_ERROR_MAP.BAD_REQUEST;
    if (errorCode === "NOT_FOUND") return APP_ERROR_MAP.NOT_FOUND;
    if (errorCode === "CONFLICT") return APP_ERROR_MAP.CONFLICT;
    if (errorCode === "SERVICE_UNAVAILABLE" || errorCode === "SYS_503") return APP_ERROR_MAP.SERVICE_UNAVAILABLE;
    if (errorCode === "INTERNAL_SERVER_ERROR" || errorCode === "SYS_500") return APP_ERROR_MAP.INTERNAL_SERVER_ERROR;

    // Thông báo chi tiết nghiệp vụ từ backend nếu có
    if (typeof errObj.detail === "string" && errObj.detail.trim()) {
      return {
        ...APP_ERROR_MAP.UNKNOWN_ERROR,
        message: errObj.detail.trim(),
      };
    }

    if (errMsg && !lowerMsg.includes("[object object]")) {
      return resolveAppError(errMsg);
    }
  }

  return APP_ERROR_MAP.UNKNOWN_ERROR;
}

/**
 * Trả về chuỗi thông báo lỗi chuẩn hóa dứt khoát
 */
export function getAppErrorMessage(error: unknown): string {
  return resolveAppError(error).message;
}

export interface AppErrorNoticeProps {
  error?: unknown;
  code?: AppErrorCode;
  status?: number;
  title?: string;
  message?: string;
  badge?: string;
  onRetry?: () => void;
  onClose?: () => void;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  variant?: "banner" | "card" | "inline";
}

function getErrorIcon(code: AppErrorCode) {
  switch (code) {
    case "NETWORK_OFFLINE":
      return <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />;
    case "UNAUTHORIZED":
      return <Lock className="w-4 h-4 text-amber-500 shrink-0" />;
    case "FORBIDDEN":
      return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
    case "INTERNAL_SERVER_ERROR":
    case "SERVICE_UNAVAILABLE":
      return <ServerOff className="w-4 h-4 text-rose-500 shrink-0" />;
    case "BAD_REQUEST":
      return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
    case "NOT_FOUND":
      return <FileQuestion className="w-4 h-4 text-slate-500 shrink-0" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
  }
}

/**
 * Component thông báo lỗi ứng dụng dùng chung
 */
export function AppErrorNotice({
  error,
  code: propCode,
  status: propStatus,
  title: propTitle,
  message: propMessage,
  badge: propBadge,
  onRetry,
  onClose,
  actionText,
  onAction,
  actionHref,
  className,
  variant = "banner",
}: AppErrorNoticeProps) {
  const resolved = resolveAppError(propCode || propStatus || error);

  const displayCode = propCode || resolved.code;
  const displayTitle = propTitle || resolved.title;
  const displayMessage = propMessage || resolved.message;
  const displayBadge = propBadge || resolved.badge;

  const isUnauthorized = displayCode === "UNAUTHORIZED";

  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative w-full rounded-2xl border text-left overflow-hidden transition-all",
        variant === "inline"
          ? "border-destructive/20 bg-destructive/[0.04] p-3 text-xs"
          : "border-destructive/25 bg-destructive/[0.05] dark:bg-destructive/[0.08] p-3.5 sm:p-4 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/15 mt-0.5">
            {getErrorIcon(displayCode)}
          </div>

          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-bold text-xs sm:text-[13px] text-foreground leading-tight">
                {displayTitle}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider">
                {displayBadge}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 break-words">
              {displayMessage}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(onRetry || onAction || actionHref || isUnauthorized) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-destructive/10 flex-wrap">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Thử lại</span>
            </button>
          )}

          {isUnauthorized && (
            <a
              href="/a#login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Đăng nhập lại</span>
            </a>
          )}

          {onAction && actionText && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors cursor-pointer"
            >
              <span>{actionText}</span>
            </button>
          )}

          {actionHref && actionText && !isUnauthorized && (
            <a
              href={actionHref}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
            >
              <span>{actionText}</span>
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
export default AppErrorNotice;
