import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { exchangeOAuth2Ticket } from "../services/authService";
import { mergeGuestCart } from "../services/cartService";
import { getClientDeviceInfo } from "../lib/api";
import { extractBackendMessage, sanitizeErrorMessage } from "../lib/responseExtractor";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { ApiResponse } from "../types/api";

interface OAuth2CallbackPageProps {
  onNavigate: (page: any) => void;
}

export default function OAuth2CallbackPage({ onNavigate }: OAuth2CallbackPageProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const ticket = searchParams.get("ticket");
    const error = searchParams.get("error");

    const redirectToLoginWithError = (errorMessage: string) => {
      try {
        sessionStorage.setItem("auth_error_message", errorMessage);
      } catch (_) {}
      window.history.replaceState({}, "", "/a#login");
      onNavigate("auth");
    };

    // Case 1: Người dùng hủy liên kết hoặc Google trả về mã lỗi
    if (error) {
      let errMsg = "Quá trình xác thực Google không thành công. Vui lòng thử lại.";
      if (error === "access_denied") {
        errMsg = "Bạn đã hủy liên kết đăng nhập với tài khoản Google.";
      } else if (error === "ACCOUNT_LOCKED" || error.toLowerCase().includes("lock")) {
        errMsg = "Tài khoản của bạn đã bị tạm khóa do vi phạm chính sách.";
      } else if (error === "INVALID_OAUTH_STATE_MISMATCH" || error.toLowerCase().includes("state")) {
        errMsg = "Lỗi bảo mật phiên đăng nhập (State mismatch). Vui lòng thử lại.";
      }
      redirectToLoginWithError(errMsg);
      return;
    }

    // Case 2: Không có cả ticket lẫn error -> Thiếu tham số xác thực
    if (!ticket || ticket.trim().length === 0) {
      redirectToLoginWithError("Không tìm thấy mã xác thực Google.");
      return;
    }

    // Case 3: Có ticket hợp lệ -> Đổi vé lấy JWT Token
    const cleanTicket = ticket.trim();

    (async () => {
      try {
        const deviceInfo = getClientDeviceInfo();
        const res = await exchangeOAuth2Ticket(cleanTicket, deviceInfo);

        const rawRes = res as unknown as Record<string, unknown>;
        const rawData = (rawRes.data as Record<string, unknown> | undefined) || rawRes;

        const accessToken = (rawData.accessToken || rawData.access_token || "") as string;
        const refreshToken = (rawData.refreshToken || rawData.refresh_token || "") as string;

        if (accessToken) {
          const userRoles = (rawData.roles as string[]) || ["USER"];
          const finalEmail = (rawData.email as string) || "";
          const finalUsername = (rawData.username as string) || finalEmail.split("@")[0] || "User";
          const finalFullName = (rawData.fullName as string) || finalUsername;

          const realUserObj = {
            id: rawData.id ?? 1,
            fullName: finalFullName,
            username: finalUsername,
            email: finalEmail,
            roles: userRoles,
            status: "ACTIVE"
          };

          const redisProfile = {
            userId: realUserObj.id,
            email: realUserObj.email,
            roles: realUserObj.roles,
            accessToken
          };

          const redisRefreshTokens = {
            [deviceInfo.deviceId]: { token: refreshToken, deviceInfo }
          };

          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          if (refreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          }
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(redisProfile));
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKENS_MAP, JSON.stringify(redisRefreshTokens));
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(realUserObj));

          // Kích hoạt đồng bộ các listener xác thực
          window.dispatchEvent(new Event("auth-changed"));
          window.dispatchEvent(new Event("user-auth-change"));
        }

        // Đồng bộ giỏ hàng
        mergeGuestCart().catch((e) => console.warn("mergeGuestCart failed:", e));

        // Xác định điểm đến: Luôn ưu tiên quay về / (Landing), không về /a hoặc #login
        const savedUrl = sessionStorage.getItem("auth_return_url");
        sessionStorage.removeItem("auth_return_url");

        const targetUrl = (savedUrl && savedUrl !== "/a" && savedUrl !== "/auth") ? savedUrl : "/";

        window.history.replaceState({}, "", targetUrl);
        if (targetUrl === "/") {
          onNavigate("landing");
        } else if (targetUrl.startsWith("/m") || targetUrl.includes("profile")) {
          onNavigate("profile");
        } else if (targetUrl.startsWith("/o") || targetUrl.includes("order")) {
          onNavigate("order");
        } else if (targetUrl.startsWith("/p") || targetUrl.includes("product")) {
          onNavigate("product");
        } else {
          window.location.href = targetUrl;
        }
      } catch (err: unknown) {
        const errObj = (err && typeof err === "object" ? err : {}) as Record<string, unknown>;
        const errData = (errObj.data && typeof errObj.data === "object" ? errObj.data : undefined) as ApiResponse | undefined;
        const extracted = extractBackendMessage(errData || (errObj as ApiResponse));
        const backendMsg = extracted.message || (typeof errObj.message === "string" ? errObj.message : "");

        let displayMsg = "Phiên xác thực không hợp lệ hoặc đã hết hạn.";
        if (backendMsg.includes("INVALID_OR_EXPIRED_TICKET") || backendMsg.includes("expired") || backendMsg.includes("hết hạn")) {
          displayMsg = "Phiên xác thực đã hết hạn hoặc đã được sử dụng. Vui lòng đăng nhập lại.";
        } else if (backendMsg.includes("ACCOUNT_LOCKED") || backendMsg.includes("locked") || backendMsg.includes("khóa")) {
          displayMsg = "Tài khoản của bạn đã bị tạm khóa do vi phạm chính sách.";
        } else if (backendMsg.includes("INVALID_OAUTH_STATE_MISMATCH") || backendMsg.includes("state")) {
          displayMsg = "Lỗi bảo mật phiên đăng nhập (State mismatch). Vui lòng thử lại.";
        } else if (backendMsg && !backendMsg.includes("Unexpected token")) {
          displayMsg = sanitizeErrorMessage(backendMsg);
        }

        redirectToLoginWithError(displayMsg);
      }
    })();
  }, [onNavigate]);

  // Seamless transition UI: minimal loading indicator không lộ diện thành "page mới"
  return (
    <div className="w-full min-h-screen bg-[#E4E4E4] flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF4D24]" />
        <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
          Đang hoàn tất đăng nhập...
        </span>
      </div>
    </div>
  );
}
