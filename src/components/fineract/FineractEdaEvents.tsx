/**
 * Apache Fineract Kafka EDA Order-to-Ledger Event Monitor & Simulator (R5)
 * Live event streaming dashboard monitoring `order-topic` messages for automated ledger posting:
 * PROCESSING -> SALE-{orderNumber} (Dr 1111/1121, Cr 5111)
 * REFUNDED -> REFUND-{orderNumber} (Dr 5212, Cr 1111/1121)
 * DELIVERED/CANCELLED/COMPLETED -> Safe skip (non-financial)
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Radio,
  Send,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Server,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCheck,
  Sliders,
  DollarSign,
  Building2,
  CreditCard,
  Ban,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import {
  KafkaOrderEvent,
  KafkaOrderEventType,
  OrderStatus,
  PaymentMethod,
  JournalEntryTransaction
} from "@/types/fineract";
import { useFineractToast } from "./FineractToast";
import { formatVND } from "./FineractOverview";

export interface FineractEdaEventsProps {
  onEventEmitted?: () => void;
  onNavigateToLedger?: (referenceNumber: string) => void;
}

function generateRandomOrderNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${rand}`;
}

export default function FineractEdaEvents({
  onEventEmitted,
  onNavigateToLedger
}: FineractEdaEventsProps) {
  const { success, fineractError, info, warning } = useFineractToast();

  // Events Dataset
  const [events, setEvents] = useState<KafkaOrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

  // Simulator Form State
  const [orderNumber, setOrderNumber] = useState<string>(generateRandomOrderNo());
  const [totalAmount, setTotalAmount] = useState<number | string>(1250000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VNPAY");
  const [newStatus, setNewStatus] = useState<OrderStatus>("PROCESSING");
  const [eventType, setEventType] = useState<KafkaOrderEventType>("ORDER_STATUS_CHANGED");
  const [customerName, setCustomerName] = useState<string>("Nguyễn Thị Mai");
  const [isEmitting, setIsEmitting] = useState(false);

  // Copy Feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load Kafka Events
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fineractService.getKafkaEvents();
      setEvents(data);
    } catch (err) {
      console.error("[FineractEdaEvents] Error loading events:", err);
      fineractError(err, "Không thể nạp danh sách sự kiện Kafka");
    } finally {
      setIsLoading(false);
    }
  }, [fineractError]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Event Statistics
  const { totalMessages, salesCount, refundsCount, skippedCount } = useMemo(() => {
    let sales = 0;
    let refunds = 0;
    let skipped = 0;

    for (const evt of events) {
      if (evt.processed && evt.newStatus === "PROCESSING") sales++;
      else if (evt.processed && evt.newStatus === "REFUNDED") refunds++;
      else skipped++;
    }

    return {
      totalMessages: events.length,
      salesCount: sales,
      refundsCount: refunds,
      skippedCount: skipped
    };
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return events.filter(evt => {
      // 1. Search
      const matchesSearch =
        !term ||
        evt.orderNumber.toLowerCase().includes(term) ||
        (evt.eventId && evt.eventId.toLowerCase().includes(term)) ||
        (evt.customerName && evt.customerName.toLowerCase().includes(term)) ||
        (evt.journalTransactionId && evt.journalTransactionId.toLowerCase().includes(term)) ||
        (evt.note && evt.note.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // 2. Status
      if (statusFilter !== "ALL" && evt.newStatus !== statusFilter) return false;

      // 3. Payment Method
      if (paymentFilter !== "ALL" && evt.paymentMethod !== paymentFilter) return false;

      return true;
    });
  }, [events, searchTerm, statusFilter, paymentFilter]);

  // Real-time Preview of Consumer Action
  const previewAction = useMemo(() => {
    const num = typeof totalAmount === "number" ? totalAmount : parseFloat(totalAmount) || 0;
    const isCod = paymentMethod === "COD";

    if (newStatus === "PROCESSING") {
      const debitAccount = isCod ? "TK 1111 (Quỹ tiền mặt)" : "TK 1121 (Tiền gửi ngân hàng)";
      const refNo = `SALE-${orderNumber || "ORD-XXXX"}`;
      return {
        type: "FINANCIAL_SALE",
        badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        title: "Tự động ghi nhận doanh thu bán hàng (SALE)",
        ref: refNo,
        debit: debitAccount,
        credit: "TK 5111 (Doanh thu bán hàng hóa)",
        amount: num,
        desc: `Khi nhận được trạng thái PROCESSING, Consumer sẽ tự động hạch toán Nợ ${debitAccount} / Có TK 5111 với số tiền ${formatVND(num)} và tạo chứng từ ${refNo}.`
      };
    }

    if (newStatus === "REFUNDED") {
      const creditAccount = isCod ? "TK 1111 (Quỹ tiền mặt)" : "TK 1121 (Tiền gửi ngân hàng)";
      const refNo = `REFUND-${orderNumber || "ORD-XXXX"}`;
      return {
        type: "FINANCIAL_REFUND",
        badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        title: "Tự động hoàn tiền & giảm trừ doanh thu (REFUND)",
        ref: refNo,
        debit: "TK 5212 (Hàng bán bị trả lại - Chi phí)",
        credit: creditAccount,
        amount: num,
        desc: `Khi nhận được trạng thái REFUNDED, Consumer sẽ tự động hạch toán đảo Nợ TK 5212 / Có ${creditAccount} với số tiền ${formatVND(num)} và tạo chứng từ ${refNo}.`
      };
    }

    return {
      type: "NON_FINANCIAL",
      badgeColor: "text-slate-400 bg-slate-800 border-slate-700",
      title: "Bỏ qua hạch toán (Phi tài chính)",
      ref: "Không phát sinh",
      debit: "—",
      credit: "—",
      amount: 0,
      desc: `Trạng thái ${newStatus} không làm phát sinh dòng tiền hay doanh thu mới. Consumer sẽ xác nhận offset (ACK) mà không ghi nhận bút toán sổ cái.`
    };
  }, [newStatus, totalAmount, paymentMethod, orderNumber]);

  // Handle Emit Kafka Event
  const handleEmitEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const numericAmount = typeof totalAmount === "number" ? totalAmount : parseFloat(totalAmount) || 0;
    if (numericAmount <= 0) {
      warning("Giá trị đơn hàng mô phỏng phải lớn hơn 0 VND.");
      return;
    }

    setIsEmitting(true);
    try {
      const eventPayload: KafkaOrderEvent = {
        eventType,
        orderNumber: orderNumber.trim() || generateRandomOrderNo(),
        orderId: orderNumber.trim(),
        newStatus,
        previousStatus: newStatus === "PROCESSING" ? "PENDING" : newStatus === "REFUNDED" ? "PROCESSING" : "PENDING",
        totalAmount: numericAmount,
        paymentMethod,
        customerName: customerName.trim() || "Khách Hàng Mua Sắm",
        timestamp: new Date().toISOString()
      };

      const result = await fineractService.simulateKafkaOrderEvent(eventPayload);

      // Prepend to local state
      setEvents(prev => [result.event, ...prev]);

      if (result.journalEntry) {
        success(
          `Đã phát sự kiện Kafka thành công! Consumer đã tự động tạo bút toán Sổ Cái ${result.journalEntry.referenceNumber || result.journalEntry.transactionId} với số tiền ${formatVND(numericAmount)}.`,
          "Hạch Toán Tự Động Thành Công"
        );
      } else {
        info(
          `Đã phát sự kiện Kafka trạng thái ${newStatus}. Consumer đã xác nhận và bỏ qua ghi sổ (Phi tài chính).`,
          "Sự Kiện Kafka Đã Ghi Nhận"
        );
      }

      // Refresh parent dashboard balances
      if (onEventEmitted) {
        onEventEmitted();
      }

      // Generate next random order number
      setOrderNumber(generateRandomOrderNo());
    } catch (err) {
      console.error("[FineractEdaEvents] Error emitting Kafka event:", err);
      fineractError(err, "Không thể phát sự kiện Kafka");
    } finally {
      setIsEmitting(false);
    }
  };

  // Quick Preset Dispatchers
  const handleQuickDispatch = (
    method: PaymentMethod,
    status: OrderStatus,
    amount: number,
    name: string
  ) => {
    const rndOrder = generateRandomOrderNo();
    setOrderNumber(rndOrder);
    setPaymentMethod(method);
    setNewStatus(status);
    setTotalAmount(amount);
    setCustomerName(name);

    setTimeout(() => {
      // Auto emit
      handleEmitEvent();
    }, 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Kafka Stream Monitor Header & Topology */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4D24]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D24] to-[#c7320f] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#15181F] rounded-[14px] flex items-center justify-center text-[#FF4D24]">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Giám Sát Sự Kiện Kafka EDA (Order-to-Ledger Event Monitor)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                  R5 Event-Driven Architecture
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE / CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lắng nghe thời gian thực luồng tin nhắn <code className="text-[#FF4D24] font-bold">order-topic</code>,
                tự động giải mã sự kiện bán hàng và hoàn trả sang các bút toán sổ cái kép Apache Fineract.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadEvents}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Làm mới luồng sự kiện"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#FF4D24]" : ""}`} />
              <span>Làm Mới Luồng</span>
            </button>
          </div>
        </div>

        {/* Top Deck Stream Topology & Throughput KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* KPI 1: Topic & Group Info */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">KAFKA TOPIC & CONSUMER</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">order-topic</span>
              <span className="text-[10px] text-sky-400 font-mono mt-0.5 block">fineract-order-group</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Total Processed Messages */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">TỔNG SỰ KIỆN TIÊU THỤ</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{totalMessages}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Throughput: Real-Time Stream</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: Sales Vouchers Auto-Posted */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">BÚT TOÁN BÁN HÀNG (SALE)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{salesCount}</span>
              <span className="text-[10px] text-emerald-500/70 font-mono mt-0.5 block">PROCESSING &rarr; SALE-*</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Refund Vouchers Auto-Posted */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">BÚT TOÁN HOÀN TRẢ (REFUND)</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">{refundsCount}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Bỏ qua {skippedCount} phi tài chính
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Event Simulator Card */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF4D24]" />
              Bộ Mô Phỏng Sự Kiện Đơn Hàng (Kafka Event Simulator)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Phát trực tiếp bản tin sự kiện <code className="text-slate-300 font-mono">ORDER_STATUS_CHANGED</code> vào
              hệ thống để kiểm thử phản ứng tự động hạch toán sổ cái thời gian thực.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Bắn mẫu nhanh:</span>
            <button
              type="button"
              onClick={() => handleQuickDispatch("COD", "PROCESSING", 450000, "Vũ Hoàng Long")}
              disabled={isEmitting}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              Sale COD (450k)
            </button>

            <button
              type="button"
              onClick={() => handleQuickDispatch("VNPAY", "PROCESSING", 1850000, "Lê Minh Tuấn")}
              disabled={isEmitting}
              className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              Sale VNPAY (1.85M)
            </button>

            <button
              type="button"
              onClick={() => handleQuickDispatch("BANK_TRANSFER", "REFUNDED", 800000, "Đỗ Hải Yến")}
              disabled={isEmitting}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              Refund Bank (800k)
            </button>

            <button
              type="button"
              onClick={() => handleQuickDispatch("COD", "CANCELLED", 600000, "Trần Văn Toàn")}
              disabled={isEmitting}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              Skip Cancelled
            </button>
          </div>
        </div>

        {/* Simulator Form */}
        <form onSubmit={handleEmitEvent} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Field 1: Order Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-400 font-medium">Mã Đơn Hàng (orderNumber)</label>
                <button
                  type="button"
                  onClick={() => setOrderNumber(generateRandomOrderNo())}
                  className="text-[10px] text-[#FF4D24] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Ngẫu nhiên
                </button>
              </div>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="ORD-YYYYMMDD-XXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
            </div>

            {/* Field 2: Total Amount */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Tổng Tiền Đơn Hàng (VND)</label>
              <input
                type="number"
                min="1000"
                step="10000"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-xs focus:outline-none focus:border-[#FF4D24] transition-colors"
                required
              />
              {/* Quick Amount Presets */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[500000, 1250000, 2500000, 5000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTotalAmount(amt)}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                  >
                    {(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)}M
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Payment Method */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Hình Thức Thanh Toán</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF4D24] cursor-pointer"
              >
                <option value="COD">COD - Tiền mặt khi nhận hàng (TK 1111)</option>
                <option value="BANK_TRANSFER">BANK_TRANSFER - Chuyển khoản (TK 1121)</option>
                <option value="VNPAY">VNPAY - Cổng thanh toán VNPAY QR (TK 1121)</option>
                <option value="MOMO">MOMO - Ví điện tử MoMo (TK 1121)</option>
                <option value="CREDIT_CARD">CREDIT_CARD - Thẻ tín dụng/ghi nợ (TK 1121)</option>
              </select>
            </div>

            {/* Field 4: Target Status */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Trạng Thái Mục Tiêu (newStatus)</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF4D24] cursor-pointer font-bold"
              >
                <option value="PROCESSING">PROCESSING - Đang xử lý & Đã thanh toán (Hạch toán SALE)</option>
                <option value="REFUNDED">REFUNDED - Khách hoàn trả đơn (Hạch toán REFUND)</option>
                <option value="DELIVERED">DELIVERED - Đã giao hàng thành công (Bỏ qua hạch toán)</option>
                <option value="CANCELLED">CANCELLED - Hủy đơn chưa thanh toán (Bỏ qua hạch toán)</option>
                <option value="COMPLETED">COMPLETED - Hoàn tất vòng đời (Bỏ qua hạch toán)</option>
              </select>
            </div>
          </div>

          {/* Real-Time Preview Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              previewAction.type === "FINANCIAL_SALE"
                ? "bg-emerald-950/30 border-emerald-800/60"
                : previewAction.type === "FINANCIAL_REFUND"
                ? "bg-rose-950/30 border-rose-800/60"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${previewAction.badgeColor}`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-xs">{previewAction.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-amber-300">
                      Chứng từ dự kiến: {previewAction.ref}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{previewAction.desc}</p>
                  {previewAction.type !== "NON_FINANCIAL" && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">Nợ (Dr): {previewAction.debit}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-rose-400 font-bold">Có (Cr): {previewAction.credit}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-white font-bold">Số tiền: {formatVND(previewAction.amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isEmitting}
                className="px-5 py-2.5 rounded-xl bg-[#FF4D24] hover:bg-[#FF4D24]/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D24]/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isEmitting ? "animate-spin" : ""}`} />
                <span>{isEmitting ? "Đang Phát Sự Kiện..." : "Phát Sự Kiện (Emit Kafka Event)"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Live Event Stream Table */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Toolbar: Search, Filter, Counts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn hàng (ORD-), mã sự kiện, khách hàng, mã bút toán..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer font-medium"
              >
                <option value="ALL">Tất cả trạng thái ({events.length})</option>
                <option value="PROCESSING">PROCESSING ({salesCount})</option>
                <option value="REFUNDED">REFUNDED ({refundsCount})</option>
                <option value="CANCELLED">CANCELLED / Bỏ qua</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D24] cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả hình thức TT</option>
              <option value="COD">COD (Tiền mặt)</option>
              <option value="BANK_TRANSFER">Chuyển khoản NH</option>
              <option value="VNPAY">VNPAY QR</option>
              <option value="MOMO">Ví MoMo</option>
              <option value="CREDIT_CARD">Thẻ Quốc Tế</option>
            </select>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-sans">
              <tr>
                <th className="px-4 py-3">Mã Sự Kiện & Thời Gian</th>
                <th className="px-4 py-3">Mã Đơn Hàng</th>
                <th className="px-4 py-3">Trạng Thái Đơn</th>
                <th className="px-4 py-3">Thanh Toán</th>
                <th className="px-4 py-3 text-right">Giá Trị Đơn</th>
                <th className="px-4 py-3">Kết Quả Hạch Toán Sổ Cái</th>
                <th className="px-4 py-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans italic">
                    Chưa có sự kiện đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => {
                  const isSale = evt.processed && evt.newStatus === "PROCESSING";
                  const isRefund = evt.processed && evt.newStatus === "REFUNDED";

                  return (
                    <tr key={evt.eventId || idx} className="hover:bg-slate-900/40 transition-colors">
                      {/* Event ID & Timestamp */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{evt.eventId || `EVT-${idx + 1}`}</span>
                          <button
                            onClick={() => handleCopy(evt.eventId || "")}
                            className="text-slate-600 hover:text-white transition-colors cursor-pointer"
                            title="Sao chép ID sự kiện"
                          >
                            {copiedText === evt.eventId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleString("vi-VN") : "Thời gian thực"}
                        </span>
                      </td>

                      {/* Order Number */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sky-400">{evt.orderNumber}</span>
                          <button
                            onClick={() => handleCopy(evt.orderNumber)}
                            className="text-slate-600 hover:text-white transition-colors cursor-pointer"
                            title="Sao chép mã đơn hàng"
                          >
                            {copiedText === evt.orderNumber ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                          {evt.customerName || "Khách Hàng"}
                        </span>
                      </td>

                      {/* New Status */}
                      <td className="px-4 py-3 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.newStatus === "PROCESSING"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : evt.newStatus === "REFUNDED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : evt.newStatus === "DELIVERED"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : evt.newStatus === "CANCELLED"
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {evt.newStatus === "PROCESSING" && <CheckCheck className="w-3 h-3" />}
                          {evt.newStatus === "REFUNDED" && <RotateCcw className="w-3 h-3" />}
                          {evt.newStatus}
                        </span>
                        {evt.previousStatus && (
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            từ {evt.previousStatus}
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3">
                        <span className="text-amber-300 font-bold">{evt.paymentMethod}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {evt.paymentMethod === "COD" ? "Quỹ TK 1111" : "Ngân hàng TK 1121"}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-white">{formatVND(evt.totalAmount)}</span>
                      </td>

                      {/* Action Result / Voucher reference */}
                      <td className="px-4 py-3 font-sans">
                        {isSale && (
                          <div>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Đã hạch toán SALE
                            </span>
                            <span className="font-mono text-[11px] text-sky-300 font-bold block mt-0.5">
                              Mã chứng từ: SALE-{evt.orderNumber}
                            </span>
                          </div>
                        )}

                        {isRefund && (
                          <div>
                            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                              Đã hạch toán REFUND
                            </span>
                            <span className="font-mono text-[11px] text-rose-300 font-bold block mt-0.5">
                              Mã chứng từ: REFUND-{evt.orderNumber}
                            </span>
                          </div>
                        )}

                        {!evt.processed && (
                          <div>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-slate-500" />
                              Bỏ qua (Phi tài chính)
                            </span>
                            <span className="text-[10px] text-slate-500 italic block mt-0.5">
                              Không tạo bút toán sổ cái
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions: View in Ledger Tab */}
                      <td className="px-4 py-3 text-center font-sans">
                        {evt.processed && (
                          <button
                            onClick={() => {
                              const ref =
                                evt.newStatus === "PROCESSING"
                                  ? `SALE-${evt.orderNumber}`
                                  : `REFUND-${evt.orderNumber}`;
                              if (onNavigateToLedger) {
                                onNavigateToLedger(ref);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#FF4D24]/20 text-slate-300 hover:text-[#FF4D24] border border-slate-800 hover:border-[#FF4D24]/40 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Chuyển sang Sổ Cái để xem chi tiết chứng từ này"
                          >
                            <span>Xem Bút Toán</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
