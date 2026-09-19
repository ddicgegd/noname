/**
 * Order Service - GraphQL Order Management (Architecture v1.3.0)
 * Primary Protocol: GraphQL Gateway (/graphql) with seamless REST API fallback
 */

import { getApiBaseUrl, getUnifiedAccessToken, unifiedFetch } from "../lib/api";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { getOrderStatusTheme } from "../lib/orderStatusTheme";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod =
  | "COD"
  | "VNPAY"
  | "MOMO"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "PAYPAL";

export type ShippingMethod = "DELIVERY" | "PICKUP";

export interface CreateOrderItemInput {
  attributesSku: string;
  quantity: number;
}

export interface CreateOrderInput {
  orderNumber?: string;
  orderSessionId?: string;
  items: CreateOrderItemInput[];
  shippingAddress?: string;
  addressSku?: string;
  shippingMethod?: ShippingMethod | string;
  paymentMethod: PaymentMethod | string;
  isFromCart?: boolean;
  customerNotes?: string;
  voucherCode?: string;
  discountCode?: string;
  discountCodes?: string[];
  language?: string;
  bankCode?: string;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface OrderItemDto {
  attributesSku: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  salePrice?: number;
  costPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  subtotal: number;
  taxAmount?: number;
  notes?: string | null;
  imageUrl?: string | null;
  variantOptions?: VariantOption[];
}

export interface OrderCustomerInfo {
  customerId?: number | string;
  fullName?: string;
  phone?: string;
  shippingAddress?: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  timestamp: string;
}

export interface OrderDto {
  orderNumber: string;
  orderSessionId?: string;
  status?: string[];
  currentStatus: string;
  currentStatusDescription?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  addressSku?: string;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingFee?: number;
  productDiscountAmount?: number;
  shippingDiscountAmount?: number;
  discountAmount?: number;
  discountCode?: string;
  discountCodes?: string[];
  bankCode?: string;
  language?: string;
  totalAmount: number;
  customerNotes?: string;
  orderItems: OrderItemDto[];
  customerInfo?: OrderCustomerInfo;
  statusHistory?: OrderStatusHistoryItem[];
  createdAt?: string;
}

export interface CreateOrderResponse {
  status: {
    code: number;
    message: string;
  };
  data: OrderDto;
}

export interface MyOrdersQueryParams {
  status?: OrderStatus | string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface OrderSummaryItem {
  orderNumber: string;
  currentStatus: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  firstItemPreview?: {
    attributesSku: string;
    productName: string;
    thumbnailUrl: string;
    quantity: number;
    price: number;
  };
}

export interface MyOrdersResponse {
  status: {
    code: number;
    message: string;
  };
  data: {
    contents: OrderSummaryItem[];
    paging: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  };
}

export interface UiDeliveryStep {
  title: string;
  desc: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export interface UiOrderItem {
  id: string;
  name: string;
  price: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  statusText: string;
  estimatedDelivery?: string;
  deliverySteps: UiDeliveryStep[];
  shippingAddress: string;
  carrier: string;
  trackingNumber: string;
  totalAmountNumber?: number;
  orderItemsList?: OrderItemDto[];
  rawOrder?: OrderDto;
}

/**
 * 1. GraphQL Mutation: CreateOrder (v1.3.0 Standard & Optimized)
 */
export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      status {
        code
        message
      }
      data {
        orderNumber
        orderSessionId
        status
        currentStatus
        currentStatusDescription
        shippingMethod
        paymentMethod
        addressSku
        shippingAddress
        subtotal
        shippingFee
        discountAmount
        productDiscountAmount
        shippingDiscountAmount
        discountCodes
        totalAmount
        customerNotes
        bankCode
        language
        createdAt
        customerInfo {
          fullName
          phone
          shippingAddress
        }
        orderItems {
          attributesSku
          productName
          quantity
          unitPrice
          salePrice
          costPrice
          discountAmount
          discountPercentage
          subtotal
          taxAmount
          imageUrl
          variantOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/**
 * 2. GraphQL Query: GetMyOrdersList (v1.3.0 Standard)
 */
export const GET_MY_ORDERS_LIST_QUERY = `
  query GetMyOrdersList(
    $status: OrderStatus
    $page: Int
    $size: Int
    $sortBy: String
    $sortDirection: String
  ) {
    myOrdersList(
      status: $status
      page: $page
      size: $size
      sortBy: $sortBy
      sortDirection: $sortDirection
    ) {
      status {
        code
        message
      }
      data {
        contents {
          orderNumber
          currentStatus
          totalAmount
          itemCount
          createdAt
          firstItemPreview {
            attributesSku
            productName
            thumbnailUrl
            quantity
            price
          }
        }
        paging {
          pageNumber
          pageSize
          totalElements
          totalPages
        }
      }
    }
  }
`;

/**
 * 3. GraphQL Query: GetMyOrderDetail (v1.3.0 Standard with Full Items & Timeline)
 */
export const GET_MY_ORDER_DETAIL_QUERY = `
  query GetMyOrderDetail($orderNumber: String!) {
    myOrderDetail(orderNumber: $orderNumber) {
      status {
        code
        message
      }
      data {
        orderNumber
        orderSessionId
        status
        currentStatus
        currentStatusDescription
        shippingMethod
        paymentMethod
        addressSku
        receiverName
        receiverPhone
        shippingAddress
        subtotal
        shippingFee
        productDiscountAmount
        shippingDiscountAmount
        discountAmount
        discountCodes
        totalAmount
        customerNotes
        bankCode
        language
        createdAt
        customerInfo {
          fullName
          phone
          shippingAddress
        }
        statusHistory {
          status
          timestamp
        }
        orderItems {
          attributesSku
          productName
          quantity
          unitPrice
          salePrice
          costPrice
          discountAmount
          discountPercentage
          subtotal
          taxAmount
          imageUrl
          variantOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/**
 * Khởi tạo đơn hàng mới - Thuần GraphQL Gateway (/graphql)
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const token = getUnifiedAccessToken();

  // Payload chuẩn hóa tuân thủ GraphQL Input
  const normalizedInput: any = {
    orderSessionId: input.orderSessionId || input.orderNumber || undefined,
    orderNumber: input.orderNumber || input.orderSessionId || undefined,
    shippingMethod: input.shippingMethod || "DELIVERY",
    isFromCart: typeof input.isFromCart === "boolean" ? input.isFromCart : false,
    addressSku: input.addressSku || undefined,
    voucherCode: input.voucherCode || undefined,
    discountCode: input.discountCode || undefined,
    discountCodes: input.discountCodes && input.discountCodes.length > 0 ? input.discountCodes : undefined,
    shippingAddress: input.shippingAddress || "",
    paymentMethod: input.paymentMethod || "VNPAY",
    customerNotes: input.customerNotes || undefined,
    items: input.items.map((item) => ({
      attributesSku: item.attributesSku,
      quantity: Number(item.quantity) || 1,
    })),
  };

  if (input.language) {
    normalizedInput.language = input.language;
  }
  if (input.bankCode) {
    normalizedInput.bankCode = input.bankCode;
  }

  const gqlResponse = await unifiedFetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: CREATE_ORDER_MUTATION,
      variables: { input: normalizedInput },
    }),
  });

  if (!gqlResponse.ok) {
    throw new Error(`Lỗi kết nối GraphQL Gateway (${gqlResponse.status})`);
  }

  const gqlResult = await gqlResponse.json();

  if (gqlResult.errors?.length) {
    const errorMsg = gqlResult.errors.map((e: any) => e.message).join("; ");
    throw new Error(errorMsg || "Lỗi tạo đơn hàng qua GraphQL");
  }

  const createOrderRes = gqlResult.data?.createOrder;
  if (!createOrderRes) {
    throw new Error("Không nhận được dữ liệu phản hồi từ GraphQL Gateway");
  }

  if (createOrderRes.status?.code && createOrderRes.status.code >= 400) {
    throw new Error(createOrderRes.status.message || `Đặt hàng thất bại (Mã lỗi ${createOrderRes.status.code})`);
  }

  return {
    status: {
      code: createOrderRes.status?.code || 201,
      message: createOrderRes.status?.message || "Created",
    },
    data: createOrderRes.data,
  };
}

/**
 * Lấy danh sách đơn hàng tóm tắt qua GraphQL Gateway (với REST fallback)
 */
export async function getMyOrders(params: MyOrdersQueryParams): Promise<MyOrdersResponse> {
  const token = getUnifiedAccessToken();

  // 1. Thực thi qua GraphQL Gateway
  try {
    const variables: Record<string, any> = {
      page: params.page || 1,
      size: params.size || 20,
      sortBy: params.sortBy || "auditInfo.createdAt",
      sortDirection: params.sortDirection || "DESC",
    };
    if (params.status && params.status !== "ALL") {
      variables.status = params.status;
    }

    const response = await unifiedFetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: GET_MY_ORDERS_LIST_QUERY,
        variables,
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      if (!payload.errors?.length && payload.data?.myOrdersList?.data) {
        return payload.data.myOrdersList;
      }
    }
  } catch (err) {
    console.warn("GraphQL myOrdersList failed, falling back to REST:", err);
  }

  // 2. Fallback sang REST API
  const baseUrl = getApiBaseUrl();
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "ALL") searchParams.append("status", params.status);
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.size) searchParams.append("size", params.size.toString());
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.sortDirection) searchParams.append("sortDirection", params.sortDirection);

  const url = `${baseUrl}/api/orders/my-orders/list${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const restRes = await unifiedFetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    },
  });

  if (!restRes.ok) {
    throw new Error(`Không thể tải danh sách đơn hàng (${restRes.status})`);
  }

  return restRes.json();
}

/**
 * Lấy chi tiết đơn hàng qua GraphQL Gateway (với REST fallback)
 */
export async function getOrderDetail(orderNumber: string): Promise<OrderDto> {
  const token = getUnifiedAccessToken();

  // 1. Thực thi qua GraphQL Gateway
  try {
    const response = await unifiedFetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: GET_MY_ORDER_DETAIL_QUERY,
        variables: { orderNumber },
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      if (!payload.errors?.length && payload.data?.myOrderDetail?.data) {
        return payload.data.myOrderDetail.data;
      }
    }
  } catch (err) {
    console.warn("GraphQL myOrderDetail failed, falling back to REST:", err);
  }

  // 2. Fallback sang REST API
  const baseUrl = getApiBaseUrl();
  const restRes = await unifiedFetch(`${baseUrl}/api/orders/my-orders/${encodeURIComponent(orderNumber)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    },
  });

  if (!restRes.ok) {
    throw new Error(`Không thể lấy chi tiết đơn hàng ${orderNumber} (${restRes.status})`);
  }

  const result = await restRes.json();
  return result?.data || result;
}

// ---------------------------------------------------------------------------
// NORMALIZER & CACHE HELPERS (Hybrid Cache-First + UI Adapter)
// ---------------------------------------------------------------------------

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function formatDateDisplay(isoString?: string): string {
  if (!isoString) return new Date().toLocaleDateString("vi-VN");
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

function mapStatusToUiStatus(currentStatus?: string): "pending" | "processing" | "shipped" | "delivered" | "cancelled" {
  const norm = (currentStatus || "").toUpperCase();
  if (norm.includes("WAIT") || norm.includes("PENDING")) return "pending";
  if (norm.includes("SHIP") || norm.includes("DELIVERING")) return "shipped";
  if (norm.includes("DELIVERED") || norm.includes("COMPLETE") || norm.includes("DONE")) return "delivered";
  if (norm.includes("CANCEL") || norm.includes("REFUND")) return "cancelled";
  return "processing";
}

/**
 * Sinh danh sách các bước giao hàng (Delivery Steps) mặc định theo trạng thái đơn hàng
 */
export function generateDeliveryStepsForOrder(status: string, createdAt?: string): UiDeliveryStep[] {
  const createdDate = formatDateDisplay(createdAt);
  const norm = (status || "").toUpperCase();

  const isDelivered = norm === "DELIVERED" || norm === "COMPLETED";
  const isShipped = isDelivered || norm === "SHIPPED";
  const isProcessing = isShipped || norm === "PROCESSING" || norm === "CONFIRMED";
  const isCancelled = norm === "CANCELLED" || norm === "REFUNDED";

  if (isCancelled) {
    return [
      { title: "Khởi tạo đơn hàng", desc: "Đơn hàng đã được đặt trực tuyến", time: `${createdDate} 10:00`, completed: true, active: false },
      { title: "Đơn hàng đã hủy", desc: "Giao dịch đã hủy và hoàn tiền theo chính sách", time: `${createdDate} 11:30`, completed: true, active: true }
    ];
  }

  return [
    {
      title: "Đã tiếp nhận đơn hàng",
      desc: "Đơn hàng đã được hệ thống ERP xác nhận thành công",
      time: `${createdDate} 09:00`,
      completed: true,
      active: norm === "PENDING" || norm === "WAITING_PAYMENT",
    },
    {
      title: "Đang đóng gói & Kiểm thử",
      desc: "Bộ phận kho đang kiểm tra linh kiện và đóng hộp nguyên seal",
      time: `${createdDate} 11:30`,
      completed: isProcessing,
      active: norm === "PROCESSING" || norm === "CONFIRMED",
    },
    {
      title: "Bàn giao đơn vị vận chuyển",
      desc: "Kiện hàng đã xuất kho chuyển phát nhanh Horizon Express / Viettel Post",
      time: `${createdDate} 14:00`,
      completed: isShipped,
      active: norm === "SHIPPED",
    },
    {
      title: "Đang trung chuyển qua trạm",
      desc: "Thiết bị đang được vận chuyển nhanh tới trạm phát hàng gần nhất",
      time: `${createdDate} 17:30`,
      completed: isShipped,
      active: false,
    },
    {
      title: "Giao hàng & Hoàn tất",
      desc: "Người nhận đồng kiểm kiện hàng và ký nhận hoàn tất giao dịch",
      time: `${createdDate} 19:00`,
      completed: isDelivered,
      active: isDelivered,
    },
  ];
}

/**
 * Chuyển đổi DTO chi tiết (OrderDto) sang định dạng UI OrderItem
 */
export function normalizeOrderDtoToUiItem(dto: OrderDto): UiOrderItem {
  const theme = getOrderStatusTheme(dto.currentStatus);
  const firstItem = dto.orderItems?.[0];
  const itemCount = dto.orderItems?.length || 1;
  const name = firstItem
    ? `${firstItem.productName || firstItem.attributesSku}${itemCount > 1 ? ` (+${itemCount - 1} sản phẩm khác)` : ""}`
    : `Đơn hàng #${dto.orderNumber}`;

  return {
    id: dto.orderNumber,
    name,
    price: formatVnd(dto.totalAmount || 0),
    date: formatDateDisplay(dto.createdAt),
    status: mapStatusToUiStatus(dto.currentStatus),
    statusText: dto.currentStatusDescription || theme.label,
    estimatedDelivery: formatDateDisplay(dto.createdAt),
    deliverySteps: dto.statusHistory && dto.statusHistory.length > 0
      ? dto.statusHistory.map((sh, idx, arr) => ({
          title: sh.status,
          desc: `Ghi nhận trạng thái: ${sh.status}`,
          time: formatDateDisplay(sh.timestamp),
          completed: idx < arr.length - 1 || mapStatusToUiStatus(dto.currentStatus) === "delivered",
          active: idx === arr.length - 1 && mapStatusToUiStatus(dto.currentStatus) !== "delivered",
        }))
      : generateDeliveryStepsForOrder(dto.currentStatus, dto.createdAt),
    shippingAddress: dto.shippingAddress || "Địa chỉ mặc định khách hàng",
    carrier: dto.shippingMethod === "PICKUP" ? "Nhận tại trạm dịch vụ Horizon" : "Horizon Express (Viettel Post)",
    trackingNumber: `HZ-${dto.orderNumber.replace(/[^A-Z0-9]/gi, "").slice(-8) || "8820192"}`,
    totalAmountNumber: dto.totalAmount,
    orderItemsList: dto.orderItems,
    rawOrder: dto,
  };
}

/**
 * Chuyển đổi DTO tóm tắt (OrderSummaryItem) sang định dạng UI OrderItem
 */
export function normalizeSummaryToUiItem(item: OrderSummaryItem): UiOrderItem {
  const theme = getOrderStatusTheme(item.currentStatus);
  const name = item.firstItemPreview?.productName
    ? `${item.firstItemPreview.productName}${item.itemCount > 1 ? ` (+${item.itemCount - 1} món khác)` : ""}`
    : `Đơn hàng #${item.orderNumber}`;

  return {
    id: item.orderNumber,
    name,
    price: formatVnd(item.totalAmount || 0),
    date: formatDateDisplay(item.createdAt),
    status: mapStatusToUiStatus(item.currentStatus),
    statusText: theme.label,
    estimatedDelivery: formatDateDisplay(item.createdAt),
    deliverySteps: generateDeliveryStepsForOrder(item.currentStatus, item.createdAt),
    shippingAddress: "Đang tải địa chỉ nhận hàng...",
    carrier: "Horizon Express",
    trackingNumber: `HZ-${item.orderNumber.replace(/[^A-Z0-9]/gi, "").slice(-8) || "TRACKING"}`,
    totalAmountNumber: item.totalAmount,
  };
}

/**
 * Đọc danh sách đơn hàng đã lưu trong Local Cache
 */
export function getCachedOrders(): UiOrderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ORDERS) || localStorage.getItem("horizon_user_orders");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách đơn hàng vào Local Cache
 */
export function saveCachedOrders(orders: UiOrderItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ORDERS, JSON.stringify(orders));
    localStorage.setItem("horizon_user_orders", JSON.stringify(orders));
  } catch (err) {
    console.warn("Failed to cache orders:", err);
  }
}
