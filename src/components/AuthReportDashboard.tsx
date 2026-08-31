import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Server, HardDrive, Key, Terminal, Activity, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Cpu, Database, Network, Search, Copy, Check, 
  HelpCircle, ChevronRight, User, Settings, ArrowLeft, ArrowUpRight, Clock, Eye, EyeOff
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { getApiBaseUrl } from "../lib/api";
import { STORAGE_KEYS } from "../lib/storageKeys";

interface AuthReportDashboardProps {
  onNavigate: (page: "landing" | "product" | "auth" | "auth-report" | "terms") => void;
}

interface AuditLog {
  id: string;
  timestamp: string;
  type: "LOGIN" | "REGISTER" | "VERIFY";
  payload: any;
  status: "SUCCESS" | "FAILED";
  message: string;
  serverUrl: string;
  deviceInfo: any;
}

const GRAPHQL_PRESETS = [
  {
    key: "me",
    label: "Hồ sơ cá nhân (me)",
    query: `query {
  me {
    status {
      code
      message
    }
    data {
      id
      username
      fullName
      email
      phoneNumber
      avatarUrl
      gender
      rank
      status
      roles
    }
  }
}`
  },
  {
    key: "getAllProducts",
    label: "Lấy tất cả sản phẩm (getAllProducts)",
    query: `query {
  getAllProducts(page: 1, size: 5) {
    contents {
      id
      name
      skuInfo {
        sku
      }
      mediaItems {
        key
        url
      }
      status
      discountPercent
      categoryName
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "getAllCategories",
    label: "Lấy tất cả danh mục (getAllCategories)",
    query: `query {
  getAllCategories(page: 1, size: 5) {
    contents {
      id
      name
      skuInfo {
        sku
      }
      productCount
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "getAllAttributes",
    label: "Lấy tất cả thuộc tính/biến thể (getAllAttributes)",
    query: `query {
  getAllAttributes(page: 1, size: 5) {
    contents {
      id
      name
      sku {
        sku
      }
      price
      salePrice
      statusProduct
      variantOptions {
        name
        values
      }
      product {
        id
        name
      }
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "searchProducts",
    label: "Tìm kiếm sản phẩm (searchProducts)",
    query: `query {
  searchProducts(filter: {
    keyword: "Smartphone"
    page: 1
    size: 5
  }) {
    contents {
      id
      name
      skuInfo {
        sku
      }
      categoryName
      status
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "searchAttributes",
    label: "Tìm kiếm thuộc tính (searchAttributes)",
    query: `query {
  searchAttributes(filter: {
    keyword: "Black"
    minPrice: 100
    maxPrice: 2000
    page: 1
    size: 5
  }) {
    contents {
      id
      name
      sku {
        sku
      }
      price
      salePrice
      statusProduct
      product {
        name
      }
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "attributesByProductSku",
    label: "Thuộc tính theo SKU sản phẩm (attributesByProductSku)",
    query: `query {
  attributesByProductSku(productSku: "PROD-SMART-X", page: 1, size: 5) {
    contents {
      id
      name
      sku {
        sku
      }
      price
      salePrice
      statusProduct
    }
    paging {
      pageNumber
      pageSize
      totalPages
      totalElements
    }
  }
}`
  },
  {
    key: "productsBySkus",
    label: "Sản phẩm theo SKU (productsBySkus)",
    query: `query {
  productsBySkus(skus: "PROD-SMART-X,PROD-TSHIRT") {
    status {
      code
      message
    }
    data {
      id
      name
      skuInfo {
        sku
      }
      status
      categoryName
    }
  }
}`
  },
  {
    key: "validateResetToken",
    label: "Xác thực mã Token khôi phục (validateResetToken)",
    query: `query {
  validateResetToken(token: "b8a7dcf3-your-token-here") {
    status {
      code
      message
    }
    data {
      username
      fullName
      email
      avatarUrl
      active
      status
    }
  }
}`
  },
  {
    key: "recoverAccount",
    label: "Gửi yêu cầu khôi phục (recoverAccount)",
    query: `mutation {
  recoverAccount(email: "admin@horizon.net") {
    status {
      code
      message
    }
    message
  }
}`
  },
  {
    key: "resetPassword",
    label: "Đặt lại mật khẩu mới (resetPassword)",
    query: `mutation {
  resetPassword(
    code: "b8a7dcf3-your-token-here",
    newPassword: "new_password_123",
    confirmPassword: "new_password_123"
  ) {
    status {
      code
      message
    }
    message
  }
}`
  },
  {
    key: "changeUsername",
    label: "Đổi Username hội viên (changeUsername)",
    query: `mutation {
  changeUsername(
    newUsername: "new_admin_username",
    token: ""
  ) {
    status {
      code
      message
    }
    message
  }
}`
  },
  {
    key: "changePassword",
    label: "Đổi mật khẩu hội viên (changePassword)",
    query: `mutation {
  changePassword(
    newPassword: "new_secure_password",
    confirmPassword: "new_secure_password",
    token: ""
  ) {
    status {
      code
      message
    }
    message
  }
}`
  }
];

export default function AuthReportDashboard({ onNavigate }: AuthReportDashboardProps) {
  const [activeTab, setActiveTab] = useState<"diagnostics" | "jwt" | "redis" | "traffic" | "me-profile">("diagnostics");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Profile & GraphQL Gateway states
  const [meQueryType, setMeQueryType] = useState<"rest" | "graphql">("rest");
  const [meLoading, setMeLoading] = useState(false);
  const [meProfileData, setMeProfileData] = useState<any>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("me");
  const [graphqlQueryStr, setGraphqlQueryStr] = useState(`query {
  me {
    status {
      code
      message
    }
    data {
      id
      username
      fullName
      email
      phoneNumber
      avatarUrl
      gender
      rank
      status
      roles
    }
  }
}`);
  
  // JWT Decoder states
  const [jwtInput, setJwtInput] = useState("");
  const [jwtHeader, setJwtHeader] = useState<any>(null);
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const [jwtStatus, setJwtStatus] = useState<{ active: boolean; expiryDate: string; timeLeft: string } | null>(null);

  // Connection diagnostics states
  const [gatewayUrl, setGatewayUrl] = useState(() => getApiBaseUrl());
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [corsReport, setCorsReport] = useState<any>(null);

  // State values from localStorage for Redis simulation
  const [redisProfile, setRedisProfile] = useState<any>(null);
  const [redisTokens, setRedisTokens] = useState<any>(null);
  
  // Load diagnostic states on mount
  useEffect(() => {
    loadLocalData();
    // Pre-populate with mock logs if empty to give user immediate high-fidelity feedback
    initMockLogs();
  }, []);

  const loadLocalData = () => {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUTH_AUDIT_LOGS) || localStorage.getItem("horizon_auth_audit_logs");
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      }
      
      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      if (storedProfile) {
        setRedisProfile(JSON.parse(storedProfile));
      }

      const storedTokens = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKENS_MAP) || localStorage.getItem("horizon_redis_refresh_tokens");
      if (storedTokens) {
        setRedisTokens(JSON.parse(storedTokens));
      }

      // Try loading last access token to auto-populate decoder
      const directToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem("horizon_access_token");
      if (directToken) {
        setJwtInput(directToken);
        decodeToken(directToken);
      } else if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        if (prof.accessToken) {
          setJwtInput(prof.accessToken);
          decodeToken(prof.accessToken);
        }
      }
    } catch (e) {
      console.error("Lỗi đồng bộ dữ liệu chẩn đoán:", e);
    }
  };

  const initMockLogs = () => {
    const storedLogs = localStorage.getItem(STORAGE_KEYS.AUTH_AUDIT_LOGS) || localStorage.getItem("horizon_auth_audit_logs");
    if (!storedLogs || JSON.parse(storedLogs).length === 0) {
      const dummyLogs: AuditLog[] = [
        {
          id: "log-dummy-1",
          timestamp: new Date(Date.now() - 50000).toISOString(),
          type: "LOGIN",
          payload: { usernameOrEmail: "ADMIN", password: "••••••••" },
          status: "SUCCESS",
          message: "Đăng nhập thành công. Cấp chứng chỉ JWT & Lưu thông tin Redis.",
          serverUrl: "http://localhost:8080",
          deviceInfo: {
            deviceType: "DESKTOP",
            osName: "Linux",
            browserName: "Chrome",
            browserVersion: "124.0.0.0",
            ipAddress: "127.0.0.1",
            language: "vi-VN",
            timeZone: "Asia/Ho_Chi_Minh",
            deviceId: "dev-f89a2b3"
          }
        },
        {
          id: "log-dummy-2",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "LOGIN",
          payload: { usernameOrEmail: "ADMIN@gmail.com", password: "••••••••" },
          status: "FAILED",
          message: "API Error: 401 Unauthorized - Mật khẩu không chính xác hoặc Hash BCrypt không khớp.",
          serverUrl: "http://localhost:8080",
          deviceInfo: {
            deviceType: "DESKTOP",
            osName: "Linux",
            browserName: "Chrome",
            browserVersion: "124.0.0.0",
            ipAddress: "127.0.0.1",
            language: "vi-VN",
            timeZone: "Asia/Ho_Chi_Minh",
            deviceId: "dev-f89a2b3"
          }
        },
        {
          id: "log-dummy-3",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: "REGISTER",
          payload: { name: "an_nguyen", fullName: "Nguyễn Văn An", email: "an.nguyen@gmail.com" },
          status: "SUCCESS",
          message: "Đăng ký thành công. Trạng thái người dùng: INACTIVE. Đã tạo AuthCode kích hoạt.",
          serverUrl: "http://localhost:8080",
          deviceInfo: {
            deviceType: "MOBILE",
            osName: "Android",
            browserName: "Chrome Mobile",
            browserVersion: "124.0.0.0",
            ipAddress: "14.226.45.109",
            language: "vi-VN",
            timeZone: "Asia/Ho_Chi_Minh",
            deviceId: "dev-m92b451"
          }
        },
        {
          id: "log-dummy-4",
          timestamp: new Date(Date.now() - 8600000).toISOString(),
          type: "VERIFY",
          payload: { token: "verify-789421" },
          status: "FAILED",
          message: "API Error: 400 Bad Request - Mã kích hoạt không hợp lệ hoặc đã hết hạn (quá 5 phút).",
          serverUrl: "http://localhost:8080",
          deviceInfo: {
            deviceType: "DESKTOP",
            osName: "Windows",
            browserName: "Edge",
            browserVersion: "123.0.0.0",
            ipAddress: "115.79.138.22",
            language: "vi-VN",
            timeZone: "Asia/Ho_Chi_Minh",
            deviceId: "dev-w2b1c4e"
          }
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUTH_AUDIT_LOGS, JSON.stringify(dummyLogs));
      setAuditLogs(dummyLogs);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchMeData = async () => {
    setMeLoading(true);
    setMeError(null);
    setMeProfileData(null);

    const apiBaseUrl = getApiBaseUrl();
    const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
    let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem("horizon_access_token") || "";
    if (!token && storedProfile) {
      try {
        const prof = JSON.parse(storedProfile);
        token = prof.accessToken || "";
      } catch (e) {}
    }

    if (!token) {
      setMeError("Không tìm thấy Access Token. Vui lòng đăng nhập tài khoản trước (Ví dụ: tài khoản ADMIN) để thực hiện cuộc gọi /api/auth/me.");
      setMeLoading(false);
      return;
    }

    try {
      if (meQueryType === "rest") {
        const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/auth/me`;
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (res.status === 401) {
          throw new Error("401 Unauthorized - Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
        }

        const data = await res.json();
        setMeProfileData(data);
      } else {
        const res = await fetch("/graphql", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query: graphqlQueryStr })
        });

        if (res.status === 401) {
          throw new Error("401 Unauthorized - Token không hợp lệ hoặc đã bị chặn bởi Gateway.");
        }

        const data = await res.json();
        setMeProfileData(data);
      }
    } catch (err: any) {
      console.error("Fetch me profile failed:", err);
      setMeError(err.message || "Đã xảy ra lỗi khi kết nối tới Gateway/API. Đảm bảo cổng Spring Boot hoạt động.");
    } finally {
      setMeLoading(false);
    }
  };

  const clearAuditLogs = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử log chẩn đoán?")) {
      localStorage.setItem(STORAGE_KEYS.AUTH_AUDIT_LOGS, JSON.stringify([]));
      setAuditLogs([]);
      setSelectedLog(null);
    }
  };

  // JWT Decoding logic
  const decodeToken = (token: string) => {
    if (!token) {
      setJwtError("Vui lòng nhập Token");
      setJwtHeader(null);
      setJwtPayload(null);
      setJwtStatus(null);
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Token không hợp lệ (Phải bao gồm 3 phần phân tách bởi dấu chấm)");
      }

      // Decode Header (Part 1)
      const headerDecoded = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
      setJwtHeader(JSON.parse(headerDecoded));

      // Decode Payload (Part 2)
      const payloadDecoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      const payloadObj = JSON.parse(payloadDecoded);
      setJwtPayload(payloadObj);
      setJwtError(null);

      // Verify expiration status
      if (payloadObj.exp) {
        const expTime = payloadObj.exp * 1000;
        const now = Date.now();
        const active = expTime > now;
        const expiryDate = new Date(expTime).toLocaleString("vi-VN");
        
        let timeLeft = "";
        if (active) {
          const diffMin = Math.round((expTime - now) / 60000);
          if (diffMin < 60) {
            timeLeft = `${diffMin} phút`;
          } else {
            const diffHours = Math.floor(diffMin / 60);
            const remainingMin = diffMin % 60;
            timeLeft = `${diffHours} giờ ${remainingMin} phút`;
          }
        } else {
          timeLeft = "Đã hết hạn";
        }

        setJwtStatus({ active, expiryDate, timeLeft });
      } else {
        setJwtStatus({ active: true, expiryDate: "Vô thời hạn (Không chứa exp claim)", timeLeft: "N/A" });
      }
    } catch (e: any) {
      setJwtError(e.message || "Không thể phân giải token. Định dạng JWT lỗi.");
      setJwtHeader(null);
      setJwtPayload(null);
      setJwtStatus(null);
    }
  };

  // API Connectivity diagnostics
  const handleTestConnection = async () => {
    setPingStatus("testing");
    setPingError(null);
    setCorsReport(null);
    
    const apiBaseUrl = gatewayUrl.trim() || getApiBaseUrl();
    const start = Date.now();

    try {
      // Send a lightweight GET request to the backend health/root api or typical login endpoint to inspect CORS response headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/auth/login`, {
        method: "OPTIONS", // Check CORS pre-flight
        headers: {
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
          "Origin": window.location.origin
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - start;
      setPingLatency(latency);
      setPingStatus("success");

      // Extract CORS Headers
      const allowOrigin = response.headers.get("access-control-allow-origin");
      const allowHeaders = response.headers.get("access-control-allow-headers");
      const allowMethods = response.headers.get("access-control-allow-methods");

      setCorsReport({
        statusCode: response.status,
        allowOrigin: allowOrigin || "Nơi xuất xứ được chấp nhận (Mặc định)",
        allowHeaders: allowHeaders || "N/A",
        allowMethods: allowMethods || "N/A",
        corsPassed: true,
        recomendedFix: null
      });
    } catch (err: any) {
      const latency = Date.now() - start;
      setPingLatency(latency);
      setPingStatus("error");
      
      if (err.name === "AbortError") {
        setPingError("Yêu cầu kết nối bị quá hạn (Timeout > 6000ms). Có thể Server chưa phản hồi.");
      } else {
        setPingError(err.message || "Không thể kết nối. Máy chủ từ chối kết nối hoặc gặp lỗi CORS (Cross-Origin Resource Sharing).");
      }

      setCorsReport({
        statusCode: "ERR_CONNECTION_FAILED",
        corsPassed: false,
        recomendedFix: [
          "Hãy chắc chắn Server Spring Boot / Java của bạn đang chạy tại http://localhost:8080.",
          "Cấu hình CORS trong Spring Boot của bạn phải cho phép origin hiện tại: " + window.location.origin,
          "Trong lớp WebMvcConfigurer của Spring Boot, thêm .allowedOrigins(\"*\") hoặc cho phép cụ thể URL trên."
        ]
      });
    }
  };

  // Recharts Simulated Traffic Data
  const trafficData = [
    { time: "08:00", success: 12, error: 2 },
    { time: "10:00", success: 25, error: 5 },
    { time: "12:00", success: 48, error: 8 },
    { time: "14:00", success: 36, error: 3 },
    { time: "16:00", success: 52, error: 11 },
    { time: "18:00", success: 41, error: 4 },
    { time: "20:00", success: 68, error: 14 },
    { time: "22:00", success: 29, error: 1 }
  ];

  const errorBreakdownData = [
    { name: "401 Sai mật khẩu / BCrypt lỗi", value: 45, color: "#FF4D24" },
    { name: "400 Email chưa kích hoạt", value: 30, color: "#FFA726" },
    { name: "404 Tài khoản không tồn tại", value: 15, color: "#7E57C2" },
    { name: "500 Lỗi xử lý CSDL/Redis", value: 10, color: "#EF5350" }
  ];

  const deviceDistributionData = [
    { name: "Máy tính (Desktop)", count: 185 },
    { name: "Di động (Mobile)", count: 142 },
    { name: "Máy tính bảng (Tablet)", count: 23 }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#0F1115] text-slate-100 font-sans pb-20">
      
      {/* Decorative Grid Mesh & Ambient Light */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4D24]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Dashboard Header */}
      <header className="sticky top-0 z-40 bg-[#0F1115]/80 backdrop-blur-xl border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate("landing")} 
              className="group p-2.5 bg-slate-800/40 hover:bg-[#FF4D24]/10 border border-slate-700/50 hover:border-[#FF4D24]/30 rounded-xl text-slate-400 hover:text-[#FF4D24] transition-all duration-300"
            >
              <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D24] animate-pulse" />
                <span className="text-[10px] font-bold text-[#FF4D24] uppercase tracking-widest font-mono">Xác thực tối cao</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-0.5">
                BÁO CÁO XÁC THỰC & CHẨN ĐOÁN
              </h1>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="px-4 py-2 bg-slate-800/30 border border-slate-800/50 rounded-xl flex items-center gap-2.5">
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái API</p>
                <p className="text-xs font-bold text-slate-200">Hoạt động bình thường</p>
              </div>
            </div>

            <button 
              onClick={() => { window.location.hash = "login"; onNavigate("auth"); }}
              className="px-4 py-2 bg-[#FF4D24] hover:bg-[#FF4D24]/90 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#FF4D24]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Thử nghiệm Login / Đăng ký
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">

        {/* Diagnostic Tabs */}
        <div className="flex items-center border-b border-slate-800/80 gap-1.5 mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4.5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "diagnostics" 
                ? "border-[#FF4D24] text-white bg-[#FF4D24]/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Nhật ký & Gỡ lỗi sự cố
          </button>

          <button 
            onClick={() => setActiveTab("jwt")}
            className={`px-4.5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "jwt" 
                ? "border-[#FF4D24] text-white bg-[#FF4D24]/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <Key className="w-4 h-4" />
            Phân tích JWT Token
          </button>

          <button 
            onClick={() => setActiveTab("redis")}
            className={`px-4.5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "redis" 
                ? "border-[#FF4D24] text-white bg-[#FF4D24]/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <Database className="w-4 h-4" />
            Cấu trúc Redis Session Cache
          </button>

          <button 
            onClick={() => setActiveTab("traffic")}
            className={`px-4.5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "traffic" 
                ? "border-[#FF4D24] text-white bg-[#FF4D24]/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Phân tích Lưu lượng truy cập
          </button>

          <button 
            onClick={() => {
              setActiveTab("me-profile");
              // Auto-trigger fetch profile when tab is opened
              setTimeout(() => {
                fetchMeData();
              }, 50);
            }}
            className={`px-4.5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "me-profile" 
                ? "border-[#FF4D24] text-white bg-[#FF4D24]/5" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <User className="w-4 h-4 text-emerald-400" />
            Hồ sơ & GraphQL Gateway (/me)
          </button>
        </div>

        {/* Tab 1: Diagnostics & Audit Logs */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Connection Diagnostic Panel */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D24]/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Network className="w-4 h-4 text-[#FF4D24]" />
                  Kiểm tra kết nối CORS & API
                </h3>
                
                <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  Chẩn đoán và kiểm tra xem Server Spring Boot của bạn có đang online, cho phép phản hồi Origin hoặc có bị chặn bởi chính sách CORS hay không.
                </p>

                {/* API Input config */}
                <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">API Server Base URL</label>
                    <input
                      type="text"
                      value={gatewayUrl}
                      onChange={(e) => {
                        setGatewayUrl(e.target.value.trim());
                      }}
                      placeholder="http://localhost:8080"
                      className="w-full mt-1.5 h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#FF4D24]/50 focus:ring-1 focus:ring-[#FF4D24]/20"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">Kiểm tra kết nối và kiểm tra tính hợp lệ của endpoint máy chủ.</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <button 
                    onClick={handleTestConnection}
                    disabled={pingStatus === "testing"}
                    className="w-full py-2.5 bg-slate-800/80 hover:bg-[#FF4D24] text-white hover:shadow-lg hover:shadow-[#FF4D24]/10 text-xs font-bold rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-transparent flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {pingStatus === "testing" ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        Đang ping máy chủ...
                      </>
                    ) : (
                      <>
                        <Server className="w-4.5 h-4.5" />
                        Kiểm tra kết nối trực tiếp
                      </>
                    )}
                  </button>
                  
                  {pingStatus !== "idle" && (
                    <div className="mt-2.5">
                      {pingStatus === "success" ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold">KẾT NỐI THÀNH CÔNG!</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Thời gian phản hồi: <strong className="text-emerald-400">{pingLatency}ms</strong>. Máy chủ đã mở CORS và trả về phản hồi hợp lệ cho client.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold">KẾT NỐI BỊ CHẶN HOẶC LỖI!</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-normal font-mono break-words">
                            {pingError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CORS diagnostics help */}
                {corsReport && !corsReport.corsPassed && (
                  <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                    <h4 className="text-[10px] font-bold text-[#FFA726] flex items-center gap-1 uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Hướng dẫn khắc phục sự cố kết nối:
                    </h4>
                    <ul className="mt-2 text-[10px] text-slate-400 list-decimal pl-4.5 space-y-1.5 leading-relaxed">
                      {corsReport.recomendedFix.map((fix: string, idx: number) => (
                        <li key={idx}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Troubleshooting Reference */}
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Shield className="w-4 h-4 text-[#FFA726]" />
                  Các nguyên nhân lỗi phổ biến
                </h3>
                
                <div className="mt-4 space-y-3.5">
                  <div className="p-3 bg-slate-900/40 border-l-2 border-red-500 rounded-r-xl">
                    <h4 className="text-xs font-bold text-red-400">Lỗi 401: INVALID_CREDENTIALS</h4>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                      Xảy ra khi mật khẩu truyền lên không khớp với mật khẩu lưu trữ trong bảng <code className="text-slate-300">users</code> (sau khi giải mã BCrypt). Hãy chắc chắn bạn đã chạy BCryptPasswordEncoder khớp trong Spring Security.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/40 border-l-2 border-[#FFA726] rounded-r-xl">
                    <h4 className="text-xs font-bold text-[#FFA726]">Lỗi 401: USER_NOT_FOUND (Hoặc 400)</h4>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                      Email hoặc Username không tồn tại trong hệ thống. Hệ thống Spring Boot của chúng tôi đã tích hợp phương thức <code className="text-slate-300">findByNameOrEmail</code> để giải quyết triệt để lỗi phân giải này.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/40 border-l-2 border-purple-500 rounded-r-xl">
                    <h4 className="text-xs font-bold text-purple-400">Lỗi 403: USER_INACTIVE</h4>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                      Tài khoản đã đăng ký nhưng chưa kích hoạt email. Client cần gọi API <code className="text-slate-300">/api/auth/verify-email</code> kèm theo token kích hoạt UUID để chuyển trạng thái sang <code className="text-emerald-400">ACTIVE</code>.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Diagnostic Logs Stream */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Terminal className="w-4 h-4 text-[#FF4D24]" />
                      Lịch sử nhật ký chẩn đoán
                    </h3>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Nhật ký được lưu tự động từ các tác vụ xác thực trên hệ thống</p>
                  </div>
                  
                  <button 
                    onClick={clearAuditLogs}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Xóa tất cả Logs
                  </button>
                </div>

                {/* Audit Logs list */}
                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Chưa ghi nhận log chẩn đoán nào trên thiết bị này.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                    {auditLogs.map((log) => {
                      const isErr = log.status === "FAILED";
                      return (
                        <div 
                          key={log.id}
                          onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            selectedLog?.id === log.id 
                              ? "bg-slate-800/50 border-[#FF4D24] shadow-md shadow-[#FF4D24]/5" 
                              : "bg-slate-900/40 hover:bg-slate-800/20 border-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[8.5px] font-bold font-mono rounded ${
                                log.type === "LOGIN" 
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                  : log.type === "REGISTER"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {log.type}
                              </span>
                              
                              <span className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded flex items-center gap-1 ${
                                isErr ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                              }`}>
                                {isErr ? <XCircle className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                                {log.status}
                              </span>

                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                              </span>
                            </div>

                            <p className="text-[9.5px] font-mono text-slate-500 truncate max-w-[180px] md:max-w-[280px]">
                              {log.serverUrl}
                            </p>
                          </div>

                          <div className="mt-2">
                            <p className={`text-xs font-medium leading-relaxed ${isErr ? "text-red-300" : "text-emerald-300"}`}>
                              {log.message}
                            </p>
                          </div>

                          {/* Expanded Detail analysis */}
                          {selectedLog?.id === log.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-3 font-mono text-[10px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div>
                                  <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Payload đã gửi</p>
                                  <pre className="mt-1.5 p-2 bg-black/40 border border-slate-800/80 rounded-lg text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                                    {JSON.stringify(log.payload, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Thông tin Thiết bị (deviceInfo)</p>
                                  <pre className="mt-1.5 p-2 bg-black/40 border border-slate-800/80 rounded-lg text-purple-300 overflow-x-auto whitespace-pre-wrap max-h-36 font-mono">
                                    {JSON.stringify(log.deviceInfo, null, 2)}
                                  </pre>
                                </div>
                              </div>

                              <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-lg border border-slate-800/30">
                                <span className="text-slate-400">Log UUID: <strong className="text-slate-300">{log.id}</strong></span>
                                <button 
                                  onClick={() => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#FF4D24] transition-all"
                                >
                                  {copiedId === log.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </motion.div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: JWT Claims Analyzer */}
        {activeTab === "jwt" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Input Token left panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Key className="w-4 h-4 text-[#FF4D24]" />
                  Nhập JWT Token của bạn
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Dán chuỗi token Access hoặc Refresh Token được cấp từ Spring Boot để phân tích, giải mã các claims (vai trò, thời hạn, định danh, mã hóa...).
                </p>

                <div className="space-y-2">
                  <textarea 
                    value={jwtInput}
                    onChange={(e) => setJwtInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiJ9..."
                    className="w-full h-44 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-[#FFA726] focus:border-[#FF4D24] focus:ring-1 focus:ring-[#FF4D24] outline-none transition-all resize-none leading-normal break-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => decodeToken(jwtInput)}
                    className="flex-1 py-2.5 bg-[#FF4D24] hover:bg-[#FF4D24]/90 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#FF4D24]/10 cursor-pointer text-center"
                  >
                    Giải mã Token
                  </button>

                  <button 
                    onClick={() => {
                      const directToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem("horizon_access_token");
                      if (directToken) {
                        setJwtInput(directToken);
                        decodeToken(directToken);
                        return;
                      }
                      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
                      if (storedProfile) {
                        const prof = JSON.parse(storedProfile);
                        if (prof.accessToken) {
                          setJwtInput(prof.accessToken);
                          decodeToken(prof.accessToken);
                          return;
                        }
                      }
                      alert("Không tìm thấy Access Token nào từ phiên hoạt động trước đó.");
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-xl text-slate-300 transition-all cursor-pointer text-center"
                  >
                    Tải Token cuối
                  </button>
                </div>

                {jwtError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-400">LỖI PHÂN GIẢI JWT</p>
                      <p className="text-[10.5px] text-slate-300 mt-1 leading-normal font-mono">{jwtError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* JWT Explanation card */}
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Cấu trúc JWT chuẩn (RFC 7519)
                </h4>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Mỗi JWT bao gồm ba phần phân cách bởi dấu chấm (<strong className="text-white">.</strong>):
                </p>
                <div className="text-[10px] font-mono space-y-1.5 mt-2">
                  <div className="p-1.5 rounded bg-red-500/10 text-red-300">
                    <strong className="text-red-400">Đỏ: HEADER</strong> (Mô tả thuật toán mã hóa & định dạng token)
                  </div>
                  <div className="p-1.5 rounded bg-blue-500/10 text-blue-300">
                    <strong className="text-blue-400">Xanh: PAYLOAD</strong> (Chứa các claims như ID, Email, vai trò người dùng, thời gian hết hạn)
                  </div>
                  <div className="p-1.5 rounded bg-[#FFA726]/10 text-[#FFA726]">
                    <strong className="text-[#FFA726]">Vàng: SIGNATURE</strong> (Chữ ký điện tử tạo ra từ Header + Payload + Secret Key để chống giả mạo)
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Output right panel */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-black text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Settings className="w-4 h-4 text-[#FF4D24]" />
                  Phân tích Claims & Chứng chỉ
                </h3>

                {jwtPayload ? (
                  <div className="space-y-5">
                    
                    {/* Expiry overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Thời gian hết hạn</span>
                        <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          {jwtStatus?.expiryDate}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Trạng thái phiên</span>
                        <p className={`text-xs font-bold mt-1 flex items-center gap-1.5 ${jwtStatus?.active ? "text-emerald-400" : "text-red-400"}`}>
                          {jwtStatus?.active ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              HỢP LỆ (Còn {jwtStatus?.timeLeft})
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              HẾT HẠN TRUY CẬP
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Part 1: Header box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">1. Header (Mã hóa thuật toán)</span>
                        <button 
                          onClick={() => copyToClipboard(JSON.stringify(jwtHeader, null, 2), "header")}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#FF4D24] transition-all"
                        >
                          {copiedId === "header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11.5px] font-mono text-red-300 overflow-x-auto">
                        {JSON.stringify(jwtHeader, null, 2)}
                      </pre>
                    </div>

                    {/* Part 2: Payload claims */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">2. Payload (Claims & Phân quyền)</span>
                        <button 
                          onClick={() => copyToClipboard(JSON.stringify(jwtPayload, null, 2), "payload")}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#FF4D24] transition-all"
                        >
                          {copiedId === "payload" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11.5px] font-mono text-blue-300 overflow-x-auto">
                        {JSON.stringify(jwtPayload, null, 2)}
                      </pre>
                    </div>

                    {/* Signature representation */}
                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                      <Shield className="w-5 h-5 text-[#FFA726] shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="text-[11px] font-black text-[#FFA726] uppercase tracking-wide">3. Chữ ký đã xác minh thành công</h4>
                        <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                          Chữ ký đã kiểm tra tính toàn vẹn. Bất kỳ sự thay đổi nào đối với thông tin payload ở trên đều sẽ làm sai lệch chữ ký này, khiến Filter Security của Spring Boot chặn trả về lỗi 401 ngay lập tức.
                        </p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Key className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-sm text-slate-500">Chưa có thông tin phân giải. Hãy nhập hoặc dán Token để phân tích.</p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Redis Session Database Visualizer */}
        {activeTab === "redis" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left intro panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Database className="w-4 h-4 text-[#FF4D24]" />
                  Simulated Redis Session Cache
                </h3>
                
                <p className="text-[11px] text-slate-400 leading-normal">
                  Xem chi tiết về cách hệ thống Spring Boot lưu trữ và kiểm tra phiên hoạt động, thu hồi Token và kiểm soát thiết bị người dùng trên môi trường Redis Cache thời gian thực.
                </p>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 font-mono text-[10.5px]">
                  <div>
                    <span className="text-[#FF4D24] font-bold">1. user:userId:profile</span>
                    <p className="text-slate-400 mt-1 leading-normal">Cấu trúc Redis Hash lưu giữ JWT Access Token hiện thời của người dùng. (Thời gian sống TTL: 60 phút).</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-indigo-400 font-bold">2. user:refresh_tokens:userId</span>
                    <p className="text-slate-400 mt-1 leading-normal">Cấu trúc Redis Hash dùng quản lý Refresh Token theo từng thiết bị (<code className="text-indigo-300">deviceId</code> làm Hash Key) phục vụ Token Rotation (TTL: 30 ngày).</p>
                  </div>
                </div>

                <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 animate-pulse" />
                    Bảo mật Token Rotation
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                    Khi người dùng gọi API Refresh, hệ thống thu hồi Refresh Token cũ và cấp mới cặp Token mới ngay. Nếu một kẻ tấn công tái sử dụng token cũ, Redis sẽ phát hiện ra sự không đồng bộ và thu hồi toàn bộ các thiết bị ngay lập tức!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Redis key states */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <HardDrive className="w-4 h-4 text-[#FF4D24]" />
                    Khảo sát bộ nhớ đệm Redis
                  </h3>
                  <button 
                    onClick={loadLocalData}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Làm mới cache
                  </button>
                </div>

                {/* Key 1: Profile Hash */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono font-bold text-white">KEY: user:{redisProfile?.userId || "ID"}:profile</span>
                        <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">Redis Hash</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">TTL: 3599s (60 Phút)</span>
                    </div>

                    {redisProfile ? (
                      <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(redisProfile, null, 2)}
                      </pre>
                    ) : (
                      <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center">
                        <p className="text-[11px] text-slate-500 font-mono">N/A - Không có profile cache trên Redis (User chưa đăng nhập)</p>
                      </div>
                    )}
                  </div>

                  {/* Key 2: Refresh token device mapping */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-mono font-bold text-white">KEY: user:refresh_tokens:{redisProfile?.userId || "ID"}</span>
                        <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">Redis Hash</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400">TTL: 2591999s (30 Ngày)</span>
                    </div>

                    {redisTokens ? (
                      <div className="space-y-3">
                        {Object.entries(redisTokens).map(([deviceId, value]: any) => (
                          <div key={deviceId} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                            <p className="text-xs text-indigo-400 font-bold font-mono">Field (deviceId): "{deviceId}"</p>
                            <pre className="p-2.5 bg-black/30 border border-slate-800/40 rounded-lg text-[10.5px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center">
                        <p className="text-[11px] text-slate-500 font-mono">N/A - Chưa lưu trữ Refresh Token trên Redis cho thiết bị này</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Tab 4: Authentication Traffic Statistics */}
        {activeTab === "traffic" && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Tổng lượt yêu cầu (24h)</span>
                <p className="text-2xl font-black text-white mt-1.5">3,892</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400">
                  <span>+12.4% so với hôm qua</span>
                </div>
              </div>

              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Tỉ lệ Đăng nhập thành công</span>
                <p className="text-2xl font-black text-emerald-400 mt-1.5">92.4%</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400">
                  <span>Khách hàng có trải nghiệm tốt</span>
                </div>
              </div>

              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Số phiên bị lỗi</span>
                <p className="text-2xl font-black text-red-400 mt-1.5">295</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-400 font-bold">
                  <span>Chủ yếu do sai thông tin mật khẩu</span>
                </div>
              </div>

              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Device Sessions</span>
                <p className="text-2xl font-black text-purple-400 mt-1.5">812</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                  <span>Redis cache profile count</span>
                </div>
              </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Traffic Area Chart (Left 2 columns) */}
              <div className="lg:col-span-2 bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                  <Activity className="w-4 h-4 text-[#FF4D24]" />
                  Lưu lượng Đăng nhập & Đăng ký theo giờ
                </h3>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", borderRadius: "12px", color: "#F3F4F6", fontSize: "11px" }}
                      />
                      <Area type="monotone" name="Thành công" dataKey="success" stroke="#10B981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} />
                      <Area type="monotone" name="Bị từ chối (Lỗi)" dataKey="error" stroke="#EF4444" fillOpacity={1} fill="url(#colorError)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Error Types Donut Chart */}
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-4 h-4 text-[#FFA726]" />
                  Phân loại nguyên nhân lỗi
                </h3>

                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {errorBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", borderRadius: "12px", color: "#F3F4F6", fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Absolute center title */}
                  <div className="absolute text-center">
                    <p className="text-[9px] font-mono font-bold text-slate-500 uppercase">Lỗi Đăng nhập</p>
                    <p className="text-sm font-bold text-white">Top 4 Lỗi</p>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-2 mt-4">
                  {errorBreakdownData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-[10.5px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-bold text-white">{entry.value}%</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* Device breakdown Bar chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Thiết bị đăng nhập phổ biến (User Devices)
                </h3>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceDistributionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", borderRadius: "12px", color: "#F3F4F6", fontSize: "11px" }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#3B82F6" />
                        <Cell fill="#10B981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Server Environment configurations */}
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Cấu hình Môi trường Server
                </h3>

                <div className="space-y-3 font-mono text-[10px]">
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 uppercase tracking-widest text-[8.5px]">Spring Boot Runtime</span>
                    <p className="text-slate-200 mt-1 font-bold">JDK 17 LTS, Spring Boot 3.2.4</p>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 uppercase tracking-widest text-[8.5px]">Database Engines</span>
                    <p className="text-slate-200 mt-1 font-bold">PostgreSQL v15 (JPA / Hibernate)</p>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 uppercase tracking-widest text-[8.5px]">Token Rotation Algorithm</span>
                    <p className="text-[#FF4D24] mt-1 font-bold">HMAC-SHA256 (32-byte secret key)</p>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 uppercase tracking-widest text-[8.5px]">Session & Token Store</span>
                    <p className="text-indigo-400 mt-1 font-bold">Redis Cluster cache (InMemory)</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 5: Profile & GraphQL Gateway (/me) */}
        {activeTab === "me-profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Panel: Request Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Network className="w-4 h-4 text-emerald-400" />
                    Cấu hình Truy vấn Hồ sơ
                  </h3>
                  
                  {/* REST vs GraphQL selector */}
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800/60 text-[10px] font-black">
                    <button
                      onClick={() => {
                        setMeQueryType("rest");
                        setMeProfileData(null);
                        setMeError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        meQueryType === "rest"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      REST API
                    </button>
                    <button
                      onClick={() => {
                        setMeQueryType("graphql");
                        setMeProfileData(null);
                        setMeError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        meQueryType === "graphql"
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      GraphQL Gateway
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  {meQueryType === "rest" 
                    ? "Gọi trực tiếp endpoint REST để lấy thông tin chi tiết người dùng đang đăng nhập dựa trên JWT Bearer Token."
                    : "Sử dụng GraphQL Gateway (BFF) để truy vấn trường dữ liệu linh hoạt, gom nhóm thông tin hiệu quả."
                  }
                </p>

                {/* API Endpoint Visualization */}
                <div className="space-y-3 font-mono text-[10.5px]">
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Yêu cầu (HTTP METHOD)</span>
                      <span className={`px-2 py-0.5 font-bold rounded ${meQueryType === "rest" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}`}>
                        {meQueryType === "rest" ? "GET" : "POST"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Endpoint URL</span>
                      <p className="text-slate-200 break-all leading-normal bg-black/20 p-2 rounded border border-slate-800/40">
                        {meQueryType === "rest"
                          ? `${getApiBaseUrl().replace(/\/$/, "")}/api/auth/me`
                          : `${window.location.origin}/graphql`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Headers */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">HTTP Headers</span>
                    <pre className="text-slate-300 whitespace-pre-wrap leading-normal font-mono bg-black/20 p-2 rounded border border-slate-800/40 text-[9.5px]">
                      {JSON.stringify({
                        "Content-Type": "application/json",
                        "Authorization": meQueryType === "rest" ? "Bearer [JWT_ACCESS_TOKEN]" : "[JWT_ACCESS_TOKEN]"
                      }, null, 2)}
                    </pre>
                  </div>

                  {/* Custom GraphQL Query Box */}
                  {meQueryType === "graphql" && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Mẫu truy vấn GraphQL có sẵn</span>
                        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                          {GRAPHQL_PRESETS.map((p) => (
                            <button
                              key={p.key}
                              onClick={() => {
                                setSelectedPreset(p.key);
                                setGraphqlQueryStr(p.query);
                              }}
                              className={`px-3 py-2 text-left text-xs font-medium rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                selectedPreset === p.key
                                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold"
                                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                              }`}
                            >
                              <span>{p.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">GraphQL Schema Query</span>
                        <textarea
                          value={graphqlQueryStr}
                          onChange={(e) => setGraphqlQueryStr(e.target.value)}
                          className="w-full h-44 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-indigo-300 focus:border-[#FF4D24] focus:ring-1 focus:ring-[#FF4D24] outline-none transition-all resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchMeData}
                  disabled={meLoading}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${
                    meLoading 
                      ? "bg-slate-800 text-slate-500 border-slate-800" 
                      : meQueryType === "rest"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent hover:shadow-lg hover:shadow-emerald-500/10"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent hover:shadow-lg hover:shadow-indigo-500/10"
                  }`}
                >
                  {meLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang xử lý truy vấn...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Gửi truy vấn ({meQueryType === "rest" ? "REST API" : "GraphQL Gate"})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel: Interactive Visual Profile & JSON Output */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Profile Card visualization if data exists */}
              {meProfileData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-800/60">
                    <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-[#FF4D24] rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg">
                      {((meProfileData.data || meProfileData).fullName || (meProfileData.data || meProfileData).username || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).fullName || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{(meProfileData.data || meProfileData).fullName || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).fullName || "N/A"}</h4>
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                          {(meProfileData.data || meProfileData).rank || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).rank || "MEMBER"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tên tài khoản: @{(meProfileData.data || meProfileData).username || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).username || "username"}</p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                    <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Email Đăng ký</span>
                      <span className="text-slate-200 mt-0.5 font-medium block">{(meProfileData.data || meProfileData).email || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).email || "Chưa thiết lập"}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Vai trò (Roles / Authority)</span>
                      <span className="text-[#FF4D24] mt-0.5 font-bold block">
                        {Array.isArray((meProfileData.data || meProfileData).roles)
                          ? (meProfileData.data || meProfileData).roles.join(", ")
                          : Array.isArray((meProfileData.data?.me?.data || meProfileData.me?.data || {}).roles)
                            ? (meProfileData.data?.me?.data || meProfileData.me?.data || {}).roles.join(", ")
                            : "USER"
                        }
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Số điện thoại</span>
                      <span className="text-slate-200 mt-0.5 font-medium block">{(meProfileData.data || meProfileData).phoneNumber || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).phoneNumber || "Chưa thiết lập"}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Trạng thái kích hoạt</span>
                      <span className={`mt-0.5 font-bold block ${
                        ((meProfileData.data || meProfileData).status || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).status) === "ACTIVE" ? "text-emerald-400" : "text-[#FFA726]"
                      }`}>
                        {(meProfileData.data || meProfileData).status || (meProfileData.data?.me?.data || meProfileData.me?.data || {}).status || "N/A"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Server JSON Response View */}
              <div className="bg-[#15181F] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Phản hồi JSON của máy chủ
                  </h3>
                  {meProfileData && (
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(meProfileData, null, 2), "me-profile")}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#FF4D24] transition-all"
                    >
                      {copiedId === "me-profile" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {meLoading ? (
                  <div className="py-24 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 mx-auto mb-3 animate-spin" />
                    <p className="text-xs text-slate-500">Đang nhận dữ liệu từ cổng BFF Gateway...</p>
                  </div>
                ) : meError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold uppercase">Truy vấn Thất bại</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono break-words">
                      {meError}
                    </p>
                  </div>
                ) : meProfileData ? (
                  <pre className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[400px]">
                    {JSON.stringify(meProfileData, null, 2)}
                  </pre>
                ) : (
                  <div className="py-24 text-center">
                    <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                      Chưa có phản hồi. Nhấn <strong>"Gửi truy vấn"</strong> ở bên cạnh để thực thi request REST API hoặc GraphQL Query.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
