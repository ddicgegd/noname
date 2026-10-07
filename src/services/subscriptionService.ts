/**
 * Subscription & Payment Service
 * Direct integration with Spring Boot ERP Subscriptions & Google Pay endpoints
 */

import { getApiBaseUrl, getUnifiedAccessToken } from "../lib/api";
import {
  ApiResponse,
  GooglePayWebRegisterRequest,
  OneTimePurchaseRequest,
  SubscriptionPlan,
  UserSubscription,
} from "../types/subscription";

export const TEST_USER_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxQGV4YW1wbGUuY29tIiwiaWF0IjoxNzkxMzU3OTMzLCJleHAiOjE3OTE0NDQzMzN9.H0bS8sNeela6lOHsJtvUgZDpFfR44nkGtBVpFFuyNJM";

/**
 * Lấy Access Token hợp lệ: Ưu tiên token thật của user đang đăng nhập;
 * nếu chưa đăng nhập, tự động dùng token test để trải nghiệm kiểm thử ngay lập tức.
 */
export function getEffectiveAccessToken(): string {
  const unified = getUnifiedAccessToken();
  if (unified && unified.trim().length > 0) {
    return unified;
  }
  return TEST_USER_ACCESS_TOKEN;
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
    throw new Error(`Không thể lấy danh sách gói (HTTP ${response.status})`);
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

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/my`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin gói hiện tại (HTTP ${response.status})`);
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

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/google-pay/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg =
      json.detail ||
      json.status?.message ||
      json.title ||
      "Đăng ký qua Google Pay thất bại";
    throw new Error(errorMsg);
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

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/purchase-onetime`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg =
      json.detail ||
      json.status?.message ||
      json.title ||
      "Thanh toán mua gói 1 lần thất bại";
    throw new Error(errorMsg);
  }

  return json.data;
}

/**
 * 5. POST /api/v1/subscriptions/{id}/cancel
 * Hủy tự động gia hạn gói
 */
export async function cancelSubscription(
  id: number,
  reason?: string
): Promise<UserSubscription> {
  const baseUrl = getApiBaseUrl();
  const token = getEffectiveAccessToken();

  const response = await fetch(`${baseUrl}/api/v1/subscriptions/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: reason || "Hủy gia hạn gói" }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg =
      json.detail || json.status?.message || "Hủy gia hạn gói thất bại";
    throw new Error(errorMsg);
  }

  return json.data;
}
