import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  Check,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { extractBackendMessage, sanitizeErrorMessage } from "../lib/responseExtractor";
import { isValidEmailActionToken } from "../lib/authAction";
import { getCredentialChangeStatus } from "../services/authService";
import { ApiResponse } from "../types/api";
import { Button } from "./ui/button";
export type EmailActionType = "credential-change" | "verify-email" | "reset-password" | "custom";

export interface EmailActionResponsePageProps {
  onNavigate: (page: "landing" | "product" | "order" | "cart" | "auth" | "auth-report" | "profile" | "terms" | "email-response" | "404") => void;
  defaultActionType?: EmailActionType;
  defaultToken?: string;
}


export default function EmailActionResponsePage({
  onNavigate,
  defaultActionType,
  defaultToken
}: EmailActionResponsePageProps) {
  // Extract and sanitize query parameters from URL
  const [urlParams] = useState<{
    token: string;
    type: EmailActionType;
    email?: string;
    isPreview: boolean;
  }>(() => {
    if (typeof window === "undefined") {
      return {
        token: defaultToken ? defaultToken.trim().replace(/\.+$/, "") : "",
        type: defaultActionType || "credential-change",
        isPreview: false
      };
    }
    const params = new URLSearchParams(window.location.search);
    const isPreview =
      params.get("preview") === "success" ||
      params.get("mock") === "success" ||
      params.get("test") === "true" ||
      (params.get("token") || "").trim() === "preview-success";
    const rawToken = params.get("token") || params.get("code") || defaultToken || (isPreview ? "c8f2b15a-7140-4209-8438-fb14c33d0a21" : "");
    const token = rawToken.trim().replace(/\.+$/, "");

    let rawType = params.get("type") || params.get("action") || "";
    const path = window.location.pathname.toLowerCase();

    if (!rawType) {
      if (path.includes("credential-change") || path.includes("security") || path.includes("credential")) {
        rawType = "credential-change";
      } else if (path.includes("verify")) {
        rawType = "verify-email";
      } else if (path.includes("reset") || path.includes("recover")) {
        rawType = "reset-password";
      } else if (path.includes("success") || path.includes("verified")) {
        rawType = "custom";
      } else {
        rawType = "credential-change";
      }
    }

    const type: EmailActionType =
      rawType === "verify-email" || rawType === "verify"
        ? "verify-email"
        : rawType === "reset-password" || rawType === "reset"
        ? "reset-password"
        : rawType === "custom"
        ? "custom"
        : "credential-change";

    return {
      token,
      type,
      email: params.get("email") || undefined,
      isPreview
    };
  });

  // Explicit error parameter detection (?state=error | status=fail)
  const isExplicitError = useMemo(() => {
    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("state") || new URLSearchParams(window.location.search).get("status");
      return s === "error" || s === "fail" || s === "404";
    }
    return false;
  }, []);

  // Initial status: "calling" if valid UUID v4 token exists, "error" if invalid
  const isTokenFormatValid = urlParams.isPreview || isValidEmailActionToken(urlParams.token);
  const [executionStatus, setExecutionStatus] = useState<"calling" | "success" | "error">(() => {
    if (urlParams.isPreview) return "success";
    if (!isTokenFormatValid || isExplicitError) return "error";
    return "calling";
  });
  const [httpStatusCode, setHttpStatusCode] = useState<number>(() => {
    if (urlParams.isPreview) return 200;
    if (!isTokenFormatValid) return 400;
    if (isExplicitError) return 401;
    return 0;
  });
  const [responseMessage, setResponseMessage] = useState<string>(() => {
    if (urlParams.isPreview) {
      return "Kích hoạt quyền thay đổi thành công! Bạn có 5 phút để hoàn tất cập nhật tên đăng nhập hoặc mật khẩu.";
    }
    if (!isTokenFormatValid) {
      return "Mã lỗi: AUTH-400 (Mã token xác thực không đúng định dạng chuẩn RFC 4122 UUID v4).";
    }
    if (isExplicitError) {
      return "Mã lỗi: AUTH-401 (Mã xác thực không hợp lệ hoặc phiên thao tác đã hết hạn).";
    }
    return "Hệ thống đang thẩm định token xác thực yêu cầu của bạn...";
  });
  // Auto-redirect countdown
  const [autoRedirectCounter, setAutoRedirectCounter] = useState<number>(5);
  const [isAutoRedirectActive, setIsAutoRedirectActive] = useState<boolean>(false);
  // Target destination metadata based on action type and execution status
  const navigationTarget = useMemo(() => {
    if (executionStatus === "error") {
      if (urlParams.type === "verify-email") {
        return {
          page: "auth" as const,
          path: "/a#verify",
          hash: "#verify",
          buttonLabel: "Gửi lại email xác thực (/a#verify)",
          centerpieceTooltip: "Chuyển đến trang xác thực email (/a#verify)",
          countdownPrefix: "Tự động chuyển đến trang xác thực"
        };
      }
      if (urlParams.type === "reset-password") {
        return {
          page: "auth" as const,
          path: "/a#recovery",
          hash: "#recovery",
          buttonLabel: "Yêu cầu khôi phục mật khẩu (/a#recovery)",
          centerpieceTooltip: "Chuyển đến trang khôi phục tài khoản",
          countdownPrefix: "Tự động chuyển đến trang khôi phục"
        };
      }
      return {
        page: "profile" as const,
        path: "/m#profile",
        hash: "#profile",
        buttonLabel: "Quay về hồ sơ cá nhân (/m#profile)",
        centerpieceTooltip: "Quay về hồ sơ cá nhân (/m#profile)",
        countdownPrefix: "Tự động chuyển về hồ sơ cá nhân"
      };
    }

    // Success state: Contextual routing based on verified action type
    if (urlParams.type === "verify-email") {
      return {
        page: "auth" as const,
        path: "/a#login",
        hash: "#login",
        buttonLabel: "Đăng nhập ngay (/a#login)",
        centerpieceTooltip: "Chuyển đến trang đăng nhập (/a#login)",
        countdownPrefix: "Tự động chuyển đến trang đăng nhập"
      };
    }
    if (urlParams.type === "reset-password") {
      const resetPath = urlParams.token ? `/a?token=${encodeURIComponent(urlParams.token)}#reset-password` : "/a#reset-password";
      return {
        page: "auth" as const,
        path: resetPath,
        hash: "#reset-password",
        buttonLabel: "Đặt lại mật khẩu mới",
        centerpieceTooltip: "Chuyển đến biểu mẫu đặt lại mật khẩu",
        countdownPrefix: "Tự động chuyển đến trang đặt lại mật khẩu"
      };
    }
    if (urlParams.type === "custom") {
      return {
        page: "landing" as const,
        path: "/",
        hash: "",
        buttonLabel: "Khám phá trang chủ (/)",
        centerpieceTooltip: "Quay về trang chủ (/)",
        countdownPrefix: "Tự động chuyển về trang chủ"
      };
    }

    // Default: credential-change (routes straight to Profile to update credentials)
    return {
      page: "profile" as const,
      path: "/m#profile",
      hash: "#profile",
      buttonLabel: "Cập nhật thông tin (/m#profile)",
      centerpieceTooltip: "Chuyển về hồ sơ cá nhân (/m#profile)",
      countdownPrefix: "Tự động chuyển đến hồ sơ cá nhân"
    };
  }, [executionStatus, urlParams.type, urlParams.token]);

  const handleExecuteNavigation = useCallback(() => {
    setIsAutoRedirectActive(false);
    if (typeof window !== "undefined") {
      if (navigationTarget.hash) {
        window.location.hash = navigationTarget.hash;
      }
      if (navigationTarget.page === "profile") {
        window.dispatchEvent(
          new CustomEvent("open-accounts-center", {
            detail: { tab: "profile" }
          })
        );
      }
      window.history.replaceState({}, "", navigationTarget.path);
    }
    onNavigate(navigationTarget.page);
  }, [navigationTarget, onNavigate]);

  // Auto-redirect timer countdown on success
  useEffect(() => {
    if (!isAutoRedirectActive || autoRedirectCounter <= 0) return;
    const timer = setInterval(() => {
      setAutoRedirectCounter(prev => {
        if (prev <= 1) {
          setIsAutoRedirectActive(false);
          handleExecuteNavigation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoRedirectActive, autoRedirectCounter, handleExecuteNavigation]);

  // Core execution: calls backend endpoint when token exists
  const executeAction = useCallback(async (tokenToUse: string, actionType: EmailActionType) => {
    const cleanToken = tokenToUse.trim().replace(/\.+$/, "");
    if (!isValidEmailActionToken(cleanToken)) {
      setExecutionStatus("error");
      setHttpStatusCode(400);
      setResponseMessage("Mã token xác thực không đúng định dạng chuẩn RFC 4122 (UUID v4).");
      return;
    }

    setExecutionStatus("calling");
    setIsAutoRedirectActive(false);

    try {
      let endpoint = "";
      if (actionType === "credential-change") {
        endpoint = `/api/auth/credential-change/activate?token=${encodeURIComponent(cleanToken)}`;
      } else if (actionType === "verify-email") {
        endpoint = `/api/auth/verify-email?token=${encodeURIComponent(cleanToken)}`;
      } else if (actionType === "reset-password") {
        endpoint = `/api/auth/validate-reset-token?token=${encodeURIComponent(cleanToken)}`;
      } else {
        endpoint = `/api/auth/credential-change/activate?token=${encodeURIComponent(cleanToken)}`;
      }

      const response = await apiRequest<ApiResponse>(endpoint, { method: "GET" });
      const code = response?.status?.code || 200;
      setHttpStatusCode(code);

      const extracted = extractBackendMessage(response);
      const defaultSuccessMsg =
        actionType === "verify-email"
          ? "Tài khoản của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ."
          : actionType === "credential-change"
          ? "Kích hoạt quyền thay đổi thành công! Bạn có 5 phút để hoàn tất cập nhật tên đăng nhập hoặc mật khẩu."
          : "Xác thực bảo mật thành công.";

      const msg = extracted.message || response?.status?.message || defaultSuccessMsg;

      setResponseMessage(msg);
      setExecutionStatus("success");

      // Start auto-redirect counter (5 seconds)
      setAutoRedirectCounter(5);
      setIsAutoRedirectActive(true);
    } catch (err: unknown) {
      // For credential-change: If activateToken failed because single-use token was already consumed,
      // check if the user's credential change session is ALREADY ACTIVE (cross-device or after reload)
      if (actionType === "credential-change") {
        try {
          const statusRes = await getCredentialChangeStatus();
          const activeStatus = statusRes?.data?.status;
          const remainingSecs = statusRes?.data?.remainingSeconds || 0;
          if (activeStatus === "ACTIVE" && remainingSecs > 0) {
            const mins = Math.floor(remainingSecs / 60);
            const secs = remainingSecs % 60;
            const activeMsg = `Quyền đổi thông tin đăng nhập của bạn hiện đang hoạt động (Còn lại: ${mins}:${String(secs).padStart(2, "0")}). Bạn có thể quay lại hồ sơ để cập nhật ngay.`;
            setHttpStatusCode(200);
            setResponseMessage(activeMsg);
            setExecutionStatus("success");
            setAutoRedirectCounter(5);
            setIsAutoRedirectActive(true);
            return;
          }
        } catch (_) {}
      }

      const errObj = (err && typeof err === "object" ? err : {}) as Record<string, unknown>;
      const errData = (errObj.data && typeof errObj.data === "object" ? errObj.data : undefined) as ApiResponse | undefined;
      const rawStatus = typeof errObj.status === "number" ? errObj.status : typeof errData?.status?.code === "number" ? errData.status.code : undefined;
      const rawMsg = String(errObj.message || "");
      const isConnectionDown =
        !rawStatus ||
        rawStatus >= 500 ||
        rawMsg.includes("Failed to fetch") ||
        rawMsg.includes("NetworkError") ||
        rawMsg.includes("Network Error") ||
        rawMsg.includes("ECONNREFUSED") ||
        rawMsg.includes("connection refused");

      let statusCode = 401;
      let errorText = "";

      if (isConnectionDown) {
        statusCode = 503;
        errorText = "Mã lỗi: SYS-503 (Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau ít phút).";
      } else {
        statusCode = rawStatus || 401;
        const rawErr = (errData || errObj) as ApiResponse;
        const extracted = extractBackendMessage(rawErr);
        errorText = extracted.message || rawErr?.status?.message || "";

        if (
          !errorText ||
          errorText.includes("is not valid JSON") ||
          errorText.includes("Unexpected token") ||
          errorText.includes("Failed to parse") ||
          errorText.includes("Failed to fetch")
        ) {
          if (statusCode === 404) {
            errorText = "Mã lỗi: AUTH-404 (Liên kết xác thực không tồn tại hoặc đã bị thu hồi).";
          } else if (actionType === "verify-email") {
            errorText = "Mã lỗi: AUTH-401 (Liên kết xác thực email đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới).";
          } else if (actionType === "credential-change") {
            errorText = "Mã lỗi: AUTH-401 (Liên kết xác thực đổi thông tin đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới).";
          } else {
            errorText = "Mã lỗi: AUTH-401 (Mã xác thực không hợp lệ hoặc phiên thao tác đã hết hạn).";
          }
        } else {
          errorText = sanitizeErrorMessage(errorText);
        }
      }

      setHttpStatusCode(statusCode);
      setResponseMessage(errorText);
      setExecutionStatus("error");
      setIsAutoRedirectActive(false);
    }
  }, []);

  // Auto trigger backend call on mount if token is provided
  // Guard: if token is missing or not a valid UUID v4 (RFC 4122), immediately jump to 404
  useEffect(() => {
    if (urlParams.isPreview) {
      setIsAutoRedirectActive(false);
      return;
    }
    if (!isValidEmailActionToken(urlParams.token)) {
      if (typeof window !== "undefined" && window.location.pathname !== "/404") {
        window.history.replaceState({}, "", "/404");
      }
      onNavigate("404");
    }
  }, [urlParams.isPreview, urlParams.token, onNavigate]);

  // Auto trigger backend call on mount if valid UUID v4 token is provided
  const hasTriggeredRef = useRef(false);
  useEffect(() => {
    if (urlParams.isPreview) return;
    if (!hasTriggeredRef.current && isValidEmailActionToken(urlParams.token)) {
      hasTriggeredRef.current = true;
      executeAction(urlParams.token.trim().replace(/\.+$/, ""), urlParams.type);
    }
  }, [urlParams.isPreview, urlParams.token, urlParams.type, executeAction]);
  const editorialCopy = useMemo(() => {
    if (executionStatus === "calling") {
      return "Hệ thống đang thẩm định token xác thực yêu cầu của bạn...";
    }
    if (executionStatus === "error") {
      return "Chúng tôi không thể hoàn tất xác thực yêu cầu này—rất tiếc!";
    }
    if (urlParams.type === "verify-email") {
      return "Xác thực email tài khoản hoàn tất—chúc mừng bạn!";
    }
    if (urlParams.type === "credential-change") {
      return "Ủy quyền đổi thông tin bảo mật hoàn tất—chúc mừng bạn!";
    }
    return "Xác thực bảo mật tài khoản hoàn tất—chúc mừng bạn!";
  }, [executionStatus, urlParams.type]);

  const displayTitle = useMemo(() => {
    if (executionStatus === "calling") return "Đang Thẩm Định Phiên";
    if (executionStatus === "error") {
      if (httpStatusCode >= 500) return "Dịch Vụ Tạm Thời Gián Đoạn";
      if (httpStatusCode === 404) return "Liên Kết Không Tồn Tại";
      if (httpStatusCode === 400) return "Token Không Đúng Định Dạng";
      if (httpStatusCode === 429) return "Yêu Cầu Quá Nhanh";
      return "Xác Thực Thất Bại";
    }
    if (urlParams.type === "verify-email") return "Xác Thực Email Thành Công";
    if (urlParams.type === "credential-change") return "Ủy Quyền Bảo Mật Thành Công";
    return "Xác Thực Thành Công";
  }, [executionStatus, httpStatusCode, urlParams.type]);

  const badgeText = useMemo(() => {
    if (executionStatus === "calling") return "ĐANG XỬ LÝ XÁC THỰC";
    if (executionStatus === "error") {
      if (httpStatusCode >= 500) return "LỖI HỆ THỐNG (SYS-503)";
      if (httpStatusCode === 400) return "LỖI XÁC THỰC (AUTH-400)";
      if (httpStatusCode === 404) return "LỖI KHÔNG TÌM THẤY (AUTH-404)";
      return "XÁC THỰC THẤT BẠI (AUTH-401)";
    }
    return "XÁC THỰC THÀNH CÔNG";
  }, [executionStatus, httpStatusCode]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center selection:bg-[#FF4D24]/30 selection:text-white relative overflow-hidden font-sans">
      {/* Approved Ambient Graphic Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 size-[520px] bg-emerald-500/12 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-32 size-[460px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 left-1/3 size-[520px] bg-[#FF4D24]/12 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10 w-full max-w-4xl mx-auto">
        <motion.div
          key={executionStatus}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full flex flex-col items-center text-center select-none"
        >
          {/* Minimalist Editorial Copy */}
          <div className="flex flex-col items-center text-center mb-3 max-w-lg">
            <p className="text-base sm:text-lg text-neutral-200 font-medium tracking-tight">
              {editorialCopy}
            </p>
          </div>

          {/* Interactive Centerpiece: Success / Verified with Frosted Cone & Mascot */}
          <div
            onClick={handleExecuteNavigation}
            title={navigationTarget.centerpieceTooltip}
            className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[668/459] group cursor-pointer my-2 sm:my-4"
          >
            {/* "2 0 0" HTTP OK Centerpiece Glyphs with Split-on-Hover Micro-Interaction */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 668 459"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)] select-none pointer-events-none"
            >
              {/* Left digit */}
              <g className="transition-transform duration-300 ease-out group-hover:-translate-x-3.5">
                <text
                  x="180"
                  y="258"
                  fontFamily="'Geist Variable', Inter, -apple-system, system-ui, sans-serif"
                  fontSize="260"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="#E4E4E7"
                  letterSpacing="-0.04em"
                >{executionStatus === "error" ? (httpStatusCode >= 500 ? "5" : "4") : "2"}</text>
              </g>
              {/* Right digit */}
              <g className="transition-transform duration-300 ease-out group-hover:translate-x-3.5">
                <text
                  x="488"
                  y="258"
                  fontFamily="'Geist Variable', Inter, -apple-system, system-ui, sans-serif"
                  fontSize="260"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="#E4E4E7"
                  letterSpacing="-0.04em"
                >{executionStatus === "error" ? (httpStatusCode >= 500 ? "3" : httpStatusCode === 400 ? "0" : httpStatusCode === 404 ? "4" : "1") : "0"}</text>
              </g>
            </svg>
            {/* Frosted Glass Collar / Cone Disc */}
            <div
              className={`absolute inset-0 m-auto w-[34%] aspect-square rounded-full border backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                executionStatus === "error"
                  ? "border-rose-500/30 bg-rose-500/[0.08] shadow-rose-950/40 group-hover:border-rose-400/50"
                  : "border-emerald-400/30 bg-emerald-500/[0.08] shadow-[0_8px_32px_rgba(16,185,129,0.35)] group-hover:border-emerald-400/50 group-hover:bg-emerald-500/[0.14]"
              }`}
              style={{ top: "-12%" }}
            >
              <div
                className={`absolute inset-0 rounded-full blur-xl pointer-events-none ${
                  executionStatus === "error" ? "bg-rose-500/20" : "bg-emerald-400/25"
                }`}
              />
            </div>

            {/* Mascot sitting inside the cone */}
            <div className="absolute bottom-0 left-[18.5%] w-[50%] flex pointer-events-none transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
              <svg
                width="100%"
                height="auto"
                viewBox="0 0 307 297"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cat Silhouette */}
                <path
                  d="M193.165 0C213.409 0 230.218 14.6228 233.632 33.873L230.924 39.0693L234.411 44.2148C242.033 56.2079 246.977 69.744 248.849 83.9531L254.337 125.689C256.406 141.311 262.198 156.216 271.235 169.121L289.288 194.91L289.266 194.845C303.399 215.007 309.409 239.732 306.121 264.109L301.744 296.568H84.5028C62.7265 295.134 41.9521 285.857 26.4256 270.366C-8.80853 235.213 -8.80853 177.986 26.4256 142.832C31.0858 138.161 38.6636 138.161 43.3455 142.832C48.0274 147.503 48.0274 155.064 43.3455 159.735C19.0868 183.939 17.541 222.372 38.7293 248.379C36.922 242.296 35.9198 235.865 35.9198 229.217C35.9198 202.276 51.9905 178.072 76.8807 167.578C82.9781 165.014 90.0123 167.839 92.5819 173.923C95.1512 180.006 92.3205 187.023 86.2235 189.587C70.2178 196.344 59.8739 211.901 59.8739 229.238C59.8739 244.686 68.0833 258.265 80.3651 265.848L80.1258 264.152C76.8594 239.775 82.8694 215.051 96.9803 194.889L115.033 169.1C124.092 156.194 129.884 141.289 131.931 125.668L137.42 83.9316C139.307 69.5417 144.369 55.8415 152.134 43.7539C152.127 43.7424 152.122 43.7297 152.115 43.7182L152.102 43.6938L152.09 43.6693L152.079 43.6427L152.067 43.6161C147.248 31.9427 148.971 18.5772 156.559 8.52841C165.485 -3.28959 181.161 -0.0664654 193.165 0Z"
                  fill="#F4F4F5"
                />
                {/* Clean Downward Collar with Emerald Charm */}
                {/* Clean Downward Collar with Status Charm */}
                <path
                  d="M 149 46 Q 193 64 237 46"
                  stroke={executionStatus === "error" ? "#F43F5E" : "#10B981"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
                <circle cx="193" cy="59" r="4" fill={executionStatus === "error" ? "#F43F5E" : "#10B981"} />
                <circle cx="193" cy="59" r="1.8" fill="#F4F4F5" />
              </svg>
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col items-center gap-2 mt-2 max-w-lg px-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                executionStatus === "error"
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              }`}
            >
              {executionStatus === "calling" ? (
                <RefreshCw size={12} className="animate-spin shrink-0" />
              ) : executionStatus === "error" ? (
                <AlertTriangle size={12} className="shrink-0" />
              ) : (
                <Check size={13} className="stroke-[3] shrink-0" />
              )}
              <span>{badgeText}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {displayTitle}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal max-w-md">
              {responseMessage}
            </p>
          </div>

          {/* Action Button: Single Profile button */}
          <div className="flex justify-center mt-6 w-full max-w-xs sm:max-w-sm px-4">
            <button
              type="button"
              onClick={handleExecuteNavigation}
              disabled={executionStatus === "calling"}
              className="w-full h-11 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none bg-gradient-to-b from-[#FF552D] via-[#FF4D24] to-[#E33B12] border border-[#FF6B45]/40 border-t-white/35 border-b-black/30 shadow-[0_4px_14px_rgba(255,77,36,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{navigationTarget.buttonLabel}</span>
              <ArrowRight size={14} />
            </button>
          </div>
          {/* Auto-redirect countdown indicator */}
          {isAutoRedirectActive && (
            <p className="text-xs text-neutral-500 mt-4">
              {navigationTarget.countdownPrefix} sau {autoRedirectCounter} giây...
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
