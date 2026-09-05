/**
 * Apache Fineract Core Banking & Financial Ledger Dashboard
 * Main Shell Container hosting Overview, Clients, Loans, Ledger, Kafka EDA Subsystems,
 * Live/Mock Mode Switch, Quick Actions, Toast System & Error Inspector.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  Radio,
  RefreshCw,
  RotateCcw,
  Bug,
  ShieldCheck,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRightLeft
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import {
  FineractHealthStatus,
  FineractClient,
  LoanAccount,
  LoanProduct,
  JournalEntry,
  KafkaOrderEvent
} from "@/types/fineract";
import FineractOverview, { formatVND } from "./FineractOverview";
import FineractClients from "./FineractClients";
import FineractLoans from "./FineractLoans";
import FineractLedger from "./FineractLedger";
import FineractEdaEvents from "./FineractEdaEvents";
import { FineractToastProvider, useFineractToast } from "./FineractToast";
import FineractErrorInspector, { SAMPLE_FINERACT_ERRORS } from "./FineractErrorInspector";

export type FineractSubTab = "overview" | "clients" | "loans" | "ledger" | "eda-events";

function FineractDashboardInner() {
  const { success, error: toastError, info, fineractError } = useFineractToast();

  const [activeSubTab, setActiveSubTab] = useState<FineractSubTab>("overview");
  const [targetLedgerFilter, setTargetLedgerFilter] = useState<string>("");
  const [mode, setMode] = useState<"live" | "mock">(() => fineractService.getMode());
  const [healthData, setHealthData] = useState<FineractHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigateToLedger = (ref: string) => {
    setTargetLedgerFilter(ref);
    setActiveSubTab("ledger");
  };

  // Error Inspector Drawer State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectedError, setInspectedError] = useState<any>(null);

  // Subsystem preview data for M3-M5 readiness views
  const [previewClients, setPreviewClients] = useState<FineractClient[]>([]);
  const [previewLoans, setPreviewLoans] = useState<LoanAccount[]>([]);
  const [previewProducts, setPreviewProducts] = useState<LoanProduct[]>([]);
  const [previewLedger, setPreviewLedger] = useState<JournalEntry[]>([]);
  const [previewEvents, setPreviewEvents] = useState<KafkaOrderEvent[]>([]);

  // Load all system state
  const loadSystemState = useCallback(async () => {
    setIsLoading(true);
    try {
      const [health, clients, loans, products, entries, events] = await Promise.all([
        fineractService.getSystemHealth(),
        fineractService.getClients("admin").catch(() => []),
        fineractService.getLoans().catch(() => []),
        fineractService.getLoanProducts().catch(() => []),
        fineractService.getJournalEntries().catch(() => []),
        fineractService.getKafkaEvents().catch(() => [])
      ]);

      setHealthData(health);
      setPreviewClients(clients);
      setPreviewLoans(loans);
      setPreviewProducts(products);
      setPreviewLedger(entries);
      setPreviewEvents(events);
    } catch (err) {
      console.error("[FineractDashboard] Error loading system state:", err);
      fineractError(err, "Không thể nạp trạng thái Fineract");
    } finally {
      setIsLoading(false);
    }
  }, [fineractError]);

  useEffect(() => {
    loadSystemState();
  }, [loadSystemState]);

  // Handle Mode Toggle (Live Gateway vs High-Fidelity Mock Fallback)
  const handleToggleMode = (newMode: "live" | "mock") => {
    fineractService.setMode(newMode);
    setMode(newMode);
    if (newMode === "live") {
      info(
        "Đã chuyển sang Live Proxy: Các lệnh gọi API sẽ gửi tới Spring Boot Gateway (http://localhost:8080/api/v1/erp) và Fineract Core.",
        "Chế Độ Live Gateway API"
      );
    } else {
      success(
        "Đã kích hoạt Sandbox Giả lập: Toàn bộ thao tác chạy trên mock store có độ trung thực cao và lưu trữ LocalStorage.",
        "Chế Độ High-Fidelity Mock Sandbox"
      );
    }
    loadSystemState();
  };

  // Handle Reset Mock Store
  const handleResetMockStore = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại kho dữ liệu Mock về trạng thái ban đầu? Toàn bộ khách hàng, khoản vay và bút toán tạo mới sẽ được khôi phục về hạt giống gốc.")) {
      fineractService.resetMockStore();
      success(
        "Đã khôi phục hoàn toàn hạt giống dữ liệu (Seed Data): 6 Khách hàng, 2 Gói vay, 6 Khoản vay và 4 Bút toán cân đối.",
        "Đặt lại Mock Store thành công"
      );
      loadSystemState();
    }
  };

  const handleOpenInspector = (err?: any) => {
    setInspectedError(err || SAMPLE_FINERACT_ERRORS.futureApproval.payload);
    setInspectorOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Bar: Title, Mode Switch, Quick Actions */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF4D24]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Branding & Subsystem Identity */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D24] to-[#c7320f] p-0.5 shadow-lg shadow-[#FF4D24]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#15181F] rounded-[14px] flex items-center justify-center text-[#FF4D24]">
                <Landmark className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Apache Fineract Core Banking & Financial Ledger
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                  v1.9 Core
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  IFRS / VAS Ledger
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Hệ thống ngân hàng lõi & sổ cái kế toán kép tích hợp: Quản trị hạn mức tín dụng khách hàng,
                vòng đời hồ sơ vay FSM, nguyên tắc cân bằng &Sigma; Debit = &Sigma; Credit và Kafka EDA Order-to-Ledger.
              </p>
            </div>
          </div>

          {/* Right: Mode Toggle Switch & Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Gateway vs High-Fidelity Mock Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
              <button
                onClick={() => handleToggleMode("mock")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mode === "mock"
                    ? "bg-[#FF4D24] text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mock Sandbox
              </button>
              <button
                onClick={() => handleToggleMode("live")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mode === "live"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Live Gateway API
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadSystemState();
                success("Đã đồng bộ lại toàn bộ số liệu và trạng thái kết nối.", "Làm mới dữ liệu");
              }}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới toàn bộ số liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#FF4D24]" : ""}`} />
            </button>

            {/* Reset Mock Store Button */}
            <button
              onClick={handleResetMockStore}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Khôi Phục Mẫu</span>
            </button>

            {/* Error Inspector Button */}
            <button
              onClick={() => handleOpenInspector()}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Mở bảng chẩn đoán lỗi Fineract"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>Bảng Chẩn Đoán Lỗi</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "overview"
                ? "bg-[#FF4D24] text-white shadow-lg shadow-[#FF4D24]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>R1: Tổng Quan & Số Liệu KPI</span>
          </button>

          <button
            onClick={() => setActiveSubTab("clients")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "clients"
                ? "bg-[#FF4D24] text-white shadow-lg shadow-[#FF4D24]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>R2: Quản Lý Khách Hàng</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
              {previewClients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("loans")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "loans"
                ? "bg-[#FF4D24] text-white shadow-lg shadow-[#FF4D24]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>R3: Gói Tín Dụng & Hồ Sơ Vay</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
              {previewLoans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("ledger")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "ledger"
                ? "bg-[#FF4D24] text-white shadow-lg shadow-[#FF4D24]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>R4: Sổ Cái Kế Toán Kép</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
              {previewLedger.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("eda-events")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "eda-events"
                ? "bg-[#FF4D24] text-white shadow-lg shadow-[#FF4D24]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>R5: Giám Sát Sự Kiện Kafka EDA</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
              {previewEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tab Content Area */}
      <div>
        {activeSubTab === "overview" && (
          <FineractOverview
            onNavigateTab={setActiveSubTab}
            onOpenErrorInspector={handleOpenInspector}
            healthData={healthData}
            isLoading={isLoading}
            onRefresh={loadSystemState}
          />
        )}

        {/* Sub-tab R2: Clients Management Subsystem */}
        {activeSubTab === "clients" && (
          <FineractClients
            onClientCreated={loadSystemState}
            onClientUpdated={loadSystemState}
          />
        )}

        {/* Sub-tab R3: Loan Products & Loan Lifecycle State Machine */}
        {activeSubTab === "loans" && (
          <FineractLoans
            onLoanCreated={loadSystemState}
            onLoanUpdated={loadSystemState}
          />
        )}

        {/* Sub-tab R4: Double-Entry General Ledger Subsystem */}
        {activeSubTab === "ledger" && (
          <FineractLedger
            onEntryCreated={loadSystemState}
            targetFilterReference={targetLedgerFilter}
            onNavigateToEda={() => setActiveSubTab("eda-events")}
          />
        )}

        {/* Sub-tab R5: Kafka EDA Order-to-Ledger Event Monitor & Simulator */}
        {activeSubTab === "eda-events" && (
          <FineractEdaEvents
            onEventEmitted={loadSystemState}
            onNavigateToLedger={handleNavigateToLedger}
          />
        )}
      </div>

      {/* 3. Deep Fineract Error Inspector Modal */}
      <FineractErrorInspector
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        error={inspectedError}
        onSelectTestError={testKey => {
          const sample = SAMPLE_FINERACT_ERRORS[testKey]?.payload;
          if (sample) {
            setInspectedError(sample);
          }
        }}
      />
    </div>
  );
}

export default function FineractDashboard() {
  return (
    <FineractToastProvider>
      <FineractDashboardInner />
    </FineractToastProvider>
  );
}
