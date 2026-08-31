// Quản lý tập trung các khóa lưu trữ (Storage Keys)

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  CURRENT_USER: "current_user",
  USER_PROFILE: "user_profile",
  REFRESH_TOKENS_MAP: "refresh_tokens_map",
  DEVICE_ID: "device_id",
  USE_API_PROXY: "use_api_proxy",

  CART_ITEMS: "cart_items",
  GUEST_ID: "guest_id",
  BUY_NOW_PRODUCT: "buy_now_product",
  USER_ORDERS: "user_orders",
  USER_ADDRESSES: "user_addresses",
  USER_PAYMENT_METHODS: "user_payment_methods",

  AUTH_AUDIT_LOGS: "auth_audit_logs",
  ADDRESS_API_LOGS: "address_api_logs",

  LAST_REGISTRATION_EMAIL: "last_registration_email",
  LAST_REGISTRATION_TOKEN: "last_registration_token",
  LAST_REGISTRATION_USERNAME: "last_registration_username",
  LAST_REGISTRATION_PASSWORD: "last_registration_password",
  LAST_REGISTRATION_MESSAGE: "last_registration_message",
  VERIFY_API_PATH: "verify_api_path",
  RECOVERY_USER_ROLES: "recovery_user_roles",
  PENDING_AUTH_ACTION: "pending_auth_action"
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
