import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, CheckCircle, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Info, Shield, Cpu, RefreshCw, Check, Loader2, Settings, Key, Terminal, Server, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  User as MorphUser,
  AtSign as MorphAtSign,
  CircleUser as MorphCircleUser,
  IdCard as MorphIdCard,
  Mail as MorphMail,
  MailCheck as MorphMailCheck,
  Lock as MorphLock,
  Key as MorphKey,
  KeyRound as MorphKeyRound,
  ShieldCheck as MorphShieldCheck,
  CheckCheck as MorphCheckCheck,
  Eye as MorphEye,
  EyeOff as MorphEyeOff
} from "lucide";
import { MorphIcon } from "morphicons/react";
import { HoverMorphIcon } from "./ui/HoverMorphIcon";
import { useToast } from "./ui/Toast";
import { apiRequest, isProxyEnabled, getApiBaseUrl } from "../lib/api";
import { extractBackendMessage, sanitizeErrorMessage } from "../lib/responseExtractor";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { ApiResponse } from "../types/api";
import {
  loginUser,
  registerUser,
  recoverAccount as apiRecoverAccount,
  resendVerification as apiResendVerification,
  verifyEmail as apiVerifyEmail,
  resetPassword as apiResetPassword,
  changePassword as apiChangePassword,
  changeUsername as apiChangeUsername,
  validateResetToken as apiValidateResetToken
} from "../services/authService";
import { UserLoginRequest, UserRegisterRequest } from "../types/auth";
import { consumePendingAction } from "../lib/authAction";
import { mergeGuestCart } from "../services/cartService";

interface RegisterPageProps {
  onNavigate: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
}

function DynamicButtonShimmer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <motion.div
        className="w-3/5 h-full bg-gradient-to-r from-transparent via-white/20 via-[#FF4D24]/30 to-transparent -skew-x-12"
        initial={{ x: "-100%" }}
        animate={{ x: "280%" }}
        transition={{ repeat: Infinity, duration: 0.75, ease: "easeInOut" }}
      />
    </div>
  );
}

function DynamicButtonLoader({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 text-white">
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-full bg-[#FF4D24]/40 blur-[3px] pointer-events-none" />
        <Loader2 className="w-4 h-4 text-[#FF4D24] animate-spin shrink-0 relative z-10" />
      </div>

      <span className="flex items-center text-xs font-bold font-sans tracking-wide">
        <span>{text}</span>
        <span className="inline-flex items-center gap-0.5 ml-1">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="w-1 h-1 rounded-full bg-[#FF4D24]"
              animate={{
                opacity: [0.35, 1, 0.35],
                scale: [0.8, 1.25, 0.8],
                y: [0, -2.5, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: dot * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [isSignUp, setIsSignUp] = useState(() => window.location.hash.toLowerCase() === "#register");

  // Form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI helper states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [isVerifyingManualToken, setIsVerifyingManualToken] = useState(false);
  const { showToast } = useToast();
  const setToastNotification = (data: { id?: string; type?: "error" | "success" | "info" | "warning"; title?: string; message: string } | null) => {
    if (data && data.message) {
      showToast(data.message, data.type || "info", data.title);
    }
  };

  useEffect(() => {
    if (errorMsg) {
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: errorMsg,
      });
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successMsg,
      });
    }
  }, [successMsg]);

  // Mouse position for spotlight effect on the card
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const [lastRegToken, setLastRegToken] = useState<string | null>(null);
  const [lastRegEmail, setLastRegEmail] = useState<string | null>(null);

  // Verification Overlay states
  const [showVerifyOverlay, setShowVerifyOverlay] = useState(false);
  const [verifyOverlayStatus, setVerifyOverlayStatus] = useState<"loading" | "success" | "error">("loading");
  const [verifyOverlayMsg, setVerifyOverlayMsg] = useState("");
  const [verifyOverlayTimeLeft, setVerifyOverlayTimeLeft] = useState(2);

  // --- ACCOUNT RECOVERY STATE VARIABLES ---
  const [recoveryMode, setRecoveryMode] = useState<"NONE" | "SEND_LINK" | "MANUAL_TOKEN" | "RESET_PASSWORD" | "RESEND_VERIFICATION">(() => {
    if (typeof window === "undefined") return "NONE";
    const hash = window.location.hash.toLowerCase();
    if (hash === "#recovery-token" || hash === "#manual-token") return "MANUAL_TOKEN";
    if (hash === "#reset-password") return "RESET_PASSWORD";
    if (hash === "#resend-verification") return "RESEND_VERIFICATION";
    if (hash === "#recovery" || hash === "#forgot-password" || hash === "#forgot") return "SEND_LINK";
    return "NONE";
  });
  const [resendEmail, setResendEmail] = useState("");
  const [isPasswordResetExpanded, setIsPasswordResetExpanded] = useState(false);
  const [isUsernameChangeExpanded, setIsUsernameChangeExpanded] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryNewUsername, setRecoveryNewUsername] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [cooldownTime, setCooldownTime] = useState(0);
  const [recoveryUser, setRecoveryUser] = useState<any | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValidationError, setTokenValidationError] = useState("");

  // --- COOLDOWN COUNTER EFFECT ---
  useEffect(() => {
    if (cooldownTime <= 0) return;
    const interval = setInterval(() => {
      setCooldownTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime]);

  // --- SANITIZE ERROR FUNCTION ---
  const sanitizeErrorMessage = (msg: string): string => {
    if (!msg) return "";
    let clean = msg;
    clean = clean.replace(/API Error:\s*\d+\s*(Unauthorized|Bad Request|Internal Server Error|Forbidden)?/i, "").trim();
    clean = clean.replace(/^(API Error:\s*\d+|Error\s*\d+|Mã lỗi:\s*\d+)\s*-?\\s*/i, "").trim();
    if (clean.includes("Failed to fetch") || clean.includes("NetworkError") || clean.includes("Network Error")) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại máy chủ backend (http://localhost:8080).";
    }
    if (!clean) {
      return "Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.";
    }
    return clean;
  };

  const [isVerifyingMode, setIsVerifyingMode] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const hasToken = ["token", "code", "verify-email", "verify"].some((p) => params.has(p));
    if (hash === "#verify") {
      return hasToken;
    }
    return false;
  });

  // Sync states when URL hash changes (e.g. Back/Forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#register") {
        setIsSignUp(true);
        setIsVerifyingMode(false);
        setRecoveryMode("NONE");
      } else if (hash === "#verify" || hash === "#verify-email") {
        setIsSignUp(false);
        setIsVerifyingMode(true);
        setRecoveryMode("NONE");
      } else if (hash === "#resend-verification") {
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setRecoveryMode("RESEND_VERIFICATION");
      } else if (hash === "#recovery" || hash === "#forgot-password" || hash === "#forgot") {
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setRecoveryMode("SEND_LINK");
      } else if (hash === "#recovery-token" || hash === "#manual-token") {
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setRecoveryMode("MANUAL_TOKEN");
      } else if (hash === "#reset-password") {
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setRecoveryMode("RESET_PASSWORD");
      } else {
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setRecoveryMode("NONE");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [lastRegEmail]);
  const [verificationTokenInput, setVerificationTokenInput] = useState("");
  const apiBaseUrl = getApiBaseUrl();
  const [verifyApiPath, setVerifyApiPath] = useState(() => localStorage.getItem(STORAGE_KEYS.VERIFY_API_PATH) || localStorage.getItem("horizon_verify_api_path") || "/api/auth/verify-email");
  const [verifyMethod, setVerifyMethod] = useState<"GET" | "POST">("GET");
  const [isVerifyingRequest, setIsVerifyingRequest] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [verificationResultState, setVerificationResultState] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Countdown timer for email verification (15 minutes TTL = 900s)
  const [timeLeft, setTimeLeft] = useState<number>(900);

  useEffect(() => {
    let timerInterval: any = null;
    if (isVerifyingMode) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(900);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isVerifyingMode]);

  // Get dynamic Client device details for deviceInfo
  const getClientDeviceInfo = () => {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || localStorage.getItem("horizon_device_id");
    if (!deviceId) {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    let timeZone;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch(e) {}

    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      timeZone: timeZone,
      deviceId
    };
  };

  const addAuditLog = (
    type: "LOGIN" | "REGISTER" | "VERIFY",
    payload: any,
    status: "SUCCESS" | "FAILED",
    message: string,
    serverUrl: string,
    devInfo: any
  ) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_AUDIT_LOGS) || localStorage.getItem("horizon_auth_audit_logs");
      let logs = stored ? JSON.parse(stored) : [];

      const newLog = {
        id: "log-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now(),
        timestamp: new Date().toISOString(),
        type,
        payload: { ...payload, password: "••••••••" }, // Sanitize password for security
        status,
        message,
        serverUrl,
        deviceInfo: devInfo
      };

      logs.unshift(newLog);
      if (logs.length > 50) logs = logs.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.AUTH_AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error("Lỗi ghi nhật ký chẩn đoán:", e);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFY_API_PATH, verifyApiPath);
  }, [verifyApiPath]);

  // Helper to validate the recovery/reset token with the backend
  const validateRecoveryToken = async (token: string) => {
    setIsValidatingToken(true);
    setTokenValidationError("");
    setErrorMsg("");
    setSuccessMsg("");
    setRecoveryUser(null);
    try {
      const response = await apiValidateResetToken(token);
      const extracted = extractBackendMessage(response);

      if (response.data !== undefined && response.data !== null) {
        setRecoveryUser(response.data);
        if (response.data.roles !== undefined) {
          localStorage.setItem(STORAGE_KEYS.RECOVERY_USER_ROLES, JSON.stringify(response.data.roles));
        }
      } else {
        setTokenValidationError(extracted.message);
      }
    } catch (err: any) {
      console.error("Token validation failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setTokenValidationError(cleanReason);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingManualToken(true);
    setErrorMsg("");
    setToastNotification(null);
    setFieldErrors(prev => ({ ...prev, manualToken: "" }));

    try {
      // Guarantee hold loading animation is visible for at least 500ms (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));

      const tokenClean = manualTokenInput.trim();
      if (!tokenClean) {
        setFieldErrors(prev => ({ ...prev, manualToken: "Vui lòng nhập mã Token khôi phục." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: "Vui lòng nhập hoặc dán mã Token khôi phục.",
        });
        return;
      }

      let response: any = null;
      let reqError: any = null;
      try {
        response = await apiValidateResetToken(tokenClean);
      } catch (err: any) {
        reqError = err;
      }

      if (reqError) {
        console.error("Manual token validation failed:", reqError);
        const cleanReason = sanitizeErrorMessage(reqError.message) || "Mã token không hợp lệ hoặc đã hết hạn.";
        // Stay on current page and show top-right toast!
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: cleanReason,
        });
        return;
      }

      const extracted = extractBackendMessage(response);
      if (response && response.data !== undefined && response.data !== null) {
        // Token is valid! Navigate to reset-password form
        setRecoveryUser(response.data);
        if (response.data.roles !== undefined) {
          localStorage.setItem(STORAGE_KEYS.RECOVERY_USER_ROLES, JSON.stringify(response.data.roles));
        }
        setRecoveryToken(tokenClean);
        window.location.hash = "reset-password";
        setRecoveryMode("RESET_PASSWORD");
        setIsPasswordResetExpanded(true);
      } else {
        // Token invalid: Stay on current page and show top-right toast!
        const errMsg = extracted.message || "Mã token không hợp lệ hoặc đã hết hạn.";
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: errMsg,
        });
      }
    } catch (err: any) {
      console.error("Unexpected error in token verification:", err);
      const cleanReason = sanitizeErrorMessage(err.message) || "Mã token không hợp lệ hoặc đã hết hạn.";
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
    } finally {
      setIsVerifyingManualToken(false);
    }
  };

  const executeOverlayVerification = async (tokenClean: string) => {
    try {
      await new Promise((r) => setTimeout(r, 600));

      const response = await apiVerifyEmail(tokenClean);
      const backendMsg = extractBackendMessage(response);
      const msgText = backendMsg.message || "Xác thực email thành công. Tài khoản của bạn đã được kích hoạt.";

      setVerifyOverlayStatus("success");
      setVerifyOverlayMsg(msgText);
      setVerifyOverlayTimeLeft(2);

      let returnedEmail = "";
      if (response && response.data && typeof response.data === "object" && typeof (response.data as Record<string, unknown>).email === "string") {
        returnedEmail = (response.data as Record<string, unknown>).email as string;
      }
      if (returnedEmail.length > 0) {
        setEmail(returnedEmail);
      }

      setSuccessMsg(msgText);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: msgText,
      });

      const interval = setInterval(() => {
        setVerifyOverlayTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowVerifyOverlay(false);
            window.location.hash = "login";
            setIsSignUp(false);
            setIsVerifyingMode(false);
            setRecoveryMode("NONE");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      const cleanReason = sanitizeErrorMessage(errorObj.message || "") || "Mã xác thực email không hợp lệ hoặc đã hết hạn.";
      setVerifyOverlayStatus("error");
      setVerifyOverlayMsg(cleanReason);
      setVerifyOverlayTimeLeft(4);
      setErrorMsg(cleanReason);

      const interval = setInterval(() => {
        setVerifyOverlayTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowVerifyOverlay(false);
            window.location.hash = "resend-verification";
            setRecoveryMode("RESEND_VERIFICATION");
            setIsSignUp(false);
            setIsVerifyingMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // On mount, parse token and routing from URL
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const rawHash = window.location.hash.toLowerCase();
    const hash = rawHash.split("?")[0];
    const searchParams = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes("?") ? window.location.hash.substring(window.location.hash.indexOf("?") + 1) : "";
    const hashParams = new URLSearchParams(hashQuery);
    const tokenParam = searchParams.get("token") || hashParams.get("token") || searchParams.get("code") || hashParams.get("code") || "";
    // Flow 1: Reset Password (Path /reset-password or Hash #reset-password)
    if (pathname === "/reset-password" || pathname === "/reset" || hash === "#reset-password") {
      if (tokenParam) {
        window.history.replaceState({}, document.title, "/a#reset-password");
        setRecoveryToken(tokenParam);
        setRecoveryMode("RESET_PASSWORD");
        setIsPasswordResetExpanded(true);
        validateRecoveryToken(tokenParam);
      } else {
        setRecoveryMode("RESET_PASSWORD");
        setIsPasswordResetExpanded(true);
      }
      return;
    }

    // Flow 2: Email Verification (Path /verify-email or Hash #verify / #verify-email)
    if (pathname === "/verify-email" || pathname === "/verify" || hash === "#verify" || hash === "#verify-email") {
      if (tokenParam) {
        window.history.replaceState({}, document.title, "/a#verify");
        setVerificationTokenInput(tokenParam);
        setShowVerifyOverlay(true);
        setVerifyOverlayStatus("loading");
        setVerifyOverlayMsg("Đang tiến hành xác minh tài khoản với server...");
        executeOverlayVerification(tokenParam);
      } else {
        setIsSignUp(false);
        setIsVerifyingMode(true);
        setRecoveryMode("NONE");
      }
      return;
    }

    // Flow 3: Resend Verification (Path /resend-verification or Hash #resend-verification)
    if (pathname === "/resend-verification" || pathname === "/resend" || hash === "#resend-verification") {
      window.history.replaceState({}, document.title, "/a#resend-verification");
      setRecoveryMode("RESEND_VERIFICATION");
      setIsSignUp(false);
      setIsVerifyingMode(false);
      return;
    }

    // Flow 4: Forgot Password / Account Recovery (Path /forgot-password or Hash #recovery / #forgot-password)
    if (pathname === "/recovery" || pathname === "/forgot-password" || pathname === "/forgot" || hash === "#recovery" || hash === "#forgot-password" || hash === "#forgot") {
      window.history.replaceState({}, document.title, "/a#recovery");
      setRecoveryMode("SEND_LINK");
      setIsSignUp(false);
      setIsVerifyingMode(false);
      return;
    }

    // Flow 5: Manual Token entry
    if (hash === "#recovery-token" || hash === "#manual-token") {
      setRecoveryMode("MANUAL_TOKEN");
      setIsSignUp(false);
      setIsVerifyingMode(false);
      return;
    }

    if (hash === "#register") {
      setIsSignUp(true);
      setIsVerifyingMode(false);
      setRecoveryMode("NONE");
    } else {
      setIsSignUp(false);
      setIsVerifyingMode(false);
      setRecoveryMode("NONE");
    }
  }, []);

  // --- ACCOUNT RECOVERY HANDLERS ---
  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setToastNotification(null);
    setFieldErrors(prev => ({ ...prev, recoveryEmail: "" }));

    try {
      // Guaranteed hold loading animation for at least 500ms (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));

      const cleanEmail = recoveryEmail.trim();
      if (!cleanEmail) {
        setFieldErrors(prev => ({ ...prev, recoveryEmail: "Vui lòng nhập địa chỉ email đăng ký." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Chưa nhập email",
          message: "Vui lòng nhập địa chỉ email đăng ký.",
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setFieldErrors(prev => ({ ...prev, recoveryEmail: "Địa chỉ email không đúng định dạng (ví dụ: name@domain.com)." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Địa chỉ email không hợp lệ",
          message: "Địa chỉ email không đúng định dạng (ví dụ: name@domain.com).",
        });
        return;
      }

      let response: any = null;
      let reqErr: any = null;
      try {
        response = await apiRecoverAccount(cleanEmail);
      } catch (err: any) {
        reqErr = err;
      }

      if (reqErr) {
        console.error("Account recovery request failed:", reqErr);
        const cleanReason = sanitizeErrorMessage(reqErr.message);
        setErrorMsg(cleanReason);
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: cleanReason,
        });
        return;
      }

      const extracted = extractBackendMessage(response);
      setSuccessMsg(extracted.message);
      setCooldownTime(60);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: extracted.message,
      });
    } catch (err: any) {
      console.error("Unexpected error in send recovery email:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleResendVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setToastNotification(null);
    setFieldErrors(prev => ({ ...prev, resendEmail: "" }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cleanEmail = (resendEmail || email || lastRegEmail || "").trim();
      if (!cleanEmail) {
        setFieldErrors(prev => ({ ...prev, resendEmail: "Vui lòng nhập địa chỉ email đăng ký." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Chưa nhập email",
          message: "Vui lòng nhập địa chỉ email đăng ký.",
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setFieldErrors(prev => ({ ...prev, resendEmail: "Địa chỉ email không đúng định dạng (ví dụ: name@domain.com)." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Địa chỉ email không hợp lệ",
          message: "Địa chỉ email không đúng định dạng (ví dụ: name@domain.com).",
        });
        return;
      }

      let response: unknown = null;
      let reqErr: unknown = null;
      try {
        response = await apiResendVerification(cleanEmail);
      } catch (err: unknown) {
        reqErr = err;
      }

      if (reqErr) {
        const errorObj = reqErr as Error;
        console.error("Resend verification request failed:", errorObj);
        const cleanReason = sanitizeErrorMessage(errorObj.message);
        setErrorMsg(cleanReason);
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: cleanReason,
        });
        return;
      }

      const extracted = extractBackendMessage(response as ApiResponse);
      const successText = extracted.message || "Nếu email tồn tại trên hệ thống và chưa được kích hoạt, liên kết xác thực mới đã được gửi. Vui lòng kiểm tra.";
      setSuccessMsg(successText);
      setCooldownTime(60);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successText,
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Unexpected error in resend verification:", errorObj);
      const cleanReason = sanitizeErrorMessage(errorObj.message);
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setToastNotification(null);
    setFieldErrors(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!recoveryNewPassword) {
        setFieldErrors(prev => ({ ...prev, newPassword: "Mật khẩu mới không được để trống." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: "Mật khẩu mới không được để trống.",
        });
        return;
      }
      if (recoveryNewPassword.length < 6) {
        setFieldErrors(prev => ({ ...prev, newPassword: "Mật khẩu mới phải từ 6 ký tự trở lên." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: "Mật khẩu mới phải từ 6 ký tự trở lên.",
        });
        return;
      }
      if (recoveryNewPassword !== recoveryConfirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Mật khẩu xác nhận không khớp." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: "Mật khẩu xác nhận không khớp.",
        });
        return;
      }

      const response = await apiResetPassword({
        token: recoveryToken,
        newPassword: recoveryNewPassword,
        confirmPassword: recoveryConfirmPassword,
      });

      const extracted = extractBackendMessage(response);
      const successText = extracted.message || "Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.";
      setSuccessMsg(successText);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successText,
      });
      addAuditLog("VERIFY", { token: recoveryToken }, "SUCCESS", successText, apiBaseUrl, getClientDeviceInfo());

      setRecoveryNewPassword("");
      setRecoveryConfirmPassword("");

      setTimeout(() => {
        window.location.hash = "login";
        setRecoveryMode("NONE");
        setIsSignUp(false);
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Password reset failed:", errorObj);
      const cleanReason = sanitizeErrorMessage(errorObj.message);
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
      addAuditLog("VERIFY", { token: recoveryToken }, "FAILED", `Đổi mật khẩu thất bại: ${cleanReason}`, apiBaseUrl, getClientDeviceInfo());
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setToastNotification(null);
    setFieldErrors(prev => ({ ...prev, newUsername: "" }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!recoveryNewUsername || !recoveryNewUsername.trim()) {
        setFieldErrors(prev => ({ ...prev, newUsername: "Tên đăng nhập mới không được để trống." }));
        setToastNotification({
          id: Date.now().toString(),
          type: "error",
          message: "Tên đăng nhập mới không được để trống.",
        });
        return;
      }

      const response = await apiChangeUsername({
        newUsername: recoveryNewUsername.trim(),
      });

      const extracted = extractBackendMessage(response);
      const successText = extracted.message || "Đổi tên đăng nhập thành công. Vui lòng đăng nhập lại.";
      setSuccessMsg(successText);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successText,
      });
      addAuditLog("VERIFY", { newUsername: recoveryNewUsername.trim() }, "SUCCESS", successText, apiBaseUrl, getClientDeviceInfo());

      // Backend invalidates session on username change: clear client tokens and redirect to login
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new Event("user-auth-change"));

      if (recoveryUser) {
        setRecoveryUser({
          ...recoveryUser,
          username: recoveryNewUsername.trim(),
          fullName: recoveryNewUsername.trim()
        });
      }

      setRecoveryNewUsername("");
      setIsUsernameChangeExpanded(false);

      setTimeout(() => {
        window.location.hash = "login";
        setRecoveryMode("NONE");
        setIsSignUp(false);
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Username change failed:", errorObj);
      const cleanReason = sanitizeErrorMessage(errorObj.message);
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
      addAuditLog("VERIFY", { newUsername: recoveryNewUsername.trim() }, "FAILED", `Đổi tên đăng nhập thất bại: ${cleanReason}`, apiBaseUrl, getClientDeviceInfo());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = (token: string) => {
    setVerificationTokenInput(token);
    window.location.hash = "verify";
    setIsVerifyingMode(true);

    setVerificationLogs([`[INFO] Đã lấy mã kích hoạt từ SMTP Relay: ${token}`, `[INFO] Khởi chạy kích hoạt tự động...`]);
    setTimeout(() => {
      handleExecuteRealVerification(token);
    }, 150);
  };

  const handleVerificationSuccess = (emailVal: string) => {
    let savedEmail = emailVal;
    if (savedEmail.length === 0) {
      if (lastRegEmail !== null && lastRegEmail.length > 0) savedEmail = lastRegEmail;
      else {
        const storedEmail = localStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_EMAIL) || localStorage.getItem("horizon_last_registration_email");
        if (storedEmail !== null) savedEmail = storedEmail;
      }
    }

    const savedUsername = localStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_USERNAME) || localStorage.getItem("horizon_last_registration_username");
    const savedPassword = localStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_PASSWORD) || localStorage.getItem("horizon_last_registration_password");

    setTimeout(async () => {
      let canAutoLogin = false;
      if (savedPassword !== null && savedPassword.length > 0) {
        if (savedEmail.length > 0) canAutoLogin = true;
        else if (savedUsername !== null && savedUsername.length > 0) canAutoLogin = true;
      }

      if (canAutoLogin && savedPassword) {
        setVerificationLogs(prev => [
          ...prev,
          `[INFO] Đã tìm thấy thông tin mật khẩu đăng ký. Tiến hành tự động đăng nhập...`
        ]);

        let loginTerm = savedEmail;
        if (loginTerm.length === 0 && savedUsername !== null) loginTerm = savedUsername;
        setEmail(loginTerm);
        setPassword(savedPassword);
        window.location.hash = "login";
        setIsSignUp(false);
        setIsVerifyingMode(false);

        setLoading(true);

        setTimeout(async () => {
          try {
            const devInfo = getClientDeviceInfo();
            const payload: UserLoginRequest = { usernameOrEmail: loginTerm, password: savedPassword, deviceInfo: devInfo };

            const res = await loginUser(payload);
            const extractedMsg = extractBackendMessage(res);

            if (res.data !== undefined && res.data !== null) {
              const userData = res.data;
              const accessJWT = userData.accessToken ?? "";
              const refreshJWT = userData.refreshToken ?? "";
              const userRoles = userData.roles ?? ["USER"];
              const finalEmail = userData.email ?? savedEmail;
              let finalUsername = userData.username;
              if (!finalUsername) finalUsername = savedUsername ?? savedEmail.split("@")[0];

              let userFullName = userData.fullName;
              let actualUsername = finalUsername;
              if (accessJWT) {
                try {
                  const meRes = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/auth/me`, {
                    method: "GET",
                    headers: {
                      "Authorization": `Bearer ${accessJWT}`,
                      "Accept": "application/json"
                    }
                  });
                  if (meRes.ok) {
                    const meJson = await meRes.json();
                    if (meJson?.data?.fullName) {
                      userFullName = meJson.data.fullName;
                    }
                    if (meJson?.data?.username) {
                      actualUsername = meJson.data.username;
                    }
                  }
                } catch (_) {}
              }

              const realUserObj = {
                id: userData.id ?? 1,
                fullName: userFullName || actualUsername,
                username: actualUsername,
                email: finalEmail,
                roles: userRoles,
                status: "ACTIVE"
              };

              const redisProfile = {
                userId: realUserObj.id,
                email: realUserObj.email,
                roles: realUserObj.roles,
                accessToken: accessJWT
              };

              const redisRefreshTokens = {
                [devInfo.deviceId]: {
                  token: refreshJWT,
                  deviceInfo: devInfo
                }
              };

              localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessJWT);
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshJWT);
              localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(redisProfile));
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKENS_MAP, JSON.stringify(redisRefreshTokens));
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(realUserObj));
              window.dispatchEvent(new Event("user-auth-change"));
            }

            // Merge guest cart with authenticated user cart
            mergeGuestCart().catch((e) => console.warn("mergeGuestCart failed:", e));

            setLoading(false);
            addAuditLog("LOGIN", payload, "SUCCESS", extractedMsg.message, apiBaseUrl, devInfo);
          } catch (err: any) {
            console.warn("Auto-login API failed:", err);
            setLoading(false);
            window.location.hash = "login";
            setIsVerifyingMode(false);

            setErrorMsg(sanitizeErrorMessage(err.message));
          }
        }, 150);
      } else {
        window.location.hash = "login";
        setIsVerifyingMode(false);

        setIsSignUp(false);
        setVerificationLogs([]);
        setSuccessMsg("Kích hoạt tài khoản thành công! Vui lòng đăng nhập với thông tin tài khoản của bạn.");
      }
    }, 2000);
  };

  const handleExecuteRealVerification = async (overrideToken?: string) => {
    let tokenToUse = verificationTokenInput.trim();
    if (overrideToken !== undefined && overrideToken.length > 0) tokenToUse = overrideToken.trim();

    if (tokenToUse.length === 0) {
      setVerificationLogs(["[ERROR] Vui lòng nhập Mã xác thực (Token) hoặc dán link kích hoạt để tiếp tục."]);
      setVerificationResultState("FAILED");
      return;
    }

    setIsVerifyingRequest(true);
    setVerificationResultState(null);
    setVerificationLogs([
      `[INFO] Khởi chạy quy trình xác thực tài khoản...`,
      `[INFO] Phương thức: GET /api/auth/verify-email?token={token}`
    ]);

    await new Promise((resolve) => setTimeout(resolve, 400));

    let tokenClean = tokenToUse;
    if (tokenToUse.includes("token=")) {
      const parts = tokenToUse.split("token=");
      if (parts[1]) tokenClean = parts[1].split("&")[0];
    }

    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Đang kết nối tới ${apiBaseUrl}...`,
      `[INFO] Gửi yêu cầu xác thực token: ${tokenClean}`
    ]);

    try {
      const response = await apiVerifyEmail(tokenClean);
      const extractedMsg = extractBackendMessage(response);
      const successMessage = extractedMsg.message || "Xác thực email thành công. Tài khoản của bạn đã được kích hoạt.";

      setVerificationLogs(prev => [
        ...prev,
        `[OK] Backend phản hồi: SUCCESS (200 OK)`,
        `[OK] Đã kích hoạt tài khoản trên hệ thống!`,
        `[OK] ${successMessage}`
      ]);
      setVerificationResultState("SUCCESS");

      let returnedEmail = "";
      if (response && response.data && typeof response.data === "object" && typeof (response.data as Record<string, unknown>).email === "string") {
        returnedEmail = (response.data as Record<string, unknown>).email as string;
      }

      if (returnedEmail.length > 0) {
        setEmail(returnedEmail);
      }
      setSuccessMsg(successMessage);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successMessage,
      });
      setIsSignUp(false);

      addAuditLog("VERIFY", { token: tokenClean }, "SUCCESS", successMessage, apiBaseUrl, getClientDeviceInfo());
      handleVerificationSuccess(returnedEmail);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Real API Verification Failed:", errorObj);
      const cleanReason = sanitizeErrorMessage(errorObj.message || "") || "Mã xác thực email không hợp lệ hoặc đã hết hạn.";
      setVerificationLogs(prev => [
        ...prev,
        `[ERROR] Xác thực thất bại: ${cleanReason}`,
        `[INFO] Mã xác thực có thời hạn 15 phút. Bạn có thể nhấn nút gửi lại mã mới bên dưới.`
      ]);
      setVerificationResultState("FAILED");
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });

      addAuditLog("VERIFY", { token: tokenClean }, "FAILED", `Kích hoạt email thất bại: ${cleanReason}`, apiBaseUrl, getClientDeviceInfo());
    } finally {
      setIsVerifyingRequest(false);
    }
  };

  const handleResendToken = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    let targetEmail = email;
    if (targetEmail.length === 0 && lastRegEmail !== null) targetEmail = lastRegEmail;
    if (targetEmail.length === 0) {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_EMAIL) || localStorage.getItem("horizon_last_registration_email");
      if (stored !== null) targetEmail = stored;
    }

    if (targetEmail.length === 0 || targetEmail.trim().length === 0) {
      window.location.hash = "resend-verification";
      setRecoveryMode("RESEND_VERIFICATION");
      setIsVerifyingMode(false);
      return;
    }

    setLoading(true);
    const devInfo = getClientDeviceInfo();
    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Yêu cầu gửi lại mã xác thực cho email: ${targetEmail.trim()}...`
    ]);

    try {
      const res = await apiResendVerification(targetEmail.trim());
      const extractedMsg = extractBackendMessage(res);
      const successMessage = extractedMsg.message || "Nếu email tồn tại trên hệ thống và chưa được kích hoạt, liên kết xác thực mới đã được gửi. Vui lòng kiểm tra.";
      setSuccessMsg(successMessage);
      setToastNotification({
        id: Date.now().toString(),
        type: "success",
        message: successMessage,
      });

      setTimeLeft(900);
      setCooldownTime(60);

      setVerificationLogs(prev => [
        ...prev,
        `[OK] Đã gửi yêu cầu xác thực mới!`,
        `[OK] ${successMessage}`
      ]);
      addAuditLog("VERIFY", { email: targetEmail }, "SUCCESS", `[GỬI LẠI MÃ] ${successMessage}`, apiBaseUrl, devInfo);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.warn("Real Backend Resend Failed:", errorObj);
      const cleanReason = sanitizeErrorMessage(errorObj.message);
      setErrorMsg(cleanReason);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: cleanReason,
      });
      setVerificationLogs(prev => [
        ...prev,
        `[ERROR] Gửi lại mã thất bại: ${cleanReason}`
      ]);
    } finally {
      setLoading(false);
    }
  };



  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});

    // Client-side validation
    if (isSignUp) {
      const errs: Record<string, string> = {};
      if (!username || !username.trim())
        errs["name"] = "Tên đăng nhập không được để trống.";
      else if (username.trim().length < 3 || username.trim().length > 50)
        errs["name"] = "Tên đăng nhập phải từ 3 đến 50 ký tự.";
      if (!fullName || !fullName.trim())
        errs["fullName"] = "Họ và tên không được để trống.";
      if (!email || !email.trim())
        errs["email"] = "Email không được để trống.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errs["email"] = "Email không đúng định dạng.";
      if (!password)
        errs["password"] = "Mật khẩu không được để trống.";
      else if (password.length < 6)
        errs["password"] = "Mật khẩu phải có ít nhất 6 ký tự.";
      if (!confirmPassword)
        errs["confirmPassword"] = "Vui lòng xác nhận mật khẩu.";
      else if (password && password !== confirmPassword)
        errs["confirmPassword"] = "Xác nhận mật khẩu không khớp.";
      const termsError = !agreeToTerms ? "Bạn phải đồng ý với Điều khoản và Chính sách dịch vụ." : "";
      if (Object.keys(errs).length > 0 || termsError) {
        setFieldErrors(errs);
        if (termsError) {
          setErrorMsg(termsError);
          setToastNotification({
            id: Date.now().toString(),
            type: "error",
            message: termsError,
          });
        }
        return;
      }
    } else {
      const errs: Record<string, string> = {};
      if (!email)
        errs["usernameOrEmail"] = "Vui lòng nhập tên đăng nhập hoặc email.";
      else if (email.trim().length < 3 || email.trim().length > 50)
        errs["usernameOrEmail"] = "Tên đăng nhập hoặc email phải từ 3 đến 50 ký tự.";
      if (!password)
        errs["password"] = "Mật khẩu không được để trống.";
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const devInfo = getClientDeviceInfo();

      try {
        if (isSignUp) {
          const payload: UserRegisterRequest = {
            name: username.trim(),
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
            confirmPassword
          };
          const res = await registerUser(payload);
          const extractedMsg = extractBackendMessage(res);
          setSuccessMsg(extractedMsg.message);
          setToastNotification({
            id: Date.now().toString(),
            type: "success",
            message: extractedMsg.message,
          });

          let token = "";
          if (res.data !== undefined && res.data !== null) {
            if (typeof res.data.token === "string") token = res.data.token;
            else if (typeof res.data.accessToken === "string") token = res.data.accessToken;
          }
          if (token.length > 0) {
            localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_TOKEN, token);
            setLastRegToken(token);
          }
          localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_EMAIL, payload.email);
          localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_MESSAGE, extractedMsg.message);
          localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_USERNAME, username.trim());
          localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_PASSWORD, password);

          setLastRegEmail(payload.email);
          if (token.length > 0) {
            setManualTokenInput(token);
          }
          setLoading(false);
          window.location.hash = "recovery-token";
          setIsSignUp(false);
          setIsVerifyingMode(false);
          setRecoveryMode("MANUAL_TOKEN");

          setPassword("");
          setConfirmPassword("");

          addAuditLog("REGISTER", payload, "SUCCESS", extractedMsg.message, apiBaseUrl, devInfo);
        } else {
          const payload: UserLoginRequest = {
            usernameOrEmail: email.trim(),
            password,
            deviceInfo: devInfo
          };
          const res = await loginUser(payload);
          const extractedMsg = extractBackendMessage(res);

          if (res.data !== undefined && res.data !== null) {
            const userData = res.data;
            const accessJWT = userData.accessToken ?? "";
            const refreshJWT = userData.refreshToken ?? "";
            const userRoles = userData.roles ?? ["USER"];
            const finalEmail = userData.email ?? email;
            let finalUsername = userData.username;
            if (!finalUsername) finalUsername = email.split("@")[0];

            let userFullName = userData.fullName;
            let actualUsername = finalUsername;
            if (accessJWT) {
              try {
                const meRes = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/auth/me`, {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${accessJWT}`,
                    "Accept": "application/json"
                  }
                });
                if (meRes.ok) {
                  const meJson = await meRes.json();
                  if (meJson?.data?.fullName) {
                    userFullName = meJson.data.fullName;
                  }
                  if (meJson?.data?.username) {
                    actualUsername = meJson.data.username;
                  }
                }
              } catch (_) {}
            }

            const realUserObj = {
              id: userData.id ?? 1,
              fullName: userFullName || actualUsername,
              username: actualUsername,
              email: finalEmail,
              roles: userRoles,
              status: "ACTIVE"
            };
            const redisProfile = {
              userId: realUserObj.id,
              email: realUserObj.email,
              roles: realUserObj.roles,
              accessToken: accessJWT
            };
            const redisRefreshTokens = {
              [devInfo.deviceId]: { token: refreshJWT, deviceInfo: devInfo }
            };

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessJWT);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshJWT);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(redisProfile));
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKENS_MAP, JSON.stringify(redisRefreshTokens));
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(realUserObj));
            window.dispatchEvent(new Event("user-auth-change"));
          }

          // Merge guest cart with authenticated user cart
          mergeGuestCart().catch((e) => console.warn("mergeGuestCart failed:", e));

          setLoading(false);
          addAuditLog("LOGIN", payload, "SUCCESS", extractedMsg.message, apiBaseUrl, devInfo);

          const pendingAction = consumePendingAction();
          if (pendingAction) {
            if (pendingAction.returnUrl) {
              const url = pendingAction.returnUrl;
              if (url.includes("#")) {
                const hashPart = url.substring(url.indexOf("#") + 1);
                window.location.hash = hashPart;
              }
              if (url.startsWith("/o") || url.startsWith("/order") || pendingAction.actionId === "BUY_NOW") {
                onNavigate("order");
                return;
              } else if (url.startsWith("/profile")) {
                onNavigate("profile");
                return;
              } else if (url.startsWith("/p") || url.startsWith("/product")) {
                onNavigate("product");
                return;
              }
            }
          }

          const redirectTarget = sessionStorage.getItem("auth_redirect_target");
          if (redirectTarget) {
            sessionStorage.removeItem("auth_redirect_target");
            if (redirectTarget === "/o" || redirectTarget === "order") {
              onNavigate("order");
              return;
            } else if (redirectTarget === "/profile" || redirectTarget === "profile") {
              onNavigate("profile");
              return;
            } else if (redirectTarget === "/p" || redirectTarget === "product") {
              onNavigate("product");
              return;
            }
          }
          onNavigate("landing");
        }
        return;
      } catch (err: any) {
        console.warn("Real Backend API Request Failed:", err);

        const errorResponse = err.data;
        let extracted = err.extracted;
        if (!extracted && errorResponse) extracted = extractBackendMessage(errorResponse);

        // Map backend fieldErrors to UI keys
        // Register: name, fullName, email, password, confirmPassword
        // Login: usernameOrEmail, password
        const rawFieldErrors: Record<string, string> =
          err.fieldErrors ?? extracted?.fieldErrors ?? {};

        if (Object.keys(rawFieldErrors).length > 0) {
          setFieldErrors(rawFieldErrors);
        }

        // Case 2.2: 401 Unverified email
        const isUnverified = err.status === 401 && errorResponse?.data?.email !== undefined;

        if (isUnverified) {
          const unverifiedEmail = errorResponse?.data?.email ?? email;
          const resendMessage = extracted?.message || "Tài khoản chưa được xác thực. Vui lòng kích hoạt.";
          setSuccessMsg(resendMessage);
          if (typeof errorResponse?.data?.token === "string") {
            localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_TOKEN, errorResponse.data.token);
            setLastRegToken(errorResponse.data.token);
          }
          localStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_EMAIL, unverifiedEmail);
          setLastRegEmail(unverifiedEmail);
          window.location.hash = "verify";
          setIsSignUp(false);
          setIsVerifyingMode(true);

          setVerificationTokenInput("");
          setLoading(false);
          const payloadInfo = { usernameOrEmail: email, password, deviceInfo: devInfo };
          addAuditLog("LOGIN", payloadInfo, "FAILED", `[CHƯA XÁC THỰC] Chuyển hướng sang Kích hoạt email: ${unverifiedEmail}`, apiBaseUrl, devInfo);
          return;
        }

        // General business/system error — only show if no field errors
        const cleanReason =
          extracted?.message ||
          (typeof err.message === "string" && err.message.length > 0
            ? sanitizeErrorMessage(err.message)
            : "Xác thực không thành công. Hãy kiểm tra lại thông tin đăng nhập.");

        if (Object.keys(rawFieldErrors).length === 0) {
          setErrorMsg(cleanReason);
          setToastNotification({
            id: Date.now().toString(),
            type: "error",
            message: cleanReason,
          });
        }
        setLoading(false);

        const payloadInfo = isSignUp
          ? { name: username.trim(), fullName: fullName.trim(), email: email.trim().toLowerCase(), password, confirmPassword }
          : { usernameOrEmail: email, password, deviceInfo: devInfo };
        addAuditLog(isSignUp ? "REGISTER" : "LOGIN", payloadInfo, "FAILED", cleanReason, apiBaseUrl, devInfo);
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
      setErrorMsg(msg);
      setToastNotification({
        id: Date.now().toString(),
        type: "error",
        message: msg,
      });
    }
  };

  const handleSocialLogin = (platform: "Google" | "GitHub") => {
    showToast(`Đang khởi tạo liên kết bảo mật với tài khoản ${platform}...`, "info");
  };

  return (
    <div className="w-full min-h-screen bg-[#E4E4E4] text-[#111111] flex flex-col items-center justify-center relative py-12 px-4 md:px-10 overflow-hidden select-none">
      {/* Top Left Branding Header */}
      <div
        onClick={() => onNavigate("landing")}
        className="absolute top-6 left-6 md:top-8 md:left-10 flex items-center gap-2.5 cursor-pointer z-20 group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-500 to-[#FF4D24] flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-all">
          <span className="material-symbols-outlined text-white text-[18px] font-bold">auto_awesome</span>
        </div>
        <span className="font-sans font-black text-sm text-[#111111] tracking-tight">
          HORIZON<span className="text-[#FF4D24]">MOBILE</span>
        </span>
      </div>

      {/* Breathing Ambient Light Glow Elements */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.22, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FF4D24] to-indigo-600 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.12, 0.18, 0.12],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#FF4D24] to-cyan-500 blur-[130px] pointer-events-none translate-x-1/2 translate-y-1/2"
      />
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.06, 0.11, 0.06],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 blur-[110px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
      />

      <div className="max-w-[540px] w-full z-10" style={{ zoom: 1.15 }}>

        {/* Auth Glassmorphism Card */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 p-9 md:p-11 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.07)] overflow-hidden"
        >
          {/* Spotlight follow background */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-3xl"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(240px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255, 77, 36, 0.05), transparent 80%)`,
            }}
          />

          <AnimatePresence mode="wait">
            {recoveryMode === "RESEND_VERIFICATION" ? (
              <motion.div
                key="resend-verification-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                      <Mail className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight font-sans">
                        Gửi lại email xác thực
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                        RESEND VERIFICATION PORTAL
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ kiểm tra và gửi lại liên kết kích hoạt mới có thời hạn 15 phút.
                  </p>
                </div>

                <form onSubmit={handleResendVerificationSubmit} noValidate className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="resend-email-input">
                      Địa chỉ Email đăng ký
                    </label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredField("resendEmail")}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      <HoverMorphIcon
                        defaultIcon={MorphMail}
                        hoverIcon={MorphMailCheck}
                        isHovered={focusedField === "resendEmail" || hoveredField === "resendEmail" || Boolean(resendEmail || email)}
                        size={16}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                          fieldErrors["resendEmail"] ? "text-red-500" : focusedField === "resendEmail" ? "text-[#FF4D24]" : "text-slate-400"
                        }`}
                      />
                      <input
                        id="resend-email-input"
                        type="email"
                        placeholder="Nhập địa chỉ email đăng ký của bạn"
                        value={resendEmail || email}
                        onChange={(e) => {
                          setResendEmail(e.target.value);
                          setEmail(e.target.value);
                          if (fieldErrors["resendEmail"]) {
                            setFieldErrors(prev => ({ ...prev, resendEmail: "" }));
                          }
                        }}
                        onFocus={() => setFocusedField("resendEmail")}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${
                          fieldErrors["resendEmail"]
                            ? "border-red-500 focus:ring-red-500/15"
                            : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"
                        } shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "login";
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      title="Quay lại trang Đăng nhập"
                      aria-label="Quay lại trang Đăng nhập"
                      className="w-[15%] min-w-[48px] bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99] py-3.5 px-2 rounded-xl font-sans transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#FF4D24] transition-transform duration-200 group-hover:-translate-x-0.5" />
                    </button>

                    <button
                      type="submit"
                      disabled={loading || cooldownTime > 0}
                      className={`relative flex-1 ${
                        loading || cooldownTime > 0
                          ? "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-[#FF4D24]/40 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_12px_rgba(255,77,36,0.15)]"
                          : "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99]"
                      } py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                    >
                      {loading && <DynamicButtonShimmer />}
                      <span 
                        className="flex items-center justify-center gap-2 transition-all duration-200" 
                        style={{ 
                          opacity: loading ? 0 : 1,
                          transform: loading ? "translateY(-6px) scale(0.96)" : "translateY(0px) scale(1)",
                          pointerEvents: loading ? "none" : "auto"
                        }}
                      >
                        {cooldownTime > 0 ? (
                          <span>Gửi lại sau ({cooldownTime}s)</span>
                        ) : (
                          <>
                            <span>Gửi lại mã xác thực</span>
                            <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                          </>
                        )}
                      </span>
                      <span 
                        className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200" 
                        style={{ 
                          opacity: loading ? 1 : 0,
                          transform: loading ? "translateY(0px) scale(1)" : "translateY(6px) scale(0.96)",
                          pointerEvents: loading ? "auto" : "none"
                        }}
                      >
                        <DynamicButtonLoader text="Đang gửi mã mới" />
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "verify";
                        setIsVerifyingMode(true);
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-[#FF4D24] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mx-auto font-sans py-1"
                    >
                      <Key className="w-3.5 h-3.5 text-[#FF4D24]" />
                      <span>Đã có mã kích hoạt? Nhập mã</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : recoveryMode === "SEND_LINK" ? (
              <motion.div
                key="account-recovery-send-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                      <Key className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight font-sans">
                        Khôi phục tài khoản
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                        ACCOUNT RECOVERY PORTAL
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Nhập địa chỉ email đã đăng ký. Hệ thống sẽ gửi liên kết và mã xác thực đặt lại mật khẩu có thời hạn 20 phút.
                  </p>
                </div>

                <form onSubmit={handleSendRecoveryEmail} noValidate className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="recovery-email-input">
                      Địa chỉ Email đăng ký
                    </label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredField("recoveryEmail")}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      <HoverMorphIcon
                        defaultIcon={MorphMail}
                        hoverIcon={MorphMailCheck}
                        isHovered={focusedField === "recoveryEmail" || hoveredField === "recoveryEmail" || Boolean(recoveryEmail)}
                        size={16}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                          fieldErrors["recoveryEmail"] ? "text-red-500" : focusedField === "recoveryEmail" ? "text-[#FF4D24]" : "text-slate-400"
                        }`}
                      />
                      <input
                        id="recovery-email-input"
                        type="email"
                        placeholder="Nhập địa chỉ email đăng ký của bạn"
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          if (fieldErrors["recoveryEmail"]) {
                            setFieldErrors(prev => ({ ...prev, recoveryEmail: "" }));
                          }
                        }}
                        onFocus={() => setFocusedField("recoveryEmail")}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${
                          fieldErrors["recoveryEmail"]
                            ? "border-red-500 focus:ring-red-500/15"
                            : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"
                        } shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "login";
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      title="Quay lại trang Đăng nhập"
                      aria-label="Quay lại trang Đăng nhập"
                      className="w-[15%] min-w-[48px] bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99] py-3.5 px-2 rounded-xl font-sans transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#FF4D24] transition-transform duration-200 group-hover:-translate-x-0.5" />
                    </button>

                    <button
                      type="submit"
                      disabled={loading || cooldownTime > 0}
                      className={`relative flex-1 ${
                        loading || cooldownTime > 0
                          ? "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-[#FF4D24]/40 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_12px_rgba(255,77,36,0.15)]"
                          : "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99]"
                      } py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                    >
                      {loading && <DynamicButtonShimmer />}
                      <span 
                        className="flex items-center justify-center gap-2 transition-all duration-200" 
                        style={{ 
                          opacity: loading ? 0 : 1,
                          transform: loading ? "translateY(-6px) scale(0.96)" : "translateY(0px) scale(1)",
                          pointerEvents: loading ? "none" : "auto"
                        }}
                      >
                        {cooldownTime > 0 ? (
                          <span>Gửi lại sau ({cooldownTime}s)</span>
                        ) : (
                          <>
                            <span>Gửi liên kết khôi phục</span>
                            <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                          </>
                        )}
                      </span>
                      <span 
                        className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200" 
                        style={{ 
                          opacity: loading ? 1 : 0,
                          transform: loading ? "translateY(0px) scale(1)" : "translateY(6px) scale(0.96)",
                          pointerEvents: loading ? "auto" : "none"
                        }}
                      >
                        <DynamicButtonLoader text="Đang gửi liên kết" />
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "recovery-token";
                        setRecoveryMode("MANUAL_TOKEN");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-[#FF4D24] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mx-auto font-sans py-1"
                    >
                      <Key className="w-3.5 h-3.5 text-[#FF4D24]" />
                      <span>Đã có mã khôi phục? Nhập thủ công</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : recoveryMode === "MANUAL_TOKEN" ? (
              <motion.div
                key="account-recovery-manual-token-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                      <Key className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight font-sans">
                        Nhập mã khôi phục
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                        MANUAL TOKEN ENTRY
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Vui lòng nhập hoặc dán mã Token khôi phục đã được gửi đến email của bạn nhằm mục đích thiết lập tài khoản.
                  </p>
                </div>

                <form
                  onSubmit={handleManualTokenSubmit}
                  noValidate
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="manual-token-input">
                      Mã Token khôi phục
                    </label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredField("manualToken")}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      <HoverMorphIcon
                        defaultIcon={MorphKey}
                        hoverIcon={MorphKeyRound}
                        isHovered={focusedField === "manualToken" || hoveredField === "manualToken" || Boolean(manualTokenInput)}
                        size={16}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                          fieldErrors["manualToken"] ? "text-red-500" : focusedField === "manualToken" ? "text-[#FF4D24]" : "text-slate-400"
                        }`}
                      />
                      <input
                        id="manual-token-input"
                        type="text"
                        placeholder="Nhập hoặc dán mã Token khôi phục"
                        value={manualTokenInput}
                        onChange={(e) => {
                          setManualTokenInput(e.target.value);
                          if (fieldErrors["manualToken"]) {
                            setFieldErrors(prev => ({ ...prev, manualToken: "" }));
                          }
                        }}
                        onFocus={() => setFocusedField("manualToken")}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${
                          fieldErrors["manualToken"]
                            ? "border-red-500 focus:ring-red-500/15"
                            : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"
                        } shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                      />
                    </div>
                  </div>

                  {cooldownTime > 0 && (
                    <div className="text-center text-[10px] font-mono font-bold text-slate-500 bg-slate-50/80 py-1.5 rounded-xl border border-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      THỜI GIAN GỬI LẠI EMAIL: <span className="text-[#FF4D24] font-black">{cooldownTime}s</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "recovery";
                        setRecoveryMode("SEND_LINK");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      title="Quay lại gửi liên kết khôi phục"
                      aria-label="Quay lại gửi liên kết khôi phục"
                      className="w-[15%] min-w-[48px] bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99] py-3.5 px-2 rounded-xl font-sans transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#FF4D24] transition-transform duration-200 group-hover:-translate-x-0.5" />
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifyingManualToken || loading}
                      className={`relative flex-1 ${
                        isVerifyingManualToken || loading
                          ? "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-[#FF4D24]/40 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_12px_rgba(255,77,36,0.15)]"
                          : "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99]"
                      } py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                    >
                      {(isVerifyingManualToken || loading) && <DynamicButtonShimmer />}
                      <span 
                        className="flex items-center justify-center gap-2 transition-all duration-200" 
                        style={{ 
                          opacity: isVerifyingManualToken || loading ? 0 : 1,
                          transform: isVerifyingManualToken || loading ? "translateY(-6px) scale(0.96)" : "translateY(0px) scale(1)",
                          pointerEvents: isVerifyingManualToken || loading ? "none" : "auto"
                        }}
                      >
                        <span>Tiến hành xác thực</span>
                        <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                      </span>
                      <span 
                        className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200" 
                        style={{ 
                          opacity: isVerifyingManualToken || loading ? 1 : 0,
                          transform: isVerifyingManualToken || loading ? "translateY(0px) scale(1)" : "translateY(6px) scale(0.96)",
                          pointerEvents: isVerifyingManualToken || loading ? "auto" : "none"
                        }}
                      >
                        <DynamicButtonLoader text="Đang xác thực" />
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "login";
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mx-auto py-1"
                    >
                      <span>Trở về Đăng nhập</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : recoveryMode === "RESET_PASSWORD" ? (
              <motion.div
                key="account-recovery-reset-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                      <Lock className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight font-sans">
                        Đặt lại mật khẩu
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                        RESET PASSWORD PORTAL
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Thiết lập mật khẩu mới cho tài khoản của bạn để hoàn tất quá trình khôi phục.
                  </p>
                </div>

                {isValidatingToken ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-7 h-7 text-[#FF4D24] animate-spin" />
                    <p className="text-xs text-slate-500 font-bold font-mono tracking-wider uppercase animate-pulse">
                      Đang xác thực liên kết khôi phục...
                    </p>
                  </div>
                ) : tokenValidationError ? (
                  <div className="space-y-3.5 py-3 text-center">
                    <div className="w-11 h-11 bg-red-50 border border-red-200/80 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed px-2">
                      {tokenValidationError}
                    </p>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "recovery-token";
                          setRecoveryMode("MANUAL_TOKEN");
                          setTokenValidationError("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-b from-slate-50 to-slate-100 border border-t-white border-b-slate-300/80 border-x-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <Key className="w-3.5 h-3.5 text-[#FF4D24]" />
                        Nhập lại mã Token
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "recovery";
                          setRecoveryMode("SEND_LINK");
                          setTokenValidationError("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer border-t border-t-white/35 border-b border-b-black/80 border-x border-x-white/10 shadow-[0_3px_10px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Yêu cầu lại liên kết mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleResetPassword}
                    noValidate
                    className="flex flex-col gap-3.5"
                  >
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reset-new-password">
                        Mật khẩu mới
                      </label>
                      <div 
                        className="relative"
                        onMouseEnter={() => setHoveredField("newPassword")}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        <HoverMorphIcon
                          defaultIcon={MorphLock}
                          hoverIcon={MorphKeyRound}
                          isHovered={focusedField === "newPassword" || hoveredField === "newPassword" || Boolean(recoveryNewPassword)}
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                            fieldErrors["newPassword"] ? "text-red-500" : focusedField === "newPassword" ? "text-[#FF4D24]" : "text-slate-400"
                          }`}
                        />
                        <input
                          id="reset-new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          value={recoveryNewPassword}
                          onChange={(e) => {
                            setRecoveryNewPassword(e.target.value);
                            if (fieldErrors["newPassword"]) {
                              setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                            }
                          }}
                          onFocus={() => setFocusedField("newPassword")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${
                            fieldErrors["newPassword"]
                              ? "border-red-500 focus:ring-red-500/15"
                              : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"
                          } shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        >
                          <MorphIcon icon={showPassword ? MorphEyeOff : MorphEye} size={16} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {fieldErrors["newPassword"] && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 inline shrink-0 text-red-500" />
                            <span>{fieldErrors["newPassword"]}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reset-confirm-new-password">
                        Xác nhận mật khẩu mới
                      </label>
                      <div 
                        className="relative"
                        onMouseEnter={() => setHoveredField("confirmPassword")}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        <HoverMorphIcon
                          defaultIcon={MorphLock}
                          hoverIcon={MorphKeyRound}
                          isHovered={focusedField === "confirmPassword" || hoveredField === "confirmPassword" || Boolean(recoveryConfirmPassword)}
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                            fieldErrors["confirmPassword"] ? "text-red-500" : focusedField === "confirmPassword" ? "text-[#FF4D24]" : "text-slate-400"
                          }`}
                        />
                        <input
                          id="reset-confirm-new-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          value={recoveryConfirmPassword}
                          onChange={(e) => {
                            setRecoveryConfirmPassword(e.target.value);
                            if (fieldErrors["confirmPassword"]) {
                              setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                            }
                          }}
                          onFocus={() => setFocusedField("confirmPassword")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${
                            fieldErrors["confirmPassword"]
                              ? "border-red-500 focus:ring-red-500/15"
                              : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"
                          } shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        >
                          <MorphIcon icon={showConfirmPassword ? MorphEyeOff : MorphEye} size={16} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {fieldErrors["confirmPassword"] && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 inline shrink-0 text-red-500" />
                            <span>{fieldErrors["confirmPassword"]}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "login";
                          setRecoveryMode("NONE");
                          setRecoveryToken("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        title="Quay lại trang Đăng nhập"
                        aria-label="Quay lại trang Đăng nhập"
                        className="w-[15%] min-w-[48px] bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99] py-3.5 px-2 rounded-xl font-sans transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#FF4D24] transition-transform duration-200 group-hover:-translate-x-0.5" />
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className={`relative flex-1 ${
                          loading
                            ? "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-[#FF4D24]/40 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_12px_rgba(255,77,36,0.15)]"
                            : "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99]"
                        } py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                      >
                        {loading && <DynamicButtonShimmer />}
                        <span 
                          className="flex items-center justify-center gap-2 transition-all duration-200" 
                          style={{ 
                            opacity: loading ? 0 : 1,
                            transform: loading ? "translateY(-6px) scale(0.96)" : "translateY(0px) scale(1)",
                            pointerEvents: loading ? "none" : "auto"
                          }}
                        >
                          <span>Xác nhận đổi mật khẩu</span>
                          <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                        </span>
                        <span 
                          className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200" 
                          style={{ 
                            opacity: loading ? 1 : 0,
                            transform: loading ? "translateY(0px) scale(1)" : "translateY(6px) scale(0.96)",
                            pointerEvents: loading ? "auto" : "none"
                          }}
                        >
                          <DynamicButtonLoader text="Đang cập nhật mật khẩu" />
                        </span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "login";
                          setRecoveryMode("NONE");
                          setRecoveryToken("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mx-auto py-0.5"
                      >
                        <span>Quay lại trang Đăng nhập</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : isVerifyingMode ? (
              <motion.div
                key="email-verification-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center pb-2">
                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF4D24]/10 to-[#FF4D24]/20 border border-[#FF4D24]/20 shadow-[0_8px_20px_-6px_rgba(255,77,36,0.3)] animate-pulse">
                    <Mail className="w-6 h-6 text-[#FF4D24]" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center" />
                  </div>
                  <h2 className="text-xl font-black text-[#111111] tracking-tight font-sans">Xác thực tài khoản</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Một mã xác thực bảo mật đã được gửi đến email:</p>

                  {lastRegEmail && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF4D24]/5 border border-[#FF4D24]/10 rounded-full text-xs font-bold text-[#FF4D24] shadow-sm select-all">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D24] animate-ping" />
                      <span>{lastRegEmail}</span>
                    </div>
                  )}
                </div>

                {/* Countdown Timer */}
                <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/50 p-4 rounded-2xl shadow-sm transition-all hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                      <span className={`animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75 ${timeLeft > 0 ? "bg-[#FF4D24]" : "bg-slate-300"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft > 0 ? "bg-[#FF4D24]" : "bg-slate-300"}`}></span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide font-mono">Thời gian hiệu lực</p>
                      <p className="text-[10px] text-slate-400 font-medium">Mã sẽ tự động hủy sau khi hết giờ</p>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-black tracking-widest bg-white border border-slate-200 shadow-sm px-3.5 py-2 rounded-xl text-center">
                    <span className={timeLeft <= 30 && timeLeft > 0 ? "text-red-500 animate-pulse" : timeLeft === 0 ? "text-slate-400" : "text-[#FF4D24]"}>
                      {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {timeLeft === 0 && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Mã xác thực đã hết hạn. Vui lòng nhấn gửi lại mã mới bên dưới.</span>
                  </div>
                )}

                {/* Token Input */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="verify-token">
                      Mã xác thực bảo mật
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setVerificationTokenInput(text.trim());
                          }
                        } catch (e) {
                          setErrorMsg("Không thể đọc tự động từ clipboard. Hãy dán trực tiếp.");
                        }
                      }}
                      className="text-[10px] font-bold text-[#FF4D24] hover:text-[#E03D16] transition-colors cursor-pointer flex items-center gap-1 font-mono uppercase"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Dán nhanh</span>
                    </button>
                  </div>

                  <div className="relative group">
                    <Key className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#FF4D24]" />
                    <input
                      id="verify-token"
                      type="text"
                      placeholder="Dán mã kích hoạt của bạn vào đây"
                      value={verificationTokenInput}
                      onChange={(e) => setVerificationTokenInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-11 pr-4 py-4 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111] font-mono tracking-tight shadow-inner"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleExecuteRealVerification()}
                    disabled={isVerifyingRequest || timeLeft === 0 || !verificationTokenInput.trim()}
                    className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.99] disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed text-white py-4 px-4 rounded-2xl font-sans text-xs font-black tracking-wide shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden border border-slate-800"
                  >
                    {isVerifyingRequest && verificationResultState === null ? (
                      <Loader2 className="w-4.5 h-4.5 text-[#FF4D24] animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                        <span>XÁC NHẬN KÍCH HOẠT NGAY</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendToken}
                    disabled={loading || isVerifyingRequest}
                    className="w-full border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 text-slate-700 py-3.5 px-4 rounded-2xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-[#FF4D24]" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Gửi lại mã xác thực mới</span>
                  </button>
                </div>

                {/* Logs */}
                {verificationLogs.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Trạng thái kết nối máy chủ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
                      </div>
                    </div>
                    <div className="w-full bg-[#111317] border border-slate-800/85 rounded-2xl p-4.5 font-mono text-[10px] leading-relaxed text-slate-300 min-h-[110px] max-h-[160px] overflow-y-auto shadow-inner space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                      {verificationLogs.map((log, index) => {
                        let colorClass = "text-slate-400";
                        if (log.startsWith("[OK]")) colorClass = "text-emerald-400 font-semibold";
                        else if (log.startsWith("[ERROR]")) colorClass = "text-red-400 font-semibold";
                        else if (log.startsWith("[INFO]")) colorClass = "text-sky-400";
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`break-all ${colorClass}`}
                          >
                            {log}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Back */}
                <div className="text-center pt-2 border-t border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = "login";
                      setIsVerifyingMode(false);
                      setVerificationLogs([]);
                      setVerificationResultState(null);
                      setSuccessMsg("");
                      setErrorMsg("");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Quay lại Đăng nhập / Đăng ký</span>
                  </button>
                </div>
              </motion.div>

            ) : (
              <motion.div
                key="auth-credentials-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Tab Switcher: Sign In vs Sign Up */}
                <div className="grid grid-cols-2 p-1 bg-gradient-to-b from-slate-200/60 via-slate-200/40 to-slate-100/25 dark:from-zinc-900/60 dark:via-zinc-850/45 dark:to-zinc-800/35 rounded-xl mb-4 relative border border-t-slate-300/60 border-b-white/80 border-x-slate-200/50 dark:border-t-black/40 dark:border-b-white/10 dark:border-x-white/5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_3px_rgba(0,0,0,0.025),inset_0_-1px_1.5px_rgba(255,255,255,0.6),0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  <button
                    onClick={() => {
                      window.location.hash = "login";
                      setIsSignUp(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className={`py-2 text-xs font-bold rounded-lg relative z-10 cursor-pointer transition-colors duration-200 ${
                      !isSignUp ? "text-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                    }`}
                  >
                    {!isSignUp && (
                      <motion.div
                        layoutId="auth-active-tab-pill"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">Đăng nhập</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = "register";
                      setIsSignUp(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className={`py-2 text-xs font-bold rounded-lg relative z-10 cursor-pointer transition-colors duration-200 ${
                      isSignUp ? "text-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                    }`}
                  >
                    {isSignUp && (
                      <motion.div
                        layoutId="auth-active-tab-pill"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">Đăng ký</span>
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {isSignUp ? (
                    <motion.div
                      key="register-heading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="mb-2"
                    >
                      <h2 className="text-xl font-black text-[#111111] tracking-tight font-sans">
                        Tạo tài khoản mới
                      </h2>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login-heading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="mb-2"
                    >
                      <h2 className="text-xl font-black text-[#111111] tracking-tight font-sans">
                        Chào mừng quay trở lại
                      </h2>
                    </motion.div>
                  )}
                </AnimatePresence>


                {/* Primary Form */}
                <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-3">

                  <AnimatePresence mode="wait" initial={false}>
                    {isSignUp ? (
                      <motion.div
                        key="register-fields-container"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col gap-3"
                      >
                        {/* Tên đăng nhập */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-username">
                            Tên đăng nhập
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("su-username")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphUser}
                              hoverIcon={MorphAtSign}
                              isHovered={focusedField === "su-username" || hoveredField === "su-username" || Boolean(username)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "su-username" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="su-username"
                              type="text"
                              placeholder="Nhập tên đăng nhập"
                              value={username}
                              onFocus={() => setFocusedField("su-username")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setUsername(e.target.value);
                                if (fieldErrors["username"] || fieldErrors["name"]) {
                                  setFieldErrors(prev => ({ ...prev, username: "", name: "" }));
                                }
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["username"] || fieldErrors["name"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                          </div>
                          {(fieldErrors["username"] || fieldErrors["name"]) && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["username"] || fieldErrors["name"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Ho va ten */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-fullname">
                            Họ và Tên đầy đủ
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("su-fullname")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphCircleUser}
                              hoverIcon={MorphIdCard}
                              isHovered={focusedField === "su-fullname" || hoveredField === "su-fullname" || Boolean(fullName)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "su-fullname" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="su-fullname"
                              type="text"
                              placeholder="Họ và tên đầy đủ"
                              value={fullName}
                              onFocus={() => setFocusedField("su-fullname")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setFullName(e.target.value);
                                if (fieldErrors["fullName"]) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["fullName"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                          </div>
                          {fieldErrors["fullName"] && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["fullName"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-email">
                            Địa chỉ Email
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("su-email")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphMail}
                              hoverIcon={MorphMailCheck}
                              isHovered={focusedField === "su-email" || hoveredField === "su-email" || Boolean(email)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "su-email" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="su-email"
                              type="email"
                              placeholder="Địa chỉ email"
                              value={email}
                              onFocus={() => setFocusedField("su-email")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors["email"]) setFieldErrors(prev => ({ ...prev, email: "" }));
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["email"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                          </div>
                          {fieldErrors["email"] && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["email"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Mat khau */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-password">
                            Mật khẩu
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("su-password")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphLock}
                              hoverIcon={MorphKeyRound}
                              isHovered={focusedField === "su-password" || hoveredField === "su-password" || Boolean(password)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "su-password" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="su-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                              value={password}
                              onFocus={() => setFocusedField("su-password")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors["password"]) setFieldErrors(prev => ({ ...prev, password: "" }));
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["password"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center">
                              <MorphIcon icon={showPassword ? MorphEyeOff : MorphEye} spring="bouncy" size={16} />
                            </button>
                          </div>
                          {fieldErrors["password"] && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["password"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Xác nhận mật khẩu */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-confirm">
                            Xác nhận mật khẩu
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("su-confirm")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphShieldCheck}
                              hoverIcon={MorphCheckCheck}
                              isHovered={focusedField === "su-confirm" || hoveredField === "su-confirm" || Boolean(confirmPassword)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "su-confirm" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="su-confirm"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                              value={confirmPassword}
                              onFocus={() => setFocusedField("su-confirm")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (fieldErrors["confirmPassword"]) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["confirmPassword"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center">
                              <MorphIcon icon={showConfirmPassword ? MorphEyeOff : MorphEye} spring="bouncy" size={16} />
                            </button>
                          </div>
                          {fieldErrors["confirmPassword"] && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["confirmPassword"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Terms */}
                        <div className="flex items-center gap-2.5 mt-0.5 text-left">
                          <input id="su-terms" type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="w-4 h-4 accent-[#FF4D24] border-slate-300 rounded cursor-pointer shrink-0" />
                          <label htmlFor="su-terms" className="text-[10.5px] text-slate-500 leading-normal font-sans">
                            Tôi đồng ý với{" "}
                            <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate("terms"); }} className="text-[#FF4D24] font-bold hover:underline">Điều khoản Dịch vụ</a>
                            {" "}và{" "}
                            <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate("terms"); }} className="text-[#FF4D24] font-bold hover:underline">Chính sách Bảo mật</a>
                            {" "}của Horizon Mobile.
                          </label>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="login-fields-container"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col gap-3"
                      >
                        {/* Email hoac Username */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="li-email">
                            Tên đăng nhập hoặc Email
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("li-email")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphCircleUser}
                              hoverIcon={MorphAtSign}
                              isHovered={focusedField === "li-email" || hoveredField === "li-email" || Boolean(email)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "li-email" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="li-email"
                              type="text"
                              placeholder="Email hoặc tên đăng nhập"
                              value={email}
                              onFocus={() => setFocusedField("li-email")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors["email"] || fieldErrors["usernameOrEmail"]) {
                                  setFieldErrors(prev => ({ ...prev, email: "", usernameOrEmail: "" }));
                                }
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["email"] || fieldErrors["usernameOrEmail"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                          </div>
                          {(fieldErrors["email"] || fieldErrors["usernameOrEmail"]) && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["email"] || fieldErrors["usernameOrEmail"]}</span>
                            </p>
                          )}
                        </div>

                        {/* Mat khau */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="li-password">
                              Mật khẩu
                            </label>
                            <button type="button" onClick={() => { window.location.hash = "recovery"; setRecoveryMode("SEND_LINK"); setErrorMsg(""); setSuccessMsg(""); if (email && email.includes("@")) setRecoveryEmail(email); }} className="text-[10px] font-bold text-[#FF4D24] hover:underline cursor-pointer">
                              Quên thông tin tài khoản?
                            </button>
                          </div>
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredField("li-password")}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            <HoverMorphIcon
                              defaultIcon={MorphLock}
                              hoverIcon={MorphKeyRound}
                              isHovered={focusedField === "li-password" || hoveredField === "li-password" || Boolean(password)}
                              size={16}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                                focusedField === "li-password" ? "text-[#FF4D24]" : "text-slate-400"
                              }`}
                            />
                            <input
                              id="li-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                              value={password}
                              onFocus={() => setFocusedField("li-password")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors["password"]) setFieldErrors(prev => ({ ...prev, password: "" }));
                              }}
                              className={`w-full bg-gradient-to-b from-slate-50/60 via-white to-white border ${fieldErrors["password"] ? "border-red-500 focus:ring-red-500/10" : "border-t-slate-300/80 border-b-slate-200/80 border-x-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center">
                              <MorphIcon icon={showPassword ? MorphEyeOff : MorphEye} spring="bouncy" size={16} />
                            </button>
                          </div>
                          {fieldErrors["password"] && (
                            <p className="text-[10px] text-red-500 font-medium font-sans mt-0.5 text-left flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["password"]}</span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`relative w-full ${
                      loading
                        ? "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-[#FF4D24]/40 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_12px_rgba(255,77,36,0.15)]"
                        : "bg-gradient-to-b from-[#2a2d34] via-[#1e2126] to-[#121417] border-t border-t-white/35 border-b border-b-black border-x border-x-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.22),0_1.5px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-[0.99]"
                    } py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                  >
                    {loading && <DynamicButtonShimmer />}
                    <span 
                      className="flex items-center justify-center gap-2 transition-all duration-200" 
                      style={{ 
                        opacity: loading ? 0 : 1,
                        transform: loading ? "translateY(-6px) scale(0.96)" : "translateY(0px) scale(1)",
                        pointerEvents: loading ? "none" : "auto"
                      }}
                    >
                      <span>{isSignUp ? "Tạo tài khoản" : "Đăng nhập"}</span>
                      <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                    </span>
                    <span 
                      className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200" 
                      style={{ 
                        opacity: loading ? 1 : 0,
                        transform: loading ? "translateY(0px) scale(1)" : "translateY(6px) scale(0.96)",
                        pointerEvents: loading ? "auto" : "none"
                      }}
                    >
                      <DynamicButtonLoader text={isSignUp ? "Đang khởi tạo tài khoản" : "Đang đăng nhập"} />
                    </span>
                  </button>
                </form>

                {/* Social login divider */}
                <div className="relative my-3.5 select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider font-mono">
                    <span className="bg-[#E4E4E4]/90 px-3 text-slate-400 backdrop-blur-sm rounded-full">hoặc đăng nhập bằng</span>
                  </div>
                </div>

                {/* Social login buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSocialLogin("Google")}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border-t border-t-white border-b border-b-slate-300/40 border-x border-x-white/70 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 text-slate-700 text-xs font-semibold shadow-[0_2px_8px_-1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => handleSocialLogin("GitHub")}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border-t border-t-white border-b border-b-slate-300/40 border-x border-x-white/70 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 text-slate-700 text-xs font-semibold shadow-[0_2px_8px_-1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>



              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Verification Overlay Modal */}
          <AnimatePresence>
            {showVerifyOverlay && (
              <motion.div
                key="verify-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-slate-950/10 backdrop-blur-[16px] z-50 rounded-[32px] flex items-center justify-center p-6 select-none"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="bg-white border border-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-2xl p-8 max-w-[360px] w-full text-center space-y-5"
                >
                  {verifyOverlayStatus === "loading" && (
                    <>
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D24]/5 border border-[#FF4D24]/10 shadow-inner mx-auto text-[#FF4D24]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-black text-[#111111] font-sans">Đang xác thực tài khoản</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">Đang tiến hành xác minh token bảo mật với server...</p>
                      </div>
                    </>
                  )}

                  {verifyOverlayStatus === "success" && (
                    <>
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm mx-auto text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-black text-[#111111] font-sans">Xác thực thành công!</h3>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium px-1">{verifyOverlayMsg}</p>
                      </div>
                      <div className="py-1 px-2.5 bg-emerald-50/50 border border-emerald-100/60 rounded-lg text-[9px] text-emerald-700 font-bold font-mono inline-block">
                        Chuyển hướng về đăng nhập sau {verifyOverlayTimeLeft} giây...
                      </div>
                      <button
                        onClick={() => setShowVerifyOverlay(false)}
                        className="w-full bg-[#FF4D24] hover:bg-[#E03D16] text-white py-2.5 px-4 rounded-xl font-sans text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>ĐĂNG NHẬP NGAY</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {verifyOverlayStatus === "error" && (
                    <>
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-100 shadow-sm mx-auto text-red-500">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-black text-[#111111] font-sans">Xác thực thất bại</h3>
                        <p className="text-[11px] text-red-600 leading-relaxed font-medium px-1">{verifyOverlayMsg}</p>
                      </div>
                      <div className="py-1 px-2.5 bg-red-50/50 border border-[#FF4D24]/10 rounded-lg text-[9px] text-[#FF4D24] font-bold font-mono inline-block">
                        Chuyển hướng sau {verifyOverlayTimeLeft} giây...
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          onClick={() => {
                            setShowVerifyOverlay(false);
                            window.location.hash = "resend-verification";
                            setRecoveryMode("RESEND_VERIFICATION");
                            setIsSignUp(false);
                            setIsVerifyingMode(false);
                          }}
                          className="w-full bg-[#FF4D24] hover:bg-[#E03D16] text-white py-2.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>GỬI LẠI MÃ XÁC THỰC</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowVerifyOverlay(false);
                            setIsSignUp(false);
                            window.location.hash = "login";
                            setErrorMsg(verifyOverlayMsg);
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl font-sans text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>QUAY LẠI ĐĂNG NHẬP</span>
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>



      </div>

    </div>
  );
}
