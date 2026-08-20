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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getMyAddresses, AddressDto } from "@/services/addressService";
import { createOrder, CreateOrderInput, PaymentMethod } from "@/services/orderService";

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
  quantity: number;
  image: string;
  selected: boolean;
}

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
    accountNo: "9988226688",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-emerald-700",
    logoText: "VCB",
    logoUrl: "https://api.vietqr.io/img/VCB.png",
  },
  {
    id: "mb",
    name: "Ngân hàng Quân đội",
    shortName: "MB Bank",
    accountNo: "0988665544",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-blue-700",
    logoText: "MB",
    logoUrl: "https://api.vietqr.io/img/MB.png",
  },
  {
    id: "tcb",
    name: "Ngân hàng Kỹ thương Việt Nam",
    shortName: "Techcombank",
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
    accountNo: "2468101214",
    accountName: "CONG TY TNHH NONAME VIETNAM",
    iconBg: "bg-sky-600",
    logoText: "ACB",
    logoUrl: "https://api.vietqr.io/img/ACB.png",
  },
];

interface OrderPageProps {
  onNavigate?: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
  cartItems?: { id: string; name: string; price: string; icon: string }[];
  onRemoveCartItem?: (id: string | string[]) => void;
  onAddToCart?: (itemName: string, itemPrice: string) => void;
  buyNowProduct?: OrderProduct | null;
}

export default function OrderPage({ onNavigate, onRemoveCartItem, buyNowProduct }: OrderPageProps) {
  const [products, setProducts] = useState<OrderProduct[]>(() => {
    if (buyNowProduct) {
      return [{ ...buyNowProduct, selected: true }];
    }
    try {
      const cached = localStorage.getItem("horizon_buy_now_product");
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
    }
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

  // Payment Method State
  const [paymentType, setPaymentType] = useState<"vietqr" | "bank" | "card" | "cod">("vietqr");
  const [selectedBank, setSelectedBank] = useState<string>("vcb");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Financial calculations
  const shippingFee = 35000;
  const selectedProducts = products.filter((p) => p.selected);
  const totalItemsCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
  const subtotal = selectedProducts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  
  const selectedVoucher = AVAILABLE_VOUCHERS.find((v) => v.id === selectedVoucherId);
  const appliedDiscount = selectedVoucher && subtotal >= selectedVoucher.minOrder ? selectedVoucher.discountAmount : 0;
  const total = Math.max(0, subtotal > 0 ? subtotal + shippingFee - appliedDiscount : 0);
  const isAllSelected = products.length > 0 && products.every((p) => p.selected);

  // Currency Formatter - Clean Natural VND format
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
      .format(amount)
      .replace("₫", "₫");
  };

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

  const handleUpdateQuantity = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p))
    );
  };

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (onRemoveCartItem) onRemoveCartItem(id);
  };

  const handleSelectVariant = (id: string, color: string, size: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color, size } : p))
    );
    setActiveVariantDropdown(null);
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

    setIsPlacingOrder(true);
    setOrderError(null);

    // Map UI payment option sang enum backend chuẩn
    let mappedPaymentMethod: PaymentMethod = "COD";
    if (paymentType === "vietqr" || paymentType === "bank") {
      mappedPaymentMethod = "BANK_TRANSFER";
    } else if (paymentType === "card") {
      mappedPaymentMethod = "CREDIT_CARD";
    } else {
      mappedPaymentMethod = "COD";
    }

    const isDirectBuyNow = products.length === 1 && (buyNowProduct != null || localStorage.getItem("horizon_buy_now_product") != null);

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
      customerNotes: deliveryNote.trim() || undefined,
      bankCode: paymentType === "bank" ? currentBank?.shortName : undefined,
    };

    try {
      const response = await createOrder(payload);
      const orderData = response?.data;
      const orderNumber = orderData?.orderNumber || "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalTotal = orderData?.totalAmount ?? total;

      // Xóa cache mua ngay sau khi đặt thành công
      try {
        localStorage.removeItem("horizon_buy_now_product");
      } catch (_) {}

      // Lưu trữ đồng bộ vào lịch sử local storage để người dùng có thể theo dõi ngay trên trang Profile
      try {
        const storedOrders = localStorage.getItem("horizon_user_orders");
        const activeOrders = storedOrders ? JSON.parse(storedOrders) : [];
        const newOrderEntry = {
          id: orderNumber,
          name: selectedProducts.map((p) => `${p.name} (${p.color} - ${p.size}) x${p.quantity}`).join(", "),
          price: formatVND(finalTotal),
          date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
          status: "pending" as const,
          statusText: "Đang chờ xác nhận thanh toán",
          deliverySteps: [
            {
              title: "Đơn hàng đã tiếp nhận",
              desc: `Mã đơn #${orderNumber} - ${mappedPaymentMethod}`,
              time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              completed: true,
              active: true,
            },
            {
              title: "Xác nhận thanh toán",
              desc: "Hệ thống kiểm tra giao dịch thanh toán",
              time: "--:--",
              completed: false,
              active: false,
            },
            {
              title: "Đóng gói & Bàn giao vận chuyển",
              desc: "Chuyển giao cho bưu tá Express",
              time: "--:--",
              completed: false,
              active: false,
            },
            {
              title: "Giao hàng thành công",
              desc: "Khách nhận hàng và đồng kiểm",
              time: "--:--",
              completed: false,
              active: false,
            },
          ],
          shippingAddress: userInfo.address,
          carrier: "Express Delivery (Nhanh)",
          trackingNumber: `EXP-${orderNumber.substring(0, 8)}`,
        };
        localStorage.setItem("horizon_user_orders", JSON.stringify([newOrderEntry, ...activeOrders]));
      } catch (e) {
        console.warn("Sync orders localStorage error:", e);
      }

      setOrderSuccessData({
        orderNumber,
        totalAmount: finalTotal,
        shippingAddress: userInfo.address,
        paymentMethod: mappedPaymentMethod,
      });
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setOrderError(err?.message || "Đặt hàng thất bại. Vui lòng kiểm tra lại kết nối và thử lại.");
    } finally {
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

          {/* Table Header Bar with Back Button, Orange-Red Checkbox & Black Column Headers */}
          <div className="relative z-10 pb-3 border-b border-neutral-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("product")}
                className="size-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-800 hover:text-black transition-colors cursor-pointer mr-0.5"
                title="Quay lại danh mục"
              >
                <ArrowLeft className="size-4 stroke-[2]" />
              </button>

              {/* Standard Clean E-Commerce Select All Toggle with 30% Orange-Red Checkbox */}
              <div
                role="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2.5 cursor-pointer select-none group py-1"
              >
                <div
                  className={`size-4.5 rounded-md border flex items-center justify-center transition-all ${
                    isAllSelected
                      ? "bg-orange-600 border-orange-600 text-white shadow-2xs"
                      : "border-neutral-300 bg-white group-hover:border-neutral-500"
                  }`}
                >
                  {isAllSelected && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">
                  Chọn tất cả
                </span>
                <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                  ({selectedProducts.length}/{products.length})
                </span>
              </div>
            </div>

            {/* Black Bold Column Headers (70% Dominant Black) */}
            <div className="flex items-center gap-8 sm:gap-14 text-neutral-900 font-bold text-xs tracking-wider pr-2">
              <span className="w-24 text-center">SỐ LƯỢNG</span>
              <span className="w-28 text-right">THÀNH TIỀN</span>
            </div>
          </div>

          {/* Scrollable Products List Container */}
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col pt-1">
            <div 
              className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto hide-scrollbar pr-1 pb-2 pt-1"
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
                products.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleToggleProduct(item.id)}
                      className={`py-3.5 px-3.5 sm:px-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer select-none ${
                        item.selected 
                          ? "opacity-100 bg-white/95 border border-neutral-300 shadow-sm ring-1 ring-black/5 hover:border-neutral-400 hover:shadow-md" 
                          : "opacity-35 grayscale-[35%] hover:opacity-65 bg-neutral-100/35 border border-transparent"
                      }`}
                    >
                      {/* Left: Smartphone Photo & Details */}
                      <div className="flex items-center gap-3.5 sm:gap-4.5 flex-1 min-w-0">
                        {/* Smartphone Photo - Clean Portrait Proportion (Showing Full Device) */}
                        <div className={`w-18 h-22 sm:w-20 sm:h-24 rounded-xl shrink-0 p-1 sm:p-1.5 flex items-center justify-center overflow-hidden transition-all ${
                          item.selected 
                            ? "bg-white border border-neutral-200/90 shadow-2xs" 
                            : "bg-neutral-100/60 border border-neutral-200/50"
                        }`}>
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="size-full object-contain object-center hover:scale-105 transition-transform duration-200" 
                          />
                        </div>

                        {/* Info & Storage / Color Pill */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h4 className={`text-xs sm:text-[13.5px] font-semibold leading-snug line-clamp-2 transition-colors ${
                            item.selected ? "text-neutral-900 font-bold" : "text-neutral-700"
                          }`}>
                            {item.name}
                          </h4>

                          {/* Minimalist Variant Dropdown */}
                          <div className="relative inline-block self-start" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveVariantDropdown(activeVariantDropdown === item.id ? null : item.id)
                              }
                              className="text-[11.5px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors pt-0.5"
                            >
                              <span>Phiên bản: <strong className="text-neutral-800 font-semibold">{item.color}</strong>, <strong className="text-neutral-800 font-semibold">{item.size}</strong></span>
                              <ChevronDown className="size-2.5 text-neutral-400" />
                            </button>

                            {/* Popover */}
                            <AnimatePresence>
                              {activeVariantDropdown === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-neutral-200 rounded-xl shadow-xl p-3.5 w-76 flex flex-col gap-2.5 text-xs"
                                >
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Màu sắc:</span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {item.availableColors.map((c) => (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => handleSelectVariant(item.id, c, item.size)}
                                          className={`px-2.5 py-1 border text-[11px] rounded-md cursor-pointer transition-colors ${
                                            item.color === c
                                              ? "border-neutral-900 bg-neutral-900 text-white font-medium"
                                              : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                                          }`}
                                        >
                                          {c}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <Separator />

                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Dung lượng bộ nhớ:</span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {item.availableSizes.map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => handleSelectVariant(item.id, item.color, s)}
                                          className={`px-2.5 py-1 border text-[11px] rounded-md cursor-pointer transition-colors ${
                                            item.size === s
                                              ? "border-neutral-900 bg-neutral-900 text-white font-medium"
                                              : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
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
                              <span className="text-xs text-neutral-400 line-through">
                                {formatVND(item.oldPrice)}
                              </span>
                            )}
                            <span className="text-[13px] font-semibold text-neutral-800">
                              {formatVND(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stepper & Normal Sans-serif Total Price */}
                      <div className="flex items-center gap-6 sm:gap-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Stepper */}
                        <div className="w-24 flex items-center justify-center">
                          <div className="flex items-center border border-neutral-200 bg-white rounded-lg h-7.5 shadow-2xs">
                            <button
                              type="button"
                              className="size-6.5 flex items-center justify-center text-neutral-500 hover:text-neutral-950 disabled:opacity-20 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQuantity(item.id, -1);
                              }}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold text-neutral-900 select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="size-6.5 flex items-center justify-center text-neutral-500 hover:text-neutral-950 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQuantity(item.id, 1);
                              }}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Normal Sans Total Price (Black) */}
                        <div className="w-28 text-right font-bold text-xs sm:text-[14px] text-neutral-900">
                          {formatVND(lineTotal)}
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
              <span className="text-[9px] text-orange-600 font-bold bg-orange-50 border border-orange-200/60 px-1.5 py-0.5 rounded-full">
                Miễn phí thanh toán
              </span>
            </div>

            {/* Payment Category Selector Tabs with Smooth Sliding Indicator */}
            <div className="grid grid-cols-4 gap-1 bg-neutral-100/70 p-1 rounded-xl text-xs font-medium shrink-0 relative">
              {[
                { id: "vietqr", label: "VietQR", icon: QrCode },
                { id: "bank", label: "Ngân hàng", icon: Building2 },
                { id: "card", label: "Thẻ Visa", icon: CreditCard },
                { id: "cod", label: "COD", icon: Truck },
              ].map((tab) => {
                const isSelected = paymentType === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentType(tab.id as any)}
                    className={`relative py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px] select-none ${
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
                    <IconComponent className="size-3 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Bank & Payment Detail View */}
            <div className="h-[306px] overflow-hidden">
              {/* Option 1: VietQR */}
              {paymentType === "vietqr" && (
                <div className="h-full p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/70 flex flex-col justify-between text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-[11px]">Quét mã VietQR 24/7 tức thì</span>
                    <Badge variant="secondary" className="text-[9px] font-bold text-neutral-700 bg-neutral-200/80">
                      Tự động duyệt 30s
                    </Badge>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-snug">
                    Hỗ trợ tất cả ứng dụng Mobile Banking (Vietcombank, MB, Techcombank, BIDV, Agribank, ACB, MoMo, ZaloPay...)
                  </p>
                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="size-14 rounded-lg bg-white border border-neutral-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                      <QrCode className="size-10 text-neutral-900" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-[10.5px]">
                      <span className="text-neutral-400">Số tiền chuyển:</span>
                      <span className="font-bold text-neutral-900 text-xs sm:text-[13px]">{formatVND(total)}</span>
                      <span className="text-neutral-400 pt-0.5">Mã thanh toán: <strong className="text-neutral-800">NONAME-{Math.floor(Math.random() * 90000 + 10000)}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2: Chọn Nhiều Loại Ngân Hàng (4 Ngân Hàng) */}
              {paymentType === "bank" && (
                <div className="h-full flex flex-col justify-between gap-2">
                  {/* 4 Bank Cards - Compact 4:3 Ratio */}
                  <div className="grid grid-cols-4 gap-1.5 w-full shrink-0">
                    {BANK_OPTIONS.map((b) => {
                      const isSelected = selectedBank === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`h-13.5 sm:h-14.5 rounded-xl border-[1.5px] flex flex-col items-center justify-center p-1 transition-all cursor-pointer relative group ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/50 shadow-2xs"
                              : "border-neutral-200/90 hover:border-orange-300 hover:bg-orange-50/20 bg-white"
                          }`}
                          title={b.name}
                        >
                          <img
                            src={b.logoUrl}
                            alt={b.shortName}
                            className="max-h-4.5 sm:max-h-5 max-w-[78%] object-contain select-none transition-transform duration-150 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                          <span
                            className={`text-[9.5px] sm:text-[10px] font-semibold pt-0.5 truncate transition-colors ${
                              isSelected ? "text-orange-600 font-bold" : "text-neutral-600 group-hover:text-neutral-900"
                            }`}
                          >
                            {b.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bank Account Detail & QR (Borderless, Seamless Clean Layout) */}
                  <div className="h-[232px] grid grid-cols-12 overflow-hidden text-xs pt-1">
                    {/* Left Column: Bank Account Info (~60%) */}
                    <div className="col-span-7 flex flex-col justify-between pr-3 py-1 border-r border-neutral-100">
                      <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                        <span className="font-bold text-neutral-900 text-xs sm:text-[12.5px] truncate" title={currentBank.name}>
                          {currentBank.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-[11.5px] sm:text-xs text-neutral-500 font-medium shrink-0">Số tài khoản:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentBank.accountNo, "acc")}
                          className="flex items-center gap-1.5 font-bold text-neutral-900 hover:text-orange-600 transition-colors cursor-pointer text-xs sm:text-[12.5px]"
                        >
                          <span className="tracking-wide">{currentBank.accountNo}</span>
                          {copiedField === "acc" ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5 text-neutral-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-[11.5px] sm:text-xs text-neutral-500 font-medium shrink-0">Chủ tài khoản:</span>
                        <span className="font-semibold text-neutral-800 text-[11px] sm:text-[11.5px] truncate text-right ml-1">
                          {currentBank.accountName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-[11.5px] sm:text-xs text-neutral-500 font-medium shrink-0">Số tiền:</span>
                        <span className="font-bold text-neutral-900 text-xs sm:text-[12.5px]">{formatVND(total)}</span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-[11.5px] sm:text-xs text-neutral-500 font-medium shrink-0">Nội dung:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`NONAME ${userInfo.phone.replace(/[^0-9]/g, "").slice(-4)}`, "msg")}
                          className="flex items-center gap-1.5 font-bold text-neutral-900 hover:text-orange-600 transition-colors cursor-pointer text-xs sm:text-[12px]"
                        >
                          <span className="text-orange-600 font-bold">
                            NONAME {userInfo.phone.replace(/[^0-9]/g, "").slice(-4)}
                          </span>
                          {copiedField === "msg" ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5 text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Quick QR Section - Borderless, Clean Minimalist */}
                    <div className="col-span-5 flex flex-col items-center justify-center text-center gap-2 p-3 h-full">
                      <div className="size-20 rounded-2xl bg-white border border-neutral-200/90 flex items-center justify-center p-2 shadow-2xs">
                        <QrCode className="size-14 text-neutral-900" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-neutral-900">Quét QR Nhanh</span>
                        <span className="text-[9px] text-neutral-400">Tự động điền STK & số tiền</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 3: Thẻ Quốc Tế Visa / Mastercard */}
              {paymentType === "card" && (
                <div className="h-full p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/70 flex flex-col justify-between text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-[10.5px]">Thanh toán qua thẻ Quốc tế</span>
                    <div className="flex items-center gap-1 text-[9.5px] font-bold text-neutral-600">
                      <span>Visa</span> • <span>Mastercard</span> • <span>JCB</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Số thẻ (16 chữ số)"
                    className="h-7 text-xs bg-white rounded-lg border-neutral-200"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      placeholder="MM / YY"
                      className="h-7 text-xs bg-white rounded-lg border-neutral-200"
                    />
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="CVV"
                      className="h-7 text-xs bg-white rounded-lg border-neutral-200"
                    />
                  </div>
                </div>
              )}

              {/* Option 4: COD */}
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
            {/* TẦNG 3: BẢNG TỔNG THANH TOÁN (SUMMARY BREAKDOWN)                      */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Receipt className="size-4 text-neutral-800" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Tổng thanh toán
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-neutral-400">
                  {totalItemsCount} sản phẩm
                </span>
              </div>

              {/* Voucher Selector Pill Box */}
              <div className="border-y border-neutral-100 py-1.5">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 hover:bg-neutral-100 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                      <Ticket className="size-3" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-neutral-900">
                        {selectedVoucher ? selectedVoucher.code : "Chọn Voucher giảm giá"}
                      </span>
                      <span className="text-[9.5px] text-neutral-500 truncate max-w-[200px]">
                        {selectedVoucher ? selectedVoucher.title : "Có 4 mã ưu đãi khả dụng"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedVoucher ? (
                      <Badge className="bg-orange-600 hover:bg-orange-700 text-[9px] font-bold text-white px-2 py-0.5 shadow-2xs">
                        -{formatVND(appliedDiscount)}
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-bold text-orange-600">Chọn mã</span>
                    )}
                    <ChevronRight className="size-3.5 text-neutral-400" />
                  </div>
                </button>
              </div>

              {/* Normal Sans-serif Breakdown Lines */}
              <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Tiền hàng tạm tính:</span>
                  <span className="font-semibold text-neutral-900 text-xs sm:text-[12.5px]">{formatVND(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Phí giao hàng Express:</span>
                  <span className="font-semibold text-neutral-900 text-xs sm:text-[12.5px]">{formatVND(shippingFee)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-[11px] flex items-center gap-1 font-medium">
                      <Percent className="size-3" />
                      Voucher đã giảm:
                    </span>
                    <span className="font-bold text-xs sm:text-[12.5px]">- {formatVND(appliedDiscount)}</span>
                  </div>
                )}

                <Separator className="my-1 bg-neutral-100" />

                <div className="flex items-baseline justify-between pt-0.5">
                  <div>
                    <span className="text-xs sm:text-[13px] font-bold text-neutral-900">Tổng cộng:</span>
                    <p className="text-[9.5px] text-neutral-400">Đã bao gồm thuế VAT</p>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                    {formatVND(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Alert Box if any */}
            {orderError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-[11px]">Không thể tạo đơn hàng</p>
                  <p className="text-[10.5px] text-red-600 leading-tight mt-0.5">{orderError}</p>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TẦNG 4: NÚT HÀNH ĐỘNG ĐẶT HÀNG (30% ORANGE-RED PRIMARY CTA)           */}
            {/* --------------------------------------------------------------------- */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={selectedProducts.length === 0 || isPlacingOrder}
              className={`w-full rounded-full h-11 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-1 ${
                selectedProducts.length > 0 && !isPlacingOrder
                  ? "bg-gradient-to-r from-orange-600 via-orange-500 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white cursor-pointer shadow-md shadow-orange-500/20 active:scale-[0.99]"
                  : "bg-neutral-900 text-neutral-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>XÁC NHẬN ĐẶT HÀNG ({totalItemsCount} MÓN)</span>
                </>
              )}
            </button>

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
    </div>
  );
}
