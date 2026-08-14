/**
 * Centralized API Integration Helper for Horizon Cloud
 */

import { ApiResponse } from "../types/api";
import { extractBackendMessage } from "./responseExtractor";

export function getApiBaseUrl(): string {
  let stored = localStorage.getItem("horizon_api_base_url");
  if (!stored) {
    localStorage.setItem("horizon_api_base_url", "http://localhost:8080");
    stored = "http://localhost:8080";
  }
  return stored;
}

export function isProxyEnabled(): boolean {
  return false;
}

export function setProxyEnabled(_enabled: boolean): void {
  localStorage.setItem("horizon_use_api_proxy", "false");
}

export interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  language: string;
  platform: string;
  vendor: string;
  timeZone: string;
  deviceId: string;
}

export function getClientDeviceInfo(): DeviceInfo {
  let deviceId = localStorage.getItem("horizon_device_id");
  if (!deviceId) {
    deviceId = "dev-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("horizon_device_id", deviceId);
  }

  let tz = "Asia/Ho_Chi_Minh";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {}

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    vendor: navigator.vendor,
    timeZone: tz,
    deviceId
  };
}

export async function executeRefreshToken(): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const profileRaw = localStorage.getItem("horizon_redis_profile");
  if (!profileRaw) {
    throw new Error("No active profile session found.");
  }

  const profile = JSON.parse(profileRaw);
  const deviceId = getClientDeviceInfo().deviceId;

  const tokensRaw = localStorage.getItem("horizon_redis_refresh_tokens");
  let refreshToken = "";
  if (tokensRaw) {
    const tokens = JSON.parse(tokensRaw);
    const deviceSession = tokens[deviceId];
    if (deviceSession) {
      refreshToken = deviceSession.token ?? "";
    }
  }

  if (refreshToken.length === 0) {
    throw new Error("No refresh token found for this device.");
  }

  const payload = {
    refreshToken,
    deviceInfo: getClientDeviceInfo()
  };

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Refresh token has expired or is invalid.");
  }

  const resData = await response.json();
  if (resData.data && resData.data.accessToken && resData.data.refreshToken) {
    const newAccess = resData.data.accessToken;
    const newRefresh = resData.data.refreshToken;

    profile.accessToken = newAccess;
    localStorage.setItem("horizon_redis_profile", JSON.stringify(profile));

    const tokensObj = tokensRaw ? JSON.parse(tokensRaw) : {};
    tokensObj[deviceId] = {
      token: newRefresh,
      deviceInfo: getClientDeviceInfo()
    };
    localStorage.setItem("horizon_redis_refresh_tokens", JSON.stringify(tokensObj));

    return newAccess;
  }

  throw new Error("Invalid token refresh payload structure.");
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const targetUrl = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    let response = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !["/api/auth/login", "/api/auth/register", "/api/auth/refresh-token"].some(u => endpoint.includes(u))) {
        try {
          const newAccessToken = await executeRefreshToken();

          const headersRetry = new Headers(options.headers);
          headersRetry.set("Authorization", `Bearer ${newAccessToken}`);
          if (!headersRetry.has("Content-Type")) {
            headersRetry.set("Content-Type", "application/json");
          }

          const retryResponse = await fetch(targetUrl, {
            ...options,
            headers: headersRetry
          });

          if (retryResponse.ok) {
            return await retryResponse.json();
          }
          response = retryResponse;
        } catch (refreshErr) {
          localStorage.removeItem("horizon_redis_profile");
          localStorage.removeItem("horizon_redis_refresh_tokens");
          localStorage.removeItem("horizon_current_user");

          window.location.hash = "login";
          window.location.pathname = "/auth";

          const err: any = new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          err.status = 401;
          throw err;
        }
      }

      let errorData: ApiResponse | null = null;
      let rawText = "";
      try {
        rawText = await response.text();
        if (rawText) {
          try {
            errorData = JSON.parse(rawText);
          } catch (_) {
            errorData = null;
          }
        }
      } catch (e) {
        errorData = null;
      }

      const extracted = errorData !== null ? extractBackendMessage(errorData) : null;

      let friendlyMsg = "";
      if (extracted !== null) {
        if (typeof extracted.message === "string" && extracted.message.trim().length > 0) {
          friendlyMsg = extracted.message.trim();
        }
      }

      if (friendlyMsg.length === 0) {
        if (response.status === 401) {
          friendlyMsg = "Tên đăng nhập hoặc mật khẩu không chính xác.";
        } else if (response.status === 400) {
          friendlyMsg = "Thông tin không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (response.status === 409) {
          friendlyMsg = "Email hoặc Tên đăng nhập đã tồn tại.";
        } else if (response.status === 404) {
          friendlyMsg = "Không tìm thấy tài khoản hoặc dữ liệu trên hệ thống.";
        } else {
          friendlyMsg = "Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.";
        }
      }

      const err: any = new Error(friendlyMsg);
      err.status = response.status;
      err.data = errorData;
      if (errorData !== null) {
        if (errorData.detail !== undefined) err.detail = errorData.detail;
        if (errorData.errorCode !== undefined) err.errorCode = errorData.errorCode;
        if (errorData.fieldErrors !== undefined) err.fieldErrors = errorData.fieldErrors;
      }
      if (extracted !== null) {
        err.extracted = extracted;
        if (err.fieldErrors === undefined && extracted.fieldErrors !== undefined) {
          err.fieldErrors = extracted.fieldErrors;
        }
      }
      throw err;
    }

    return await response.json();
  } catch (error) {
    console.warn(
      `[API Connection Info] URL: ${targetUrl} không thể kết nối. ` +
      `Điều này thường xảy ra nếu backend Spring Boot cục bộ (http://localhost:8080) chưa chạy. Origin hiện tại: ${window.location.origin}.`,
      error
    );
    throw error;
  }
}
