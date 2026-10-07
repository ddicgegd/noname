/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  CreditCard,
  QrCode,
  Check,
  X,
} from "lucide-react";
import HoloCard from "./HoloCard";
import { cn } from "@/lib/utils";

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  bgGradient: string;
  hoverBorderColor: string;
  checkIconColor: string;
  buttonClass: string;
  foilTint: string;
  glowColor: string;
  rimColor: string;
}

export interface HoloCardPaymentSheetProps {
  plan: PricingPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentOption {
  id: string;
  name: string;
  badge?: string;
  icon: React.ReactNode;
  detail: string;
  account?: string;
}

function AppleLogo({ className = "w-4 h-4 fill-current inline-block" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" className={className} aria-hidden="true">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.61-11.22-20.44-14.75-32.48-3.53-12.04-5.29-23.48-5.29-34.33 0-14.35 3.69-26.31 11.08-35.88 7.39-9.57 16.63-14.42 27.72-14.54 4.8 0 10.11 1.25 15.93 3.76 5.82 2.51 9.77 3.82 11.87 3.93 1.68-.11 5.92-1.53 12.74-4.25 6.82-2.72 12.51-3.93 17.07-3.63 13.51.78 24.16 5.85 31.95 15.22-11.98 7.29-17.84 17.3-17.58 30.05.24 10.13 4.14 18.52 11.71 25.18 7.57 6.66 16.48 10.45 26.73 11.37-2.61 7.74-5.77 15.14-9.48 22.2zM119.22 31.84c0-7.29 2.58-14.07 7.74-20.35 5.16-6.28 11.66-10.45 19.5-12.51.68 1.47 1.05 3.05 1.12 4.75.14 7.62-2.58 14.76-8.15 21.43-5.58 6.67-12.18 10.66-19.8 11.98-.12-1.74-.41-3.51-.41-5.3z" />
    </svg>
  );
}

const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: "apple_pay",
    name: "Apple Pay",
    badge: "Nhanh nhất",
    icon: (
      <span className="font-bold text-base tracking-tighter flex items-center gap-0.5">
        <AppleLogo className="w-3.5 h-3.5 fill-current mb-0.5" />
        <span>Pay</span>
      </span>
    ),
    detail: "Xác thực tức thì bằng Face ID / Touch ID",
    account: "Thiết bị Apple mặc định",
  },
  {
    id: "momo",
    name: "Ví MoMo",
    badge: "Phổ biến",
    icon: (
      <div className="w-5 h-5 rounded-md bg-[#A50064] text-white flex items-center justify-center font-bold text-[10px]">
        M
      </div>
    ),
    detail: "Liên kết ví MoMo hoặc quét mã QR tự động",
    account: "0988 ••• •89",
  },
  {
    id: "visa",
    name: "Thẻ Quốc Tế",
    icon: <CreditCard className="w-4 h-4 text-sky-500" />,
    detail: "Hỗ trợ Visa, Mastercard, JCB toàn cầu",
    account: "•••• 4242 (Hết hạn 08/28)",
  },
  {
    id: "vnpay",
    name: "VNPay QR",
    badge: "Không phí",
    icon: <QrCode className="w-4 h-4 text-emerald-500" />,
    detail: "Quét mã qua 40+ ứng dụng ngân hàng Việt Nam",
    account: "VietQR liên ngân hàng",
  },
];

export default function HoloCardPaymentSheet({
  plan,
  isOpen,
  onClose,
}: HoloCardPaymentSheetProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedMethod, setSelectedMethod] = useState<string>("apple_pay");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const shouldReduceMotion = useReducedMotion();
  const timersRef = useRef<number[]>([]);

  // Retain last active plan for exit animations
  const activePlanRef = useRef<PricingPlan | null>(plan);
  if (plan) {
    activePlanRef.current = plan;
  }
  const activePlan = plan ?? activePlanRef.current;

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Reset payment feedback states when sheet is closed
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      clearAllTimers();
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !activePlan) return null;

  // Price calculation
  const numericPrice = Number(activePlan.price.replace(/[^0-9.]/g, "")) || 0;
  const isFree = numericPrice === 0;
  const yearlyPriceNum = Math.round(numericPrice * 12 * 0.8);
  const displayPrice = isFree
    ? "$0"
    : billingCycle === "monthly"
    ? activePlan.price
    : `$${yearlyPriceNum}`;
  const displayPeriod = isFree
    ? "/vĩnh viễn"
    : billingCycle === "monthly"
    ? "/tháng"
    : "/năm (tiết kiệm 20%)";

  const handlePay = () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    const t1 = window.setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      const t2 = window.setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
      timersRef.current.push(t2);
    }, 1200);
    timersRef.current.push(t1);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:pb-6 pointer-events-none">
          {/* Backdrop with iOS blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-pointer pointer-events-auto"
            aria-hidden="true"
          />

          {/* Floating Glass Deck / Bottom Sheet Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="holo-payment-title"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { y: "100%", opacity: 0, scale: 0.96 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { y: "100%", opacity: 0, scale: 0.96 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.15 }
                : {
                    type: "spring",
                    damping: 30,
                    stiffness: 350,
                    mass: 0.85,
                  }
            }
            className={cn(
              "pointer-events-auto relative z-10 w-full max-w-3xl",
              "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl",
              "rounded-t-3xl sm:rounded-3xl",
              "border border-white/70 dark:border-white/15",
              "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]",
              "max-h-[90vh] overflow-y-auto no-scrollbar",
              "flex flex-col"
            )}
            style={{
              boxShadow: `0 20px 50px -10px ${activePlan.glowColor}, 0 0 0 1px rgba(255,255,255,0.6)`,
            }}
          >
            {/* Top Foil Rim Accent */}
            <div
              className="absolute inset-x-0 top-0 h-1 z-20"
              style={{
                background: `linear-gradient(90deg, transparent, ${activePlan.rimColor}, transparent)`,
              }}
            />

            {/* Grab Handle for iOS Sheet look */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Floating Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-neutral-200/70 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Deck Body: 2 Columns */}
            <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Interactive Hologram Card */}
              <div className="md:col-span-5 h-full flex flex-col">
                <HoloCard
                  plan={activePlan}
                  compact
                  hideButton
                  overridePrice={displayPrice}
                  overridePeriod={displayPeriod}
                />
              </div>

              {/* Right Column: Top-anchored & Bottom-anchored */}
              <div className="md:col-span-7 flex flex-col justify-between h-full pt-0.5">
                {/* Billing Cycle Section - Bevel Effect & Smooth Motion */}
                <div className="space-y-1.5">
                  <div
                    id="billing-cycle-label"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-0.5"
                  >
                    Kỳ thanh toán
                  </div>

                  {/* Recessed Beveled iOS Segmented Control with Rounded-2xl Frame */}
                  <div
                    role="radiogroup"
                    aria-labelledby="billing-cycle-label"
                    className="relative grid grid-cols-2 p-1.5 rounded-2xl bg-neutral-200/80 dark:bg-black/35 border border-black/[0.08] dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.06),inset_0_-1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_-1px_0_rgba(255,255,255,0.1)]"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={billingCycle === "monthly"}
                      onClick={() => setBillingCycle("monthly")}
                      className={cn(
                        "relative py-2.5 rounded-xl text-xs transition-colors cursor-pointer select-none font-medium text-center z-10",
                        billingCycle === "monthly"
                          ? "text-neutral-900 dark:text-white font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                      )}
                    >
                      {billingCycle === "monthly" && (
                        <motion.div
                          layoutId="billing-pill-active"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.09),0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] border border-black/[0.04] dark:border-white/10 -z-10"
                        />
                      )}
                      Hàng tháng
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={billingCycle === "yearly"}
                      onClick={() => setBillingCycle("yearly")}
                      className={cn(
                        "relative py-2.5 rounded-xl text-xs transition-colors cursor-pointer select-none font-medium flex items-center justify-center gap-1.5 z-10",
                        billingCycle === "yearly"
                          ? "text-neutral-900 dark:text-white font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                      )}
                    >
                      {billingCycle === "yearly" && (
                        <motion.div
                          layoutId="billing-pill-active"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.09),0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] border border-black/[0.04] dark:border-white/10 -z-10"
                        />
                      )}
                      <span>Hàng năm</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                        -20%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-1.5">
                  <div
                    id="payment-methods-label"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                  >
                    Phương thức thanh toán
                  </div>

                  <div
                    role="radiogroup"
                    aria-labelledby="payment-methods-label"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {PAYMENT_METHODS.map((m) => {
                      const isSelected = selectedMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => setSelectedMethod(m.id)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setSelectedMethod(m.id);
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 select-none",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                            isSelected
                              ? "bg-sky-50/80 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600 shadow-xs ring-1 ring-sky-400/20"
                              : "bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0">
                              {m.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.badge && (
                                  <span className="text-[9px] font-medium px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                {m.account}
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "border-sky-500 bg-sky-500 text-white"
                                : "border-neutral-300 dark:border-neutral-600"
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA Button - Bottom Anchored & Bevel Effect */}
                <div className="mt-auto pt-3">
                  <button
                    type="button"
                    disabled={isProcessing || isSuccess}
                    onClick={handlePay}
                    className={cn(
                      "w-full py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide select-none text-white",
                      "flex items-center justify-center cursor-pointer",
                      "border-t border-t-white/60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                      "transition-all duration-200 active:scale-[0.985] active:brightness-95",
                      isSuccess
                        ? "bg-emerald-600 shadow-emerald-600/30 border-b-2 border-b-emerald-800"
                        : activePlan.id === "free"
                        ? "bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-b-2 border-b-[#0369A1] hover:brightness-105"
                        : "bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] border-b-2 border-b-[#991B1B] hover:brightness-105",
                      isProcessing && "opacity-85 cursor-wait"
                    )}
                    style={{
                      boxShadow: !isSuccess
                        ? `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.12), 0 8px 24px -4px ${activePlan.glowColor}`
                        : undefined,
                    }}
                  >
                    {isProcessing ? (
                      <span>Đang kết nối...</span>
                    ) : isSuccess ? (
                      <span>Thành công!</span>
                    ) : (
                      <span>Thanh toán</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
