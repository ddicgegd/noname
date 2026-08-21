/**
 * Order Service - GraphQL Order Management (Architecture v1.3.0)
 * Primary Protocol: GraphQL Gateway (/graphql) with seamless REST API fallback
 */

import { getApiBaseUrl } from "../lib/api";

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
  items: CreateOrderItemInput[];
  shippingAddress: string;
  addressSku?: string;
  shippingMethod?: ShippingMethod | string;
  paymentMethod: PaymentMethod | string;
  isFromCart?: boolean;
  customerNotes?: string;
  discountCodes?: string[];
  discountCode?: string;
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
  currentStatus: string;
  currentStatusDescription?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingFee?: number;
  productDiscountAmount?: number;
  shippingDiscountAmount?: number;
  discountAmount?: number;
  discountCode?: string;
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
  status: OrderStatus | string;
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

function getUnifiedAccessToken(): string {
  const storedProfile = localStorage.getItem("horizon_redis_profile");
  if (storedProfile) {
    try {
      const profile = JSON.parse(storedProfile);
      if (profile?.accessToken) return profile.accessToken;
    } catch (_) {
      // Ignore
    }
  }
  return localStorage.getItem("horizon_access_token") || "";
}

/**
 * 1. GraphQL Mutation: CreateOrder (v1.3.0 Standard)
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
        shippingMethod
        paymentMethod
        subtotal
        shippingFee
        productDiscountAmount
        shippingDiscountAmount
        totalAmount
        currentStatus
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
          discountAmount
          subtotal
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
    $status: OrderStatus!
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
 * 3. GraphQL Query: GetMyOrderDetail (v1.3.0 Standard)
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
        currentStatus
        shippingMethod
        paymentMethod
        receiverName
        receiverPhone
        shippingAddress
        subtotal
        shippingFee
        productDiscountAmount
        shippingDiscountAmount
        totalAmount
        customerNotes
        createdAt
        statusHistory {
          status
          timestamp
        }
      }
    }
  }
`;

/**
 * Khởi tạo đơn hàng mới - REST API trực tiếp vào Backend Spring Boot (Port 8080)
 * Endpoint: POST /api/orders (Đặc tả ERP REST API Contracts v1.3.0)
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const token = getUnifiedAccessToken();
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");

  // Payload tuân thủ đặc tả REST API v1.3.0 từ NotebookLM
  const payload: any = {
    shippingMethod: input.shippingMethod || "DELIVERY",
    isFromCart: typeof input.isFromCart === "boolean" ? input.isFromCart : false,
    addressSku: input.addressSku || undefined,
    voucherCode: input.discountCode || (input.discountCodes && input.discountCodes[0]) || undefined,
    shippingAddress: input.shippingAddress || "",
    paymentMethod: input.paymentMethod || "COD",
    customerNotes: input.customerNotes || undefined,
    items: input.items.map((item) => ({
      attributesSku: item.attributesSku,
      quantity: Number(item.quantity) || 1,
    })),
  };

  if (input.language) {
    payload.language = input.language;
  }
  if (input.bankCode) {
    payload.bankCode = input.bankCode;
  }

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Đặt hàng thất bại (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.status?.message) {
        errorMsg = errJson.status.message;
      } else if (errJson?.detail) {
        errorMsg = errJson.detail;
      } else if (errJson?.message) {
        errorMsg = errJson.message;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const resData = await response.json();
  return {
    status: {
      code: resData?.status?.code || 201,
      message: resData?.status?.message || "Created",
    },
    data: resData?.data || resData,
  };
}

/**
 * Lấy danh sách đơn hàng tóm tắt qua GraphQL Gateway (với REST fallback)
 */
export async function getMyOrders(params: MyOrdersQueryParams): Promise<MyOrdersResponse> {
  const token = getUnifiedAccessToken();

  // 1. Thực thi qua GraphQL Gateway
  try {
    const response = await fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || "",
        ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: GET_MY_ORDERS_LIST_QUERY,
        variables: {
          status: params.status,
          page: params.page || 1,
          size: params.size || 20,
          sortBy: params.sortBy || "auditInfo.createdAt",
          sortDirection: params.sortDirection || "DESC",
        },
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
  if (params?.status) searchParams.append("status", params.status);
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.size) searchParams.append("size", params.size.toString());
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.sortDirection) searchParams.append("sortDirection", params.sortDirection);

  const url = `${baseUrl}/api/orders/my-orders/list${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const restRes = await fetch(url, {
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
    const response = await fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || "",
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
  const restRes = await fetch(`${baseUrl}/api/orders/my-orders/${encodeURIComponent(orderNumber)}`, {
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
