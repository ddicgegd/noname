import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  MapPin,
  Edit2,
  Building2,
  CreditCard,
  Truck,
  QrCode,
  Sparkles,
  Check,
  Copy,
  Receipt,
  Ticket,
  Percent,
  X,
  Smartphone,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Landmark,
  ShieldCheck,
  Info,
  Wallet,
  Coins,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import lottie from "lottie-web";
import paypalLottieData from "@/assets/paypal-lottie.json";
import cardLottieData from "@/assets/card-lottie.json";
import darkCardLottieData from "@/assets/dark-card-lottie.json";
import qrLottieData from "@/assets/qr-lottie.json";
import { getMyAddresses, AddressDto } from "@/services/addressService";
import { createOrder, CreateOrderInput, PaymentMethod } from "@/services/orderService";
import {
  connectPaymentWebSocket,
  executeAsyncOrderCreation,
  PaymentSocketSession,
  PaymentWsMessage,
  DEFAULT_WS_URL,
} from "@/services/websocketService";
import {
  getFullCart,
  addToCart as apiAddToCart,
  updateCartItemQuantity as apiUpdateCartQuantity,
  removeCartItem as apiRemoveCartItem,
  removeCartItems as apiRemoveCartItems,
  clearCart as apiClearCart,
  subscribeToCartUpdates
} from "@/services/cartService";
import type { Cart as ApiCart } from "@/types/cart";

export interface OrderProduct {
  id: string;
  attributesSku?: string;
  name: string;
  color: string;
  availableColors: string[];
  size: string;
  availableSizes: string[];
  unitPrice: number;
  oldPrice?: number;
  discount?: string;
  quantity: number;
  image: string;
  selected: boolean;
  isAvailable?: boolean;
  stock?: number;
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const calculateOrderDiscount = (unitPrice: number, oldPrice?: number, discountStr?: string): string | undefined => {
  if (oldPrice && Number(oldPrice) > Number(unitPrice)) {
    const pct = Math.round(((Number(oldPrice) - Number(unitPrice)) / Number(oldPrice)) * 100);
    if (pct > 0 && pct < 100) return `Giảm ${pct}%`;
  }
  if (discountStr && discountStr.trim() !== "" && discountStr !== "Giảm 10%") {
    return discountStr;
  }
  return undefined;
};

const cleanColorOptions = (colors?: string[]): string[] => {
  if (!colors || colors.length === 0) return ["Mặc định"];
  const mapped = colors.map((c) => {
    let t = c.trim();
    if (t.toLowerCase() === "graphite") return "Than Chì";
    if (t.toLowerCase() === "platinum") return "Bạch Kim";
    return t;
  });
  return Array.from(new Set(mapped));
};

const cleanSizeOptions = (sizes?: string[], colors: string[] = []): string[] => {
  if (!sizes || sizes.length === 0) return ["Mặc định"];
  const allColors = [...colors, "Bạch Kim", "Than Chì", "Graphite", "Platinum", "Titan Sa Mạc", "Titan Tự Nhiên", "Titan Đen", "Titan Trắng", "Trắng Gốm", "Đen Da", "Xanh Titan", "Titan Xám", "Xám Titan", "Titan Tím", "Titan Vàng", "Titan"];
  const cleaned = sizes.map((s) => {
    let val = s.trim();
    // Strip redundant device/model names in size string like "Galaxy S25 Ultra 256GB" -> "256GB"
    val = val.replace(/^(?:samsung|galaxy|iphone|ipad|macbook|xiaomi|dell|xps|google|pixel)[\s\w/-]*?(?=\b\d+(?:GB|TB|MB)\b)/i, "").trim();
    for (const c of allColors) {
      if (val.toLowerCase().startsWith(c.toLowerCase())) {
        val = val.slice(c.length).trim();
      }
    }
    val = val.replace(/^(?:h\s+kim|bạch\s+kim|kim|bạch|than\s+chì|graphite|platinum|titan\s+xám|xám\s+titan|titan)[\s,/-]*/i, "").trim();
    val = val.replace(/^[\s,/-]+/, "").trim();
    return val || s;
  });
  return Array.from(new Set(cleaned));
};



const INITIAL_PRODUCTS: OrderProduct[] = [
  {
    id: "phone-1",
    attributesSku: "ATTR-IP16PM-DESERT-256G",
    name: "iPhone 16 Pro Max 256GB - Chính Hãng Apple VN/A Titanium",
    color: "Titan Sa Mạc",
    availableColors: ["Titan Sa Mạc", "Titan Tự Nhiên", "Titan Đen", "Titan Trắng"],
    size: "256GB",
    availableSizes: ["256GB", "512GB", "1TB"],
    unitPrice: 34990000,
    oldPrice: 37990000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-2",
    attributesSku: "ATTR-S24U-TITANGRAY-512G",
    name: "Samsung Galaxy S24 Ultra 512GB - Galaxy AI 200MP Zoom 100x",
    color: "Xám Titan",
    availableColors: ["Xám Titan", "Đen Titan", "Tím Titan", "Vàng Titan"],
    size: "512GB",
    availableSizes: ["256GB", "512GB", "1TB"],
    unitPrice: 31490000,
    oldPrice: 35990000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-3",
    attributesSku: "ATTR-MI14U-WHITE-512G",
    name: "Xiaomi 14 Ultra 512GB - Ống Kính Leica Quad Camera Flagship",
    color: "Trắng Gốm",
    availableColors: ["Trắng Gốm", "Đen Da"],
    size: "512GB",
    availableSizes: ["512GB", "1TB"],
    unitPrice: 27990000,
    oldPrice: 31990000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-4",
    attributesSku: "ATTR-PIXEL9PXL-PORCELAIN-256G",
    name: "Google Pixel 9 Pro XL 256GB - Google Tensor G4 AI Siêu Thông Minh",
    color: "Trắng Porcelain",
    availableColors: ["Trắng Porcelain", "Đen Obsidian", "Xanh Hazel", "Hồng Rose"],
    size: "256GB",
    availableSizes: ["128GB", "256GB", "512GB"],
    unitPrice: 26500000,
    oldPrice: 29500000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-5",
    attributesSku: "ATTR-FINDX7U-BROWN-256G",
    name: "OPPO Find X7 Ultra - Camera Kép Kính Tiềm Vọng Hasselblad",
    color: "Nâu Da Bò",
    availableColors: ["Nâu Da Bò", "Đen Nhám", "Xanh Hải Âu"],
    size: "256GB",
    availableSizes: ["256GB", "512GB"],
    unitPrice: 22900000,
    oldPrice: 25900000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-6",
    attributesSku: "ATTR-XP1VI-PLATINUM-256G",
    name: "Sony Xperia 1 VI 256GB - Màn Hình 4K HDR OLED Âm Thanh Hi-Res",
    color: "Bạc Platinum",
    availableColors: ["Bạc Platinum", "Đen Nhám", "Xanh Rêu"],
    size: "256GB",
    availableSizes: ["256GB", "512GB"],
    unitPrice: 29990000,
    oldPrice: 32990000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "phone-7",
    attributesSku: "ATTR-IP15P-NATURAL-128G",
    name: "iPhone 15 Pro 128GB - Khung Viền Titan Chuẩn Hàng Không Vũ Trụ",
    color: "Titan Tự Nhiên",
    availableColors: ["Titan Tự Nhiên", "Titan Xanh", "Titan Đen", "Titan Trắng"],
    size: "128GB",
    availableSizes: ["128GB", "256GB", "512GB"],
    unitPrice: 24890000,
    oldPrice: 27990000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=80",
    selected: true,
  },
];

interface VoucherItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discountAmount: number;
  minOrder: number;
  expiry: string;
  tag: string;
}

const AVAILABLE_VOUCHERS: VoucherItem[] = [
  {
    id: "v-500k",
    code: "TECH500K",
    title: "Giảm 500.000₫ cho đơn điện thoại từ 15.000.000₫",
    description: "Áp dụng cho tất cả Smartphone chính hãng tại NONAME Store",
    discountAmount: 500000,
    minOrder: 15000000,
    expiry: "HSD: 31/12/2026",
    tag: "HOT",
  },
  {
    id: "v-freeship",
    code: "FREESHIP",
    title: "Miễn phí vận chuyển Hỏa Tốc (Giảm 35.000₫)",
    description: "Giao siêu tốc 2h nội thành & bảo hiểm vận chuyển giá trị cao",
    discountAmount: 35000,
    minOrder: 0,
    expiry: "HSD: 31/12/2026",
    tag: "FREESHIP",
  },
  {
    id: "v-vip1m",
    code: "VIP1M",
    title: "Ưu đãi Hội viên VIP giảm 1.000.000₫",
    description: "Dành riêng cho khách hàng VIP đơn từ 30.000.000₫",
    discountAmount: 1000000,
    minOrder: 30000000,
    expiry: "HSD: 31/12/2026",
    tag: "VIP",
  },
  {
    id: "v-flagship2m",
    code: "FLAGSHIP2M",
    title: "Siêu đặc quyền Flagship giảm 2.000.000₫",
    description: "Áp dụng cho đơn hàng Flagship tổng từ 50.000.000₫",
    discountAmount: 2000000,
    minOrder: 50000000,
    expiry: "HSD: 28/02/2026",
    tag: "ĐẶC BIỆT",
  },
];

interface BankOption {
  id: string;
  name: string;
  shortName: string;
  bin: string;
  accountNo: string;
  accountName: string;
  iconBg: string;
  logoText: string;
  logoUrl: string;
}

const BANK_OPTIONS: BankOption[] = [
  {
    id: "vcb",
    name: "Ngân hàng Ngoại thương Việt Nam",
    shortName: "Vietcombank",
    bin: "970436",
    accountNo: "9988226688",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-emerald-700",
    logoText: "VCB",
    logoUrl: "https://api.vietqr.io/img/VCB.png",
  },
  {
    id: "ncb",
    name: "Ngân hàng TMCP Quốc Dân",
    shortName: "NCB",
    bin: "970419",
    accountNo: "8899663322",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-blue-600",
    logoText: "NCB",
    logoUrl: "https://api.vietqr.io/img/NCB.png",
  },
  {
    id: "tcb",
    name: "Ngân hàng Kỹ thương Việt Nam",
    shortName: "Techcombank",
    bin: "970407",
    accountNo: "190388992233",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-red-600",
    logoText: "TCB",
    logoUrl: "https://api.vietqr.io/img/TCB.png",
  },
  {
    id: "acb",
    name: "Ngân hàng Á Châu",
    shortName: "ACB",
    bin: "970416",
    accountNo: "2468101214",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-sky-600",
    logoText: "ACB",
    logoUrl: "https://api.vietqr.io/img/ACB.png",
  },
];

interface UserLoanContract {
  id: string;
  accountNo: string;
  loanProductName: string;
  totalLimit: number;
  availableAmount: number;
  interestRate: string;
  termMonths: number;
  status: "ACTIVE" | "APPROVED" | "PENDING";
  statusText: string;
  monthlyRepaymentEstimate: number;
  expiryDate: string;
  type: "fixed" | "product_based";
  provider: string;
}

const MOCK_USER_LOANS: UserLoanContract[] = [
  {
    id: "loan-fineract-01",
    accountNo: "LN-2026-8899",
    loanProductName: "Hạn mức Vay Tiêu Dùng Tín Chấp Fineract",
    totalLimit: 50000000,
    availableAmount: 38500000,
    interestRate: "0.65%/tháng",
    termMonths: 12,
    status: "ACTIVE",
    statusText: "Khả dụng ngay",
    monthlyRepaymentEstimate: 3450000,
    expiryDate: "31/12/2026",
    type: "fixed",
    provider: "Fineract Core Banking",
  },
  {
    id: "loan-fineract-02",
    accountNo: "LN-2026-4421",
    loanProductName: "Gói Vay Ưu Đãi Thiết Bị Flagship (Vay vừa mua)",
    totalLimit: 30000000,
    availableAmount: 30000000,
    interestRate: "0% Lãi (3 tháng đầu)",
    termMonths: 6,
    status: "APPROVED",
    statusText: "Đã phê duyệt",
    monthlyRepaymentEstimate: 5000000,
    expiryDate: "15/10/2026",
    type: "fixed",
    provider: "Fineract Credit Line",
  },
  {
    id: "loan-fineract-03",
    accountNo: "LN-2026-1102",
    loanProductName: "Hạn Mức Tín Dụng Nhanh Microfinance",
    totalLimit: 15000000,
    availableAmount: 12000000,
    interestRate: "0.8%/tháng",
    termMonths: 6,
    status: "ACTIVE",
    statusText: "Khả dụng",
    monthlyRepaymentEstimate: 2150000,
    expiryDate: "30/11/2026",
    type: "fixed",
    provider: "Fineract Microfinance",
  },
];



function PaypalLottieAnimation({ triggerKey }: { triggerKey?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (animRef.current) {
      animRef.current.destroy();
    }
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: paypalLottieData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
    anim.setSpeed(1.2);
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, [triggerKey]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full pointer-events-none scale-125"
    />
  );
}

function CardLottieAnimation({ triggerKey }: { triggerKey?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (animRef.current) {
      animRef.current.destroy();
    }
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: cardLottieData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, [triggerKey]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full pointer-events-none scale-120"
    />
  );
}

function DarkCardLottieAnimation({ triggerKey }: { triggerKey?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (animRef.current) {
      animRef.current.destroy();
    }
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: darkCardLottieData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
    anim.setSpeed(1.2);
    anim.playSegments([0, 55], true);
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, [triggerKey]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full pointer-events-none scale-125"
    />
  );
}

function QrLottieAnimation({ triggerKey }: { triggerKey?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (animRef.current) {
      animRef.current.destroy();
    }
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: qrLottieData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
    anim.setSpeed(1.2);
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, [triggerKey]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full pointer-events-none scale-110"
    />
  );
}

interface OrderPageProps {
  onNavigate?: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
  cartItems?: { id: string; name: string; price: string; icon: string }[];
  onRemoveCartItem?: (id: string | string[]) => void;
  onAddToCart?: (itemName: string, itemPrice: string) => void;
  buyNowProduct?: OrderProduct | null;
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
  if (s.includes("S24U") || s.includes("S25U") || s.includes("SAMSUNG") || s.includes("GALAXY S24") || s.includes("GALAXY S25")) {
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
  if (s.includes("XPS") || s.includes("DELL")) {
    return {
      name: "Dell XPS 16 9640 Core Ultra 7 32GB 1TB",
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600",
      colors: ["Bạch Kim", "Than Chì"],
      sizes: ["16GB/512GB", "32GB/1TB", "64GB/2TB"],
      defaultColor: "Bạch Kim",
      defaultSize: "32GB/1TB",
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

const mapApiCartToOrderProducts = (cart: ApiCart): OrderProduct[] => {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return [];
  }
  return cart.items.map((item, idx) => {
    const meta = resolveProductMetadata(item.productName || item.sku || "");
    const rawTitle = item.attributesTitle || "";
    
    let color = meta.defaultColor;
    let size = meta.defaultSize;

    if (rawTitle.includes(" / ")) {
      const parts = rawTitle.split(" / ");
      if (parts[0]) color = parts[0].trim();
      if (parts[1]) size = parts.slice(1).join(" / ").trim();
    } else if (rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      if (parts[0]) color = parts[0].trim();
      if (parts[1]) size = parts.slice(1).join(" - ").trim();
    } else if (rawTitle.includes(",")) {
      const parts = rawTitle.split(",");
      if (parts[0]) color = parts[0].trim();
      if (parts[1]) size = parts.slice(1).join(",").trim();
    } else if (rawTitle.trim() !== "") {
      color = rawTitle.trim();
    }

    color = cleanColorOptions([color])[0] || meta.defaultColor;
    size = cleanSizeOptions([size], meta.colors)[0] || meta.defaultSize;

    const rawColors = item.availableColors || meta.colors;
    const rawSizes = item.availableSizes || meta.sizes;

    const availableColors = cleanColorOptions([color, ...rawColors]);
    const availableSizes = cleanSizeOptions([size, ...rawSizes], availableColors);
    const displayName = (item.productName && !item.productName.startsWith("ATTR-")) ? item.productName : meta.name;
    const imageUrl = item.imageUrl || meta.imageUrl;

    return {
      id: item.sku || `cart-item-${idx}`,
      attributesSku: item.sku,
      name: displayName,
      color,
      availableColors,
      size,
      availableSizes,
      unitPrice: item.salePrice || item.unitPrice || 0,
      oldPrice: (item.unitPrice && item.unitPrice > (item.salePrice || 0)) ? item.unitPrice : undefined,
      discount: item.discount || meta.discount,
      quantity: Math.max(1, item.quantity || 1),
      image: imageUrl,
      selected: item.isAvailable !== false && (item.stock === undefined || item.stock > 0),
      isAvailable: item.isAvailable !== false,
      stock: item.stock !== undefined ? item.stock : 99,
    };
  });
};

export default function OrderPage({ onNavigate, onRemoveCartItem, buyNowProduct }: OrderPageProps) {
  const [products, setProducts] = useState<OrderProduct[]>(() => {
    if (buyNowProduct) {
      return [{ ...buyNowProduct, selected: true }];
    }
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.BUY_NOW_PRODUCT) || localStorage.getItem("horizon_buy_now_product");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.attributesSku || parsed.name)) {
          return [{ ...parsed, selected: true }];
        }
      }
    } catch (_) {}
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    if (buyNowProduct) {
      setProducts([{ ...buyNowProduct, selected: true }]);
      return;
    }
    const cachedBuyNow = localStorage.getItem(STORAGE_KEYS.BUY_NOW_PRODUCT) || localStorage.getItem("horizon_buy_now_product");
    if (cachedBuyNow) return;

    let isMounted = true;
    getFullCart().then(cart => {
      if (isMounted && cart?.items?.length) {
        setProducts(mapApiCartToOrderProducts(cart));
      }
    }).catch(() => {});

    const unsubscribe = subscribeToCartUpdates((cart) => {
      if (!isMounted) return;
      if (cart) {
        setProducts(mapApiCartToOrderProducts(cart));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [buyNowProduct]);

  // Address Book Integration
  const [addressList, setAddressList] = useState<AddressDto[]>([]);
  const [selectedAddressSku, setSelectedAddressSku] = useState<string>("");

  // User & Shipping Information
  const [userInfo, setUserInfo] = useState({
    recipient: "Nguyễn Văn An",
    phone: "(+84) 987 654 321",
    address: "Tầng 12, Tòa nhà Bitexco, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    isDefault: true,
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(userInfo.address);
  const [tempRecipient, setTempRecipient] = useState(userInfo.recipient);
  const [tempPhone, setTempPhone] = useState(userInfo.phone);
  const [deliveryNote, setDeliveryNote] = useState("");

  // Order Placement State (Loading, Error & Success)
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNumber: string;
    totalAmount: number;
    shippingAddress: string;
    paymentMethod: string;
  } | null>(null);

  // WebSocket Payment Session State (FEATURE-WS-JWT-AUTH-30S)
  const [wsSession, setWsSession] = useState<PaymentSocketSession | null>(null);
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "connected" | "received" | "closed" | "error">("idle");
  const [wsMessage, setWsMessage] = useState<string | null>(null);
  const [wsCountdown, setWsCountdown] = useState<number>(30);

  // 30s Countdown timer for active WebSocket session
  useEffect(() => {
    let timer: any;
    if (wsStatus === "connected" && wsCountdown > 0) {
      timer = setInterval(() => {
        setWsCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [wsStatus, wsCountdown]);

  // Cleanup active WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsSession) {
        try {
          wsSession.close(1000, "OrderPage unmounted");
        } catch (_) {}
      }
    };
  }, [wsSession]);

  // Tải danh sách địa chỉ thực từ addressService
  useEffect(() => {
    let isMounted = true;
    async function loadAddressBook() {
      try {
        const addresses = await getMyAddresses();
        if (isMounted && addresses && addresses.length > 0) {
          setAddressList(addresses);
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          setSelectedAddressSku(defaultAddr.sku);
          setUserInfo({
            recipient: defaultAddr.recipientName,
            phone: defaultAddr.phoneNumber,
            address: defaultAddr.address,
            isDefault: defaultAddr.isDefault,
          });
          setTempAddress(defaultAddr.address);
          setTempRecipient(defaultAddr.recipientName);
          setTempPhone(defaultAddr.phoneNumber);
        }
      } catch (err) {
        console.warn("Chưa thể tải danh sách địa chỉ từ server, sử dụng cấu hình mặc định:", err);
      }
    }
    loadAddressBook();
    return () => {
      isMounted = false;
    };
  }, []);

  // Voucher Selection State
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  // Variant editing popover
  const [activeVariantDropdown, setActiveVariantDropdown] = useState<string | null>(null);
  const variantCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Payment Method State
  const [paymentType, setPaymentType] = useState<"bank" | "loan" | "paypal" | "card" | "cod">("bank");
  const [selectedBank, setSelectedBank] = useState<string>("vcb");
  const [bankSubMethod, setBankSubMethod] = useState<"card" | "qr">("card");
  const [bankCardAnimKey, setBankCardAnimKey] = useState(0);
  const [bankQrAnimKey, setBankQrAnimKey] = useState(0);
  const [paypalSubMethod, setPaypalSubMethod] = useState<"card" | "paypal">("card");
  const [paypalAnimKey, setPaypalAnimKey] = useState(0);
  const [cardAnimKey, setCardAnimKey] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (paymentType === "bank") {
      if (bankSubMethod === "card") {
        setBankCardAnimKey((k) => k + 1);
      } else if (bankSubMethod === "qr") {
        setBankQrAnimKey((k) => k + 1);
      }
    } else if (paymentType === "paypal" || paymentType === "card") {
      if (paypalSubMethod === "paypal") {
        setPaypalAnimKey((k) => k + 1);
      } else if (paypalSubMethod === "card") {
        setCardAnimKey((k) => k + 1);
      }
    }
  }, [paymentType, bankSubMethod, paypalSubMethod]);

  // Loan Subsystem State (Khoản vay cố định & Vay theo đơn hàng)
  const [loanMode, setLoanMode] = useState<"existing_loan" | "order_loan">("existing_loan");
  const [selectedLoanId, setSelectedLoanId] = useState<string>("loan-fineract-01");
  const [orderLoanTerm, setOrderLoanTerm] = useState<number>(12);
  const [orderLoanInterestRate] = useState<number>(0.0065);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState<boolean>(false);
  const [selectedCreditCardType, setSelectedCreditCardType] = useState<string>("VISA");
  const [selectedBnplProvider, setSelectedBnplProvider] = useState<string>("kredivo");
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState<boolean>(false);

  // Financial calculations
  const shippingFee = 35000;
  const selectedProducts = products.filter((p) => p.selected);
  const totalItemsCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
  const subtotal = selectedProducts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  
  const selectedVoucher = AVAILABLE_VOUCHERS.find((v) => v.id === selectedVoucherId);
  const appliedDiscount = selectedVoucher && subtotal >= selectedVoucher.minOrder ? selectedVoucher.discountAmount : 0;
  const total = Math.max(0, subtotal > 0 ? subtotal + shippingFee - appliedDiscount : 0);
  const isAllSelected = products.length > 0 && products.every((p) => p.selected);

  // Handlers
  const handleToggleSelectAll = () => {
    const next = !isAllSelected;
    setProducts((prev) => prev.map((p) => ({ ...p, selected: next })));
  };

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const newQty = Math.max(1, Math.min(99, target.quantity + delta));
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: newQty } : p))
    );
    const sku = target.attributesSku || target.id;
    try {
      await apiUpdateCartQuantity(sku, newQty);
    } catch (err) {
      console.warn("apiUpdateCartQuantity failed:", err);
    }
  };

  const handleRemoveProduct = async (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const sku = target?.attributesSku || id;
    if (onRemoveCartItem) onRemoveCartItem(sku);
    try {
      await apiRemoveCartItem(sku);
    } catch (err) {
      console.warn("apiRemoveCartItem failed:", err);
    }
  };

  const handleSelectVariant = async (id: string, color: string, size: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    // Calculate new SKU
    const isIphone = target.name.toLowerCase().includes("iphone");
    const isSamsung = target.name.toLowerCase().includes("samsung") || target.name.toLowerCase().includes("s24");
    let newSku = target.attributesSku || target.id;

    if (isIphone) {
      const colorCode = color.toLowerCase().includes("sa mạc") ? "DESERT" : color.toLowerCase().includes("tự nhiên") ? "NATURAL" : color.toLowerCase().includes("đen") ? "BLACK" : "WHITE";
      newSku = `ATTR-IP16PM-${colorCode}-${size}`;
    } else if (isSamsung) {
      newSku = `ATTR-S24U-TITANGRAY-${size}`;
    } else {
      newSku = `ATTR-${target.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)}-${size}`;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color, size, attributesSku: newSku } : p))
    );
    setActiveVariantDropdown(null);

    // Call GraphQL mutation to sync
    if (target.attributesSku && target.attributesSku !== newSku) {
      try {
        await apiRemoveCartItem(target.attributesSku);
        await apiAddToCart([{ sku: newSku, quantity: target.quantity }]);
      } catch (_) {}
    }
  };

  const handleSelectVoucher = (voucherId: string) => {
    if (selectedVoucherId === voucherId) {
      setSelectedVoucherId(null);
    } else {
      setSelectedVoucherId(voucherId);
    }
  };

  const handleSelectExistingAddress = (addr: AddressDto) => {
    setSelectedAddressSku(addr.sku);
    setUserInfo({
      recipient: addr.recipientName,
      phone: addr.phoneNumber,
      address: addr.address,
      isDefault: addr.isDefault,
    });
    setTempAddress(addr.address);
    setTempRecipient(addr.recipientName);
    setTempPhone(addr.phoneNumber);
    setIsEditingAddress(false);
  };

  const handleSaveAddress = () => {
    setUserInfo({
      ...userInfo,
      recipient: tempRecipient,
      phone: tempPhone,
      address: tempAddress,
    });
    setIsEditingAddress(false);
  };

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handlePlaceOrder = async () => {
    if (selectedProducts.length === 0 || isPlacingOrder) return;

    // Check if any selected item is out of stock
    const outOfStockItem = selectedProducts.find(p => p.isAvailable === false || p.stock === 0);
    if (outOfStockItem) {
      setOrderError(`Sản phẩm "${outOfStockItem.name}" hiện đã hết hàng hoặc ngừng kinh doanh. Vui lòng bỏ chọn hoặc chọn phân loại khác.`);
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    // Map UI payment option sang enum backend chuẩn:
    // - Thẻ nội địa (card): Gửi bankCode (NCB, VCB,...)
    // - Mã QR (qr): Gửi bankCode "VNPAYQR"
    const PAYMENT_MAP: Record<string, PaymentMethod> = {
      bank: "VNPAY",
      loan: "BANK_TRANSFER",
      paypal: "PAYPAL",
      card: "PAYPAL",
      cod: "COD",
    };
    const mappedPaymentMethod: PaymentMethod = PAYMENT_MAP[paymentType] || "VNPAY";
    
    let mappedBankCode: string | undefined = undefined;
    if (paymentType === "bank") {
      mappedBankCode = bankSubMethod === "card" ? currentBank?.shortName : "VNPAYQR";
    } else if (paymentType === "loan") {
      const activeLoanContract = MOCK_USER_LOANS.find((l) => l.id === selectedLoanId);
      if (loanMode === "existing_loan") {
        mappedBankCode = `LOAN_${activeLoanContract?.accountNo || "LN2026"}`;
      } else {
        mappedBankCode = `ORDER_LOAN_${orderLoanTerm}M`;
      }
    } else if (paymentType === "paypal" || paymentType === "card") {
      mappedBankCode = paypalSubMethod === "card" ? "CARD" : "PAYPAL";
    }

    const isDirectBuyNow = products.length === 1 && (buyNowProduct != null || localStorage.getItem(STORAGE_KEYS.BUY_NOW_PRODUCT) != null || localStorage.getItem("horizon_buy_now_product") != null);

    let effectiveNotes = deliveryNote.trim();
    if (!effectiveNotes) {
      if (paymentType === "loan") {
        if (loanMode === "existing_loan") {
          const activeLoanContract = MOCK_USER_LOANS.find((l) => l.id === selectedLoanId);
          effectiveNotes = `Thanh toán qua Khoản vay [${activeLoanContract?.loanProductName || "Gói vay Fineract"}] (Mã HĐ: ${activeLoanContract?.accountNo || "N/A"})`;
        } else {
          effectiveNotes = `Đăng ký Gói vay theo đơn hàng [${formatVND(total)}] - Kỳ hạn ${orderLoanTerm} tháng (Lãi suất ${orderLoanInterestRate * 100}%/tháng)`;
        }
      } else if (paymentType === "paypal" || paymentType === "card") {
        effectiveNotes = paypalSubMethod === "card" ? "Thanh toán qua Visa/Mastercard" : "Thanh toán qua ví PayPal";
      }
    }

    const payload: CreateOrderInput = {
      items: selectedProducts.map((p) => ({
        attributesSku: p.attributesSku || `ATTR-${p.id.toUpperCase()}`,
        quantity: p.quantity,
      })),
      addressSku: selectedAddressSku || "ADDR-DEFAULT",
      shippingAddress: userInfo.address,
      paymentMethod: mappedPaymentMethod,
      shippingMethod: "DELIVERY",
      isFromCart: !isDirectBuyNow,
      discountCodes: [],
      customerNotes: effectiveNotes || undefined,
      bankCode: mappedBankCode,
    };

    // Đóng session WebSocket cũ nếu còn tồn tại
    if (wsSession) {
      try {
        wsSession.close(1000, "Opening new order session");
      } catch (_) {}
    }

    setWsStatus("connecting");
    setWsCountdown(30);
    setWsMessage("Đang khởi tạo kết nối WebSocket tới cổng 8667...");

    try {
      const handle = await executeAsyncOrderCreation(
        payload,
        {
          onStatusChange: (statusText) => {
            setWsMessage(statusText);
            if (wsStatus === "idle") setWsStatus("connecting");
          },
          onSessionAcquired: (sessionId) => {
            setWsStatus("connected");
            setWsCountdown(30);
            setWsMessage(`Đã nhận mã phiên [${sessionId}]. Đang gửi đơn hàng tới Backend...`);
          },
          onSuccess: (result) => {
            setWsStatus("received");
            setWsMessage(result.message || "Tạo đơn hàng thành công!");

            // Xóa sản phẩm khỏi giỏ hàng nếu là tạo từ giỏ hàng
            if (!isDirectBuyNow) {
              try {
                localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
                localStorage.removeItem("horizon_cart");
                apiClearCart().catch(() => {});
                window.dispatchEvent(new Event("cart-updated"));
              } catch (_) {}
            }

            setOrderSuccessData({
              orderNumber: result.orderNumber,
              totalAmount: total,
              shippingAddress: userInfo.address,
              paymentMethod: mappedPaymentMethod,
            });

            // Nếu có URL thanh toán online (VNPay / Cổng thanh toán)
            // [DEBUG] Tạm dừng tự động chuyển trang để phục vụ debug
            if (result.paymentUrl) {
              console.info("[DEBUG] Payment URL nhận được:", result.paymentUrl);
              // setTimeout(() => {
              //   window.location.href = result.paymentUrl!;
              // }, 1500);
            }

            setIsPlacingOrder(false);
          },
          onError: (errorMessage) => {
            console.error("[OrderPage] Async order creation error:", errorMessage);
            setWsStatus("error");
            setWsMessage(errorMessage);
            setOrderError(errorMessage);
            setIsPlacingOrder(false);
          },
        }
      );

      setWsSession(handle.session);
    } catch (err: any) {
      console.error("[OrderPage] Order placement fatal error:", err);
      setWsStatus("error");
      setWsMessage(err?.message || "Không thể khởi tạo luồng đơn hàng");
      setOrderError(err?.message || "Không thể khởi tạo luồng đơn hàng. Vui lòng kiểm tra lại.");
      setIsPlacingOrder(false);
    }
  };

  const currentBank = BANK_OPTIONS.find((b) => b.id === selectedBank) || BANK_OPTIONS[0];

  return (
    <div className="min-h-screen lg:h-screen bg-background text-foreground font-sans selection:bg-neutral-900 selection:text-white flex flex-col overflow-hidden pb-3 relative z-0">
      
      {/* 70% Black Base with Gentle 30% Warm Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-[#FF5722]/8 blur-[130px] mix-blend-normal opacity-70" />
        <div className="absolute top-[30%] right-[-10%] w-[42vw] h-[60vh] rounded-full bg-[#FF8A00]/8 blur-[130px] mix-blend-normal opacity-70" />
        <div className="absolute bottom-[-10%] left-[20%] w-[55vw] h-[50vh] rounded-full bg-[#F43F5E]/6 blur-[130px] mix-blend-normal opacity-70" />
      </div>

      {/* Top Spacer Div to prevent floating Navbar overlapping */}
      <div className="h-16 sm:h-20 shrink-0 w-full" />

      {/* Main 2-Column Full-Height Container */}
      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN (7/12): Smartphone Catalog Framed Product Table               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-7 relative flex flex-col min-h-0 h-full overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 bg-white/90 backdrop-blur-md shadow-2xs">
          
          {/* Subtle Ambient Color Glow inside Left Column */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl -z-0">
            <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-[#FF5722]/6 blur-[80px] pointer-events-none" />
            <div className="absolute top-[40%] -right-20 w-72 h-72 rounded-full bg-[#FF8A00]/6 blur-[90px] pointer-events-none" />
          </div>

          {/* Table Header Bar with Back Button, Selection Toggle & Quick Bulk Actions */}
          <div className="relative z-10 pb-3 border-b border-slate-200/80 flex items-center justify-between shrink-0 gap-3">
            {/* Left: Back button + Select All Checkbox & Count */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("product")}
                className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="Quay lại danh mục"
              >
                <ArrowLeft className="size-4 stroke-[2.2]" />
              </button>

              {/* Standard Clean Select All Toggle */}
              <div
                role="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 cursor-pointer select-none group py-0.5"
              >
                <div
                  className={`size-4.5 rounded-md border flex items-center justify-center transition-all ${
                    isAllSelected
                      ? "bg-gradient-to-r from-[#FF4D24] to-[#FF6B35] border-[#FF4D24] text-white shadow-2xs"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {isAllSelected && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-[12px] font-bold text-slate-900 tracking-wide uppercase group-hover:text-[#FF4D24] transition-colors">
                  Chọn tất cả
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  selectedProducts.length > 0 
                    ? "bg-orange-50 text-[#FF4D24] border border-orange-200/70" 
                    : "bg-slate-100 text-slate-500 border border-slate-200/60"
                }`}>
                  ({selectedProducts.length}/{products.length})
                </span>
              </div>
            </div>

            {/* Right: Quick Bulk Actions */}
            <div className="flex items-center gap-2 text-xs">
              {selectedProducts.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setProducts(prev => prev.map(p => ({ ...p, selected: false })))}
                    className="text-[11.5px] text-slate-500 hover:text-slate-900 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Bỏ chọn tất cả
                  </button>
                  {onRemoveCartItem && (
                    <button
                      type="button"
                      onClick={() => {
                        const idsToRemove = selectedProducts.map(p => p.attributesSku || p.id);
                        onRemoveCartItem(idsToRemove);
                        setProducts(prev => prev.filter(p => !p.selected));
                      }}
                      className="flex items-center gap-1.5 text-[11.5px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/70 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Xóa ({selectedProducts.length})</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Scrollable Products List Container */}
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col">
            <div 
              className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto px-1.5 pt-2 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {products.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-12 text-center gap-3">
                  <Smartphone className="size-8 text-neutral-300 stroke-1" />
                  <p className="text-xs tracking-widest uppercase text-neutral-400">Giỏ hàng của bạn đang trống</p>
                  <Button
                    onClick={() => onNavigate && onNavigate("product")}
                    className="bg-neutral-900 hover:bg-black text-white text-[10px] tracking-widest uppercase rounded-full px-7 h-9 mt-2 cursor-pointer shadow-xs"
                  >
                    TIẾP TỤC MUA SẮM
                  </Button>
                </div>
              ) : (
                products.map((item, index) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  const discountLabel = calculateOrderDiscount(item.unitPrice, item.oldPrice, item.discount);
                  const isVariantExpanded = activeVariantDropdown === item.id;
                  const isNearBottom = products.length >= 2 && index === products.length - 1;

                  const displayTitle = item.name;

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        handleToggleProduct(item.id);
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl border select-none relative flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 overflow-visible ${
                        isVariantExpanded ? "z-40" : "z-0"
                      } ${
                        item.selected 
                          ? "bg-white border-slate-300 shadow-xs ring-1 ring-slate-900/5" 
                          : "border-transparent bg-transparent opacity-40 grayscale-[35%]"
                      }`}
                    >
                      {/* Top 3D Ribbon: Giảm X% (Left) wrapped around the edge */}
                      {discountLabel && (
                        <>
                          <div className={`absolute -top-1.5 left-[-4px] h-[21px] text-white text-[9.5px] font-black px-2 rounded-br-md rounded-tr-xs shadow-[1px_2px_4px_rgba(255,77,36,0.22)] flex items-center justify-center z-20 select-none transition-all duration-200 ${
                            item.selected 
                              ? "bg-gradient-to-r from-[#FF4D24] to-[#FF6B35]" 
                              : "bg-slate-400 opacity-50 shadow-none"
                          }`}>
                            {discountLabel}
                          </div>
                          {/* 3D Fold Corner for Left Ribbon */}
                          <div 
                            className={`absolute top-[15px] left-[-4px] w-[4px] h-[4px] z-10 transition-colors duration-200 ${
                              item.selected ? "bg-[#B43C00]" : "bg-slate-600 opacity-50"
                            }`} 
                            style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} 
                          />
                        </>
                      )}

                      {/* Left: Smartphone Thumbnail Photo + Info + Variant + Unit Price */}
                      <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                        {/* Product Thumbnail Photo - Edge-to-edge full cover, zero gaps */}
                        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-xl shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200 group/thumb ${
                          item.selected 
                          ? "bg-slate-100 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.03]" 
                          : "bg-neutral-100/70 border border-neutral-200/60 grayscale opacity-40"
                        }`}>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover object-center block transition-transform duration-300 ease-out group-hover/thumb:scale-105" 
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-base">📦</span>
                          )}
                        </div>

                        {/* Info & Variant Pill */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h4 className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 transition-colors ${
                            item.selected ? "text-slate-900" : "text-neutral-400"
                          }`}>
                            {displayTitle}
                          </h4>

                          {/* Minimalist Variant Pill Button & Fixed Frame Popup */}
                          <div 
                            className="relative inline-block self-start z-40" 
                            onClick={(e) => {
                              if (item.selected) e.stopPropagation();
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
                                setActiveVariantDropdown(null);
                              }, 450);
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                if (item.selected) {
                                  e.stopPropagation();
                                  setActiveVariantDropdown(activeVariantDropdown === item.id ? null : item.id);
                                }
                              }}
                              className={`text-[10.5px] px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                                !item.selected 
                                  ? "bg-transparent border-transparent text-neutral-400 select-none"
                                  : isVariantExpanded
                                    ? "bg-gradient-to-r from-orange-50 via-white to-orange-50/90 border-[#FF4D24]/40 text-[#FF4D24] font-medium shadow-[0_2px_10px_rgba(255,77,36,0.12)] ring-1 ring-[#FF4D24]/20"
                                    : "bg-white/80 hover:bg-orange-50/60 border-slate-200/90 hover:border-[#FF4D24]/30 text-slate-700 hover:text-[#FF4D24] shadow-2xs"
                              }`}
                            >
                              <span>Phiên bản: <strong className={item.selected ? (isVariantExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 font-semibold") : "text-neutral-400 font-normal"}>{item.color}</strong>, <strong className={item.selected ? (isVariantExpanded ? "text-[#FF4D24] font-bold" : "text-slate-800 font-semibold") : "text-neutral-400 font-normal"}>{item.size}</strong></span>
                              <ChevronDown className={`size-3 transition-transform duration-200 ${isVariantExpanded ? "rotate-180 text-[#FF4D24]" : ""} ${item.selected ? (isVariantExpanded ? "text-[#FF4D24]" : "text-slate-500") : "text-neutral-400"}`} />
                            </button>

                            {/* Popup Khung cố định với hiệu ứng bung mở vòng tròn (Trắng pha cam nhẹ) */}
                            <AnimatePresence>
                              {isVariantExpanded && item.selected && (
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
                                      {cleanColorOptions(item.availableColors).map((c) => (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => handleSelectVariant(item.id, c, item.size)}
                                          className={`w-full py-1.5 px-2 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white ${
                                            item.color === c
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
                                    <div className={`grid gap-1.5 ${cleanSizeOptions(item.availableSizes, item.availableColors).length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                                      {cleanSizeOptions(item.availableSizes, item.availableColors).map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => handleSelectVariant(item.id, item.color, s)}
                                          className={`w-full py-1.5 px-1.5 text-center text-[10.5px] rounded-xl border transition-all truncate flex items-center justify-center cursor-pointer bg-white ${
                                            item.size === s
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

                          {/* Normal Sans-serif Price Display */}
                          <div className="flex items-center gap-2 pt-0.5">
                            {item.oldPrice && (
                              <span className="text-[11px] text-slate-400 line-through font-normal">
                                {formatVND(item.oldPrice)}
                              </span>
                            )}
                            <span className={`text-xs sm:text-[13px] font-bold transition-colors ${
                              item.selected ? "text-slate-900" : "text-neutral-400"
                            }`}>
                              {formatVND(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stepper & Normal Sans-serif Total Price */}
                      <div className="flex items-center gap-4 sm:gap-7 shrink-0 pr-1" onClick={(e) => {
                        if (item.selected) e.stopPropagation();
                      }}>
                        {/* Stepper */}
                        <div className="flex items-center justify-center">
                          <div className={`flex items-center border rounded-lg h-7.5 transition-all ${
                            item.selected 
                              ? "border-slate-300 bg-white shadow-2xs" 
                              : "border-neutral-200/50 bg-neutral-100/60 opacity-60"
                          }`}>
                            <button
                              type="button"
                              className={`size-6.5 flex items-center justify-center disabled:opacity-20 cursor-pointer ${
                                item.selected ? "text-slate-500 hover:text-slate-950" : "text-neutral-400"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.selected) {
                                  handleUpdateQuantity(item.id, -1);
                                }
                              }}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={11} className="stroke-[2.5]" />
                            </button>
                            <span className={`w-7 text-center text-xs font-bold select-none ${
                              item.selected ? "text-slate-800" : "text-neutral-400"
                            }`}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className={`size-6.5 flex items-center justify-center cursor-pointer ${
                                item.selected ? "text-slate-500 hover:text-slate-950" : "text-neutral-400"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.selected) {
                                  handleUpdateQuantity(item.id, 1);
                                }
                              }}
                            >
                              <Plus size={11} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </div>

                        {/* Line Total Price */}
                        <div className="w-24 sm:w-28 text-right flex flex-col items-end justify-center select-none">
                          {item.oldPrice && item.oldPrice > item.unitPrice && (
                            <span className="text-[11px] text-slate-400 line-through leading-tight">
                              {formatVND(item.oldPrice * item.quantity)}
                            </span>
                          )}
                          <div className={`font-bold text-[13.8px] sm:text-[16.7px] tracking-tight transition-colors ${
                            item.selected ? "text-slate-900" : "text-neutral-400"
                          }`}>
                            {formatVND(lineTotal)}
                          </div>
                          {item.quantity > 1 && (
                            <span className={`text-[10.5px] font-normal ${item.selected ? "text-slate-400" : "text-neutral-300"}`}>
                              ({formatVND(item.unitPrice)}/món)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Fade Gradient Mask - Pure Visual Effect (No Text) */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white/80 via-white/40 to-transparent pointer-events-none rounded-b-2xl" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (5/12): Synchronized Compact Layout (70% Black / 30% Orange) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 overflow-hidden gap-2.5">
          
          {/* ----------------------------------------------------------------------- */}
          {/* TẦNG 1: THÔNG TIN GIAO HÀNG + GHI CHÚ ĐƠN HÀNG                          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="shrink-0 flex flex-col gap-2 p-3.5 rounded-2xl border border-neutral-200/90 bg-white/90 backdrop-blur-md shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Thông tin giao hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit2 className="size-3" />
                <span>Thay đổi</span>
              </button>
            </div>

            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 text-[12.5px]">{userInfo.recipient}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-600 text-[12.5px] font-medium">{userInfo.phone}</span>
                {userInfo.isDefault && (
                  <Badge variant="outline" className="text-[9px] font-bold py-0 px-1 rounded text-neutral-600 border-neutral-300">
                    Mặc định
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-neutral-500 leading-snug truncate">
                {userInfo.address}
              </p>
            </div>

            {/* Dedicated Delivery Note Sub-block with Inline Icon & Placeholder */}
            <div className="pt-1.5 border-t border-neutral-200/60">
              <div className="relative flex items-center">
                <FileText className="size-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                <Input
                  placeholder="Ghi chú đơn hàng (Lời nhắn cho người bán / shipper)..."
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="h-8 pl-8 text-xs bg-neutral-50/60 hover:bg-white focus:bg-white rounded-lg border-neutral-200 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-900 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* TẦNG 2: PHƯƠNG THỨC THANH TOÁN (+15% DOWNWARDS EXPANSION)              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="h-[402px] shrink-0 flex flex-col justify-between p-3.5 rounded-2xl border border-neutral-200/90 bg-white/90 backdrop-blur-md shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="size-3.5 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Phương thức thanh toán
                </h3>
              </div>
            </div>

            {/* Payment Category Selector Tabs with Smooth Sliding Indicator (4 Methods) */}
            <div className="grid grid-cols-4 gap-1 bg-neutral-100/70 p-1 rounded-xl text-xs font-medium shrink-0 relative">
              {[
                { id: "bank", label: "Ngân hàng", icon: Building2 },
                { id: "paypal", label: "PayPal", icon: CreditCard },
                { id: "cod", label: "COD", icon: Truck },
                { id: "loan", label: "Khoản vay", icon: Landmark, badge: "Fineract" },
              ].map((tab) => {
                const isSelected = paymentType === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentType(tab.id as any)}
                    className={`relative py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10.5px] sm:text-[11px] select-none ${
                      isSelected
                        ? "text-neutral-900 font-bold"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activePaymentTabIndicator"
                        className="absolute inset-0 bg-white rounded-lg shadow-2xs"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <IconComponent className="size-3 relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">{tab.label}</span>
                    {tab.badge && !isSelected && (
                      <span className="relative z-10 hidden sm:inline-block text-[7.5px] font-black text-white bg-sky-600 px-1 py-0.2 rounded-full leading-none">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Bank & Payment Detail View */}
            <div className="h-[306px] overflow-hidden">
              {/* Option 1: Khoản vay tín dụng (1 Tag chính xét duyệt theo giá trị đơn hàng đầy đủ thông tin) */}
              {paymentType === "loan" && (() => {
                const activeLoan = MOCK_USER_LOANS.find((l) => l.id === selectedLoanId) || MOCK_USER_LOANS[0];
                const monthlyPrincipal = Math.round(total / orderLoanTerm);
                const monthlyInterest = Math.round(total * orderLoanInterestRate);
                const monthlyTotal = monthlyPrincipal + monthlyInterest;

                return (
                  <div className="h-full p-2.5 sm:p-3 bg-neutral-50/90 rounded-xl border border-neutral-200/80 flex flex-col justify-between text-xs overflow-hidden">
                    {/* 1 Tag chính to nổi bật: Thể hiện rõ xét duyệt theo số tiền đơn hàng */}
                    <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-50/50 p-2.5 sm:p-3 rounded-xl border border-sky-200/90 shadow-2xs flex flex-col gap-1.5 shrink-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="size-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            <Landmark className="size-4.5" />
                          </div>
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9.5px] sm:text-[10px] font-bold text-sky-800 uppercase tracking-wide bg-sky-100/80 px-1.5 py-0.5 rounded-md border border-sky-200/60">
                                Xét duyệt khoản vay
                              </span>
                              <Badge className="text-[8px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none">
                                Duyệt tự động 100%
                              </Badge>
                            </div>
                            <h4 className="text-xs sm:text-[13px] font-extrabold text-neutral-900 leading-snug">
                              Với đơn hàng <span className="text-sky-700 font-black">{formatVND(total)}</span>, bạn có thể mở xét duyệt khoản vay
                            </h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsLoanModalOpen(true)}
                          className="flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 px-2.5 py-1.5 rounded-lg transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer shrink-0"
                        >
                          <Wallet className="size-3" />
                          <span>Hạn mức & Gói vay</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>

                      {/* Thông tin mô tả gói vay */}
                      <p className="text-[10px] sm:text-[10.5px] text-neutral-500 leading-snug">
                        Thẩm định tức thì qua Core Banking Fineract. Áp dụng trả chậm linh hoạt từ 6 - 24 tháng với lãi suất ưu đãi chỉ từ 0.65%/tháng.
                      </p>
                    </div>

                    {/* Term Selector Cards (Đầy đủ thông tin gốc, lãi, góp mỗi tháng) */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-h-0 gap-1.5">
                      <div className="flex items-center justify-between px-0.5 text-[11px] shrink-0">
                        <span className="font-bold text-neutral-800">Chọn kỳ hạn thanh toán:</span>
                        <span className="text-neutral-500 text-[10.5px]">
                          Góp ước tính: <strong className="text-sky-700 font-extrabold text-xs">{formatVND(monthlyTotal)}</strong>/tháng
                        </span>
                      </div>

                      {/* 4 Clean Term Cards */}
                      <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0 items-stretch">
                        {[6, 12, 18, 24].map((term) => {
                          const isSelected = orderLoanTerm === term;
                          const principal = Math.round(total / term);
                          const interest = Math.round(total * orderLoanInterestRate);
                          const monthlyPay = principal + interest;

                          return (
                            <button
                              key={term}
                              type="button"
                              onClick={() => setOrderLoanTerm(term)}
                              className={`rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between text-left transition-all cursor-pointer relative ${
                                isSelected
                                  ? "border-sky-600 bg-sky-50/20 ring-1.5 ring-sky-500/20 shadow-xs"
                                  : "border-neutral-200 bg-white hover:border-sky-300 hover:bg-sky-50/10"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-neutral-900 text-xs sm:text-[12.5px]">
                                  {term} tháng
                                </span>
                                <Badge className="text-[7.5px] px-1 py-0 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-none">
                                  0.65%
                                </Badge>
                              </div>

                              <div className="my-auto py-0.5">
                                <span className="text-[8.5px] text-neutral-400 block leading-tight">
                                  Góp mỗi tháng:
                                </span>
                                <span className="font-black text-sky-800 text-[11px] sm:text-xs tracking-tight">
                                  {formatVND(monthlyPay)}
                                </span>
                              </div>

                              <div className="pt-0.5 border-t border-neutral-100 flex flex-col gap-0.2 text-[8px] text-neutral-500">
                                <div className="flex justify-between">
                                  <span>Gốc:</span>
                                  <span className="font-medium text-neutral-700">{formatVND(principal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Lãi:</span>
                                  <span className="font-medium text-neutral-700">{formatVND(interest)}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Thanh liên kết gói vay hoặc hướng dẫn thẩm định */}
                      <div className="bg-white p-1.5 px-2 rounded-xl border border-neutral-200/80 flex items-center justify-between text-[10px] text-neutral-600 shrink-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {activeLoan
                              ? `Đang áp dụng: ${activeLoan.loanProductName} (${activeLoan.accountNo}) • Hạn mức còn ${formatVND(activeLoan.availableAmount)}`
                              : "Thẩm định hồ sơ trực tuyến qua Core Banking Fineract"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsLoanModalOpen(true)}
                          className="font-bold text-sky-700 hover:underline shrink-0 ml-1 cursor-pointer"
                        >
                          Đổi gói
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* Option 2: Chọn Nhiều Loại Ngân Hàng (4 Ngân Hàng) */}
              {paymentType === "bank" && (
                <div className="h-full flex flex-col justify-between gap-2">
                  {/* 4 Bank Cards - Compact 4:3 Ratio (Logos only) */}
                  <div className="grid grid-cols-4 gap-1.5 w-full shrink-0">
                    {BANK_OPTIONS.map((b) => {
                      const isSelected = selectedBank === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`h-12 sm:h-13 rounded-xl border-[1.5px] flex items-center justify-center p-2 transition-all cursor-pointer relative group ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/50 shadow-2xs"
                              : "border-neutral-200/90 hover:border-orange-300 hover:bg-orange-50/20 bg-white"
                          }`}
                          title={b.name}
                        >
                          <img
                            src={b.logoUrl}
                            alt={b.shortName}
                            className="max-h-6 sm:max-h-7 max-w-[80%] object-contain select-none transition-transform duration-150 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Bank Account / Card Detail with Sub-option switch */}
                  <div className="h-[232px] flex flex-col justify-between text-xs pt-1">
                    {/* Header Bar with Sub-option Tabs */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 gap-2 shrink-0">
                      <span className="font-bold text-neutral-900 text-xs sm:text-[12.5px] truncate" title={currentBank.name}>
                        {currentBank.name}
                      </span>
                      <div className="h-[34px] w-[184px] grid grid-cols-2 bg-neutral-100/90 p-0.5 rounded-lg text-xs font-medium shrink-0 gap-1 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setBankSubMethod("card");
                            setBankCardAnimKey((k) => k + 1);
                          }}
                          className={`h-full w-full flex items-center justify-center rounded-md cursor-pointer select-none text-xs overflow-hidden relative z-10 transition-colors duration-200 ${
                            bankSubMethod === "card"
                              ? "text-neutral-900 font-bold"
                              : "text-neutral-500 hover:text-neutral-800 font-medium"
                          }`}
                          title="Thẻ nội địa"
                        >
                          {bankSubMethod === "card" && (
                            <motion.div
                              layoutId="bankSubMethodIndicator"
                              className="absolute inset-0 bg-white rounded-md shadow-2xs z-0"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-center w-full h-full">
                            {bankSubMethod === "card" ? (
                              <DarkCardLottieAnimation triggerKey={bankCardAnimKey} />
                            ) : (
                              <span>Thẻ nội địa</span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBankSubMethod("qr");
                            setBankQrAnimKey((k) => k + 1);
                          }}
                          className={`h-full w-full flex items-center justify-center rounded-md cursor-pointer select-none text-xs overflow-hidden relative z-10 transition-colors duration-200 ${
                            bankSubMethod === "qr"
                              ? "text-neutral-900 font-bold"
                              : "text-neutral-500 hover:text-neutral-800 font-medium"
                          }`}
                          title="Mã QR"
                        >
                          {bankSubMethod === "qr" && (
                            <motion.div
                              layoutId="bankSubMethodIndicator"
                              className="absolute inset-0 bg-white rounded-md shadow-2xs z-0"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-center w-full h-full">
                            {bankSubMethod === "qr" ? (
                              <QrLottieAnimation triggerKey={bankQrAnimKey} />
                            ) : (
                              <span>Mã QR</span>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Nội dung thông tin tài khoản ngân hàng & QR Code (Có AnimatePresence chuyển tag mượt mà) */}
                    <div className="h-full py-1 overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        {bankSubMethod === "qr" ? (
                          <motion.div
                            key={`bank-qr-${selectedBank}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="h-full flex items-center justify-between gap-2.5"
                          >
                            <div className="flex flex-col justify-between h-full flex-1 py-0.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold text-neutral-500">Ngân hàng thụ hưởng:</span>
                                <span className="font-bold text-neutral-900 text-xs truncate" title={currentBank.name}>{currentBank.name}</span>
                              </div>

                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-[11.5px] text-neutral-500 font-medium">Số tài khoản:</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(currentBank.accountNo, "acc")}
                                  className="flex items-center gap-1.5 font-bold text-neutral-900 hover:text-orange-600 cursor-pointer text-xs sm:text-[12.5px]"
                                >
                                  <span className="tracking-wide">{currentBank.accountNo}</span>
                                  {copiedField === "acc" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-neutral-400" />}
                                </button>
                              </div>

                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-[11.5px] text-neutral-500 font-medium">Số tiền:</span>
                                <span className="font-bold text-orange-600 text-xs sm:text-[12.5px]">{formatVND(total)}</span>
                              </div>

                              <div className="flex items-center justify-between bg-neutral-50 p-1.5 rounded-lg border border-neutral-200/60 py-0.5">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-neutral-500 font-medium">Nội dung CK:</span>
                                  <span className="font-mono font-bold text-neutral-900 text-[10.5px]">
                                    NONAME {userInfo.phone ? userInfo.phone.replace(/[^0-9]/g, "").slice(-4) : "79030"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(`NONAME ${userInfo.phone ? userInfo.phone.replace(/[^0-9]/g, "").slice(-4) : "79030"}`, "msg")}
                                  className="flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 cursor-pointer text-xs"
                                  title="Sao chép nội dung"
                                >
                                  {copiedField === "msg" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-neutral-400" />}
                                </button>
                              </div>
                            </div>

                            {/* Dynamic VietQR code (Chỉ hiển thị ở chế độ QR) */}
                            <div className="w-[124px] h-full flex flex-col items-center justify-center p-1.5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs shrink-0">
                              <div className="relative size-24 rounded-lg bg-neutral-50 flex items-center justify-center overflow-hidden">
                                <img
                                  src={`https://api.vietqr.io/image/${currentBank.bin}-${currentBank.accountNo}-compact2.png?amount=${total}&addInfo=NONAME%20${userInfo.phone ? userInfo.phone.replace(/[^0-9]/g, "").slice(-4) : "79030"}&accountName=CONG%20TY%20TNHH%20NONAME%20VIETNAM`}
                                  alt={`VietQR ${currentBank.shortName}`}
                                  className="w-full h-full object-contain select-none"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                                <div className="hidden flex-col items-center justify-center gap-1 text-neutral-700">
                                  <QrCode className="size-12 text-neutral-600" />
                                  <span className="text-[8.5px] font-bold text-neutral-700">{currentBank.shortName} QR</span>
                                </div>
                              </div>
                              <span className="text-[8.5px] text-neutral-500 font-medium text-center mt-1">
                                Quét mã VietQR
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`bank-card-${selectedBank}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="h-full flex flex-col justify-between py-1"
                          >
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-[11.5px] text-neutral-500 font-medium">Số tài khoản:</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(currentBank.accountNo, "acc")}
                                className="flex items-center gap-1.5 font-bold text-neutral-900 hover:text-orange-600 cursor-pointer text-xs sm:text-[12.5px]"
                              >
                                <span className="tracking-wide">{currentBank.accountNo}</span>
                                {copiedField === "acc" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-neutral-400" />}
                              </button>
                            </div>

                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-[11.5px] text-neutral-500 font-medium">Chủ tài khoản:</span>
                              <span className="font-semibold text-neutral-800 text-[11px] sm:text-[11.5px] truncate">{currentBank.accountName}</span>
                            </div>

                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-[11.5px] text-neutral-500 font-medium">Số tiền:</span>
                              <span className="font-bold text-orange-600 text-xs sm:text-[12.5px]">{formatVND(total)}</span>
                            </div>

                            <div className="flex items-center justify-between py-0.5">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-500 font-medium">Nội dung CK:</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(`NONAME ${userInfo.phone ? userInfo.phone.replace(/[^0-9]/g, "").slice(-4) : "79030"}`, "msg")}
                                className="flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 cursor-pointer text-xs"
                                title="Sao chép nội dung"
                              >
                                <span>NONAME {userInfo.phone ? userInfo.phone.replace(/[^0-9]/g, "").slice(-4) : "79030"}</span>
                                {copiedField === "msg" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-neutral-400" />}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 4: PayPal */}
              {(paymentType === "paypal" || paymentType === "card") && (
                <div className="h-full p-3 bg-neutral-50/90 rounded-xl border border-neutral-200/80 flex flex-col justify-between text-xs overflow-hidden">
                  {/* Header Bar with Sub-option Tabs */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200/60 gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-5 px-1.5 bg-[#003087] text-white rounded flex items-center justify-center font-black text-[10px] tracking-tight">
                        PayPal
                      </div>
                      <span className="font-bold text-neutral-900 text-xs">Cổng thanh toán PayPal</span>
                    </div>

                    <div className="h-[34px] w-[184px] grid grid-cols-2 bg-neutral-100/90 p-0.5 rounded-lg text-xs font-medium shrink-0 gap-1 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setPaypalSubMethod("card");
                          setCardAnimKey((k) => k + 1);
                        }}
                        className={`h-full w-full flex items-center justify-center rounded-md cursor-pointer select-none text-xs overflow-hidden relative z-10 transition-colors duration-200 ${
                          paypalSubMethod === "card"
                            ? "text-neutral-900 font-bold"
                            : "text-neutral-500 hover:text-neutral-800 font-medium"
                        }`}
                        title="Thẻ Quốc tế"
                      >
                        {paypalSubMethod === "card" && (
                          <motion.div
                            layoutId="paypalSubMethodIndicator"
                            className="absolute inset-0 bg-white rounded-md shadow-2xs z-0"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center justify-center w-full h-full">
                          {paypalSubMethod === "card" ? (
                            <CardLottieAnimation triggerKey={cardAnimKey} />
                          ) : (
                            <span>Thẻ Quốc tế</span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaypalSubMethod("paypal");
                          setPaypalAnimKey((k) => k + 1);
                        }}
                        className={`h-full w-full flex items-center justify-center rounded-md cursor-pointer select-none text-xs overflow-hidden relative z-10 transition-colors duration-200 ${
                          paypalSubMethod === "paypal"
                            ? "text-neutral-900 font-bold"
                            : "text-neutral-500 hover:text-neutral-800 font-medium"
                        }`}
                        title="PayPal"
                      >
                        {paypalSubMethod === "paypal" && (
                          <motion.div
                            layoutId="paypalSubMethodIndicator"
                            className="absolute inset-0 bg-white rounded-md shadow-2xs z-0"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center justify-center w-full h-full">
                          {paypalSubMethod === "paypal" ? (
                            <PaypalLottieAnimation triggerKey={paypalAnimKey} />
                          ) : (
                            <span>Paypal</span>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Content based on paypalSubMethod */}
                  <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-neutral-200/80 gap-2.5 my-auto text-center shadow-2xs overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {paypalSubMethod === "card" ? (
                        <motion.div
                          key="card-submethod-content"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="flex flex-col items-center justify-center gap-2 w-full"
                        >
                          <div className="flex items-center gap-1.5 justify-center flex-wrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-[#003087] border border-blue-200/60">
                              VISA
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-50 text-[#EB001B] border border-red-200/60">
                              Mastercard
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-50 text-[#0070BA] border border-sky-200/60">
                              JCB
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#006FCF] border border-emerald-200/60">
                              Amex
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 leading-relaxed max-w-sm">
                            Điều hướng thẳng đến form nhập thẻ quốc tế (<span className="font-semibold text-neutral-900">PayPal Guest Checkout / Card Fields</span>), không bắt buộc đăng nhập ví.
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="paypal-submethod-content"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="flex flex-col items-center justify-center gap-2 w-full"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-[#003087] tracking-tight bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 flex items-center gap-1">
                              <Smartphone className="size-3 text-[#003087]" />
                              PayPal Account &amp; App QR
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 leading-relaxed max-w-sm">
                            Điều hướng người dùng đăng nhập tài khoản Ví PayPal hoặc quét mã QR thanh toán trên ứng dụng PayPal.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200/60 shrink-0">
                      <span>Mã tham số gửi Gateway:</span>
                      <code className="font-mono font-bold text-neutral-900 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                        bankCode: "{paypalSubMethod === "card" ? "CARD" : "PAYPAL"}"
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 5: COD */}
              {paymentType === "cod" && (
                <div className="h-full p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/70 flex items-start gap-2 text-xs text-neutral-600">
                  <Truck className="size-3.5 text-neutral-700 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-neutral-900 text-[10.5px]">Thanh toán tiền mặt khi nhận hàng (COD)</span>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Quý khách được quyền mở hộp đồng kiểm tra thiết bị nguyên seal trước khi thanh toán cho shipper.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* EXPANDED BOTTOM SECTION: Summary Breakdown + Place Order Action CTA     */}
          {/* ======================================================================= */}
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-neutral-200/90 shadow-2xs z-10">
            
            {/* --------------------------------------------------------------------- */}
            {/* TẦNG 3: BẢNG TỔNG THANH TOÁN (SUMMARY BREAKDOWN - +20% Sizing)        */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4.5 text-neutral-800" />
                  <h3 className="text-[13.5px] sm:text-[14px] font-bold uppercase tracking-wider text-neutral-900">
                    Tổng thanh toán
                  </h3>
                </div>
                <span className="text-xs sm:text-[12.5px] font-medium text-neutral-400">
                  {totalItemsCount} sản phẩm
                </span>
              </div>

              {/* Voucher Selector Pill Box */}
              <div className="border-y border-neutral-100 py-2">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/80 hover:bg-neutral-100 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                      <Ticket className="size-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-[13px] font-bold text-neutral-900">
                        {selectedVoucher ? selectedVoucher.code : "Chọn Voucher giảm giá"}
                      </span>
                      <span className="text-[11px] text-neutral-500 truncate max-w-[220px]">
                        {selectedVoucher ? selectedVoucher.title : "Có 4 mã ưu đãi khả dụng"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedVoucher ? (
                      <Badge className="bg-orange-600 hover:bg-orange-700 text-[10.5px] font-bold text-white px-2.5 py-0.5 shadow-2xs">
                        -{formatVND(appliedDiscount)}
                      </Badge>
                    ) : (
                      <span className="text-xs sm:text-[13px] font-bold text-orange-600">Chọn mã</span>
                    )}
                    <ChevronRight className="size-4 text-neutral-400" />
                  </div>
                </button>
              </div>

              {/* Normal Sans-serif Breakdown Lines */}
              <div className="flex flex-col gap-2 text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px] text-neutral-500">Tiền hàng tạm tính:</span>
                  <span className="font-semibold text-neutral-900 text-xs sm:text-[14.5px]">{formatVND(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px] text-neutral-500">Phí giao hàng Express:</span>
                  <span className="font-semibold text-neutral-900 text-xs sm:text-[14.5px]">{formatVND(shippingFee)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-xs sm:text-[13px] flex items-center gap-1 font-medium">
                      <Percent className="size-3.5" />
                      Voucher đã giảm:
                    </span>
                    <span className="font-bold text-xs sm:text-[14.5px]">- {formatVND(appliedDiscount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* TẦNG 4: NEO GIÁ TỔNG CỘNG XUỐNG DƯỚI & NÚT HÀNH ĐỘNG ĐẶT HÀNG        */}
            {/* --------------------------------------------------------------------- */}
            <div className="mt-auto flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14.5px] sm:text-[16px] font-bold text-neutral-900 leading-snug block">Tổng cộng:</span>
                  <p className="text-[11px] text-neutral-400 leading-normal">Đã bao gồm thuế VAT</p>
                </div>
                <div className="text-right flex items-center">
                  <span className="text-xl sm:text-[24px] font-black text-neutral-900 tracking-tight leading-none">
                    {formatVND(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={selectedProducts.length === 0 || isPlacingOrder}
                className={`w-full rounded-full h-11.5 text-xs sm:text-[13px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-0.5 ${
                  selectedProducts.length > 0 && !isPlacingOrder
                    ? "bg-gradient-to-r from-orange-600 via-orange-500 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white cursor-pointer shadow-md shadow-orange-500/20 active:scale-[0.99]"
                    : "bg-neutral-900 text-neutral-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin text-white" />
                    <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4.5" />
                    <span>XÁC NHẬN ĐẶT HÀNG ({totalItemsCount} MÓN)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* ORDER SUCCESS MODAL                                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {orderSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center relative"
            >
              <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="size-9" />
              </div>

              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                ĐẶT HÀNG THÀNH CÔNG!
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Hệ thống backend ERP đã tiếp nhận đơn hàng của bạn.
              </p>

              <div className="bg-neutral-50 rounded-2xl p-4 my-4 border border-neutral-100 flex flex-col gap-2 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-neutral-900 select-all">{orderSuccessData.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Tổng thanh toán:</span>
                  <span className="font-bold text-orange-600 text-[13px]">{formatVND(orderSuccessData.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Phương thức:</span>
                  <span className="font-semibold text-neutral-800">{orderSuccessData.paymentMethod}</span>
                </div>
                <div className="pt-1.5 border-t border-neutral-200/60">
                  <span className="text-[11px] text-neutral-400 block mb-0.5">Địa chỉ giao hàng:</span>
                  <span className="text-[11.5px] font-medium text-neutral-700 line-clamp-2 leading-relaxed">
                    {orderSuccessData.shippingAddress}
                  </span>
                </div>
              </div>

              {/* WebSocket Session Live Status Widget (FEATURE-WS-JWT-AUTH-30S) */}
              <div className="mb-4 p-2.5 rounded-2xl bg-neutral-900 text-white text-left flex flex-col gap-1.5 shadow-sm border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${
                      wsStatus === "connected" ? "bg-emerald-400 animate-pulse" :
                      wsStatus === "received" ? "bg-emerald-500" :
                      wsStatus === "connecting" ? "bg-amber-400 animate-pulse" :
                      wsStatus === "error" ? "bg-rose-500" : "bg-neutral-500"
                    }`} />
                    <span className="text-[11px] font-bold tracking-tight text-neutral-200">
                      WebSocket Session (Port 8667)
                    </span>
                  </div>
                  {wsStatus === "connected" && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {wsCountdown}s còn lại
                    </span>
                  )}
                  {wsStatus === "closed" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                      Đã đóng (30s)
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-neutral-300 leading-snug">
                  {wsMessage || "Đang duy trì phiên lắng nghe thanh toán trực tiếp qua JWT HS256."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setOrderSuccessData(null);
                    if (onNavigate) onNavigate("profile");
                  }}
                  className="w-full h-10 rounded-xl font-bold bg-neutral-900 hover:bg-black text-white text-xs cursor-pointer shadow-sm"
                >
                  Theo dõi đơn hàng trong Hồ sơ
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderSuccessData(null);
                    if (onNavigate) onNavigate("product");
                  }}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 py-1 cursor-pointer transition-colors"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VOUCHER SELECTION MODAL                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVoucherModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Modal Header */}
              <div className="px-4 py-2.5 sm:py-3 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Chọn Mã Giảm Giá
                  </h3>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold text-neutral-600 bg-neutral-100">
                    {AVAILABLE_VOUCHERS.length}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Voucher List with Hidden Scrollbar & Bottom Fade Indicator */}
              <div className="relative flex-1 min-h-0">
                <div className="p-4 flex flex-col gap-2.5 overflow-y-auto max-h-[340px] hide-scrollbar pb-6">
                  {AVAILABLE_VOUCHERS.map((v) => {
                    const isSelected = selectedVoucherId === v.id;
                    const isEligible = subtotal >= v.minOrder;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          if (isEligible) handleSelectVoucher(v.id);
                        }}
                        className={`h-[88px] p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          !isEligible
                            ? "opacity-50 border-neutral-200 bg-neutral-50/80 cursor-not-allowed"
                            : isSelected
                            ? "border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20 shadow-xs"
                            : "border-neutral-200 hover:border-orange-300 hover:bg-orange-50/10 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 h-full">
                          <div
                            className={`size-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? "bg-orange-500 text-white"
                                : isEligible
                                ? "bg-orange-50 text-orange-600 border border-orange-200"
                                : "bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            %
                          </div>
                          <div className="flex flex-col justify-between h-full min-w-0 flex-1 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-neutral-900 truncate">
                                {v.code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[8.5px] py-0 px-1 font-bold text-orange-700 border-orange-200 bg-orange-50/50 shrink-0"
                              >
                                {v.tag}
                              </Badge>
                            </div>
                            <span className="text-[11.5px] font-semibold text-neutral-800 truncate">
                              {v.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                              <span>{v.expiry}</span>
                              {v.minOrder > 0 && (
                                <>
                                  <span>•</span>
                                  <span>Đơn từ {v.minOrder.toLocaleString("vi-VN")}₫</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-1">
                          {isEligible ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectVoucher(v.id);
                              }}
                              className={`w-20 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer text-center ${
                                isSelected
                                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                                  : "border border-neutral-300 hover:border-orange-500 hover:text-orange-600 text-neutral-700 bg-white"
                              }`}
                            >
                              {isSelected ? "Bỏ chọn" : "Dùng ngay"}
                            </button>
                          ) : (
                            <span className="w-20 inline-block text-[10px] font-medium text-neutral-400 px-2 py-1.5 bg-neutral-100 rounded-md text-center">
                              Chưa đủ ĐK
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Bottom Fade Gradient Indicator */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent" />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-neutral-100 flex justify-end">
                <Button
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl h-9 cursor-pointer"
                >
                  XÁC NHẬN
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADDRESS SELECTION MODAL */}
      <AnimatePresence>
        {isEditingAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingAddress(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Modal Header */}
              <div className="px-4 py-2.5 sm:py-3 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-neutral-900">Địa chỉ nhận hàng</h3>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold text-neutral-600 bg-neutral-100">
                    {addressList.length}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Address Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[62vh] auto-rows-fr">
                {addressList.length > 0 ? (
                  addressList.map((addr) => {
                    const isSelected = (selectedAddressSku && selectedAddressSku === addr.sku) || userInfo.address === addr.address;
                    return (
                      <div
                        key={addr.sku}
                        onClick={() => handleSelectExistingAddress(addr)}
                        className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20 shadow-xs"
                            : "border-neutral-200 hover:border-orange-300 hover:bg-orange-50/10 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">{addr.recipientName}</span>
                            <span className="text-neutral-400 text-xs">•</span>
                            <span className="text-neutral-600 text-xs font-medium">{addr.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {addr.isDefault && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold text-orange-700 border-orange-200 bg-orange-50">
                                Mặc định
                              </Badge>
                            )}
                            {isSelected && (
                              <div className="size-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                                <Check className="size-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[11.5px] text-neutral-600 leading-relaxed mt-0.5">{addr.address}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-neutral-500 italic py-6 text-center col-span-2">Chưa có địa chỉ nào trong sổ địa chỉ.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL QUẢN LÝ & CHỌN KHOẢN VAY TÍN DỤNG (FINERACT CORE BANKING)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLoanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoanModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center">
                    <Landmark className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight">
                      Khoản vay & Hạn mức tín dụng của tôi
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Chọn hợp đồng vay đang hoạt động hoặc gói vay vừa mua để thanh toán
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto flex-1 min-h-0">
                {/* Order total indicator banner */}
                <div className="p-2.5 px-3 rounded-xl border border-sky-100 bg-sky-50/60 flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Giá trị đơn hàng cần thanh toán:</span>
                  <span className="font-black text-sky-800 text-sm">{formatVND(total)}</span>
                </div>

                {/* Loan Contracts List (Like Address / Voucher selector) */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-neutral-800">
                    Danh sách khoản vay khả dụng ({MOCK_USER_LOANS.length}):
                  </span>

                  {MOCK_USER_LOANS.map((loan) => {
                    const isSelected = selectedLoanId === loan.id;
                    const isSufficient = loan.availableAmount >= total;
                    const usagePercent = Math.round(((loan.totalLimit - loan.availableAmount) / loan.totalLimit) * 100);

                    return (
                      <div
                        key={loan.id}
                        onClick={() => setSelectedLoanId(loan.id)}
                        className={`rounded-xl border p-3 flex flex-col gap-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-sky-600 bg-sky-50/20 ring-2 ring-sky-500/20 shadow-xs"
                            : "border-neutral-200/90 hover:border-sky-300 bg-white"
                        }`}
                      >
                        {/* Header: Radio + Product Name + Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "border-sky-600 bg-sky-600" : "border-neutral-300 bg-white"
                            }`}>
                              {isSelected && <Check className="size-2.5 text-white stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-neutral-900 text-xs sm:text-[13px]">
                                  {loan.loanProductName}
                                </span>
                                <Badge className="text-[8px] sm:text-[8.5px] px-1.5 py-0 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none">
                                  {loan.statusText}
                                </Badge>
                              </div>
                              <span className="text-[10.5px] text-neutral-500 font-mono block">
                                Mã HĐ: <strong>{loan.accountNo}</strong> • Đối tác: {loan.provider}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Limit progress bar */}
                        <div className="flex flex-col gap-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-500">
                              Hạn mức khả dụng: <strong className="text-sky-700 font-extrabold">{formatVND(loan.availableAmount)}</strong>
                            </span>
                            <span className="text-neutral-400 text-[10px]">
                              Tổng hạn mức: {formatVND(loan.totalLimit)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-600 rounded-full transition-all"
                              style={{ width: `${Math.max(5, 100 - usagePercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100 text-[10.5px] text-neutral-600">
                          <div>
                            <span className="text-neutral-400 block text-[9.5px]">Lãi suất:</span>
                            <span className="font-bold text-neutral-800">{loan.interestRate}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block text-[9.5px]">Kỳ hạn:</span>
                            <span className="font-semibold text-neutral-800">{loan.termMonths} tháng</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block text-[9.5px]">Hạn mức đến:</span>
                            <span className="font-semibold text-neutral-800">{loan.expiryDate}</span>
                          </div>
                        </div>

                        {/* Insufficient Warning if applicable */}
                        {!isSufficient && (
                          <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[10px] text-amber-800">
                            <AlertCircle className="size-3 text-amber-600 shrink-0" />
                            <span>Hạn mức khả dụng còn lại thấp hơn giá trị đơn hàng này.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Helpful Note */}
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70 flex items-start gap-2 text-[10.5px] text-neutral-600">
                  <Info className="size-4 text-neutral-500 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Hệ thống tự động đồng bộ hạn mức từ các gói vay bạn vừa mua trên sàn hoặc đã kích hoạt qua Core Banking Fineract. Số tiền sẽ được trích trực tiếp khi đặt hàng thành công.
                  </p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType("loan");
                    setLoanMode("existing_loan");
                    setIsLoanModalOpen(false);
                  }}
                  className="px-6 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-98"
                >
                  Áp dụng khoản vay này
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
