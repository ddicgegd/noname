/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, Settings, CreditCard, ShoppingCart, Trash2, Search, TrendingUp } from "lucide-react";

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
  
  // Search state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex items-center gap-24 lg:gap-32">
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
        <span className="font-sans font-black text-sm text-slate-900 uppercase tracking-tight ml-1.5">
          SYNAPSE<span className="text-[#FF4D24]">DIGITAL</span>
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
                className="py-2"
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
                  className={`transition-colors duration-300 font-sans text-base scale-95 active:scale-90 transition-transform cursor-pointer select-none outline-none ${
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
                      className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[95vw] lg:w-[1150px] p-2.5 bg-white/95 backdrop-blur-3xl rounded-[28px] border border-white/70 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.4)_inset] z-50 flex gap-2.5 overflow-hidden mega-menu-popup"
                    >
                  {/* Decorative background glows */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4D24]/15 rounded-full blur-[50px] pointer-events-none -z-10" />

                  {/* Left Section: Poster */}
                  <div className="relative shrink-0 rounded-[20px] overflow-hidden group" style={{ aspectRatio: '10/14' }}>
                    <img src="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Galaxy Z Fold6" />
                    
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 pointer-events-none">
                      <span className="text-white font-black text-2xl leading-tight drop-shadow-md">Galaxy Z Fold6</span>
                      <span className="text-white/90 text-sm mt-1.5 font-medium drop-shadow">Sức mạnh mở ra tiềm năng</span>
                    </div>

                    {/* Interactive hover glow */}
                    <div className="absolute inset-0 bg-[#FF4D24]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
                  </div>

                  {/* Right Section: Categories with Rich Ambient Glow */}
                  <div className="relative flex-1 p-6 bg-white/75 flex flex-col justify-center overflow-hidden rounded-[20px]">
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
                                <h4 className="text-[13px] font-black uppercase tracking-[0.12em] text-slate-400 font-sans border-b border-slate-100 pb-2 h-11 flex items-end mb-2 w-full whitespace-nowrap">
                                  {col.title}
                                </h4>
                                <div className={isBrandCol ? "grid grid-cols-2 gap-x-4 gap-y-2" : "flex flex-col gap-2"}>
                                  {col.items.map((item, itemIdx) => (
                                    <a
                                      key={itemIdx}
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate("product");
                                        setShowProductMegaMenu(false);
                                      }}
                                      className="text-[15px] text-slate-600 hover:text-primary font-medium flex items-center justify-between gap-1 py-1 h-auto transition-all hover:translate-x-1 duration-200 outline-none"
                                    >
                                      <span className={`transition-colors truncate ${isBrandCol ? 'max-w-[150px]' : 'max-w-none'}`}>{item.name}</span>
                                      {item.tag === "HOT" && (
                                        <span className="text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500 text-white leading-none uppercase shrink-0 scale-90">
                                          HOT
                                        </span>
                                      )}
                                      {item.tag === "MỚI" && (
                                        <span className="text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded bg-blue-500 text-white leading-none uppercase shrink-0 scale-90 font-sans">
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
              className={`transition-colors duration-300 font-sans text-base scale-95 active:scale-90 transition-transform ${
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

      {/* Action Area (Search, Cart, CTA, and Profile) */}
      <div className="flex items-center gap-4">
        {/* Expanding Search */}
        <div className="relative flex items-center">
          <motion.div
            initial={false}
            animate={{ 
              width: isSearchExpanded ? 300 : 48,
              backgroundColor: isSearchExpanded ? "#ffffff" : "transparent",
              borderColor: isSearchExpanded ? "#cbd5e1" : "transparent"
            }}
            whileHover={!isSearchExpanded ? { backgroundColor: "rgba(255, 255, 255, 0.45)" } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center overflow-hidden rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative"
            style={{ height: '48px' }}
          >
            {/* Fixed-width icon container to prevent jumping */}
            <div 
              className="w-12 h-12 shrink-0 flex items-center justify-center cursor-pointer z-10"
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true);
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
                className={`transition-colors ${isSearchExpanded ? 'text-slate-400 hover:text-slate-600' : 'text-[#555555] hover:text-[#FF4D24]'}`}
              />
            </div>
            
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full h-full bg-transparent border-none outline-none text-base text-slate-700 placeholder:text-slate-400 pr-5"
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
          </motion.div>

          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div 
                initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute right-0 top-full mt-4 w-[380px] sm:w-[460px] rounded-[24px] border border-white/70 bg-white/95 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.4)_inset] p-5 z-50 origin-top-right overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4D24]/15 rounded-full blur-[50px] pointer-events-none -z-10" />
                <div className="flex flex-col gap-3">
                  <span className="text-[14px] font-extrabold text-[#111111] uppercase tracking-wide font-display mb-2">Từ khóa phổ biến</span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => onNavigate("product")}>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <TrendingUp size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">Aero Compute Server</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">🔥 HOT</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => onNavigate("product")}>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <TrendingUp size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">Nexus AI Model</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">🔥 HOT</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => onNavigate("product")}>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Search size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">Glacier Storage 100TB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            className={`text-[#555555] hover:text-[#FF4D24] transition-colors duration-300 flex items-center justify-center w-12 h-12 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative cursor-pointer ${
              isBouncing 
                ? "bg-red-50 text-[#FF4D24] ring-2 ring-[#FF4D24]/30 border-transparent" 
                : "hover:bg-white/45 bg-transparent border-transparent hover:border-slate-300"
            }`}
          >
            <ShoppingCart size={24} className="stroke-[2]" />
            {cartItems.length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-[#FF4D24] rounded-full ring-2 ring-white" />
            )}
          </motion.button>

          {/* Cart Dropdown Menu */}
          <AnimatePresence>
            {showCartMenu && (
              <motion.div 
                initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute right-0 mt-4 w-[380px] sm:w-[460px] rounded-[24px] border border-white/70 bg-white/95 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.4)_inset] p-5 z-50 origin-top-right overflow-hidden"
              >
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4D24]/15 rounded-full blur-[50px] pointer-events-none -z-10" />

                {/* Header */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-extrabold text-[#111111] uppercase tracking-wide font-display">Giỏ hàng của bạn</span>
                    <span className="text-[10px] bg-[#FF4D24]/10 text-[#FF4D24] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {cartItems.length} sản phẩm
                    </span>
                  </div>

                  {/* Free Shipping Progress Bar */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100 flex flex-col gap-2 relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold text-[#FF4D24]">Miễn phí giao hàng</span>
                      <span className="text-[10px] font-bold text-[#FF4D24]/70">Còn $15.00 nữa</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-sm">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-[#FF7C4A] to-[#FF4D24] rounded-full relative"
                      >
                         <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                {/* Item list */}
                {groupedCartItems.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto p-2 px-3 -mx-3 custom-scrollbar relative z-10">
                    <AnimatePresence initial={false}>
                    {groupedCartItems.map((group, index) => {
                      const groupKey = `${group.name}-${group.price}`;
                      const isSelected = selectedGroupKeys.includes(groupKey);
                      
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, x: 20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          whileHover={{ y: -2, scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.04 }}
                          key={groupKey} 
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('.qty-controls')) return;
                            setSelectedGroupKeys(prev => 
                              prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden bg-white cursor-pointer select-none ${
                            isSelected 
                              ? "border-[#FF4D24] shadow-[0_4px_16px_rgba(255,77,36,0.1)] ring-1 ring-[#FF4D24]/40" 
                              : "border-transparent shadow-sm hover:shadow-md hover:border-slate-200"
                          }`}
                        >
                          {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D24]/[0.02] to-transparent pointer-events-none" />}
                          
                          {/* Left: Custom Checkbox */}
                          <div className="flex items-center justify-center shrink-0 z-10">
                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected ? "border-[#FF4D24] bg-[#FF4D24] shadow-sm" : "border-slate-300 bg-slate-50 group-hover:border-slate-400"
                            }`}>
                              <span className={`material-symbols-outlined text-white text-[10px] font-black transition-transform duration-300 ${
                                isSelected ? "scale-100 rotate-0" : "scale-0 -rotate-45"
                              }`}>check</span>
                            </div>
                          </div>

                          {/* Product Icon */}
                          <div className={`w-11 h-11 rounded-[10px] bg-slate-50 flex items-center justify-center text-[20px] shrink-0 select-none transition-opacity z-10 shadow-inner border border-slate-100 ${!isSelected ? 'opacity-60 grayscale-[30%]' : ''}`}>
                            {group.icon}
                          </div>

                          {/* Product details */}
                          <div className="flex-1 min-w-0 z-10">
                            <p className={`text-[12px] font-bold text-slate-800 truncate transition-all ${!isSelected ? 'text-slate-500 font-medium' : ''}`}>{group.name}</p>
                            <p className="text-[9.5px] text-emerald-600 font-bold flex items-center gap-1.5 select-none mt-0.5">
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${!isSelected ? 'hidden' : ''}`}></span>
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 ${!isSelected ? 'opacity-40' : ''}`}></span>
                              </span>
                              Giao hỏa tốc 2h
                            </p>
                          </div>

                          {/* Right: Quantity Controls */}
                          <div className="flex flex-col items-end gap-1.5 z-10">
                            <p className={`text-[12px] font-mono font-black transition-all ${
                              isSelected ? "text-[#FF4D24]" : "text-slate-400 line-through"
                            }`}>{group.price}</p>
                            <div className={`qty-controls flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5 select-none shrink-0 transition-all ${
                              !isSelected ? 'opacity-30 pointer-events-none' : ''
                            }`}>
                              <button
                                onClick={() => onRemoveCartItem && onRemoveCartItem(group.ids[group.ids.length - 1])}
                                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white text-slate-500 hover:text-rose-600 active:scale-90 transition-all shadow-sm cursor-pointer"
                              ><span className="text-sm font-black">-</span></button>
                              <div className="min-w-5 text-center font-mono font-bold text-[11px] text-slate-800">{group.quantity}</div>
                              <button
                                onClick={() => onAddToCart && onAddToCart(group.name, group.price)}
                                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white text-slate-500 hover:text-emerald-600 active:scale-90 transition-all shadow-sm cursor-pointer"
                              ><span className="text-sm font-black">+</span></button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
                    className="py-12 text-center flex flex-col items-center justify-center gap-3 text-slate-400 relative z-10 bg-white/40 rounded-2xl border border-white/60 shadow-inner"
                  >
                    <motion.div 
                      animate={{ y: [0, -8, 0] }} 
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-4xl opacity-50"
                    >
                      <span className="material-symbols-outlined">shopping_cart_off</span>
                    </motion.div>
                    <span className="text-[13px] font-medium text-slate-500">Giỏ hàng của bạn đang trống</span>
                  </motion.div>
                )}
  
                <div className="my-4 border-t border-slate-200/60 w-[calc(100%+40px)] -ml-5" />
  
                {/* Advanced Pricing Breakdown */}
                <div className="flex flex-col gap-2 text-[12px] text-slate-600 mb-4 relative z-10 px-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Tạm tính:</span>
                    <span className="font-mono font-bold text-slate-800">{formatPrice(calculateTotalValue())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="material-symbols-outlined text-[12px] font-bold">local_offer</span>
                      Khuyến mãi Smember:
                    </span>
                    <span className="font-mono font-bold text-emerald-600">-{formatPrice(calculateTotalValue() * 0.05)}</span>
                  </div>
                  
                  <div className="bg-[#FF4D24] rounded-xl p-3.5 mt-1.5 text-white shadow-[0_8px_16px_rgba(255,77,36,0.2)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-[24px] pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/90">Tổng thanh toán</span>
                      <span className="text-lg font-black font-mono tracking-tight">{formatPrice(calculateTotalValue() * 1.05)}</span>
                    </div>
                  </div>
                </div>
  
                <div className="flex gap-2.5 relative z-10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCartMenu(false)}
                    className="flex-[0.8] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs py-2.5 transition-colors text-center shadow-sm cursor-pointer"
                  >
                    Đóng
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteSelected}
                    disabled={getSelectedItemsCount() === 0}
                    className="flex-none px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    title="Xóa đã chọn"
                  >
                    <Trash2 size={14} className="stroke-[2.5]" />
                    {getSelectedItemsCount() > 0 && (
                      <span>{getSelectedItemsCount()}</span>
                    )}
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const totalSelected = selectedGroupKeys.length;
                      if (totalSelected === 0) {
                        alert("Vui lòng tích chọn sản phẩm bạn muốn thanh toán!");
                        return;
                      }
                      alert(`Đơn hàng trị giá ${formatPrice(calculateTotalValue() * 1.05)} đang được xử lý.`);
                      setShowCartMenu(false);
                    }}
                    disabled={cartItems.length === 0}
                    className="flex-[1.2] bg-[#111111] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-sans text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black"
                  >
                    <span>Thanh toán</span>
                    <span className="material-symbols-outlined text-[14px] font-bold">arrow_forward</span>
                  </motion.button>
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
            className="flex items-center gap-2.5 bg-white/40 text-[#111111] border border-white/60 shadow-sm backdrop-blur-md font-sans text-base font-semibold pl-3 pr-5 py-2 rounded-full hover:bg-white/60 transition-all duration-300 active:scale-95 cursor-pointer select-none"
          >
            {/* Elegant glassmorphism circle with a user icon */}
            <div className="w-8 h-8 rounded-full bg-slate-950/5 flex items-center justify-center text-[#111111]/80">
              <User size={16} className="stroke-[2.5]" />
            </div>
            <span className="font-semibold text-base text-[#111111] tracking-tight">Tài khoản</span>
          </button>

          {/* Account Dropdown Menu */}
          <AnimatePresence>
            {showAccountMenu && (
              <motion.div 
                initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 24px) -20px)", filter: "blur(0px)" }}
                exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 24px) -20px)", filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
                className="absolute right-0 mt-4 w-64 rounded-[24px] border border-white/70 bg-white/95 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.4)_inset] p-3 z-50 flex flex-col gap-1 origin-top-right overflow-hidden"
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
  
                {loggedInUser ? (
                  <button 
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigate("profile");
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
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
                    className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
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
                  className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
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
                  className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#FF4D24] hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-slate-100"
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
                    className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-rose-100"
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
                    className="group w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-[#FF4D24] hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-red-100"
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
