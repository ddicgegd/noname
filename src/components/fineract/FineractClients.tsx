/**
 * Apache Fineract Financial Clients Subsystem Component (R2)
 * High-density client directory supporting Admin vs Customer view (externalId filtering),
 * real-time search, status filtering, detail drawer, and client registration modal.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Shield,
  UserCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
  X,
  Sparkles
} from "lucide-react";
import { fineractService } from "@/services/fineractService";
import { FineractClient } from "@/types/fineract";
import ClientDetailDrawer from "./ClientDetailDrawer";
import ClientRegistrationModal from "./ClientRegistrationModal";
import { useFineractToast } from "./FineractToast";

export interface FineractClientsProps {
  onClientUpdated?: () => void;
  onClientCreated?: () => void;
}

export default function FineractClients({
  onClientUpdated,
  onClientCreated
}: FineractClientsProps) {
  const { success, fineractError, info } = useFineractToast();

  // Role View State: Admin (Staff) View vs Customer View
  const [roleView, setRoleView] = useState<"admin" | "customer">("admin");
  const [customerExternalId, setCustomerExternalId] = useState<string>("101");

  // Client Dataset
  const [clients, setClients] = useState<FineractClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Status Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");

  // Detail Drawer & Registration Modal State
  const [selectedClient, setSelectedClient] = useState<FineractClient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Copy feedback state
  const [copiedAccountNo, setCopiedAccountNo] = useState<string | null>(null);

  // Fetch clients based on active role and externalId
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      if (roleView === "customer") {
        const result = await fineractService.getClients("customer", customerExternalId.trim());
        setClients(result);
      } else {
        const result = await fineractService.getClients("admin");
        setClients(result);
      }
    } catch (err: any) {
      console.error("[FineractClients] Error fetching clients:", err);
      fineractError(err, "Không thể nạp danh sách khách hàng");
    } finally {
      setIsLoading(false);
    }
  }, [roleView, customerExternalId, fineractError]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Derived KPI statistics
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.active || c.status.id === 300).length;
    const pending = clients.filter(c => !c.active || c.status.id === 100).length;
    const linked = clients.filter(c => Boolean(c.externalId)).length;
    return { total, active, pending, linked };
  }, [clients]);

  // Real-time filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Status filter
      if (statusFilter === "active" && !(client.active || client.status.id === 300)) {
        return false;
      }
      if (statusFilter === "pending" && !(client.status.id === 100 || !client.active)) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName =
          client.displayName?.toLowerCase().includes(term) ||
          client.firstname?.toLowerCase().includes(term) ||
          client.lastname?.toLowerCase().includes(term);
        const matchAccount = client.accountNo?.toLowerCase().includes(term);
        const matchExternal = client.externalId?.toLowerCase().includes(term);
        const matchMobile = client.mobileNo?.toLowerCase().includes(term);
        const matchEmail = client.emailAddress?.toLowerCase().includes(term);
        const matchOffice = client.officeName?.toLowerCase().includes(term);

        return (
          matchName ||
          matchAccount ||
          matchExternal ||
          matchMobile ||
          matchEmail ||
          matchOffice
        );
      }

      return true;
    });
  }, [clients, statusFilter, searchTerm]);

  // Handle client creation success
  const handleClientCreatedSuccess = (newClient: FineractClient) => {
    fetchClients();
    onClientCreated?.();
    onClientUpdated?.();
    // Automatically open the detail drawer for the newly created client
    setSelectedClient(newClient);
    setIsDrawerOpen(true);
  };

  const handleOpenDetail = (client: FineractClient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const handleCopyAccount = (accountNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accountNo);
    setCopiedAccountNo(accountNo);
    info(`Đã sao chép mã tài khoản: ${accountNo}`, "Sao chép thành công");
    setTimeout(() => setCopiedAccountNo(null), 2000);
  };

  // Sample ERP user IDs for quick testing in customer role view
  const SAMPLE_ERP_USER_IDS = ["101", "102", "103", "104", "105", "106"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Primary Action Deck */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D24]/10 border border-[#FF4D24]/20 flex items-center justify-center text-[#FF4D24] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Quản Lý Khách Hàng Tài Chính (Clients Subsystem)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
                    R2 Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý danh bạ khách hàng Fineract Core Banking, liên kết định danh người dùng ERP (externalId), và theo dõi hồ sơ tín dụng.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchClients();
                success("Đã cập nhật danh bạ khách hàng mới nhất.", "Làm mới dữ liệu");
              }}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách khách hàng"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#FF4D24]" : ""}`} />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF4D24] hover:bg-[#ff623d] shadow-lg shadow-[#FF4D24]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng Ký Khách Hàng Mới</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Tổng Khách Hàng</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.total}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Đang Hoạt Động (Active)
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {stats.active}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Chờ Phê Duyệt (Pending)
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {stats.pending}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              Đã Liên Kết ERP (externalId)
            </div>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1">
              {stats.linked}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Role View Switcher: Admin (Staff) View vs Customer View */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Chế Độ Truy Vấn Phân Quyền:</span>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setRoleView("admin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  roleView === "admin"
                    ? "bg-[#FF4D24] text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Quản Trị Viên (Admin View - GET /clients)
              </button>

              <button
                onClick={() => setRoleView("customer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  roleView === "customer"
                    ? "bg-sky-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Khách Hàng (Customer View - externalId)
              </button>
            </div>
          </div>

          {/* Customer View Input / Selector */}
          {roleView === "customer" && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <span className="text-xs text-slate-400 font-mono">externalId:</span>
              <input
                type="text"
                value={customerExternalId}
                onChange={e => setCustomerExternalId(e.target.value)}
                placeholder="Nhập externalId..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-400 focus:outline-none focus:border-sky-500 w-32"
              />
              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1">
                {SAMPLE_ERP_USER_IDS.map(id => (
                  <button
                    key={id}
                    onClick={() => setCustomerExternalId(id)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      customerExternalId === id
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    #{id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer View Explanation Alert Banner */}
        {roleView === "customer" && (
          <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 flex items-start gap-2.5 text-xs text-sky-300 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>Chế độ Phân quyền Khách hàng (Customer Role-Based Filter):</strong> Hệ thống thực hiện truy vấn với tham số{" "}
              <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-sky-200 border border-sky-500/30">
                GET /clients?externalId={customerExternalId.trim()}
              </code>
              . Người dùng chỉ xem được duy nhất hồ sơ cá nhân và hợp đồng vay của chính mình, bảo mật thông tin liên ngân hàng theo thiết kế Fineract.
            </div>
          </div>
        )}
      </div>

      {/* 4. Directory Controls: Search & Status Filters */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo Tên, Số TK, Điện thoại, Email, externalId..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D24] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất Cả ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Đang Hoạt Động ({stats.active})
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            Chờ Duyệt ({stats.pending})
          </button>
        </div>
      </div>

      {/* 5. High-Density Client Directory Table */}
      <div className="bg-[#15181F] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-sans uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Mã / ID</th>
                <th className="px-4 py-3.5">Họ và Tên Khách Hàng</th>
                <th className="px-4 py-3.5">Số Tài Khoản (accountNo)</th>
                <th className="px-4 py-3.5">Mã ERP (externalId)</th>
                <th className="px-4 py-3.5">Chi Nhánh</th>
                <th className="px-4 py-3.5">Ngày Kích Hoạt</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#FF4D24] border-t-transparent rounded-full animate-spin" />
                      <span>Đang nạp danh bạ khách hàng từ Fineract...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-medium text-slate-300">
                      Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại
                    </p>
                    <p className="text-xs text-slate-500">
                      Thử thay đổi từ khóa tìm kiếm hoặc chuyển đổi phân quyền Admin / Customer.
                    </p>
                    {(searchTerm || statusFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        Xóa toàn bộ bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => {
                  const isClientActive = c.active || c.status.id === 300;
                  const isClientPending = !c.active || c.status.id === 100;

                  const activationDateStr = Array.isArray(c.activationDate)
                    ? `${c.activationDate[2]} / ${c.activationDate[1]} / ${c.activationDate[0]}`
                    : c.activationDate;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    >
                      {/* ID / Avatar */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF4D24]/20 to-[#FF4D24]/5 border border-[#FF4D24]/30 flex items-center justify-center text-[#FF4D24] font-bold text-[11px] font-sans">
                            {c.firstname ? c.firstname[0].toUpperCase() : "C"}
                          </div>
                          <span className="text-slate-400 font-bold">#{c.id}</span>
                        </div>
                      </td>

                      {/* Display Name & Vietnamese Breakdown */}
                      <td className="px-4 py-3 font-sans">
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#FF4D24] transition-colors">
                            {c.displayName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Họ: {c.lastname}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">Tên: {c.firstname}</span>
                          </div>
                        </div>
                      </td>

                      {/* Account Number */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-400 font-bold tracking-wide">
                            {c.accountNo}
                          </span>
                          <button
                            onClick={e => handleCopyAccount(c.accountNo, e)}
                            className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Sao chép số tài khoản"
                          >
                            {copiedAccountNo === c.accountNo ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* External ID (ERP linkage) */}
                      <td className="px-4 py-3 font-mono">
                        {c.externalId ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {c.externalId}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Office Name */}
                      <td className="px-4 py-3 font-sans text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{c.officeName}</span>
                        </div>
                      </td>

                      {/* Activation Date */}
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {activationDateStr}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isClientActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                              : isClientPending
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/25"
                          }`}
                        >
                          {isClientActive ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400" />
                          )}
                          {c.status.value}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          onClick={e => handleOpenDetail(c, e)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FF4D24]" />
                          <span>Chi Tiết</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Record Counter */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Hiển thị <strong className="text-white">{filteredClients.length}</strong> /{" "}
            <span>{clients.length}</span> khách hàng ({roleView === "admin" ? "Toàn bộ cơ sở" : `Lọc theo ERP #${customerExternalId}`})
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Active: {stats.active}</span>
            <span>•</span>
            <span>Pending: {stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Detail Inspection Drawer */}
      <ClientDetailDrawer
        client={selectedClient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Client Registration Modal */}
      <ClientRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleClientCreatedSuccess}
      />
    </div>
  );
}
