/**
 * R1: Apache Fineract Overview & System Metrics Component
 * Displays Top Deck KPI cards, Gateway & Kafka EDA Health Status cards,
 * and quick-action diagnostic triggers.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote,
  Landmark,
  Users,
  CreditCard,
  Activity,
  Server,
  Radio,
  RefreshCw,
  Bug,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { FineractHealthStatus, SubsystemHealth } from "@/types/fineract";
import { useFineractToast } from "./FineractToast";
import { SAMPLE_FINERACT_ERRORS } from "./FineractErrorInspector";

export interface FineractOverviewProps {
  onNavigateTab: (tab: "overview" | "clients" | "loans" | "ledger" | "eda-events") => void;
  onOpenErrorInspector: (err?: any) => void;
  healthData?: FineractHealthStatus | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function FineractOverview({
  onNavigateTab,
  onOpenErrorInspector,
  healthData: propHealth,
  isLoading: propLoading,
  onRefresh: propRefresh
}: FineractOverviewProps) {
  const { success, error, warning, fineractError } = useFineractToast();
  const [internalHealth, setInternalHealth] = useState<FineractHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);

  const activeHealth = propHealth !== undefined ? propHealth : internalHealth;
  const isRefreshing = propLoading !== undefined ? propLoading : loading;

  const fetchHealth = useCallback(async () => {
    if (propRefresh) {
      propRefresh();
      return;
    }
    setLoading(true);
    try {
      const data = await fineractService.getSystemHealth();
      setInternalHealth(data);
    } catch (err) {
      fineractError(err, "Không thể tải số liệu Fineract Overview");
    } finally {
      setLoading(false);
    }
  }, [propRefresh, fineractError]);

  useEffect(() => {
    if (propHealth === undefined) {
      fetchHealth();
    }
  }, [propHealth, fetchHealth]);

  const handleManualProbe = async () => {
    setProbing(true);
    try {
      const data = await fineractService.getSystemHealth();
      if (propRefresh) {
        propRefresh();
      } else {
        setInternalHealth(data);
      }
      success(
        `Kiểm tra kết nối hoàn tất: Core (${data.fineractCore.latencyMs}ms), Gateway (${data.springBootGateway.latencyMs}ms), Kafka (${data.kafkaEdaConsumer.latencyMs}ms)`,
        "Thăm dò Gateway & Kafka thành công"
      );
    } catch (err) {
      fineractError(err, "Thăm dò hệ thống thất bại");
    } finally {
      setProbing(false);
    }
  };

  const handleSimulateDiagnostics = () => {
    const sample = SAMPLE_FINERACT_ERRORS.futureApproval.payload;
    fineractError(sample, "Phát hiện lỗi nghiệp vụ Core Banking", () => {
      onOpenErrorInspector(sample);
    });
    onOpenErrorInspector(sample);
  };

  const renderHealthPill = (subsystem: SubsystemHealth | undefined) => {
    if (!subsystem) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
          CHECKING...
        </span>
      );
    }

    if (subsystem.status === "UP") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          UP ({subsystem.latencyMs}ms)
        </span>
      );
    }

    if (subsystem.status === "DEGRADED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          DEGRADED
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3 h-3 text-rose-400" />
        DOWN
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Deck: 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding Principal */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF4D24]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF4D24]/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng Dư Nợ Gốc (Principal)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {formatVND(activeHealth?.totalOutstandingPrincipal ?? 24150000)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Đang lưu hành:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {activeHealth?.totalActiveLoans ?? 1} hồ sơ Active
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("loans")}
            className="mt-4 w-full pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-[#FF4D24] transition-colors cursor-pointer"
          >
            <span>Quản trị danh mục vay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Cash Ledger Balance (TK 1111) */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tiền Mặt Tại Quỹ
              </span>
              <span className="block font-mono text-[10px] text-emerald-400/80">TK 1111 (Cash GL)</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatVND(activeHealth?.cashBalance ?? 20000000)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Định khoản:</span>
              <span className="font-mono text-[11px] text-slate-300">Tài sản (ASSET)</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("ledger")}
            className="mt-4 w-full pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <span>Đối chiếu sổ cái</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Bank Ledger Balance (TK 1121) */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tiền Gửi Ngân Hàng
              </span>
              <span className="block font-mono text-[10px] text-sky-400/80">TK 1121 (Bank GL)</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold font-mono text-sky-400 tracking-tight">
              {formatVND(activeHealth?.bankBalance ?? 150000000)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Phương thức:</span>
              <span className="font-mono text-[11px] text-slate-300">VNPAY / BankTransfer</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("ledger")}
            className="mt-4 w-full pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
          >
            <span>Xem luồng giao dịch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Active Fineract Clients Count */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Khách Hàng Fineract
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {activeHealth?.totalClients ?? 6} khách hàng
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Trụ sở chính (Office 1):</span>
              <span className="font-mono text-[11px] text-amber-400 font-bold">100% Đồng bộ</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("clients")}
            className="mt-4 w-full pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <span>Mở danh bạ khách hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle Deck: Subsystem Health Monitoring (Core, Gateway, Kafka EDA) */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Trạng Thái Hạ Tầng & Kết Nối Subsystems
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Giám sát độ trễ, endpoint proxy và kết nối thời gian thực giữa Next/Vite, Spring Boot ERP và Fineract Core
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualProbe}
              disabled={probing || isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FF4D24] ${probing || isRefreshing ? "animate-spin" : ""}`} />
              Thăm Dò Kết Nối (Probe Health)
            </button>

            <button
              onClick={handleSimulateDiagnostics}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium text-xs flex items-center gap-2 border border-rose-500/30 transition-all cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              Mô Phỏng Chẩn Đoán Lỗi
            </button>
          </div>
        </div>

        {/* 3 Subsystem Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subsystem 1: Apache Fineract Core API */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Apache Fineract Core API</h4>
                  <span className="font-mono text-[10px] text-slate-400">Core Banking Engine</span>
                </div>
              </div>
              {renderHealthPill(activeHealth?.fineractCore)}
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Endpoint:</span>
                <span className="text-slate-300 truncate max-w-[170px]" title={activeHealth?.fineractCore.endpoint}>
                  {activeHealth?.fineractCore.endpoint || "https://localhost:8443"}
                </span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Trạng thái:</span>
                <span className="text-emerald-400 font-sans text-xs">
                  {activeHealth?.fineractCore.message || "Sẵn sàng xử lý"}
                </span>
              </div>
            </div>
          </div>

          {/* Subsystem 2: Spring Boot ERP Gateway */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Spring Boot ERP Gateway</h4>
                  <span className="font-mono text-[10px] text-slate-400">REST Reverse Proxy / API</span>
                </div>
              </div>
              {renderHealthPill(activeHealth?.springBootGateway)}
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Gateway URL:</span>
                <span className="text-slate-300 truncate max-w-[170px]" title={activeHealth?.springBootGateway.endpoint}>
                  {activeHealth?.springBootGateway.endpoint || "http://localhost:8080/api/v1/erp"}
                </span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Chế độ:</span>
                <span className="text-sky-400 font-sans text-xs">
                  {activeHealth?.mode === "live" ? "Live Proxy (/api/proxy)" : "Mock Fallback Store"}
                </span>
              </div>
            </div>
          </div>

          {/* Subsystem 3: Kafka EDA Order Consumer */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kafka Event-Driven (EDA)</h4>
                  <span className="font-mono text-[10px] text-slate-400">Order-to-Ledger Topic</span>
                </div>
              </div>
              {renderHealthPill(activeHealth?.kafkaEdaConsumer)}
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Topic Name:</span>
                <span className="text-slate-300 font-bold">order-topic</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Consumer Group:</span>
                <span className="text-emerald-400">fineract-order-group</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Deck: Quick Navigation & Subsystem Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module R2 & R3 Quick Card */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF4D24]" />
              R2 Khách Hàng & R3 Hồ Sơ Khoản Vay
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              M3 & M4 Readiness
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hỗ trợ phân quyền Admin vs Khách hàng theo `externalId`, quản lý hạn mức sản phẩm tín dụng ERP-LN01/LN02,
            vận hành máy trạng thái hữu hạn FSM từ Chờ duyệt (100) đến Tất toán (600).
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigateTab("clients")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Danh bạ khách hàng &rarr;
            </button>
            <button
              onClick={() => onNavigateTab("loans")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Quản lý khoản vay &rarr;
            </button>
          </div>
        </div>

        {/* Module R4 & R5 Quick Card */}
        <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              R4 Sổ Cái Kế Toán & R5 Kafka EDA
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              M5 Readiness
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bảo vệ nguyên tắc cân bằng kép &Sigma; Debit = &Sigma; Credit với ma trận ánh xạ tài khoản COD/Bank sang
            TK 1111, 1121, 5111, 5212 và tự động hạch toán bút toán `SALE-` / `REFUND-` qua Kafka stream.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigateTab("ledger")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Sổ cái kép (GL) &rarr;
            </button>
            <button
              onClick={() => onNavigateTab("eda-events")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Bộ phát Kafka EDA &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
