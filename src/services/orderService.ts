/**
 * Order Service - GraphQL Order Management (Architecture v1.3.0)
 * Primary Protocol: GraphQL Gateway (/graphql) with seamless REST API fallback
 */

import { getApiBaseUrl, getUnifiedAccessToken, unifiedFetch } from "../lib/api";

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
 * Khởi tạo đơn hàng mới - Thuần GraphQL Gateway (/graphql)
 * GraphQL Operation: mutation CreateOrder($input: CreateOrderInput!)
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
    const response = await unifiedFetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
