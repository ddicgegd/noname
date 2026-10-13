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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import HoloCard from "./HoloCard";
import { cn } from "@/lib/utils";
import { getAppErrorMessage } from "./ui/AppErrorNotice";
import type { UserSubscription, PaymentMethod } from "../types/subscription";
import {
  registerGooglePaySubscription,
  purchaseOneTimeSubscription,
} from "../services/subscriptionService";
export interface PricingPlan {
  id: string;
  planCode?: string;
  priceAmount?: number;
  freeTrialDays?: number;
  targetRank?: string;
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

function GooglePayLogo({ className = "h-4 inline-block" }: { className?: string }) {
  return (
    <span className="font-bold text-xs tracking-tight flex items-center gap-1">
      <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0" aria-hidden="true">
        <path fill="#4285F4" d="M46.145 24.5c0-1.57-.14-3.09-.4-4.5H24v8.52h12.43c-.54 2.87-2.19 5.31-4.66 6.94v5.77h7.55c4.42-4.07 6.825-10.06 6.825-16.73z"/>
        <path fill="#34A853" d="M24 47c6.21 0 11.42-2.06 15.23-5.59l-7.55-5.77c-2.06 1.38-4.7 2.2-7.68 2.2-5.91 0-10.92-3.99-12.71-9.36H3.34v5.96C7.15 42.06 14.95 47 24 47z"/>
        <path fill="#FBBC05" d="M11.29 28.48c-.45-1.35-.71-2.79-.71-4.28 0-1.49.26-2.93.71-4.28V13.96H3.34C1.86 16.91 1 20.24 1 24s.86 7.09 2.34 10.04l7.95-5.56z"/>
        <path fill="#EA4335" d="M24 10.16c3.38 0 6.41 1.16 8.79 3.44l6.59-6.59C35.41 3.25 30.2 1 24 1 14.95 1 7.15 5.94 3.34 13.96l7.95 5.96c1.79-5.37 6.8-9.36 12.71-9.36z"/>
      </svg>
      <span>Pay</span>
    </span>
  );
}

const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: "gpay",
    name: "Google Pay",
    badge: "Ưu tiên",
    icon: <GooglePayLogo />,
    detail: "Google Wallet & Thẻ liên kết",
    account: "Visa / Mastercard quốc tế",
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
    detail: "Liên kết ví MoMo hoặc quét QR tự động",
    account: "0988 ••• •89",
  },
  {
    id: "card",
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
    detail: "Quét mã qua 40+ ứng dụng ngân hàng",
    account: "VietQR liên ngân hàng",
  },
];

export default function HoloCardPaymentSheet({
  plan,
  isOpen,
  onClose,
}: HoloCardPaymentSheetProps) {
  const [billingCycle, setBillingCycle] = useState<"quarterly" | "yearly">("quarterly");
  const [selectedMethod, setSelectedMethod] = useState<string>("gpay");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ planName: string; expiryTime?: string } | null>(null);
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
      setErrorMessage(null);
      setSuccessInfo(null);
      clearAllTimers();
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

  // Price calculation based on DB billing periods: 3 months and 1 year
  const baseMonthlyAmount = activePlan.priceAmount ?? (activePlan.id === "pro" ? 120000 : 30000);
  const quarterlyAmount = baseMonthlyAmount * 3;
  const yearlyAmount = Math.round(baseMonthlyAmount * 12 * 0.8);

  const displayPrice =
    billingCycle === "quarterly"
      ? `${quarterlyAmount.toLocaleString("vi-VN")}₫`
      : `${yearlyAmount.toLocaleString("vi-VN")}₫`;

  const displayPeriod =
    billingCycle === "quarterly" ? "/3 tháng" : "/năm (tiết kiệm 20%)";

  const handlePay = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const planCode = activePlan.planCode || (activePlan.id === "pro" ? "MA_THUAT" : "ANH_KIM");
    const cycleLabel = billingCycle === "yearly" ? "1 năm (-20%)" : "3 tháng";

    try {
      if (selectedMethod === "gpay") {
        const res = await registerGooglePaySubscription({
          planCode,
          paymentToken: "tok_gpay_wallet_" + Date.now(),
          cardNetwork: "VISA",
          lastFour: "4242",
        });
        setSuccessInfo({
          planName: res.planName || activePlan.name,
          expiryTime: res.expiryTime,
        });
      } else {
        let method: PaymentMethod = "VNPAY";
        if (selectedMethod === "momo") method = "MOMO";
        else if (selectedMethod === "card") method = "CREDIT_CARD";
        else if (selectedMethod === "vnpay") method = "VNPAY";

        const res = await purchaseOneTimeSubscription({
          planCode,
          paymentMethod: method,
          transactionReference: `${method}_TXN_${Date.now()}`,
          note: `Thanh toán gói ${activePlan.name} chu kỳ ${cycleLabel}`,
        });
        setSuccessInfo({
          planName: res.planName || activePlan.name,
          expiryTime: res.expiryTime,
        });
      }

      setIsSuccess(true);
      const t = window.setTimeout(() => {
        onClose();
      }, 3500);
      timersRef.current.push(t);
    } catch (err: unknown) {
      setErrorMessage(getAppErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:pb-6 pointer-events-none">
          {/* Backdrop with iOS blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.28, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
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
                : { y: "calc(100% + 56px)" }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    y: 0,
                    transition: {
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : {
                    y: "calc(100% + 56px)",
                    transition: {
                      duration: 0.22,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
            }
            className={cn(
              "pointer-events-auto relative z-10 w-full max-w-3xl",
              "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl",
              "rounded-t-3xl sm:rounded-3xl",
              "border border-white/70 dark:border-white/15",
              "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]",
              "max-h-[90vh] overflow-y-auto no-scrollbar",
              "flex flex-col"
            )}
            style={{
              willChange: "transform",
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

            {/* Deck Body: 2 Columns */}
            <div className="p-4 sm:p-5.5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
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
                <div className="space-y-3">
                  {/* Billing Cycle Section - Compact Segmented Control with Optical Bevel */}
                  <div
                    role="radiogroup"
                    aria-label="Kỳ thanh toán"
                    className="relative grid grid-cols-2 p-1 rounded-full bg-neutral-200/80 dark:bg-black/35 border-black/[0.08] dark:border-white/10 shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.12),inset_0_0.5px_1px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.08)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={billingCycle === "quarterly"}
                      onClick={() => setBillingCycle("quarterly")}
                      className={cn(
                        "relative py-1.5 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none text-center z-10 flex items-center justify-center",
                        billingCycle === "quarterly"
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                      )}
                    >
                      {billingCycle === "quarterly" && (
                        <motion.div
                          layoutId="billing-pill-active"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.09),0_1px_2px_rgba(0,0,0,0.05)] dark:border-t-white/30 border-black/[0.04] dark:border-white/10 -z-10 outline-none focus:outline-none focus-visible:outline-none"
                        />
                      )}
                      <span>3 tháng</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={billingCycle === "yearly"}
                      onClick={() => setBillingCycle("yearly")}
                      className={cn(
                        "relative py-1.5 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none text-center z-10 flex items-center justify-center gap-1.5",
                        billingCycle === "yearly"
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                      )}
                    >
                      {billingCycle === "yearly" && (
                        <motion.div
                          layoutId="billing-pill-active"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.09),0_1px_2px_rgba(0,0,0,0.05)] dark:border-t-white/30 border-black/[0.04] dark:border-white/10 -z-10 outline-none focus:outline-none focus-visible:outline-none"
                        />
                      )}
                      <span>1 năm</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        -20%
                      </span>
                    </button>
                  </div>

                  {/* Payment Methods */}
                  <div
                    role="radiogroup"
                    aria-label="Phương thức thanh toán"
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
                            "p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 select-none",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                            isSelected
                              ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-400/80 dark:border-sky-500/70 ring-1 ring-sky-400/30 shadow-xs"
                              : "bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 flex items-center justify-center shrink-0">
                              {m.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.badge && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-700/70 text-neutral-600 dark:text-neutral-300">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {m.account ?? m.detail}
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "bg-sky-500 text-white shadow-xs"
                                : "border border-neutral-300 dark:border-neutral-600"
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Error Banner */}
                {errorMessage && (
                  <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <div className="flex-1">
                      <div className="font-semibold">Thanh toán chưa thành công</div>
                      <div className="text-[11px] opacity-90">{errorMessage}</div>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {isSuccess && successInfo && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <div className="font-semibold">Kích hoạt thành công {successInfo.planName}!</div>
                      {successInfo.expiryTime && (
                        <div className="text-[11px] opacity-90">
                          Hạn dùng đến: {new Date(successInfo.expiryTime).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action CTA Button - Bottom Anchored & Bevel Effect */}
                <div className="mt-auto pt-3">
                  <button
                    type="button"
                    disabled={isProcessing || isSuccess}
                    onClick={handlePay}
                    className={cn(
                      "w-full py-3 px-5 rounded-xl font-bold text-sm tracking-wide select-none text-white",
                      "flex items-center justify-center cursor-pointer",
                      "border border-black/[0.04] dark:border-white/[0.05] outline-none focus:outline-none focus-visible:outline-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                      "transition-all duration-200 active:scale-[0.985] active:brightness-95",
                      isSuccess
                        ? "bg-emerald-600 shadow-[0_4px_14px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.12)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]"
                        : activePlan.id === "free"
                        ? "bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_4px_14px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.12)] hover:brightness-105 outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]"
                        : "bg-gradient-to-b from-[#FF5E3A] to-[#E03A12] shadow-[0_4px_14px_rgba(255,94,58,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.12)] hover:brightness-105 outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
                      isProcessing && "opacity-85 cursor-wait"
                    )}
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
