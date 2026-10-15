/**
 * TypeScript Interfaces & Data Models for Subscriptions & Google Pay Integration
 */

export interface ApiResponse<T> {
  status?: {
    message: string;
    code: number;
  };
  data?: T;
  type?: string;
  title?: string;
  detail?: string;
  errorCode?: string;
}

export type SubscriptionState =
  | 'PENDING'
  | 'TRIALING'
  | 'ACTIVE'
  | 'IN_GRACE_PERIOD'
  | 'EXPIRED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'VNPAY'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'MOMO'
  | 'PAYPAL'
  | 'COD'
  | 'GOOGLE_PAY';

export interface SubscriptionPlan {
  id: number;
  planCode: 'SILVER_3M' | 'GOLD_6M' | 'PLATINUM_12M' | string;
  name: string;
  targetRank: 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | string;
  billingPeriodMonths: number;
  freeTrialDays: number;
  priceAmount: number;
  currency: string;
  isActive: boolean;
  description: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  planId?: number;
  planCode: string;
  planName?: string;
  targetRank: string;
  billingPeriodMonths: number;
  subscriptionState: SubscriptionState;
  isTrial: boolean;
  startTime: string;
  expiryTime: string;
  autoRenewing: boolean;
  paymentProfileId?: string;
}

export interface GooglePayWebRegisterRequest {
  planCode: string;
  paymentToken: string;
  cardNetwork?: string;
  lastFour?: string;
}

export interface OneTimePurchaseRequest {
  planCode: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  note?: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

export interface GooglePayRequestOptions {
  priceAmount: number;
  currencyCode?: string;
  merchantName?: string;
}

export interface ExtractedTokenPayload {
  paymentToken: string;
  cardNetwork: string;
  lastFour: string;
}
