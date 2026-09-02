/**
 * TypeScript Typings & Data Contracts for Shopping Cart GraphQL API
 */

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
  quantity: number;
  // Detailed fields (returned when queried)
  productName?: string;
  imageUrl?: string;
  attributesTitle?: string;
  unitPrice?: number;
  salePrice?: number;
  subTotal?: number;
  isAvailable?: boolean;
  stock?: number;
  specifications?: SpecificationGroup[];
}

export interface Cart {
  username?: string;
  totalItems: number;
  totalPrice: number;
  totalSalePrice: number;
  totalDiscount: number;
  finalAmount: number;
  items: CartItem[];
}

export interface CartSummaryBadge {
  totalItems: number;
}

export interface CartItemInput {
  sku: string;
  quantity: number;
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
