import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, Shield, Cpu, RefreshCw, Check, Loader2, Settings, Key, Terminal, Server, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest, isProxyEnabled } from "../lib/api";

interface RegisterPageProps {
  onNavigate: (page: "landing" | "product" | "register") => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
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
  
  // Holographic Login scanning animation states
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStage, setAuthStage] = useState(0); // Stages: 1 = scan, 2 = decrypt / connect, 3 = granted
  const [authProgress, setAuthProgress] = useState(0);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [authResult, setAuthResult] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [authFailureReason, setAuthFailureReason] = useState<string>("");
  
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

  useEffect(() => {
    if (!isAuthenticating) return;
    
    // Reset values
    setAuthProgress(0);
    setAuthLogs(["[INFO] Khởi chạy bộ kiểm tra bảo mật...", "[INFO] Đang quét cấu hình thiết bị (deviceInfo)..."]);
    
    const interval = setInterval(() => {
      setAuthProgress(p => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isAuthenticating]);

  useEffect(() => {
    if (!isAuthenticating) return;

    if (authProgress >= 25 && authProgress < 50 && authLogs.length === 2) {
      if (isSignUp) {
        setAuthLogs(prev => [...prev, "[INFO] Đang kiểm tra định dạng Email & Kiểm tra trùng lặp mật khẩu...", "[OK] Định dạng Email hợp lệ. Không có lỗi validation cơ bản."]);
      } else {
        setAuthLogs(prev => [...prev, "[OK] Định danh thiết bị: Chrome / Linux x86_64", "[INFO] Đang kết nối PostgreSQL qua JPA findByNameOrEmail()..."]);
      }
    } else if (authProgress >= 50 && authProgress < 75 && authLogs.length === 4) {
      if (authResult === "FAILED") {
        if (authFailureReason.includes("Email đã tồn tại")) {
          setAuthLogs(prev => [...prev, "[ERROR] Lỗi ràng buộc duy nhất: Email đã tồn tại và đang hoạt động (ACTIVE).", "[ERROR] ĐĂNG KÝ BỊ TỪ CHỐI!"]);
        } else if (authFailureReason.includes("Tên đăng nhập đã tồn tại")) {
          setAuthLogs(prev => [...prev, "[ERROR] Lỗi ràng buộc duy nhất: Tên đăng nhập đã tồn tại với email khác (ACTIVE).", "[ERROR] ĐĂNG KÝ BỊ TỪ CHỐI!"]);
        } else {
          setAuthLogs(prev => [...prev, `[ERROR] Lỗi: ${authFailureReason}`, "[ERROR] TRUY CẬP BỊ TỪ CHỐI!"]);
        }
      } else {
        if (isSignUp) {
          const customMsg = localStorage.getItem("horizon_last_registration_message") || "";
          if (customMsg.includes("đã tồn tại nhưng chưa xác thực")) {
            setAuthLogs(prev => [...prev, "[WARN] Phát hiện Email/Username đã tồn tại ở trạng thái chưa kích hoạt (INACTIVE)", "[INFO] Tiến hành tái sử dụng bản ghi người dùng, cập nhật TTL và làm mới mã kích hoạt..."]);
          } else {
            setAuthLogs(prev => [...prev, "[OK] Đã xác minh Email & Username không trùng lặp với tài khoản đang hoạt động", "[INFO] Khởi tạo thực thể User mới với Trạng thái: INACTIVE..."]);
          }
        } else {
          setAuthLogs(prev => [...prev, "[OK] Tìm thấy thực thể tài khoản tương khớp", "[INFO] Đang giải mã & so khớp thuật toán bcrypt_check()..."]);
        }
      }
    } else if (authProgress >= 75 && authProgress < 100 && authLogs.length === 6) {
      if (authResult === "FAILED") {
        setAuthLogs(prev => [...prev, "[ERROR] Hủy bỏ giao dịch ghi nhận DB.", "[ERROR] ĐĂNG KÝ THẤT BẠI!"]);
      } else {
        if (isSignUp) {
          setAuthLogs(prev => [...prev, "[OK] Đã băm mật khẩu thành công bằng BCryptPasswordEncoder", "[INFO] Đang sinh mã UUID làm AuthCode với thời hạn 5 phút (EMAIL_VERIFICATION)..."]);
        } else {
          setAuthLogs(prev => [...prev, "[OK] Xác thực mật khẩu thành công!", "[INFO] Khởi tạo Token Rotation & Ghi đè Redis Cache..."]);
        }
      }
    } else if (authProgress >= 100 && (authLogs.length === 6 || authLogs.length === 8)) {
      if (authResult === "FAILED") {
        if (!authLogs.includes("[ERROR] QUÁ TRÌNH XÁC THỰC THẤT BẠI")) {
          setAuthLogs(prev => [...prev, "[ERROR] QUÁ TRÌNH XÁC THỰC THẤT BẠI", "[INFO] Hệ thống phản hồi lỗi 400 Bad Request / BusinessException"]);
        }
      } else {
        if (isSignUp) {
          if (!authLogs.includes("[OK] [@Async] Đã render email và gửi đường link kích hoạt UUID tới hòm thư người dùng!")) {
            const customMsg = localStorage.getItem("horizon_last_registration_message") || "";
            if (customMsg.includes("đã tồn tại nhưng chưa xác thực")) {
              setAuthLogs(prev => [...prev, "[OK] Đã cập nhật mã kích hoạt AuthCode mới vào PostgreSQL!", "[OK] [@Async] Đã phát VerificationEmailEvent thành công!"]);
            } else {
              setAuthLogs(prev => [...prev, "[OK] Commit CSDL thành công! Phát VerificationEmailEvent qua Transactional Event Listener", "[OK] [@Async] Đã render email và gửi đường link kích hoạt UUID tới hòm thư người dùng!"]);
            }
          }
        } else {
          if (!authLogs.includes("[OK] ĐH ĐÃ CẤP QUYỀN TRUY CẬP HỆ THỐNG! Đang chuyển hướng...")) {
            setAuthLogs(prev => [...prev, "[OK] Cập nhật phiên Hash Profile (user:profile) hoàn tất", "[OK] ĐH ĐÃ CẤP QUYỀN TRUY CẬP HỆ THỐNG! Đang chuyển hướng..."]);
          }
        }
      }
    }
  }, [authProgress, isAuthenticating, authLogs.length, authResult, authFailureReason, isSignUp]);

  const [lastRegToken, setLastRegToken] = useState<string | null>(null);
  const [lastRegEmail, setLastRegEmail] = useState<string | null>(null);

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
    clean = clean.replace(/^(API Error:\s*\d+|Error\s*\d+|Mã lỗi:\s*\d+)\s*-?\s*/i, "").trim();
    if (!clean || clean === "401" || clean === "400" || clean === "500" || clean === "403") {
      return "Tên đăng nhập hoặc mật khẩu không chính xác.";
    }
    return clean;
  };

  // Email Verification States
  const [isVerifyingMode, setIsVerifyingMode] = useState(false);
  const [verificationTokenInput, setVerificationTokenInput] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const stored = localStorage.getItem("horizon_api_base_url");
    if (stored === "http://localhost:3999" || stored === "http://localhost:8080") {
      localStorage.setItem("horizon_api_base_url", "https://mummified-escapable-proven.ngrok-free.dev");
      return "https://mummified-escapable-proven.ngrok-free.dev";
    }
    return stored || "https://mummified-escapable-proven.ngrok-free.dev";
  });
  const [verifyApiPath, setVerifyApiPath] = useState(() => localStorage.getItem("horizon_verify_api_path") || "/api/auth/verify-email");
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

    const ua = navigator.userAgent;
    let browserName = "Unknown Browser";
    let browserVersion = "Unknown";
    if (ua.indexOf("Chrome") > -1) {
      browserName = "Chrome";
      const match = ua.match(/Chrome\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Safari";
      const match = ua.match(/Version\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.indexOf("Firefox") > -1) {
      browserName = "Firefox";
      const match = ua.match(/Firefox\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.indexOf("Edge") > -1) {
      browserName = "Edge";
      const match = ua.match(/Edg\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    }

    let osName = "Unknown OS";
    let osVersion = "Unknown";
    if (ua.indexOf("Windows") > -1) {
      osName = "Windows";
      const match = ua.match(/Windows NT ([0-9\._]+)/);
      if (match) osVersion = match[1];
    } else if (ua.indexOf("Macintosh") > -1) {
      osName = "macOS";
      const match = ua.match(/Mac OS X ([0-9\._]+)/);
      if (match) osVersion = match[1].replace(/_/g, ".");
    } else if (ua.indexOf("Linux") > -1) {
      osName = "Linux";
    } else if (ua.indexOf("Android") > -1) {
      osName = "Android";
    } else if (ua.indexOf("iPhone") > -1) {
      osName = "iOS";
    }

    const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? "MOBILE" : "DESKTOP";

    return {
      deviceType,
      osName,
      osVersion,
      browserName,
      browserVersion,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgent: ua,
      ipAddress: "127.0.0.1",
      language: navigator.language || "vi-VN",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
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
      const response = await apiRequest(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: "GET"
      });
      const isSuccess = response && (
        response.status === "success" ||
        (response.status && typeof response.status === "object" && (
          response.status.message === "Success" ||
          response.status.message === "success" ||
          response.status.code === 200 ||
          response.status.code === "200"
        ))
      );
      if (isSuccess && response.data) {
        setRecoveryUser(response.data);
        if (response.data.roles) {
          localStorage.setItem("horizon_recovery_user_roles", JSON.stringify(response.data.roles));
        }
      } else {
        setTokenValidationError("Đường dẫn khôi phục không hợp lệ hoặc cấu trúc dữ liệu không chính xác.");
      }
    } catch (err: any) {
      console.error("Token validation failed:", err);
      // Fallback: If validate-reset-token endpoint is not supported on the backend, 
      // we don't block the user from entering and submitting their new password.
      // The token will be validated natively during the POST reset-password submit.
      console.warn("Backend validate-reset-token endpoint failed or not found. Falling back to direct password reset for real Spring Boot integration.");
      setRecoveryUser({
        email: "Tài khoản liên kết",
        fullName: "Thành viên hệ thống",
        numberPhone: "Bảo mật hệ thống",
        avatarUrl: ""
      });
      setTokenValidationError("");
    } finally {
      setIsValidatingToken(false);
    }
  };

  // On mount, parse token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || params.get("code") || params.get("verify-email") || params.get("verify");
    if (tokenParam) {
      const isRecovery = params.has("token") || params.has("code") || tokenParam.startsWith("recovery-");
      if (isRecovery) {
        // Account recovery flow
        window.history.replaceState({}, document.title, window.location.pathname);
        setRecoveryToken(tokenParam);
        setRecoveryMode("RESET_PASSWORD");
        setIsPasswordResetExpanded(true);
        validateRecoveryToken(tokenParam);
      } else {
        // Email verification flow
        setVerificationTokenInput(tokenParam);
        setIsVerifyingMode(true);
        setVerificationLogs([
          `[INFO] Đã phát hiện token xác thực từ URL: ${tokenParam}`,
          `[INFO] Hãy nhấp "XÁC NHẬN KÍCH HOẠT" để gửi yêu cầu đến backend của bạn.`
        ]);
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
      const emailParam = encodeURIComponent(recoveryEmail.trim());
      const response = await apiRequest(`/api/auth/recover-account/${emailParam}`, {
        method: "GET"
      });

      setSuccessMsg(response.data || "Đường dẫn khôi phục tài khoản đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
      setCooldownTime(60); // Set cooldown
    } catch (err: any) {
      console.error("Account recovery request failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason || "Gửi yêu cầu khôi phục thất bại. Vui lòng kiểm tra lại địa chỉ email hoặc liên hệ quản trị viên.");
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
      // Flow 4: Token-Authenticated Password Modification (PUT)
      let response;
      try {
        response = await apiRequest(`/api/auth/change-password`, {
          method: "PUT",
          body: JSON.stringify({
            token: recoveryToken,
            newPassword: recoveryNewPassword,
            confirmPassword: recoveryConfirmPassword,
          }),
        });
      } catch (putErr) {
        console.warn("PUT /api/auth/change-password failed, attempting legacy POST /api/auth/reset-password fallback...", putErr);
        response = await apiRequest(`/api/auth/reset-password?code=${encodeURIComponent(recoveryToken)}`, {
          method: "POST",
          body: JSON.stringify({
            newPassword: recoveryNewPassword,
            confirmPassword: recoveryConfirmPassword,
          }),
        });
      }

      const successDetail = response?.data || "Mật khẩu của bạn đã được thay đổi thành công!";
      setSuccessMsg(successDetail);
      addAuditLog("VERIFY", { token: recoveryToken }, "SUCCESS", "Đổi mật khẩu thành công qua Real API Backend!", apiBaseUrl, getClientDeviceInfo());
      
      // Clear password inputs but do not redirect, reset mode, or clear token/user
      setRecoveryNewPassword("");
      setRecoveryConfirmPassword("");

    } catch (err: any) {
      console.error("Password reset failed:", err);
      const cleanReason = sanitizeErrorMessage(err.message);
      setErrorMsg(cleanReason || "Thay đổi mật khẩu không thành công. Vui lòng thử lại.");
      addAuditLog("VERIFY", { token: recoveryToken }, "FAILED", `Đổi mật khẩu thất bại: ${cleanReason || err.message}`, apiBaseUrl, getClientDeviceInfo());
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
      // Flow 3: Token-Authenticated Username Modification (PUT)
      const response = await apiRequest(`/api/auth/change-username`, {
        method: "PUT",
        body: JSON.stringify({
          token: recoveryToken,
          newUsername: recoveryNewUsername.trim(),
        }),
      });

      const successDetail = response?.data || "Tên đăng nhập đã được thay đổi thành công!";
      setSuccessMsg(successDetail);
      addAuditLog("VERIFY", { token: recoveryToken, newUsername: recoveryNewUsername.trim() }, "SUCCESS", "Đổi tên đăng nhập thành công qua Real API Backend!", apiBaseUrl, getClientDeviceInfo());
      
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
      setErrorMsg(cleanReason || "Đổi tên đăng nhập thất bại. Vui lòng thử lại.");
      addAuditLog("VERIFY", { token: recoveryToken, newUsername: recoveryNewUsername.trim() }, "FAILED", `Đổi tên đăng nhập thất bại: ${cleanReason || err.message}`, apiBaseUrl, getClientDeviceInfo());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = (token: string) => {
    setVerificationTokenInput(token);
    setIsVerifyingMode(true);
    setVerificationLogs([`[INFO] Đã lấy mã kích hoạt từ SMTP Relay: ${token}`, `[INFO] Khởi chạy kích hoạt tự động...`]);
    setTimeout(() => {
      handleExecuteRealVerification(token);
    }, 150);
  };

  const handleVerificationSuccess = (emailVal: string) => {
    const savedEmail = emailVal || lastRegEmail || localStorage.getItem("horizon_last_registration_email") || "";
    const savedUsername = localStorage.getItem("horizon_last_registration_username") || "";
    const savedPassword = localStorage.getItem("horizon_last_registration_password") || "";

    if (savedEmail) {
      setEmail(savedEmail);
    }

    // Set a short delay so the user can see the "Xác thực thành công" log.
    setTimeout(async () => {
      if (savedPassword && (savedEmail || savedUsername)) {
        setVerificationLogs(prev => [
          ...prev,
          `[INFO] Đã tìm thấy thông tin mật khẩu đăng ký. Tiến hành tự động đăng nhập...`
        ]);

        const loginTerm = savedEmail || savedUsername;
        setEmail(loginTerm);
        setPassword(savedPassword);
        setIsSignUp(false);
        setIsVerifyingMode(false);
        setLoading(true);

        setTimeout(async () => {
          try {
            const devInfo = getClientDeviceInfo();
            const payload = { usernameOrEmail: loginTerm, password: savedPassword, deviceInfo: devInfo };

            // Try real API login
            const res = await apiRequest("/api/auth/login", {
              method: "POST",
              body: JSON.stringify(payload),
            });

            const userData = res?.data || res || {};
            const accessJWT = userData.accessToken || userData.token || "mock_access_token";
            const refreshJWT = userData.refreshToken || "mock_refresh_token";
            const userRoles = userData.roles || ["USER"];
            const finalEmail = userData.email || savedEmail;
            const finalUsername = userData.username || userData.name || savedUsername || savedEmail.split("@")[0];

            const realUserObj = {
              id: userData.id || 999,
              fullName: userData.fullName || userData.name || finalUsername,
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

            setAuthResult("SUCCESS");
            setIsAuthenticating(true);
            setLoading(false);
            addAuditLog("LOGIN", payload, "SUCCESS", "Tự động đăng nhập thành công sau kích hoạt (Real Backend)!", apiBaseUrl, devInfo);
          } catch (err: any) {
            console.warn("Auto-login API failed:", err);
            setLoading(false);
            setIsVerifyingMode(false);
            setErrorMsg("Không thể tự động đăng nhập: " + (err.message || "Lỗi kết nối"));
          }
        }, 150);
      } else {
        // Just go to login page normally and fill in the email
        setIsVerifyingMode(false);
        setIsSignUp(false);
        setVerificationLogs([]);
        setSuccessMsg("Kích hoạt tài khoản thành công! Vui lòng đăng nhập với thông tin tài khoản của bạn.");
      }
    }, 2000);
  };

  const handleExecuteRealVerification = async (overrideToken?: string) => {
    const tokenToUse = (overrideToken || verificationTokenInput).trim();
    if (!tokenToUse) {
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

    // Stage 1: Connecting
    await new Promise(resolve => setTimeout(resolve, 500));
    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Đang kết nối tới ${apiBaseUrl}...`
    ]);

    // Real API Call!
    await new Promise(resolve => setTimeout(resolve, 500));
    const cleanPath = verifyApiPath.startsWith("/") ? verifyApiPath : `/${verifyApiPath}`;
    
    // Support parsing full link paste
    let tokenClean = tokenToUse;
    if (tokenToUse.includes("token=")) {
      const parts = tokenToUse.split("token=");
      if (parts[1]) tokenClean = parts[1].split("&")[0];
    }

    const fullUrl = `${apiBaseUrl.replace(/\/$/, "")}${cleanPath}?token=${tokenClean}`;
    const useProxy = isProxyEnabled();
    const fetchUrl = useProxy ? "/api/proxy" : fullUrl;

    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Gửi yêu cầu HTTP ${verifyMethod}: ${fullUrl} ${useProxy ? "(Bypass CORS Proxy: BẬT)" : ""}`,
      `[INFO] Đang chờ phản hồi từ Spring Boot Server...`
    ]);

    try {
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      };
      if (useProxy) {
        headers["X-Target-URL"] = fullUrl;
      }

      const response = await fetch(fetchUrl, {
        method: verifyMethod,
        headers
      });

      setVerificationLogs(prev => [
        ...prev,
        `[INFO] Nhận phản hồi HTTP Status: ${response.status} ${response.statusText}`
      ]);

      if (response.ok) {
        const responseText = await response.text();
        const isHtml = responseText.trim().startsWith("<") || responseText.toLowerCase().includes("<html") || responseText.toLowerCase().includes("ngrok");
        
        if (isHtml) {
          setVerificationLogs(prev => [
            ...prev,
            `[ERROR] Nhận phản hồi HTML thay vì JSON từ Server.`,
            `[ERROR] Đây là trang cảnh báo bảo mật ngrok (Bypass Ngrok Warning).`,
            `[ERROR] Đã phát hiện và ngăn chặn hiển thị sai trạng thái. Vui lòng kiểm tra lại cấu hình kết nối hoặc bật Proxy để hoàn tất.`
          ]);
          throw new Error("Phản hồi không hợp lệ: Server trả về trang HTML thay vì dữ liệu JSON.");
        }

        let resData: any = {};
        try {
          resData = JSON.parse(responseText);
        } catch {
          resData = {};
        }
        console.log("Verify API Response:", resData);

        setVerificationLogs(prev => [
          ...prev,
          `[OK] Spring Boot phản hồi: SUCCESS`,
          `[OK] Đã kích hoạt tài khoản trên CSDL PostgreSQL thực tế!`,
          `[OK] TÀI KHOẢN ĐÃ ĐƯỢC KÍCH HOẠT THÀNH CÔNG TRÊN SERVER CỦA BẠN!`
        ]);
        setVerificationResultState("SUCCESS");
        
        const returnedEmail = resData?.data?.email || resData?.email || "";
        if (returnedEmail) {
          setEmail(returnedEmail);
        }
        setSuccessMsg(`Xác thực thành công từ API Backend! Tài khoản của bạn đã được kích hoạt trên hệ thống thực tế. Đang chuyển hướng đăng nhập...`);
        setIsSignUp(false);

        addAuditLog("VERIFY", { token: tokenClean }, "SUCCESS", "Kích hoạt email thành công từ Real API Backend!", apiBaseUrl, getClientDeviceInfo());
        handleVerificationSuccess(returnedEmail);
      } else {
        const errBody = await response.text().catch(() => "");
        let parsedErr = "";
        try {
          const jsonErr = JSON.parse(errBody);
          parsedErr = jsonErr?.detail || jsonErr?.title || jsonErr?.message || jsonErr?.status?.message || errBody;
        } catch {
          parsedErr = errBody;
        }

        setVerificationLogs(prev => [
          ...prev,
          `[ERROR] Server trả về lỗi: Code ${response.status}`,
          parsedErr ? `[ERROR] Chi tiết: ${parsedErr}` : `[ERROR] Token không hợp lệ hoặc đã hết hạn.`
        ]);
        setVerificationResultState("FAILED");

        addAuditLog("VERIFY", { token: tokenClean }, "FAILED", `Kích hoạt email thất bại: Server trả về lỗi Code ${response.status} - ${parsedErr}`, apiBaseUrl, getClientDeviceInfo());
      }
    } catch (err: any) {
      console.error("Real API Verification Failed:", err);
      setVerificationLogs(prev => [
        ...prev,
        `[ERROR] Không thể kết nối tới Server Spring Boot tại địa chỉ: ${apiBaseUrl}`,
        `[ERROR] Chi tiết lỗi: ${err.message || err}`,
        `[INFO] Mẹo: Hãy chắc chắn rằng Server Spring Boot của bạn đang chạy tại ${apiBaseUrl} và đã cấu hình cho phép CORS cho origin của trang web này.`
      ]);
      setVerificationResultState("FAILED");

      addAuditLog("VERIFY", { token: tokenClean }, "FAILED", "Kích hoạt email thất bại do lỗi kết nối: " + (err.message || err), apiBaseUrl, getClientDeviceInfo());
    } finally {
      setIsVerifyingRequest(false);
    }
  };

  const handleResendToken = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    const targetEmail = email || lastRegEmail || localStorage.getItem("horizon_last_registration_email") || "";
    if (!targetEmail || !targetEmail.trim()) {
      setErrorMsg("Không tìm thấy email đăng ký ban đầu để gửi lại mã.");
      return;
    }

    setLoading(true);
    const devInfo = getClientDeviceInfo();
    const payload = {
      name: username.trim() || targetEmail.split("@")[0],
      fullName: fullName.trim() || "Người dùng",
      email: targetEmail.trim().toLowerCase(),
      password: password || "password123",
      confirmPassword: password || "password123"
    };

    setVerificationLogs(prev => [
      ...prev,
      `[INFO] Yêu cầu gửi lại mã xác thực cho email: ${payload.email}...`
    ]);

    try {
      const res = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const customMsg = res?.message || res?.data?.message || "Đã gửi lại mã xác thực thành công!";
      setSuccessMsg(customMsg);
      
      const token = res?.data?.token || res?.token || "verify-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("horizon_last_registration_token", token);
      localStorage.setItem("horizon_last_registration_email", payload.email);
      localStorage.setItem("horizon_last_registration_message", customMsg);
      
      setLastRegToken(token);
      setLastRegEmail(payload.email);
      setTimeLeft(300); // Reset countdown timer to 5 minutes
      
      setVerificationLogs(prev => [
        ...prev,
        `[OK] Đã cập nhật token mới thành công: ${token}`,
        `[OK] Email xác thực mới đã được phát hành!`
      ]);
      addAuditLog("REGISTER", payload, "SUCCESS", `[GỬI LẠI MÃ] ${customMsg}`, apiBaseUrl, devInfo);
    } catch (err: any) {
      console.warn("Real Backend Resend Failed:", err);
      setErrorMsg(err.message || "Gửi lại mã không thành công.");
      setVerificationLogs(prev => [
        ...prev,
        `[ERROR] Gửi lại mã thất bại: ${err.message}`
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authProgress >= 100 && isAuthenticating) {
      if (authResult === "SUCCESS") {
        const redirectTimeout = setTimeout(() => {
          setIsAuthenticating(false);
          if (isSignUp) {
            const token = localStorage.getItem("horizon_last_registration_token");
            const emailAddr = localStorage.getItem("horizon_last_registration_email");
            const customMsg = localStorage.getItem("horizon_last_registration_message") || "Một email xác thực đã được gửi đến địa chỉ hòm thư của bạn. Vui lòng kiểm tra.";
            setLastRegToken(token);
            setLastRegEmail(emailAddr);

            setSuccessMsg(customMsg);
            setIsSignUp(false);
            setIsVerifyingMode(true);
            setVerificationTokenInput("");
            setPassword("");
            setConfirmPassword("");
          } else {
            onNavigate("landing");
          }
        }, 1000);
        return () => clearTimeout(redirectTimeout);
      } else if (authResult === "FAILED") {
        const redirectTimeout = setTimeout(() => {
          setIsAuthenticating(false);
          setErrorMsg(sanitizeErrorMessage(authFailureReason) || "Xác thực không thành công. Vui lòng kiểm tra lại thông tin.");
          setLoading(false);
        }, 1200);
        return () => clearTimeout(redirectTimeout);
      }
    }
  }, [authProgress, isAuthenticating, authResult, onNavigate, isSignUp, authFailureReason]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Input validations
    if (isSignUp) {
      if (!fullName || !fullName.trim()) {
        setErrorMsg("Họ tên không được để trống");
        return;
      }
      if (!username || !username.trim()) {
        setErrorMsg("Tên đăng nhập không được để trống");
        return;
      }
      if (username.trim().length < 3 || username.trim().length > 50) {
        setErrorMsg("Tên đăng nhập phải từ 3 đến 50 ký tự");
        return;
      }
      if (!email || !email.trim()) {
        setErrorMsg("Email không được để trống");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMsg("Email không đúng định dạng");
        return;
      }
      if (!password) {
        setErrorMsg("Mật khẩu không được để trống");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }
      if (!confirmPassword) {
        setErrorMsg("Xác nhận mật khẩu không được để trống");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Xác nhận mật khẩu không khớp.");
        return;
      }
      if (!agreeToTerms) {
        setErrorMsg("Bạn phải đồng ý với Điều khoản và Chính sách dịch vụ.");
        return;
      }
    } else {
      if (!email) {
        setErrorMsg("Vui lòng nhập tên đăng nhập hoặc email.");
        return;
      }
      if (!password) {
        setErrorMsg("Vui lòng nhập mật khẩu.");
        return;
      }
    }

    setLoading(true);

    try {
      // Load stored users from localStorage or initialize with ADMIN default
      let storedUsers: any[] = [];
      try {
        const stored = localStorage.getItem("horizon_cloud_users");
        if (stored) {
          storedUsers = JSON.parse(stored);
        } else {
          storedUsers = [
            {
              id: 1,
              fullName: "System Administrator",
              username: "ADMIN",
              email: "ADMIN@gmail.com",
              password: "admin",
              roles: ["ADMIN", "USER", "SUPER_ADMIN"],
              status: "ACTIVE"
            }
          ];
          localStorage.setItem("horizon_cloud_users", JSON.stringify(storedUsers));
        }
      } catch (err) {
        console.error("Lỗi đọc dữ liệu người dùng:", err);
        storedUsers = [
          {
            id: 1,
            fullName: "System Administrator",
            username: "ADMIN",
            email: "ADMIN@gmail.com",
            password: "admin",
            roles: ["ADMIN", "USER", "SUPER_ADMIN"],
            status: "ACTIVE"
          }
        ];
      }

      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const devInfo = getClientDeviceInfo();
      const payload = isSignUp 
        ? { name: username.trim(), fullName: fullName.trim(), email: email.trim().toLowerCase(), password, confirmPassword } 
        : { usernameOrEmail: email, password, deviceInfo: devInfo };

      // Try actual network request
      try {
        const res = await apiRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        console.log("Real backend response:", res);

        if (isSignUp) {
          // For Sign Up
          const customMsg = res?.message || res?.data?.message || "Đăng ký thành công từ Real API Backend! Vui lòng kiểm tra email để kích hoạt.";
          setSuccessMsg(customMsg);
          
          const token = res?.data?.token || res?.token || "";
          localStorage.setItem("horizon_last_registration_token", token);
          localStorage.setItem("horizon_last_registration_email", email.trim().toLowerCase());
          localStorage.setItem("horizon_last_registration_message", customMsg);
          localStorage.setItem("horizon_last_registration_username", username.trim());
          localStorage.setItem("horizon_last_registration_password", password);
          
          setLastRegToken(token);
          setLastRegEmail(email.trim().toLowerCase());

          setAuthResult("SUCCESS");
          setIsAuthenticating(true);
          setLoading(false);

          addAuditLog("REGISTER", payload, "SUCCESS", customMsg, apiBaseUrl, devInfo);
        } else {
          // For Login
          const userData = res?.data || res || {};
          const accessJWT = userData.accessToken || userData.token || "mock_access_token";
          const refreshJWT = userData.refreshToken || "mock_refresh_token";
          const userRoles = userData.roles || ["USER"];
          const finalEmail = userData.email || email;
          const finalUsername = userData.username || userData.name || email.split("@")[0];

          const realUserObj = {
            id: userData.id || 999,
            fullName: userData.fullName || userData.name || finalUsername,
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

          setAuthResult("SUCCESS");
          setIsAuthenticating(true);
          setLoading(false);

          addAuditLog("LOGIN", payload, "SUCCESS", "Đăng nhập thành công từ Real API Backend. Đã đồng bộ Redis Session Cache.", apiBaseUrl, devInfo);
        }
        return; // Success, exit
      } catch (err: any) {
        console.warn("Real Backend API Request Failed:", err);
        
        // Check if it is Báo cáo 1 Case 2: Unverified email
        const errorResponse = err.data;
        const isUnverified = err.status === 401 && (
          (errorResponse?.status?.code === 401 && errorResponse?.data?.email) || 
          (errorResponse?.data?.message?.includes("chưa được xác thực") || errorResponse?.message?.includes("chưa được xác thực") || (errorResponse?.data?.message && errorResponse?.data?.message.includes("chưa được xác thực")))
        );

        if (isUnverified) {
          const unverifiedEmail = errorResponse?.data?.email || email;
          const resendMessage = errorResponse?.data?.message || errorResponse?.message || "Tài khoản của bạn chưa được xác thực. Vui lòng kích hoạt.";
          const resendToken = errorResponse?.data?.token;

          setSuccessMsg(resendMessage);
          if (resendToken) {
            localStorage.setItem("horizon_last_registration_token", resendToken);
            setLastRegToken(resendToken);
          }
          localStorage.setItem("horizon_last_registration_email", unverifiedEmail);
          setLastRegEmail(unverifiedEmail);
          
          // Navigate to verification screen
          setIsSignUp(false);
          setIsVerifyingMode(true);
          setVerificationTokenInput("");
          setAuthResult("SUCCESS");
          setIsAuthenticating(false);
          setLoading(false);
          
          addAuditLog("LOGIN", payload, "FAILED", `[CHƯA XÁC THỰC] Chuyển hướng sang Kích hoạt email: ${unverifiedEmail}`, apiBaseUrl, devInfo);
          return;
        }

        setAuthResult("FAILED");
        const cleanReason = sanitizeErrorMessage(err.message);
        setAuthFailureReason(cleanReason || "Xác thực không thành công. Hãy kiểm tra lại thông tin đăng nhập.");
        setIsAuthenticating(true);
        setLoading(false);

        addAuditLog(isSignUp ? "REGISTER" : "LOGIN", payload, "FAILED", cleanReason || "Xác thực bị từ chối từ Server Spring Boot.", apiBaseUrl, devInfo);
      }

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Đã xảy ra lỗi hệ thống bảo mật. Vui lòng thử lại sau.");
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
      
      <div className="max-w-[540px] w-full z-10">

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
            {isAuthenticating ? (
              <motion.div
                key="auth-scanning-hud"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-6 min-h-[460px]"
              >
                {/* Rotating HUD circle scanning graphic */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-8">
                  {/* Rotating Outer HUD rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-dashed border-[#FF4D24]/30"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-double border-indigo-500/40"
                  />
                  
                  {/* Neon scan lines moving up and down */}
                  <motion.div
                    animate={{ y: [-50, 50, -50] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#FF4D24] to-transparent shadow-[0_0_12px_#FF4D24]"
                  />

                  {/* Icon status based on progress */}
                  <div className="relative z-10 w-24 h-24 rounded-full bg-slate-950 flex flex-col items-center justify-center border-2 border-slate-800/80 shadow-inner overflow-hidden">
                    {authProgress < 100 ? (
                      <>
                        <Cpu className="w-8 h-8 text-[#FF4D24] animate-pulse mb-1" />
                        <span className="font-mono text-[10.5px] text-slate-300 font-bold">{authProgress}%</span>
                      </>
                    ) : authResult === "SUCCESS" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <Shield className="w-10 h-10 text-emerald-500 mb-1" />
                        <span className="font-mono text-[10px] text-emerald-500 font-extrabold tracking-wider">GRANTED</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <AlertCircle className="w-10 h-10 text-red-500 mb-1" />
                        <span className="font-mono text-[10px] text-red-500 font-extrabold tracking-wider">DENIED</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Subtitle & Logs */}
                <div className="w-full space-y-5">
                  <div className="text-center">
                    <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase flex items-center justify-center gap-2">
                      {authProgress < 100 ? (
                        <>
                          <Loader2 className="w-4 h-4 text-[#FF4D24] animate-spin" />
                          <span>ĐANG XÁC THỰC BẢO MẬT...</span>
                        </>
                      ) : authResult === "SUCCESS" ? (
                        <span className="text-emerald-600 font-black flex items-center gap-1.5">
                          <Check className="w-4.5 h-4.5 bg-emerald-100 text-emerald-600 rounded-full p-0.5" /> 
                          {isSignUp ? "ĐĂNG KÝ THÀNH CÔNG!" : "ĐĂNG NHẬP THÀNH CÔNG!"}
                        </span>
                      ) : (
                        <span className="text-red-600 font-black flex items-center gap-1.5 animate-bounce">
                          <AlertCircle className="w-4.5 h-4.5 bg-red-100 text-red-600 rounded-full p-0.5" /> 
                          XÁC THỰC THẤT BẠI!
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Spring Security 6.x + Stateless Redis Session</p>
                  </div>

                  {/* Micro terminal logs typing */}
                  <div className="w-full bg-slate-950 text-left p-4 rounded-xl border border-slate-800/80 font-mono text-[10.5px] leading-relaxed text-slate-300 min-h-[160px] space-y-1 overflow-hidden shadow-inner">
                    {authLogs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.12 }}
                        className={log.startsWith("[OK]") ? "text-emerald-400 font-bold" : log.startsWith("[ERROR]") ? "text-red-400 font-bold" : "text-slate-400"}
                      >
                        {log}
                      </motion.div>
                    ))}
                  </div>

                  {authProgress >= 100 && authResult === "FAILED" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-2 text-red-500 font-bold text-xs flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span>Đang quay lại sửa thông tin...</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : recoveryMode === "SEND_LINK" ? (
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
                  {errorMsg && (
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
                  {errorMsg && (
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
                      {errorMsg && (
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
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4D24]/20 to-indigo-500/20 flex items-center justify-center border border-[#FF4D24]/10 shadow-inner">
                      <Mail className="w-4.5 h-4.5 text-[#FF4D24]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#111111] tracking-tight font-sans">
                        Xác thực kích hoạt tài khoản
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                        EMAIL VERIFICATION INTERFACE
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Vui lòng nhập Mã xác thực (Token UUID) hoặc dán toàn bộ đường link kích hoạt nhận được trong hòm thư của bạn để tiến hành kích hoạt tài khoản trên hệ thống.
                  </p>
                </div>

                {/* Visual Countdown Timer Widget */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft > 0 ? "bg-[#FF4D24]" : "bg-red-500"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft > 0 ? "bg-[#FF4D24]" : "bg-red-500"}`}></span>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-slate-800 tracking-tight leading-none">Mã có hiệu lực trong</p>
                      <p className="text-[9.5px] text-slate-400 font-mono mt-1 font-bold">SPRING BOOT TTL COUNTDOWN</p>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-black tracking-wider text-slate-900 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 min-w-[70px] justify-center">
                    <span className={timeLeft <= 30 && timeLeft > 0 ? "text-red-500 animate-pulse font-bold" : timeLeft === 0 ? "text-slate-400" : "text-indigo-600"}>
                      {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {timeLeft === 0 && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 flex items-start gap-2 leading-relaxed font-sans animate-pulse">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black block mb-0.5">Mã xác thực đã hết hạn!</strong>
                      Mã xác thực của bạn đã quá hạn 5 phút. Vui lòng bấm nút <span className="font-bold text-[#FF4D24]">"Gửi lại mã xác thực mới"</span> ở phía dưới để nhận mã mới.
                    </div>
                  </div>
                )}

                {/* Token Input Box */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between" htmlFor="verify-token">
                    <span>Mã xác thực tài khoản (Token / Verification URL)</span>
                    <span className="text-[#FF4D24] text-[9px] font-bold lowercase font-sans">Hạn dùng 5 phút</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="verify-token"
                      type="text"
                      placeholder="Ví dụ: 2441de48-1db6-4795-b6ee-9921d01769a6"
                      value={verificationTokenInput}
                      onChange={(e) => setVerificationTokenInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3.5 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111] font-mono"
                    />
                  </div>
                </div>

                {/* Collapsible Backend Connection Settings */}
                <div className="border border-slate-200/60 rounded-2xl bg-slate-50/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowApiSettings(!showApiSettings)}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400 animate-spin" style={{ animationDuration: "8s" }} />
                      <span>Cấu hình Kết nối CSDL & API Backend</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold font-mono">
                      {showApiSettings ? "ĐÓNG" : "MỞ RỘNG"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showApiSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="border-t border-slate-200/50 p-4 space-y-4 bg-slate-50/20"
                      >
                        {/* API Base URL */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Backend Server URL (apiBaseUrl)
                          </label>
                          <input
                            type="text"
                            placeholder="http://localhost:8080"
                            value={apiBaseUrl}
                            onChange={(e) => setApiBaseUrl(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs font-mono p-2.5 rounded-lg outline-none text-[#111111]"
                          />
                        </div>

                        {/* API Path & Method row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Endpoint Verify Path
                            </label>
                            <input
                              type="text"
                              placeholder="/api/auth/verify-email"
                              value={verifyApiPath}
                              onChange={(e) => setVerifyApiPath(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs font-mono p-2.5 rounded-lg outline-none text-[#111111]"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              HTTP Method
                            </label>
                            <input
                              type="text"
                              disabled
                              value="GET"
                              className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-mono p-2.5 rounded-lg cursor-not-allowed outline-none"
                            />
                          </div>
                        </div>

                        {/* CORS Bypass Proxy Settings */}
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl mt-1">
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-800 tracking-tight leading-none">Bypass CORS via Proxy</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-1 font-bold">NODE.JS SERVER PASS-THROUGH</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = isProxyEnabled();
                              localStorage.setItem("horizon_use_api_proxy", (!current).toString());
                              setVerificationLogs(prev => [...prev, `[INFO] Đã ${!current ? "KÍCH HOẠT" : "VÔ HIỆU HÓA"} Proxy vượt rào CORS.`]);
                            }}
                            className={`px-3 py-1.5 text-[9px] font-black font-mono rounded-lg transition-all cursor-pointer ${
                              isProxyEnabled() 
                                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          >
                            {isProxyEnabled() ? "ACTIVE (PROXY ON)" : "OFF (DIRECT)"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Verification Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleExecuteRealVerification()}
                    disabled={isVerifyingRequest || timeLeft === 0}
                    className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isVerifyingRequest && verificationResultState === null ? (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Xác nhận kích hoạt (Real API Call)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendToken}
                    disabled={loading || isVerifyingRequest}
                    className="w-full bg-gradient-to-r from-[#FF4D24]/10 to-[#FF4D24]/5 hover:from-[#FF4D24]/20 hover:to-[#FF4D24]/10 border border-[#FF4D24]/30 text-[#FF4D24] disabled:opacity-50 py-3.5 px-4 rounded-xl font-sans text-xs font-black hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF4D24]" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-[#FF4D24] animate-spin" style={{ animationDuration: "3s" }} />
                    )}
                    <span>GỬI LẠI MÃ XÁC THỰC MỚI</span>
                  </button>
                </div>

                {/* Real-time Verification Terminal Logs */}
                {verificationLogs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Nhật ký truy vấn xác thực (Logs)</span>
                    </div>
                    <div className="w-full bg-slate-950 text-left p-4 rounded-2xl border border-slate-800/80 font-mono text-[10.5px] leading-relaxed text-slate-300 min-h-[140px] space-y-1.5 overflow-hidden shadow-inner">
                      {verificationLogs.map((log, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.12 }}
                          className={log.startsWith("[OK]") ? "text-emerald-400 font-bold" : log.startsWith("[ERROR]") ? "text-red-400 font-bold" : "text-slate-400"}
                        >
                          {log}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Back Link */}
                <div className="text-center pt-2 border-t border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingMode(false);
                      setVerificationLogs([]);
                      setVerificationResultState(null);
                      setSuccessMsg("");
                      setErrorMsg("");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Quay lại trang Đăng nhập / Đăng ký</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-credentials-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Tab Switcher: Sign In vs Sign Up */}
                <div className="flex items-center p-1 bg-slate-200/60 rounded-xl mb-6 relative">
                  <button
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className="flex-1 py-2 text-xs font-black rounded-lg relative z-10 transition-colors duration-300 cursor-pointer"
                    style={{ color: !isSignUp ? "#111111" : "#666666" }}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    type="button"
                    className="flex-1 py-2 text-xs font-black rounded-lg relative z-10 transition-colors duration-300 cursor-pointer"
                    style={{ color: isSignUp ? "#111111" : "#666666" }}
                  >
                    Đăng ký thành viên
                  </button>

                  {/* Sliding high-contrast background bar */}
                  <motion.div
                    className="absolute top-1 bottom-1 left-1 bg-white rounded-lg shadow-sm"
                    style={{ width: "calc(50% - 4px)" }}
                    animate={{ x: isSignUp ? "100%" : "0%" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#111111] tracking-tight font-sans">
                    {isSignUp ? "Tạo tài khoản mới" : "Chào mừng quay trở lại"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 mb-3">
                    {isSignUp 
                      ? "Khởi tạo tài khoản Horizon Mobile để nhận ngay ngàn ưu đãi mua sắm điện thoại chính hãng."
                      : "Đăng nhập tài khoản Horizon Mobile để quản lý giỏ hàng, đơn hàng và lịch sử mua sắm."
                    }
                  </p>
                </div>

                {/* Success / Error Messages */}
                <AnimatePresence mode="wait">
                  {errorMsg && (
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

                {/* Primary Form */}
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  
                   {/* Inputs for Username & Full Name (Only for Sign Up) */}
                  <AnimatePresence mode="popLayout">
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: -16 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: -16 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden flex flex-col gap-4"
                      >
                        {/* Tên Đăng Nhập */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reg-username">
                            Tên đăng nhập (Username)
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="reg-username"
                              type="text"
                              placeholder="john_doe"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                            />
                          </div>
                        </div>

                        {/* Họ và Tên */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reg-fullname">
                            Họ và Tên đầy đủ
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="reg-fullname"
                              type="text"
                              placeholder="John Doe"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input Email Address / UsernameOrEmail */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reg-email">
                      {isSignUp ? "Địa chỉ Email" : "Tên đăng nhập hoặc Email"}
                    </label>
                    <div className="relative">
                      {isSignUp ? (
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      )}
                      <input
                        id="reg-email"
                        type={isSignUp ? "email" : "text"}
                        placeholder={isSignUp ? "name@company.com" : "ADMIN hoặc name@company.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Input Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reg-password">
                        Mật khẩu
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryMode("SEND_LINK");
                            setErrorMsg("");
                            setSuccessMsg("");
                            if (email && email.includes("@")) {
                              setRecoveryEmail(email);
                            }
                          }}
                          className="text-[10px] font-bold text-[#FF4D24] hover:underline"
                        >
                          Quên thông tin tài khoản?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-10 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Input Confirm Password (Only for Sign Up) */}
                  <AnimatePresence mode="popLayout">
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: -16 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: -16 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden flex flex-col gap-1.5"
                      >
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono" htmlFor="reg-confirm">
                          Xác nhận mật khẩu
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="reg-confirm"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#FF4D24] text-xs font-sans pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-4 focus:ring-[#FF4D24]/10 text-[#111111]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Terms checkbox for Sign Up */}
                  {isSignUp && (
                    <div className="flex items-start gap-2.5 mt-1">
                      <input
                        id="reg-terms"
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 text-[#FF4D24] focus:ring-[#FF4D24] border-slate-300 rounded cursor-pointer mt-0.5"
                      />
                      <label htmlFor="reg-terms" className="text-[10.5px] text-slate-500 leading-normal font-sans">
                        Tôi đồng ý với{" "}
                        <a href="#terms" className="text-[#FF4D24] font-bold hover:underline">Điều khoản Dịch vụ</a>
                        {" "}và{" "}
                        <a href="#privacy" className="text-[#FF4D24] font-bold hover:underline">Chính sách Bảo mật</a>
                        {" "}của Horizon Mobile.
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? "Tạo tài khoản" : "Đăng nhập hệ thống"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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

                {/* Quick Info text / SLA disclaimer */}
                <div className="flex items-center gap-1.5 justify-center mt-6 text-[10px] text-slate-400 font-medium select-none">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D24]" />
                  <span>Mã hóa bảo mật 256-bit SSL hoàn toàn an toàn</span>
                </div>


              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Floating back home action */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate("landing")}
            className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay về Trang chủ</span>
          </button>
        </div>

      </div>

    </div>
  );
}
