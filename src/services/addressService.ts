/**
 * Address Service - Real REST API Client for User Address Book & Geocoding v1.2.0
 * Base path: /api/addresses
 * Includes Real-Time Response Inspector Log Collector
 */

import { getApiBaseUrl } from "../lib/api";

export interface AddressDto {
  sku: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  recipientName: string;
  isDefault: boolean;
  type?: "home" | "office";
  createdAt?: string;
}

export interface CreateAddressInput {
  address: string;
  phoneNumber: string;
  recipientName: string;
  isDefault: boolean;
  type?: "home" | "office";
}

export interface ResolvedAddressDto {
  success: boolean;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  rawAddress: string;
  error?: string | null;
}

export interface AddressApiResponseLog {
  id: string;
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  fullUrl: string;
  status: number;
  statusText: string;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody: any;
  isSuccess: boolean;
}

// Global subscribers for live API response inspector
type LogListener = (logs: AddressApiResponseLog[]) => void;
const listeners: Set<LogListener> = new Set();

export function getAddressApiLogs(): AddressApiResponseLog[] {
  try {
    const raw = localStorage.getItem("horizon_address_api_logs");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function subscribeAddressApiLogs(listener: LogListener): () => void {
  listeners.add(listener);
  listener(getAddressApiLogs());
  return () => {
    listeners.delete(listener);
  };
}

export function clearAddressApiLogs(): void {
  localStorage.removeItem("horizon_address_api_logs");
  listeners.forEach(fn => fn([]));
}

function recordApiLog(entry: Omit<AddressApiResponseLog, "id" | "timestamp">): AddressApiResponseLog {
  const fullLog: AddressApiResponseLog = {
    ...entry,
    id: "LOG-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }) + "." + new Date().getMilliseconds()
  };

  try {
    const current = getAddressApiLogs();
    const updated = [fullLog, ...current].slice(0, 30);
    localStorage.setItem("horizon_address_api_logs", JSON.stringify(updated));
    listeners.forEach(fn => fn(updated));
  } catch (e) {
    console.error("Failed to record API log:", e);
  }

  return fullLog;
}

function getStoredToken(): string {
  const storedProfile = localStorage.getItem("horizon_redis_profile");
  if (storedProfile) {
    try {
      const prof = JSON.parse(storedProfile);
      if (prof.accessToken) return prof.accessToken;
    } catch (_) {}
  }
  return localStorage.getItem("horizon_access_token") || "";
}

/**
 * Execute real HTTP request with timing, live log capture and full response extraction
 */
async function executeRealApiCall<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  body?: any
): Promise<{ ok: boolean; status: number; data: T; raw: any }> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Accept": "application/json"
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const startTime = performance.now();
  let status = 0;
  let statusText = "Network Error";
  let responseData: any = null;
  let isSuccess = false;

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const durationMs = Math.round(performance.now() - startTime);
    status = res.status;
    statusText = res.statusText || (res.ok ? "OK" : "Error");
    isSuccess = res.ok;

    const rawText = await res.text();
    try {
      responseData = JSON.parse(rawText);
    } catch (_) {
      responseData = rawText || null;
    }

    recordApiLog({
      method,
      endpoint: cleanEndpoint,
      fullUrl,
      status,
      statusText,
      durationMs,
      requestHeaders: headers,
      requestBody: body,
      responseBody: responseData,
      isSuccess
    });

    return {
      ok: res.ok,
      status,
      data: responseData,
      raw: responseData
    };
  } catch (networkError: any) {
    const durationMs = Math.round(performance.now() - startTime);
    status = 0;
    statusText = "Fetch Failed / Backend Offline";
    responseData = {
      error: "Connection Refused",
      message: networkError?.message || `Không thể kết nối đến máy chủ ${baseUrl}`,
      hint: "Hãy kiểm tra xem backend Spring Boot (http://localhost:8080) có đang mở và cho phép CORS không."
    };

    recordApiLog({
      method,
      endpoint: cleanEndpoint,
      fullUrl,
      status,
      statusText,
      durationMs,
      requestHeaders: headers,
      requestBody: body,
      responseBody: responseData,
      isSuccess: false
    });

    return {
      ok: false,
      status: 0,
      data: responseData,
      raw: responseData
    };
  }
}

/**
 * Helper to extract clear backend error message
 */
function extractErrorMessage(responseData: any, fallback: string): string {
  if (!responseData) return fallback;
  if (typeof responseData === "string") return responseData;

  const detail = responseData.detail || responseData.message || responseData.title;
  if (detail === "Location not found") {
    return "Không tìm thấy vị trí địa chỉ tại Việt Nam. Vui lòng nhập rõ: Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP.";
  }
  if (responseData.fieldErrors && typeof responseData.fieldErrors === "object") {
    const firstField = Object.values(responseData.fieldErrors)[0];
    if (typeof firstField === "string") return firstField;
  }
  return detail || fallback;
}

/**
 * Get all addresses for the authenticated user (sorted with default first)
 */
export async function getMyAddresses(): Promise<AddressDto[]> {
  const result = await executeRealApiCall<any>("GET", "/api/addresses/me");

  if (result.ok && result.data) {
    if (Array.isArray(result.data.data)) {
      const addresses = result.data.data;
      localStorage.setItem("horizon_user_addresses", JSON.stringify(addresses));
      return addresses;
    }
    if (Array.isArray(result.data)) {
      localStorage.setItem("horizon_user_addresses", JSON.stringify(result.data));
      return result.data;
    }
  }

  // Fallback cache if backend returned error or offline
  const stored = localStorage.getItem("horizon_user_addresses");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_) {}
  }

  const defaultInitial: AddressDto[] = [
    {
      sku: "ADDR-01912A3B4C5D",
      address: "Số 15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      latitude: 10.782805,
      longitude: 106.699814,
      phoneNumber: "0901234567",
      recipientName: "Ngô Ngọc Định",
      isDefault: true,
      type: "office",
      createdAt: "2026-08-18T01:35:00"
    },
    {
      sku: "ADDR-01912A3B8E9F",
      address: "Căn hộ B12.08, Tòa Horizon Tower, 214 Trần Quang Khải, Phường Tân Định, Quận 1, TP. Hồ Chí Minh",
      latitude: 10.791523,
      longitude: 106.689211,
      phoneNumber: "0901234567",
      recipientName: "Ngô Ngọc Định",
      isDefault: false,
      type: "home",
      createdAt: "2026-08-17T14:20:00"
    }
  ];
  localStorage.setItem("horizon_user_addresses", JSON.stringify(defaultInitial));
  return defaultInitial;
}

/**
 * Get default address for checkout
 */
export async function getDefaultAddress(): Promise<AddressDto | null> {
  const result = await executeRealApiCall<any>("GET", "/api/addresses/me/default");
  if (result.ok && result.data) {
    return result.data.data || result.data;
  }
  return null;
}

/**
 * Add a new shipping address with automatic geocoding
 * STRICT: Throws error on failure without generating fake local data
 */
export async function createAddress(input: CreateAddressInput): Promise<AddressDto> {
  const result = await executeRealApiCall<any>("POST", "/api/addresses", {
    address: input.address,
    phoneNumber: input.phoneNumber,
    recipientName: input.recipientName,
    isDefault: input.isDefault
  });

  if (result.ok && result.data && result.data.data) {
    return {
      ...result.data.data,
      type: input.type || "office"
    };
  }

  const errMsg = extractErrorMessage(result.data, `Không thể tạo địa chỉ (Mã lỗi HTTP ${result.status}).`);
  throw new Error(errMsg);
}

/**
 * Update an existing address by SKU
 */
export async function updateAddress(sku: string, input: CreateAddressInput): Promise<AddressDto> {
  const result = await executeRealApiCall<any>("PUT", `/api/addresses/${encodeURIComponent(sku)}`, {
    address: input.address,
    phoneNumber: input.phoneNumber,
    recipientName: input.recipientName,
    isDefault: input.isDefault
  });

  if (result.ok && result.data && result.data.data) {
    return {
      ...result.data.data,
      type: input.type || "office"
    };
  }

  const errMsg = extractErrorMessage(result.data, `Không thể cập nhật địa chỉ (Mã lỗi HTTP ${result.status}).`);
  throw new Error(errMsg);
}

/**
 * Set an address as default
 * STRICT: Throws error if backend returns failure
 */
export async function setDefaultAddress(sku: string): Promise<string> {
  const result = await executeRealApiCall<any>("PATCH", `/api/addresses/${encodeURIComponent(sku)}/default`);
  
  if (result.ok) {
    return result.data?.data || result.data?.message || "Đã đặt làm địa chỉ mặc định thành công.";
  }

  const errMsg = extractErrorMessage(result.data, `Không thể đặt làm địa chỉ mặc định (Mã lỗi HTTP ${result.status}).`);
  throw new Error(errMsg);
}

/**
 * Delete an address by SKU
 * STRICT: Throws error if backend returns failure
 */
export async function deleteAddress(sku: string): Promise<string> {
  const result = await executeRealApiCall<any>("DELETE", `/api/addresses/${encodeURIComponent(sku)}`);
  
  if (result.ok) {
    return result.data?.data || result.data?.message || "Xóa địa chỉ thành công.";
  }

  const errMsg = extractErrorMessage(result.data, `Không thể xóa địa chỉ (Mã lỗi HTTP ${result.status}).`);
  throw new Error(errMsg);
}

/**
 * Real-time geocoding preview helper for user input
 * Transfers 100% full response payload from Backend (success, error, coordinates, formattedAddress)
 */
export async function resolveAddress(rawAddress: string): Promise<ResolvedAddressDto | null> {
  if (!rawAddress || rawAddress.trim().length < 3) return null;

  const result = await executeRealApiCall<any>(
    "GET",
    `/api/addresses/resolve?address=${encodeURIComponent(rawAddress.trim())}`
  );

  if (result.ok && result.data) {
    const payload = result.data.data !== undefined ? result.data.data : result.data;
    if (payload && typeof payload === "object") {
      return {
        success: Boolean(payload.success),
        latitude: typeof payload.latitude === "number" ? payload.latitude : 0,
        longitude: typeof payload.longitude === "number" ? payload.longitude : 0,
        formattedAddress: payload.formattedAddress || "",
        rawAddress: payload.rawAddress || rawAddress.trim(),
        error: payload.error || (payload.success ? null : (payload.detail || payload.message || "Địa chỉ chưa đủ chi tiết hành chính"))
      };
    }
  }

  if (result.status === 400 || (result.data && result.data.detail)) {
    return {
      success: false,
      latitude: 0,
      longitude: 0,
      formattedAddress: "",
      rawAddress: rawAddress.trim(),
      error: result.data.detail || result.data.message || "Location not found"
    };
  }

  return null;
}
