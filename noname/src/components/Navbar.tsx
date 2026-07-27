/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, Settings, CreditCard, ShoppingCart, Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: string;
  icon: string;
}

interface NavbarProps {
  currentPage: "landing" | "product" | "register" | "auth-report" | "profile";
  onNavigate: (page: "landing" | "product" | "register" | "auth-report" | "profile") => void;
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
        title: "Mức giá điện thoại",
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
          { name: "Galaxy Z Fold7" },
          { name: "OPPO Reno16 F 5G", tag: "MỚI" },
          { name: "OPPO Find X9 Ultra" },
          { name: "OPPO Find N6" }
        ]
      },
      {
        title: "Hãng máy tính bảng",
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

export default function Navbar({ currentPage, onNavigate, cartItems, onRemoveCartItem, onAddToCart }: NavbarProps) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCartMenu, setShowCartMenu] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const readUser = () => {
      try {
        const stored = localStorage.getItem("horizon_current_user");
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
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowProductMegaMenu(true);
    }, 150); // More responsive entry delay to feel snappy
  };

  const handleMegaMenuMouseLeave = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowProductMegaMenu(false);
    }, 280); // Responsive close trigger, transition handles smooth fade out
  };

  // Close dropdown on click outside
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Sản phẩm", href: "/p" },
    { label: "Báo cáo Xác thực", href: "auth-report" },
    { label: "Showcase", href: "#showcase" },
    { label: "Pricing", href: "#pricing" },
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

  // Group cart items by name & price
  const groupedCartItems = cartItems.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name && i.price === item.price);
    if (existing) {
      existing.ids.push(item.id);
      existing.quantity += 1;
    } else {
      acc.push({
        name: item.name,
        price: item.price,
        icon: item.icon,
        ids: [item.id],
        quantity: 1,
      });
    }
    return acc;
  }, [] as { name: string; price: string; icon: string; ids: string[]; quantity: number }[]);

  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);

  // Automatically select new groups as they are added to the cart
  useEffect(() => {
    const currentKeys = groupedCartItems.map(item => `${item.name}-${item.price}`);
    setSelectedGroupKeys(prev => {
      const newKeys = currentKeys.filter(k => !prev.includes(k));
      if (newKeys.length > 0) {
        return [...prev, ...newKeys];
      }
      return prev;
    });
  }, [cartItems]);

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
      const groupKey = `${group.name}-${group.price}`;
      if (selectedGroupKeys.includes(groupKey)) {
        sum += parsePrice(group.price) * group.quantity;
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
      const groupKey = `${group.name}-${group.price}`;
      if (selectedGroupKeys.includes(groupKey)) {
        count += group.quantity;
      }
    });
    return count;
  };

  const handleDeleteSelected = () => {
    const idsToRemove: string[] = [];
    groupedCartItems.forEach((group) => {
      const groupKey = `${group.name}-${group.price}`;
      if (selectedGroupKeys.includes(groupKey)) {
        idsToRemove.push(...group.ids);
      }
    });
    
    if (idsToRemove.length === 0) {
      alert("Vui lòng tích chọn sản phẩm bạn muốn xóa!");
      return;
    }
    
    if (onRemoveCartItem) {
      onRemoveCartItem(idsToRemove);
      // Remove selected keys for deleted items
      setSelectedGroupKeys(prev => prev.filter(k => !groupedCartItems.some(g => `${g.name}-${g.price}` === k && selectedGroupKeys.includes(k))));
    }
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[66%] max-w-[1300px] rounded-full border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center py-3 px-6">
      {/* Brand Logo */}
      <a
        className="font-display text-headline-md tracking-tighter text-primary flex items-center gap-2 scale-95 active:scale-90 transition-transform cursor-pointer"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("landing");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <span className="material-symbols-outlined text-[#FF4D24] text-[26px] font-extrabold select-none">
          auto_awesome
        </span>
        <span className="font-sans font-black text-sm text-slate-900 uppercase tracking-tight ml-1.5">
          HORIZON<span className="text-[#FF4D24]">MOBILE</span>
        </span>
      </a>

      {/* Navigation Links for Desktop */}
      <div className="hidden md:flex items-center gap-6">
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
                className="relative py-2"
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
                  className={`font-medium transition-colors duration-300 font-sans text-sm scale-95 active:scale-90 transition-transform cursor-pointer select-none outline-none ${
                    (isActive || showProductMegaMenu)
                      ? "text-[#FF4D24] font-bold" 
                      : "text-[#555555] hover:text-primary"
                  }`}
                >
                  {link.label}
                </a>

                {/* MEGA MENU DROPDOWN PANEL */}
                <div 
                  className="absolute top-[calc(100%+12px)] left-1/2 w-[1160px] bg-white/95 backdrop-blur-3xl rounded-2xl border border-white/85 shadow-[0_40px_90px_-15px_rgba(0,0,0,0.18)] z-50 flex overflow-visible mega-menu-popup"
                  style={{ 
                    pointerEvents: showProductMegaMenu ? 'auto' : 'none',
                    opacity: showProductMegaMenu ? 1 : 0,
                    transform: `translate(-38%, ${showProductMegaMenu ? '0px' : '12px'}) scale(${showProductMegaMenu ? 1 : 0.975})`,
                    transition: showProductMegaMenu
                      ? 'opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1), border-color 450ms cubic-bezier(0.16, 1, 0.3, 1)'
                      : 'opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1), border-color 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Left Section: Pure Poster Image (With descriptive overlay, smooth scale-up on hover) */}
                  <div 
                    className="w-[260px] shrink-0 relative bg-slate-950 group/poster poster-glow-trigger cursor-pointer select-none rounded-l-2xl overflow-visible"
                    onClick={() => {
                      onNavigate("product");
                      setShowProductMegaMenu(false);
                    }}
                  >
                    {/* Ambient Glow Bleeds (leaking outside the poster image container to top, left, and bottom) */}
                    <div className="absolute -top-6 -left-8 -bottom-6 right-4 bg-[#FF4D24]/20 blur-[40px] rounded-l-2xl pointer-events-none poster-behind-glow" />
                    <div className="absolute -top-3 -left-4 -bottom-3 right-2 bg-[#FF4D24]/15 blur-[15px] rounded-l-2xl pointer-events-none poster-behind-glow-tight" />

                    {/* Keyframe styles for cosmic stars and shine sweep */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes cosmic-rise {
                        0% {
                          bottom: -30px;
                          transform: translateX(0px) rotate(0deg) scale(0.3);
                          opacity: 0;
                        }
                        15% {
                          opacity: var(--star-opacity, 0.6);
                        }
                        50% {
                          transform: translateX(calc(var(--star-drift, 0px) * 0.45)) rotate(120deg) scale(0.85);
                        }
                        85% {
                          opacity: var(--star-opacity, 0.6);
                        }
                        100% {
                          bottom: 135%;
                          transform: translateX(var(--star-drift, 0px)) rotate(280deg) scale(1.3);
                          opacity: 0;
                        }
                      }
                      @keyframes cosmic-shine {
                        0% {
                          transform: translateX(-150%) skewX(-25deg);
                        }
                        100% {
                          transform: translateX(150%) skewX(-25deg);
                        }
                      }
                      .poster-shine {
                        transform: translateX(-150%) skewX(-25deg);
                      }
                      .poster-glow-trigger:hover .poster-shine {
                        animation: cosmic-shine 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                      }
                      .cosmic-stars-wrapper {
                        opacity: 0.75;
                        transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                      }
                      .poster-glow-trigger:hover .cosmic-stars-wrapper {
                        opacity: 1;
                      }
                      .cosmic-star-svg {
                        filter: drop-shadow(0 0 4px rgba(255, 110, 40, 0.5));
                        transition: filter 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                      }
                      .poster-glow-trigger:hover .cosmic-star-svg {
                        filter: drop-shadow(0 0 14px rgba(255, 110, 40, 1)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.95)) brightness(1.7);
                        transform: scale(1.35);
                      }
                      
                      /* Ambient glows behind the top, left, and bottom edges */
                      .poster-behind-glow, .poster-behind-glow-tight {
                        opacity: 0;
                        transform: scale(0.97);
                        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                      }
                      .poster-glow-trigger:hover .poster-behind-glow {
                        opacity: 1;
                        transform: scale(1.02);
                      }
                      .poster-glow-trigger:hover .poster-behind-glow-tight {
                        opacity: 1;
                        transform: scale(1.01);
                      }
                      
                      /* Entire Mega Menu Popup Style */
                      .mega-menu-popup {
                        transition: border-color 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                      }
                      .mega-menu-popup:has(.poster-glow-trigger:hover) {
                        border-color: rgba(255, 77, 36, 0.25);
                      }
                      .mega-menu-popup:has(.poster-glow-trigger:hover) .ambient-orange-pool {
                        opacity: 1 !important;
                      }
                    `}} />

                    {/* Image and inner gradient overlays wrapped in an overflow-hidden container to protect rounded corners */}
                    <div className="absolute inset-0 overflow-hidden rounded-l-[2.1rem] z-10 pointer-events-none">
                      <img 
                        src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80" 
                        alt="Samsung Galaxy S26 Ultra Poster" 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/poster:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      {/* Subtle premium gradient overlay to blend image borders */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                    </div>
                    
                    {/* Cosmic Floating Stars (Overflow-visible to float all the way up and outside the container!) */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible z-20 cosmic-stars-wrapper">
                      {COSMIC_STARS_DATA.map((star, idx) => (
                        <div
                          key={idx}
                          className="absolute"
                          style={{
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animation: `cosmic-rise ${star.duration} linear infinite`,
                            animationDelay: star.delay,
                            color: "#fff4ec",
                            opacity: 0,
                            '--star-opacity': star.opacity,
                            '--star-drift': star.drift,
                          } as React.CSSProperties}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full cosmic-star-svg">
                            <path d="M12 0 Q12 12 0 12 Q12 12 12 24 Q12 12 24 12 Q12 12 12 0 Z" />
                          </svg>
                        </div>
                      ))}
                    </div>

                    {/* Sweeping Shine Sweep Effect */}
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-l-2xl">
                      <div 
                        className="w-[120px] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent absolute -top-[50%] left-0 poster-shine"
                      />
                    </div>
                    
                    {/* Glowing Inner Border Overlay */}
                    <div className="absolute inset-0 rounded-l-2xl border border-white/10 group-hover/poster:border-[#FF4D24]/40 group-hover/poster:shadow-[inset_0_0_30px_rgba(255,77,36,0.2)] transition-all duration-700 pointer-events-none z-30" />

                    <div className="absolute inset-x-0 bottom-0 p-6 z-30 text-left">
                      <span className="text-[10px] font-black tracking-widest text-[#FF4D24] uppercase font-sans">
                        SẢN PHẨM MỚI
                      </span>
                      <h4 className="text-white text-base font-black tracking-tight mt-1 mb-2 font-display">
                        Khám Phá S26 Ultra
                      </h4>
                      <p className="text-slate-300 text-[11px] font-medium flex items-center gap-1 group-hover/poster:text-[#FF4D24] transition-colors duration-200">
                        Xem toàn bộ sản phẩm →
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Categories with Rich Ambient Glow Bleeding over from the Poster Image */}
                  <div className="relative flex-1 p-8 pl-10 bg-white/75 flex flex-col justify-center overflow-hidden rounded-r-2xl">
                        {/* Stronger ambient color bleed matching the poster colors */}
                        <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-cyan-500/8 via-indigo-500/2 to-transparent pointer-events-none" />
                        
                        {/* Ambient color light pools reflecting the vibrant cyan and indigo hues of the poster */}
                        <div className="absolute left-0 top-[15%] w-[350px] h-[350px] rounded-full bg-cyan-500/8 blur-[90px] pointer-events-none" />
                        <div className="absolute left-[25%] bottom-[5%] w-[300px] h-[300px] rounded-full bg-indigo-500/6 blur-[80px] pointer-events-none" />
                        
                        {/* Orange/peach ambient light pool that blends in when hovering the poster */}
                        <div className="absolute left-[-10%] top-[20%] w-[450px] h-[450px] rounded-full bg-[#FF4D24]/20 blur-[100px] pointer-events-none opacity-0 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ambient-orange-pool" />

                        {/* Right grid: Columns of Phone & Tablet subcategories (Optimized widths & spacing with perfectly aligned header baselines) */}
                        <div className="relative z-10 grid grid-cols-[2.2fr_1.2fr_1.5fr_1.2fr_1.5fr] gap-x-6 gap-y-3.5 w-full items-start">
                          {CATEGORIES[0]?.columns.map((col, colIdx) => {
                            const isBrandCol = colIdx === 0; // "Hãng điện thoại"
                            return (
                              <div 
                                key={colIdx} 
                                className="flex flex-col gap-2.5"
                              >
                                <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 font-sans border-b border-slate-100 pb-2 h-11 flex items-end mb-2 w-full whitespace-nowrap">
                                  {col.title}
                                </h4>
                                <div className={isBrandCol ? "grid grid-cols-2 gap-x-4 gap-y-1.5" : "flex flex-col gap-1.5"}>
                                  {col.items.map((item, itemIdx) => (
                                    <a
                                      key={itemIdx}
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate("product");
                                        setShowProductMegaMenu(false);
                                      }}
                                      className="text-[12.5px] text-slate-600 hover:text-primary font-medium flex items-center justify-between gap-1 h-7 transition-all hover:translate-x-1 duration-200 outline-none"
                                    >
                                      <span className={`transition-colors truncate ${isBrandCol ? 'max-w-[130px]' : 'max-w-none'}`}>{item.name}</span>
                                      {item.tag === "HOT" && (
                                        <span className="text-[8px] font-black tracking-widest px-1 py-0.5 rounded bg-red-500 text-white leading-none uppercase shrink-0 scale-90">
                                          HOT
                                        </span>
                                      )}
                                      {item.tag === "MỚI" && (
                                        <span className="text-[8px] font-black tracking-widest px-1 py-0.5 rounded bg-blue-500 text-white leading-none uppercase shrink-0 scale-90 font-sans">
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
                  </div>
                </div>
            );
          }

          return (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.label, link.href)}
              className={`font-medium transition-colors duration-300 font-sans text-sm scale-95 active:scale-90 transition-transform ${
                isActive 
                  ? "text-[#FF4D24] font-bold" 
                  : "text-[#555555] hover:text-primary"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      {/* Action Area (Cart, CTA, and Profile) */}
      <div className="flex items-center gap-3">
        {/* Shopping Cart Button */}
        <div className="relative" ref={cartRef}>
          <motion.button 
            animate={isBouncing ? { 
              scale: [0.95, 1.3, 0.85, 1.15, 0.95, 1.05, 1],
              rotate: [0, -10, 10, -10, 5, -5, 0],
              boxShadow: [
                "0 0 0 0px rgba(255, 77, 36, 0)",
                "0 0 0 10px rgba(255, 77, 36, 0.4)",
                "0 0 0 20px rgba(255, 77, 36, 0)"
              ]
            } : {}}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onClick={() => setShowCartMenu(!showCartMenu)}
            className={`text-[#555555] hover:text-[#FF4D24] transition-colors duration-300 flex items-center justify-center p-2 rounded-full relative cursor-pointer ${
              isBouncing 
                ? "bg-red-50 text-[#FF4D24] ring-2 ring-[#FF4D24]/30" 
                : "hover:bg-white/45"
            }`}
          >
            <ShoppingCart size={20} className="stroke-[2]" />
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF4D24] rounded-full ring-2 ring-white" />
            )}
          </motion.button>

          {/* Cart Dropdown Menu */}
          <AnimatePresence>
            {showCartMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-2.5 w-[380px] sm:w-[440px] rounded-2xl border border-white/70 bg-white/95 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] p-5 z-50 origin-top-right"
              >
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100/80">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#FF4D24] text-sm font-bold">shopping_bag</span>
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">Giỏ hàng của bạn</span>
                  </div>
                  <span className="text-[10px] bg-[#FF4D24]/10 text-[#FF4D24] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {cartItems.length} sản phẩm
                  </span>
                </div>
                
                {/* Item list */}
                {groupedCartItems.length > 0 ? (
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                    {groupedCartItems.map((group) => {
                      const groupKey = `${group.name}-${group.price}`;
                      const isSelected = selectedGroupKeys.includes(groupKey);
                      
                      return (
                        <div 
                          key={groupKey} 
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('.qty-controls')) {
                              return;
                            }
                            setSelectedGroupKeys(prev => 
                              prev.includes(groupKey)
                                ? prev.filter(k => k !== groupKey)
                                : [...prev, groupKey]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden bg-white cursor-pointer select-none ${
                            isSelected 
                              ? "border-[#FF4D24] shadow-[0_6px_20px_rgba(255,77,36,0.08)] bg-gradient-to-r from-[#FF4D24]/[0.01] to-transparent ring-2 ring-[#FF4D24]/10" 
                              : "border-slate-100 opacity-55 hover:opacity-100"
                          }`}
                        >
                          {/* Left: Custom Checkbox for Selecting Individual Items */}
                          <div className="flex items-center justify-center shrink-0 pl-1">
                            <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected 
                                ? "border-[#FF4D24] bg-[#FF4D24]" 
                                : "border-slate-300 hover:border-[#FF4D24]/60"
                            }`}>
                              <span className={`material-symbols-outlined text-white text-[12px] font-black transition-transform duration-200 ${
                                isSelected ? "scale-100" : "scale-0"
                              }`}>
                                check
                              </span>
                            </div>
                          </div>

                          {/* Product Icon */}
                          <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[18px] shadow-inner shrink-0 select-none transition-opacity ${!isSelected ? 'opacity-50' : ''}`}>
                            {group.icon}
                          </div>

                          {/* Product details */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11.5px] font-black text-[#111111] truncate transition-all ${!isSelected ? 'text-slate-400' : ''}`}>{group.name}</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1 select-none">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ${!isSelected ? 'opacity-40' : ''}`}></span>
                              Giao nhanh 2h
                            </p>
                            <p className={`text-[11px] font-mono font-bold mt-0.5 transition-all ${
                              isSelected ? "text-[#FF4D24]" : "text-slate-400 line-through"
                            }`}>{group.price}</p>
                          </div>

                          {/* Right: Quantity Controls & Integrated Smart Trash Bin */}
                          <div className={`qty-controls flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5 select-none shrink-0 transition-all ${
                            !isSelected ? 'opacity-30 pointer-events-none' : ''
                          }`}>
                            {/* Decrement / Smart Trash button */}
                            <button
                              onClick={() => {
                                if (onRemoveCartItem) {
                                  // Remove one occurrence by ID
                                  onRemoveCartItem(group.ids[group.ids.length - 1]);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-rose-600 active:scale-90 transition-all duration-150 cursor-pointer"
                              title="Giảm số lượng"
                            >
                              <span className="text-xs font-black font-sans">-</span>
                            </button>

                            {/* Quantity display */}
                            <div className="min-w-5 text-center font-mono font-black text-[11px] text-[#111111] px-0.5">
                              {group.quantity}
                            </div>

                            {/* Increment button */}
                            <button
                              onClick={() => {
                                if (onAddToCart) {
                                  onAddToCart(group.name, group.price);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-emerald-600 active:scale-90 transition-all duration-150 cursor-pointer"
                              title="Tăng số lượng"
                            >
                              <span className="text-xs font-black font-sans">+</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined text-3xl opacity-40">shopping_cart_off</span>
                    <span className="text-xs font-medium">Giỏ hàng hiện tại đang trống</span>
                  </div>
                )}
  
                <div className="my-3 border-t border-slate-100" />
  
                {/* Advanced Pricing & Invoice Information Breakdown */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
                  <div className="flex items-center justify-between">
                    <span>Tạm tính (Subtotal):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatPrice(calculateTotalValue())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="material-symbols-outlined text-[11px] font-bold">sell</span>
                      Ưu đãi hội viên Smember (5%):
                    </span>
                    <span className="font-mono font-bold text-red-600">-{formatPrice(calculateTotalValue() * 0.05)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Thuế VAT (10%):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatPrice(calculateTotalValue() * 0.10)}</span>
                  </div>
                  <div className="my-1.5 border-t border-dashed border-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#111111] uppercase tracking-wide">Tổng tiền thanh toán:</span>
                    <span className="text-[14px] font-black text-[#FF4D24] font-mono">
                      {formatPrice(calculateTotalValue() * 1.05)}
                    </span>
                  </div>
                </div>
  
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCartMenu(false)}
                    className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-sans text-xs font-bold py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-center"
                  >
                    Đóng lại
                  </button>

                  {/* Smart Trash Bin Button - Aligned in the middle */}
                  <button
                    onClick={handleDeleteSelected}
                    disabled={getSelectedItemsCount() === 0}
                    className="flex-none px-4 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 disabled:cursor-not-allowed text-rose-600 font-sans text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    title="Xóa các sản phẩm đã chọn"
                  >
                    <Trash2 size={14} className="stroke-[2.5]" />
                    {getSelectedItemsCount() > 0 && (
                      <span className="bg-rose-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                        {getSelectedItemsCount()}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      const totalSelected = selectedGroupKeys.length;
                      if (totalSelected === 0) {
                        alert("Vui lòng tích chọn sản phẩm bạn muốn thanh toán!");
                        return;
                      }
                      alert(`Cảm ơn bạn đã trải nghiệm mua sắm! Đơn hàng của bạn trị giá ${formatPrice(calculateTotalValue() * 1.05)} đang được xử lý.`);
                      setShowCartMenu(false);
                    }}
                    disabled={cartItems.length === 0}
                    className="flex-[1.5] bg-[#FF4D24] hover:bg-[#E03C15] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-sans text-xs font-black py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                  >
                    <span>Thanh toán ngay</span>
                    <span className="material-symbols-outlined text-[13px] font-bold">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account Button / Profile Section */}
        <div className="relative" ref={menuRef}>
          <button
            id="navbar-account-button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 bg-white/40 text-[#111111] border border-white/60 shadow-sm backdrop-blur-md font-sans text-sm font-semibold pl-2.5 pr-4 py-1.5 rounded-full hover:bg-white/60 transition-all duration-300 scale-95 active:scale-90 cursor-pointer select-none"
          >
            {/* Elegant glassmorphism circle with a user icon */}
            <div className="w-6 h-6 rounded-full bg-slate-950/5 flex items-center justify-center text-[#111111]/80">
              <User size={13} className="stroke-[2.5]" />
            </div>
            <span className="font-semibold text-sm text-[#111111] tracking-tight">Tài khoản</span>
          </button>

          {/* Account Dropdown Menu */}
          <AnimatePresence>
            {showAccountMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-white/70 bg-white/95 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] p-4 z-50 flex flex-col gap-1.5 origin-top-right"
              >
                {/* User Quick Info Card with Elegant Avatar & Smember VIP Badge */}
                <div className="p-3 mb-2 bg-slate-50/60 rounded-xl border border-slate-100/80 flex items-center gap-3">
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
  
                {loggedInUser ? (
                  <button 
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigate("profile");
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
                  >
                    <User size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                    <span className="font-extrabold text-[#FF4D24]">Xem trang cá nhân</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigate("register");
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
                  >
                    <User size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                    <span className="font-extrabold text-[#FF4D24]">Đăng ký / Đăng nhập</span>
                  </button>
                )}
  
                <button 
                  onClick={() => {
                    setShowAccountMenu(false);
                    onNavigate(loggedInUser ? "profile" : "register");
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
                >
                  <Settings size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                  <span>Thiết lập tài khoản</span>
                </button>
  
                <button 
                  onClick={() => {
                    setShowAccountMenu(false);
                    if (loggedInUser) {
                      onNavigate("profile");
                    } else {
                      onNavigate("register");
                    }
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
                >
                  <CreditCard size={15} className="text-slate-400 group-hover:text-[#FF4D24] transition-colors" />
                  <span>Gói đăng ký</span>
                </button>
  
                <div className="my-1.5 border-t border-slate-100" />
  
                {loggedInUser ? (
                  <button 
                    onClick={() => {
                      setShowAccountMenu(false);
                      localStorage.removeItem("horizon_redis_profile");
                      localStorage.removeItem("horizon_current_user");
                      setLoggedInUser(null);
                      onNavigate("register");
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-rose-100"
                  >
                    <LogOut size={15} className="text-rose-600" />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigate("register");
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-[#FF4D24] hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-red-100"
                  >
                    <LogOut size={15} className="text-[#FF4D24]" />
                    <span>Đăng nhập tài khoản khác</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
