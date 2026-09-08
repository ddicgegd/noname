/**
 * Bookmark Service
 * Integrates Frontend with Backend Bookmark Service (Phụ kiện mua cùng tại PDP)
 * Base URL: /api/bookmarks (via backend http://localhost:8080)
 */

import { getApiBaseUrl, getUnifiedAccessToken } from "@/lib/api";
import { getOrCreateGuestId } from "./cartService";

export interface BookmarkItem {
  sku: string;
  productName: string;
  imageUrl: string;
  attributesTitle?: string;
  unitPrice: number;
  salePrice: number;
  quantity: number;
  subTotal: number;
  isAvailable?: boolean;
  stock?: number;
}

export interface BookmarkData {
  mainSku: string;
  totalItems: number;
  totalPrice: number;
  totalSalePrice: number;
  totalDiscount: number;
  ttlSecondsRemaining?: number;
  expiresAtEpochMs?: number;
  formattedRemainingTime?: string;
  items: BookmarkItem[];
}

export interface BookmarkApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: number;
}

export const BOOKMARK_UPDATED_EVENT = "bookmark-updated";
const LOCAL_STORAGE_BOOKMARK_CACHE_PREFIX = "horizon_cached_bookmark_";

export function getCachedBookmark(mainSku: string): BookmarkData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_BOOKMARK_CACHE_PREFIX}${mainSku}`);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function setCachedBookmark(mainSku: string, data: BookmarkData | null) {
  if (typeof window === "undefined") return;
  try {
    if (data) {
      localStorage.setItem(`${LOCAL_STORAGE_BOOKMARK_CACHE_PREFIX}${mainSku}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_BOOKMARK_CACHE_PREFIX}${mainSku}`);
    }
  } catch (_) {}
}

export function dispatchBookmarkUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BOOKMARK_UPDATED_EVENT));
  }
}

export function subscribeBookmarkUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BOOKMARK_UPDATED_EVENT, callback);
  return () => window.removeEventListener(BOOKMARK_UPDATED_EVENT, callback);
}

function getBookmarkHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getUnifiedAccessToken();
  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  } else {
    headers["X-Guest-Id"] = getOrCreateGuestId();
  }
  return headers;
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/bookmarks";
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  return `${base}/api/bookmarks`;
}

/**
 * 1. Lưu tạm thời danh sách chuẩn bị (Staging - TTL 1 giờ)
 * POST /api/bookmarks/{mainSku}/staging
 */
export async function stageBookmarkItems(
  mainSku: string,
  items: { sku: string; quantity: number }[]
): Promise<BookmarkApiResponse<BookmarkData>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/staging`;
  const response = await fetch(url, {
    method: "POST",
    headers: getBookmarkHeaders(),
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi staging bookmark (HTTP ${response.status})`);
  }

  const result = await response.json();
  if (result?.data) {
    setCachedBookmark(mainSku, result.data);
  }
  dispatchBookmarkUpdated();
  return result;
}

/**
 * 2. Thêm / Cộng dồn 1 phụ kiện khi bấm + (Persist - TTL 7 ngày)
 * POST /api/bookmarks/{mainSku}/items
 */
export async function persistBookmarkItem(
  mainSku: string,
  sku: string,
  quantity: number = 1
): Promise<BookmarkApiResponse<{ mainSku: string; item: { sku: string; quantity: number }; totalItemsInBookmark: number; ttlSecondsRemaining: number }>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/items`;
  const response = await fetch(url, {
    method: "POST",
    headers: getBookmarkHeaders(),
    body: JSON.stringify({ sku, quantity }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi lưu bookmark 7 ngày (HTTP ${response.status})`);
  }

  const result = await response.json();
  dispatchBookmarkUpdated();
  return result;
}

/**
  * Gia hạn/chuyển đổi Bookmark từ Staging (1h) sang Persisted (7 ngày)
  * POST /api/bookmarks/{mainSku}/persist
  */
export async function persistStagedBookmark(
  mainSku: string
): Promise<BookmarkApiResponse<BookmarkData>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/persist`;
  const response = await fetch(url, {
    method: "POST",
    headers: getBookmarkHeaders(),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi lưu bookmark 7 ngày (HTTP ${response.status})`);
  }

  const result = await response.json();
  if (result?.data) {
    setCachedBookmark(mainSku, result.data);
  }
  dispatchBookmarkUpdated();
  return result;
}

/**
 * 3. Lấy chi tiết Bookmark theo sản phẩm chính (GET)
 * GET /api/bookmarks/{mainSku}
 */
export async function getBookmarkDetails(mainSku: string): Promise<BookmarkData | null> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getBookmarkHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      const cached = getCachedBookmark(mainSku);
      if (cached && cached.totalItems > 0) {
        return cached;
      }
      return null;
    }
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi lấy bookmark (HTTP ${response.status})`);
  }

  const json = await response.json();
  const data = json?.data || null;
  if (data && data.totalItems > 0) {
    setCachedBookmark(mainSku, data);
  } else {
    setCachedBookmark(mainSku, null);
  }
  return data;
}

/**
 * Lấy tất cả Bookmark của tài khoản hiện tại (GET)
 * GET /api/bookmarks
 */
export async function getAllBookmarks(): Promise<BookmarkData[]> {
  try {
    const url = `${getBaseUrl()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getBookmarkHeaders(),
    });

    if (response.ok) {
      const json = await response.json();
      const serverList: BookmarkData[] = Array.isArray(json?.data) ? json.data : [];
      if (serverList.length > 0) {
        serverList.forEach((bm) => setCachedBookmark(bm.mainSku, bm));
        return serverList;
      }
    }
  } catch (err) {
    console.warn("Lỗi fetch bookmarks từ API:", err);
  }

  // Fallback cache hydration if offline or initial load
  if (typeof window !== "undefined") {
    try {
      const localList: BookmarkData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_BOOKMARK_CACHE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as BookmarkData;
            if (parsed && parsed.mainSku && (parsed.totalItems > 0 || parsed.items?.length > 0)) {
              localList.push(parsed);
            }
          }
        }
      }
      if (localList.length > 0) return localList;
    } catch (_) {}
  }

  return [];
}

/**
 * 4. Xóa 1 phụ kiện khỏi Bookmark
 * DELETE /api/bookmarks/{mainSku}/items/{sku}
 */
export async function removeBookmarkItem(
  mainSku: string,
  sku: string
): Promise<BookmarkApiResponse<{ mainSku: string; removedSku: string; remainingItemsCount: number }>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/items/${encodeURIComponent(sku)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getBookmarkHeaders(),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi xóa phụ kiện khỏi bookmark (HTTP ${response.status})`);
  }

  const result = await response.json();
  const cached = getCachedBookmark(mainSku);
  if (cached) {
    cached.items = (cached.items || []).filter((it) => it.sku !== sku);
    cached.totalItems = cached.items.reduce((s, it) => s + (it.quantity || 1), 0);
    cached.totalSalePrice = cached.items.reduce((s, it) => s + (it.salePrice || 0) * (it.quantity || 1), 0);
    cached.totalPrice = cached.items.reduce((s, it) => s + (it.unitPrice || it.salePrice || 0) * (it.quantity || 1), 0);
    cached.totalDiscount = Math.max(0, cached.totalPrice - cached.totalSalePrice);
    if (cached.items.length === 0) {
      setCachedBookmark(mainSku, null);
    } else {
      setCachedBookmark(mainSku, cached);
    }
  }
  dispatchBookmarkUpdated();
  return result;
}

/**
 * 5. Xóa toàn bộ Bookmark của sản phẩm chính
 * DELETE /api/bookmarks/{mainSku}
 */
export async function clearBookmark(
  mainSku: string
): Promise<BookmarkApiResponse<{ mainSku: string }>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getBookmarkHeaders(),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Lỗi xóa bookmark (HTTP ${response.status})`);
  }

  const result = await response.json();
  setCachedBookmark(mainSku, null);
  dispatchBookmarkUpdated();
  return result;
}
