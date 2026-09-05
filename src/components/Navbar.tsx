/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, Settings, CreditCard, ShoppingCart, Trash2, Search, TrendingUp, Home, Package, PackageOpen, X, Check, Plus, Minus, ShoppingBag, ChevronDown, ChevronRight, CornerDownLeft, ArrowUpRight, ArrowRight, Sparkles, Flame } from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Bevel, BevelDivider } from "@/components/ui/bevel";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { createAuthAction, savePendingAction } from "@/lib/authAction";
import { addToCart as apiAddToCart, removeCartItem as apiRemoveCartItem, updateCartItemQuantity as apiUpdateCartQuantity } from "@/services/cartService";
import { useChainedSpringList } from "@/hooks/useChainedSpringList";

export interface CartItem {
  id: string;
  sku?: string;
  name: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  icon: string;
  imageUrl?: string;
  color?: string;
  availableColors?: string[];
  size?: string;
  availableSizes?: string[];
  quantity?: number;
}

interface NavbarProps {
  currentPage: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms";
  onNavigate: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
  cartItems: CartItem[];
  onRemoveCartItem?: (id: string | string[]) => void;
  onAddToCart?: (itemName: string, itemPrice: string) => void;
}

interface MegaMenuCategory {
  name: string;
  icon: string;
  columns: {
    title: string;
    items: { name: string; tag?: "HOT" | "MỚI" }[];
  }[];
}

const CATEGORIES: MegaMenuCategory[] = [
  {
    name: "Điện thoại, Tablet",
    icon: "📱",
    columns: [
      {
        title: "Hãng điện thoại",
        items: [
          { name: "iPhone" },
          { name: "Samsung" },
          { name: "OPPO" },
          { name: "Xiaomi" },
          { name: "TECNO" },
          { name: "HONOR" },
          { name: "Nubia" },
          { name: "Sony" },
          { name: "Nokia" },
          { name: "Nothing Phone" },
          { name: "Masstel" },
          { name: "realme" },
          { name: "Itel" },
          { name: "Huawei" },
          { name: "Meizu" },
          { name: "Infinix" }
        ]
      },
      {
        title: "Mức giá",
        items: [
          { name: "Dưới 2 triệu" },
          { name: "Từ 2 - 4 triệu" },
          { name: "Từ 4 - 7 triệu" },
          { name: "Từ 7 - 13 triệu" },
          { name: "Từ 13 - 20 triệu" },
          { name: "Trên 20 triệu" }
        ]
      },
      {
        title: "Điện thoại HOT ⚡",
        items: [
          { name: "iPhone 17", tag: "HOT" },
          { name: "iPhone 17 Pro", tag: "HOT" },
          { name: "iPhone 17 Pro Max", tag: "HOT" },
          { name: "iPhone 17e" },
          { name: "iPhone Air" },
          { name: "iPhone 16 Pro Max" },
          { name: "Galaxy S26 Ultra", tag: "HOT" },
          { name: "Galaxy S26" },
          { name: "Galaxy Z Fold7" }
        ]
      },
      {
        title: "Máy tính bảng",
        items: [
          { name: "iPad" },
          { name: "Samsung" },
          { name: "Xiaomi" },
          { name: "Huawei" },
          { name: "Lenovo" },
          { name: "Teclast" },
          { name: "Nubia" },
          { name: "HONOR" }
        ]
      },
      {
        title: "Máy tính bảng HOT ⚡",
        items: [
          { name: "iPad Pro M5", tag: "HOT" },
          { name: "iPad Air M4", tag: "HOT" },
          { name: "iPad A16" },
          { name: "iPad mini 7" },
          { name: "Galaxy Tab S11 Series", tag: "HOT" },
          { name: "Galaxy Tab S10 Series" }
        ]
      }
    ]
  },
  {
    name: "Laptop",
    icon: "💻",
    columns: [
      {
        title: "Thương hiệu",
        items: [
          { name: "MacBook" },
          { name: "ASUS" },
          { name: "MSI" },
          { name: "Lenovo" },
          { name: "HP" },
          { name: "Dell" },
          { name: "Acer" },
          { name: "GIGABYTE" }
        ]
      },
      {
        title: "Nhu cầu sử dụng",
        items: [
          { name: "Văn phòng, Học tập" },
          { name: "Gaming", tag: "HOT" },
          { name: "Đồ họa, Kỹ thuật" },
          { name: "Mỏng nhẹ, Sang trọng" }
        ]
      }
    ]
  },
  {
    name: "Âm thanh, Mic thu âm",
    icon: "🎧",
    columns: [
      {
        title: "Loại tai nghe",
        items: [
          { name: "Tai nghe Bluetooth", tag: "HOT" },
          { name: "Tai nghe Chụp tai" },
          { name: "Tai nghe Có dây" },
          { name: "Tai nghe Thể thao" }
        ]
      },
      {
        title: "Thương hiệu HOT",
        items: [
          { name: "Sony" },
          { name: "Apple AirPods", tag: "HOT" },
          { name: "JBL" },
          { name: "Marshall" }
        ]
      }
    ]
  },
  {
    name: "Đồng hồ, Camera",
    icon: "⌚",
    columns: [
      {
        title: "Đồng hồ thông minh",
        items: [
          { name: "Apple Watch", tag: "HOT" },
          { name: "Samsung Galaxy Watch" },
          { name: "Garmin" },
          { name: "Xiaomi Band" }
        ]
      }
    ]
  },
  {
    name: "Đồ gia dụng, Làm đẹp",
    icon: "🧹",
    columns: [
      {
        title: "Thiết bị gia đình",
        items: [
          { name: "Robot hút bụi", tag: "HOT" },
          { name: "Máy lọc không khí" },
          { name: "Nồi chiên không dầu" }
        ]
      }
    ]
  },
  {
    name: "Phụ kiện",
    icon: "🔌",
    columns: [
      {
        title: "Phụ kiện di động",
        items: [
          { name: "Cáp sạc, Củ sạc" },
          { name: "Sạc dự phòng", tag: "HOT" },
          { name: "Ốp lưng, Dán màn hình" }
        ]
      }
    ]
  },
  {
    name: "Khuyến mãi",
    icon: "🏷️",
    columns: [
      {
        title: "Chương trình HOT",
        items: [
          { name: "Flash Sale hàng ngày", tag: "HOT" },
          { name: "Ưu đãi thành viên" },
          { name: "Xả hàng tồn kho" }
        ]
      }
    ]
  }
];

const COSMIC_STARS_DATA = [
  { left: "8%", size: 8, delay: "0s", duration: "7s", opacity: 0.55, drift: "-40px" },
  { left: "22%", size: 14, delay: "1.5s", duration: "10s", opacity: 0.75, drift: "35px" },
  { left: "38%", size: 10, delay: "3s", duration: "8s", opacity: 0.6, drift: "-20px" },
  { left: "50%", size: 16, delay: "0.8s", duration: "11s", opacity: 0.7, drift: "55px" },
  { left: "68%", size: 12, delay: "4s", duration: "9s", opacity: 0.65, drift: "-30px" },
  { left: "82%", size: 7, delay: "2.2s", duration: "6s", opacity: 0.55, drift: "40px" },
  { left: "15%", size: 13, delay: "5s", duration: "12s", opacity: 0.7, drift: "-50px" },
  { left: "48%", size: 9, delay: "1s", duration: "7.5s", opacity: 0.6, drift: "25px" },
  { left: "62%", size: 11, delay: "6.5s", duration: "10.5s", opacity: 0.75, drift: "-45px" },
  { left: "30%", size: 10, delay: "4.2s", duration: "8.5s", opacity: 0.5, drift: "30px" },
  { left: "76%", size: 15, delay: "3.5s", duration: "13s", opacity: 0.7, drift: "-60px" },
  { left: "92%", size: 8, delay: "5.8s", duration: "6.5s", opacity: 0.55, drift: "35px" },
];

const AnimatedFlame = () => (
  <div className="relative flex items-center justify-center size-3.5 mr-0.5 shrink-0">
    {/* Ambient heat pulse aura */}
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.35, 0.75, 0.35],
      }}
      transition={{
        duration: 1.1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute inset-0 bg-gradient-to-t from-[#FF4D24] via-amber-400 to-yellow-300 rounded-full blur-[2.5px] pointer-events-none"
    />

    {/* SVG Real Fire Flame with multi-layer flickering embers */}
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-3.5 relative z-10 filter drop-shadow-[0_0_2.5px_rgba(255,100,0,0.85)]"
      animate={{
        scaleY: [1, 1.18, 0.94, 1.2, 1],
        scaleX: [1, 0.93, 1.05, 0.92, 1],
        rotate: [-1.5, 2, -2, 2.5, -1.5],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      <defs>
        <linearGradient id="flameOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#E02600" />
          <stop offset="50%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#FFAA00" />
        </linearGradient>
        <linearGradient id="flameInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF7700" />
          <stop offset="55%" stopColor="#FFDD00" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Outer Main Flame */}
      <path
        d="M12 2C9.5 5 7 8.5 7 13C7 17.5 10 21 14 21C18 21 20.5 17 19 13.5C18.5 12 17.5 10.5 16 9.5C16.5 11 16 12.5 15 13C15 9.5 13.5 6 12 2Z"
        fill="url(#flameOuterGrad)"
      />

      {/* Inner Hot Core Flame */}
      <motion.path
        d="M12 11C10.8 12.5 10 14.5 10 16.5C10 18.8 11.2 20.5 13 20.5C14.8 20.5 16 18.5 15.5 16.5C15 15.5 14.2 14.8 13.5 14.2C13.8 15 13.5 15.8 13 16C13 14 12.5 12.5 12 11Z"
        fill="url(#flameInnerGrad)"
        animate={{
          scaleY: [1, 1.25, 0.9, 1.3, 1],
          opacity: [0.85, 1, 0.75, 1, 0.85],
        }}
        transition={{
          duration: 0.55,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.svg>

    {/* Spark Particle 1 */}
    <motion.div
      animate={{
        y: [-1, -6, -11],
        x: [0, 2, -1],
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.2],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        delay: 0.1,
        ease: "easeOut",
      }}
      className="absolute top-0.5 size-1 bg-yellow-300 rounded-full shadow-[0_0_2px_#FF5500] pointer-events-none"
    />

    {/* Spark Particle 2 */}
    <motion.div
      animate={{
        y: [0, -5, -9],
        x: [0, -2, 1],
        opacity: [0, 0.9, 0],
        scale: [0.4, 0.9, 0.2],
      }}
      transition={{
        duration: 0.85,
        repeat: Infinity,
        delay: 0.45,
        ease: "easeOut",
      }}
      className="absolute top-1 size-0.5 bg-orange-400 rounded-full shadow-[0_0_2px_#FF5500] pointer-events-none"
    />
  </div>
);

export default function Navbar({ currentPage, onNavigate, cartItems, onRemoveCartItem, onAddToCart }: NavbarProps) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCartMenu, setShowCartMenu] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  
  // Search state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readUser = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user");
        if (stored) {
          setLoggedInUser(JSON.parse(stored));
        } else {
          setLoggedInUser(null);
        }
      } catch (e) {
        setLoggedInUser(null);
      }
    };
    readUser();
    window.addEventListener("storage", readUser);
    return () => window.removeEventListener("storage", readUser);
  }, [currentPage, showAccountMenu]);
  const [showProductMegaMenu, setShowProductMegaMenu] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isBouncing, setIsBouncing] = useState(false);
  const prevCountRef = useRef(cartItems.length);

  useEffect(() => {
    if (cartItems.length > prevCountRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 800);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItems.length;
  }, [cartItems.length]);

  useEffect(() => {
    return () => {
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
      }
    };
  }, []);

  const handleMegaMenuMouseEnter = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    setShowProductMegaMenu(true);
  };

  const handleMegaMenuMouseLeave = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowProductMegaMenu(false);
    }, 195); // 30% faster hide after mouse leave (from 280ms to 195ms)
  };

  // Close dropdown on click outside & handle Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCartMenu(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setShowProductMegaMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setSearchQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { label: "Sản phẩm", href: "/p" },
    { label: "Báo cáo Xác thực", href: "auth-report" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    e.preventDefault();
    if (href === "product" || href === "/p") {
      onNavigate("product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (href === "auth-report") {
      onNavigate("auth-report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onNavigate("landing");
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

const calculateCartDiscount = (priceStr?: string, oldPriceStr?: string) => {
  if (!priceStr || !oldPriceStr) return undefined;
  try {
    const price = parseInt(priceStr.replace(/\./g, "").replace(/\D/g, ""), 10);
    const oldPrice = parseInt(oldPriceStr.replace(/\./g, "").replace(/\D/g, ""), 10);
    if (!isNaN(price) && !isNaN(oldPrice) && oldPrice > price) {
      const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
      return `Giảm ${pct}%`;
    }
  } catch (_) {}
  return undefined;
};

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

  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

  const handleToggleExpand = (groupKey: string) => {
    if (!selectedGroupKeys.includes(groupKey)) return;
    setExpandedGroupKey(prev => prev === groupKey ? null : groupKey);
  };

  // Group cart items by name, color, and size
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
    icon: string;
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
  const knownGroupKeysRef = useRef<Set<string>>(new Set());
  const variantCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically select new groups only when they are genuinely newly added
  useEffect(() => {
    const currentKeys = groupedCartItems.map(item => item.groupKey);
    const brandNewKeys = currentKeys.filter(k => !knownGroupKeysRef.current.has(k));

    currentKeys.forEach(k => knownGroupKeysRef.current.add(k));

    // Prune deleted items from known set
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

  const handleSelectVariant = async (groupKey: string, newColor: string, newSize: string) => {
    const target = groupedCartItems.find(g => g.groupKey === groupKey);
    if (!target) return;
    
    // Determine new SKU
    const isIphone = target.name.toLowerCase().includes("iphone");
    const isSamsung = target.name.toLowerCase().includes("samsung") || target.name.toLowerCase().includes("s24");
    const isPixel = target.name.toLowerCase().includes("pixel");
    
    let newSku = target.sku || "";
    if (isIphone) {
      const colorCode = newColor.toLowerCase().includes("sa mạc") ? "DESERT" : newColor.toLowerCase().includes("tự nhiên") ? "NATURAL" : newColor.toLowerCase().includes("đen") ? "BLACK" : "WHITE";
      newSku = `ATTR-IP16PM-${colorCode}-${newSize}`;
    } else if (isSamsung) {
      newSku = `ATTR-S24U-TITANGRAY-${newSize}`;
    } else if (isPixel) {
      newSku = `ATTR-GP9PXL-${newColor.toUpperCase()}-${newSize}`;
    } else {
      newSku = `ATTR-${target.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)}-${newSize}`;
    }
    
    if (target.sku && target.sku !== newSku) {
      try {
        await apiRemoveCartItem(target.sku);
        await apiAddToCart([{ sku: newSku, quantity: target.quantity }]);
      } catch (_) {}
    }
    setExpandedGroupKey(null);
  };

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

  const isVndCurrency = cartItems.some(item => item.price.includes("đ") || !item.price.includes("$"));

  const calculateTotalValue = () => {
    let sum = 0;
    groupedCartItems.forEach((group) => {
      if (selectedGroupKeys.includes(group.groupKey)) {
        sum += parsePrice(group.unitPrice || group.price) * group.quantity;
      }
    });
    return sum;
  };

  const formatPrice = (val: number) => {
    if (isVndCurrency) {
      return val.toLocaleString("vi-VN") + "đ";
    } else {
      return "$" + val.toFixed(2);
    }
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
      }
    },
    tensionDecay: 0.35,
    maxChainedDepth: 3,
  });

  const handleDeleteSelected = () => {
    const selectedIndices: number[] = [];
    const idsToRemove: string[] = [];
    groupedCartItems.forEach((group, index) => {
      if (selectedGroupKeys.includes(group.groupKey)) {
        selectedIndices.push(index);
        if (group.sku) {
          idsToRemove.push(group.sku);
        } else {
          idsToRemove.push(...group.ids);
        }
      }
    });
    
    if (idsToRemove.length === 0) {
      alert("Vui lòng tích chọn sản phẩm bạn muốn xóa!");
      return;
    }
    
    if (onRemoveCartItem) {
      dismissIndices(selectedIndices, () => {
        onRemoveCartItem(idsToRemove);
        setSelectedGroupKeys((prev) => prev.filter((k) => !selectedGroupKeys.includes(k)));
      });
    }
  };

  const renderHighlightedText = (text: string, query: string) => {
    if (!query || query.trim() === "") {
      return <span className="[text-shadow:0_1px_0_rgba(255,255,255,0.9)]">{text}</span>;
    }
    const cleanQuery = query.trim();
    const escaped = cleanQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className="[text-shadow:0_1px_0_rgba(255,255,255,0.9)]">
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQuery.toLowerCase() ? (
            <span
              key={i}
              className="text-[#FF4D24] font-extrabold bg-[#FF4D24]/[0.12] px-1 py-0.5 rounded-[4px] shadow-[inset_0_0_0_1px_rgba(255,77,36,0.25)]"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] lg:w-[85%] xl:w-[75%] max-w-[1240px] rounded-full border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center py-1.5 pl-5 sm:pl-6 pr-2 sm:pr-2.5 transition-all duration-300">
      <div className={`flex items-center min-w-0 transition-all duration-300 ${isSearchExpanded ? 'gap-4 sm:gap-6 lg:gap-8' : 'gap-6 sm:gap-8 lg:gap-12'}`}>
        {/* Brand Logo */}
        <a
        className="font-display text-headline-md tracking-tighter text-primary flex items-center gap-2 scale-95 active:scale-90 transition-transform cursor-pointer shrink-0 whitespace-nowrap"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("landing");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <svg className="w-7 h-7 select-none shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="synapseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7C4A" />
              <stop offset="100%" stopColor="#FF4D24" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="4" fill="url(#synapseGrad)">
            <animate attributeName="r" values="3.5;5;3.5" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="12" r="7.5" stroke="#FF4D24" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.7">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="7s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="12" r="10" stroke="#FF7C4A" strokeWidth="0.8" strokeDasharray="8 12" opacity="0.45">
            <animateTransform attributeName="transform" type="rotate" from="360 12 12" to="0 12 12" dur="11s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="4.5" r="1.2" fill="#FF4D24" />
          <circle cx="5.5" cy="15.8" r="1.2" fill="#FF4D24" />
          <circle cx="18.5" cy="15.8" r="1.2" fill="#FF4D24" />
        </svg>
        <span className="font-sans font-black text-sm text-slate-900 uppercase tracking-tight ml-1.5 whitespace-nowrap">
          SYNAPSE<span className="text-[#FF4D24]">DIGITAL</span>
        </span>
      </a>

      {/* Navigation Links for Desktop */}
      <div className={`hidden md:flex items-center min-w-0 transition-all duration-300 ${isSearchExpanded ? 'gap-4 lg:gap-5' : 'gap-6'}`}>
        {navLinks.map((link) => {
          const isActive = 
            ((link.href === "product" || link.href === "/p") && currentPage === "product") ||
            (link.href === "auth-report" && currentPage === "auth-report") ||
            (link.href !== "product" && link.href !== "/p" && link.href !== "auth-report" && currentPage === "landing");
          
          if (link.href === "product" || link.href === "/p") {
            return (
              <div 
                key={link.label}
                ref={megaMenuRef}
                className="py-2 shrink-0"
                onMouseEnter={handleMegaMenuMouseEnter}
                onMouseLeave={handleMegaMenuMouseLeave}
              >
                <a
                  href={link.href}
                  onClick={(e) => {
                    handleLinkClick(e, link.label, link.href);
                    setShowProductMegaMenu(false);
                    if (megaMenuTimeoutRef.current) {
                      clearTimeout(megaMenuTimeoutRef.current);
                    }
                  }}
                  className={`transition-colors duration-300 font-sans text-base scale-95 active:scale-90 transition-transform cursor-pointer select-none outline-none whitespace-nowrap shrink-0 ${
                    (isActive || showProductMegaMenu)
                      ? "text-[#FF4D24] font-bold" 
                      : "text-[#555555] hover:text-primary font-medium"
                  }`}
                >
                  {link.label}
                </a>

                {/* MEGA MENU DROPDOWN PANEL */}
                <AnimatePresence>
                  {showProductMegaMenu && (
                    <motion.div 
                      initial={{ opacity: 0, clipPath: "circle(0% at 20% -20px)", filter: "blur(10px)" }}
                      animate={{ opacity: 1, clipPath: "circle(150% at 20% -20px)", filter: "blur(0px)" }}
                      exit={{ opacity: 0, clipPath: "circle(0% at 20% -20px)", filter: "blur(10px)" }}
                      transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                      className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[90vw] lg:w-[930px] xl:w-[972px] bg-white/95 backdrop-blur-3xl rounded-[20px] border-0 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.04)] z-50 flex overflow-hidden mega-menu-popup"
                    >
                  {/* Decorative background glows */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF4D24]/15 rounded-full blur-[40px] pointer-events-none -z-10" />

                  {/* Left Section: Poster (-10% overall scale) */}
                  <div className="relative shrink-0 w-[242px] overflow-hidden" style={{ aspectRatio: '10/14' }}>
                    <img src="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Galaxy Z Fold6" />
                    
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4.5 pointer-events-none">
                      <span className="text-white font-black text-[19px] leading-tight drop-shadow-md">Galaxy Z Fold6</span>
                      <span className="text-white/90 text-xs mt-0.5 font-medium drop-shadow">Sức mạnh mở ra tiềm năng</span>
                    </div>
                  </div>

                  {/* Right Section: Categories with Rich Ambient Glow (-10% scale) */}
                  <div className="relative flex-1 py-5.5 pl-4.5 pr-6 bg-transparent flex flex-col justify-center overflow-hidden">
                        {/* Stronger ambient color bleed matching the poster colors */}
                        <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-cyan-500/8 via-indigo-500/2 to-transparent pointer-events-none" />
                        
                        {/* Ambient color light pools reflecting the vibrant cyan and indigo hues of the poster */}
                        <div className="absolute left-0 top-[15%] w-[280px] h-[280px] rounded-full bg-cyan-500/8 blur-[70px] pointer-events-none" />
                        <div className="absolute left-[25%] bottom-[5%] w-[240px] h-[240px] rounded-full bg-indigo-500/6 blur-[60px] pointer-events-none" />
                        
                        {/* Orange/peach ambient light pool that blends in when hovering the poster */}
                        <div className="absolute left-[-10%] top-[20%] w-[360px] h-[360px] rounded-full bg-[#FF4D24]/20 blur-[80px] pointer-events-none opacity-0 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ambient-orange-pool" />

                        {/* Right grid: Columns of Phone & Tablet subcategories (Optimized widths & spacing with perfectly aligned header baselines) */}
                        <div className="relative z-10 grid grid-cols-[1.75fr_0.95fr_1.35fr_0.85fr_1.55fr] gap-x-4 gap-y-2.5 w-full items-start">
                          {CATEGORIES[0]?.columns.map((col, colIdx) => {
                            const isBrandCol = colIdx === 0; // "Hãng điện thoại"
                            return (
                              <div 
                                key={colIdx} 
                                className="flex flex-col gap-2"
                              >
                                <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 font-sans border-b border-slate-100 pb-1.5 h-8 flex items-end mb-1.5 w-full whitespace-nowrap">
                                  {col.title}
                                </h4>
                                <div className={isBrandCol ? "grid grid-cols-2 gap-x-2.5 gap-y-1.5" : "flex flex-col gap-1.5"}>
                                  {col.items.map((item, itemIdx) => (
                                    <a
                                      key={itemIdx}
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate("product");
                                        setShowProductMegaMenu(false);
                                      }}
                                      className="text-[12.5px] text-slate-600 hover:text-primary font-medium flex items-center justify-between gap-1 py-0.5 h-auto transition-all hover:translate-x-0.5 duration-200 outline-none"
                                    >
                                      <span className={`transition-colors truncate ${isBrandCol ? 'max-w-[100px]' : 'max-w-[140px]'}`}>{item.name}</span>
                                      {item.tag === "HOT" && (
                                        <span className="text-[9px] font-black tracking-wider px-1 py-0.5 rounded bg-red-500 text-white leading-none uppercase shrink-0">
                                          HOT
                                        </span>
                                      )}
                                      {item.tag === "MỚI" && (
                                        <span className="text-[9px] font-black tracking-wider px-1 py-0.5 rounded bg-blue-500 text-white leading-none uppercase shrink-0 font-sans">
                                          MỚI
                                        </span>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.label, link.href)}
              className={`transition-colors duration-300 font-sans text-base scale-95 active:scale-90 transition-transform whitespace-nowrap shrink-0 ${
                isActive 
                  ? "text-[#FF4D24] font-bold" 
                  : "text-[#555555] hover:text-primary font-medium"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </div>
      </div>

      {/* Segmented Action Dock (Search, Cart, and Profile) with 3D Optical Bevel Component */}
      <Bevel variant="dock" className="flex items-center p-1 gap-1 shrink-0">
        {/* 1. Expanding Search */}
        <div className="relative flex items-center" ref={searchContainerRef}>
          <motion.div
            initial={false}
            animate={{ 
              width: isSearchExpanded ? 260 : 44,
              backgroundColor: isSearchExpanded ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0)",
            }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center overflow-hidden rounded-full ${
              isSearchExpanded 
                ? "shadow-[0_1px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]" 
                : ""
            }`}
            style={{ height: '44px', willChange: 'width, background-color' }}
          >
            {/* Fixed-width icon container */}
            <div 
              className={`w-[44px] h-[44px] shrink-0 flex items-center justify-center cursor-pointer transition-colors rounded-full ${
                isSearchExpanded 
                  ? "text-[#FF4D24]" 
                  : "text-[#555555] hover:text-[#FF4D24] hover:bg-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)]"
              }`}
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true);
                  setShowCartMenu(false);
                  setShowAccountMenu(false);
                  setShowProductMegaMenu(false);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                } else if (searchQuery.trim() === "") {
                  setIsSearchExpanded(false);
                } else {
                  onNavigate("product");
                }
              }}
            >
              <Search 
                size={22} 
                className="stroke-[2.1]"
              />
            </div>
            
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              className={`w-full h-full bg-transparent border-none outline-none text-[15px] sm:text-[16px] text-slate-900 font-medium tracking-tight leading-none placeholder:text-slate-400 placeholder:font-normal placeholder:text-[14px] sm:placeholder:text-[15px] caret-[#FF4D24] selection:bg-[#FF4D24]/20 selection:text-[#FF4D24] pl-1 pr-2 transition-opacity duration-200 ${
                isSearchExpanded ? "opacity-100 delay-75" : "opacity-0 pointer-events-none"
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (searchQuery.trim() === "") {
                  setIsSearchExpanded(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate("product");
                } else if (e.key === 'Escape') {
                  setIsSearchExpanded(false);
                  setSearchQuery("");
                }
              }}
            />

            {/* Borderless Naked Enter Icon with Simple Appear/Disappear Animation */}
            <AnimatePresence>
              {isSearchExpanded && searchQuery.trim().length > 0 && (
                <motion.button
                  key="search-enter-icon"
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  type="button"
                  onClick={() => onNavigate("product")}
                  className="mr-3 text-slate-400 hover:text-[#FF4D24] active:scale-90 transition-colors flex items-center justify-center cursor-pointer shrink-0 border-none bg-transparent outline-none p-0"
                  title="Nhấn Enter để tìm kiếm"
                >
                  <CornerDownLeft size={16} className="stroke-[2.2]" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div 
                initial={{ opacity: 0, clipPath: "circle(0% at 24px -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(160% at 24px -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at 24px -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute left-0 top-[calc(100%+14px)] w-[330px] sm:w-[360px] rounded-2xl border border-white/80 ring-1 ring-slate-900/[0.06] bg-white/95 backdrop-blur-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,1)] p-3 sm:p-3.5 z-50 origin-top-left overflow-hidden text-slate-900"
              >
                {/* Refined Ambient Glow - Warm subtle diffusion */}
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#FF4D24]/[0.08] rounded-full blur-[32px] pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/[0.05] rounded-full blur-[28px] pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-1">
                  {/* Trending Items List */}
                  <div className="flex flex-col gap-0.5">
                    {[
                      { name: "Samsung Galaxy S24 Ultra", tag: "Flagship" },
                      { name: "iPhone 16 Pro Max 256GB", tag: "Apple" },
                      { name: "Google Pixel 9 Pro XL", tag: "AI Phone" },
                      { name: "MacBook Pro M3 Max", tag: "Laptop" },
                      { name: "iPad Pro M4 Ultra Thin", tag: "Tablet" },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18, delay: 0.025 * idx, ease: "easeOut" }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          setSearchQuery(item.name);
                          onNavigate("product");
                        }}
                        className="group flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl border border-transparent hover:border-[#FF4D24]/20 hover:bg-white/90 hover:backdrop-blur-md hover:shadow-[0_4px_14px_-2px_rgba(255,77,36,0.1),inset_0_1px_0_0_rgba(255,255,255,1)] transition-all duration-150 ease-out cursor-pointer select-none"
                      >
                        {/* 1. Animated Flame Icon + Product Name with Optical Glass Depth & Search Highlight */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <AnimatedFlame />
                          <span 
                            className="text-[13.5px] font-semibold text-slate-800 group-hover:text-slate-950 group-hover:translate-x-0.5 truncate min-w-0 flex-1 transition-all duration-150 tracking-tight"
                          >
                            {renderHighlightedText(item.name, searchQuery)}
                          </span>
                        </div>

                        {/* 2. Luminous Burning Category Tag & Arrow */}
                        <div className="flex items-center shrink-0 gap-1.5">
                          <motion.div
                            animate={{
                              boxShadow: [
                                "0 0 6px rgba(255,77,36,0.2), 0 0 12px rgba(255,140,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
                                "0 0 10px rgba(255,77,36,0.38), 0 0 18px rgba(255,140,0,0.2), inset 0 1px 0 rgba(255,255,255,0.95)",
                                "0 0 6px rgba(255,77,36,0.2), 0 0 12px rgba(255,140,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)"
                              ]
                            }}
                            transition={{
                              duration: 1.8,
                              repeat: Infinity,
                              delay: idx * 0.3,
                              ease: "easeInOut"
                            }}
                            className="relative inline-flex items-center justify-center px-2.5 py-[2.5px] rounded-full bg-gradient-to-r from-orange-500/[0.14] via-[#FF4D24]/[0.08] to-amber-500/[0.06] border-t border-t-white/95 border-b border-b-[#FF4D24]/30 border-x border-x-[#FF4D24]/18 select-none overflow-visible"
                          >
                            {/* Ambient heat aura layer */}
                            <motion.div
                              animate={{
                                opacity: [0.25, 0.55, 0.25],
                                scale: [0.98, 1.04, 0.98]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: idx * 0.3,
                                ease: "easeInOut"
                              }}
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/15 via-orange-500/10 to-yellow-500/8 blur-[3px] pointer-events-none"
                            />

                            {/* Floating spark rising from tag */}
                            <motion.div
                              animate={{
                                y: [0, -6, -12],
                                x: [0, 2, 3],
                                opacity: [0, 0.85, 0],
                                scale: [0.3, 0.75, 0.15]
                              }}
                              transition={{
                                duration: 1.3,
                                repeat: Infinity,
                                delay: 0.2 + idx * 0.25,
                                ease: "easeOut"
                              }}
                              className="absolute -top-0.5 right-2 size-0.5 rounded-full bg-yellow-300 shadow-[0_0_2px_#FF5500] pointer-events-none"
                            />

                            {/* Fiery Tag Text */}
                            <span className="relative z-10 font-sans font-bold text-[10.5px] bg-gradient-to-r from-[#E02600] via-[#FF4D24] to-[#FF8A00] bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                              {item.tag}
                            </span>
                          </motion.div>

                          <div className="w-0 group-hover:w-4 overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out flex items-center justify-end">
                            <ArrowRight size={14} className="text-[#FF4D24] stroke-[2.4] drop-shadow-[0_0_4px_rgba(255,77,36,0.4)]" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer Hint with Frosted Glass Key Badges */}
                  <div className="pt-2 mt-1 border-t border-slate-100/90 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1 select-none">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="[text-shadow:0_1px_0_rgba(255,255,255,0.9)]">Nhấn</span>
                      <kbd className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded bg-white/95 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] font-mono text-[10px] text-[#FF4D24] font-bold">
                        <CornerDownLeft size={10.5} className="stroke-[2.5]" />
                      </kbd>
                      <span className="[text-shadow:0_1px_0_rgba(255,255,255,0.9)]">để tìm kiếm</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <kbd className="inline-flex items-center justify-center px-1.5 h-[18px] rounded bg-white/95 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] font-mono text-[9.5px] text-slate-600 font-bold uppercase">
                        ESC
                      </kbd>
                      <span className="[text-shadow:0_1px_0_rgba(255,255,255,0.9)]">để đóng</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle 3D Divider */}
        <BevelDivider />

        {/* 2. Shopping Cart Button */}
        <div className="relative" ref={cartRef}>
          <motion.button 
            animate={isBouncing ? { 
              scale: [0.95, 1.3, 0.85, 1.15, 0.95, 1.05, 1],
              rotate: [0, -10, 10, -10, 5, -5, 0],
            } : {}}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onClick={() => {
              if (!showCartMenu) {
                setIsSearchExpanded(false);
                setShowAccountMenu(false);
                setShowProductMegaMenu(false);
              }
              setShowCartMenu(!showCartMenu);
            }}
            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-200 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ${
              showCartMenu
                ? "text-[#FF4D24] bg-transparent border-none outline-none ring-0 shadow-none"
                : isBouncing 
                  ? "bg-red-50 text-[#FF4D24] border-none outline-none ring-0" 
                  : "text-[#555555] hover:text-[#FF4D24] hover:bg-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)] bg-transparent"
            }`}
          >
            <ShoppingCart size={22} className="stroke-[2.2]" />
            {totalCartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 bg-[#FF4D24] text-white text-[9.5px] font-black rounded-full border-none outline-none ring-0 flex items-center justify-center pointer-events-none shadow-2xs">
                {totalCartCount > 99 ? "99+" : totalCartCount}
              </span>
            )}
          </motion.button>

            {/* Cart Dropdown Menu */}
          <AnimatePresence>
            {showCartMenu && (
              <motion.div 
                layout="position"
                initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute right-0 top-[calc(100%+14px)] w-[450px] sm:w-[500px] rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] pt-4 sm:pt-5 px-4 sm:px-5 pb-3 sm:pb-3.5 z-50 origin-top-right overflow-hidden text-slate-900"
              >
                {/* Decorative ambient glow (+20% radiance) */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF4D24]/36 rounded-full blur-[70px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#FF4D24]/18 rounded-full blur-[60px] pointer-events-none -z-10" />

                {/* 1. Header Row (No bottom border to avoid double lines) */}
                <div className="flex items-center justify-between pb-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-[#FF4D24]/10 text-[#FF4D24] flex items-center justify-center font-bold">
                      <ShoppingBag size={14} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-sans font-black text-[13px] tracking-tight text-slate-900 uppercase">
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
                      onClick={() => setShowCartMenu(false)}
                      className="size-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-2xs transition-colors duration-150 cursor-pointer ml-1"
                      title="Đóng giỏ hàng"
                      aria-label="Đóng giỏ hàng"
                    >
                      <X size={14} className="stroke-[2.25]" />
                    </button>
                  </div>
                </div>
                
                {/* 2. Item List with Dual Top & Bottom CSS Mask Fade */}
                {groupedCartItems.length > 0 ? (
                  <motion.div 
                    layout
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-2.5 max-h-[440px] overflow-y-auto px-1.5 pt-2 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent_0,black_24px,black_calc(100%-24px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_24px,black_calc(100%-24px),transparent_100%)]"
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {groupedCartItems.map((group, index) => {
                        const groupKey = group.groupKey;
                        const isSelected = selectedGroupKeys.includes(groupKey);
                        const rowTotalNumber = parsePrice(group.unitPrice) * group.quantity;
                        const formattedRowTotal = formatPrice(rowTotalNumber);
                        const isExpanded = expandedGroupKey === groupKey;
                        const isNearBottom = groupedCartItems.length >= 2 && index === groupedCartItems.length - 1;
                        
                        return (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ 
                              opacity: offsets[index] 
                                ? Math.max(0, (isSelected ? 1 : 0.6) * (1 - Math.pow(Math.min(1, Math.max(0, offsets[index]) / 240), 1.2))) 
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
                              x: 480, 
                              rotate: 3.5,
                              scale: 0.93,
                              filter: "blur(3px)",
                              height: 0, 
                              marginTop: 0, 
                              marginBottom: 0, 
                              paddingTop: 0, 
                              paddingBottom: 0, 
                              overflow: "hidden", 
                              transition: { 
                                x: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.22, ease: "easeOut" },
                                rotate: { duration: 0.28 },
                                scale: { duration: 0.28 },
                                height: { duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] },
                              } 
                            }}
                            transition={{ 
                              x: activeIdx === index && !isDismissing
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 220, damping: 25, mass: 0.8 },
                              rotate: { type: "spring", stiffness: 200, damping: 22 },
                              scale: { type: "spring", stiffness: 220, damping: 25 },
                              opacity: { duration: 0.2, ease: "easeOut" },
                              filter: { duration: 0.18 },
                              layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } 
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
                                ? "bg-white border-slate-300 shadow-xs ring-1 ring-slate-900/5" 
                                : "border-transparent bg-transparent"
                            }`}
                          >
                            {/* Top 3D Ribbon: Giảm X% (Left) wrapped around the edge */}
                            {group.discount && (
                              <>
                                <div className={`absolute -top-1.5 left-[-4px] h-[21px] text-white text-[9.5px] font-black px-2 rounded-br-md rounded-tr-xs shadow-[1px_2px_4px_rgba(255,77,36,0.22)] flex items-center justify-center z-20 select-none transition-all duration-200 ${
                                  isSelected 
                                    ? "bg-gradient-to-r from-[#FF4D24] to-[#FF6B35]" 
                                    : "bg-slate-400 opacity-50 shadow-none"
                                }`}>
                                  {group.discount}
                                </div>
                                {/* 3D Fold Corner for Left Ribbon */}
                                <div 
                                  className={`absolute top-[15px] left-[-4px] w-[4px] h-[4px] z-10 transition-colors duration-200 ${
                                    isSelected ? "bg-[#B43C00]" : "bg-slate-600 opacity-50"
                                  }`} 
                                  style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} 
                                />
                              </>
                            )}

                            {/* Top Row: Thumbnail + Info & Variant + Delete */}
                            <div className="flex items-start gap-2.5">
                              {/* Smartphone Thumbnail Photo - Seamlessly integrated */}
                              <div className={`relative w-13 h-14 sm:w-14 sm:h-15 rounded-xl shrink-0 p-1 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                                isSelected 
                                ? "bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)]" 
                                : "bg-neutral-100/60 border border-transparent grayscale opacity-40"
                              }`}>
                                {group.imageUrl ? (
                                  <img 
                                    src={group.imageUrl} 
                                    alt={group.name} 
                                    className="size-full object-contain object-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:scale-105" 
                                  />
                                ) : (
                                  <span className="text-base">{group.icon || "📦"}</span>
                                )}
                              </div>

                              {/* Info & Variant Pill */}
                              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <h4 className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
                                  isSelected ? "text-slate-900 font-bold" : "text-neutral-400 font-medium"
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
                                            ? "bg-gradient-to-r from-orange-50 via-white to-orange-50/90 border-[#FF4D24]/40 text-[#FF4D24] font-medium shadow-[0_2px_10px_rgba(255,77,36,0.12)] ring-1 ring-[#FF4D24]/20"
                                            : "bg-white/80 hover:bg-orange-50/60 border-slate-200/90 hover:border-[#FF4D24]/30 text-slate-700 hover:text-[#FF4D24] shadow-2xs"
                                      }`}
                                    >
                                      <span>Phiên bản: <strong className={isSelected ? (isExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 font-semibold") : "text-neutral-400 font-normal"}>{group.color}</strong>, <strong className={isSelected ? (isExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 font-semibold") : "text-neutral-400 font-normal"}>{group.size}</strong></span>
                                      <ChevronDown className={`size-3 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#FF4D24]" : ""} ${isSelected ? (isExpanded ? "text-[#FF4D24]" : "text-slate-500") : "text-neutral-400"}`} />
                                    </button>

                                    {/* Popup Khung cố định với hiệu ứng bung mở vòng tròn (Trắng pha cam nhẹ) */}
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
                                          className={`absolute left-0 z-50 bg-gradient-to-b from-white via-orange-50/20 to-white/98 backdrop-blur-3xl border border-orange-200/70 rounded-2xl shadow-[0_25px_60px_-12px_rgba(255,77,36,0.15),0_10px_25px_-5px_rgba(0,0,0,0.06)] p-3.5 w-[290px] sm:w-[310px] flex flex-col gap-2.5 text-xs ring-1 ring-[#FF4D24]/10 overflow-hidden ${
                                            isNearBottom 
                                              ? "bottom-full mb-2 origin-bottom-left" 
                                              : "top-full mt-2 origin-top-left"
                                          }`}
                                        >
                                          {/* Decorative ambient glow (Trắng pha cam nhẹ) */}
                                          <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF4D24]/18 rounded-full blur-[40px] pointer-events-none -z-10" />
                                          <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#FF4D24]/10 rounded-full blur-[30px] pointer-events-none -z-10" />

                                          {/* Color Options - Grid 2 cột thẳng hàng */}
                                          <div>
                                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                              Màu sắc:
                                            </span>
                                            <div className="grid grid-cols-2 gap-1.5">
                                              {group.availableColors.map((c) => (
                                                <button
                                                  key={c}
                                                  type="button"
                                                  onClick={() => handleSelectVariant(groupKey, c, group.size)}
                                                  className={`w-full py-1.5 px-2 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white ${
                                                    group.color === c
                                                      ? "border-[#FF4D24] text-[#FF4D24] font-bold shadow-xs ring-1 ring-[#FF4D24]/40"
                                                      : "border-slate-200 text-slate-700 hover:border-[#FF4D24]/60 hover:text-[#FF4D24] font-medium"
                                                  }`}
                                                >
                                                  {c}
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <Separator className="bg-orange-100/60" />

                                          {/* Size Options - Grid 3 cột thẳng hàng */}
                                          <div>
                                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                              Dung lượng bộ nhớ:
                                            </span>
                                            <div className={`grid gap-1.5 ${group.availableSizes.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                                              {group.availableSizes.map((s) => (
                                                <button
                                                  key={s}
                                                  type="button"
                                                  onClick={() => handleSelectVariant(groupKey, group.color, s)}
                                                  className={`w-full py-1.5 px-1.5 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white ${
                                                    group.size === s
                                                      ? "border-[#FF4D24] text-[#FF4D24] font-bold shadow-xs ring-1 ring-[#FF4D24]/40"
                                                      : "border-slate-200 text-slate-700 hover:border-[#FF4D24]/60 hover:text-[#FF4D24] font-medium"
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
                              isSelected ? "border-slate-200/90" : "border-transparent"
                            }`} onClick={(e) => {
                              if (isSelected) e.stopPropagation();
                            }}>
                              {/* Price display */}
                              <div className="flex items-center gap-1.5 pl-0.5">
                                {group.oldPrice && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    {group.oldPrice}
                                  </span>
                                )}
                                <span className={`text-xs sm:text-[13px] ${isSelected ? "font-bold text-slate-900" : "font-medium text-neutral-400"}`}>
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
                                  ? "border-slate-300 bg-white shadow-2xs" 
                                  : "border-neutral-200/50 bg-neutral-100/60 opacity-60"
                              }`}>
                                 <button
                                  type="button"
                                  className={`size-5.5 flex items-center justify-center disabled:opacity-20 cursor-pointer ${
                                    isSelected ? "text-slate-500 hover:text-slate-950" : "text-neutral-400"
                                  }`}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      if (group.quantity > 1 && group.sku) {
                                        try {
                                          await apiUpdateCartQuantity(group.sku, group.quantity - 1);
                                        } catch (_) {}
                                      } else {
                                        onRemoveCartItem && onRemoveCartItem(group.sku || group.ids[group.ids.length - 1]);
                                      }
                                    } else {
                                      setSelectedGroupKeys(prev => [...prev, groupKey]);
                                    }
                                  }}
                                >
                                  <Minus size={11} className="stroke-[2.5]" />
                                </button>
                                <span className={`w-5 text-center text-xs font-semibold select-none ${
                                  isSelected ? "text-slate-800" : "text-neutral-400"
                                }`}>
                                  {group.quantity}
                                </span>
                                <button
                                  type="button"
                                  className={`size-5.5 flex items-center justify-center cursor-pointer ${
                                    isSelected ? "text-slate-500 hover:text-slate-950" : "text-neutral-400"
                                  }`}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      if (group.sku) {
                                        try {
                                          await apiAddToCart([{ sku: group.sku, quantity: 1 }]);
                                        } catch (_) {}
                                      } else {
                                        onAddToCart && onAddToCart(group.name, group.unitPrice);
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
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="py-12 text-center flex flex-col items-center justify-center gap-2.5 text-slate-400"
                  >
                    <div className="size-12 rounded-full bg-slate-50/80 border border-slate-200/60 flex items-center justify-center text-slate-400 shadow-2xs">
                      <PackageOpen size={22} className="stroke-[1.75]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Giỏ hàng của bạn đang trống</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Khám phá các sản phẩm và dịch vụ đám mây ngay</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCartMenu(false);
                        onNavigate("product");
                      }}
                      className="mt-1 text-xs font-bold text-[#FF4D24] bg-orange-50 hover:bg-orange-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Duyệt sản phẩm
                    </button>
                  </motion.div>
                )}

                {/* 3. Footer (Tóm tắt & Nút thanh toán) */}
                {groupedCartItems.length > 0 && (
                  <div className="pt-1 mt-1 flex flex-col gap-1.5">
                    {/* Summary row */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Đã chọn ({getSelectedItemsCount()} món)</span>
                      <span>Ưu đãi thành viên có thể trừ lên tới <strong className="text-emerald-600 font-mono">7%</strong></span>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Tổng thanh toán</span>
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
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: "0 8px 20px -3px rgba(17, 17, 17, 0.35), 0 0 10px 1px rgba(255, 77, 36, 0.25)" 
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const totalSelected = selectedGroupKeys.length;
                          if (totalSelected === 0) {
                            alert("Vui lòng tích chọn ít nhất 1 sản phẩm để thanh toán!");
                            return;
                          }
                          const executeCheckout = createAuthAction({
                            onAuthenticated: () => {
                              setShowCartMenu(false);
                              onNavigate("order");
                            },
                            onGuest: () => {
                              savePendingAction({
                                actionId: "CART_CHECKOUT",
                                returnUrl: "/o"
                              });
                              setShowCartMenu(false);
                              window.location.hash = "login";
                              onNavigate("auth");
                            }
                          });
                          executeCheckout();
                        }}
                        disabled={getSelectedItemsCount() === 0}
                        className="group w-auto min-w-[165px] h-[36px] justify-center bg-[#111111] hover:bg-black text-white font-sans text-[13.5px] font-extrabold px-5.5 rounded-lg shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
                      >
                        <span>Thanh toán</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle 3D Divider */}
        <BevelDivider />

        {/* 3. Account Button / Profile Section */}
        <div className="relative" ref={menuRef}>
          <button
            id="navbar-account-button"
            onClick={() => {
              if (!loggedInUser) {
                onNavigate("auth");
                return;
              }
              if (!showAccountMenu) {
                setIsSearchExpanded(false);
                setShowCartMenu(false);
                setShowProductMegaMenu(false);
              }
              setShowAccountMenu(!showAccountMenu);
            }}
            className={`h-[44px] pl-2 pr-4.5 rounded-full flex items-center gap-2.5 transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
              showAccountMenu
                ? "text-[#FF4D24]"
                : "text-[#111111] hover:text-[#FF4D24] hover:bg-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)] bg-transparent"
            }`}
          >
            {/* Elegant Circle Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-950/5 flex items-center justify-center text-[#111111]/80 overflow-hidden shrink-0">
              {loggedInUser ? (
                loggedInUser.avatarUrl ? (
                  <img src={loggedInUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-xs text-[#FF4D24]">
                    {(loggedInUser.fullName ?? loggedInUser.username ?? "U")[0].toUpperCase()}
                  </span>
                )
              ) : (
                <User size={16} className="stroke-[2.5]" />
              )}
            </div>
            <span className={`font-semibold text-sm text-inherit tracking-tight transition-all duration-300 truncate ${isSearchExpanded ? 'max-w-[80px] sm:max-w-[110px] md:max-w-[140px]' : 'max-w-[130px] sm:max-w-[180px]'}`}>
              {loggedInUser ? (loggedInUser.fullName.length > 0 ? loggedInUser.fullName : `@${loggedInUser.username}`) : "Đăng nhập"}
            </span>
          </button>

          {/* Account Dropdown Menu */}
          <AnimatePresence>
            {showAccountMenu && loggedInUser && (
              <motion.div 
                initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute right-0 top-[calc(100%+14px)] w-64 rounded-[24px] border border-white/70 bg-white/95 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.4)_inset] p-3 z-50 flex flex-col gap-1 origin-top-right overflow-hidden"
              >
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4D24]/15 rounded-full blur-[50px] pointer-events-none -z-10" />

                {/* User Quick Info Card with Elegant Avatar & Smember VIP Badge */}
                <div className="p-2.5 mb-1.5 bg-slate-50/60 rounded-xl border border-slate-100/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF4D24] to-[#FF7C4A] flex items-center justify-center text-white font-black text-sm shadow-md select-none overflow-hidden">
                    {loggedInUser ? (
                      loggedInUser.avatarUrl ? (
                        <img src={loggedInUser.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (loggedInUser.fullName || loggedInUser.username || "U")[0].toUpperCase()
                      )
                    ) : (
                      "NK"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs truncate">
                        {loggedInUser ? (loggedInUser.fullName || `User @${loggedInUser.username}`) : "Nora Kessler"}
                      </span>
                      <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {loggedInUser ? (loggedInUser.rank || "MEMBER") : "VIP"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate mt-0.5">
                      {loggedInUser ? loggedInUser.email : "nora.kessler@domain.com"}
                    </span>
                    <span className="text-[9.5px] text-[#FF4D24] font-extrabold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] font-black">verified</span>
                      Hội viên Smember
                    </span>
                  </div>
                </div>
  
                {/* Vertical Magic UI Dock Menu Items */}
                <Dock orientation="vertical" iconMagnification={46} iconDistance={100} className="flex flex-col gap-1 w-full">
                  {loggedInUser ? (
                    <DockIcon className="w-full">
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigate("profile");
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] rounded-xl transition-colors duration-200 cursor-pointer text-left"
                      >
                        <User size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                        <span className="font-extrabold text-[#FF4D24]">Xem trang cá nhân</span>
                      </button>
                    </DockIcon>
                  ) : (
                    <DockIcon className="w-full">
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          window.location.hash = "register";
                          onNavigate("auth");
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] rounded-xl transition-colors duration-200 cursor-pointer text-left"
                      >
                        <User size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                        <span className="font-extrabold text-[#FF4D24]">Đăng ký / Đăng nhập</span>
                      </button>
                    </DockIcon>
                  )}
    
                  <DockIcon className="w-full">
                    <button 
                      onClick={() => {
                        setShowAccountMenu(false);
                        if (loggedInUser) {
                          onNavigate("profile");
                        } else {
                          window.location.hash = "register";
                          onNavigate("auth");
                        }
                      }}
                      className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] rounded-xl transition-colors duration-200 cursor-pointer text-left"
                    >
                      <Settings size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                      <span>Thiết lập tài khoản</span>
                    </button>
                  </DockIcon>
    
                  <DockIcon className="w-full">
                    <button 
                      onClick={() => {
                        setShowAccountMenu(false);
                        if (loggedInUser) {
                          onNavigate("profile");
                        } else {
                          window.location.hash = "register";
                          onNavigate("auth");
                        }
                      }}
                      className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] rounded-xl transition-colors duration-200 cursor-pointer text-left"
                    >
                      <CreditCard size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                      <span>Gói đăng ký</span>
                    </button>
                  </DockIcon>
    
                  <div className="my-1.5 border-t border-slate-100" />
    
                  {loggedInUser ? (
                    <DockIcon className="w-full">
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                          localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
                          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKENS_MAP);
                          localStorage.removeItem("horizon_redis_profile");
                          localStorage.removeItem("horizon_current_user");
                          localStorage.removeItem("horizon_access_token");
                          localStorage.removeItem("horizon_refresh_token");
                          setLoggedInUser(null);
                          window.location.hash = "register";
                          onNavigate("auth");
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-rose-600 hover:text-rose-700 rounded-xl transition-colors duration-200 cursor-pointer text-left"
                      >
                        <LogOut size={15} className="text-rose-600" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </DockIcon>
                  ) : (
                    <DockIcon className="w-full">
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          window.location.hash = "register";
                          onNavigate("auth");
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-[#FF4D24] hover:text-[#FF7C4A] rounded-xl transition-colors duration-200 cursor-pointer text-left"
                      >
                        <LogOut size={15} className="text-[#FF4D24]" />
                        <span>Đăng nhập tài khoản khác</span>
                      </button>
                    </DockIcon>
                  )}
                </Dock>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Bevel>
    </nav>
  );
}
