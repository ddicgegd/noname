/**
 * Subscription & Payment Service
 * Direct integration with Spring Boot ERP Subscriptions & Google Pay endpoints
 */

import { getApiBaseUrl, getUnifiedAccessToken } from "../lib/api";
import { getAppErrorMessage } from "../components/ui/AppErrorNotice";
import {
  ApiResponse,
  GooglePayWebRegisterRequest,
  OneTimePurchaseRequest,
  SubscriptionPlan,
  UserSubscription,
} from "../types/subscription";

/**
 * Lấy Access Token hợp lệ từ phiên đăng nhập thực tế của người dùng.
 * Trả về chuỗi rỗng nếu người dùng chưa đăng nhập để kích hoạt luồng yêu cầu đăng nhập.
 */
export function getEffectiveAccessToken(): string {
  const unified = getUnifiedAccessToken();
  if (unified && unified.trim().length > 0) {
    return unified.trim();
  }
  return "";
}

/**
 * 1. GET /api/v1/subscriptions/plans
 * Lấy danh sách các gói dịch vụ đang mở bán hiển thị lên Bảng giá / Thẻ Hologram
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/subscriptions/plans`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorDetail: any = response.status;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errJson.status?.message || errJson.title || response.status;
    } catch (_) {}
    throw new Error(getAppErrorMessage(errorDetail));
  }

  const json: ApiResponse<SubscriptionPlan[]> = await response.json();
  return json.data || [];
}

/**
 * 2. GET /api/v1/subscriptions/my
 * Lấy thông tin gói thuê bao hiện tại của User đang đăng nhập
 */
export async function getMySubscription(): Promise<UserSubscription | null> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/my`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return null;
    }
    let errorDetail: any = response.status;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errJson.status?.message || errJson.title || response.status;
    } catch (_) {}
    throw new Error(getAppErrorMessage(errorDetail));
  }

  const json: ApiResponse<UserSubscription | null> = await response.json();
  return json.data ?? null;
}

/**
 * 3. POST /api/v1/subscriptions/google-pay/register
 * Đăng ký gói qua Google Pay Web SDK (kích hoạt Free Trial hoặc thanh toán định kỳ)
 */
export async function registerGooglePaySubscription(
  payload: GooglePayWebRegisterRequest
): Promise<UserSubscription> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();
  if (!token) {
    throw new Error(getAppErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện giao dịch."));
  }

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/google-pay/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getAppErrorMessage(json.detail || json.message || json.status?.message || json.title || response.status));
  }

  return json.data;
}

/**
 * 4. POST /api/v1/subscriptions/purchase-onetime
 * Mua gói dịch vụ trả tiền 1 lần qua VNPay, MoMo, Thẻ quốc tế hoặc Chuyển khoản ngân hàng
 */
export async function purchaseOneTimeSubscription(
  payload: OneTimePurchaseRequest
): Promise<UserSubscription> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();
  if (!token) {
    throw new Error(getAppErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện giao dịch."));
  }

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/purchase-onetime`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getAppErrorMessage(json.detail || json.message || json.status?.message || json.title || response.status));
  }

  return json.data;
}

/**
 * 5. POST /api/v1/subscriptions/{id}/renew
 * Kích hoạt gia hạn trừ tiền định kỳ MIT và hạch toán tự động vào Fineract
 */
export async function renewSubscription(id: number): Promise<boolean> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();
  if (!token) {
    throw new Error(getAppErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện giao dịch."));
  }

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/${id}/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getAppErrorMessage(json.detail || json.message || json.status?.message || response.status));
  }

  return json.data ?? true;
}

/**
 * 6. POST /api/v1/subscriptions/{id}/cancel
 * Hủy tự động gia hạn gói
 */
export async function cancelSubscription(
  id: number,
  reason?: string
): Promise<UserSubscription> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();
  if (!token) {
    throw new Error(getAppErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện giao dịch."));
  }

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: reason || "Hủy gia hạn gói" }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getAppErrorMessage(json.detail || json.message || json.status?.message || response.status));
  }

  return json.data;
}
