/**
 * Centralized API Integration Helper for Horizon Cloud
 */

import { ApiResponse } from "../types/api";
import { extractBackendMessage } from "./responseExtractor";
import { STORAGE_KEYS } from "./storageKeys";

export function getApiBaseUrl(): string {
  return ((import.meta as any).env?.VITE_API_BASE_URL as string) || "http://localhost:8080";
}

export function isProxyEnabled(): boolean {
  return false;
}

export function setProxyEnabled(_enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.USE_API_PROXY, "false");
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
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || localStorage.getItem("horizon_device_id");
  if (!deviceId) {
    deviceId = "dev-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
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

export function getUnifiedAccessToken(): string {
  const directToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem("horizon_access_token");
  if (directToken) return directToken;

  try {
    const profileRaw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      if (parsed.accessToken) return parsed.accessToken;
    }
  } catch (_) {}

  try {
    const userRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (parsed.accessToken) return parsed.accessToken;
    }
  } catch (_) {}

  return "";
}

export function getUnifiedRefreshToken(): string {
  const directRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || localStorage.getItem("horizon_refresh_token");
  if (directRefresh) return directRefresh;

  const deviceId = getClientDeviceInfo().deviceId;

  try {
    const tokensRaw = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKENS_MAP) || localStorage.getItem("horizon_redis_refresh_tokens");
    if (tokensRaw) {
      const tokens = JSON.parse(tokensRaw);
      if (tokens[deviceId]?.token) {
        return tokens[deviceId].token;
      }
      // Fallback: Check any device key in the stored map
      const values = Object.values(tokens) as any[];
      for (const val of values) {
        if (typeof val === "string" && val.length > 0) return val;
        if (val?.token && typeof val.token === "string" && val.token.length > 0) return val.token;
      }
    }
  } catch (_) {}

  try {
    const profileRaw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      if (parsed.refreshToken) return parsed.refreshToken;
    }
  } catch (_) {}

  return "";
}

// Singleton Promise to prevent parallel duplicate refresh calls
let refreshPromise: Promise<string> | null = null;

export async function executeRefreshToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const devInfo = getClientDeviceInfo();
      const refreshToken = getUnifiedRefreshToken();

      if (!refreshToken || refreshToken.trim().length === 0) {
        throw new Error("Không tìm thấy Refresh Token hợp lệ trên thiết bị này.");
      }

      const payload = {
        refreshToken,
        deviceInfo: devInfo
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
        throw new Error("Refresh token đã hết hạn hoặc không hợp lệ.");
      }

      const resData = await response.json();
      const newAccess = resData?.data?.accessToken || resData?.accessToken;
      const newRefresh = resData?.data?.refreshToken || resData?.refreshToken || refreshToken;

      if (!newAccess) {
        throw new Error("Cấu trúc phản hồi Refresh Token không hợp lệ.");
      }

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccess);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);

      // Update user profile in localStorage
      try {
        const profileRaw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
        const profile = profileRaw ? JSON.parse(profileRaw) : {};
        profile.accessToken = newAccess;
        profile.refreshToken = newRefresh;
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      } catch (_) {}

      // Update refresh tokens dictionary
      try {
        const tokensRaw = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKENS_MAP) || localStorage.getItem("horizon_redis_refresh_tokens");
        const tokensObj = tokensRaw ? JSON.parse(tokensRaw) : {};
        tokensObj[devInfo.deviceId] = {
          token: newRefresh,
          deviceInfo: devInfo
        };
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKENS_MAP, JSON.stringify(tokensObj));
      } catch (_) {}

      // Update current user cache
      try {
        const userRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.accessToken = newAccess;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
      } catch (_) {}

      console.info("[Auth] Tự động làm mới Access Token thành công!");
      return newAccess;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enhanced fetch with automatic 401 retry interceptor
 */
export async function unifiedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isAuthEndpoint = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh-token"].some(u => urlString.includes(u));

  // Automatically attach access token if Authorization header is missing and token is available
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization") && !isAuthEndpoint) {
    const currentToken = getUnifiedAccessToken();
    if (currentToken) {
      headers.set("Authorization", currentToken.startsWith("Bearer ") ? currentToken : `Bearer ${currentToken}`);
    }
  }

  let response = await fetch(input, {
    ...init,
    headers
  });

  // Check for 401 Unauthorized
  if (response.status === 401 && !isAuthEndpoint) {
    console.warn(`[Auth] Phát hiện 401 từ ${urlString}. Đang thực hiện Refresh Token...`);
    try {
      const newAccessToken = await executeRefreshToken();
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      response = await fetch(input, {
        ...init,
        headers: retryHeaders
      });
    } catch (refreshErr) {
      console.warn("[Auth] Refresh token thất bại:", refreshErr);
      // Clean stale session
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKENS_MAP);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem("horizon_redis_profile");
      localStorage.removeItem("horizon_redis_refresh_tokens");
      localStorage.removeItem("horizon_current_user");
      localStorage.removeItem("horizon_access_token");
      localStorage.removeItem("horizon_refresh_token");
    }
  }

  return response;
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
    const response = await unifiedFetch(targetUrl, {
      ...options,
      headers
    });

    if (!response.ok) {
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
          friendlyMsg = "Phiên làm việc đã hết hạn hoặc thông tin đăng nhập không hợp lệ.";
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
      `Điều này thường xảy ra nếu backend Spring Boot cục bộ (${baseUrl}) chưa chạy.`,
      error
    );
    throw error;
  }
}
