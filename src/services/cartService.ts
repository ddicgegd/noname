/**
 * Shopping Cart GraphQL Service
 * Integrates Frontend with Shopping Cart GraphQL Endpoints
 */

import { getUnifiedAccessToken, unifiedFetch } from "../lib/api";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type {
  Cart,
  CartItemInput,
  CartSummaryBadge,
  GraphQLErrorExtensions,
} from "../types/cart";

const CART_EVENT_NAME = "cart-updated";
const LOCAL_STORAGE_CART_CACHE_KEY = "horizon_cached_cart";

/**
 * Get locally cached cart for instant (0ms) hydration on page load
 */
export function getCachedCart(): Cart | null {
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
export function setCachedCart(cart?: Cart | null) {
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
export function notifyCartUpdated(cart?: Cart | null) {
  if (typeof window !== "undefined") {
    setCachedCart(cart);
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: cart }));
  }
}

/**
 * Subscribe to cart update events
 */
export function subscribeToCartUpdates(callback: (cart?: Cart) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<Cart>;
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
// 1. FAST PATH: Lấy số lượng Badge Header (< 1ms)
// -------------------------------------------------------------
const GET_CART_BADGE_QUERY = `
  query GetCartBadge($guestId: String) {
    cartBadge(guestId: $guestId) {
      totalItems
    }
  }
`;

export async function getCartBadge(guestId?: string): Promise<CartSummaryBadge> {
  try {
    const data = await executeCartGraphql<{ cartBadge: CartSummaryBadge }>(
      GET_CART_BADGE_QUERY,
      { guestId: guestId || getOrCreateGuestId() }
    );
    return data?.cartBadge || { totalItems: 0 };
  } catch (error) {
    console.warn("[cartService] getCartBadge failed:", error);
    return { totalItems: 0 };
  }
}

// -------------------------------------------------------------
// 2. MINI-CART DRAWER: Pop-up xem nhanh
// -------------------------------------------------------------
const GET_MINI_CART_QUERY = `
  query GetMiniCart($guestId: String) {
    cart(guestId: $guestId) {
      totalItems
      finalAmount
      items {
        sku
        productName
        imageUrl
        salePrice
        quantity
      }
    }
  }
`;

export async function getMiniCart(guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ cart: Cart }>(
    GET_MINI_CART_QUERY,
    { guestId: guestId || getOrCreateGuestId() }
  );
  if (data?.cart) {
    setCachedCart(data.cart);
  }
  return data?.cart || {
    totalItems: 0,
    totalPrice: 0,
    totalSalePrice: 0,
    totalDiscount: 0,
    finalAmount: 0,
    items: [],
  };
}

// -------------------------------------------------------------
// 3. FULL CART PAGE: Trang Giỏ hàng & Checkout
// -------------------------------------------------------------
const GET_FULL_CART_QUERY = `
  query GetFullCart($guestId: String) {
    cart(guestId: $guestId) {
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
        specifications {
          groupName
          specifications {
            key
            data
          }
        }
      }
    }
  }
`;

export async function getFullCart(guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ cart: Cart }>(
    GET_FULL_CART_QUERY,
    { guestId: guestId || getOrCreateGuestId() }
  );
  if (data?.cart) {
    setCachedCart(data.cart);
  }
  return data?.cart || {
    totalItems: 0,
    totalPrice: 0,
    totalSalePrice: 0,
    totalDiscount: 0,
    finalAmount: 0,
    items: [],
  };
}

// -------------------------------------------------------------
// 4. THÊM SẢN PHẨM VÀO GIỎ (addToCart)
// -------------------------------------------------------------
const ADD_TO_CART_MUTATION = `
  mutation AddToCart($items: [CartItemInput!]!, $guestId: String) {
    addToCart(items: $items, guestId: $guestId) {
      totalItems
      finalAmount
      items {
        sku
        productName
        quantity
        salePrice
        subTotal
      }
    }
  }
`;

export async function addToCart(items: CartItemInput[], guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ addToCart: Cart }>(
    ADD_TO_CART_MUTATION,
    { items, guestId: guestId || getOrCreateGuestId() }
  );
  notifyCartUpdated(data.addToCart);
  return data.addToCart;
}

// -------------------------------------------------------------
// 5. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM (updateCartItemQuantity)
// -------------------------------------------------------------
const UPDATE_QUANTITY_MUTATION = `
  mutation UpdateQuantity($sku: ID!, $quantity: Int!, $guestId: String) {
    updateCartItemQuantity(sku: $sku, quantity: $quantity, guestId: $guestId) {
      totalItems
      finalAmount
      items {
        sku
        quantity
        subTotal
      }
    }
  }
`;

export async function updateCartItemQuantity(
  sku: string,
  quantity: number,
  guestId?: string
): Promise<Cart> {
  const data = await executeCartGraphql<{ updateCartItemQuantity: Cart }>(
    UPDATE_QUANTITY_MUTATION,
    { sku, quantity, guestId: guestId || getOrCreateGuestId() }
  );
  notifyCartUpdated(data.updateCartItemQuantity);
  return data.updateCartItemQuantity;
}

// -------------------------------------------------------------
// 6. XÓA 1 SẢN PHẨM (removeCartItem)
// -------------------------------------------------------------
const REMOVE_ITEM_MUTATION = `
  mutation RemoveItem($sku: ID!, $guestId: String) {
    removeCartItem(sku: $sku, guestId: $guestId) {
      totalItems
      finalAmount
      items { sku }
    }
  }
`;

export async function removeCartItem(sku: string, guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ removeCartItem: Cart }>(
    REMOVE_ITEM_MUTATION,
    { sku, guestId: guestId || getOrCreateGuestId() }
  );
  notifyCartUpdated(data.removeCartItem);
  return data.removeCartItem;
}

// -------------------------------------------------------------
// 7. XÓA NHIỀU SẢN PHẨM CÙNG LÚC (removeCartItems - Bulk Delete)
// -------------------------------------------------------------
const REMOVE_ITEMS_MUTATION = `
  mutation RemoveItems($skus: [ID!]!, $guestId: String) {
    removeCartItems(skus: $skus, guestId: $guestId) {
      totalItems
      finalAmount
    }
  }
`;

export async function removeCartItems(skus: string[], guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ removeCartItems: Cart }>(
    REMOVE_ITEMS_MUTATION,
    { skus, guestId: guestId || getOrCreateGuestId() }
  );
  notifyCartUpdated(data.removeCartItems);
  return data.removeCartItems;
}

// -------------------------------------------------------------
// 8. XÓA SẠCH GIỎ HÀNG (clearCart)
// -------------------------------------------------------------
const CLEAR_CART_MUTATION = `
  mutation ClearCart($guestId: String) {
    clearCart(guestId: $guestId) {
      totalItems
      items { sku }
    }
  }
`;

export async function clearCart(guestId?: string): Promise<Cart> {
  const data = await executeCartGraphql<{ clearCart: Cart }>(
    CLEAR_CART_MUTATION,
    { guestId: guestId || getOrCreateGuestId() }
  );
  notifyCartUpdated(data.clearCart);
  return data.clearCart;
}

// -------------------------------------------------------------
// 9. HỢP NHẤT GIỎ HÀNG KHI ĐĂNG NHẬP (mergeCart)
// -------------------------------------------------------------
const MERGE_CART_MUTATION = `
  mutation MergeGuestCart($guestId: String!) {
    mergeCart(guestId: $guestId) {
      username
      totalItems
      finalAmount
      items {
        sku
        productName
        quantity
        subTotal
      }
    }
  }
`;

export async function mergeGuestCart(guestIdOverride?: string): Promise<Cart | null> {
  const guestId = guestIdOverride || localStorage.getItem(STORAGE_KEYS.GUEST_ID) || localStorage.getItem("guest_id");
  if (!guestId) return null;

  try {
    const data = await executeCartGraphql<{ mergeCart: Cart }>(
      MERGE_CART_MUTATION,
      { guestId }
    );
    clearGuestId();
    notifyCartUpdated(data.mergeCart);
    return data.mergeCart;
  } catch (error: any) {
    console.error("[cartService] Failed to merge cart on login:", error);
    return null;
  }
}
