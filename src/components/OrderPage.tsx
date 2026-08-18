import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  MessageSquare,
  Ticket,
  Coins,
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  Truck,
  CheckCircle2,
  CreditCard,
  Wallet,
  Building2,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  Check,
  Copy,
  Receipt,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export interface ShopeeProduct {
  id: string;
  name: string;
  shopName: string;
  shopType: "Mall" | "Yêu thích+" | "Yêu thích";
  color: string;
  availableColors: string[];
  size: string;
  availableSizes: string[];
  unitPrice: number; // in VND
  oldPrice?: number;
  quantity: number;
  image: string;
  selected: boolean;
}

const INITIAL_SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    id: "sp-1",
    name: "Áo Ba Lỗ Thể Thao Nữ Thoáng Khí Cao Cấp Slim Fit Co Giãn 4 Chiều Chạy Bộ Gym Yoga",
    shopName: "NONAME Official Store",
    shopType: "Mall",
    color: "Xanh dương",
    availableColors: ["Xanh dương", "Hồng phấn", "Nâu đất", "Đen tuyền"],
    size: "S (42-48kg)",
    availableSizes: ["XS (38-42kg)", "S (42-48kg)", "M (48-54kg)", "L (54-60kg)", "XL (60-66kg)"],
    unitPrice: 390000,
    oldPrice: 490000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "sp-2",
    name: "Quần Legging Nâng Mông Cạp Cao Định Hình Co Giãn Kháng Khuẩn Slim Pro",
    shopName: "NONAME Official Store",
    shopType: "Mall",
    color: "Đen tuyền",
    availableColors: ["Đen tuyền", "Xám khói", "Xanh rêu", "Nâu tây"],
    size: "M (48-54kg)",
    availableSizes: ["S (42-48kg)", "M (48-54kg)", "L (54-60kg)"],
    unitPrice: 450000,
    oldPrice: 580000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "sp-3",
    name: "Áo Khoác Gió Thể Thao Siêu Nhẹ Kháng Nước Chống Tia UV UPF 50+ WindBreaker",
    shopName: "NONAME Official Store",
    shopType: "Mall",
    color: "Hồng phấn",
    availableColors: ["Hồng phấn", "Trắng ngà", "Xanh pastel", "Đen tuyền"],
    size: "S (42-48kg)",
    availableSizes: ["S (42-48kg)", "M (48-54kg)", "L (54-60kg)", "XL (60-66kg)"],
    unitPrice: 520000,
    oldPrice: 690000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "sp-4",
    name: "Quần Short Thể Thao 2 Lớp Co Giãn Siêu Thoáng Khí Có Túi Đựng Điện Thoại Chống Rơi",
    shopName: "NONAME Active Studio",
    shopType: "Yêu thích+",
    color: "Nâu đất",
    availableColors: ["Nâu đất", "Đen than", "Xám xi măng", "Xanh navy"],
    size: "M (48-54kg)",
    availableSizes: ["XS (38-42kg)", "S (42-48kg)", "M (48-54kg)", "L (54-60kg)", "XL (60-66kg)"],
    unitPrice: 280000,
    oldPrice: 350000,
    quantity: 2,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "sp-5",
    name: "Bình Nước Giữ Nhiệt Thể Thao Inox 316 Chân Không 1000ml Kèm Quai Xách Silicon",
    shopName: "NONAME Active Studio",
    shopType: "Yêu thích+",
    color: "Bạc Metal",
    availableColors: ["Bạc Metal", "Đen nhám", "Xanh mint", "Tím hoàng hôn"],
    size: "1000ml",
    availableSizes: ["600ml", "800ml", "1000ml", "1200ml"],
    unitPrice: 245000,
    oldPrice: 320000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
  {
    id: "sp-6",
    name: "Tai Nghe Thể Thao Dẫn Truyền Xương Bone Conduction Bluetooth 5.4 Chống Nước IPX8",
    shopName: "NONAME TechLab Audio",
    shopType: "Mall",
    color: "Titanium Grey",
    availableColors: ["Titanium Grey", "Obsidian Black", "Ocean Blue"],
    size: "Standard Fit",
    availableSizes: ["Standard Fit"],
    unitPrice: 1250000,
    oldPrice: 1690000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80",
    selected: true,
  },
];

interface OrderPageProps {
  onNavigate?: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
  cartItems?: { id: string; name: string; price: string; icon: string }[];
  onRemoveCartItem?: (id: string | string[]) => void;
  onAddToCart?: (itemName: string, itemPrice: string) => void;
}

export default function OrderPage({ onNavigate, onRemoveCartItem }: OrderPageProps) {
  const [products, setProducts] = useState<ShopeeProduct[]>(INITIAL_SHOPEE_PRODUCTS);

  // Address State
  const [address, setAddress] = useState({
    recipient: "Nguyễn Văn An (+84) 987 654 321",
    detail: "Tầng 12, Tòa nhà Bitexco, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    isDefault: true,
  });

  // Shop Notes
  const [shopNotes, setShopNotes] = useState<{ [shopName: string]: string }>({});

  // Active Dropdown for Variant (Color/Size) editing
  const [activeVariantDropdown, setActiveVariantDropdown] = useState<string | null>(null);

  // Platform Voucher & Coins State
  const [appliedShopVoucher] = useState(30000);
  const [appliedFreeshipVoucher] = useState(25000);
  const [appliedPlatformDiscount] = useState(50000);
  const [useCoins, setUseCoins] = useState(true);
  const availableCoins = 20000; // 20,000 Xu = 20,000 VND

  // Shipping Method
  const [shippingFee] = useState(35000);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"shopeepay" | "spaylater" | "card" | "cod" | "bank">("cod");

  // Scroll fades state for products list
  const [showProductsTopFade, setShowProductsTopFade] = useState(false);
  const [showProductsBottomFade, setShowProductsBottomFade] = useState(true);
  const productsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productsContainerRef.current) {
      const el = productsContainerRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      setShowProductsTopFade(el.scrollTop > 5);
      setShowProductsBottomFade(maxScroll > 5 && el.scrollTop < maxScroll - 5);
    }
  }, [products]);

  // Format VND Currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
      .format(amount)
      .replace("₫", "₫ ");
  };

  // Calculations
  const selectedProducts = products.filter((p) => p.selected);
  const rawSubtotal = selectedProducts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  const totalItemsCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);

  const effectiveShippingFee = Math.max(0, shippingFee - appliedFreeshipVoucher);
  const totalVoucherDiscount = (rawSubtotal > 0 ? appliedShopVoucher : 0) + (rawSubtotal > 0 ? appliedPlatformDiscount : 0);
  const coinsDiscount = useCoins && rawSubtotal > 0 ? Math.min(rawSubtotal, availableCoins) : 0;

  const finalTotal = Math.max(
    0,
    rawSubtotal + effectiveShippingFee - totalVoucherDiscount - coinsDiscount
  );

  const isAllSelected = products.length > 0 && products.every((p) => p.selected);

  // Group products by shop
  const groupedProducts: { [shopName: string]: ShopeeProduct[] } = {};
  products.forEach((p) => {
    if (!groupedProducts[p.shopName]) {
      groupedProducts[p.shopName] = [];
    }
    groupedProducts[p.shopName].push(p);
  });

  // Handlers
  const handleToggleSelectAll = () => {
    const next = !isAllSelected;
    setProducts((prev) => prev.map((p) => ({ ...p, selected: next })));
  };

  const handleToggleShop = (shopName: string) => {
    const shopItems = products.filter((p) => p.shopName === shopName);
    const allShopSelected = shopItems.every((p) => p.selected);
    setProducts((prev) =>
      prev.map((p) => (p.shopName === shopName ? { ...p, selected: !allShopSelected } : p))
    );
  };

  const handleToggleProduct = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdateQuantity = (id: string, delta: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p))
    );
  };

  const handleRemoveProduct = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (onRemoveCartItem) onRemoveCartItem(id);
  };

  const handleRemoveSelected = () => {
    const selectedIds = products.filter((p) => p.selected).map((p) => p.id);
    setProducts((prev) => prev.filter((p) => !p.selected));
    if (onRemoveCartItem && selectedIds.length > 0) onRemoveCartItem(selectedIds);
  };

  const handleSelectVariant = (id: string, color: string, size: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color, size } : p))
    );
    setActiveVariantDropdown(null);
  };

  const handleProductsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    setShowProductsTopFade(scrollTop > 5);
    setShowProductsBottomFade(scrollTop < maxScroll - 5);
  };

  const handlePlaceOrder = () => {
    if (selectedProducts.length === 0) return;

    const generatedOrderNumber = `018d9ef2-${Math.random().toString(16).substring(2, 6)}-7123-88bb-${Math.random().toString(16).substring(2, 14)}`;
    
    // Save to user orders for live tracking in profile
    try {
      const storedOrders = localStorage.getItem("horizon_user_orders");
      const activeOrders = storedOrders ? JSON.parse(storedOrders) : [];
      const newOrderEntry = {
        id: generatedOrderNumber,
        name: selectedProducts.map(p => `${p.name} (${p.color} - ${p.size}) x${p.quantity}`).join(", "),
        price: formatVND(finalTotal),
        date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
        status: "pending" as const,
        statusText: "Đang chờ xác nhận",
        deliverySteps: [
          {
            title: "Đơn hàng đã tiếp nhận",
            desc: `Mã đơn #${generatedOrderNumber} - ${paymentMethod.toUpperCase()}`,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            completed: true,
            active: true
          },
          {
            title: "Người bán chuẩn bị hàng",
            desc: "Đang đóng gói và in phiếu giao",
            time: "--:--",
            completed: false,
            active: false
          },
          {
            title: "Đơn vị vận chuyển lấy hàng",
            desc: "Chuyển giao cho bưu tá Express",
            time: "--:--",
            completed: false,
            active: false
          },
          {
            title: "Giao hàng thành công",
            desc: "Khách nhận hàng và đồng kiểm",
            time: "--:--",
            completed: false,
            active: false
          }
        ],
        shippingAddress: address.detail,
        carrier: "Shopee Xpress (Nhanh)",
        trackingNumber: `SPX-${generatedOrderNumber.substring(0, 8).toUpperCase()}`
      };

      localStorage.setItem("horizon_user_orders", JSON.stringify([newOrderEntry, ...activeOrders]));
    } catch (e) {
      console.warn("Could not sync to horizon_user_orders:", e);
    }

    alert(`🎉 ĐẶT HÀNG THÀNH CÔNG!\n\nMã đơn: ${generatedOrderNumber}\nTổng giá trị thanh toán: ${formatVND(finalTotal)}\nPhương thức: ${paymentMethod.toUpperCase()}\nĐịa chỉ nhận: ${address.detail}`);

    if (onNavigate) {
      onNavigate("profile");
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#F6F6F8] text-[#222222] font-sans selection:bg-[#EE4D2D] selection:text-white overflow-x-hidden lg:overflow-hidden">
      {/* Top Simple Nav */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs shrink-0 h-14">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate("product")}
              className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Quay lại danh mục"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#EE4D2D] tracking-tight flex items-center gap-1.5">
                <ShoppingBag className="size-5 text-[#EE4D2D]" />
                NONAME
              </span>
              <div className="h-4 w-px bg-slate-300 mx-1.5" />
              <span className="text-sm font-bold text-slate-800">Thanh Toán Đơn Hàng</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Shopee Đảm Bảo | Được đồng kiểm khi nhận hàng</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Split View Area (Non-overflowing on desktop) */}
      <main className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 py-3.5 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN (7/12): Full-height Scrollable Product Groups Table           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-7 h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between text-xs text-slate-600 font-medium shrink-0">
            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleToggleSelectAll}
                id="shopee-select-all"
                className="size-4 rounded-xs data-checked:bg-[#EE4D2D] data-checked:border-[#EE4D2D]"
              />
              <label htmlFor="shopee-select-all" className="font-bold text-slate-800 cursor-pointer text-xs">
                Sản phẩm ({selectedProducts.length}/{products.length})
              </label>
            </div>

            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveSelected}
                className="text-[11px] text-slate-500 hover:text-[#EE4D2D] font-medium transition-colors cursor-pointer"
              >
                Xóa mục đã chọn ({selectedProducts.length})
              </button>
            )}
          </div>

          {/* Scrollable Products List with Fade Mask & hide-scrollbar */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div 
              ref={productsContainerRef}
              onScroll={handleProductsScroll}
              className="hide-scrollbar space-y-3.5 h-full overflow-y-auto p-3.5 transition-all duration-300"
              style={{
                maskImage: `linear-gradient(to bottom, 
                  transparent 0%, 
                  black ${showProductsTopFade ? "12%" : "0%"}, 
                  black ${showProductsBottomFade ? "88%" : "100%"}, 
                  transparent 100%)`,
                WebkitMaskImage: `linear-gradient(to bottom, 
                  transparent 0%, 
                  black ${showProductsTopFade ? "12%" : "0%"}, 
                  black ${showProductsBottomFade ? "88%" : "100%"}, 
                  transparent 100%)`
              }}
            >
              {products.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-12 text-center space-y-3">
                  <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag className="size-7" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Giỏ hàng của bạn còn trống</p>
                  <Button
                    onClick={() => onNavigate && onNavigate("product")}
                    className="bg-[#EE4D2D] hover:bg-[#D73211] text-white rounded-lg px-6 text-xs font-bold uppercase tracking-wider h-9"
                  >
                    MUA NGAY
                  </Button>
                </div>
              ) : (
                Object.entries(groupedProducts).map(([shopName, shopItems]) => {
                  const isShopAllSelected = shopItems.every((item) => item.selected);
                  const shopType = shopItems[0]?.shopType || "Mall";

                  return (
                    <div key={shopName} className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                      {/* Shop Header Bar */}
                      <div className="p-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isShopAllSelected}
                            onCheckedChange={() => handleToggleShop(shopName)}
                            className="size-4 rounded-xs data-checked:bg-[#EE4D2D] data-checked:border-[#EE4D2D]"
                          />
                          <Badge
                            className={`text-[9.5px] font-black px-1.5 py-0 rounded-xs tracking-tight ${
                              shopType === "Mall"
                                ? "bg-[#D0011B] text-white hover:bg-[#D0011B]"
                                : "bg-[#EE4D2D] text-white hover:bg-[#EE4D2D]"
                            }`}
                          >
                            {shopType}
                          </Badge>
                          <span className="font-bold text-slate-900 text-xs">{shopName}</span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-[#EE4D2D] transition-colors flex items-center gap-0.5 text-[10.5px] ml-1"
                            onClick={() => alert(`Mở khung chat với ${shopName}`)}
                          >
                            <MessageSquare className="size-3 text-[#EE4D2D]" />
                            <span>Chat</span>
                          </button>
                        </div>

                        <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">
                          Đổi ý miễn phí 15 ngày
                        </span>
                      </div>

                      {/* Products List in this Shop */}
                      <div className="divide-y divide-slate-100">
                        {shopItems.map((item) => (
                          <div key={item.id} className="p-3 flex items-start gap-3 relative group">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => handleToggleProduct(item.id)}
                              className="size-4 rounded-xs shrink-0 mt-1.5 data-checked:bg-[#EE4D2D] data-checked:border-[#EE4D2D]"
                            />

                            {/* Thumbnail */}
                            <div className="size-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                              <img src={item.image} alt={item.name} className="size-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-[#EE4D2D] cursor-pointer transition-colors leading-snug">
                                {item.name}
                              </h4>

                              {/* Variant Selector Dropdown */}
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveVariantDropdown(activeVariantDropdown === item.id ? null : item.id)
                                  }
                                  className="text-[10.5px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <span>Phân loại: <strong>{item.color}</strong>, <strong>{item.size}</strong></span>
                                  <ChevronDown className="size-3 text-slate-400" />
                                </button>

                                {/* Dropdown Popover */}
                                <AnimatePresence>
                                  {activeVariantDropdown === item.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 4 }}
                                      className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-72 space-y-2.5 text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-700 text-[11px]">Màu sắc:</span>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {item.availableColors.map((c) => (
                                            <button
                                              key={c}
                                              type="button"
                                              onClick={() => handleSelectVariant(item.id, c, item.size)}
                                              className={`px-2 py-0.5 rounded-md border text-[11px] ${
                                                item.color === c
                                                  ? "border-[#EE4D2D] text-[#EE4D2D] font-bold bg-red-50/50"
                                                  : "border-slate-200 text-slate-700 hover:border-slate-300"
                                              }`}
                                            >
                                              {c}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <span className="font-semibold text-slate-700 text-[11px]">Kích thước:</span>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {item.availableSizes.map((s) => (
                                            <button
                                              key={s}
                                              type="button"
                                              onClick={() => handleSelectVariant(item.id, item.color, s)}
                                              className={`px-2 py-0.5 rounded-md border text-[11px] ${
                                                item.size === s
                                                  ? "border-[#EE4D2D] text-[#EE4D2D] font-bold bg-red-50/50"
                                                  : "border-slate-200 text-slate-700 hover:border-slate-300"
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

                              {/* Price and Counter Row */}
                              <div className="flex items-center justify-between pt-1 gap-2">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-bold text-xs text-[#EE4D2D] font-mono">
                                    {formatVND(item.unitPrice)}
                                  </span>
                                  {item.oldPrice && (
                                    <span className="text-slate-400 line-through text-[10px]">
                                      {formatVND(item.oldPrice)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Stepper */}
                                  <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden">
                                    <button
                                      type="button"
                                      className="size-6 flex items-center justify-center hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                                      onClick={(e) => handleUpdateQuantity(item.id, -1, e)}
                                      disabled={item.quantity <= 1}
                                    >
                                      <Minus className="size-2.5" />
                                    </button>
                                    <span className="w-7 text-center text-[11px] font-bold text-slate-800 border-x border-slate-300">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      className="size-6 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                                      onClick={(e) => handleUpdateQuantity(item.id, 1, e)}
                                    >
                                      <Plus className="size-2.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveProduct(item.id, e)}
                                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shop Note & Shipping Row */}
                      <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
                          <label className="text-slate-500 whitespace-nowrap">Lời nhắn:</label>
                          <Input
                            placeholder="Lưu ý cho người bán..."
                            value={shopNotes[shopName] || ""}
                            onChange={(e) => setShopNotes({ ...shopNotes, [shopName]: e.target.value })}
                            className="bg-white h-7 text-[11px] rounded-md border-slate-200 max-w-[220px]"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 self-end sm:self-auto">
                          <Truck className="size-3 text-emerald-600" />
                          <span>Vận chuyển Nhanh: <strong>₫35.000</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (5/12): Voucher, Coins, Payment, Address & Summary           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 h-full flex flex-col space-y-3 min-h-0 overflow-y-auto hide-scrollbar pr-0.5">
          
          {/* 1. Shopee Voucher & Coins Card */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-3.5 space-y-3 shrink-0">
            {/* Voucher */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket className="size-4 text-[#EE4D2D] shrink-0" />
                <span className="font-bold text-slate-800 text-xs">Shopee Voucher</span>
                <Badge className="bg-red-50 text-[#EE4D2D] border border-[#EE4D2D] text-[10px] font-bold py-0 px-1.5 rounded-md">
                  Giảm ₫50k + Freeship
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => alert("Đã áp dụng trọn gói mã Freeship Xtra và Voucher Giảm ₫50.000!")}
                className="text-[11px] text-[#0055AA] hover:text-[#EE4D2D] font-bold cursor-pointer shrink-0"
              >
                Chọn mã ▾
              </button>
            </div>

            <Separator />

            {/* Shopee Xu */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Coins className="size-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 text-xs">Shopee Xu</span>
                  <span className="text-[10.5px] text-slate-500 ml-1.5">
                    Dùng {availableCoins.toLocaleString()} Xu [-₫{availableCoins.toLocaleString()}]
                  </span>
                </div>
              </div>
              <Switch
                checked={useCoins}
                onCheckedChange={setUseCoins}
                disabled={rawSubtotal === 0}
                className="data-checked:bg-[#EE4D2D]"
              />
            </div>
          </div>

          {/* 2. Payment Method Selector */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-3.5 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs">Phương thức thanh toán</span>
              <span className="text-[10.5px] text-slate-500 font-medium">Bảo mật 100%</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-2">
              {[
                { key: "cod", label: "COD", desc: "Tiền mặt", icon: Truck },
                { key: "shopeepay", label: "ShopeePay", desc: "Ví điện tử", icon: Wallet },
                { key: "spaylater", label: "SPayLater", desc: "Trả sau 0%", icon: Sparkles },
                { key: "card", label: "Thẻ Quốc Tế", desc: "Visa/Master", icon: CreditCard },
                { key: "bank", label: "QR VietQR", desc: "Chuyển khoản", icon: Building2 },
              ].map((m) => {
                const isSelected = paymentMethod === m.key;
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key as any)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#EE4D2D] text-[#EE4D2D] bg-red-50/50 ring-1 ring-[#EE4D2D] shadow-xs font-bold"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <IconComponent className="size-3.5" />
                    <span className="text-[11px] leading-tight font-bold">{m.label}</span>
                    <span className="text-[9.5px] text-slate-500 leading-none">{m.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#FFFAEC] p-2 rounded-lg border border-[#FFE7A8] text-[11px] text-amber-900 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-amber-600 shrink-0" />
              <span className="line-clamp-1">
                {paymentMethod === "cod" && "Thanh toán tiền mặt khi nhận hàng. Được đồng kiểm."}
                {paymentMethod === "shopeepay" && "Giảm thêm ₫10.000 khi thanh toán qua ShopeePay."}
                {paymentMethod === "spaylater" && "Mua trước trả sau 0% lãi suất trong 30 ngày."}
                {paymentMethod === "card" && "Hỗ trợ thẻ Visa, Mastercard, Napas quốc tế & nội địa."}
                {paymentMethod === "bank" && "Quét mã VietQR 24/7 xác nhận thanh toán tức thì."}
              </span>
            </div>
          </div>

          {/* 3. Delivery Address Card (Placed right above bill breakdown) */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 overflow-hidden shrink-0">
            <div
              className="h-1 w-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #6FA6D6, #6FA6D6 30px, transparent 0, transparent 38px, #F18D9B 0, #F18D9B 68px, transparent 0, transparent 76px)",
              }}
            />
            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-red-50 text-[#EE4D2D] flex items-center justify-center shrink-0 border border-red-100">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{address.recipient}</span>
                    {address.isDefault && (
                      <Badge
                        variant="outline"
                        className="border-[#EE4D2D] text-[#EE4D2D] text-[9.5px] font-bold px-1.5 py-0 rounded-xs bg-red-50/50"
                      >
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 truncate text-[11px] mt-0.5">{address.detail}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newDetail = prompt("Nhập địa chỉ giao hàng mới:", address.detail);
                  if (newDetail) setAddress({ ...address, detail: newDetail });
                }}
                className="text-xs text-[#0055AA] hover:text-[#EE4D2D] font-bold transition-colors shrink-0 cursor-pointer"
              >
                Thay Đổi
              </button>
            </div>
          </div>

          {/* 4. Order Bill Breakdown & Big Action Button */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-4 space-y-3 mt-auto shrink-0">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Receipt className="size-4 text-slate-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Chi tiết thanh toán</h4>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng tiền hàng ({totalItemsCount} món):</span>
                <span className="font-medium text-slate-900 font-mono">{formatVND(rawSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="line-through text-slate-400 text-[11px]">{formatVND(shippingFee)}</span>
                  <span className="font-medium text-slate-900">{formatVND(effectiveShippingFee)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-emerald-600">
                <span>Voucher giảm giá:</span>
                <span className="font-mono font-medium">- {formatVND(totalVoucherDiscount)}</span>
              </div>

              {coinsDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-600">
                  <span>Shopee Xu đã dùng:</span>
                  <span className="font-mono font-medium">- {formatVND(coinsDiscount)}</span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="font-bold text-slate-900 text-sm">Tổng thanh toán:</span>
                  <p className="text-[10.5px] text-emerald-600 font-medium">
                    (Tiết kiệm {(totalVoucherDiscount + coinsDiscount + appliedFreeshipVoucher).toLocaleString()}₫)
                  </p>
                </div>
                <span className="text-xl font-black text-[#EE4D2D] font-mono tracking-tight">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            <Button
              disabled={selectedProducts.length === 0}
              onClick={handlePlaceOrder}
              className="w-full bg-[#EE4D2D] hover:bg-[#D73211] text-white disabled:bg-slate-300 disabled:text-slate-500 rounded-xl h-11 text-xs font-black tracking-wider uppercase shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              ĐẶT HÀNG NGAY ({totalItemsCount})
            </Button>
          </div>

        </div>

      </main>
    </div>
  );
}

