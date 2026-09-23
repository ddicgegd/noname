/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Trash2,
  X,
  PackageOpen,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useChainedSpringList } from "@/hooks/useChainedSpringList";
import {
  addToCart as apiAddToCart,
  updateCartItemQuantity as apiUpdateCartQuantity,
  removeCartItem as apiRemoveCartItem,
} from "@/services/cartService";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_KEYS } from "@/lib/storageKeys";

export interface CartDropdownItem {
  id: string;
  sku?: string;
  name: string;
  price: string;
  oldPrice?: string;
  icon?: string;
  quantity?: number;
  imageUrl?: string;
  color?: string;
  size?: string;
  availableColors?: string[];
  availableSizes?: string[];
  discount?: string;
}

export interface CartDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartDropdownItem[];
  onAddToCart?: (itemName: string, itemPrice: string, e?: any, sku?: string) => void;
  onRemoveCartItem?: (id: string | string[]) => void;
  onNavigate?: (page: string) => void;
  position?: "top" | "bottom";
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const resolveProductMetadata = (skuOrName: string) => {
  const s = (skuOrName || "").toUpperCase();
  if (s.includes("GP9PXL") || s.includes("PIXEL 9") || s.includes("PIXEL9")) {
    return {
      name: "Google Pixel 9 Pro XL 128GB - Obsidian",
      imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80",
      colors: ["Obsidian", "Porcelain", "Hazel", "Rose"],
      sizes: ["128GB", "256GB", "512GB", "1TB"],
      defaultColor: "Obsidian",
      defaultSize: "128GB",
      discount: "Giảm 12%",
    };
  }
  if (s.includes("IP16PM") || s.includes("IPHONE 16") || s.includes("IPHONE16")) {
    return {
      name: "iPhone 16 Pro Max 256GB - Titanium Sa Mạc",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
      colors: ["Titan Sa Mạc", "Titan Tự Nhiên", "Titan Đen", "Titan Trắng"],
      sizes: ["256GB", "512GB", "1TB"],
      defaultColor: "Titan Sa Mạc",
      defaultSize: "256GB",
      discount: "Giảm 8%",
    };
  }
  if (s.includes("IP15PM") || s.includes("IPHONE 15") || s.includes("IPHONE15")) {
    return {
      name: "iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
      colors: ["Titan Tự Nhiên", "Titan Xanh", "Titan Đen", "Titan Trắng"],
      sizes: ["256GB", "512GB", "1TB"],
      defaultColor: "Titan Tự Nhiên",
      defaultSize: "256GB",
      discount: "Giảm 15%",
    };
  }
  if (s.includes("S24U") || s.includes("S25U") || s.includes("SAMSUNG") || s.includes("GALAXY S24")) {
    return {
      name: "Samsung Galaxy S24 Ultra 512GB - Xám Titan",
      imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=80",
      colors: ["Xám Titan", "Đen Titan", "Tím Titan", "Vàng Titan"],
      sizes: ["256GB", "512GB", "1TB"],
      defaultColor: "Xám Titan",
      defaultSize: "512GB",
      discount: "Giảm 11%",
    };
  }
  if (s.includes("MI14U") || s.includes("MI15U") || s.includes("XIAOMI")) {
    return {
      name: "Xiaomi 14 Ultra 512GB - Trắng Gốm Leica",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80",
      colors: ["Trắng Gốm", "Đen Da", "Xanh Titan"],
      sizes: ["512GB", "1TB"],
      defaultColor: "Trắng Gốm",
      defaultSize: "512GB",
      discount: "Giảm 14%",
    };
  }
  if (s.includes("AIRPOD") || s.includes("TAI NGHE")) {
    return {
      name: "AirPods Pro Gen 2 (MagSafe USB-C)",
      imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80",
      colors: ["Trắng", "Đen"],
      sizes: ["Tiêu chuẩn", "USB-C MagSafe"],
      defaultColor: "Trắng",
      defaultSize: "USB-C MagSafe",
      discount: "Giảm 10%",
    };
  }
  if (s.includes("IPAD")) {
    return {
      name: "iPad Pro M4 11-inch 256GB - Silver WiFi",
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80",
      colors: ["Bạc Silver", "Xám Space"],
      sizes: ["256GB", "512GB", "1TB"],
      defaultColor: "Bạc Silver",
      defaultSize: "256GB",
      discount: "Giảm 9%",
    };
  }
  if (s.includes("TABS10") || s.includes("TAB S10")) {
    return {
      name: "Samsung Galaxy Tab S10 Ultra 256GB 5G",
      imageUrl: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=500&auto=format&fit=crop&q=80",
      colors: ["Xám Moonstone", "Bạc Platinum"],
      sizes: ["256GB", "512GB"],
      defaultColor: "Xám Moonstone",
      defaultSize: "256GB",
      discount: "Giảm 12%",
    };
  }
  if (s.includes("MBP") || s.includes("MACBOOK")) {
    return {
      name: "MacBook Pro 16-inch M4 Pro 48GB 1TB",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80",
      colors: ["Đen Space Black", "Bạc Silver"],
      sizes: ["512GB", "1TB", "2TB"],
      defaultColor: "Đen Space Black",
      defaultSize: "1TB",
      discount: "Giảm 7%",
    };
  }
  if (s.includes("LENTAB") || s.includes("LEGION") || s.includes("LENOVO")) {
    return {
      name: "Lenovo Legion Tab Gen 2 12GB 256GB - Storm Grey",
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80",
      colors: ["Storm Grey", "Eclipse Black"],
      sizes: ["12GB/256GB", "16GB/512GB"],
      defaultColor: "Storm Grey",
      defaultSize: "12GB/256GB",
      discount: "Giảm 10%",
    };
  }
  return {
    name: skuOrName.startsWith("ATTR-") ? skuOrName.replace(/^ATTR-/, "").replace(/-/g, " ") : (skuOrName || "Sản phẩm công nghệ"),
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80",
    colors: ["Titan Sa Mạc", "Titan Tự Nhiên", "Titan Đen", "Titan Trắng"],
    sizes: ["128GB", "256GB", "512GB", "1TB"],
    defaultColor: "Titan Sa Mạc",
    defaultSize: "256GB",
    discount: "Giảm 10%",
  };
};

const calculateCartDiscount = (priceStr?: string, oldPriceStr?: string) => {
  if (!priceStr || !oldPriceStr) return "Giảm 10%";
  const p = parseFloat(priceStr.replace(/[^0-9]/g, ""));
  const o = parseFloat(oldPriceStr.replace(/[^0-9]/g, ""));
  if (o > p && o > 0) {
    const pct = Math.round(((o - p) / o) * 100);
    return `Giảm ${pct}%`;
  }
  return "Giảm 10%";
};

export function CartDropdownMenu({
  isOpen,
  onClose,
  cartItems = [],
  onAddToCart,
  onRemoveCartItem,
  onNavigate,
  position = "top",
  onMouseEnter,
  onMouseLeave,
}: CartDropdownMenuProps) {
  const { showToast } = useToast();
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
  const variantCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const knownGroupKeysRef = useRef<Set<string>>(new Set());

  const parsePrice = (priceStr: string) => {
    if (priceStr.includes("Trả góp")) return 0;
    const isVnd = priceStr.includes("đ") || !priceStr.includes("$");
    const cleanStr = priceStr.replace(/[^0-9.,]/g, "");
    if (isVnd) {
      const numStr = cleanStr.replace(/\./g, "").replace(/,/g, "");
      return parseFloat(numStr) || 0;
    } else {
      const numStr = cleanStr;
      return parseFloat(numStr) || 0;
    }
  };

  const isVndCurrency = cartItems.some(item => item.price?.includes("đ") || !item.price?.includes("$"));

  const formatPrice = (val: number) => {
    if (isVndCurrency) {
      return val.toLocaleString("vi-VN") + "đ";
    } else {
      return "$" + val.toFixed(2);
    }
  };

  // Group cart items
  const groupedCartItems = cartItems.reduce((acc, item) => {
    const meta = resolveProductMetadata(item.name || item.sku || "");
    const color = item.color || meta.defaultColor;
    const size = item.size || meta.defaultSize;
    const availableColors = item.availableColors || meta.colors;
    const availableSizes = item.availableSizes || meta.sizes;
    const displayName = (item.name && !item.name.startsWith("ATTR-")) ? item.name : meta.name;
    const imageUrl = item.imageUrl || meta.imageUrl;
    const discount = item.discount || (item.oldPrice ? calculateCartDiscount(item.price, item.oldPrice) : undefined) || meta.discount || "Giảm 10%";

    const groupKey = `${displayName}-${color}-${size}-${item.price}`;
    const existing = acc.find(i => i.groupKey === groupKey);
    const itemQty = item.quantity || 1;
    if (existing) {
      existing.ids.push(item.id);
      existing.quantity += itemQty;
    } else {
      acc.push({
        id: item.id,
        groupKey,
        sku: item.sku,
        name: displayName,
        price: item.price,
        unitPrice: item.price,
        oldPrice: item.oldPrice,
        discount,
        icon: item.icon,
        imageUrl,
        color,
        availableColors,
        size,
        availableSizes,
        ids: [item.id],
        quantity: itemQty,
      });
    }
    return acc;
  }, [] as {
    id: string;
    groupKey: string;
    sku?: string;
    name: string;
    price: string;
    unitPrice: string;
    oldPrice?: string;
    discount?: string;
    icon?: string;
    imageUrl?: string;
    color: string;
    availableColors: string[];
    size: string;
    availableSizes: string[];
    ids: string[];
    quantity: number;
  }[]);

  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  useEffect(() => {
    const currentKeys = groupedCartItems.map(item => item.groupKey);
    const brandNewKeys = currentKeys.filter(k => !knownGroupKeysRef.current.has(k));

    currentKeys.forEach(k => knownGroupKeysRef.current.add(k));

    knownGroupKeysRef.current.forEach((k) => {
      if (!currentKeys.includes(k)) {
        knownGroupKeysRef.current.delete(k);
      }
    });

    if (brandNewKeys.length > 0) {
      setSelectedGroupKeys(prev => {
        const toAdd = brandNewKeys.filter(k => !prev.includes(k));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    } else {
      setSelectedGroupKeys(prev => prev.filter(k => currentKeys.includes(k)));
    }
  }, [groupedCartItems]);

  const handleToggleExpand = (groupKey: string) => {
    if (!selectedGroupKeys.includes(groupKey)) return;
    setExpandedGroupKey(prev => prev === groupKey ? null : groupKey);
  };

  const handleSelectVariant = async (groupKey: string, newColor: string, newSize: string) => {
    const target = groupedCartItems.find(g => g.groupKey === groupKey);
    if (!target) return;

    const isIphone = target.name.toLowerCase().includes("iphone");
    let newSku = target.sku;
    if (isIphone) {
      const colorMap: Record<string, string> = {
        "Titan Sa Mạc": "DESERT",
        "Titan Tự Nhiên": "NATURAL",
        "Titan Đen": "BLACK",
        "Titan Trắng": "WHITE"
      };
      const cCode = colorMap[newColor] || "DESERT";
      newSku = `ATTR-IP16PM-${newSize}-${cCode}`;
    }

    if (target.sku && newSku && target.sku !== newSku) {
      try {
        await apiRemoveCartItem(target.sku);
        await apiAddToCart([{ sku: newSku, quantity: target.quantity }]);
      } catch (_) {}
    }
    setExpandedGroupKey(null);
  };

  const calculateTotalValue = () => {
    let sum = 0;
    groupedCartItems.forEach((group) => {
      if (selectedGroupKeys.includes(group.groupKey)) {
        sum += parsePrice(group.unitPrice || group.price) * group.quantity;
      }
    });
    return sum;
  };

  const getSelectedItemsCount = () => {
    let count = 0;
    groupedCartItems.forEach((group) => {
      if (selectedGroupKeys.includes(group.groupKey)) {
        count += group.quantity;
      }
    });
    return count;
  };

  const { bindDrag, dismissIndices, isDismissing, offsets, activeIdx } = useChainedSpringList({
    items: groupedCartItems,
    onDismiss: (item) => {
      const idsToRemove = item.sku ? [item.sku] : item.ids;
      if (onRemoveCartItem) {
        onRemoveCartItem(idsToRemove);
        setSelectedGroupKeys(prev => prev.filter(k => k !== item.groupKey));
      } else if (item.sku) {
        apiRemoveCartItem(item.sku).catch(() => {});
        setSelectedGroupKeys(prev => prev.filter(k => k !== item.groupKey));
      }
    },
    tensionDecay: 0.35,
    maxChainedDepth: 3,
  });

  const handleDeleteSelected = () => {
    const idsToRemove: string[] = [];
    groupedCartItems.forEach((group) => {
      if (selectedGroupKeys.includes(group.groupKey)) {
        if (group.sku) {
          idsToRemove.push(group.sku);
        } else {
          idsToRemove.push(...group.ids);
        }
      }
    });

    if (idsToRemove.length === 0) {
      showToast("Vui lòng tích chọn sản phẩm bạn muốn xóa!", "warning");
      return;
    }

    const selectedIndices = groupedCartItems
      .map((group, idx) => (selectedGroupKeys.includes(group.groupKey) ? idx : -1))
      .filter((idx) => idx !== -1);

    dismissIndices(selectedIndices, () => {
      if (onRemoveCartItem) {
        onRemoveCartItem(idsToRemove);
      } else {
        idsToRemove.forEach(id => apiRemoveCartItem(id).catch(() => {}));
      }
      setSelectedGroupKeys((prev) => prev.filter((k) => !selectedGroupKeys.includes(k)));
    });
  };

  const isBottomPosition = position === "bottom";

  const containerClasses = isBottomPosition
    ? "absolute right-0 bottom-[calc(100%+18px)] before:absolute before:-bottom-[18px] before:left-0 before:right-0 before:h-[18px] before:content-[''] w-[420px] sm:w-[480px] rounded-2xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 dark:border-white/15 bg-white/[0.93] dark:bg-zinc-900/[0.93] backdrop-blur-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.18),0_4px_16px_-2px_rgba(255,77,36,0.12),inset_0_1px_0_rgba(255,255,255,1)] pt-4 sm:pt-5 px-4 sm:px-5 pb-3 sm:pb-3.5 z-50 origin-bottom-right overflow-hidden text-slate-900 dark:text-white select-none"
    : "absolute right-0 top-[calc(100%+14px)] w-[450px] sm:w-[500px] rounded-2xl border border-slate-200/90 bg-white/[0.93] backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] pt-4 sm:pt-5 px-4 sm:px-5 pb-3 sm:pb-3.5 z-50 origin-top-right overflow-hidden text-slate-900 select-none";

  const animInitial = isBottomPosition
    ? { opacity: 0, clipPath: "circle(0% at calc(100% - 20px) calc(100% + 18px))", filter: "blur(8px)" }
    : { opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" };

  const animAnimate = isBottomPosition
    ? { opacity: 1, clipPath: "circle(150% at calc(100% - 20px) calc(100% + 18px))", filter: "blur(0px)" }
    : { opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" };

  const animExit = isBottomPosition
    ? { opacity: 0, clipPath: "circle(0% at calc(100% - 20px) calc(100% + 18px))", filter: "blur(8px)" }
    : { opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layout
          initial={animInitial}
          animate={animAnimate}
          exit={animExit}
          transition={{ 
            layout: { duration: 0.38, ease: [0.32, 0.72, 0, 1] },
            type: "spring", 
            stiffness: 250, 
            damping: 28, 
            mass: 0.8 
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={containerClasses}
        >
          {/* Decorative ambient glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF4D24]/36 rounded-full blur-[70px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#FF4D24]/18 rounded-full blur-[60px] pointer-events-none -z-10" />

          {/* 1. Header Row */}
          <motion.div layout transition={{ layout: { duration: 0.38, ease: [0.32, 0.72, 0, 1] } }} className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#FF4D24]/10 text-[#FF4D24] flex items-center justify-center font-bold">
                <ShoppingBag size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-sans font-black text-[13px] tracking-tight text-slate-900 dark:text-white uppercase">
                    Giỏ hàng
                  </h3>
                  <span className="text-[10px] font-extrabold text-[#FF4D24] bg-[#FF4D24]/10 px-1.5 py-0.2 rounded-full">
                    {totalCartCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {groupedCartItems.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      if (selectedGroupKeys.length === groupedCartItems.length) {
                        setSelectedGroupKeys([]);
                      } else {
                        setSelectedGroupKeys(groupedCartItems.map(g => g.groupKey));
                      }
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-[#FF4D24] hover:bg-orange-50/80 active:scale-95 transition-all duration-150 cursor-pointer px-2 py-0.5 rounded-md"
                  >
                    {selectedGroupKeys.length === groupedCartItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                  {selectedGroupKeys.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md"
                      title="Xóa các mục đã chọn"
                    >
                      <Trash2 size={11} />
                      <span>Xóa ({getSelectedItemsCount()})</span>
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="size-8 rounded-full bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200/90 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:text-zinc-300 flex items-center justify-center shadow-2xs transition-colors duration-150 cursor-pointer ml-1"
                title="Đóng giỏ hàng"
                aria-label="Đóng giỏ hàng"
              >
                <X size={14} className="stroke-[2.25]" />
              </button>
            </div>
          </motion.div>

          {/* 2. Cart Content (Filled vs Empty) with popLayout smooth height morph */}
          <AnimatePresence mode="popLayout" initial={false}>
            {groupedCartItems.length > 0 ? (
              <motion.div
                key="cart-filled-content"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
                transition={{ layout: { duration: 0.38, ease: [0.32, 0.72, 0, 1] } }}
                className="flex flex-col w-full"
              >
                {/* Item List */}
                <div className="flex flex-col gap-2.5 max-h-[360px] sm:max-h-[400px] overflow-y-auto px-1.5 pt-2 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent_0,black_20px,black_calc(100%-20px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_20px,black_calc(100%-20px),transparent_100%)]">
                  <AnimatePresence initial={false} mode="popLayout">
                    {groupedCartItems.map((group, index) => {
                      const groupKey = group.groupKey;
                      const isSelected = selectedGroupKeys.includes(groupKey);
                    const rowTotalNumber = parsePrice(group.unitPrice) * group.quantity;
                    const formattedRowTotal = formatPrice(rowTotalNumber);
                    const isExpanded = expandedGroupKey === groupKey;
                    const isNearBottom = isBottomPosition ? index < 2 : (groupedCartItems.length >= 2 && index === groupedCartItems.length - 1);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{
                          opacity: offsets[index]
                            ? Math.max(0, (isSelected ? 1 : 0.6) * (1 - Math.pow(Math.min(1, Math.max(0, offsets[index]) / 320), 1.5)))
                            : (isSelected ? 1 : 0.6),
                          y: 0,
                          x: offsets[index] || 0,
                          rotate: offsets[index] ? Math.min(4, offsets[index] * 0.01) : 0,
                          scale: offsets[index] && offsets[index] > 20 ? Math.max(0.95, 1 - offsets[index] / 3000) : 1,
                          filter: offsets[index] && offsets[index] > 50
                            ? `blur(${Math.min(2.5, (offsets[index] - 50) * 0.015)}px)`
                            : "blur(0px)",
                        }}
                        exit={{
                          opacity: 0,
                          x: 420,
                          rotate: 2.5,
                          scale: 0.95,
                          filter: "blur(2px)",
                          height: 0,
                          marginTop: 0,
                          marginBottom: 0,
                          paddingTop: 0,
                          paddingBottom: 0,
                          overflow: "hidden",
                          transition: {
                            x: { duration: 0.38, ease: [0.32, 0.72, 0, 1] },
                            opacity: { duration: 0.28, ease: "easeOut" },
                            rotate: { duration: 0.35 },
                            scale: { duration: 0.35 },
                            filter: { duration: 0.2 },
                            height: { duration: 0.34, delay: 0.12, ease: [0.32, 0.72, 0, 1] },
                            marginTop: { duration: 0.34, delay: 0.12, ease: [0.32, 0.72, 0, 1] },
                            marginBottom: { duration: 0.34, delay: 0.12, ease: [0.32, 0.72, 0, 1] },
                            paddingTop: { duration: 0.34, delay: 0.12, ease: [0.32, 0.72, 0, 1] },
                            paddingBottom: { duration: 0.34, delay: 0.12, ease: [0.32, 0.72, 0, 1] },
                          }
                        }}
                        transition={{
                          x: activeIdx === index && !isDismissing
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 220, damping: 25, mass: 0.8 },
                          rotate: { type: "spring", stiffness: 200, damping: 22 },
                          scale: { type: "spring", stiffness: 220, damping: 25 },
                          opacity: { duration: 0.32, ease: "easeOut" },
                          filter: { duration: 0.18 },
                          layout: { duration: 0.38, ease: [0.32, 0.72, 0, 1] }
                        }}
                      key={groupKey}
                      {...bindDrag(index)}
                      onClick={() => {
                        if (isDismissing) return;
                        setSelectedGroupKeys(prev => {
                          const willDeselect = prev.includes(groupKey);
                          if (willDeselect) {
                            if (expandedGroupKey === groupKey) {
                              setExpandedGroupKey(null);
                            }
                            return prev.filter(k => k !== groupKey);
                          } else {
                            return [...prev, groupKey];
                          }
                        });
                      }}
                      className={`p-2.5 sm:p-3 pt-3.5 sm:pt-3.5 rounded-xl border select-none relative flex flex-col gap-2 cursor-pointer transition-colors duration-150 overflow-visible ${
                        isExpanded ? "z-40" : "z-0"
                      } ${
                        isSelected
                          ? "bg-white dark:bg-zinc-800/95 border-slate-300 dark:border-white/20 shadow-xs ring-1 ring-slate-900/5"
                          : "border-transparent bg-transparent"
                      }`}
                    >
                      {/* Top 3D Ribbon: Giảm X% */}
                      {group.discount && (
                        <>
                          <div className={`absolute -top-1.5 left-[-4px] h-[21px] text-white text-[9.5px] font-black px-2 rounded-br-md rounded-tr-xs shadow-[1px_2px_4px_rgba(255,77,36,0.22)] flex items-center justify-center z-20 select-none transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#FF4D24] to-[#FF6B35]"
                              : "bg-slate-400 opacity-50 shadow-none"
                          }`}>
                            {group.discount}
                          </div>
                          <div
                            className={`absolute top-[15px] left-[-4px] w-[4px] h-[4px] z-10 transition-colors duration-200 ${
                              isSelected ? "bg-[#B43C00]" : "bg-slate-600 opacity-50"
                            }`}
                            style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                          />
                        </>
                      )}

                      {/* Top Row: Thumbnail + Info & Variant */}
                      <div className="flex items-start gap-2.5">
                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-xl shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200 group/thumb ${
                          isSelected
                            ? "bg-slate-100 dark:bg-zinc-700 border border-slate-200/90 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.03]"
                            : "bg-neutral-100/70 dark:bg-zinc-800/50 border border-neutral-200/60 grayscale opacity-40"
                        }`}>
                          {group.imageUrl ? (
                            <img
                              src={group.imageUrl}
                              alt={group.name}
                              className="w-full h-full object-cover object-center block transition-transform duration-300 ease-out group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-base">{group.icon || "📦"}</span>
                          )}
                        </div>

                        {/* Info & Variant Pill */}
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <h4 className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
                            isSelected ? "text-slate-900 dark:text-zinc-100 font-bold" : "text-neutral-400 font-medium"
                          }`}>
                            {group.name}
                          </h4>

                          {/* Minimalist Variant Pill Button & Fixed Frame Popup */}
                          <div
                            className="relative inline-block self-start z-40 pt-0.5"
                            onClick={(e) => {
                              if (isSelected) e.stopPropagation();
                            }}
                            onMouseEnter={() => {
                              if (variantCloseTimeoutRef.current) {
                                clearTimeout(variantCloseTimeoutRef.current);
                                variantCloseTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={() => {
                              if (variantCloseTimeoutRef.current) clearTimeout(variantCloseTimeoutRef.current);
                              variantCloseTimeoutRef.current = setTimeout(() => {
                                setExpandedGroupKey(null);
                              }, 450);
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                if (isSelected) {
                                  e.stopPropagation();
                                  handleToggleExpand(groupKey);
                                }
                              }}
                              className={`text-[10.5px] px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                                !isSelected
                                  ? "bg-transparent border-transparent text-neutral-400 select-none"
                                  : isExpanded
                                    ? "bg-gradient-to-r from-orange-50 via-white to-orange-50/90 dark:from-zinc-800 dark:to-zinc-700 border-[#FF4D24]/40 text-[#FF4D24] font-medium shadow-[0_2px_10px_rgba(255,77,36,0.12)] ring-1 ring-[#FF4D24]/20"
                                    : "bg-white/80 dark:bg-zinc-800/80 hover:bg-orange-50/60 border-slate-200/90 dark:border-white/10 hover:border-[#FF4D24]/30 text-slate-700 dark:text-zinc-300 hover:text-[#FF4D24] shadow-2xs"
                              }`}
                            >
                              <span>Phiên bản: <strong className={isSelected ? (isExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 dark:text-zinc-100 font-semibold") : "text-neutral-400 font-normal"}>{group.color}</strong>, <strong className={isSelected ? (isExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 dark:text-zinc-100 font-semibold") : "text-neutral-400 font-normal"}>{group.size}</strong></span>
                              <ChevronDown className={`size-3 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#FF4D24]" : ""} ${isSelected ? (isExpanded ? "text-[#FF4D24]" : "text-slate-500") : "text-neutral-400"}`} />
                            </button>

                            {/* Popup Khung cố định với hiệu ứng bung mở vòng tròn */}
                            <AnimatePresence>
                              {isExpanded && isSelected && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    clipPath: isNearBottom
                                      ? "circle(0% at 30px calc(100% + 10px))"
                                      : "circle(0% at 30px -10px)",
                                    filter: "blur(10px)"
                                  }}
                                  animate={{
                                    opacity: 1,
                                    clipPath: isNearBottom
                                      ? "circle(160% at 30px calc(100% + 10px))"
                                      : "circle(160% at 30px -10px)",
                                    filter: "blur(0px)"
                                  }}
                                  exit={{
                                    opacity: 0,
                                    clipPath: isNearBottom
                                      ? "circle(0% at 30px calc(100% + 10px))"
                                      : "circle(0% at 30px -10px)",
                                    filter: "blur(10px)"
                                  }}
                                  transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                                  className={`absolute left-0 z-50 bg-gradient-to-b from-white via-orange-50/20 to-white/98 dark:from-zinc-900 dark:to-zinc-800 backdrop-blur-3xl border border-orange-200/70 dark:border-white/15 rounded-2xl shadow-[0_25px_60px_-12px_rgba(255,77,36,0.15),0_10px_25px_-5px_rgba(0,0,0,0.06)] p-3.5 w-[290px] sm:w-[310px] flex flex-col gap-2.5 text-xs ring-1 ring-[#FF4D24]/10 overflow-hidden ${
                                    isNearBottom
                                      ? "bottom-full mb-2 origin-bottom-left"
                                      : "top-full mt-2 origin-top-left"
                                  }`}
                                >
                                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF4D24]/18 rounded-full blur-[40px] pointer-events-none -z-10" />
                                  <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#FF4D24]/10 rounded-full blur-[30px] pointer-events-none -z-10" />

                                  {/* Color Options */}
                                  <div>
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5">
                                      Màu sắc:
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {group.availableColors.map((c) => (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => handleSelectVariant(groupKey, c, group.size)}
                                          className={`w-full py-1.5 px-2 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white dark:bg-zinc-800 ${
                                            group.color === c
                                              ? "border-[#FF4D24] text-[#FF4D24] font-bold shadow-xs ring-1 ring-[#FF4D24]/40"
                                              : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-200 hover:border-[#FF4D24]/60 hover:text-[#FF4D24] font-medium"
                                          }`}
                                        >
                                          {c}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <Separator className="bg-orange-100/60 dark:bg-white/10" />

                                  {/* Storage / Size Options */}
                                  <div>
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5">
                                      Dung lượng / Kích thước:
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {group.availableSizes.map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => handleSelectVariant(groupKey, group.color, s)}
                                          className={`w-full py-1.5 px-2 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white dark:bg-zinc-800 ${
                                            group.size === s
                                              ? "border-[#FF4D24] text-[#FF4D24] font-bold shadow-xs ring-1 ring-[#FF4D24]/40"
                                              : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-200 hover:border-[#FF4D24]/60 hover:text-[#FF4D24] font-medium"
                                          }`}
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Price on Left, Stepper on Right */}
                      <div className={`flex items-center justify-between pt-1 border-t transition-colors ${
                        isSelected ? "border-slate-200/90 dark:border-white/10" : "border-transparent"
                      }`} onClick={(e) => {
                        if (isSelected) e.stopPropagation();
                      }}>
                        <div className="flex items-center gap-1.5 pl-0.5">
                          {group.oldPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {group.oldPrice}
                            </span>
                          )}
                          <span className={`text-xs sm:text-[13px] ${isSelected ? "font-bold text-slate-900 dark:text-zinc-100" : "font-medium text-neutral-400"}`}>
                            {formattedRowTotal}
                          </span>
                          {group.quantity > 1 && (
                            <span className={`text-[10px] font-normal ${isSelected ? "text-slate-400" : "text-neutral-300"}`}>
                              ({group.unitPrice}/món)
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className={`flex items-center border rounded-lg h-6.5 transition-all ${
                          isSelected
                            ? "border-slate-300 dark:border-white/20 bg-white dark:bg-zinc-800 shadow-2xs"
                            : "border-neutral-200/50 bg-neutral-100/60 dark:bg-zinc-800/40 opacity-60"
                        }`}>
                          <button
                            type="button"
                            className={`size-5.5 flex items-center justify-center disabled:opacity-20 cursor-pointer ${
                              isSelected ? "text-slate-500 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white" : "text-neutral-400"
                            }`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                if (group.quantity > 1 && group.sku) {
                                  try {
                                    await apiUpdateCartQuantity(group.sku, group.quantity - 1);
                                  } catch (_) {}
                                } else {
                                  dismissIndices([index], () => {
                                    if (onRemoveCartItem) {
                                      onRemoveCartItem(group.sku || group.ids[group.ids.length - 1]);
                                    } else if (group.sku) {
                                      apiRemoveCartItem(group.sku).catch(() => {});
                                    }
                                  });
                                }
                              } else {
                                setSelectedGroupKeys(prev => [...prev, groupKey]);
                              }
                            }}
                          >
                            <Minus size={11} className="stroke-[2.5]" />
                          </button>
                          <span className={`w-5 text-center text-xs font-semibold select-none ${
                            isSelected ? "text-slate-800 dark:text-zinc-100" : "text-neutral-400"
                          }`}>
                            {group.quantity}
                          </span>
                          <button
                            type="button"
                            className={`size-5.5 flex items-center justify-center cursor-pointer ${
                              isSelected ? "text-slate-500 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white" : "text-neutral-400"
                            }`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                if (group.sku) {
                                  try {
                                    await apiAddToCart([{ sku: group.sku, quantity: 1 }]);
                                  } catch (_) {}
                                } else if (onAddToCart) {
                                  onAddToCart(group.name, group.unitPrice);
                                }
                              } else {
                                setSelectedGroupKeys(prev => [...prev, groupKey]);
                              }
                            }}
                          >
                            <Plus size={11} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>

              {/* 3. Footer (Tóm tắt & Nút thanh toán) */}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/10 flex flex-col gap-1.5 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Đã chọn ({getSelectedItemsCount()} món)</span>
                  <span>Ưu đãi thành viên có thể trừ lên tới <strong className="text-emerald-600 dark:text-emerald-400 font-mono">7%</strong></span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Tổng thanh toán</span>
                    <div className="overflow-hidden h-6 flex items-center">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={calculateTotalValue()}
                          initial={{ y: 10, opacity: 0, filter: "blur(2px)" }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{ y: -10, opacity: 0, filter: "blur(2px)" }}
                          transition={{ type: "spring", stiffness: 450, damping: 28 }}
                          className="text-base sm:text-[17px] font-black font-mono text-[#FF4D24] leading-tight block"
                        >
                          {formatPrice(calculateTotalValue())}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={getSelectedItemsCount() === 0}
                    onClick={() => {
                      const totalSelected = selectedGroupKeys.length;
                      if (totalSelected === 0) {
                        showToast("Vui lòng tích chọn ít nhất 1 sản phẩm để thanh toán!", "warning");
                        return;
                      }

                      // 1. Trích xuất danh sách SKU & ID của các sản phẩm được tích chọn
                      const selectedSkus: string[] = [];
                      groupedCartItems.forEach((group) => {
                        if (selectedGroupKeys.includes(group.groupKey)) {
                          if (group.sku) selectedSkus.push(group.sku);
                          selectedSkus.push(...group.ids);
                        }
                      });

                      // 2. Lưu danh sách SKU đã chọn vào localStorage để đồng bộ sang trang Order /o
                      try {
                        localStorage.setItem("checkout_selected_skus", JSON.stringify(selectedSkus));
                        localStorage.removeItem(STORAGE_KEYS.BUY_NOW_PRODUCT);
                        localStorage.removeItem("horizon_buy_now_product");
                      } catch (_) {}

                      // 3. Bắn event realtime nếu người dùng đang ở sẵn trang /o
                      window.dispatchEvent(
                        new CustomEvent("cart-checkout-selected", { detail: { selectedSkus } })
                      );

                      // 4. Đóng menu giỏ hàng và chuyển thẳng sang trang /o
                      onClose();
                      if (onNavigate) {
                        onNavigate("order");
                      }
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      getSelectedItemsCount() > 0
                        ? "bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] text-white hover:brightness-105 shadow-[0_4px_12px_rgba(255,77,36,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <span>Thanh toán</span>
                    <span className="text-[10px] opacity-90">({getSelectedItemsCount()})</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cart-empty-view"
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ 
                layout: { duration: 0.38, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: 0.25, ease: "easeOut" },
                scale: { duration: 0.25, ease: "easeOut" }
              }}
              className="py-12 text-center flex flex-col items-center justify-center gap-2.5 text-slate-400 w-full"
            >
              <div className="size-12 rounded-full bg-slate-50/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-400 shadow-2xs">
                <PackageOpen size={22} className="stroke-[1.75]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Giỏ hàng của bạn đang trống</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Khám phá các sản phẩm và dịch vụ ngay</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate("product");
                }}
                className="mt-1 text-xs font-bold text-[#FF4D24] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Duyệt sản phẩm
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartDropdownMenu;
