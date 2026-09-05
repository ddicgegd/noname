/**
 * TypeScript Typings & Data Contracts for Shopping Cart GraphQL API
 * Aligned with GraphQL Shopping Cart Service & Gateway Specification
 */

export interface Status {
  code: number;
  message: string;
}

export interface SpecificationItem {
  key?: string;
  data?: string;
  value?: string;
  name?: string;
}

export interface SpecificationGroup {
  groupName: string;
  specifications: SpecificationItem[];
}

export interface CartItem {
  sku: string;
  productName?: string;
  imageUrl?: string;
  attributesTitle?: string;
  unitPrice?: number;
  salePrice?: number;
  quantity: number;
  subTotal?: number;
  isAvailable?: boolean;
  stock?: number;
  specifications?: string | SpecificationGroup[]; // JSON serialized string from GraphQL or parsed groups
  promotions?: string; // JSON serialized string from GraphQL
  availableColors?: string[];
  availableSizes?: string[];
  discount?: string;
}

export interface ShoppingCartData {
  username?: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalSalePrice: number;
  totalDiscount: number;
  finalAmount: number;
}

export interface ShoppingCartResponse {
  status: Status;
  data?: ShoppingCartData | null;
}

export interface CartCountResponse {
  status: Status;
  data?: number | null;
}

export interface CartItemInput {
  sku: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

// Backward-compatible alias for existing consumers
export type Cart = ShoppingCartData;

export interface CartSummaryBadge {
  totalItems: number;
}

export type CartErrorCode =
  | 'ATTRIBUTES_OUT_OF_STOCK'
  | 'VALIDATION_FAILED'
  | 'ATTRIBUTES_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'ACCESS_DENIED';

// Standard RFC 7807 error format in GraphQL extensions
export interface GraphQLErrorExtensions {
  classification: string;
  errorCode: CartErrorCode;
  status: number;
  title: string;
  detail: string;
  fieldErrors?: Record<string, string>;
}
