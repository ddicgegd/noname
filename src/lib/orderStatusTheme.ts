/**
 * Horizon UI - Order Status Semantic Color Engine
 * Standardized 3D Glassmorphism Bevel styling and color tokens for Order Tracking
 */

export type OrderStatusKey =
  | "WAITING_PAYMENT"
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "UNKNOWN";

export interface StatusThemeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  glowClass: string;
  iconColor: string;
  borderAccent: string;
  timelineActiveRing: string;
  timelineLineGradient: string;
}

export const ORDER_STATUS_THEMES: Record<string, StatusThemeConfig> = {
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    badgeClass: "text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100/80 border-t-white border-b-amber-300/80 border-x-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-amber-500",
    glowClass: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    iconColor: "text-amber-600",
    borderAccent: "border-l-amber-500",
    timelineActiveRing: "ring-4 ring-amber-100 text-amber-600 bg-white border-2 border-amber-500",
    timelineLineGradient: "from-amber-300 to-indigo-300",
  },
  PENDING: {
    label: "Chờ xử lý",
    badgeClass: "text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100/80 border-t-white border-b-amber-300/80 border-x-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-amber-500",
    glowClass: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    iconColor: "text-amber-600",
    borderAccent: "border-l-amber-500",
    timelineActiveRing: "ring-4 ring-amber-100 text-amber-600 bg-white border-2 border-amber-500",
    timelineLineGradient: "from-amber-300 to-indigo-300",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    badgeClass: "text-indigo-700 bg-gradient-to-b from-indigo-50 via-indigo-50/80 to-indigo-100/60 border-t-white border-b-indigo-200/80 border-x-indigo-100/80 shadow-[0_1px_2px_rgba(99,102,241,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-indigo-600",
    glowClass: "shadow-[0_0_8px_rgba(99,102,241,0.5)]",
    iconColor: "text-indigo-600",
    borderAccent: "border-l-indigo-600",
    timelineActiveRing: "ring-4 ring-indigo-100 text-indigo-600 bg-white border-2 border-indigo-600",
    timelineLineGradient: "from-indigo-400 to-sky-400",
  },
  PROCESSING: {
    label: "Đang xử lý",
    badgeClass: "text-indigo-700 bg-gradient-to-b from-indigo-50 via-indigo-50/80 to-indigo-100/60 border-t-white border-b-indigo-200/80 border-x-indigo-100/80 shadow-[0_1px_2px_rgba(99,102,241,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-indigo-600",
    glowClass: "shadow-[0_0_8px_rgba(99,102,241,0.5)]",
    iconColor: "text-indigo-600",
    borderAccent: "border-l-indigo-600",
    timelineActiveRing: "ring-4 ring-indigo-100 text-indigo-600 bg-white border-2 border-indigo-600",
    timelineLineGradient: "from-indigo-400 to-sky-400",
  },
  SHIPPED: {
    label: "Đang vận chuyển",
    badgeClass: "text-sky-800 bg-gradient-to-b from-sky-50 to-sky-100/80 border-t-white border-b-sky-300/80 border-x-sky-200/70 shadow-[0_1px_2px_rgba(14,165,233,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-sky-500",
    glowClass: "shadow-[0_0_8px_rgba(14,165,233,0.5)]",
    iconColor: "text-sky-600",
    borderAccent: "border-l-sky-500",
    timelineActiveRing: "ring-4 ring-sky-100 text-sky-600 bg-white border-2 border-sky-500",
    timelineLineGradient: "from-sky-400 to-emerald-400",
  },
  DELIVERED: {
    label: "Giao thành công",
    badgeClass: "text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-100/80 border-t-white border-b-emerald-300/80 border-x-emerald-200/80 shadow-[0_1px_2px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-emerald-500",
    glowClass: "shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    iconColor: "text-emerald-600",
    borderAccent: "border-l-emerald-500",
    timelineActiveRing: "ring-4 ring-emerald-100 text-emerald-600 bg-white border-2 border-emerald-500",
    timelineLineGradient: "from-emerald-400 to-emerald-500",
  },
  COMPLETED: {
    label: "Hoàn tất",
    badgeClass: "text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-100/80 border-t-white border-b-emerald-300/80 border-x-emerald-200/80 shadow-[0_1px_2px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-emerald-500",
    glowClass: "shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    iconColor: "text-emerald-600",
    borderAccent: "border-l-emerald-500",
    timelineActiveRing: "ring-4 ring-emerald-100 text-emerald-600 bg-white border-2 border-emerald-500",
    timelineLineGradient: "from-emerald-400 to-emerald-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeClass: "text-rose-700 bg-gradient-to-b from-rose-50 to-red-100/60 border-t-white border-b-red-200 border-x-red-100 shadow-[0_1px_2px_rgba(244,63,94,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-rose-500",
    glowClass: "shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    iconColor: "text-rose-600",
    borderAccent: "border-l-rose-500",
    timelineActiveRing: "ring-4 ring-rose-100 text-rose-600 bg-white border-2 border-rose-500",
    timelineLineGradient: "from-rose-300 to-rose-400",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    badgeClass: "text-rose-700 bg-gradient-to-b from-rose-50 to-red-100/60 border-t-white border-b-red-200 border-x-red-100 shadow-[0_1px_2px_rgba(244,63,94,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-rose-500",
    glowClass: "shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    iconColor: "text-rose-600",
    borderAccent: "border-l-rose-500",
    timelineActiveRing: "ring-4 ring-rose-100 text-rose-600 bg-white border-2 border-rose-500",
    timelineLineGradient: "from-rose-300 to-rose-400",
  },
};

export function getOrderStatusTheme(rawStatus?: string): StatusThemeConfig {
  const normalized = (rawStatus || "").trim().toUpperCase();
  if (ORDER_STATUS_THEMES[normalized]) {
    return ORDER_STATUS_THEMES[normalized];
  }

  // Fallback heuristic based on keywords
  if (normalized.includes("WAIT") || normalized.includes("PENDING")) {
    return ORDER_STATUS_THEMES.WAITING_PAYMENT;
  }
  if (normalized.includes("SHIP") || normalized.includes("DELIVERING") || normalized.includes("TRANSIT")) {
    return ORDER_STATUS_THEMES.SHIPPED;
  }
  if (normalized.includes("COMPLETE") || normalized.includes("DELIVERED") || normalized.includes("DONE")) {
    return ORDER_STATUS_THEMES.COMPLETED;
  }
  if (normalized.includes("CANCEL") || normalized.includes("REFUND")) {
    return ORDER_STATUS_THEMES.CANCELLED;
  }
  if (normalized.includes("PROCESS") || normalized.includes("CONFIRM")) {
    return ORDER_STATUS_THEMES.PROCESSING;
  }

  return {
    label: rawStatus || "Không xác định",
    badgeClass: "text-slate-700 bg-gradient-to-b from-slate-50 to-slate-100/80 border-t-white border-b-slate-300 border-x-slate-200 shadow-[0_1px_2px_rgba(100,116,139,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
    dotClass: "bg-slate-500",
    glowClass: "shadow-[0_0_8px_rgba(100,116,139,0.4)]",
    iconColor: "text-slate-500",
    borderAccent: "border-l-slate-400",
    timelineActiveRing: "ring-4 ring-slate-100 text-slate-700 bg-white border-2 border-slate-400",
    timelineLineGradient: "from-slate-300 to-slate-400",
  };
}
