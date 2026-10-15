/**
 * Centralized API Integration Helper for Horizon Cloud
 */

import { ApiResponse } from "../types/api";
import { extractBackendMessage } from "./responseExtractor";
import { STORAGE_KEYS } from "./storageKeys";

/**
 * Lấy API Base URL chuẩn hóa:
 * 1. Đọc STORAGE_KEYS.CUSTOM_API_BASE_URL từ localStorage nếu đang ở môi trường trình duyệt.
 * 2. Fallback về biến môi trường VITE_API_BASE_URL hoặc mặc định http://localhost:8080.
 * Luôn cắt bỏ trailing slash (/).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_API_BASE_URL);
      if (custom) {
        const trimmed = custom.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          return trimmed.replace(/\/+$/, "");
        }
      }
    } catch {}
  }

  let envBaseUrl: string | undefined;
  if (typeof import.meta === "object" && import.meta !== null && "env" in import.meta) {
    const metaEnv = import.meta.env;
    if (typeof metaEnv === "object" && metaEnv !== null && "VITE_API_BASE_URL" in metaEnv) {
      const val = metaEnv.VITE_API_BASE_URL;
      if (typeof val === "string") {
        envBaseUrl = val;
      }
    }
  }
  const fallback = typeof envBaseUrl === "string" && envBaseUrl.trim() ? envBaseUrl.trim() : "http://localhost:8080";
  return fallback.replace(/\/+$/, "");
}

/**
 * Thiết lập URL máy chủ API tùy chỉnh, lưu vào localStorage và phát event đồng bộ.
 */
export function setApiBaseUrl(url: string): void {
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid endpoint URL: ${trimmed}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid endpoint URL: protocol must be http or https");
  }
  const normalized = trimmed.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_BASE_URL, normalized);
    } catch {}
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("api-base-url-changed", { detail: { url: normalized } })
    );
  }
}

/**
 * Đặt lại API Base URL về mặc định của hệ thống.
 */
export function resetApiBaseUrl(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_BASE_URL);
    } catch {}
    const defaultUrl = getApiBaseUrl();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("api-base-url-changed", { detail: { url: defaultUrl } })
    );
  }
}

export interface PingResult {
  success: boolean;
  latencyMs: number;
  status?: number;
  error?: string;
}

/**
 * Đo độ trễ kết nối mạng tới endpoint chỉ định hoặc endpoint hiện tại.
 */
export async function pingEndpoint(targetUrl?: string): Promise<PingResult> {
  const baseUrl = targetUrl && targetUrl.trim() ? targetUrl.trim().replace(/\/+$/, "") : getApiBaseUrl();
  const pingUrl = `${baseUrl}/api/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  const startTime = performance.now();

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      latencyMs,
      status: res.status,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs,
      error: errorMsg,
    };
  }
}

/**
 * Tự động quét và loại bỏ các cấu hình lạ / ngrok chết tồn dư trong localStorage
 */
export function sanitizeLegacyStorageConfigurations(): void {
  if (typeof window === "undefined") return;
  try {
    const legacyKeys = [
      "horizon_api_base_url",
      "api_base_url",
      "use_api_proxy",
      "horizon_verify_api_path",
      "verify_api_path"
    ];
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
  } catch (_) {}
}

// Tự động thực thi dọn dẹp khi tải thư viện API trên trình duyệt
if (typeof window !== "undefined") {
  sanitizeLegacyStorageConfigurations();
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

  // Check for 401 Unauthorized (exclude credential-change/status which returns 401 when session is not yet active)
  const isStatusCheckEndpoint = urlString.includes("/api/auth/credential-change/status");
  if (response.status === 401 && !isAuthEndpoint && !isStatusCheckEndpoint) {
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
  const method = (options.method || "GET").toUpperCase();
  // Do NOT set Content-Type on GET/HEAD requests to prevent unnecessary CORS preflight
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type") && !(typeof FormData !== "undefined" && options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/html;q=0.9, */*;q=0.8");
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
      if (response.status >= 500) {
        friendlyMsg = "Lỗi hệ thống. Vui lòng thử lại sau.";
      } else if (extracted !== null) {
        if (typeof extracted.message === "string" && extracted.message.trim().length > 0) {
          const rawMsg = extracted.message.trim();
          const lowerRaw = rawMsg.toLowerCase();
          if (
            lowerRaw.includes("unexpected error") ||
            lowerRaw.includes("internal server") ||
            lowerRaw.includes("please try again later") ||
            lowerRaw.includes("an error occurred")
          ) {
            friendlyMsg = "Lỗi hệ thống. Vui lòng thử lại sau.";
          } else {
            friendlyMsg = rawMsg;
          }
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
          friendlyMsg = "Lỗi hệ thống. Vui lòng thử lại sau.";
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
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const htmlText = await response.text();
      const isSuccess =
        htmlText.includes("icon-ring-success") ||
        htmlText.includes("thành công") ||
        htmlText.includes("Kích hoạt thành công") ||
        htmlText.includes("Quyền đổi thông tin đăng nhập đã được cấp") ||
        htmlText.includes("Quyền thay đổi đã kích hoạt");

      if (!isSuccess) {
        const errorMatch = htmlText.match(/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>([^<]+)<\/p>/i) || htmlText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const errorMsg = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, "").trim() : "Liên kết xác thực không hợp lệ hoặc đã hết hạn.";
        const err: any = new Error(errorMsg);
        err.status = 401;
        err.data = {
          status: { code: 401, message: errorMsg },
          message: errorMsg
        };
        throw err;
      }

      const successMsg = "Kích hoạt quyền thay đổi thành công! Bạn có 5 phút để hoàn tất cập nhật tên đăng nhập hoặc mật khẩu.";
      return {
        status: { code: 200, message: successMsg },
        data: successMsg,
        message: successMsg
      } as T;
    }
    return await response.json();
  } catch (error) {
    console.warn(`[API Connection Info] Không thể kết nối tới ${targetUrl}:`, error);
    throw error;
  }
}

/**
 * Chuẩn hóa URL tài nguyên hình ảnh (Avatar, Product, Banner)
 * - Nếu rỗng: trả về chuỗi rỗng ""
 * - Nếu đã là URL tuyệt đối (http://, https://, data:, blob:): giữ nguyên
 * - Nếu là Object Key hoặc đường dẫn tương đối (abc.jpg, /api/images/abc.jpg):
 *   chuẩn hóa thành URL endpoint công khai /api/images/{fileName}
 */
export function resolveMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const cleanName = trimmed
    .replace(/^\/+/, "")
    .replace(/^api\/images\//, "")
    .replace(/^api\/merchandise\/view-image\//, "");

  return `/api/images/${cleanName}`;
}
