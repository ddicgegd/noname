/**
 * Order Service - GraphQL Order Management
 * Implements createOrder mutation without id / orderId exposures
 */

export interface CreateOrderItemInput {
  attributesSku: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  addressSku: string;
  paymentMethod?: string;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface OrderItemDto {
  attributesSku: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  subtotal: number;
  variantOptions?: VariantOption[];
}

export interface OrderDto {
  orderNumber: string;
  currentStatus: string;
  shippingAddress: string;
  subtotal: number;
  totalAmount: number;
  orderItems: OrderItemDto[];
}

export interface CreateOrderResponse {
  status: {
    code: number;
    message: string;
  };
  data: OrderDto;
}

function getUnifiedAccessToken(): string {
  const storedProfile = localStorage.getItem("horizon_redis_profile");
  if (storedProfile) {
    try {
      const profile = JSON.parse(storedProfile);
      if (profile?.accessToken) return profile.accessToken;
    } catch (_) {
      // Fallback
    }
  }
  return localStorage.getItem("horizon_access_token") || "";
}

export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      status {
        code
        message
      }
      data {
        orderNumber
        currentStatus
        shippingAddress
        subtotal
        totalAmount
        orderItems {
          attributesSku
          quantity
          unitPrice
          salePrice
          subtotal
          variantOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const token = getUnifiedAccessToken();
  const response = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || "",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      query: CREATE_ORDER_MUTATION,
      variables: { input }
    })
  });

  if (!response.ok) {
    throw new Error(`Order creation request failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((err: any) => err.message).join("; "));
  }

  return payload.data?.createOrder;
}
