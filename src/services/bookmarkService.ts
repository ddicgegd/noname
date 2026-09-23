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
  color?: string;
  size?: string;
  unitPrice: number;
  salePrice: number;
  quantity: number;
  subTotal: number;
  isAvailable?: boolean;
  stock?: number;
  addedAt?: number;
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
  createdAt?: number;
  updatedAt?: number;
  items: BookmarkItem[];
}

export interface BookmarkApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: number;
}

export const BOOKMARK_UPDATED_EVENT = "bookmark-updated";

export function getBookmarkTimestamp(bookmark: Partial<BookmarkData>): number {
  if (bookmark.updatedAt) return bookmark.updatedAt;
  if (bookmark.createdAt) return bookmark.createdAt;
  if (bookmark.expiresAtEpochMs) return bookmark.expiresAtEpochMs;
  return 0;
}

/**
 * Sắp xếp các phụ kiện bên trong gói theo thời gian bấm thêm mới nhất lên trên
 */
export function sortBookmarkItemsNewestFirst(items: BookmarkItem[]): BookmarkItem[] {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

/**
 * Sắp xếp danh sách bookmark: Các gói bookmark mới nhất (updatedAt / createdAt) luôn xếp ở trên cùng,
 * đồng thời các items bên trong từng gói cũng được sắp xếp theo thời gian mới nhất.
 */
export function sortBookmarksNewestFirst(list: BookmarkData[]): BookmarkData[] {
  return [...list]
    .map((bm) => ({
      ...bm,
      items: sortBookmarkItemsNewestFirst(bm.items || []),
    }))
    .sort((a, b) => {
      const timeA = getBookmarkTimestamp(a);
      const timeB = getBookmarkTimestamp(b);
      if (timeB !== timeA) return timeB - timeA;
      return (b.expiresAtEpochMs || 0) - (a.expiresAtEpochMs || 0);
    });
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

const LOCAL_BOOKMARKS_PREFIX = "horizon_bookmark_";

export function getLocalBookmark(mainSku: string): BookmarkData | null {
  if (typeof window === "undefined" || !mainSku) return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_BOOKMARKS_PREFIX}${mainSku}`);
    if (!raw) return null;
    const data: BookmarkData = JSON.parse(raw);
    if (data && Array.isArray(data.items) && data.items.length > 0) {
      if (data.expiresAtEpochMs && Date.now() > data.expiresAtEpochMs) {
        localStorage.removeItem(`${LOCAL_BOOKMARKS_PREFIX}${mainSku}`);
        return null;
      }
      return data;
    }
  } catch (_) {}
  return null;
}

export function saveLocalBookmark(mainSku: string, data: BookmarkData): void {
  if (typeof window === "undefined" || !mainSku || !data) return;
  try {
    const existingRaw = localStorage.getItem(`${LOCAL_BOOKMARKS_PREFIX}${mainSku}`);
    if (existingRaw) {
      try {
        const existingData: BookmarkData = JSON.parse(existingRaw);
        if (existingData && Array.isArray(existingData.items) && existingData.items.length > 0) {
          const itemMap = new Map<string, BookmarkItem>();
          for (const it of existingData.items) {
            if (it && it.sku) itemMap.set(it.sku, it);
          }
          if (Array.isArray(data.items)) {
            data.items = data.items.map((it) => {
              const prev = itemMap.get(it.sku);
              if (prev) {
                return {
                  ...prev,
                  ...it,
                  productName: (it.productName && it.productName !== it.sku) ? it.productName : prev.productName,
                  imageUrl: it.imageUrl || prev.imageUrl,
                  attributesTitle: it.attributesTitle || prev.attributesTitle,
                  unitPrice: it.unitPrice || prev.unitPrice,
                  salePrice: it.salePrice || prev.salePrice,
                };
              }
              return it;
            });
          }
        }
      } catch (_) {}
    }
    localStorage.setItem(`${LOCAL_BOOKMARKS_PREFIX}${mainSku}`, JSON.stringify(data));
  } catch (_) {}
}

export function deleteLocalBookmark(mainSku: string): void {
  if (typeof window === "undefined" || !mainSku) return;
  try {
    localStorage.removeItem(`${LOCAL_BOOKMARKS_PREFIX}${mainSku}`);
  } catch (_) {}
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
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getBookmarkHeaders(),
      body: JSON.stringify({ items }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result?.data) {
        saveLocalBookmark(mainSku, result.data);
      }
      dispatchBookmarkUpdated();
      return result;
    }
  } catch (err) {
    console.warn("Lỗi kết nối API staging bookmark:", err);
  }

  // Fallback: update local bookmark cache
  const local = getLocalBookmark(mainSku);
  const totalCount = items.reduce((s, i) => s + (i.quantity || 1), 0);
  const fallbackData: BookmarkData = local || {
    mainSku,
    totalItems: totalCount,
    totalPrice: 0,
    totalSalePrice: 0,
    totalDiscount: 0,
    ttlSecondsRemaining: 3600,
    expiresAtEpochMs: Date.now() + 3600 * 1000,
    formattedRemainingTime: "59 phút 59 giây",
    items: items.map(i => ({
      sku: i.sku,
      productName: i.sku,
      imageUrl: "",
      unitPrice: 0,
      salePrice: 0,
      quantity: i.quantity,
      subTotal: 0,
      isAvailable: true,
      stock: 999
    }))
  };

  saveLocalBookmark(mainSku, fallbackData);
  dispatchBookmarkUpdated();
  return { success: true, data: fallbackData };
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
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getBookmarkHeaders(),
      body: JSON.stringify({ sku, quantity }),
    });

    if (response.ok) {
      const result = await response.json();
      dispatchBookmarkUpdated();
      return result;
    }
  } catch (_) {}

  dispatchBookmarkUpdated();
  return {
    success: true,
    data: {
      mainSku,
      item: { sku, quantity },
      totalItemsInBookmark: quantity,
      ttlSecondsRemaining: 7 * 86400
    }
  };
}

/**
  * Gia hạn/chuyển đổi Bookmark từ Staging (1h) sang Persisted (7 ngày)
  * POST /api/bookmarks/{mainSku}/persist
  */
export async function persistStagedBookmark(
  mainSku: string
): Promise<BookmarkApiResponse<BookmarkData>> {
  const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/persist`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getBookmarkHeaders(),
    });

    if (response.ok) {
      const result = await response.json();
      if (result?.data) {
        saveLocalBookmark(mainSku, result.data);
      }
      dispatchBookmarkUpdated();
      return result;
    }
  } catch (_) {}

  // Fallback: extend local expiry to 7 days
  const local = getLocalBookmark(mainSku);
  if (local) {
    local.expiresAtEpochMs = Date.now() + 7 * 86400 * 1000;
    local.ttlSecondsRemaining = 7 * 86400;
    local.formattedRemainingTime = "7 ngày";
    saveLocalBookmark(mainSku, local);
    dispatchBookmarkUpdated();
    return { success: true, data: local };
  }

  dispatchBookmarkUpdated();
  return { success: true, data: null as any };
}

/**
 * 3. Lấy chi tiết Bookmark theo sản phẩm chính (GET)
 * GET /api/bookmarks/{mainSku}
 */
export async function getBookmarkDetails(mainSku: string): Promise<BookmarkData | null> {
  try {
    const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getBookmarkHeaders(),
    });

    if (response.ok) {
      const json = await response.json();
      const data = json?.data || null;
      if (data && data.totalItems > 0) {
        saveLocalBookmark(mainSku, data);
        return data;
      }
    }
  } catch (_) {}

  // Fallback to local cache if API failed or returned 404
  return getLocalBookmark(mainSku);
}

/**
 * Lấy tất cả Bookmark của tài khoản hiện tại (GET)
 * GET /api/bookmarks
 */
export async function getAllBookmarks(): Promise<BookmarkData[]> {
  const result: BookmarkData[] = [];
  const seenSkus = new Set<string>();

  try {
    const url = `${getBaseUrl()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getBookmarkHeaders(),
    });

    if (response.ok) {
      const json = await response.json();
      const serverList: BookmarkData[] = Array.isArray(json?.data) ? json.data : [];
      for (const bm of serverList) {
        if (bm && bm.mainSku && bm.totalItems > 0) {
          result.push(bm);
          seenSkus.add(bm.mainSku);
          saveLocalBookmark(bm.mainSku, bm);
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi fetch bookmarks từ API:", err);
  }

  // Merge with local bookmarks not already in server response
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_BOOKMARKS_PREFIX)) {
          const sku = key.slice(LOCAL_BOOKMARKS_PREFIX.length);
          if (!seenSkus.has(sku)) {
            const cached = getLocalBookmark(sku);
            if (cached && cached.totalItems > 0) {
              result.push(cached);
              seenSkus.add(sku);
            }
          }
        }
      }
    } catch (_) {}
  }

  return sortBookmarksNewestFirst(result);
}

/**
 * 4. Xóa 1 phụ kiện khỏi Bookmark
 * DELETE /api/bookmarks/{mainSku}/items/{sku}
 */
export async function removeBookmarkItem(
  mainSku: string,
  sku: string
): Promise<BookmarkApiResponse<{ mainSku: string; removedSku: string; remainingItemsCount: number }>> {
  // Update local cache
  const local = getLocalBookmark(mainSku);
  if (local) {
    local.items = local.items.filter(i => i.sku !== sku);
    local.totalItems = local.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    if (local.totalItems > 0) {
      saveLocalBookmark(mainSku, local);
    } else {
      deleteLocalBookmark(mainSku);
    }
  }

  try {
    const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}/items/${encodeURIComponent(sku)}`;
    await fetch(url, {
      method: "DELETE",
      headers: getBookmarkHeaders(),
    });
  } catch (_) {}

  dispatchBookmarkUpdated();
  return {
    success: true,
    data: { mainSku, removedSku: sku, remainingItemsCount: local ? local.totalItems : 0 }
  };
}

/**
 * 5. Xóa toàn bộ Bookmark của sản phẩm chính
 * DELETE /api/bookmarks/{mainSku}
 */
export async function clearBookmark(
  mainSku: string
): Promise<BookmarkApiResponse<{ mainSku: string }>> {
  deleteLocalBookmark(mainSku);
  try {
    const url = `${getBaseUrl()}/${encodeURIComponent(mainSku)}`;
    await fetch(url, {
      method: "DELETE",
      headers: getBookmarkHeaders(),
    });
  } catch (_) {}

  dispatchBookmarkUpdated();
  return {
    success: true,
    data: { mainSku }
  };
}
