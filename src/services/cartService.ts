/**
 * Shopping Cart GraphQL Service
 * Integrates Frontend with Shopping Cart GraphQL Gateway & Backend Services
 * Endpoint: /graphql (Gateway: http://localhost:4000/graphql)
 */

import { getUnifiedAccessToken, unifiedFetch } from "../lib/api";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type {
  Cart,
  CartItemInput,
  CartSummaryBadge,
  GraphQLErrorExtensions,
  ShoppingCartData,
  ShoppingCartResponse,
  CartCountResponse,
} from "../types/cart";

const CART_EVENT_NAME = "cart-updated";
const LOCAL_STORAGE_CART_CACHE_KEY = "horizon_cached_cart";

const EMPTY_CART: ShoppingCartData = {
  username: "",
  totalItems: 0,
  totalPrice: 0,
  totalSalePrice: 0,
  totalDiscount: 0,
  finalAmount: 0,
  items: [],
};

/**
 * Get locally cached cart for instant (0ms) hydration on page load
 */
export function getCachedCart(): ShoppingCartData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CART_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

/**
 * Save cart to local storage cache
 */
export function setCachedCart(cart?: ShoppingCartData | null) {
  if (typeof window === "undefined") return;
  try {
    if (cart) {
      localStorage.setItem(LOCAL_STORAGE_CART_CACHE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CART_CACHE_KEY);
    }
  } catch (_) {}
}

/**
 * Generate a UUID v4 string with cryptographic security
 */
function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or initialize guest_id from localStorage
 */
export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(STORAGE_KEYS.GUEST_ID) || localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = generateUuidV4();
    localStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}

/**
 * Clear guest_id from localStorage (used after mergeCart)
 */
export function clearGuestId(): void {
  localStorage.removeItem(STORAGE_KEYS.GUEST_ID);
  localStorage.removeItem("guest_id");
}

/**
 * Build standard headers for Cart GraphQL requests
 */
export function getCartHeaders(): HeadersInit {
  const guestId = getOrCreateGuestId();
  const token = getUnifiedAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Guest-Id": guestId,
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  return headers;
}

/**
 * Helper to dispatch cart update event across components
 */
export function notifyCartUpdated(cart?: ShoppingCartData | null) {
  if (typeof window !== "undefined") {
    if (cart) {
      setCachedCart(cart);
    }
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: cart }));
  }
}

/**
 * Subscribe to cart update events
 */
export function subscribeToCartUpdates(callback: (cart?: ShoppingCartData) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<ShoppingCartData>;
    callback(customEvt.detail);
  };
  window.addEventListener(CART_EVENT_NAME, handler);
  return () => window.removeEventListener(CART_EVENT_NAME, handler);
}

/**
 * Core GraphQL Executor for Shopping Cart API
 */
async function executeCartGraphql<T>(
  query: string,
  variables: Record<string, any> = {},
  isRetry = false
): Promise<T> {
  const guestId = variables.guestId || getOrCreateGuestId();
  const headers = getCartHeaders();

  const response = await unifiedFetch("/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { ...variables, guestId } }),
  });

  if (!response.ok && response.status === 401 && !isRetry) {
    // UNAUTHORIZED: Regenerate guest_id and retry once
    clearGuestId();
    getOrCreateGuestId();
    return executeCartGraphql<T>(query, variables, true);
  }

  const payload = await response.json().catch(() => ({}));

  if (payload.errors && payload.errors.length > 0) {
    const firstErr = payload.errors[0];
    const extensions: GraphQLErrorExtensions | undefined = firstErr.extensions;

    // Handle UNAUTHORIZED in extensions
    if (extensions?.errorCode === "UNAUTHORIZED" && !isRetry) {
      clearGuestId();
      getOrCreateGuestId();
      return executeCartGraphql<T>(query, variables, true);
    }

    const err = new Error(firstErr.message || "GraphQL Cart Error");
    (err as any).extensions = extensions;
    (err as any).errorCode = extensions?.errorCode;
    throw err;
  }

  return payload.data as T;
}

// -------------------------------------------------------------
// GraphQL Query / Mutation Definitions
// -------------------------------------------------------------

const GET_CART_COUNT_QUERY = `
  query GetCartCount($guestId: String) {
    getCartCount(guestId: $guestId) {
      status {
        code
        message
      }
      data
    }
  }
`;

const GET_CART_QUERY = `
  query GetCart($fields: [String], $include: [String], $guestId: String) {
    getCart(fields: $fields, include: $include, guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation AddToCart($items: [CartItemInput!]!, $guestId: String) {
    addToCart(items: $items, guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

const UPDATE_QUANTITY_MUTATION = `
  mutation UpdateQuantity($sku: String!, $quantity: Int!, $guestId: String) {
    updateCartItemQuantity(sku: $sku, quantity: $quantity, guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

const REMOVE_ITEM_MUTATION = `
  mutation RemoveCartItem($sku: String!, $guestId: String) {
    removeCartItem(sku: $sku, guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

const DELETE_CART_MUTATION = `
  mutation DeleteCart($skus: [String!], $guestId: String) {
    deleteCart(skus: $skus, guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

const MERGE_CART_MUTATION = `
  mutation MergeCart($guestId: String) {
    mergeCart(guestId: $guestId) {
      status {
        code
        message
      }
      data {
        username
        totalItems
        totalPrice
        totalSalePrice
        totalDiscount
        finalAmount
        items {
          sku
          productName
          imageUrl
          attributesTitle
          unitPrice
          salePrice
          quantity
          subTotal
          isAvailable
          stock
          specifications
          promotions
        }
      }
    }
  }
`;

// -------------------------------------------------------------
// Public Service Operations
// -------------------------------------------------------------

/**
 * 1. Fast Path: Lấy số lượng Badge Header (getCartCount)
 */
export async function getCartBadge(guestId?: string): Promise<CartSummaryBadge> {
  try {
    const data = await executeCartGraphql<{ getCartCount: CartCountResponse }>(
      GET_CART_COUNT_QUERY,
      { guestId: guestId || getOrCreateGuestId() }
    );
    const count = data?.getCartCount?.data ?? 0;
    return { totalItems: count };
  } catch (error) {
    console.warn("[cartService] getCartBadge failed:", error);
    return { totalItems: 0 };
  }
}

/**
 * Fast Path: Lấy số lượng nguyên thủy
 */
export async function getCartCount(guestId?: string): Promise<number> {
  try {
    const data = await executeCartGraphql<{ getCartCount: CartCountResponse }>(
      GET_CART_COUNT_QUERY,
      { guestId: guestId || getOrCreateGuestId() }
    );
    return data?.getCartCount?.data ?? 0;
  } catch (error) {
    console.warn("[cartService] getCartCount failed:", error);
    return 0;
  }
}

/**
 * 2. Lấy chi tiết giỏ hàng đầy đủ (getCart)
 */
export async function getCart(params?: {
  fields?: string[];
  include?: string[];
  guestId?: string;
}): Promise<ShoppingCartData> {
  const guestId = params?.guestId || getOrCreateGuestId();
  const data = await executeCartGraphql<{ getCart: ShoppingCartResponse }>(
    GET_CART_QUERY,
    {
      fields: params?.fields,
      include: params?.include,
      guestId,
    }
  );

  const cartData = data?.getCart?.data || { ...EMPTY_CART };
  setCachedCart(cartData);
  return cartData;
}

/**
 * Alias cho getCart (Full Cart Page & Checkout)
 */
export async function getFullCart(guestId?: string): Promise<ShoppingCartData> {
  return getCart({ guestId });
}

/**
 * Alias cho Mini Cart Drawer (có thể tối ưu Sparse Fieldset)
 */
export async function getMiniCart(guestId?: string): Promise<ShoppingCartData> {
  return getCart({
    fields: ["totalItems", "finalAmount", "items"],
    guestId,
  });
}

/**
 * 3. Thêm sản phẩm vào giỏ (addToCart)
 */
export async function addToCart(
  items: CartItemInput[],
  guestId?: string
): Promise<ShoppingCartData> {
  const data = await executeCartGraphql<{ addToCart: ShoppingCartResponse }>(
    ADD_TO_CART_MUTATION,
    { items, guestId: guestId || getOrCreateGuestId() }
  );

  const cartData = data?.addToCart?.data || { ...EMPTY_CART };
  notifyCartUpdated(cartData);
  return cartData;
}

/**
 * 4. Cập nhật số lượng sản phẩm (updateCartItemQuantity)
 * Lưu ý: Khi quantity = 0, backend tự động xóa SKU khỏi giỏ hàng.
 */
export async function updateCartItemQuantity(
  sku: string,
  quantity: number,
  guestId?: string
): Promise<ShoppingCartData> {
  const data = await executeCartGraphql<{
    updateCartItemQuantity: ShoppingCartResponse;
  }>(UPDATE_QUANTITY_MUTATION, {
    sku,
    quantity,
    guestId: guestId || getOrCreateGuestId(),
  });

  const cartData = data?.updateCartItemQuantity?.data || { ...EMPTY_CART };
  notifyCartUpdated(cartData);
  return cartData;
}

/**
 * 5. Xóa 1 sản phẩm khỏi giỏ (removeCartItem)
 */
export async function removeCartItem(
  sku: string,
  guestId?: string
): Promise<ShoppingCartData> {
  const data = await executeCartGraphql<{
    removeCartItem: ShoppingCartResponse;
  }>(REMOVE_ITEM_MUTATION, {
    sku,
    guestId: guestId || getOrCreateGuestId(),
  });

  const cartData = data?.removeCartItem?.data || { ...EMPTY_CART };
  notifyCartUpdated(cartData);
  return cartData;
}

/**
 * 6. Xóa chọn lọc hoặc làm trống toàn bộ giỏ (deleteCart)
 * - skus: string[] -> Xóa các SKU được chỉ định (Batch delete)
 * - skus: null hoặc undefined -> Dọn sạch toàn bộ giỏ hàng (Clear all)
 */
export async function deleteCart(
  skus?: string[] | null,
  guestId?: string
): Promise<ShoppingCartData> {
  const data = await executeCartGraphql<{ deleteCart: ShoppingCartResponse }>(
    DELETE_CART_MUTATION,
    {
      skus: skus && skus.length > 0 ? skus : null,
      guestId: guestId || getOrCreateGuestId(),
    }
  );

  const cartData = data?.deleteCart?.data || { ...EMPTY_CART };
  notifyCartUpdated(cartData);
  return cartData;
}

/**
 * Helper tương thích: Xóa danh sách SKU (Bulk Delete)
 */
export async function removeCartItems(
  skus: string[],
  guestId?: string
): Promise<ShoppingCartData> {
  return deleteCart(skus, guestId);
}

/**
 * Helper tương thích: Dọn sạch toàn bộ giỏ hàng
 */
export async function clearCart(guestId?: string): Promise<ShoppingCartData> {
  return deleteCart(null, guestId);
}

/**
 * 7. Hợp nhất giỏ hàng khách khi đăng nhập (mergeCart)
 * Chuyển toàn bộ sản phẩm hợp lệ từ guestId sang tài khoản thành viên.
 */
export async function mergeGuestCart(
  guestIdOverride?: string
): Promise<ShoppingCartData | null> {
  const guestId =
    guestIdOverride ||
    localStorage.getItem(STORAGE_KEYS.GUEST_ID) ||
    localStorage.getItem("guest_id");
  if (!guestId) return null;

  try {
    const data = await executeCartGraphql<{ mergeCart: ShoppingCartResponse }>(
      MERGE_CART_MUTATION,
      { guestId }
    );
    clearGuestId();
    const cartData = data?.mergeCart?.data || null;
    if (cartData) {
      notifyCartUpdated(cartData);
    }
    return cartData;
  } catch (error: any) {
    console.error("[cartService] Failed to merge cart on login:", error);
    return null;
  }
}
