import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle, CheckCircle2, XCircle, AlertCircle, Shield, Cpu, RefreshCw, Check, Loader2, Settings, Key, Terminal, Server, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest, isProxyEnabled } from "../lib/api";
import { extractBackendMessage, sanitizeErrorMessage } from "../lib/responseExtractor";
import { ApiResponse } from "../types/api";
import {
  loginUser,
  registerUser,
  recoverAccount as apiRecoverAccount,
  changePassword as apiChangePassword,
  changeUsername as apiChangeUsername,
  validateResetToken as apiValidateResetToken
} from "../services/authService";
import { UserLoginRequest, UserRegisterRequest } from "../types/auth";

interface RegisterPageProps {
  onNavigate: (page: "landing" | "product" | "auth" | "terms") => void;
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const [recoveryMode, setRecoveryMode] = useState<"NONE" | "SEND_LINK" | "MANUAL_TOKEN" | "RESET_PASSWORD">("NONE");
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
      } else if (hash === "#verify") {
        const params = new URLSearchParams(window.location.search);
        const hasToken = ["token", "code", "verify-email", "verify"].some((p) => params.has(p));
        if (!lastRegEmail && !hasToken) {
          window.location.hash = "login";
          setIsSignUp(false);
          setIsVerifyingMode(false);
        } else {
          setIsSignUp(false);
          setIsVerifyingMode(true);
        }
      } else {
        setIsSignUp(false);
        setIsVerifyingMode(false);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    // Align state on mount
    handleHashChange();
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [lastRegEmail]);
  const [verificationTokenInput, setVerificationTokenInput] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const stored = localStorage.getItem("horizon_api_base_url");
    if (!stored) {
      localStorage.setItem("horizon_api_base_url", "http://localhost:8080");
      return "http://localhost:8080";
    }
    return stored;
  });
  const [verifyApiPath, setVerifyApiPath] = useState(() => localStorage.getItem("horizon_verify_api_path") ?? "/api/auth/verify-email");
  const [verifyMethod, setVerifyMethod] = useState<"GET" | "POST">("GET");
  const [isVerifyingRequest, setIsVerifyingRequest] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [verificationResultState, setVerificationResultState] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Countdown timer for email verification (5 minutes)
  const [timeLeft, setTimeLeft] = useState<number>(300);

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
      setTimeLeft(300);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isVerifyingMode]);

  // Get dynamic Client device details for deviceInfo
  const getClientDeviceInfo = () => {
    let deviceId = localStorage.getItem("horizon_device_id");
    if (!deviceId) {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
      localStorage.setItem("horizon_device_id", deviceId);
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
      const stored = localStorage.getItem("horizon_auth_audit_logs");
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
      localStorage.setItem("horizon_auth_audit_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Lỗi ghi nhật ký chẩn đoán:", e);
    }
  };

  // Save API Base URL and Path to localStorage on change
  useEffect(() => {
    localStorage.setItem("horizon_api_base_url", apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    localStorage.setItem("horizon_verify_api_path", verifyApiPath);
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
          localStorage.setItem("horizon_recovery_user_roles", JSON.stringify(response.data.roles));
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

  const executeOverlayVerification = async (tokenClean: string) => {
    try {
      await new Promise((r) => setTimeout(r, 600));

      const response = await fetch(`http://localhost:8080/api/auth/verify-email?token=${encodeURIComponent(tokenClean)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(text);
      } catch {
        resData = {};
      }

      const backendMsg = extractBackendMessage(resData);

      if (response.ok) {
        setVerifyOverlayStatus("success");
        setVerifyOverlayMsg(backendMsg.message ?? "Tài khoản của bạn đã được xác thực thành công.");
        setVerifyOverlayTimeLeft(2);

        let returnedEmail = "";
        if (resData.data !== undefined && resData.data !== null && typeof resData.data.email === "string") {
          returnedEmail = resData.data.email;
        }
        if (returnedEmail.length > 0) {
          setEmail(returnedEmail);
        }

        setSuccessMsg(backendMsg.message ?? "Kích hoạt tài khoản thành công! Vui lòng đăng nhập.");

        const interval = setInterval(() => {
          setVerifyOverlayTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setShowVerifyOverlay(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setVerifyOverlayStatus("error");
        setVerifyOverlayMsg(backendMsg.message ?? "Mã xác thực không hợp lệ hoặc đã hết hạn.");
        setVerifyOverlayTimeLeft(4);

        const interval = setInterval(() => {
          setVerifyOverlayTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setShowVerifyOverlay(false);
              setIsSignUp(true);
              window.location.hash = "register";
              setErrorMsg(backendMsg.message ?? "Mã xác thực không hợp lệ hoặc đã hết hạn.");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setVerifyOverlayStatus("error");
      setVerifyOverlayMsg("Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra lại trạng thái server.");
      setVerifyOverlayTimeLeft(4);

      const interval = setInterval(() => {
        setVerifyOverlayTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowVerifyOverlay(false);
            setIsSignUp(true);
            window.location.hash = "register";
            setErrorMsg("Kích hoạt email thất bại do lỗi kết nối tới server.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // On mount, parse token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let tokenParam = params.get("token");
    if (!tokenParam) tokenParam = params.get("code");
    if (!tokenParam) tokenParam = params.get("verify-email");
    if (!tokenParam) tokenParam = params.get("verify");

    if (tokenParam) {
      let isRecovery = false;
      if (params.has("token")) isRecovery = true;
      if (params.has("code")) isRecovery = true;
      if (tokenParam.startsWith("recovery-")) isRecovery = true;

      if (isRecovery) {
        // Account recovery flow
        window.history.replaceState({}, document.title, window.location.pathname);
        setRecoveryToken(tokenParam);
        setRecoveryMode("RESET_PASSWORD");
        setIsPasswordResetExpanded(true);
        validateRecoveryToken(tokenParam);
      } else {
        // Email verification flow - trigger overlay directly on top of login form
        window.history.replaceState({}, document.title, "/auth#login");
        setVerificationTokenInput(tokenParam);
        setShowVerifyOverlay(true);
        setVerifyOverlayStatus("loading");
        setVerifyOverlayMsg("Đang tiến hành xác minh tài khoản với server...");
        executeOverlayVerification(tokenParam);
      }
    }
  }, []);

  // --- ACCOUNT RECOVERY HANDLERS ---
  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail || !recoveryEmail.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ email.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await apiRecoverAccount(recoveryEmail.trim());
      const extracted = extractBackendMessage(response);
      setSuccessMsg(extracted.message);
      setCooldownTime(60);
    } catch (err: any) {
      console.error("Account recovery request failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryNewPassword) {
      setErrorMsg("Mật khẩu mới không được để trống.");
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await apiChangePassword({
        token: recoveryToken,
        newPassword: recoveryNewPassword,
        confirmPassword: recoveryConfirmPassword,
      });

      const extracted = extractBackendMessage(response);
      setSuccessMsg(extracted.message);
      addAuditLog("VERIFY", { token: recoveryToken }, "SUCCESS", extracted.message, apiBaseUrl, getClientDeviceInfo());

      setRecoveryNewPassword("");
      setRecoveryConfirmPassword("");
    } catch (err: any) {
      console.error("Password reset failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason);
      addAuditLog("VERIFY", { token: recoveryToken }, "FAILED", `Đổi mật khẩu thất bại: ${cleanReason}`, apiBaseUrl, getClientDeviceInfo());
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryNewUsername || !recoveryNewUsername.trim()) {
      setErrorMsg("Tên đăng nhập mới không được để trống.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await apiChangeUsername({
        token: recoveryToken,
        newUsername: recoveryNewUsername.trim(),
      });

      const extracted = extractBackendMessage(response);
      setSuccessMsg(extracted.message);
      addAuditLog("VERIFY", { token: recoveryToken, newUsername: recoveryNewUsername.trim() }, "SUCCESS", extracted.message, apiBaseUrl, getClientDeviceInfo());

      if (recoveryUser) {
        setRecoveryUser({
          ...recoveryUser,
          username: recoveryNewUsername.trim(),
          fullName: recoveryNewUsername.trim()
        });
      }

      setRecoveryNewUsername("");
      setIsUsernameChangeExpanded(false);
    } catch (err: any) {
      console.error("Username change failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason);
      addAuditLog("VERIFY", { token: recoveryToken, newUsername: recoveryNewUsername.trim() }, "FAILED", `Đổi tên đăng nhập thất bại: ${cleanReason}`, apiBaseUrl, getClientDeviceInfo());
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
        const storedEmail = localStorage.getItem("horizon_last_registration_email");
        if (storedEmail !== null) savedEmail = storedEmail;
      }
    }

    const savedUsername = localStorage.getItem("horizon_last_registration_username");
    const savedPassword = localStorage.getItem("horizon_last_registration_password");

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

              const realUserObj = {
                id: userData.id ?? 1,
                fullName: userData.fullName ?? finalUsername,
                username: finalUsername,
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

              localStorage.setItem("horizon_redis_profile", JSON.stringify(redisProfile));
              localStorage.setItem("horizon_redis_refresh_tokens", JSON.stringify(redisRefreshTokens));
              localStorage.setItem("horizon_current_user", JSON.stringify(realUserObj));
            }

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
      `[INFO] Phương thức: GỌI TRỰC TIẾP API BACKEND`
    ]);

    await new Promise(resolve => setTimeout(resolve, 500));
    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Đang kết nối tới ${apiBaseUrl}...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 500));
    let cleanPath = verifyApiPath;
    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

    let tokenClean = tokenToUse;
    if (tokenToUse.includes("token=")) {
      const parts = tokenToUse.split("token=");
      if (parts[1]) tokenClean = parts[1].split("&")[0];
    }

    const fullUrl = `${apiBaseUrl.replace(/\/$/, "")}${cleanPath}?token=${tokenClean}`;

    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Gửi yêu cầu HTTP ${verifyMethod}: ${fullUrl}`,
      `[INFO] Đang chờ phản hồi từ Spring Boot Server...`
    ]);

    try {
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };

      const response = await fetch(fullUrl, {
        method: verifyMethod,
        headers
      });

      setVerificationLogs(prev => [
        ...prev,
        `[INFO] Nhận phản hồi HTTP Status: ${response.status} ${response.statusText}`
      ]);

      if (response.ok) {
        const responseText = await response.text();
        const isHtml = responseText.trim().startsWith("<") || responseText.toLowerCase().includes("<html");

        if (isHtml) {
          setVerificationLogs(prev => [
            ...prev,
            `[ERROR] Nhận phản hồi HTML thay vì JSON từ Server.`
          ]);
          throw new Error("Phản hồi không hợp lệ: Server trả về trang HTML thay vì dữ liệu JSON.");
        }

        let resData: ApiResponse = {};
        try {
          resData = JSON.parse(responseText);
        } catch {
          resData = {};
        }

        const extractedMsg = extractBackendMessage(resData);

        setVerificationLogs(prev => [
          ...prev,
          `[OK] Spring Boot phản hồi: SUCCESS`,
          `[OK] Đã kích hoạt tài khoản trên CSDL thực tế!`,
          `[OK] ${extractedMsg.message}`
        ]);
        setVerificationResultState("SUCCESS");

        let returnedEmail = "";
        if (resData.data !== undefined && resData.data !== null && typeof resData.data.email === "string") {
          returnedEmail = resData.data.email;
        }

        if (returnedEmail.length > 0) {
          setEmail(returnedEmail);
        }
        setSuccessMsg(extractedMsg.message);
        setIsSignUp(false);

        addAuditLog("VERIFY", { token: tokenClean }, "SUCCESS", extractedMsg.message, apiBaseUrl, getClientDeviceInfo());
        handleVerificationSuccess(returnedEmail);
      } else {
        const errBody = await response.text().catch(() => "");
        let parsedErr = "";
        try {
          const jsonErr = JSON.parse(errBody);
          const extractedErr = extractBackendMessage(jsonErr);
          parsedErr = extractedErr.message;
        } catch {
          parsedErr = errBody;
        }

        setVerificationLogs(prev => [
          ...prev,
          `[ERROR] Server trả về lỗi: Code ${response.status}`,
          parsedErr.length > 0 ? `[ERROR] Chi tiết: ${parsedErr}` : `[ERROR] Token không hợp lệ hoặc đã hết hạn.`
        ]);
        setVerificationResultState("FAILED");

        addAuditLog("VERIFY", { token: tokenClean }, "FAILED", `Kích hoạt email thất bại: Server trả về lỗi Code ${response.status} - ${parsedErr}`, apiBaseUrl, getClientDeviceInfo());
      }
    } catch (err: any) {
      console.error("Real API Verification Failed:", err);
      const errDetail = typeof err.message === "string" ? err.message : "Network error";
      setVerificationLogs(prev => [
        ...prev,
        `[ERROR] Không thể kết nối tới Server Spring Boot tại địa chỉ: ${apiBaseUrl}`,
        `[ERROR] Chi tiết lỗi: ${errDetail}`,
        `[INFO] Mẹo: Hãy chắc chắn rằng Server Spring Boot của bạn đang chạy tại ${apiBaseUrl} và đã cấu hình cho phép CORS cho origin của trang web này.`
      ]);
      setVerificationResultState("FAILED");

      addAuditLog("VERIFY", { token: tokenClean }, "FAILED", "Kích hoạt email thất bại do lỗi kết nối: " + errDetail, apiBaseUrl, getClientDeviceInfo());
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
      const stored = localStorage.getItem("horizon_last_registration_email");
      if (stored !== null) targetEmail = stored;
    }

    if (targetEmail.length === 0 || targetEmail.trim().length === 0) {
      setErrorMsg("Không tìm thấy email đăng ký ban đầu để gửi lại mã.");
      return;
    }

    setLoading(true);
    const devInfo = getClientDeviceInfo();
    let regName = username.trim();
    if (regName.length === 0) regName = targetEmail.split("@")[0];
    let regFullName = fullName.trim();
    if (regFullName.length === 0) regFullName = regName;

    const payload: UserRegisterRequest = {
      name: regName,
      fullName: regFullName,
      email: targetEmail.trim().toLowerCase(),
      password,
      confirmPassword: password
    };

    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Yêu cầu gửi lại mã xác thực cho email: ${payload.email}...`
    ]);

    try {
      const res = await registerUser(payload);
      const extractedMsg = extractBackendMessage(res);
      setSuccessMsg(extractedMsg.message);

      let token = "";
      if (res.data !== undefined && res.data !== null) {
        if (typeof res.data.token === "string") token = res.data.token;
        else if (typeof res.data.accessToken === "string") token = res.data.accessToken;
      }

      if (token.length > 0) {
        localStorage.setItem("horizon_last_registration_token", token);
        setLastRegToken(token);
      }
      localStorage.setItem("horizon_last_registration_email", payload.email);
      localStorage.setItem("horizon_last_registration_message", extractedMsg.message);

      setLastRegEmail(payload.email);
      setTimeLeft(300);

      setVerificationLogs(prev => [
        ...prev,
        `[OK] Đã phát hành yêu cầu xác thực mới!`,
        `[OK] ${extractedMsg.message}`
      ]);
      addAuditLog("REGISTER", payload, "SUCCESS", `[GỬI LẠI MÃ] ${extractedMsg.message}`, apiBaseUrl, devInfo);
    } catch (err: any) {
      console.warn("Real Backend Resend Failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason);
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
        if (termsError) setErrorMsg(termsError);
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
    await new Promise(resolve => setTimeout(resolve, 1200));

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

          let token = "";
          if (res.data !== undefined && res.data !== null) {
            if (typeof res.data.token === "string") token = res.data.token;
            else if (typeof res.data.accessToken === "string") token = res.data.accessToken;
          }
          if (token.length > 0) {
            localStorage.setItem("horizon_last_registration_token", token);
            setLastRegToken(token);
          }
          localStorage.setItem("horizon_last_registration_email", payload.email);
          localStorage.setItem("horizon_last_registration_message", extractedMsg.message);
          localStorage.setItem("horizon_last_registration_username", username.trim());
          localStorage.setItem("horizon_last_registration_password", password);

          setLastRegEmail(payload.email);
          setLoading(false);
          window.location.hash = "verify";
          setIsSignUp(false);
          setIsVerifyingMode(true);

          setVerificationTokenInput("");
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

            const realUserObj = {
              id: userData.id ?? 1,
              fullName: userData.fullName ?? finalUsername,
              username: finalUsername,
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

            localStorage.setItem("horizon_redis_profile", JSON.stringify(redisProfile));
            localStorage.setItem("horizon_redis_refresh_tokens", JSON.stringify(redisRefreshTokens));
            localStorage.setItem("horizon_current_user", JSON.stringify(realUserObj));
          }

          setLoading(false);
          addAuditLog("LOGIN", payload, "SUCCESS", extractedMsg.message, apiBaseUrl, devInfo);
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
            localStorage.setItem("horizon_last_registration_token", errorResponse.data.token);
            setLastRegToken(errorResponse.data.token);
          }
          localStorage.setItem("horizon_last_registration_email", unverifiedEmail);
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
        }
        setLoading(false);

        const payloadInfo = isSignUp
          ? { name: username.trim(), fullName: fullName.trim(), email: email.trim().toLowerCase(), password, confirmPassword }
          : { usernameOrEmail: email, password, deviceInfo: devInfo };
        addAuditLog(isSignUp ? "REGISTER" : "LOGIN", payloadInfo, "FAILED", cleanReason, apiBaseUrl, devInfo);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
    }
  };

  const handleSocialLogin = (platform: "Google" | "GitHub") => {
    alert(`Đang khởi tạo liên kết bảo mật với tài khoản ${platform}...`);
  };

  return (
    <div className="w-full min-h-screen bg-[#E4E4E4] text-[#111111] flex flex-col items-center justify-center relative py-20 px-4 md:px-10 overflow-hidden select-none">

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

      <div className="max-w-[540px] w-full z-10" style={{ zoom: 1.2 }}>

        {/* Auth Glassmorphism Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 p-10 md:p-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.07)] overflow-hidden transition-all duration-300"
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
            {recoveryMode === "SEND_LINK" ? (
              <motion.div
                key="account-recovery-send-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4D24]/20 to-indigo-500/20 flex items-center justify-center border border-[#FF4D24]/10 shadow-inner">
                      <Key className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#111111] tracking-tight font-sans">
                        Khôi phục tài khoản
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                        ACCOUNT RECOVERY PORTAL
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Nhập địa chỉ email đăng ký của bạn. Hệ thống sẽ kiểm tra và gửi liên kết khôi phục tài khoản (Magic Link) có thời hạn 10 phút.
                  </p>
                </div>

                {/* Success / Error Messages */}
                <AnimatePresence mode="wait">
                  {errorMsg && Object.keys(fieldErrors).length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendRecoveryEmail} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="recovery-email-input">
                      Địa chỉ Email đăng ký
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="recovery-email-input"
                        type="email"
                        placeholder="your-email@example.com"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || cooldownTime > 0}
                    className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : cooldownTime > 0 ? (
                      <span>Gửi lại sau ({cooldownTime}s)</span>
                    ) : (
                      <>
                        <span>Gửi liên kết khôi phục</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode("MANUAL_TOKEN");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto font-sans"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Đã có mã khôi phục? Nhập thủ công</span>
                    </button>
                  </div>

                  <div className="text-center pt-2 border-t border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      <span>Quay lại trang Đăng nhập</span>
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
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4D24]/20 to-indigo-500/20 flex items-center justify-center border border-[#FF4D24]/10 shadow-inner">
                      <Key className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#111111] tracking-tight font-sans">
                        Nhập mã khôi phục
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                        MANUAL TOKEN ENTRY
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Vui lòng nhập hoặc dán mã Token khôi phục đã được gửi đến email của bạn để thiết lập mật khẩu mới.
                  </p>
                </div>

                {/* Success / Error Messages */}
                <AnimatePresence mode="wait">
                  {errorMsg && Object.keys(fieldErrors).length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!manualTokenInput.trim()) {
                      setErrorMsg("Vui lòng nhập mã khôi phục.");
                      return;
                    }
                    setRecoveryToken(manualTokenInput.trim());
                    setRecoveryMode("RESET_PASSWORD");
                    setIsPasswordResetExpanded(true);
                    validateRecoveryToken(manualTokenInput.trim());
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="manual-token-input">
                      Mã Token khôi phục
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="manual-token-input"
                        type="text"
                        placeholder="Nhập mã token khôi phục (ví dụ: b8a7dcf3-...)"
                        required
                        value={manualTokenInput}
                        onChange={(e) => setManualTokenInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                      />
                    </div>
                  </div>

                  {cooldownTime > 0 && (
                    <div className="text-center text-[10px] font-mono font-bold text-slate-400 bg-slate-50 py-2 rounded-xl border border-slate-200/50">
                      THỜI GIAN GỬI LẠI EMAIL: <span className="text-[#FF4D24] font-black">{cooldownTime}s</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    <span>Tiến hành xác thực</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2 border-t border-slate-200/50 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode("SEND_LINK");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      <span>Quay lại gửi liên kết khôi phục</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode("NONE");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
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
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4D24]/20 to-indigo-500/20 flex items-center justify-center border border-[#FF4D24]/10 shadow-inner">
                      <Lock className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#111111] tracking-tight font-sans">
                        Thông tin tài khoản
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                        ACCOUNT SECURITY PORTAL
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Xác minh thông tin tài khoản và thiết lập cấu hình bảo mật ERP.
                  </p>
                </div>

                {isValidatingToken ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Loader2 className="w-8 h-8 text-[#FF4D24] animate-spin" />
                    <p className="text-xs text-slate-500 font-bold font-mono tracking-wider uppercase animate-pulse">
                      Đang xác thực liên kết khôi phục...
                    </p>
                  </div>
                ) : tokenValidationError ? (
                  <div className="space-y-4 py-4 text-center">
                    <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed px-2">
                      {tokenValidationError}
                    </p>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode("MANUAL_TOKEN");
                          setTokenValidationError("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Nhập lại mã Token
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode("SEND_LINK");
                          setTokenValidationError("");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Yêu cầu lại liên kết mới
                      </button>
                    </div>
                  </div>
                ) : recoveryUser ? (
                  <div className="space-y-5">
                    {/* User Info Portal Card */}
                    <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-inner">
                      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
                        {recoveryUser.avatarUrl ? (
                          <img
                            src={recoveryUser.avatarUrl}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold font-mono text-sm border border-slate-300">
                            {recoveryUser.fullName ? recoveryUser.fullName.charAt(0) : (recoveryUser.username ? recoveryUser.username.charAt(0) : "U")}
                          </div>
                        )}
                        <div className="text-left">
                          <h3 className="text-xs font-black text-slate-900 font-sans leading-tight">
                            {recoveryUser.fullName || "Người dùng hệ thống"}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider">
                            Email: {recoveryUser.email || "Chưa thiết lập"}
                          </span>
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Đã xác thực
                          </span>
                        </div>
                      </div>

                      {/* Detailed Contact List */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Địa chỉ Email</span>
                          <span className="font-semibold text-slate-700 truncate block">{recoveryUser.email || "Chưa thiết lập"}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Số điện thoại</span>
                          <span className="font-semibold text-slate-700 block">{recoveryUser.numberPhone || "Chưa thiết lập"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Success / Error Messages inside Form */}
                    <AnimatePresence mode="wait">
                      {errorMsg && Object.keys(fieldErrors).length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMsg}</span>
                        </motion.div>
                      )}

                      {successMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2"
                        >
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{successMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Available Actions */}
                    <div className="space-y-4">
                      {/* Action 1: Change username (Expandable style) */}
                      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all duration-300 hover:border-slate-300">
                        {/* Header Trigger */}
                        <button
                          type="button"
                          onClick={() => setIsUsernameChangeExpanded(!isUsernameChangeExpanded)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 font-sans">Đổi tên đăng nhập (Username)</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Cập nhật tên định danh ERP của bạn</p>
                            </div>
                          </div>
                          <div className="text-slate-400">
                            {isUsernameChangeExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Form Body */}
                        <AnimatePresence initial={false}>
                          {isUsernameChangeExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <form
                                onSubmit={handleChangeUsername}
                                className="px-4 pb-5 pt-1 flex flex-col gap-4 border-t border-slate-100"
                              >
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="new-username-input">
                                    Tên đăng nhập mới (New Username)
                                  </label>
                                  <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      id="new-username-input"
                                      type="text"
                                      placeholder="Nhập tên đăng nhập mới (ví dụ: ann_new)"
                                      required
                                      value={recoveryNewUsername}
                                      onChange={(e) => setRecoveryNewUsername(e.target.value)}
                                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                                >
                                  {loading ? (
                                    <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                  ) : (
                                    <>
                                      <span>Xác nhận đổi tên đăng nhập</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action 2: Reset Password Form (Expandable Account Center style) */}
                      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all duration-300 hover:border-slate-300">
                        {/* Header Trigger */}
                        <button
                          type="button"
                          onClick={() => setIsPasswordResetExpanded(!isPasswordResetExpanded)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#FF4D24]/10 flex items-center justify-center border border-[#FF4D24]/20 shadow-inner">
                              <Lock className="w-4 h-4 text-[#FF4D24]" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 font-sans">Mật khẩu và bảo mật</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Cập nhật mật khẩu bảo mật đăng nhập</p>
                            </div>
                          </div>
                          <div className="text-slate-400">
                            {isPasswordResetExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Form Body */}
                        <AnimatePresence initial={false}>
                          {isPasswordResetExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <form
                                onSubmit={handleResetPassword}
                                className="px-4 pb-5 pt-1 flex flex-col gap-4 border-t border-slate-100"
                              >
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="new-password">
                                    Mật khẩu mới
                                  </label>
                                  <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      id="new-password"
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Tối thiểu 6 ký tự"
                                      required
                                      value={recoveryNewPassword}
                                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="confirm-new-password">
                                    Xác nhận mật khẩu mới
                                  </label>
                                  <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      id="confirm-new-password"
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Nhập lại mật khẩu mới"
                                      required
                                      value={recoveryConfirmPassword}
                                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full bg-[#FF4D24] hover:bg-[#E03D16] disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                                >
                                  {loading ? (
                                    <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                  ) : (
                                    <>
                                      <span>Xác nhận đổi mật khẩu</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="text-center pt-2 border-t border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode("NONE");
                          setRecoveryToken("");
                          setRecoveryUser(null);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        <span>Quay lại trang Đăng nhập</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4 text-center">
                    <p className="text-xs text-slate-500 font-medium">Không tìm thấy thông tin tài khoản khôi phục.</p>
                    <button
                      type="button"
                      onClick={() => setRecoveryMode("SEND_LINK")}
                      className="text-xs font-bold text-indigo-600 hover:text-[#FF4D24]"
                    >
                      Quay lại gửi liên kết
                    </button>
                  </div>
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
                className="space-y-6"
              >
                {/* Tab Switcher: Sign In vs Sign Up */}
                <div className="flex items-center p-1 bg-slate-200/60 rounded-xl mb-6 relative">
                  <div
                    className="absolute rounded-lg bg-white shadow-sm pointer-events-none"
                    style={{
                      top: 4, bottom: 4,
                      left: isSignUp ? "50%" : 4,
                      right: isSignUp ? 4 : "50%",
                      transition: "left 0.25s ease, right 0.25s ease",
                    }}
                  />
                  <button
                    onClick={() => {
                      window.location.hash = "login";
                      setIsSignUp(false);

                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className={`flex-1 py-2 text-xs font-black rounded-lg relative z-10 cursor-pointer transition-colors duration-250 ${
                      !isSignUp ? "text-slate-950" : "text-slate-500"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = "register";
                      setIsSignUp(true);

                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className={`flex-1 py-2 text-xs font-black rounded-lg relative z-10 cursor-pointer transition-colors duration-250 ${
                      isSignUp ? "text-slate-950" : "text-slate-500"
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>

                <div className="min-h-[60px]">
                  <h2 className="text-xl font-black text-[#111111] tracking-tight font-sans transition-opacity duration-300">
                    {isSignUp ? "Tạo tài khoản mới" : "Chào mừng quay trở lại"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 mb-3 transition-opacity duration-300">
                    {isSignUp
                      ? "Khởi tạo tài khoản Horizon Mobile để nhận ngay ngàn ưu đãi mua sắm điện thoại chính hãng."
                      : "Đăng nhập tài khoản Horizon Mobile để quản lý giỏ hàng, đơn hàng và lịch sử mua sắm."
                    }
                  </p>
                </div>

                {/* Success / Error Messages */}
                {errorMsg && Object.keys(fieldErrors).length === 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Primary Form */}
                <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-4">

                  {/* === ĐĂNG KÝ === */}
                  <div style={{ display: isSignUp ? "flex" : "none" }} className="flex-col gap-4">
                    {/* Tên đăng nhập */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-username">
                        Tên đăng nhập
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="su-username"
                          type="text"
                          placeholder="Nhập tên đăng nhập"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (fieldErrors["username"] || fieldErrors["name"]) {
                              setFieldErrors(prev => ({ ...prev, username: "", name: "" }));
                            }
                          }}
                          className={`w-full bg-white border ${fieldErrors["username"] || fieldErrors["name"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                      </div>
                      {(fieldErrors["username"] || fieldErrors["name"]) && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["username"] || fieldErrors["name"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Ho va ten */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-fullname">
                        Họ và Tên đầy đủ
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="su-fullname"
                          type="text"
                          placeholder="Họ và tên đầy đủ"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (fieldErrors["fullName"]) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                          }}
                          className={`w-full bg-white border ${fieldErrors["fullName"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                      </div>
                      {fieldErrors["fullName"] && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["fullName"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-email">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="su-email"
                          type="email"
                          placeholder="Địa chỉ email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors["email"]) setFieldErrors(prev => ({ ...prev, email: "" }));
                          }}
                          className={`w-full bg-white border ${fieldErrors["email"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                      </div>
                      {fieldErrors["email"] && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["email"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Mat khau */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-password">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="su-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors["password"]) setFieldErrors(prev => ({ ...prev, password: "" }));
                          }}
                          className={`w-full bg-white border ${fieldErrors["password"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors["password"] && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["password"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="su-confirm">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="su-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors["confirmPassword"]) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                          }}
                          className={`w-full bg-white border ${fieldErrors["confirmPassword"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                      </div>
                      {fieldErrors["confirmPassword"] && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["confirmPassword"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-center gap-2.5 mt-1 text-left">
                      <input id="su-terms" type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="w-4 h-4 accent-[#FF4D24] border-slate-300 rounded cursor-pointer shrink-0" />
                      <label htmlFor="su-terms" className="text-[10.5px] text-slate-500 leading-normal font-sans">
                        Tôi đồng ý với{" "}
                        <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate("terms"); }} className="text-[#FF4D24] font-bold hover:underline">Điều khoản Dịch vụ</a>
                        {" "}và{" "}
                        <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate("terms"); }} className="text-[#FF4D24] font-bold hover:underline">Chính sách Bảo mật</a>
                        {" "}của Horizon Mobile.
                      </label>
                    </div>
                  </div>

                  {/* === DANG NHAP === */}
                  <div style={{ display: isSignUp ? "none" : "flex" }} className="flex-col gap-4">
                    {/* Email hoac Username */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono text-left" htmlFor="li-email">
                        Tên đăng nhập hoặc Email
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="li-email"
                          type="text"
                          placeholder="Email hoặc tên đăng nhập"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors["email"] || fieldErrors["usernameOrEmail"]) {
                              setFieldErrors(prev => ({ ...prev, email: "", usernameOrEmail: "" }));
                            }
                          }}
                          className={`w-full bg-white border ${fieldErrors["email"] || fieldErrors["usernameOrEmail"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                      </div>
                      {(fieldErrors["email"] || fieldErrors["usernameOrEmail"]) && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["email"] || fieldErrors["usernameOrEmail"]}</span>
                        </p>
                      )}
                    </div>

                    {/* Mat khau */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="li-password">
                          Mật khẩu
                        </label>
                        <button type="button" onClick={() => { setRecoveryMode("SEND_LINK"); setErrorMsg(""); setSuccessMsg(""); if (email && email.includes("@")) setRecoveryEmail(email); }} className="text-[10px] font-bold text-[#FF4D24] hover:underline cursor-pointer">
                          Quên thông tin tài khoản?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="li-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors["password"]) setFieldErrors(prev => ({ ...prev, password: "" }));
                          }}
                          className={`w-full bg-white border ${fieldErrors["password"] ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] focus:ring-[#FF4D24]/10"} text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 text-[#111111]`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors["password"] && (
                        <p className="text-[10px] text-red-500 font-medium font-sans mt-1 text-left flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline shrink-0" /><span>{fieldErrors["password"]}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`relative w-full border ${loading ? "bg-[#FF4D24]/10 border-[#FF4D24]/30 text-[#FF4D24]" : "bg-slate-900 hover:bg-slate-800 border-transparent text-white"} py-3.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden`}
                  >
                    <span className="flex items-center justify-center gap-2 transition-opacity duration-200" style={{ opacity: loading ? 0 : 1 }}>
                      <span>{isSignUp ? "Tạo tài khoản" : "Đăng nhập"}</span>
                      <ArrowRight className="w-4 h-4 text-[#FF4D24]" />
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center gap-2.5 text-[#FF4D24] transition-opacity duration-200" style={{ opacity: loading ? 1 : 0 }}>
                      <Loader2 className="w-4 h-4 text-[#FF4D24] animate-spin" />
                      <span>{isSignUp ? "Đang khởi tạo tài khoản..." : "Đang đăng nhập..."}</span>
                    </span>
                  </button>
                </form>


                {/* Social login divider */}
                <div className="relative my-6 select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider font-mono">
                    <span className="bg-[#E4E4E4]/90 px-3 text-slate-400 backdrop-blur-sm rounded-full">hoặc đăng nhập bằng</span>
                  </div>
                </div>

                {/* Social login buttons */}
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={() => handleSocialLogin("Google")}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
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
                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
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
                        Quay lại đăng ký sau {verifyOverlayTimeLeft} giây...
                      </div>
                      <button
                        onClick={() => {
                          setShowVerifyOverlay(false);
                          setIsSignUp(true);
                          window.location.hash = "register";
                          setErrorMsg(verifyOverlayMsg);
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl font-sans text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>QUAY LẠI ĐĂNG KÝ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>



      </div>

    </div>
  );
}
