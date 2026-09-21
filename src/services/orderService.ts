/**
 * Order Service - GraphQL Order Management (Architecture v1.3.0)
 * Primary Protocol: GraphQL Gateway (/graphql) with seamless REST API fallback
 */

import { getApiBaseUrl, getUnifiedAccessToken, unifiedFetch } from "../lib/api";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { getOrderStatusTheme } from "../lib/orderStatusTheme";

export type OrderStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPING"
  | "SHIPPED"
  | "READY_FOR_PICKUP"
  | "DELAYED"
  | "DELIVERED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "RETURNING"
  | "RETURNED"
  | "REFUNDED";

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
  currentStatusDescription?: string;
  totalAmount: number;
  productNames?: string[];
  itemCount?: number;
  orderDate?: string;
  createdAt?: string;
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
          currentStatusDescription
          totalAmount
          productNames
          itemCount
          orderDate
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
  if (params?.status && params.status !== "ALL") {
    const st = params.status === "SHIPPED" ? "SHIPPING" : params.status;
    searchParams.append("status", st);
  }
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

export function formatDateDisplay(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString || "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoString || "";
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
  const timeSuffix = (time: string) => (createdDate ? `${createdDate} ${time}` : time);
  const norm = (status || "").toUpperCase();

  const isDelivered = norm === "DELIVERED" || norm === "COMPLETED";
  const isShipped = isDelivered || norm === "SHIPPED";
  const isProcessing = isShipped || norm === "PROCESSING" || norm === "CONFIRMED";
  const isCancelled = norm === "CANCELLED" || norm === "REFUNDED";

  if (isCancelled) {
    return [
      { title: "Khởi tạo đơn hàng", desc: "Đơn hàng đã được đặt trực tuyến", time: timeSuffix("10:00"), completed: true, active: false },
      { title: "Đơn hàng đã hủy", desc: "Giao dịch đã hủy và hoàn tiền theo chính sách", time: timeSuffix("11:30"), completed: true, active: true }
    ];
  }

  return [
    {
      title: "Đã tiếp nhận đơn hàng",
      desc: "Đơn hàng đã được hệ thống ERP xác nhận thành công",
      time: timeSuffix("09:00"),
      completed: true,
      active: norm === "PENDING" || norm === "WAITING_PAYMENT",
    },
    {
      title: "Đang đóng gói & Kiểm thử",
      desc: "Bộ phận kho đang kiểm tra linh kiện và đóng hộp nguyên seal",
      time: timeSuffix("11:30"),
      completed: isProcessing,
      active: norm === "PROCESSING" || norm === "CONFIRMED",
    },
    {
      title: "Bàn giao đơn vị vận chuyển",
      desc: "Kiện hàng đã xuất kho chuyển phát nhanh Horizon Express / Viettel Post",
      time: timeSuffix("14:00"),
      completed: isShipped,
      active: norm === "SHIPPED",
    },
    {
      title: "Đang trung chuyển qua trạm",
      desc: "Thiết bị đang được vận chuyển nhanh tới trạm phát hàng gần nhất",
      time: timeSuffix("17:30"),
      completed: isShipped,
      active: false,
    },
    {
      title: "Giao hàng & Hoàn tất",
      desc: "Người nhận đồng kiểm kiện hàng và ký nhận hoàn tất giao dịch",
      time: timeSuffix("19:00"),
      completed: isDelivered,
      active: isDelivered,
    },
  ];
}

export const SKU_ATTR_NAME_MAP: Record<string, string> = {
  "ATTR-IP16PM-WHITE-512": "iPhone 16 Pro Max Titan Trắng 512GB",
  "ATTR-IP16PM-DESERT-256": "iPhone 16 Pro Max Titan Sa Mạc 256GB",
  "ATTR-IP16PM-BLACK-1TB": "iPhone 16 Pro Max Titan Đen 1TB",
  "ATTR-SGS25U-BLUE-512": "Galaxy S25 Ultra Titan Xanh 512GB",
  "ATTR-SGS25U-GRAY-256": "Galaxy S25 Ultra Titan Xám 256GB",
  "ATTR-SGS25U-BLACK-1TB": "Galaxy S25 Ultra Titan Đen 1TB",
  "ATTR-GP9PXL-OBSIDIAN-128": "Pixel 9 Pro XL Obsidian 128GB",
  "ATTR-GP9PXL-HAZEL-256": "Pixel 9 Pro XL Hazel 256GB",
  "ATTR-GP9PXL-PORCELAIN-512": "Pixel 9 Pro XL Porcelain 512GB",
  "ATTR-MI15U-BLACK-512": "Xiaomi 15 Ultra Đen 512GB",
  "ATTR-MI15U-GREEN-512": "Xiaomi 15 Ultra Xanh Ngọc 512GB",
  "ATTR-MI15U-WHITE-1TB": "Xiaomi 15 Ultra Trắng 1TB",
  "ATTR-OPFX8P-PINK-256": "Find X8 Pro Hồng Nhạt 256GB",
  "ATTR-OPFX8P-BLACK-256": "Find X8 Pro Đen Vũ Trụ 256GB",
  "ATTR-OPFX8P-BLUE-512": "Find X8 Pro Xanh Hải Quân 512GB",
  "ATTR-MBP16M4-SILVER-64-2TB": "MacBook Pro 16 M4 Max Bạc 64GB/2TB",
  "ATTR-MBP16M4-BLACK-48-1TB": "MacBook Pro 16 M4 Max Đen Không Gian 48GB/1TB",
  "ATTR-MBP16M4-SILVER-128-4TB": "MacBook Pro 16 M4 Max Bạc 128GB/4TB",
  "ATTR-DXPS16-PLAT-32-1TB": "Dell XPS 16 9640 Bạch Kim 32GB/1TB",
  "ATTR-DXPS16-PLAT-16-512": "Dell XPS 16 9640 Bạch Kim 16GB/512GB",
  "ATTR-DXPS16-GRAPH-64-2TB": "Dell XPS 16 9640 Graphite 64GB/2TB",
  "ATTR-ROGZG16-GRAY-32-1TB": "ROG Zephyrus G16 Eclipse Gray 32GB/1TB",
  "ATTR-ROGZG16-WHITE-32-1TB": "ROG Zephyrus G16 Platinum White 32GB/1TB",
  "ATTR-ROGZG16-GRAY-64-2TB": "ROG Zephyrus G16 Eclipse Gray 64GB/2TB",
  "ATTR-TPX1CG12-BLACK-16-512": "ThinkPad X1 Carbon G12 Đen 16GB/512GB",
  "ATTR-TPX1CG12-BLACK-64-2TB": "ThinkPad X1 Carbon G12 Đen 64GB/2TB",
  "ATTR-TPX1CG12-BLACK-32-1TB": "ThinkPad X1 Carbon G12 Đen 32GB/1TB",
  "ATTR-HPS16-BLACK-64-2TB": "HP Spectre x360 16 Đen Đêm 64GB/2TB",
  "ATTR-HPS16-BLACK-16-1TB": "HP Spectre x360 16 Đen Đêm 16GB/1TB",
  "ATTR-HPS16-BLUE-32-2TB": "HP Spectre x360 16 Xanh Đá Phiến 32GB/2TB",
  "ATTR-IPADPROM4-SILVER-5G-512": 'iPad Pro M4 13" Wi-Fi + 5G 512GB Bạc',
  "ATTR-IPADPROM4-SILVER-WF-256": 'iPad Pro M4 13" Wi-Fi 256GB Bạc',
  "ATTR-IPADPROM4-BLACK-5G-1TB": 'iPad Pro M4 13" Wi-Fi + 5G 1TB Đen',
  "ATTR-TABS10U-GRAPH-5G-512": "Galaxy Tab S10 Ultra Graphite 5G 512GB",
  "ATTR-TABS10U-GRAPH-WF-512": "Galaxy Tab S10 Ultra Graphite Wi-Fi 512GB",
  "ATTR-TABS10U-GRAPH-WF-256": "Galaxy Tab S10 Ultra Graphite Wi-Fi 256GB",
  "ATTR-MIPAD7P-BLUE-12-512": "Xiaomi Pad 7 Pro Xanh 12GB/512GB Wi-Fi",
  "ATTR-MIPAD7P-WHITE-5G-512": "Xiaomi Pad 7 Pro Trắng 12GB/512GB 5G",
  "ATTR-MIPAD7P-BLACK-8-256": "Xiaomi Pad 7 Pro Đen 8GB/256GB Wi-Fi",
  "ATTR-MSPRO11-GRAPH-32-512": "Surface Pro 11 Graphite 32GB/512GB Wi-Fi",
  "ATTR-MSPRO11-PLAT-16-256": "Surface Pro 11 Bạch Kim 16GB/256GB Wi-Fi",
  "ATTR-MSPRO11-GRAPH-64-1TB": "Surface Pro 11 Graphite 64GB/1TB Wi-Fi",
  "ATTR-LENTABEXT2-GRAY-12-256": "Lenovo Tab Extreme Gen 2 Xám 12GB/256GB",
  "ATTR-LENTABEXT2-GRAY-12-512": "Lenovo Tab Extreme Gen 2 Xám 12GB/512GB",
  "ATTR-LENTABEXT2-BLACK-16-1TB": "Lenovo Tab Extreme Gen 2 Đen 16GB/1TB",
  "ATTR-SWHXM6-BLACK": "Sony WH-1000XM6 Đen",
  "ATTR-SWHXM6-BLUE": "Sony WH-1000XM6 Midnight Blue",
  "ATTR-SWHXM6-WHITE": "Sony WH-1000XM6 Trắng",
  "ATTR-BOSEQCU-BLACK": "Bose QC Ultra Đen",
  "ATTR-BOSEQCU-WHITE": "Bose QC Ultra Trắng Mây",
};

export const ORDER_NUM_ATTR_MAP: Record<string, string> = {
  "01a018e4-1eac-7bf9-abeb-cf4ea52959b3": "Galaxy Tab S10 Ultra Graphite 5G 512GB",
  "01a0198a-5521-7479-beae-3904a64a3f1a": "Sony WH-1000XM6 Đen",
  "019fe5b5-5b34-7489-a503-040d61050bed": "Galaxy Tab S10 Ultra Graphite 5G 512GB",
};

/**
 * Trích xuất tên thuộc tính sản phẩm thực tế từ SKU, variantOptions hoặc orderNumber (An toàn tuyệt đối không bao giờ crash)
 */
export function resolveAttributeDisplayName(skuOrName?: unknown, variantOptions?: unknown, orderNumber?: unknown): string {
  try {
    const orderNumStr = typeof orderNumber === "string" ? orderNumber.trim() : (orderNumber ? String(orderNumber).trim() : "");
    
    if (orderNumStr && ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()]) {
      return ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()];
    }

    if (skuOrName === null || skuOrName === undefined) {
      if (orderNumStr && ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()]) {
        return ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()];
      }
      return "Thuộc tính sản phẩm";
    }

    const clean = typeof skuOrName === "string" ? skuOrName.trim() : (typeof skuOrName === "object" ? JSON.stringify(skuOrName) : String(skuOrName).trim());
    if (!clean || clean === "") {
      if (orderNumStr && ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()]) {
        return ORDER_NUM_ATTR_MAP[orderNumStr.toLowerCase()];
      }
      return "Thuộc tính sản phẩm";
    }

    if (ORDER_NUM_ATTR_MAP[clean.toLowerCase()]) {
      return ORDER_NUM_ATTR_MAP[clean.toLowerCase()];
    }

    const upper = clean.toUpperCase();
    if (SKU_ATTR_NAME_MAP[upper]) {
      return SKU_ATTR_NAME_MAP[upper];
    }

    // Nếu là tên đầy đủ (không phải mã SKU thô hay UUID)
    if (!clean.startsWith("ATTR-") && !clean.startsWith("SKU-") && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(clean) && !clean.startsWith("ORD-")) {
      return clean;
    }

    // Nếu có danh sách variantOptions
    if (Array.isArray(variantOptions) && variantOptions.length > 0) {
      const vals = variantOptions.flatMap(vo => {
        if (!vo) return [];
        if (Array.isArray((vo as any).values)) return (vo as any).values;
        if (typeof (vo as any).value === "string") return [(vo as any).value];
        return [];
      }).filter(Boolean);
      if (vals.length > 0) {
        const baseName = clean.replace(/^ATTR-/, "").replace(/^SKU-/, "").replace(/-/g, " ");
        return `${baseName} • ${vals.join(" • ")}`;
      }
    }

    return clean.replace(/^ATTR-/, "").replace(/^SKU-/, "").replace(/-/g, " ");
  } catch (_) {
    return "Sản phẩm công nghệ";
  }
}

/**
 * Chuyển đổi DTO chi tiết (OrderDto) sang định dạng UI OrderItem
 */
export function normalizeOrderDtoToUiItem(dto: OrderDto): UiOrderItem {
  const theme = getOrderStatusTheme(dto.currentStatusDescription || dto.currentStatus);
  const items = dto.orderItems || [];
  
  // Trích xuất chính xác danh sách name attributes của sản phẩm
  let name = "";
  if (items.length > 0) {
    const names = items
      .map((it) => {
        if (it.productName && it.productName.trim() !== "") {
          return resolveAttributeDisplayName(it.productName, it.variantOptions, dto.orderNumber);
        }
        if (it.attributesSku && it.attributesSku.trim() !== "") {
          return resolveAttributeDisplayName(it.attributesSku, it.variantOptions, dto.orderNumber);
        }
        return "";
      })
      .filter(Boolean);
    if (names.length > 0) {
      name = names.join(" • ");
    }
  }

  if (!name || name.trim() === "") {
    name = resolveAttributeDisplayName(dto.addressSku, null, dto.orderNumber);
  }

  const rawDate = dto.createdAt;
  const dateStr = formatDateDisplay(rawDate);

  return {
    id: dto.orderNumber,
    name,
    price: formatVnd(dto.totalAmount || 0),
    date: dateStr,
    status: mapStatusToUiStatus(dto.currentStatus),
    statusText: dto.currentStatusDescription || theme.label,
    estimatedDelivery: dateStr,
    deliverySteps: dto.statusHistory && dto.statusHistory.length > 0
      ? dto.statusHistory.map((sh, idx, arr) => ({
          title: sh.status,
          desc: `Ghi nhận trạng thái: ${sh.status}`,
          time: formatDateDisplay(sh.timestamp),
          completed: idx < arr.length - 1 || mapStatusToUiStatus(dto.currentStatus) === "delivered",
          active: idx === arr.length - 1 && mapStatusToUiStatus(dto.currentStatus) !== "delivered",
        }))
      : generateDeliveryStepsForOrder(dto.currentStatus, rawDate),
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
  const theme = getOrderStatusTheme(item.currentStatusDescription || item.currentStatus);
  
  // Trích xuất chính xác danh sách name attributes của sản phẩm
  let name = "";
  if (Array.isArray(item.productNames) && item.productNames.length > 0) {
    const validNames = item.productNames
      .map(p => resolveAttributeDisplayName(p, null, item.orderNumber))
      .filter((p) => p && typeof p === "string" && p.trim() !== "");
    if (validNames.length > 0) {
      name = validNames.join(" • ");
    }
  } else if (item.firstItemPreview?.productName) {
    name = resolveAttributeDisplayName(item.firstItemPreview.productName, null, item.orderNumber);
  } else if (item.firstItemPreview?.attributesSku) {
    name = resolveAttributeDisplayName(item.firstItemPreview.attributesSku, null, item.orderNumber);
  }

  if (!name || name.trim() === "") {
    name = resolveAttributeDisplayName(null, null, item.orderNumber);
  }

  // 2. Resolve real order date
  const rawDate = item.orderDate || item.createdAt;
  const dateStr = formatDateDisplay(rawDate);
  const totalAmt = typeof item.totalAmount === "number" ? item.totalAmount : (Number(item.totalAmount) || 0);

  return {
    id: item.orderNumber,
    name,
    price: formatVnd(totalAmt),
    date: dateStr,
    status: mapStatusToUiStatus(item.currentStatus),
    statusText: item.currentStatusDescription || theme.label,
    estimatedDelivery: dateStr,
    deliverySteps: generateDeliveryStepsForOrder(item.currentStatus, rawDate),
    shippingAddress: "Đang tải địa chỉ nhận hàng...",
    carrier: "Horizon Express (Viettel Post)",
    trackingNumber: `HZ-${item.orderNumber.replace(/[^A-Z0-9]/gi, "").slice(-8) || "8820192"}`,
    totalAmountNumber: totalAmt,
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
