import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Lock, Mail, ChevronDown, ChevronUp, CheckCircle, 
  Eye, EyeOff, AlertCircle, RefreshCw, Loader2, ArrowRight, ArrowLeft, Phone,
  Shield, Check, X, Sliders, ShoppingBag, ClipboardList, Truck, Package, PackageOpen, 
  MapPin, Clock, CreditCard, ChevronRight, HelpCircle, Plus, Trash2, Edit3,
  Smartphone, Laptop, Globe, Key, Keyboard, Building2, Home, Sparkles, Wallet, ExternalLink,
  ShieldCheck, ArrowUpRight, Compass, Navigation, Terminal, Copy, Activity, Code2,
  LocateFixed, Map as LucideMap, Search, CheckCircle2, Layers, Bookmark, ShoppingCart, Crown,
  Camera, Upload, Calendar, Wifi, Settings2, Pencil, ShieldAlert, Cake, PartyPopper,
  Server, RotateCcw, AlertTriangle
} from "lucide-react";
import { BirthdayDatePicker } from "./ui/BirthdayDatePicker";
import { useToast } from "./ui/Toast";
import { apiRequest, unifiedFetch, getUnifiedAccessToken, getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, pingEndpoint, PingResult } from "../lib/api";
import { 
  updateMyProfile, 
  uploadAvatar, 
  getMyProfile
} from "../services/authService";
import { UpdateProfileRequest, MyProfileResponse } from "../types/auth";
import { getActiveSessions, terminateSession, terminateOtherSessions } from "../services/sessionService";
import { DeviceSession } from "../types/session";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { 
  AddressDto, 
  getMyAddresses, 
  getDefaultAddress,
  createAddress, 
  updateAddress,
  setDefaultAddress, 
  deleteAddress, 
  resolveAddress, 
  ResolvedAddressDto,
  AddressApiResponseLog,
  subscribeAddressApiLogs,
  clearAddressApiLogs
} from "../services/addressService";
import {
  getAllBookmarks,
  clearBookmark,
  removeBookmarkItem,
  persistStagedBookmark,
  BookmarkData,
  BookmarkItem,
  subscribeBookmarkUpdates,
  sortBookmarksNewestFirst,
} from "../services/bookmarkService";
import { addToCart } from "../services/cartService";
import {
  getMyOrders,
  getOrderDetail,
  normalizeOrderDtoToUiItem,
  normalizeSummaryToUiItem,
  resolveAttributeDisplayName,
  formatDateDisplay,
  UiOrderItem,
  saveCachedOrders,
  getCachedOrders,
  OrderStatus,
  OrderItemDto
} from "../services/orderService";
import { getOrderStatusTheme } from "../lib/orderStatusTheme";
import { Bevel, BevelButton, BevelDivider } from "./ui/bevel";
import { 
  Sliders as LucideSliders,
  User as LucideUser,
  ShieldCheck as LucideShieldCheck,
  MapPin as LucideMapPin,
  CreditCard as LucideCreditCard,
  Laptop as LucideLaptop,
  Bookmark as LucideBookmark,
  Pencil as LucidePencil,
  Copy as LucideCopy,
  Check as LucideCheck,
  Sparkles as LucideSparkles,
  Lock as LucideLock,
  Shield as LucideShield
} from "lucide";
import { MorphIcon } from "morphicons/react";
import { HoverMorphIcon } from "./ui/HoverMorphIcon";
import BeatLoader from "react-spinners/BeatLoader";


export type OrderItem = UiOrderItem;

export const STATUS_FILTER_OPTIONS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ thanh toán" },
  { id: "PROCESSING", label: "Đang xử lý" },
  { id: "SHIPPED", label: "Đang giao" },
  { id: "DELIVERED", label: "Đã giao" },
  { id: "CANCELLED", label: "Đã hủy" },
] as const;

export type StatusFilterType = (typeof STATUS_FILTER_OPTIONS)[number]["id"];

interface ProfilePageProps {
  onNavigate: (page: "landing" | "product" | "order" | "cart" | "auth" | "auth-report" | "profile" | "terms" | "email-response") => void;
}

const SECURITY_TAG_ICONS = [
  LucideSliders,     // Mặc định: Thiết lập tài khoản
  LucideUser,        // Tab 1: Hồ sơ cá nhân
  LucideMapPin,      // Tab 2: Sổ địa chỉ nhận hàng
  LucideLaptop,      // Tab 3: Thiết bị & Phiên
  LucideBookmark     // Tab 4: Phụ kiện đã lưu
];

function SequentialTagMorphIcon({ isHovered }: { isHovered: boolean }) {
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    if (!isHovered) {
      setTagIndex(0);
      return;
    }

    // Khi vừa hover vào: morph ngay sang tag đầu tiên (Hồ sơ cá nhân)
    setTagIndex(1);

    // Sau đó tuần tự biến hình qua từng tag chức năng mỗi 800ms
    const interval = setInterval(() => {
      setTagIndex((prev) => {
        const next = prev + 1;
        return next < SECURITY_TAG_ICONS.length ? next : 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <MorphIcon
      icon={SECURITY_TAG_ICONS[tagIndex]}
      spring="snappy"
      className="w-3.5 h-3.5 text-indigo-700 shrink-0 select-none"
      size={14}
    />
  );
}

const SECURITY_BANNER_MORPH_ICONS = [
  LucideShieldCheck,
  LucideSparkles,
  LucideLock,
  LucideShield
];

function SecurityDynamicMorphIcon() {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % SECURITY_BANNER_MORPH_ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <MorphIcon
        icon={SECURITY_BANNER_MORPH_ICONS[iconIndex]}
        spring="bouncy"
        className="w-5 h-5 text-[#FF4D24] stroke-[2.2] select-none"
        size={20}
      />
    </div>
  );
}

function getMembershipRankInfo(user: any) {
  const rawRank = (user?.rank || "").trim().toUpperCase();
  const username = (user?.username || "").trim().toUpperCase();
  const email = (user?.email || "").trim().toUpperCase();
  const isAdmin = username.includes("ADMIN") || email.includes("ADMIN") || 
    (Array.isArray(user?.roles) && user.roles.some((r: any) => String(r).toUpperCase().includes("ADMIN")));
  
  const rank = rawRank || (isAdmin ? "GOLD" : "MEMBER");

  switch (rank) {
    case "PLATINUM":
    case "DIAMOND":
      return {
        label: "Hạng Bạch Kim",
        badgeClass: "text-sky-700 bg-gradient-to-b from-sky-50 to-sky-100/80 border-t-white border-b-sky-300/80 border-x-sky-200/70 shadow-[0_1px_2px_rgba(14,165,233,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
        iconColor: "text-sky-500",
      };
    case "GOLD":
      return {
        label: "Hạng Vàng",
        badgeClass: "text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100/80 border-t-white border-b-amber-300/80 border-x-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
        iconColor: "text-amber-500",
      };
    case "SILVER":
      return {
        label: "Hạng Bạc",
        badgeClass: "text-slate-700 bg-gradient-to-b from-slate-50 to-slate-100/80 border-t-white border-b-slate-300 border-x-slate-200 shadow-[0_1px_2px_rgba(100,116,139,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
        iconColor: "text-slate-400",
      };
    case "BRONZE":
      return {
        label: "Hạng Đồng",
        badgeClass: "text-orange-900 bg-gradient-to-b from-orange-50 to-amber-100/70 border-t-white border-b-orange-200 border-x-orange-100 shadow-[0_1px_2px_rgba(194,65,12,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
        iconColor: "text-orange-500",
      };
    case "MEMBER":
    default:
      return {
        label: "Hội viên Horizon",
        badgeClass: "text-[#FF4D24] bg-gradient-to-b from-rose-50 to-red-100/60 border-t-white border-b-red-200 border-x-red-100 shadow-[0_1px_2px_rgba(255,77,36,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
        iconColor: "text-[#FF4D24]",
      };
  }
}

// Helper to derive stable account key for per-account tutorial persistence
function getAccountTutorialKey(currUser: any): string {
  if (!currUser) {
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id || u?.userId || u?.email || u?.username) {
            return String(u.id || u.userId || u.email || u.username);
          }
        }
        const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          if (p?.userId || p?.email || p?.username) {
            return String(p.userId || p.email || p.username);
          }
        }
      } catch {
        // ignore
      }
    }
    return "guest";
  }
  return String(currUser.id || currUser.userId || currUser.email || currUser.username || currUser.phoneNumber || "guest");
}

function isTutorialDismissedForAccount(accountKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    // 1. Check account-specific direct key
    if (localStorage.getItem(`horizon_nav_tutorial_dismissed_${accountKey}`) === "true") {
      return true;
    }
    // 2. Check accounts map
    const mapStr = localStorage.getItem("horizon_nav_tutorial_dismissed_accounts");
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map && map[accountKey] === true) {
        return true;
      }
    }
    // 3. Fallback check for guest
    if (accountKey === "guest") {
      return localStorage.getItem("horizon_nav_tutorial_dismissed") === "true";
    }
  } catch {
    return false;
  }
  return false;
}

function saveTutorialDismissedForAccount(accountKey: string, dismissed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (dismissed) {
      localStorage.setItem(`horizon_nav_tutorial_dismissed_${accountKey}`, "true");
      const mapStr = localStorage.getItem("horizon_nav_tutorial_dismissed_accounts") || "{}";
      const map = JSON.parse(mapStr);
      map[accountKey] = true;
      localStorage.setItem("horizon_nav_tutorial_dismissed_accounts", JSON.stringify(map));
      if (accountKey === "guest") {
        localStorage.setItem("horizon_nav_tutorial_dismissed", "true");
      }
    } else {
      localStorage.removeItem(`horizon_nav_tutorial_dismissed_${accountKey}`);
      const mapStr = localStorage.getItem("horizon_nav_tutorial_dismissed_accounts");
      if (mapStr) {
        const map = JSON.parse(mapStr);
        delete map[accountKey];
        localStorage.setItem("horizon_nav_tutorial_dismissed_accounts", JSON.stringify(map));
      }
      if (accountKey === "guest") {
        localStorage.removeItem("horizon_nav_tutorial_dismissed");
      }
    }
  } catch {
    // ignore
  }
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { showToast } = useToast();
  // Authentication status
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user"));
    } catch {
      return true;
    }
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Accounts Center Modal Trigger State & Active Tab
  const [isAccountsCenterOpen, setIsAccountsCenterOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<"profile" | "addresses" | "sessions" | "bookmarks">("profile");
  const [userBookmarks, setUserBookmarks] = useState<BookmarkData[]>([]);
  const [isBookmarksLoading, setIsBookmarksLoading] = useState<boolean>(false);
  const [bookmarkActionLoading, setBookmarkActionLoading] = useState<string>("");
  const [isSecurityBtnHovered, setIsSecurityBtnHovered] = useState<boolean>(false);
  const [isAddressHovered, setIsAddressHovered] = useState<boolean>(false);

  // Device Sessions State & Handlers
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(false);
  const [sessionActionLoading, setSessionActionLoading] = useState<string>("");

  const loadDeviceSessions = useCallback(async () => {
    try {
      setIsSessionsLoading(true);
      const res = await getActiveSessions();
      if (res?.data?.sessions && Array.isArray(res.data.sessions)) {
        setDeviceSessions(res.data.sessions);
      }
    } catch (err: unknown) {
      console.warn("Failed to fetch active device sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setSessionActionLoading(sessionId);
      await terminateSession(sessionId);
      setDeviceSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccessMsg("Đã thu hồi phiên thiết bị thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thu hồi phiên thiết bị. Vui lòng thử lại sau.";
      setErrorMsg(msg);
    } finally {
      setSessionActionLoading("");
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      setSessionActionLoading("others");
      await terminateOtherSessions();
      setDeviceSessions(prev => prev.filter(s => s.isCurrent));
      setSuccessMsg("Đã đăng xuất khỏi tất cả các thiết bị khác thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể đăng xuất tất cả thiết bị khác. Vui lòng thử lại sau.";
      setErrorMsg(msg);
    } finally {
      setSessionActionLoading("");
    }
  };

  // API Gateway & Ping Probe State & Handlers
  const [apiEndpointUrl, setApiEndpointUrl] = useState<string>(() => getApiBaseUrl());
  const [customInputUrl, setCustomInputUrl] = useState<string>(() => getApiBaseUrl());
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [endpointValidationError, setEndpointValidationError] = useState<string>("");
  const [isEndpointDrawerOpen, setIsEndpointDrawerOpen] = useState<boolean>(false);

  // Synchronize endpoint state across tabs and windows
  useEffect(() => {
    const syncEndpoint = () => {
      const current = getApiBaseUrl();
      setApiEndpointUrl(current);
      setCustomInputUrl(current);
    };
    window.addEventListener("api-base-url-changed", syncEndpoint);
    window.addEventListener("storage", syncEndpoint);
    return () => {
      window.removeEventListener("api-base-url-changed", syncEndpoint);
      window.removeEventListener("storage", syncEndpoint);
    };
  }, []);

  const handlePingTest = async (target?: string) => {
    try {
      setIsPinging(true);
      const urlToPing = target || apiEndpointUrl;
      const res = await pingEndpoint(urlToPing);
      setPingResult(res);
      if (res.success) {
        showToast(`Kết nối máy chủ thành công (${res.latencyMs}ms)`, "success");
      } else {
        showToast(`Không thể kết nối tới endpoint: ${res.error || "Máy chủ không phản hồi"}`, "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPingResult({ success: false, latencyMs: 0, error: msg });
      showToast(`Lỗi kiểm tra kết nối: ${msg}`, "error");
    } finally {
      setIsPinging(false);
    }
  };

  const handleApplyEndpoint = async () => {
    const trimmed = customInputUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      const err = "URL Endpoint phải bắt đầu bằng http:// hoặc https://";
      setEndpointValidationError(err);
      showToast(err, "error");
      return;
    }
    setEndpointValidationError("");
    try {
      setApiBaseUrl(trimmed);
      const normalized = getApiBaseUrl();
      setApiEndpointUrl(normalized);
      setCustomInputUrl(normalized);
      showToast(`Đã áp dụng API Endpoint mới: ${normalized}`, "success");
      await handlePingTest(normalized);
      loadDeviceSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể áp dụng endpoint";
      setEndpointValidationError(msg);
      showToast(msg, "error");
    }
  };

  const handleResetEndpoint = () => {
    resetApiBaseUrl();
    const defaultUrl = getApiBaseUrl();
    setApiEndpointUrl(defaultUrl);
    setCustomInputUrl(defaultUrl);
    setEndpointValidationError("");
    setPingResult(null);
    showToast("Đã khôi phục API Endpoint về mặc định hệ thống.", "info");
    loadDeviceSessions();
  };

  const handlePresetSelect = (presetUrl: string) => {
    setCustomInputUrl(presetUrl);
    setEndpointValidationError("");
  };
  // Navigation Tutorial banner state & active keypress indicator (per-account permanent persistence)
  const [showNavTutorial, setShowNavTutorial] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const initialKey = getAccountTutorialKey(null);
      return !isTutorialDismissedForAccount(initialKey);
    }
    return true;
  });
  const [activePressedKeys, setActivePressedKeys] = useState<{ [key: string]: boolean }>({});
  const activeKeyTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [tutorialCountdown, setTutorialCountdown] = useState<number>(30);

  // Synchronize tutorial banner visibility when user changes (different account login/switch)
  useEffect(() => {
    const accountKey = getAccountTutorialKey(user);
    const dismissed = isTutorialDismissedForAccount(accountKey);
    setShowNavTutorial(!dismissed);
  }, [user]);

  const triggerKeyHighlight = useCallback((keyName: "A" | "D" | "Left" | "Right" | "W" | "S" | "Up" | "Down") => {
    const existing = activeKeyTimeoutsRef.current.get(keyName);
    clearTimeout(existing);
    setActivePressedKeys(prev => ({ ...prev, [keyName]: true }));
    const timer = setTimeout(() => {
      setActivePressedKeys(prev => {
        const next = { ...prev };
        delete next[keyName];
        return next;
      });
      activeKeyTimeoutsRef.current.delete(keyName);
    }, 400);
    activeKeyTimeoutsRef.current.set(keyName, timer);
  }, []);

  const isHorizontalActive = Boolean(
    activePressedKeys["A"] || activePressedKeys["D"] || activePressedKeys["Left"] || activePressedKeys["Right"]
  );
  const isVerticalActive = Boolean(
    activePressedKeys["W"] || activePressedKeys["S"] || activePressedKeys["Up"] || activePressedKeys["Down"]
  );

  const handleDismissTutorial = useCallback(() => {
    setShowNavTutorial(false);
    const accountKey = getAccountTutorialKey(user);
    saveTutorialDismissedForAccount(accountKey, true);
  }, [user]);

  const handleToggleTutorial = useCallback(() => {
    setShowNavTutorial((prev) => {
      const next = !prev;
      const accountKey = getAccountTutorialKey(user);
      if (!next) {
        saveTutorialDismissedForAccount(accountKey, true);
      }
      return next;
    });
  }, [user]);

  // 30s auto-dismiss countdown timer when tutorial popup is visible
  useEffect(() => {
    if (!showNavTutorial) return;
    setTutorialCountdown(30);
    const interval = setInterval(() => {
      setTutorialCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismissTutorial();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showNavTutorial, handleDismissTutorial]);

  // Listen to open-accounts-center event from Navbar
  useEffect(() => {
    const handleOpenAccountsCenter = (e: any) => {
      const targetTab = e.detail?.tab;
      if (targetTab) {
        setActiveModalTab(targetTab);
      }
      setIsAccountsCenterOpen(true);
    };
    const getBasePath = () => {
      if (typeof window === "undefined") return "/m";
      const p = window.location.pathname.toLowerCase().replace(/\/$/, "");
      return ["/profile", "/account", "/accounts", "/me"].includes(p) ? "/m" : (p || "/m");
    };

    const handleCloseAccountsCenter = () => {
      setIsAccountsCenterOpen(false);
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(null, "", getBasePath() + window.location.search);
      }
    };
    window.addEventListener("open-accounts-center", handleOpenAccountsCenter);
    window.addEventListener("close-accounts-center", handleCloseAccountsCenter);

    const validTabs = ["profile", "addresses", "sessions", "bookmarks"];
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (validTabs.includes(hash)) {
        setActiveModalTab(hash as any);
        setIsAccountsCenterOpen(true);
      }
    }

    return () => {
      window.removeEventListener("open-accounts-center", handleOpenAccountsCenter);
      window.removeEventListener("close-accounts-center", handleCloseAccountsCenter);
    };
  }, []);

  // Sync URL hash with Accounts Center modal state & remove hash when closed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const base = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const safeBase = ["/profile", "/account", "/accounts", "/me"].includes(base) ? "/m" : (base || "/m");

    if (!isAccountsCenterOpen) {
      if (window.location.hash) {
        window.history.replaceState(null, "", safeBase + window.location.search);
      }
    } else if (activeModalTab) {
      window.history.replaceState(null, "", `${safeBase}#${activeModalTab}${window.location.search}`);
    }
  }, [isAccountsCenterOpen, activeModalTab]);

  // Handle Escape key and browser back button (hashchange)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAccountsCenterOpen) {
        setIsAccountsCenterOpen(false);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validTabs = ["profile", "addresses", "sessions", "bookmarks"];
      if (validTabs.includes(hash)) {
        setActiveModalTab(hash as any);
        setIsAccountsCenterOpen(true);
      } else if (!hash && isAccountsCenterOpen) {
        setIsAccountsCenterOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [isAccountsCenterOpen]);

  // Load bookmarks with real API (sắp xếp các gói mới nhất lên trên)
  const loadUserBookmarks = async (showLoading = false) => {
    if (showLoading) setIsBookmarksLoading(true);
    try {
      const list = await getAllBookmarks();
      setUserBookmarks(sortBookmarksNewestFirst(list));
    } catch (err: any) {
      console.warn("Lỗi tải bookmarks từ API:", err);
    } finally {
      if (showLoading) setIsBookmarksLoading(false);
    }
  };

  useEffect(() => {
    loadUserBookmarks();
    const unsub = subscribeBookmarkUpdates(() => {
      loadUserBookmarks();
    });
    return () => unsub();
  }, []);

  // Re-fetch fresh bookmarks whenever user navigates to the bookmarks tab
  useEffect(() => {
    if (activeModalTab === "bookmarks") {
      loadUserBookmarks(true);
    }
  }, [activeModalTab]);

  // Re-fetch fresh sessions whenever user navigates to the sessions tab or opens Accounts Center
  useEffect(() => {
    if (activeModalTab === "sessions" && isAccountsCenterOpen) {
      loadDeviceSessions();
    }
  }, [activeModalTab, isAccountsCenterOpen, loadDeviceSessions]);

  // Real Bookmark API Actions
  const handleRemoveBookmarkItem = async (mainSku: string, itemSku: string, itemName?: string) => {
    setBookmarkActionLoading(`${mainSku}::${itemSku}`);
    try {
      await removeBookmarkItem(mainSku, itemSku);
      await loadUserBookmarks(false);
      setSuccessMsg(`Đã xóa "${itemName || itemSku}" khỏi danh sách đã lưu`);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi xóa sản phẩm khỏi danh sách đã lưu");
    } finally {
      setBookmarkActionLoading("");
    }
  };

  const handleClearBookmarkPackage = async (mainSku: string) => {
    setBookmarkActionLoading(mainSku);
    try {
      await clearBookmark(mainSku);
      await loadUserBookmarks(false);
      setSuccessMsg(`Đã xóa gói đã lưu thành công`);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi xóa gói đã lưu");
    } finally {
      setBookmarkActionLoading("");
    }
  };

  const handleExtendBookmarkPackage = async (mainSku: string) => {
    setBookmarkActionLoading(`extend::${mainSku}`);
    try {
      await persistStagedBookmark(mainSku);
      await loadUserBookmarks(false);
      setSuccessMsg(`Đã gia hạn lưu 7 ngày thành công`);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi gia hạn lưu 7 ngày");
    } finally {
      setBookmarkActionLoading("");
    }
  };

  const handleCheckoutBookmarkPackage = async (bookmark: BookmarkData) => {
    setBookmarkActionLoading(`checkout::${bookmark.mainSku}`);
    try {
      const cartItems: { sku: string; quantity: number }[] = [];
      const isPackageWrapper = !bookmark.mainSku || 
        bookmark.mainSku.toLowerCase() === "bookmarks" || 
        bookmark.mainSku.startsWith("ORDER-") || 
        bookmark.mainSku.startsWith("ATTR-") || 
        (bookmark.items && bookmark.items.some(i => i.sku === bookmark.mainSku));

      if (!isPackageWrapper) {
        cartItems.push({ sku: bookmark.mainSku, quantity: 1 });
      }
      if (bookmark.items && bookmark.items.length > 0) {
        for (const it of bookmark.items) {
          cartItems.push({ sku: it.sku, quantity: it.quantity || 1 });
        }
      }
      if (cartItems.length > 0) {
        await addToCart(cartItems);
        setSuccessMsg(`Đã chuyển ${bookmark.totalItems || bookmark.items.length} món vào giỏ hàng!`);
      }
      setIsAccountsCenterOpen(false);
      onNavigate("cart");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi thêm sản phẩm vào giỏ hàng");
    } finally {
      setBookmarkActionLoading("");
    }
  };

  const getFriendlyMainSkuName = (sku: string, items?: BookmarkItem[]): string => {
    if (!sku || sku.toLowerCase() === "bookmarks") return "Gói sản phẩm & phụ kiện đã lưu";

    // 1. If items exist and first item has valid productName, use it
    if (items && items.length > 0 && items[0].productName) {
      if (items.length === 1 || sku.startsWith("ATTR-") || sku.startsWith("ORDER-") || sku.startsWith("bm-")) {
        return items[0].productName;
      }
    }

    const map: Record<string, string> = {
      "OPPO-FIND-X8-PRO-BLK": "OPPO Find X8 Pro (Đen)",
      "AW-ULTRA-2": "Apple Watch Ultra 2 (Titan)",
      "MACBOOK-PRO-M3-MAX": "MacBook Pro M3 Max",
      "IPHONE-16-PRO-MAX-DESERT": "iPhone 16 Pro Max (Titan)",
      "SONY-WH1000XM6-BLK": "Sony WH-1000XM6 (Đen)",
      "ATTR-LENTABEXT2-GRAY-12-256": "Lenovo Legion Tab Gen 2",
    };
    if (map[sku]) return map[sku];

    const s = (sku || "").toUpperCase();
    if (s.includes("LENTAB") || s.includes("LEGION") || s.includes("LENOVO")) return "Lenovo Legion Tab Gen 2";
    if (s.includes("IP16PM") || s.includes("IPHONE 16") || s.includes("IPHONE16")) return "iPhone 16 Pro Max";
    if (s.includes("IP15PM") || s.includes("IPHONE 15") || s.includes("IPHONE15")) return "iPhone 15 Pro Max";
    if (s.includes("S24U") || s.includes("S25U") || s.includes("SAMSUNG") || s.includes("GALAXY S24")) return "Samsung Galaxy S24 Ultra";
    if (s.includes("MI14U") || s.includes("MI15U") || s.includes("XIAOMI")) return "Xiaomi 14 Ultra";
    if (s.includes("MBP") || s.includes("MACBOOK")) return "MacBook Pro M4";
    if (s.includes("XPS") || s.includes("DELL")) return "Dell XPS 16";
    if (s.includes("IPAD")) return "iPad Pro M4";
    if (s.includes("TABS10") || s.includes("TAB S10")) return "Samsung Galaxy Tab S10 Ultra";
    if (s.includes("AIRPOD") || s.includes("TAI NGHE")) return "AirPods Pro Gen 2";

    return sku.replace(/^ATTR-/, "").replace(/[-_]+/g, " ");
  };

  // Error / Success Messages
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Profile Edit fields
  const [editFullName, setEditFullName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editGender, setEditGender] = useState<string>("");
  const [editDateOfBirth, setEditDateOfBirth] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);


  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const isProfileDirty = Boolean(user && (
    editFullName.trim() !== (user.fullName || "").trim() ||
    editPhone.trim() !== (user.phoneNumber || "").trim() ||
    editGender.toLowerCase() !== (user.gender || "").toLowerCase() ||
    editDateOfBirth.trim() !== (user.dateOfBirth ? String(user.dateOfBirth).split("T")[0] : "").trim() ||
    editAvatarUrl.trim() !== (user.avatarUrl || "").trim()
  ));


  // Compute Birthday Celebration Flags & Countdown purely from dateOfBirth
  const birthdayInfo = useMemo(() => {
    if (!user?.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(String(user.dateOfBirth).split("T")[0])) {
      return { isBirthdayToday: false, isBirthdayMonth: false, daysUntilBirthday: null };
    }
    const dobStr = String(user.dateOfBirth).split("T")[0];
    const [, m, d] = dobStr.split("-").map(Number);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curDay = now.getDate();

    const isToday = curMonth === m && curDay === d;
    const isMonth = curMonth === m;

    let nextBday = new Date(curYear, m - 1, d);
    const today = new Date(curYear, curMonth - 1, curDay);
    if (nextBday.getTime() < today.getTime()) {
      nextBday = new Date(curYear + 1, m - 1, d);
    }
    const diffDays = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { isBirthdayToday: isToday, isBirthdayMonth: isMonth, daysUntilBirthday: diffDays };
  }, [user?.dateOfBirth]);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [editingAddressSku, setEditingAddressSku] = useState<string | null>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    recipientName: "",
    phone: "",
    address: "",
    type: "office" as "home" | "office",
    isDefault: false
  });
  const [resolvedPreview, setResolvedPreview] = useState<ResolvedAddressDto | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const resolveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mapLayer, setMapLayer] = useState<"mapnik" | "hot" | "transport">("mapnik");
  const [isMapActive, setIsMapActive] = useState<boolean>(true);
  const [copiedCoord, setCopiedCoord] = useState<boolean>(false);
  const [mapKey, setMapKey] = useState<number>(0);

  // Real-time Address API response inspector logs state
  const [apiResponseLogs, setApiResponseLogs] = useState<AddressApiResponseLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const [isInspectorExpanded, setIsInspectorExpanded] = useState<boolean>(true);
  const [inspectorTab, setInspectorTab] = useState<"response" | "request">("response");

  // Subscribe to live Address API responses
  useEffect(() => {
    const unsubscribe = subscribeAddressApiLogs((logs) => {
      setApiResponseLogs(logs);
      if (logs.length > 0) {
        setSelectedLogId(prev => {
          if (!prev || !logs.some(l => l.id === prev)) {
            return logs[0].id;
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-dismiss success & error notification banners after a short duration with motion
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleCopyLogJson = (log: AddressApiResponseLog) => {
    const content = inspectorTab === "response" ? log.responseBody : (log.requestBody || {});
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };


  // Orders list, status filter, and active selected order for detail tracking view
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [isOrdersSyncing, setIsOrdersSyncing] = useState<boolean>(false);
  const fetchedOrderDetailsRef = useRef<Set<string>>(new Set());
  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const isOrderDelivered = activeOrder?.status === "delivered";

  // Helper resolver for order color theme: emerald (đã giao), sky (đang giao), indigo (đang xử lý), amber (chờ thanh toán), rose (đã hủy)
  const getOrderColorTheme = (order?: OrderItem | null): "emerald" | "sky" | "indigo" | "amber" | "rose" => {
    if (!order) return "emerald";
    const st = (order.status || "").toLowerCase();
    const text = (order.statusText || "").toLowerCase();

    if (st === "delivered" || st === "completed" || text.includes("giao thành công") || text.includes("kích hoạt thành công") || text.includes("hoàn tất")) {
      return "emerald";
    }
    if (st === "shipped" || text.includes("vận chuyển") || text.includes("đang giao")) {
      return "sky";
    }
    if (st === "processing" || st === "confirmed" || text.includes("xử lý") || text.includes("bảo hành") || text.includes("kiểm thử")) {
      return "indigo";
    }
    if (st === "pending" || st === "waiting_payment" || st === "verifying" || text.includes("chờ") || text.includes("xác nhận") || text.includes("xác thực") || text.includes("chờ duyệt") || text.includes("chờ xác")) {
      return "amber";
    }
    if (st === "cancelled" || st === "refunded" || text.includes("hủy") || text.includes("hoàn tiền")) {
      return "rose";
    }
    return "indigo";
  };

  const orderTheme = getOrderColorTheme(activeOrder);
  const activeStepIndex = (activeOrder?.deliverySteps || []).findIndex(s => s.active);
  const lastCompletedIndex = (activeOrder?.deliverySteps || []).map(s => s.completed).lastIndexOf(true);
  const endpointIndex = activeStepIndex !== -1 ? activeStepIndex : (lastCompletedIndex !== -1 ? lastCompletedIndex : 0);

  // Điểm 1: Khi đang ở endpoint status thì chỉ hiển thị duy nhất 1 status chờ sẵn (1 status xám)
  const displayedSteps = !activeOrder ? [] : isOrderDelivered 
    ? (activeOrder.deliverySteps || [])
    : (activeOrder.deliverySteps || []).slice(0, Math.min(activeOrder.deliverySteps?.length || 0, endpointIndex + 2));

  // Helper lọc và phân loại trạng thái an toàn tuyệt đối
  const matchesStatusFilter = (order: OrderItem, filter: StatusFilterType): boolean => {
    if (!order) return false;
    if (filter === "ALL") return true;

    const st = (order.status || "").toLowerCase();
    const text = typeof order.statusText === "string" ? order.statusText.toLowerCase() : "";
    const rawSt = typeof (order as any).rawOrder?.currentStatus === "string" ? (order as any).rawOrder.currentStatus.toUpperCase() : "";

    if (filter === "PENDING") {
      return st === "pending" || rawSt === "WAITING_PAYMENT" || rawSt === "PENDING" || text.includes("chờ") || text.includes("thanh toán");
    }
    if (filter === "PROCESSING") {
      return st === "processing" || rawSt === "PROCESSING" || rawSt === "CONFIRMED" || text.includes("xử lý") || text.includes("chuẩn bị");
    }
    if (filter === "SHIPPED") {
      return st === "shipped" || rawSt === "SHIPPING" || rawSt === "SHIPPED" || text.includes("vận chuyển") || text.includes("giao");
    }
    if (filter === "DELIVERED") {
      return st === "delivered" || rawSt === "DELIVERED" || rawSt === "COMPLETED" || text.includes("thành công") || text.includes("hoàn tất");
    }
    if (filter === "CANCELLED") {
      return st === "cancelled" || rawSt === "CANCELLED" || text.includes("hủy") || text.includes("hoàn tiền");
    }
    return true;
  };

  // Helper tính toán số lượng cho từng bộ lọc trạng thái
  const getFilterCount = (filterId: StatusFilterType): number => {
    if (filterId === "ALL") return orders.length;
    return orders.filter(o => matchesStatusFilter(o, filterId)).length;
  };

  const filteredOrders = orders.filter(item => matchesStatusFilter(item, statusFilter));

  const activeTheme = getOrderStatusTheme(activeOrder?.statusText || activeOrder?.status);

  // Scroll fades & keyboard navigation for filter pills bar
  const [showFilterLeftFade, setShowFilterLeftFade] = useState<boolean>(false);
  const [showFilterRightFade, setShowFilterRightFade] = useState<boolean>(true);
  const filterPillsRef = useRef<HTMLDivElement>(null);
  const ordersListContainerRef = useRef<HTMLDivElement>(null);

  const handleFilterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollLeft = target.scrollLeft;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    setShowFilterLeftFade(scrollLeft > 4);
    setShowFilterRightFade(scrollLeft < maxScroll - 4);
  };


  // Scroll fades state for orders list container
  const [showTopFade, setShowTopFade] = useState<boolean>(false);
  const [showBottomFade, setShowBottomFade] = useState<boolean>(true);

  // Scroll fades state for shipping steps container
  const [showStepsTopFade, setShowStepsTopFade] = useState<boolean>(false);
  const [showStepsBottomFade, setShowStepsBottomFade] = useState<boolean>(false);

  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const endpointStepRef = useRef<HTMLDivElement>(null);

  // Copied tracking feedback
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyTracking = (trackingNumber: string) => {
    if (!trackingNumber) return;
    navigator.clipboard?.writeText(trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleCopyOrderId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Scroll handler to dynamically show/hide top and bottom fade indicators for orders list
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    
    setShowTopFade(scrollTop > 5);
    setShowBottomFade(scrollTop < maxScroll - 5);
  };

  // Scroll handler for shipping steps
  const handleStepsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
    
    setShowStepsTopFade(maxScroll > 12 && scrollTop > 8);
    setShowStepsBottomFade(maxScroll > 12 && scrollTop < maxScroll - 12);
  };

  // Đồng bộ danh sách đơn hàng từ GraphQL Gateway
  const syncOrdersFromGraphQL = useCallback(async (filter: StatusFilterType = "ALL") => {
    setIsOrdersSyncing(true);
    try {
      const res = await getMyOrders({
        status: filter !== "ALL" ? (filter as OrderStatus) : undefined,
        page: 1,
        size: 50,
        sortBy: "auditInfo.createdAt",
        sortDirection: "DESC",
      });

      if (res?.data?.contents) {
        const serverOrders = res.data.contents.map(normalizeSummaryToUiItem);
        setOrders(prevOrders => {
          const cleanPrev = prevOrders.filter(o => o.id && !o.id.startsWith("HZ-"));
          let merged: UiOrderItem[];
          
          if (filter === "ALL") {
            merged = serverOrders.map(so => {
              const localOrder = cleanPrev.find(o => o.id === so.id);
              if (!localOrder) return so;
              return {
                ...so,
                shippingAddress: (localOrder.shippingAddress && localOrder.shippingAddress !== "Đang tải địa chỉ nhận hàng...") ? localOrder.shippingAddress : so.shippingAddress,
                deliverySteps: (localOrder.deliverySteps && localOrder.deliverySteps.length > 0) ? localOrder.deliverySteps : so.deliverySteps,
                rawOrder: localOrder.rawOrder || so.rawOrder,
                orderItemsList: localOrder.orderItemsList || so.orderItemsList
              };
            });
          } else {
            // Upsert / Merge single-status orders into existing order pool without wiping other tab counts
            const map = new Map<string, UiOrderItem>();
            cleanPrev.forEach(o => map.set(o.id, o));
            serverOrders.forEach(so => {
              const existing = map.get(so.id);
              if (existing) {
                const resolvedName = resolveAttributeDisplayName(so.name || existing.name, null, so.id);
                map.set(so.id, {
                  ...existing,
                  ...so,
                  name: resolvedName,
                  shippingAddress: (existing.shippingAddress && existing.shippingAddress !== "Đang tải địa chỉ nhận hàng...") ? existing.shippingAddress : (so.shippingAddress || existing.shippingAddress),
                  deliverySteps: (existing.deliverySteps && existing.deliverySteps.length > 0) ? existing.deliverySteps : so.deliverySteps,
                  rawOrder: existing.rawOrder || so.rawOrder,
                  orderItemsList: existing.orderItemsList || so.orderItemsList
                });
              } else {
                map.set(so.id, so);
              }
            });
            merged = Array.from(map.values());
          }

          saveCachedOrders(merged);
          return merged;
        });

        if (serverOrders.length > 0) {
          setSelectedOrderId(prev => {
            if (!prev || !serverOrders.some(o => o.id === prev)) {
              return serverOrders[0].id;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn("GraphQL sync orders error:", err);
    } finally {
      setIsOrdersSyncing(false);
    }
  }, []);

  // Lấy chi tiết đơn hàng (orderItems, statusHistory, paymentMethod) từ GraphQL
  const fetchOrderDetailFromGateway = useCallback(async (orderId: string) => {
    if (!orderId || fetchedOrderDetailsRef.current.has(orderId)) return;
    fetchedOrderDetailsRef.current.add(orderId);
    try {
      const detailDto = await getOrderDetail(orderId);
      if (detailDto && detailDto.orderNumber) {
        const detailedUiItem = normalizeOrderDtoToUiItem(detailDto);
        setOrders(prev => {
          const next = prev.map(o => o.id === orderId ? {
            ...o,
            ...detailedUiItem,
            name: resolveAttributeDisplayName(detailedUiItem.name || o.name, null, orderId)
          } : o);
          saveCachedOrders(next);
          return next;
        });
      }
    } catch (err) {
      console.warn("GraphQL fetch order detail error:", err);
    }
  }, []);

  const handleSelectOrder = (orderId: string) => {
    if (!orderId) return;
    setSelectedOrderId(orderId);
    if (!fetchedOrderDetailsRef.current.has(orderId)) {
      fetchOrderDetailFromGateway(orderId);
    }
  };

  const scrollToEndpoint = useCallback(() => {
    if (stepsContainerRef.current) {
      const container = stepsContainerRef.current;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      if (maxScroll > 0) {
        container.scrollTo({ top: maxScroll, behavior: "smooth" });
        setShowStepsTopFade(maxScroll > 12);
        setShowStepsBottomFade(false);
      } else {
        setShowStepsTopFade(false);
        setShowStepsBottomFade(false);
      }
    }
  }, []);

  // Callback ref: Khi mốc endpoint được mount vào DOM
  const setEndpointRef = useCallback((el: HTMLDivElement | null) => {
    endpointStepRef.current = el;
    if (el) {
      requestAnimationFrame(() => {
        scrollToEndpoint();
      });
    }
  }, [scrollToEndpoint]);

  // Luôn chuyển tới endpoint status và cập nhật dải ám mờ
  useEffect(() => {
    if (!selectedOrderId) return;
    const rafId = requestAnimationFrame(scrollToEndpoint);
    const t1 = setTimeout(scrollToEndpoint, 80);
    const t2 = setTimeout(scrollToEndpoint, 260);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedOrderId, activeOrder?.id, scrollToEndpoint]);

  // On mount, load token, validate user, and seed/load order data
  useEffect(() => {
    loadProfileAndOrders();
  }, []);

  // Smart Interval Polling for active order tracking & background refresh
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const hasActiveOrders = orders.some(o => o.status === "pending" || o.status === "processing" || o.status === "shipped");
        if (hasActiveOrders) {
          syncOrdersFromGraphQL(statusFilter);
          if (selectedOrderId) {
            fetchOrderDetailFromGateway(selectedOrderId);
          }
        }
      }
    }, 25000);

    return () => clearInterval(pollInterval);
  }, [orders, statusFilter, selectedOrderId, syncOrdersFromGraphQL, fetchOrderDetailFromGateway]);

  // Auto scroll active filter pill into visible area when statusFilter changes
  useEffect(() => {
    if (!filterPillsRef.current) return;
    const container = filterPillsRef.current;
    const activeBtn = container.querySelector(`[data-filter-id="${statusFilter}"]`) as HTMLElement;
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;

      if (btnLeft < containerScroll) {
        container.scrollTo({ left: Math.max(0, btnLeft - 16), behavior: "smooth" });
      } else if (btnLeft + btnWidth > containerScroll + containerWidth) {
        container.scrollTo({ left: btnLeft + btnWidth - containerWidth + 16, behavior: "smooth" });
      }
    }
  }, [statusFilter]);

  const handleFilterChange = (filterId: StatusFilterType) => {
    setStatusFilter(filterId);
    const matching = orders.filter(item => matchesStatusFilter(item, filterId));
    if (matching.length > 0) {
      const isCurrentValid = matching.some(o => o.id === selectedOrderId);
      if (!isCurrentValid) {
        const firstId = matching[0].id;
        setSelectedOrderId(firstId);
        if (!fetchedOrderDetailsRef.current.has(firstId)) {
          fetchOrderDetailFromGateway(firstId);
        }
      }
    } else {
      setSelectedOrderId("");
    }
  };

  // Tự động chọn (Select) thẻ đơn hàng đầu tiên:
  // 1. Ngay khi load trang / mount component hoặc khi orders được nạp từ cache/API
  // 2. Mỗi khi người dùng chuyển đổi tab lọc trạng thái (luôn chọn card đầu tiên của tab mới)
  // 3. Khi đơn hàng đang chọn không còn tồn tại hoặc không khớp với tab hiện tại
  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrderId("");
      return;
    }

    const matchingOrders = orders.filter(item => matchesStatusFilter(item, statusFilter));

    if (matchingOrders.length > 0) {
      const isCurrentSelectedValid = matchingOrders.some(o => o.id === selectedOrderId);
      
      if (!selectedOrderId || !isCurrentSelectedValid) {
        const firstOrder = matchingOrders[0];
        setSelectedOrderId(firstOrder.id);
        if (!fetchedOrderDetailsRef.current.has(firstOrder.id)) {
          fetchOrderDetailFromGateway(firstOrder.id);
        }
      }
    } else {
      setSelectedOrderId("");
    }
  }, [statusFilter, orders, selectedOrderId, fetchOrderDetailFromGateway]);

  // Keyboard navigation:
  // 1. A / D hoặc Mũi tên Trái / Phải: Chuyển đổi Filter Tab ngang
  // 2. W / S hoặc Mũi tên Lên / Xuống: Di chuyển chọn thẻ đơn hàng dọc và tự động cuộn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea or select
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT")) {
        return;
      }

      const key = e.key;
      const code = e.code;

      // 1. Horizontal Navigation: A / D / ArrowLeft / ArrowRight
      if (key === "a" || key === "A" || code === "KeyA") {
        triggerKeyHighlight("A");
        e.preventDefault();
        const currentIndex = STATUS_FILTER_OPTIONS.findIndex(opt => opt.id === statusFilter);
        if (currentIndex > 0) {
          const nextFilter = STATUS_FILTER_OPTIONS[currentIndex - 1].id;
          handleFilterChange(nextFilter);
        }
      } else if (key === "d" || key === "D" || code === "KeyD") {
        triggerKeyHighlight("D");
        e.preventDefault();
        const currentIndex = STATUS_FILTER_OPTIONS.findIndex(opt => opt.id === statusFilter);
        if (currentIndex >= 0 && currentIndex < STATUS_FILTER_OPTIONS.length - 1) {
          const nextFilter = STATUS_FILTER_OPTIONS[currentIndex + 1].id;
          handleFilterChange(nextFilter);
        }
      } else if (key === "ArrowLeft" || code === "ArrowLeft") {
        triggerKeyHighlight("Left");
        e.preventDefault();
        const currentIndex = STATUS_FILTER_OPTIONS.findIndex(opt => opt.id === statusFilter);
        if (currentIndex > 0) {
          const nextFilter = STATUS_FILTER_OPTIONS[currentIndex - 1].id;
          handleFilterChange(nextFilter);
        }
      } else if (key === "ArrowRight" || code === "ArrowRight") {
        triggerKeyHighlight("Right");
        e.preventDefault();
        const currentIndex = STATUS_FILTER_OPTIONS.findIndex(opt => opt.id === statusFilter);
        if (currentIndex >= 0 && currentIndex < STATUS_FILTER_OPTIONS.length - 1) {
          const nextFilter = STATUS_FILTER_OPTIONS[currentIndex + 1].id;
          handleFilterChange(nextFilter);
        }
      }

      // 2. Vertical Navigation: W / S / ArrowUp / ArrowDown
      else if (key === "w" || key === "W" || code === "KeyW") {
        triggerKeyHighlight("W");
        e.preventDefault();
        if (filteredOrders.length > 0) {
          const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrderId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          const targetOrder = filteredOrders[prevIndex];
          if (targetOrder && targetOrder.id !== selectedOrderId) {
            handleSelectOrder(targetOrder.id);
            requestAnimationFrame(() => {
              const el = ordersListContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`) as HTMLElement;
              el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
        }
      } else if (key === "ArrowUp" || code === "ArrowUp") {
        triggerKeyHighlight("Up");
        e.preventDefault();
        if (filteredOrders.length > 0) {
          const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrderId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          const targetOrder = filteredOrders[prevIndex];
          if (targetOrder && targetOrder.id !== selectedOrderId) {
            handleSelectOrder(targetOrder.id);
            requestAnimationFrame(() => {
              const el = ordersListContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`) as HTMLElement;
              el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
        }
      } else if (key === "s" || key === "S" || code === "KeyS") {
        triggerKeyHighlight("S");
        e.preventDefault();
        if (filteredOrders.length > 0) {
          const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrderId);
          const nextIndex = currentIndex >= 0 && currentIndex < filteredOrders.length - 1 ? currentIndex + 1 : filteredOrders.length - 1;
          const targetOrder = filteredOrders[nextIndex];
          if (targetOrder && targetOrder.id !== selectedOrderId) {
            handleSelectOrder(targetOrder.id);
            requestAnimationFrame(() => {
              const el = ordersListContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`) as HTMLElement;
              el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
        }
      } else if (key === "ArrowDown" || code === "ArrowDown") {
        triggerKeyHighlight("Down");
        e.preventDefault();
        if (filteredOrders.length > 0) {
          const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrderId);
          const nextIndex = currentIndex >= 0 && currentIndex < filteredOrders.length - 1 ? currentIndex + 1 : filteredOrders.length - 1;
          const targetOrder = filteredOrders[nextIndex];
          if (targetOrder && targetOrder.id !== selectedOrderId) {
            handleSelectOrder(targetOrder.id);
            requestAnimationFrame(() => {
              const el = ordersListContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`) as HTMLElement;
              el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statusFilter, orders, selectedOrderId, filteredOrders, fetchOrderDetailFromGateway, triggerKeyHighlight]);



  const loadProfileAndOrders = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 
                         localStorage.getItem("horizon_current_user") ||
                         localStorage.getItem("currentUser") ||
                         localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 
                         localStorage.getItem("horizon_redis_profile");
      const currentToken = getUnifiedAccessToken();
      if (currentToken) {
        setToken(currentToken);
      }

      let localUser = null;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && typeof parsed === "object") {
            localUser = parsed.user || parsed;
            setUser(localUser);
          }
        } catch {}
      }

      // Initialize real order history from cache & GraphQL Gateway
      const cachedOrders = getCachedOrders();
      let activeOrders: OrderItem[] = Array.isArray(cachedOrders) ? cachedOrders : [];

      // Clean up any obsolete mock IDs or outdated cached dates
      activeOrders = activeOrders
        .filter(o => o.id && !o.id.startsWith("HZ-"))
        .map(o => {
          const rawDate = o.rawOrder?.createdAt;
          const freshDateStr = rawDate ? formatDateDisplay(rawDate) : (o.date && !o.date.includes("21/09/2026") ? o.date : "");
          return {
            ...o,
            date: freshDateStr,
            name: resolveAttributeDisplayName(o.name, null, o.id)
          };
        });

      setOrders(activeOrders);
      if (activeOrders.length > 0) {
        setSelectedOrderId(activeOrders[0].id);
      }

      // Kích hoạt đồng bộ GraphQL Order live
      syncOrdersFromGraphQL("ALL");

      // Cho phép hiển thị giao diện ngay lập tức thay vì bắt người dùng chờ API
      setIsLoading(false);

      // Đồng bộ thông tin profile trực tiếp từ getMyProfile / GraphQL me
      getMyProfile()
        .then((response) => {
          if (response && response.data) {
            const fetchedUser = response.data;
            setUser(fetchedUser);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fetchedUser));
            localStorage.setItem("horizon_current_user", JSON.stringify(fetchedUser));
          }
        })
        .catch((err) => {
          console.warn("REST getMyProfile failed, trying GraphQL me in background...", err);
          if (currentToken) {
            unifiedFetch("/graphql", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
              },
              body: JSON.stringify({
                query: `
                  query {
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
                        avatarUrl
                        usernameCooldownUntil
                        dateOfBirth
                        gender
                        rank
                        status
                        roles
                    }
                  }
                `
              })
            })
            .then(res => res.json())
            .then(resJson => {
              const meData = resJson?.data?.me;
              if (meData && meData.status?.code === 200 && meData.data) {
                const fetchedUser = meData.data;
                setUser(fetchedUser);
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fetchedUser));
                localStorage.setItem("horizon_current_user", JSON.stringify(fetchedUser));
              }
            })
            .catch(gqlErr => {
              console.warn("GraphQL me query also failed:", gqlErr);
            });
          }
        });
      // Initialize saved addresses via addressService
      try {
        const loadedAddresses = await getMyAddresses();
        setAddresses(loadedAddresses);
      } catch (addrErr) {
        console.warn("Could not load addresses:", addrErr);
      }

    } catch (e) {
      console.error("Error loading profile:", e);
      setErrorMsg("Lỗi hệ thống khi tải thông tin tài khoản.");
      setIsLoading(false);
    }
  };

  // Sync edit profile form whenever user object updates
  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditPhone(user.phoneNumber || "");
      setEditGender(user.gender ? user.gender.toLowerCase() : "");
      if (user.dateOfBirth) {
        const rawDob = String(user.dateOfBirth);
        const ymd = rawDob.split("T")[0];
        setEditDateOfBirth(ymd);
      } else {
        setEditDateOfBirth("");
      }
      setEditAvatarUrl(user.avatarUrl || "");
      if (addresses.length > 0 && !newAddressForm.recipientName) {
        setNewAddressForm(prev => ({ ...prev, recipientName: user.fullName || "", phone: user.phoneNumber || "" }));
      }
    }
  }, [user]);

  // Handler for Profile Information Update via PUT /api/auth/me
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setErrorMsg("Họ và tên không được để trống.");
      return;
    }

    if (editDateOfBirth.trim()) {
      const parts = editDateOfBirth.trim().split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [y, m, d] = parts;
        const today = new Date();
        let age = today.getFullYear() - y;
        const monthDiff = today.getMonth() + 1 - m;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
          age--;
        }
        if (age < 13) {
          setErrorMsg("Hội viên phải từ 13 tuổi trở lên.");
          return;
        }
      }
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const cleanDob = editDateOfBirth.trim() ? editDateOfBirth.trim().split("T")[0] : undefined;
      const payload: UpdateProfileRequest = {
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        dateOfBirth: cleanDob,
        avatarUrl: editAvatarUrl.trim() || undefined,
        gender: editGender.toUpperCase()
      };

      let responseData: Record<string, unknown> | null = null;
      try {
        const res = await updateMyProfile(payload);
        if (res?.data && typeof res.data === "object") {
          responseData = res.data as Record<string, unknown>;
        }
      } catch (apiErr: unknown) {
        const msg = apiErr instanceof Error ? apiErr.message : "Gateway error";
        console.warn("[Profile Update] API Gateway note:", msg);
      }

      const updatedUser = {
        ...user,
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        gender: editGender,
        dateOfBirth: cleanDob || user?.dateOfBirth,
        avatarUrl: editAvatarUrl.trim() || user?.avatarUrl,
        ...(responseData || {})
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      localStorage.setItem("horizon_current_user", JSON.stringify(updatedUser));

      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      if (storedProfile) {
        const prof = JSON.parse(storedProfile) as Record<string, unknown>;
        const updatedProf = {
          ...prof,
          fullName: editFullName.trim(),
          phoneNumber: editPhone.trim(),
          gender: editGender,
          dateOfBirth: cleanDob || prof.dateOfBirth,
          avatarUrl: editAvatarUrl.trim() || prof.avatarUrl,
          ...(responseData || {})
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProf));
        localStorage.setItem("horizon_redis_profile", JSON.stringify(updatedProf));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      const syncTimeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(syncTimeStr);
      setSuccessMsg("Cập nhật thông tin hồ sơ thành công!");
      logAuditAction("UPDATE_PROFILE", "SUCCESS", `Cập nhật hồ sơ: ${editFullName.trim()}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      setErrorMsg("Không thể cập nhật thông tin: " + errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for Immediate Birthday Update via PUT /api/auth/me (Triggered on OK in Birthday Popup)
  const handleSaveBirthdayImmediate = async (dateIso: string) => {
    try {
      const cleanDob = dateIso.trim() ? dateIso.trim().split("T")[0] : undefined;
      const payload: UpdateProfileRequest = {
        fullName: editFullName.trim() || user?.fullName || "Hội viên",
        phoneNumber: editPhone.trim() || user?.phoneNumber || "",
        dateOfBirth: cleanDob,
        avatarUrl: editAvatarUrl.trim() || user?.avatarUrl || undefined,
        gender: (editGender || user?.gender || "").toUpperCase()
      };

      let responseData: any = null;
      try {
        const res = await updateMyProfile(payload);
        if (res?.data) {
          responseData = res.data;
        }
      } catch (apiErr: any) {
        console.warn("[Birthday Immediate Update] API Gateway note:", apiErr.message);
      }

      const updatedUser = {
        ...user,
        dateOfBirth: cleanDob || user?.dateOfBirth,
        ...(responseData || {})
      };
      setUser(updatedUser);
      setEditDateOfBirth(cleanDob || "");
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      localStorage.setItem("horizon_current_user", JSON.stringify(updatedUser));

      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        const updatedProf = {
          ...prof,
          dateOfBirth: cleanDob || prof.dateOfBirth,
          ...(responseData || {})
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProf));
        localStorage.setItem("horizon_redis_profile", JSON.stringify(updatedProf));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      const syncTimeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(syncTimeStr);
      setSuccessMsg("Đã cập nhật ngày sinh thành công!");
      setErrorMsg("");
      logAuditAction("UPDATE_BIRTHDAY", "SUCCESS", `Cập nhật ngày sinh: ${cleanDob}`);
    } catch (err: any) {
      setErrorMsg("Không thể cập nhật ngày sinh: " + (err.message || "Lỗi không xác định"));
    }
  };



  // Handler for Avatar File Upload via POST /api/auth/me/avatar
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const objectUrl = URL.createObjectURL(file);
      setEditAvatarUrl(objectUrl);

      let serverAvatarUrl = objectUrl;
      try {
        const res = await uploadAvatar(file);
        if (res?.data?.avatarUrl) {
          serverAvatarUrl = res.data.avatarUrl;
          setEditAvatarUrl(serverAvatarUrl);
        }
      } catch (err: any) {
        console.warn("[Avatar Upload] Using local preview URL:", err.message);
      }

      const updatedUser = {
        ...user,
        avatarUrl: serverAvatarUrl
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      localStorage.setItem("horizon_current_user", JSON.stringify(updatedUser));

      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        prof.avatarUrl = serverAvatarUrl;
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(prof));
        localStorage.setItem("horizon_redis_profile", JSON.stringify(prof));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setSuccessMsg("Tải ảnh đại diện thành công!");
      logAuditAction("UPLOAD_AVATAR", "SUCCESS", `Cập nhật ảnh đại diện: ${file.name}`);
    } catch (err: any) {
      setErrorMsg("Lỗi khi tải ảnh: " + (err.message || "Không thể tải file"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };



  // Handler for Resetting Profile Form
  const handleResetProfileForm = () => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditPhone(user.phoneNumber || "");
      setEditGender(user.gender ? user.gender.toLowerCase() : "");
      setEditDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).split("T")[0] : "");
      setEditAvatarUrl(user.avatarUrl || "");
      setSuccessMsg("Đã khôi phục thông tin ban đầu.");
    }
  };

  // Handler for Address Book: Save (Create or Update) Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.recipientName.trim() || !newAddressForm.phone.trim() || !newAddressForm.address.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Tự động chuẩn đoán / Geocoding & Chuẩn hóa định dạng khi bấm Lưu / Cập nhật
      let currentResolved = resolvedPreview;
      const trimmedAddress = newAddressForm.address.trim();

      if (!currentResolved || currentResolved.rawAddress !== trimmedAddress) {
        setIsResolvingAddress(true);
        try {
          const res = await resolveAddress(trimmedAddress);
          if (res) {
            currentResolved = res;
            setResolvedPreview(res);
          }
        } catch (resolveErr) {
          console.warn("Auto-resolve during save address error:", resolveErr);
        } finally {
          setIsResolvingAddress(false);
        }
      }

      // Tự động chuẩn hóa địa chỉ nếu có kết quả định vị chuẩn từ bản đồ
      const finalAddress = (currentResolved?.success && currentResolved.formattedAddress?.trim())
        ? currentResolved.formattedAddress.trim()
        : trimmedAddress;

      if (finalAddress !== newAddressForm.address) {
        setNewAddressForm(prev => ({ ...prev, address: finalAddress }));
      }
      if (editingAddressSku) {
        // UPDATE (PUT /api/addresses/{sku})
        const updated = await updateAddress(editingAddressSku, {
          address: newAddressForm.address.trim(),
          phoneNumber: newAddressForm.phone.trim(),
          recipientName: newAddressForm.recipientName.trim(),
          isDefault: newAddressForm.isDefault,
          type: newAddressForm.type
        });

        const newAddresses = addresses.map(a => a.sku === editingAddressSku ? updated : a);
        setAddresses(newAddresses);
        localStorage.setItem(STORAGE_KEYS.USER_ADDRESSES, JSON.stringify(newAddresses));
        setIsAddingAddress(false);
        setEditingAddressSku(null);
        setResolvedPreview(null);
        setSuccessMsg("Cập nhật địa chỉ giao nhận thành công!");
        logAuditAction("UPDATE_ADDRESS", "SUCCESS", `Cập nhật địa chỉ SKU: ${editingAddressSku}`);
      } else {
        // CREATE (POST /api/addresses)
        const created = await createAddress({
          address: newAddressForm.address.trim(),
          phoneNumber: newAddressForm.phone.trim(),
          recipientName: newAddressForm.recipientName.trim(),
          isDefault: newAddressForm.isDefault || addresses.length === 0,
          type: newAddressForm.type
        });

        let updated = [...addresses];
        if (created.isDefault) {
          updated = updated.map(a => ({ ...a, isDefault: false }));
        }
        updated.unshift(created);

        setAddresses(updated);
        localStorage.setItem(STORAGE_KEYS.USER_ADDRESSES, JSON.stringify(updated));
        setIsAddingAddress(false);
        setEditingAddressSku(null);
        setResolvedPreview(null);
        setSuccessMsg("Đã lưu địa chỉ giao nhận mới thành công!");
        logAuditAction("CREATE_ADDRESS", "SUCCESS", `Thêm địa chỉ SKU: ${created.sku}`);
      }

      setNewAddressForm({
        recipientName: user?.fullName || "",
        phone: user?.phoneNumber || "",
        address: "",
        type: "office",
        isDefault: false
      });
    } catch (err: any) {
      setErrorMsg("Không thể lưu địa chỉ: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for opening Edit Address Form
  const handleOpenEditAddress = (addr: AddressDto) => {
    setNewAddressForm({
      recipientName: addr.recipientName,
      phone: addr.phoneNumber,
      address: addr.address,
      type: addr.type || "office",
      isDefault: addr.isDefault
    });
    if (addr.latitude && addr.longitude) {
      setResolvedPreview({
        success: true,
        latitude: addr.latitude,
        longitude: addr.longitude,
        formattedAddress: addr.address,
        rawAddress: addr.address
      });
    } else {
      setResolvedPreview(null);
    }
    setEditingAddressSku(addr.sku);
    setIsAddingAddress(true);
    setIsMapActive(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Handler for Address Book: Set Default
  const handleSetDefaultAddress = async (sku: string) => {
    try {
      await setDefaultAddress(sku);
      const updated = addresses.map(a => ({
        ...a,
        isDefault: a.sku === sku
      }));
      setAddresses(updated);
      localStorage.setItem(STORAGE_KEYS.USER_ADDRESSES, JSON.stringify(updated));
      setSuccessMsg("Đã đặt địa chỉ làm mặc định!");
      setErrorMsg("");
      logAuditAction("SET_DEFAULT_ADDRESS", "SUCCESS", `Đặt mặc định địa chỉ SKU: ${sku}`);
    } catch (err: any) {
      setErrorMsg("Không thể đặt làm mặc định: " + (err.message || "Lỗi mạng"));
    }
  };

  // Handler for Address Book: Delete
  const handleDeleteAddress = async (sku: string) => {
    if (addresses.length <= 1) {
      setErrorMsg("Bạn cần duy trì ít nhất 1 địa chỉ nhận hàng.");
      return;
    }
    try {
      await deleteAddress(sku);
      const updated = addresses.filter(a => a.sku !== sku);
      if (!updated.some(a => a.isDefault) && updated.length > 0) {
        updated[0].isDefault = true;
      }
      setAddresses(updated);
      localStorage.setItem(STORAGE_KEYS.USER_ADDRESSES, JSON.stringify(updated));
      setSuccessMsg("Đã xóa địa chỉ khỏi sổ danh bạ.");
      setErrorMsg("");
      logAuditAction("DELETE_ADDRESS", "SUCCESS", `Xóa địa chỉ SKU: ${sku}`);
    } catch (err: any) {
      setErrorMsg("Không thể xóa địa chỉ: " + (err.message || "Lỗi mạng"));
    }
  };

  // Real-time Geocoding address resolve debounce effect (1.25s debounce to prevent spam)
  useEffect(() => {
    const trimmed = newAddressForm.address?.trim() || "";
    if (!isAddingAddress || trimmed.length < 4) {
      setResolvedPreview(null);
      setIsResolvingAddress(false);
      return;
    }

    // Do not call API again if the address already matches the resolved address
    if (resolvedPreview && (resolvedPreview.rawAddress === trimmed || resolvedPreview.formattedAddress === trimmed)) {
      setIsResolvingAddress(false);
      return;
    }

    clearTimeout(resolveTimerRef.current as NodeJS.Timeout);
    setIsResolvingAddress(true);
    resolveTimerRef.current = setTimeout(async () => {
      try {
        const res = await resolveAddress(trimmed);
        setResolvedPreview(res);
        setIsMapActive(true);
      } catch {
        setResolvedPreview(null);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 1250); // Exact 1.25s debounce

    return () => clearTimeout(resolveTimerRef.current as NodeJS.Timeout);
  }, [newAddressForm.address, isAddingAddress]);

  // Handler for active/manual Geocoding refresh on the address input
  const handleManualResolveAddress = async () => {
    const trimmed = newAddressForm.address.trim();
    if (trimmed.length < 3) return;
    clearTimeout(resolveTimerRef.current as NodeJS.Timeout);
    setIsResolvingAddress(true);
    try {
      const res = await resolveAddress(trimmed);
      setResolvedPreview(res);
      setMapKey(prev => prev + 1);
      setIsMapActive(true);
    } catch {
      setResolvedPreview(null);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Handler for auto-filling recipient info from profile
  const handleFillFromProfile = () => {
    setNewAddressForm(prev => ({
      ...prev,
      recipientName: user?.fullName || editFullName || "Người nhận",
      phone: user?.phoneNumber || editPhone || ""
    }));
    setSuccessMsg("Đã tự động điền thông tin từ hồ sơ cá nhân!");
    if (errorMsg) setErrorMsg("");
  };

  // Handler for GPS Device Location
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Trình duyệt không hỗ trợ định vị GPS tự động.");
      return;
    }
    setIsResolvingAddress(true);
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocoding via OpenStreetMap Nominatim
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`
          );
          const data = await resp.json();
          const displayAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setNewAddressForm(prev => ({
            ...prev,
            address: displayAddress
          }));
          setResolvedPreview({
            success: true,
            latitude,
            longitude,
            formattedAddress: displayAddress,
            rawAddress: displayAddress
          });
          setSuccessMsg("Đã định vị thành công vị trí GPS hiện tại của bạn!");
        } catch (e) {
          // Fallback with coordinates
          const coordsStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setNewAddressForm(prev => ({
            ...prev,
            address: coordsStr
          }));
          setResolvedPreview({
            success: true,
            latitude,
            longitude,
            formattedAddress: coordsStr,
            rawAddress: coordsStr
          });
          setSuccessMsg("Đã nhận diện tọa độ GPS của thiết bị!");
        } finally {
          setIsResolvingAddress(false);
        }
      },
      (err) => {
        setIsResolvingAddress(false);
        setErrorMsg("Không thể lấy vị trí: " + (err.message || "Vui lòng cho phép quyền truy cập vị trí trên trình duyệt"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  // Add item into local Auth Audit Logs
  const logAuditAction = (action: string, status: "SUCCESS" | "FAILED", message: string) => {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUTH_AUDIT_LOGS) || localStorage.getItem("horizon_auth_audit_logs") || "[]";
      const logs = JSON.parse(storedLogs);
      logs.unshift({
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        action,
        status,
        message,
        endpoint: action === "CHANGE_USERNAME" ? "/api/auth/change-username" : "/api/auth/change-password",
        deviceInfo: {
          browser: navigator.userAgent,
          platform: navigator.platform,
          screen: `${window.innerWidth}x${window.innerHeight}`
        }
      });
      localStorage.setItem(STORAGE_KEYS.AUTH_AUDIT_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error("Error writing audit logs:", e);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản?")) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKENS_MAP);
      localStorage.removeItem("horizon_redis_profile");
      localStorage.removeItem("horizon_current_user");
      localStorage.removeItem("horizon_access_token");
      localStorage.removeItem("horizon_refresh_token");
      window.location.hash = "login";
      onNavigate("auth");
    }
  };

  return (
    <div className="relative pt-[68px] pb-3 sm:pb-4 h-screen w-full bg-[#FBFDFF] font-sans text-slate-800 flex flex-col justify-start overflow-hidden">
      
      {/* Ambient background glowing lights (Đánh ánh sáng ám mạnh mẽ hơn) */}
      <div className="absolute top-[-5%] left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-400/35 via-purple-300/25 to-[#FF4D24]/20 blur-[140px] pointer-events-none select-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute bottom-[5%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#FF4D24]/15 via-indigo-400/30 to-blue-400/25 blur-[130px] pointer-events-none select-none z-0" />
      
      {/* Refined Toast Notification Stack - Synchronized Ambient Glassmorphism */}
      <div className="fixed top-32 right-4 sm:right-6 z-[99999] pointer-events-none flex flex-col items-end gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {(errorMsg || successMsg) && (
            <motion.div
              key={errorMsg ? `profile-err-${errorMsg}` : `profile-succ-${successMsg}`}
              initial={{ opacity: 0, x: 20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto relative w-full flex items-center justify-between gap-3 overflow-visible rounded-2xl border-t border-t-white/95 border-b border-b-slate-400/40 border-x border-x-white/70 dark:border-white/20 bg-white/75 dark:bg-zinc-900/80 p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2),0_10px_25px_-5px_rgba(255,77,36,0.12),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-2xl backdrop-saturate-200 select-none text-left"
            >
              {/* Ambient tint overlay identical to /p bottom bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent"
              />

              {/* Left Content: Badge Icon and Message */}
              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/60 flex items-center justify-center border-t border-t-white border-b border-b-orange-200/70 border-x border-x-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(255,77,36,0.08)] shrink-0">
                  {(() => {
                    const msg = (errorMsg || successMsg || "").toLowerCase();
                    if (errorMsg) {
                      return <AlertCircle className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />;
                    }
                    if (msg.includes("bookmark") || msg.includes("phụ kiện")) {
                      return <Bookmark className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />;
                    }
                    if (msg.includes("địa chỉ") || msg.includes("tọa độ") || msg.includes("gps")) {
                      return <MapPin className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />;
                    }
                    if (msg.includes("giỏ hàng")) {
                      return <ShoppingCart className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />;
                    }
                    if (msg.includes("hồ sơ") || msg.includes("tài khoản")) {
                      return <User className="w-4 h-4 text-[#FF4D24] stroke-[2.2]" />;
                    }
                    return <CheckCircle2 className="w-4 h-4 text-[#FF4D24] stroke-[2.4]" />;
                  })()}
                </div>
                <span className="font-sans font-bold text-xs sm:text-[13px] text-[#111111] dark:text-white leading-snug">
                  {errorMsg || successMsg}
                </span>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="relative z-10 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100/60 transition-colors cursor-pointer shrink-0 ml-1"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Tutorial Popup Notification: Keyboard Navigation Guide */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[99998] pointer-events-none max-w-md w-[calc(100vw-32px)] sm:w-[440px]">
        <AnimatePresence>
          {showNavTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96, transition: { duration: 0.18, ease: "easeIn" } }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 24,
                mass: 0.8,
              }}
              className="pointer-events-auto relative w-full overflow-hidden rounded-3xl border-t border-t-white/95 border-b border-b-slate-400/50 border-x border-x-white/80 dark:border-white/20 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25),0_10px_25px_-5px_rgba(255,77,36,0.18),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-2xl backdrop-saturate-200 text-left select-none"
            >
              {/* Ambient gradient aura */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF4D24]/[0.06] via-indigo-500/[0.03] to-purple-500/[0.04]"
              />

              {/* Popup Header */}
              <div className="relative z-10 flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/[0.08] dark:bg-orange-500/10 border border-orange-200/60 dark:border-white/10 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
                    <Keyboard className="w-5 h-5 stroke-[1.6]" />
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                      Thông báo: Mẹo điều hướng
                    </h4>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight">
                      Thao tác bàn phím siêu tốc trên cổng tài khoản
                    </p>
                  </div>
                </div>

                {/* 30s Countdown Auto-Dismiss Indicator */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-b from-orange-50/90 to-orange-100/60 dark:bg-zinc-800/80 border-t border-t-white border-b border-b-orange-200/80 border-x border-x-orange-100 dark:border-white/10 text-[#FF4D24] shadow-[0_1px_2px_rgba(255,77,36,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] shrink-0 select-none cursor-default"
                  title={`Tự động ẩn sau ${tutorialCountdown} giây`}
                >
                  <Clock className="w-3.5 h-3.5 stroke-[2.2] animate-pulse" />
                  <span className="font-mono text-xs font-black tracking-tight">{tutorialCountdown}s</span>
                </div>
              </div>

              {/* Popup Body: 2 Navigation Dimensions with Soft Subtle Active State */}
              <div className="relative z-10 space-y-2 mb-4">
                {/* 1. Hướng ngang: Điều chỉnh Tag Lọc */}
                <div className={`p-2.5 rounded-2xl transition-all duration-150 border ${
                  isHorizontalActive
                    ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50 shadow-sm"
                    : "bg-black/[0.025] dark:bg-white/5 border-slate-100/80 dark:border-white/5"
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full transition-colors duration-150 shrink-0 ${
                        isHorizontalActive ? "bg-[#FF4D24]" : "bg-slate-300 dark:bg-zinc-600"
                      }`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        Hướng ngang: Đổi Tag bộ lọc
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["A"]
                          ? "bg-[#FF4D24] text-white border border-[#FF4D24] shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-[#FF4D24]"
                      }`}>
                        A
                      </kbd>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["D"]
                          ? "bg-[#FF4D24] text-white border border-[#FF4D24] shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-[#FF4D24]"
                      }`}>
                        D
                      </kbd>
                      <span className="text-[10px] text-slate-400 font-bold px-0.5">/</span>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["Left"]
                          ? "bg-[#FF4D24] text-white border border-[#FF4D24] shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-[#FF4D24]"
                      }`}>
                        ←
                      </kbd>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["Right"]
                          ? "bg-[#FF4D24] text-white border border-[#FF4D24] shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-[#FF4D24]"
                      }`}>
                        →
                      </kbd>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-4">
                    Nhấn phím <b>A</b>, <b>D</b> hoặc <b>mũi tên hướng ngang</b> để điều chỉnh tag.
                  </p>
                </div>

                {/* 2. Hướng dọc: Chuyển Card Đơn Hàng */}
                <div className={`p-2.5 rounded-2xl transition-all duration-150 border ${
                  isVerticalActive
                    ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 shadow-sm"
                    : "bg-black/[0.025] dark:bg-white/5 border-slate-100/80 dark:border-white/5"
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full transition-colors duration-150 shrink-0 ${
                        isVerticalActive ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-600"
                      }`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        Hướng dọc: Chuyển Card đơn hàng
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["W"]
                          ? "bg-indigo-600 text-white border border-indigo-600 shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-indigo-600"
                      }`}>
                        W
                      </kbd>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["S"]
                          ? "bg-indigo-600 text-white border border-indigo-600 shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-indigo-600"
                      }`}>
                        S
                      </kbd>
                      <span className="text-[10px] text-slate-400 font-bold px-0.5">/</span>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["Up"]
                          ? "bg-indigo-600 text-white border border-indigo-600 shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-indigo-600"
                      }`}>
                        ↑
                      </kbd>
                      <kbd className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg font-mono text-[10.5px] font-black transition-all duration-100 ${
                        activePressedKeys["Down"]
                          ? "bg-indigo-600 text-white border border-indigo-600 shadow-sm scale-95"
                          : "bg-white border border-slate-200/90 shadow-[0_1.5px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] text-indigo-600"
                      }`}>
                        ↓
                      </kbd>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-4">
                    Nhấn phím <b>W</b>, <b>S</b> hoặc <b>mũi tên hướng dọc</b> để chuyển đổi card đơn hàng.
                  </p>
                </div>
              </div>

              {/* Popup Footer Button */}
              <div className="relative z-10 flex items-center justify-between gap-3 pt-1">
                <span className="text-[10.5px] text-slate-400 font-mono">
                  Ấn phím bất kỳ để kiểm tra
                </span>
                <button
                  type="button"
                  onClick={handleDismissTutorial}
                  className="px-4 py-2 bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] hover:brightness-105 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border-t border-t-white/60 border-b border-b-[#9E2407] border-x border-x-[#FF4D24]/80 shadow-[0_3px_10px_rgba(255,77,36,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]"
                >
                  Đã hiểu & Bắt đầu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 max-w-[1760px] w-full mx-auto px-4 sm:px-10 xl:px-12 flex-1 min-h-0 flex flex-col space-y-2.5 pb-1">
        
        {/* Top control actions (Optimized & Unified with 3D Bevel, maintaining exact layout height) */}
        <div className="shrink-0 flex flex-col gap-2.5 border-b border-slate-200/60 pb-2.5 select-none">
          {/* Preserved spacer: prevents layout shift after breadcrumb removal */}
          <div className="h-5 min-h-[20px] invisible pointer-events-none select-none" aria-hidden="true" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {!isLoading && token && user ? (
              /* Unified User Info & Title when logged in */
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.fullName || "User Avatar"} 
                    className="w-14 h-14 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-2 border-white ring-4 ring-indigo-50/80 shrink-0 select-none"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-[#FF4D24]/90 text-white flex items-center justify-center font-display font-black text-xl shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] shrink-0 select-none border-t border-t-white/80 border-b border-b-slate-400/60 border-x border-x-white/50 ring-4 ring-indigo-50/80">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : "H")}
                  </div>
                )}
                <div className="space-y-1.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{user.fullName || "Hội viên Horizon"}</h1>
                  <div className="flex items-center">
                    {(() => {
                      const rankInfo = getMembershipRankInfo(user);
                      return (
                        <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-md uppercase border-t border-t-white border-b border-x inline-flex items-center gap-1.5 ${rankInfo.badgeClass}`}>
                          <Crown className={`w-3.5 h-3.5 shrink-0 ${rankInfo.iconColor}`} />
                          <span>{rankInfo.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              /* Simple Page Title when loading or not logged in */
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">Cổng thông tin & Đơn hàng</h1>
                <p className="text-xs text-slate-400 font-medium">Quản lý thiết lập cá nhân & bảo mật tài khoản thành viên</p>
              </div>
            )}

            {/* Top Toolbar actions (Only shown when authenticated) */}
            {!isLoading && token && user && (
              <div className="flex items-center gap-3 self-start md:self-auto">
                <button 
                  onClick={() => {
                    setErrorMsg("");
                    setSuccessMsg("");
                    setIsAccountsCenterOpen(true);
                  }}
                  onMouseEnter={() => setIsSecurityBtnHovered(true)}
                  onMouseLeave={() => setIsSecurityBtnHovered(false)}
                  className="px-4 py-2.5 bg-gradient-to-b from-indigo-50/90 via-indigo-50/70 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-150 border-t border-t-white border-b border-b-indigo-200/80 border-x border-x-indigo-100/80 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_6px_-1px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-95"
                >
                  <SequentialTagMorphIcon isHovered={isSecurityBtnHovered} />
                  <span>Quản lý bảo mật</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-rose-50 hover:to-rose-100/60 hover:text-red-600 border-t border-t-white border-b border-b-slate-300/70 hover:border-b-rose-300 border-x border-x-white/70 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_6px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] active:scale-95"
                >
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading screen */}
        {isLoading ? (
          <div className="bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
            <RefreshCw className="w-7 h-7 text-[#FF4D24] animate-spin" />
            <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase animate-pulse">
              Đang đồng bộ dữ liệu dịch vụ...
            </p>
          </div>
        ) : !token || !user ? (
          /* Empty / Not logged-in dashboard */
          <div className="max-w-md mx-auto bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-3xl p-8 text-center space-y-6 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-rose-50 to-rose-100 border-t border-t-white border-b border-b-rose-200 border-x border-x-rose-100 flex items-center justify-center mx-auto text-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_6px_rgba(225,29,72,0.1)]">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-[#111111] tracking-tight">Yêu cầu xác thực tài khoản</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vui lòng kết nối tài khoản để theo dõi lịch sử mua hàng, trạng thái vận chuyển và tùy chỉnh quyền bảo mật.
              </p>
            </div>
            <button
              onClick={() => { window.location.hash = "login"; onNavigate("auth"); }}
              className="w-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] hover:brightness-105 active:scale-95 text-white text-xs font-bold py-3.5 rounded-2xl transition-all cursor-pointer border-t border-t-white/50 border-b border-b-[#A8280A] border-x border-x-[#FF4D24]/80 shadow-[0_4px_16px_rgba(255,77,36,0.35),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)]"
            >
              Đăng ký / Đăng nhập ngay ↗
            </button>
          </div>
        ) : (
          /* Main Account Center Dashboard (Focusing on Orders and Delivery Progress) */
          <div className="flex-1 min-h-0 flex flex-col text-left">
            
            {/* Core Section: Split View for Orders and Delivery Tracker */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-stretch lg:grid-rows-1">
              
              {/* Left Side: Order list history (Thông tin đơn hàng) */}
              <div className="lg:col-span-5 h-full flex flex-col space-y-2.5 min-h-0">
                <div className="shrink-0 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#FF4D24]" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Thông tin đơn hàng</h3>
                    {isOrdersSyncing && (
                      <RefreshCw className="w-3 h-3 text-[#FF4D24] animate-spin shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleTutorial}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer active:scale-95 border ${
                        showNavTutorial
                          ? "text-[#FF4D24] bg-orange-50/90 border-orange-200/80 shadow-sm"
                          : "text-slate-600 hover:text-[#FF4D24] bg-white/80 hover:bg-orange-50 border-slate-200/80 hover:border-orange-200 shadow-sm"
                      }`}
                      title={showNavTutorial ? "Đóng hướng dẫn phím tắt" : "Mở popup hướng dẫn phím tắt"}
                    >
                      <Keyboard className="w-3 h-3 text-[#FF4D24]" />
                      <span>{showNavTutorial ? "Đang mở mẹo" : "Mẹo phím tắt"}</span>
                    </button>
                  </div>
                </div>

                {/* Status Filter Pills Bar with Concave Sunken Bevel Track & A/D keyboard navigation */}
                <div className="shrink-0 relative">
                  {/* Sunken Concave Bevel Track (Rãnh lõm quang học nguyên khối) */}
                  <div className="bg-slate-200/55 dark:bg-zinc-800/60 p-[2px] rounded-full shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.09),0_1px_0_rgba(255,255,255,0.85)] border-t border-t-black/[0.06] border-b border-b-white/80 border-x border-x-transparent relative">
                    <div
                      ref={filterPillsRef}
                      onScroll={handleFilterScroll}
                      className="flex items-center gap-1 overflow-x-auto hide-scrollbar transition-all duration-300 relative z-10 py-1 px-1.5"
                      style={{
                        maskImage: `linear-gradient(to right, 
                          transparent 0%, 
                          black ${showFilterLeftFade ? "8px" : "0px"}, 
                          black calc(100% - ${showFilterRightFade ? "8px" : "0px"}), 
                          transparent 100%)`,
                        WebkitMaskImage: `linear-gradient(to right, 
                          transparent 0%, 
                          black ${showFilterLeftFade ? "8px" : "0px"}, 
                          black calc(100% - ${showFilterRightFade ? "8px" : "0px"}), 
                          transparent 100%)`
                      }}
                    >
                      {STATUS_FILTER_OPTIONS.map((opt) => {
                        const isFilterActive = statusFilter === opt.id;
                        const count = getFilterCount(opt.id);
                        return (
                          <motion.button
                            key={opt.id}
                            data-filter-id={opt.id}
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            onClick={() => handleFilterChange(opt.id)}
                            className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer select-none antialiased outline-none focus:outline-none ring-0 focus:ring-0 border-0 ${
                              isFilterActive
                                ? "text-white"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                            }`}
                          >
                            {isFilterActive && (
                              <motion.div
                                layoutId="statusFilterPillActive"
                                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E63E14] border-t border-t-white/80 border-b border-b-[#9E2407]/50 border-x border-x-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.15),0_1.5px_4px_rgba(255,77,36,0.35)] z-0"
                                transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.8 }}
                              />
                            )}
                            <span className={`relative z-10 tracking-tight font-extrabold antialiased leading-none ${
                              isFilterActive ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" : "text-slate-600"
                            }`}>
                              {opt.label}
                            </span>
                            <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold leading-none transition-all duration-150 antialiased ${
                              isFilterActive
                                ? "bg-white/25 text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                                : "bg-black/5 text-slate-500"
                            }`}>
                              {count}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative overflow-hidden rounded-2xl">
                  {/* Scrollable Container with Smooth Translucent Masking */}
                  <div 
                    ref={ordersListContainerRef}
                    onScroll={handleScroll}
                    className="hide-scrollbar h-full overflow-y-auto px-1 py-1 transition-all duration-300"
                    style={{
                      maskImage: `linear-gradient(to bottom, 
                        transparent 0%, 
                        black ${showTopFade ? "24px" : "0px"}, 
                        black calc(100% - ${showBottomFade ? "24px" : "0px"}), 
                        transparent 100%)`,
                      WebkitMaskImage: `linear-gradient(to bottom, 
                        transparent 0%, 
                        black ${showTopFade ? "24px" : "0px"}, 
                        black calc(100% - ${showBottomFade ? "24px" : "0px"}), 
                        transparent 100%)`
                    }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={statusFilter}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="space-y-2.5"
                      >
                        {filteredOrders.length === 0 ? (
                          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-8 select-none pointer-events-none">
                            <div className="relative flex flex-col items-center justify-center">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-white/95 via-white/80 to-slate-100/60 border-t border-t-white border-b border-b-slate-200/80 border-x border-x-white/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-center">
                                <PackageOpen className="w-8 h-8 text-slate-300 stroke-[1.4]" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          filteredOrders.map((item) => {
                            const isSelected = item.id === selectedOrderId;
                            const theme = getOrderStatusTheme(item.statusText || item.status);
                            return (
                              <div
                                key={item.id}
                                data-order-id={item.id}
                                onClick={() => handleSelectOrder(item.id)}
                                className={`p-3.5 rounded-2xl text-left cursor-pointer transition-all duration-150 relative ${
                                  isSelected 
                                    ? "bg-gradient-to-b from-orange-50/40 via-white to-white border border-[#FF4D24]/40 border-l-4 border-l-[#FF4D24] shadow-[0_4px_16px_-2px_rgba(255,77,36,0.12),0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]" 
                                    : "bg-gradient-to-b from-white/95 via-white/85 to-white/70 border border-slate-200/70 border-t-white border-b-slate-300/60 hover:border-slate-300/80 hover:from-white hover:to-white/85 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 mb-1 pb-1 border-b border-slate-100">
                                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                    <span className={`text-[9px] font-bold font-mono uppercase truncate ${isSelected ? "text-[#FF4D24]" : "text-slate-400"}`}>
                                      MÃ ĐƠN: {item.id}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyOrderId(item.id, e)}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-90 shrink-0"
                                      title="Sao chép mã đơn hàng"
                                    >
                                      <MorphIcon
                                        icon={copiedOrderId === item.id ? LucideCheck : LucideCopy}
                                        spring="snappy"
                                        className={`w-3 h-3 transition-colors ${
                                          copiedOrderId === item.id ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                                        }`}
                                        size={12}
                                        strokeWidth={copiedOrderId === item.id ? 2.5 : 2}
                                      />
                                    </button>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-normal shrink-0 transition-all border flex items-center gap-1.5 ${theme.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotClass} ${theme.glowClass}`} />
                                    <span>{item.statusText || theme.label}</span>
                                  </span>
                                </div>

                                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[30px] mb-1.5">
                                  {item.name}
                                </h4>

                                {/* Ngày mua bên trái, [Tổng thanh toán] : [Giá] bên phải (Cắt ngắn giá bằng dấu ... nếu quá dài, không xuống dòng) */}
                                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100/80 gap-2 min-w-0">
                                  <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
                                    {item.date ? `Ngày mua: ${item.date}` : "Chờ ghi nhận ngày mua"}
                                  </span>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                    <span className="text-[11px] text-slate-500 shrink-0 whitespace-nowrap">Tổng thanh toán:</span>
                                    <span 
                                      className="text-xs font-black text-[#FF4D24] font-mono truncate max-w-[110px] sm:max-w-[140px] inline-block text-right whitespace-nowrap shrink min-w-0" 
                                      title={item.price}
                                    >
                                      {item.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right Side: Live Delivery Tracking progress timeline (Quá trình vận chuyển) */}
              <div className="lg:col-span-7 h-full flex flex-col space-y-2 min-h-0">
                <div className="shrink-0 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shadow-xs">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Hành trình giao hàng
                    </h3>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeOrder ? (
                    <motion.div
                      key={activeOrder.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      onAnimationComplete={scrollToEndpoint}
                      className="relative overflow-hidden flex-1 min-h-0 bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.07),0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)]"
                    >
                      {/* Multi-corner Ambient Luxury Glow Aura (hiệu ứng ám màu tương đồng OrderPage/ProductPage) */}
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl z-0 select-none">
                        <div className={`absolute -top-10 -right-10 h-44 w-44 rounded-full blur-3xl transition-colors duration-500 ${
                          orderTheme === "emerald"
                            ? "bg-gradient-to-br from-emerald-500/[0.12] via-teal-500/[0.08] to-transparent"
                            : orderTheme === "sky"
                            ? "bg-gradient-to-br from-sky-500/[0.12] via-blue-500/[0.08] to-transparent"
                            : orderTheme === "indigo"
                            ? "bg-gradient-to-br from-indigo-500/[0.12] via-violet-500/[0.08] to-transparent"
                            : orderTheme === "amber"
                            ? "bg-gradient-to-br from-amber-500/[0.12] via-orange-500/[0.08] to-transparent"
                            : "bg-gradient-to-br from-rose-500/[0.12] via-red-500/[0.08] to-transparent"
                        }`} />
                        <div className={`absolute -bottom-10 -left-10 h-44 w-44 rounded-full blur-3xl transition-colors duration-500 ${
                          orderTheme === "emerald"
                            ? "bg-gradient-to-tr from-emerald-500/[0.10] via-teal-400/[0.06] to-transparent"
                            : orderTheme === "sky"
                            ? "bg-gradient-to-tr from-sky-500/[0.10] via-cyan-400/[0.06] to-transparent"
                            : orderTheme === "indigo"
                            ? "bg-gradient-to-tr from-indigo-500/[0.10] via-violet-400/[0.06] to-transparent"
                            : orderTheme === "amber"
                            ? "bg-gradient-to-tr from-amber-500/[0.10] via-yellow-400/[0.06] to-transparent"
                            : "bg-gradient-to-tr from-rose-500/[0.10] via-pink-400/[0.06] to-transparent"
                        }`} />
                        <div className={`absolute inset-0 transition-all duration-500 ${
                          orderTheme === "emerald"
                            ? "bg-[radial-gradient(ellipse_70%_50%_at_85%_15%,rgba(16,185,129,0.05)_0%,transparent_70%),radial-gradient(ellipse_70%_50%_at_15%_85%,rgba(20,184,166,0.035)_0%,transparent_70%)]"
                            : orderTheme === "sky"
                            ? "bg-[radial-gradient(ellipse_70%_50%_at_85%_15%,rgba(14,165,233,0.05)_0%,transparent_70%),radial-gradient(ellipse_70%_50%_at_15%_85%,rgba(56,189,248,0.035)_0%,transparent_70%)]"
                            : orderTheme === "indigo"
                            ? "bg-[radial-gradient(ellipse_70%_50%_at_85%_15%,rgba(99,102,241,0.05)_0%,transparent_70%),radial-gradient(ellipse_70%_50%_at_15%_85%,rgba(139,92,246,0.035)_0%,transparent_70%)]"
                            : orderTheme === "amber"
                            ? "bg-[radial-gradient(ellipse_70%_50%_at_85%_15%,rgba(245,158,11,0.05)_0%,transparent_70%),radial-gradient(ellipse_70%_50%_at_15%_85%,rgba(251,146,60,0.035)_0%,transparent_70%)]"
                            : "bg-[radial-gradient(ellipse_70%_50%_at_85%_15%,rgba(244,63,94,0.05)_0%,transparent_70%),radial-gradient(ellipse_70%_50%_at_15%_85%,rgba(251,113,133,0.035)_0%,transparent_70%)]"
                        }`} />
                      </div>
                      
                      {/* Header info of selected Order: Hợp nhất hoàn toàn với nền khung lớn, icon và badge có hiệu ứng bevel làm mịn */}
                      <div className="relative z-10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-0.5 pb-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-white via-slate-50 to-slate-100/80 border-t border-t-white border-b border-b-slate-200/60 border-x border-x-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-slate-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8.5px] font-bold text-slate-400 font-mono uppercase tracking-wider block leading-none">VẬN CHUYỂN BỞI</span>
                              {activeOrder.rawOrder?.paymentMethod && (
                                <span className="font-mono text-[8px] font-extrabold px-1.5 py-0.2 rounded-md bg-gradient-to-b from-slate-50 to-slate-100/80 border border-slate-200/80 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] uppercase">
                                  {activeOrder.rawOrder.paymentMethod}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-black text-slate-900 truncate leading-tight mt-0.5">{activeOrder.carrier}</p>
                          </div>
                        </div>

                        {/* Ngày giao hàng dự kiến: Tinh giản, thẳng hàng và chuẩn visual */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center select-none py-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              {activeOrder.status === "delivered" ? "Đã giao hàng:" : "Dự kiến giao:"}
                            </span>
                            <span className="font-bold text-slate-800 font-mono tracking-tight text-xs">
                              {activeOrder.estimatedDelivery && /^\d{2}\/\d{2}\/\d{4}$/.test(activeOrder.estimatedDelivery)
                                ? activeOrder.estimatedDelivery
                                : activeOrder.date && /^\d{2}\/\d{2}\/\d{4}$/.test(activeOrder.date)
                                  ? activeOrder.date
                                  : "Chưa cập nhật"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Tracker Wrapper: Dùng mask-image để các phần tử hòa tan mềm mại vào nền mà không tạo ranh giới giả */}
                      <div className="relative z-10 flex-1 min-h-0 relative overflow-hidden">
                        <div
                          ref={stepsContainerRef}
                          onScroll={handleStepsScroll}
                          className="hide-scrollbar relative h-full overflow-y-auto py-1 pl-14 pr-1 space-y-2.5 transition-all duration-300"
                          style={{
                            maskImage: `linear-gradient(to bottom, 
                              transparent 0%, 
                              black ${showStepsTopFade ? "36px" : "0px"}, 
                              black calc(100% - ${showStepsBottomFade ? "36px" : "0px"}), 
                              transparent 100%)`,
                            WebkitMaskImage: `linear-gradient(to bottom, 
                              transparent 0%, 
                              black ${showStepsTopFade ? "36px" : "0px"}, 
                              black calc(100% - ${showStepsBottomFade ? "36px" : "0px"}), 
                              transparent 100%)`
                          }}
                        >
                          {displayedSteps.map((step, idx) => {
                              const isLast = idx === displayedSteps.length - 1;
                              const nextStep = !isLast ? displayedSteps[idx + 1] : null;
                              
                              // Mốc đang xử lý thực tế (nếu đơn hàng chưa hoàn tất)
                              const isStepInProgress = step.active && !isOrderDelivered;
                              
                              // Xác định màu chủ đề đồng bộ tuyệt đối theo đơn hàng (orderTheme)
                              const currentTheme = orderTheme;

                              // Đường hành trình đã qua nối tiếp tới mốc tiếp theo
                              const isConnectingTraversed = step.completed && (nextStep?.completed || nextStep?.active);

                              return (
                                <motion.div
                                  key={idx}
                                  ref={idx === endpointIndex ? setEndpointRef : undefined}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: idx * 0.03, ease: "easeOut" }}
                                  className="relative text-left"
                                >
                                  
                                  {/* Thanh | nằm chính giữa và pha trộn ám màu sắc, không tạo điểm đậm */}
                                  {!isLast && (isConnectingTraversed || isStepInProgress) && (
                                    <div 
                                      className={`absolute left-[-28px] -translate-x-1/2 top-1/2 w-[2px] transition-colors duration-300 z-0 ${
                                        isConnectingTraversed 
                                          ? orderTheme === "emerald"
                                            ? "h-[calc(100%+0.625rem)] bg-gradient-to-b from-emerald-500/70 to-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                                            : orderTheme === "sky"
                                            ? "h-[calc(100%+0.625rem)] bg-gradient-to-b from-sky-500/80 via-sky-600/70 to-emerald-500/60 shadow-[0_0_8px_rgba(14,165,233,0.25)]"
                                            : orderTheme === "indigo"
                                            ? "h-[calc(100%+0.625rem)] bg-gradient-to-b from-indigo-500/80 via-indigo-600/70 to-sky-500/60 shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                                            : orderTheme === "amber"
                                            ? "h-[calc(100%+0.625rem)] bg-gradient-to-b from-amber-500/85 via-amber-500/70 to-indigo-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                                            : "h-[calc(100%+0.625rem)] bg-gradient-to-b from-rose-500/80 via-rose-600/70 to-red-500/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]" 
                                          : currentTheme === "amber"
                                            ? "h-12 bg-gradient-to-b from-amber-500/80 via-orange-400/30 to-transparent"
                                            : currentTheme === "sky"
                                            ? "h-12 bg-gradient-to-b from-sky-500/80 via-blue-500/30 to-transparent"
                                            : currentTheme === "indigo"
                                            ? "h-12 bg-gradient-to-b from-indigo-500/80 via-violet-500/30 to-transparent"
                                            : currentTheme === "rose"
                                            ? "h-12 bg-gradient-to-b from-rose-500/80 via-red-500/30 to-transparent"
                                            : "h-12 bg-gradient-to-b from-emerald-500/80 via-teal-500/30 to-transparent"
                                      }`}
                                    />
                                  )}

                                  {/* Điểm mốc point: Đậm vừa, hài hòa và không bị nhìn xuyên qua */}
                                  <div className="absolute left-[-28px] -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                                    {isStepInProgress ? (
                                      <div className="relative flex items-center justify-center">
                                        {/* Quầng sáng mờ ambient lan tỏa chuẩn benchmark */}
                                        <div className={`absolute w-9 h-9 rounded-full blur-xs pointer-events-none ${
                                          currentTheme === "amber"
                                            ? "bg-gradient-to-tr from-amber-500/25 via-orange-400/20 to-transparent"
                                            : currentTheme === "sky"
                                            ? "bg-gradient-to-tr from-sky-500/25 via-blue-400/20 to-transparent"
                                            : currentTheme === "indigo"
                                            ? "bg-gradient-to-tr from-indigo-500/25 via-violet-400/20 to-transparent"
                                            : currentTheme === "rose"
                                            ? "bg-gradient-to-tr from-rose-500/25 via-red-500/20 to-transparent"
                                            : "bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent"
                                        }`} />
                                        <div className={`relative w-5 h-5 rounded-full border border-white flex items-center justify-center ${
                                          currentTheme === "amber"
                                            ? "bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 ring-3 ring-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                                            : currentTheme === "sky"
                                            ? "bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-500 ring-3 ring-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.35)]"
                                            : currentTheme === "indigo"
                                            ? "bg-gradient-to-tr from-indigo-400 via-indigo-500 to-violet-600 ring-3 ring-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.35)]"
                                            : currentTheme === "rose"
                                            ? "bg-gradient-to-tr from-rose-400 via-rose-500 to-red-500 ring-3 ring-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
                                            : "bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-500 ring-3 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                        }`}>
                                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                        </div>
                                      </div>
                                    ) : isOrderDelivered && isLast ? (
                                      <div className="relative flex items-center justify-center">
                                        {/* Quầng sáng mờ ambient lan tỏa cho điểm end hoàn thành */}
                                        <div className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-transparent blur-xs pointer-events-none" />
                                        <div className="relative w-5 h-5 rounded-full bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-600 border border-white ring-3 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.35)] flex items-center justify-center">
                                          <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                                        </div>
                                      </div>
                                    ) : step.completed ? (
                                      <div className={`w-5 h-5 rounded-full border border-white/90 flex items-center justify-center ${
                                        orderTheme === "emerald"
                                          ? "bg-gradient-to-b from-emerald-500/90 to-emerald-600/90 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                          : orderTheme === "sky"
                                          ? "bg-gradient-to-b from-sky-500/90 to-blue-600/90 shadow-[0_0_8px_rgba(14,165,233,0.25)]"
                                          : orderTheme === "indigo"
                                          ? "bg-gradient-to-b from-indigo-500/90 to-indigo-600/90 shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                                          : orderTheme === "amber"
                                          ? "bg-gradient-to-b from-amber-400/90 via-amber-500/90 to-orange-400/85 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                                          : "bg-gradient-to-b from-rose-500/90 via-red-500/90 to-rose-600/90 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                                      }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-slate-300/80 bg-white/95 flex items-center justify-center shadow-2xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Tag status: Hiệu ứng Bevel quang học 3D được làm mịn tối đa */}
                                  <div className={`rounded-xl p-2.5 sm:p-3 transition-all duration-200 border ${
                                    isStepInProgress
                                      ? currentTheme === "amber"
                                        ? "bg-gradient-to-b from-amber-50/95 via-white/95 to-orange-50/45 border-t-white border-b-amber-300/80 border-x-amber-200/60 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(245,158,11,0.04)]"
                                        : currentTheme === "sky"
                                        ? "bg-gradient-to-b from-sky-50/95 via-white/95 to-blue-50/45 border-t-white border-b-sky-300/80 border-x-sky-200/60 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(14,165,233,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(14,165,233,0.04)]"
                                        : currentTheme === "indigo"
                                        ? "bg-gradient-to-b from-indigo-50/95 via-white/95 to-violet-50/40 border-t-white border-b-indigo-200/80 border-x-indigo-100/70 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(99,102,241,0.04)]"
                                        : currentTheme === "rose"
                                        ? "bg-gradient-to-b from-rose-50/90 via-white/90 to-red-50/50 border-t-white border-b-rose-200/80 border-x-rose-100/70 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(244,63,94,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(244,63,94,0.04)]"
                                        : "bg-gradient-to-b from-emerald-50/90 via-white/90 to-teal-50/50 border-t-white border-b-emerald-200/80 border-x-emerald-100/70 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(16,185,129,0.04)]"
                                      : isOrderDelivered && isLast
                                        ? "bg-gradient-to-b from-emerald-50/90 via-white/90 to-emerald-50/50 border-t-white border-b-emerald-200/80 border-x-emerald-100/70 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(16,185,129,0.04)]"
                                        : step.completed
                                          ? "bg-gradient-to-b from-white/80 via-white/60 to-white/40 hover:from-white/95 hover:via-white/75 hover:to-white/55 border-t-white border-b-slate-200/60 border-x-white/70 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.02)]"
                                          : "bg-gradient-to-b from-white/45 via-white/30 to-white/20 border-t-white/70 border-b-slate-200/40 border-x-white/50 backdrop-blur-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(0,0,0,0.015)] opacity-60 text-slate-400"
                                  }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className={`text-xs ${
                                          isStepInProgress 
                                            ? currentTheme === "amber"
                                              ? "text-amber-900 font-black"
                                              : currentTheme === "sky"
                                              ? "text-sky-900 font-black"
                                              : currentTheme === "indigo"
                                              ? "text-indigo-900 font-black"
                                              : currentTheme === "rose"
                                              ? "text-rose-900 font-black"
                                              : "text-emerald-900 font-black" 
                                            : isOrderDelivered && isLast
                                              ? "text-emerald-700 font-black"
                                              : step.completed 
                                                ? "text-slate-800 font-semibold" 
                                                : "text-slate-400 font-medium"
                                        }`}>
                                          {step.title}
                                        </h4>
                                        {isOrderDelivered && isLast && (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-600 text-white tracking-wider shadow-2xs">
                                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                            Hoàn tất
                                          </span>
                                        )}
                                      </div>

                                      {/* Chip thời gian với hiệu ứng bevel làm mịn nhẹ nhàng */}
                                      {step.time !== "--:--" && (
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all shrink-0 self-start sm:self-center border ${
                                          isStepInProgress
                                            ? currentTheme === "amber"
                                              ? "bg-gradient-to-b from-amber-50 to-orange-50/80 border-t-white border-b-amber-300/70 border-x-amber-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-amber-900"
                                              : currentTheme === "sky"
                                              ? "bg-gradient-to-b from-sky-50 to-blue-50/80 border-t-white border-b-sky-300/70 border-x-sky-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-sky-900"
                                              : currentTheme === "indigo"
                                              ? "bg-gradient-to-b from-indigo-50 to-violet-50/80 border-t-white border-b-indigo-200/70 border-x-indigo-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-indigo-900"
                                              : currentTheme === "rose"
                                              ? "bg-gradient-to-b from-rose-50 to-red-50/80 border-t-white border-b-rose-200/70 border-x-rose-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-rose-900"
                                              : "bg-gradient-to-b from-emerald-50 to-teal-50/80 border-t-white border-b-emerald-200/70 border-x-emerald-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-emerald-900"
                                            : isOrderDelivered && isLast
                                              ? "bg-gradient-to-b from-emerald-50 to-emerald-100/70 border-t-white border-b-emerald-200/70 border-x-emerald-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-emerald-700"
                                              : step.completed
                                                ? "bg-gradient-to-b from-white/90 to-slate-100/70 border-t-white border-b-slate-200/60 border-x-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] text-slate-600"
                                                : "bg-slate-100/40 border-slate-200/30 text-slate-400"
                                        }`}>
                                          <Clock className={`w-3 h-3 ${
                                            isStepInProgress 
                                              ? currentTheme === "amber"
                                                ? "text-amber-700"
                                                : currentTheme === "sky"
                                                ? "text-sky-600"
                                                : currentTheme === "indigo"
                                                ? "text-indigo-600"
                                                : currentTheme === "rose"
                                                ? "text-rose-600"
                                                : "text-emerald-600" 
                                              : isOrderDelivered && isLast
                                                ? "text-emerald-600"
                                                : step.completed 
                                                  ? "text-slate-400" 
                                                  : "text-slate-300"
                                          }`} />
                                          <span>{step.time}</span>
                                        </div>
                                      )}
                                      {(() => {
                                        const s = step as typeof step & { riskLevel?: string; riskReason?: string };
                                        if (s.riskLevel && (s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL')) {
                                          return (
                                            <div 
                                              title={s.riskReason || 'Cảnh báo rủi ro'}
                                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 shadow-sm shrink-0 self-start sm:self-center"
                                            >
                                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    <p className={`text-[11px] leading-relaxed ${
                                      isStepInProgress 
                                        ? "text-slate-700 font-medium" 
                                        : step.completed 
                                          ? "text-slate-500 font-normal" 
                                          : "text-slate-400 font-light"
                                    }`}>
                                      {step.desc}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Shipping address details block: Thẻ địa chỉ với hiệu ứng Bevel làm mịn mượt mà */}
                      <div className="relative z-10 shrink-0 px-1 pt-0.5 pb-0.5">
                        <div 
                          onMouseEnter={() => setIsAddressHovered(true)}
                          onMouseLeave={() => setIsAddressHovered(false)}
                          onClick={() => {
                            setActiveModalTab("addresses");
                            setIsAccountsCenterOpen(true);
                          }}
                          className="bg-gradient-to-b from-white/85 via-white/70 to-slate-50/50 hover:from-white hover:to-slate-50/70 border-t border-t-white border-b border-b-slate-200/70 hover:border-slate-300/80 border-x border-x-white/70 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-[34px] h-[34px] rounded-[10px] bg-gradient-to-b border-t border-t-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                              orderTheme === "emerald"
                                ? "from-emerald-50 via-emerald-50/80 to-emerald-100/60 border-b-emerald-200/80 border-x-emerald-100/80 text-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,185,129,0.08)]"
                                : orderTheme === "sky"
                                ? "from-sky-50 via-sky-50/80 to-blue-100/60 border-b-sky-200/80 border-x-sky-100/80 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(14,165,233,0.08)]"
                                : orderTheme === "indigo"
                                ? "from-indigo-50 via-indigo-50/80 to-violet-100/60 border-b-indigo-200/80 border-x-indigo-100/80 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(99,102,241,0.08)]"
                                : orderTheme === "amber"
                                ? "from-amber-50 via-amber-50/80 to-orange-100/60 border-b-amber-200/80 border-x-amber-100/80 text-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(245,158,11,0.08)]"
                                : "from-rose-50/90 via-rose-50/70 to-red-100/50 border-b-rose-200/80 border-x-rose-100/80 text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(244,63,94,0.08)]"
                            }`}>
                              <HoverMorphIcon 
                                defaultIcon={LucideMapPin} 
                                hoverIcon={LucidePencil} 
                                isHovered={isAddressHovered} 
                                className={`w-[17px] h-[17px] ${
                                  orderTheme === "emerald" ? "text-emerald-600 group-hover:text-emerald-700" :
                                  orderTheme === "sky" ? "text-sky-600 group-hover:text-sky-700" :
                                  orderTheme === "indigo" ? "text-indigo-600 group-hover:text-indigo-700" :
                                  orderTheme === "amber" ? "text-amber-600 group-hover:text-amber-700" :
                                  "text-rose-600 group-hover:text-rose-700"
                                }`} 
                                size={17} 
                              />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-[10.6px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0 whitespace-nowrap">
                                Địa chỉ giao nhận hàng:
                              </span>
                              <p className="text-[12.7px] font-semibold text-slate-700 truncate min-w-0" title={activeOrder.shippingAddress}>
                                {activeOrder.shippingAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 min-h-0 bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-2xl p-12 flex flex-col items-center justify-center shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] select-none pointer-events-none"
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="w-18 h-18 rounded-2xl bg-gradient-to-b from-white/95 via-white/80 to-slate-100/60 border-t border-t-white border-b border-b-slate-200/80 border-x border-x-white/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-center">
                          <Truck className="w-8 h-8 text-slate-300 stroke-[1.4]" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* POPUP ACCOUNTS CENTER MODAL (Meta / Apple ID Style 2-Column Portal - 30% Expanded) */}
      <AnimatePresence>
        {isAccountsCenterOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 lg:p-8 select-none">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountsCenterOpen(false)}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-md"
            />

            {/* Modal Dialog Box (Standard Accounts Center Frame max-w-6xl ~1152px, height 780px with 3D Optical Bevel) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-6xl bg-gradient-to-b from-white/98 via-white/95 to-slate-50/90 backdrop-blur-2xl border-t border-t-white border-b border-b-slate-300/80 border-x border-x-white/80 rounded-[28px] shadow-[0_32px_100px_-20px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col md:flex-row overflow-hidden max-h-[92vh] md:h-[750px] lg:h-[780px] z-10"
            >
              
              {/* LEFT COLUMN: Sidebar Navigation / Context Data View */}
              <div className="w-full md:w-80 lg:w-[320px] bg-slate-50/90 border-b md:border-b-0 md:border-r border-slate-200/70 p-4 sm:p-4.5 flex flex-col justify-between shrink-0 text-left relative overflow-hidden">
                {/* Ambient glow matching page deep indigo/violet theme in top-left */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-purple-700/8 blur-3xl pointer-events-none z-0" />
                {(activeModalTab === "addresses" && isAddingAddress) ? (
                  /* WHEN FORM IS OPEN: Show existing data list on the left side */
                  <div className="flex flex-col h-full relative z-10">
                    {/* Header with back button & count */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer group"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Danh sách địa chỉ</span>
                      </button>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/60 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] text-slate-700 rounded-full">
                        {addresses.length} đã lưu
                      </span>
                    </div>

                    {/* Scrollable list of existing items (Space-optimized & Refined with Bevel) */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -m-1.5 p-1.5 space-y-2.5 min-h-0">
                      {activeModalTab === "addresses" && addresses.map(addr => {
                        const isOffice = addr.type === "office";
                        const isCurrentlyEditing = editingAddressSku === addr.sku;
                        return (
                          <div 
                            key={addr.sku}
                            onClick={() => handleOpenEditAddress(addr)}
                            className={`p-3 rounded-2xl text-left transition-all cursor-pointer relative group ${
                              isCurrentlyEditing
                                ? "bg-gradient-to-b from-white via-indigo-50/40 to-indigo-50/60 border-t border-t-white border-b border-b-indigo-400/70 border-x border-x-indigo-300/60 ring-2 ring-indigo-500/20 shadow-[0_4px_14px_-2px_rgba(79,70,229,0.12),inset_0_1px_0_rgba(255,255,255,1)]"
                                : addr.isDefault 
                                  ? "bg-gradient-to-b from-white via-white/95 to-indigo-50/30 border-t border-t-white border-b border-b-indigo-200/80 border-x border-x-indigo-100/80 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:border-indigo-300" 
                                  : "bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 hover:from-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-t border-t-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ${
                                  isOffice ? "bg-gradient-to-b from-indigo-100 to-indigo-200/60 text-indigo-700" : "bg-gradient-to-b from-violet-100 to-violet-200/60 text-violet-700"
                                }`}>
                                  {isOffice ? <Building2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-bold text-slate-900 truncate">{addr.recipientName}</span>
                              </div>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 font-bold uppercase bg-gradient-to-b from-indigo-50 to-indigo-100/80 text-indigo-700 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 rounded-full shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(99,102,241,0.08)]">
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" /> Mặc định
                                </span>
                              )}
                            </div>

                            <div className="space-y-0.5 pl-8">
                              <p className="text-[11px] font-mono font-medium text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{addr.phoneNumber}</span>
                              </p>
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {addr.address}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom action when form is open */}
                    <div className="pt-2.5 mt-2.5 border-t border-slate-200/70 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="w-full bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-white hover:to-white/85 text-slate-700 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] active:scale-95"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hủy bỏ biểu mẫu</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* WHEN NO FORM IS OPEN: Standard Navigation Sidebar */
                  <>
                    <div className="space-y-5 relative z-10">
                      
                      {/* Top Branding (Horizon Signature Theme) */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-[#FF4D24]/90 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] border-t border-t-white/80 border-b border-b-slate-400/60 border-x border-x-white/50 ring-2 ring-indigo-50/80 shrink-0">
                          <Sliders className="w-5 h-5 text-white stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Trung tâm tài khoản</h3>
                          <p className="text-[10px] text-[#FF4D24] font-bold font-mono uppercase tracking-wider">Horizon Accounts Center</p>
                        </div>
                      </div>


                      {/* Navigation Tabs with Semantic Chromatic Accents */}
                      <div className="space-y-1.5">
                        {(
                          [
                            { 
                              id: "profile", 
                              label: "Hồ sơ cá nhân", 
                              icon: User, 
                              desc: "Tên, email, số điện thoại",
                              iconBoxClass: "bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-600 border-indigo-200/60"
                            },
                            { 
                              id: "addresses", 
                              label: "Sổ địa chỉ nhận hàng", 
                              icon: MapPin, 
                              count: addresses.length, 
                              desc: "Địa chỉ giao nhận",
                              iconBoxClass: "bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-600 border-indigo-200/60"
                            },
                            { 
                              id: "sessions", 
                              label: "Thiết bị & Phiên", 
                              icon: Laptop, 
                              desc: "Quản lý phiên đăng nhập",
                              iconBoxClass: "bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-600 border-indigo-200/60"
                            },
                            { 
                              id: "bookmarks", 
                              label: "Sản phẩm & Phụ kiện đã lưu", 
                              icon: Bookmark, 
                              count: userBookmarks.length, 
                              desc: "Bookmarks 1h & 7 ngày",
                              iconBoxClass: "bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-600 border-indigo-200/60"
                            }
                          ] as Array<{
                            id: "profile" | "addresses" | "sessions" | "bookmarks";
                            label: string;
                            icon: typeof User;
                            desc: string;
                            count?: number;
                            iconBoxClass: string;
                          }>
                        ).map(tab => {
                          const Icon = tab.icon;
                          const isActive = activeModalTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveModalTab(tab.id);
                                setErrorMsg("");
                                setSuccessMsg("");
                                setIsAddingAddress(false);
                              }}
                              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border group ${
                                isActive
                                  ? "bg-gradient-to-b from-indigo-100/95 via-indigo-100/80 to-indigo-200/70 hover:from-indigo-150 hover:to-indigo-200/90 border-t border-t-white border-b border-b-indigo-300 border-x border-x-indigo-200 text-indigo-950 shadow-[0_3px_10px_-1px_rgba(99,102,241,0.18),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-indigo-500/30"
                                  : "border-transparent text-slate-700 hover:bg-gradient-to-b hover:from-white/95 hover:via-white/85 hover:to-white/70 hover:border-t-white hover:border-b-slate-200/80 hover:border-x-slate-100/80 hover:shadow-[0_2px_8px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                  isActive
                                    ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-t border-t-indigo-300/60 border-b border-b-indigo-900/60 border-x border-x-indigo-600 shadow-[0_2px_6px_rgba(79,70,229,0.3),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-indigo-500/20"
                                    : `${tab.iconBoxClass} border shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)]`
                                }`}>
                                  <Icon className="w-4 h-4 stroke-[2]" />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`block leading-tight truncate ${isActive ? "text-indigo-950 font-black" : "text-slate-800 group-hover:text-slate-900 font-bold"}`}>
                                      {tab.label}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-normal leading-none block mt-0.5 truncate ${isActive ? "text-indigo-700 font-semibold" : "text-slate-400 group-hover:text-slate-500"}`}>
                                    {tab.desc}
                                  </span>
                                </div>
                              </div>
                              {tab.count !== undefined && (
                                <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2 ${
                                  isActive 
                                    ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-t border-t-indigo-300/60 border-b border-b-indigo-900/60 border-x border-x-indigo-600 shadow-[0_1px_3px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]" 
                                    : "bg-gradient-to-b from-white/95 to-slate-100 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] text-slate-700"
                                }`}>
                                  {tab.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Close Button in Sidebar */}
                    <div className="pt-4 mt-auto border-t border-slate-200/60 hidden md:block relative z-10">
                      <button
                        type="button"
                        onClick={() => setIsAccountsCenterOpen(false)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all duration-300 ease-out flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-white/95 via-white/80 to-slate-50/80 backdrop-blur-sm border-t border-t-white border-b border-b-slate-300/70 border-x border-x-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] hover:-translate-y-px active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                      >
                        <X className="w-4 h-4" />
                        <span>Đóng trung tâm tài khoản</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: Active Tab Content Panel (Optimized Edge-to-Edge Spacing) */}
              <div className="flex-1 bg-gradient-to-br from-slate-50/95 via-slate-50/60 to-indigo-50/20 p-3.5 sm:p-4 lg:p-4.5 overflow-y-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col text-left relative min-h-0">
                
                {/* Panel Header */}
                <div className="flex items-start justify-between gap-3 pb-2.5 mb-3 border-b border-slate-200/80 shrink-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {isAddingAddress ? (editingAddressSku ? "Chỉnh sửa địa chỉ nhận hàng" : "Thêm địa chỉ giao nhận mới") : (
                        <>
                          {activeModalTab === "profile" && "Thông tin hồ sơ cá nhân"}
                          {activeModalTab === "addresses" && "Quản lý sổ địa chỉ giao hàng"}
                          {activeModalTab === "sessions" && "Thiết bị & Phiên hoạt động"}
                          {activeModalTab === "bookmarks" && "Sản phẩm & Phụ kiện đã lưu (Bookmarks)"}
                        </>
                      )}
                    </h2>
                  </div>
                  
                  {/* Header Actions: Only single action button during address edit */}
                  {isAddingAddress ? (
                    <div className="flex items-center shrink-0">
                      <button
                        type="submit"
                        form="address-form"
                        disabled={
                          actionLoading ||
                          !newAddressForm.recipientName.trim() ||
                          !newAddressForm.phone.trim() ||
                          !newAddressForm.address.trim()
                        }
                        className="h-9 px-4.5 bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border-t border-t-indigo-300/70 border-b border-b-indigo-950 border-x border-x-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-[0_3px_12px_rgba(79,70,229,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>{editingAddressSku ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      {activeModalTab === "bookmarks" && (
                        <BevelButton
                          size="icon"
                          variant="button"
                          onClick={() => loadUserBookmarks(true)}
                          disabled={isBookmarksLoading}
                          title="Làm mới từ máy chủ"
                          className="w-9 h-9 rounded-full shrink-0"
                        >
                          <RefreshCw className={`w-4 h-4 ${isBookmarksLoading ? "animate-spin text-[#FF4D24]" : "text-slate-500"}`} />
                        </BevelButton>
                      )}
                      <button 
                        onClick={() => setIsAccountsCenterOpen(false)}
                        className="w-9 h-9 rounded-full bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-white hover:to-white/85 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 shadow-[0_2px_5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-center text-slate-500 hover:text-black transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Đóng"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  )}
                </div>



                {/* TAB 1: Profile Information & Identity Redesign */}
                {activeModalTab === "profile" && (
                  <div className="space-y-4 flex-1 flex flex-col min-h-0 text-left">
                    {/* 1. HERO IDENTITY & AVATAR CARD */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 border-t border-t-white border-b border-b-slate-200/80 border-x border-x-slate-100 p-4.5 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] shrink-0">
                      {/* Decorative ambient corner glow */}
                      <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-[#FF4D24]/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3.5">
                          {/* Avatar with live upload & hover action */}
                          <div className="relative group shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shadow-[0_8px_20px_-4px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-t-white/80 border-b border-b-slate-400/40 border-x border-x-white/50 ring-2 ring-slate-900/5">
                            {(editAvatarUrl || user?.avatarUrl) ? (
                              <img 
                                src={editAvatarUrl || user?.avatarUrl} 
                                alt={user?.fullName || "Avatar"} 
                                className="w-full h-full object-cover block"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-[#FF4D24]/90 text-white flex items-center justify-center font-display font-black text-xl sm:text-2xl select-none">
                                <span>{editFullName ? editFullName.charAt(0).toUpperCase() : (user?.fullName ? user.fullName.charAt(0).toUpperCase() : "H")}</span>
                              </div>
                            )}

                            {/* Hover trigger for file upload */}
                            <button
                              type="button"
                              onClick={() => avatarFileInputRef.current?.click()}
                              disabled={isUploadingAvatar}
                              className="absolute inset-0 bg-black/65 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer active:scale-95 rounded-2xl"
                              title="Nhấn để đổi ảnh đại diện"
                            >
                              {isUploadingAvatar ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Camera className="w-4 h-4 mb-0.5 drop-shadow-xs" />
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider drop-shadow-xs">Đổi ảnh</span>
                                </>
                              )}
                            </button>

                            {/* Hidden file input */}
                            <input 
                              ref={avatarFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarFileUpload}
                            />
                          </div>

                          {/* User Meta Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                                {editFullName || user?.fullName || "Người dùng"}
                              </h2>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono flex-wrap">
                              <span>@{user?.username || "username"}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 truncate max-w-[180px] sm:max-w-[240px]">{user?.email || "user@horizon.net"}</span>
                            </div>

                            {lastSyncTime && (
                              <div className="pt-0.5 flex items-center gap-2">
                                <span className="text-[9.5px] text-slate-400 font-mono">
                                  Đồng bộ: {lastSyncTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>


                    {/* 2. FORM PROFILE FIELDS (With In-Place Animated Username Drawer) */}
                    <form onSubmit={handleSaveProfile} className="bg-gradient-to-b from-white via-white/95 to-slate-50/60 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 rounded-3xl p-4 sm:p-5 shadow-[0_3px_10px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] space-y-4">
                      

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Field: Họ và tên */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 block">
                            Họ và tên
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              placeholder="Nhập họ và tên đầy đủ..."
                              className="w-full bg-slate-50/80 focus:bg-white border-t border-t-slate-200/90 border-b border-b-slate-300/60 border-x border-x-slate-200/80 focus:border-[#FF4D24] focus:ring-2 focus:ring-[#FF4D24]/15 text-xs px-3.5 py-2.5 rounded-2xl outline-none transition-all text-[#111111] font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_1px_0_rgba(255,255,255,0.9)] pl-9.5"
                            />
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Field: Số điện thoại */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 block">
                            Số điện thoại liên hệ
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="Nhập số điện thoại..."
                              className="w-full bg-slate-50/80 focus:bg-white border-t border-t-slate-200/90 border-b border-b-slate-300/60 border-x border-x-slate-200/80 focus:border-[#FF4D24] focus:ring-2 focus:ring-[#FF4D24]/15 text-xs px-3.5 py-2.5 rounded-2xl outline-none transition-all text-[#111111] font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_1px_0_rgba(255,255,255,0.9)] pl-9.5 font-mono"
                            />
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Field: Ngày sinh */}
                        <BirthdayDatePicker
                          value={editDateOfBirth}
                          onChange={(val) => setEditDateOfBirth(val)}
                          onSaveImmediate={handleSaveBirthdayImmediate}
                          disabled={actionLoading}
                        />
                        {/* Field: Giới tính */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 block">
                            Giới tính
                          </label>
                          <div className="relative grid grid-cols-3 p-1 rounded-2xl bg-slate-100/85 border-t border-t-slate-300/60 border-b border-b-white/80 border-x border-x-slate-200/70 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.06),inset_0_-1px_0_rgba(255,255,255,0.7),0_1px_0_rgba(255,255,255,0.8)]">
                            {[
                              { id: "male", label: "Nam" },
                              { id: "female", label: "Nữ" },
                              { id: "other", label: "Khác" }
                            ].map((g) => {
                              const isSelected = editGender.toLowerCase() === g.id;
                              return (
                                 <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => setEditGender(g.id)}
                                  className={`relative z-10 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center select-none ${
                                    isSelected ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.div
                                      layoutId="active-gender-pill"
                                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                      className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-slate-50 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/80 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]"
                                    />
                                  )}
                                  <span className="relative z-10 flex items-center justify-center">
                                    <span>{g.label}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* Field: Địa chỉ mặc định */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 block">
                            Địa chỉ giao hàng mặc định
                          </label>
                          <div
                            onClick={() => {
                              setActiveModalTab("addresses");
                              if (addresses.length === 0) setIsAddingAddress(true);
                            }}
                            className="relative flex items-center justify-between p-3 rounded-2xl bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 border-t border-t-white border-b border-b-slate-300/80 border-x border-x-slate-200/90 cursor-pointer transition-all hover:from-white hover:to-slate-50 hover:border-b-slate-400/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] group"
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-xs font-medium text-slate-700 truncate">
                                {addresses.find(a => a.isDefault)?.address || "Chưa thiết lập địa chỉ"}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS (Clean bottom alignment inside the card) */}
                      <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/70">
                        {isProfileDirty && (
                          <button
                            type="button"
                            onClick={handleResetProfileForm}
                            className="px-4 py-2.5 bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                          >
                            Đặt lại
                          </button>
                        )}

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-b from-[#FF552B] via-[#FF4D24] to-[#E83F16] hover:from-[#ff643c] hover:to-[#f0471f] border-t border-t-white/35 border-b border-b-black/25 border-x border-x-transparent text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(255,77,36,0.3),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:shadow-[0_4px_16px_rgba(255,77,36,0.38),inset_0_1px_0_rgba(255,255,255,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <span>Lưu thay đổi hồ sơ</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}


                {/* TAB 3: Address Book */}
                {activeModalTab === "addresses" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {isAddingAddress ? (
                      /* TOP-COMPACT-FORM & FULL-HEIGHT MAP (WITH 65/35 RATIO & MINIMAL EYE BLUR SAVER) */
                      <motion.form
                        id="address-form"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSaveAddress}
                        className="flex flex-col gap-2.5 text-left flex-1 min-h-0"
                      >
                        {/* Error Banner inside Form */}
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-2.5 bg-gradient-to-b from-rose-50 to-rose-100/70 border-t border-t-white border-b border-b-rose-300 border-x border-x-rose-200 text-rose-700 rounded-xl flex items-start gap-2.5 text-left text-xs shrink-0 shadow-[0_2px_6px_rgba(225,29,72,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="font-bold text-rose-900">Không thể lưu địa chỉ:</p>
                              <p className="text-rose-700 text-xs leading-snug">{errorMsg}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* TOP SECTION: Expanded Input Dashboard with 3D Bevel */}
                        <div className="bg-gradient-to-b from-white/98 via-white/90 to-white/80 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] shrink-0 w-full">
                          {/* Row 1: Recipient, Phone, Address Type, Default Switch */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center w-full">
                            
                            {/* Recipient Name */}
                            <div className="md:col-span-4">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                                <User className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Người nhận</span> <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Họ và tên..."
                                value={newAddressForm.recipientName}
                                onChange={(e) => {
                                  setNewAddressForm({ ...newAddressForm, recipientName: e.target.value });
                                  if (errorMsg) setErrorMsg("");
                                }}
                                className="w-full h-9 px-3 bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-slate-400"
                              />
                            </div>

                            {/* Phone Number */}
                            <div className="md:col-span-3">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Số điện thoại</span> <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="090xxxxxxx"
                                value={newAddressForm.phone}
                                onChange={(e) => {
                                  setNewAddressForm({ ...newAddressForm, phone: e.target.value });
                                  if (errorMsg) setErrorMsg("");
                                }}
                                className="w-full h-9 px-3 bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-mono font-medium text-slate-900 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-slate-400"
                              />
                            </div>

                            {/* Address Type: Modern Segmented Control */}
                            <div className="md:col-span-3">
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">Loại địa chỉ</label>
                              <div className="relative grid grid-cols-2 p-1 rounded-xl bg-slate-100/80 border-t border-t-slate-300/50 border-b border-b-white/80 border-x border-x-slate-200/60 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)] h-9">
                                <button
                                  type="button"
                                  onClick={() => setNewAddressForm({ ...newAddressForm, type: "office" })}
                                  className={`relative z-10 flex-1 h-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
                                    newAddressForm.type === "office"
                                      ? "text-indigo-900"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {newAddressForm.type === "office" && (
                                    <motion.div
                                      layoutId="active-address-type"
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-slate-50 border-t border-t-white border-b border-b-slate-200/80 border-x border-x-white/80 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] -z-10"
                                    />
                                  )}
                                  <Building2 className={`w-3.5 h-3.5 ${newAddressForm.type === "office" ? "text-indigo-600" : ""}`} />
                                  <span>Văn phòng</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewAddressForm({ ...newAddressForm, type: "home" })}
                                  className={`relative z-10 flex-1 h-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
                                    newAddressForm.type === "home"
                                      ? "text-violet-900"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {newAddressForm.type === "home" && (
                                    <motion.div
                                      layoutId="active-address-type"
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-slate-50 border-t border-t-white border-b border-b-slate-200/80 border-x border-x-white/80 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] -z-10"
                                    />
                                  )}
                                  <Home className={`w-3.5 h-3.5 ${newAddressForm.type === "home" ? "text-violet-600" : ""}`} />
                                  <span>Nhà riêng</span>
                                </button>
                              </div>
                            </div>

                            {/* Default Address: Sleek Interactive Toggle Card */}
                            <div className="md:col-span-2 flex flex-col justify-end">
                              <span className="text-[11px] font-bold text-slate-700 block mb-1">Mặc định</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={newAddressForm.isDefault}
                                onClick={() => setNewAddressForm({ ...newAddressForm, isDefault: !newAddressForm.isDefault })}
                                className={`h-9 px-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
                                  newAddressForm.isDefault 
                                    ? "bg-gradient-to-b from-indigo-50 via-indigo-50/80 to-indigo-100/60 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 text-indigo-900 shadow-[0_1px_3px_rgba(99,102,241,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]" 
                                    : "bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:from-white"
                                }`}
                                title="Bật/Tắt làm địa chỉ giao hàng mặc định"
                              >
                                <span className="text-[11px] font-bold">
                                  {newAddressForm.isDefault ? "Mặc định" : "Thường"}
                                </span>
                                <div className={`w-7 h-4 rounded-full transition-colors relative p-0.5 flex items-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] ${
                                  newAddressForm.isDefault ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                                }`}>
                                  <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                                </div>
                              </button>
                            </div>

                          </div>

                          {/* Row 2: Address Search Input (65%) & Instant Geocoding Chip (35%) */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Địa chỉ chi tiết (Tự động Geocoding tọa độ) <span className="text-rose-500">*</span>
                            </label>

                            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                              {/* Flexible Width Search Input */}
                              <div className="relative flex-1 min-w-0 w-full">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                  <Search className="w-3.5 h-3.5" />
                                </div>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                                  value={newAddressForm.address}
                                  onChange={(e) => {
                                    setNewAddressForm({ ...newAddressForm, address: e.target.value });
                                    if (errorMsg) setErrorMsg("");
                                  }}
                                  className="w-full h-9.5 pl-9 pr-9 bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-medium text-slate-900 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-slate-400"
                                />
                                {newAddressForm.address.trim() && (
                                  <button
                                    type="button"
                                    onClick={handleManualResolveAddress}
                                    disabled={isResolvingAddress}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                                    title="Chủ động tải lại vị trí / Geocoding tọa độ"
                                  >
                                    {isResolvingAddress ? (
                                      <BeatLoader color="#4f46e5" size={3} margin={1.5} speedMultiplier={0.8} />
                                    ) : (
                                      <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Fixed Width Tactile Geocoding Capsule */}
                              <div className="w-full sm:w-[220px] shrink-0">
                                {isResolvingAddress ? (
                                  <div className="w-full h-9.5 rounded-xl bg-slate-100/90 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-slate-200/70 p-1 flex items-center justify-center gap-2 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03)]">
                                    <div className="relative flex items-center justify-center size-3.5 shrink-0">
                                      <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                                    </div>
                                    <span className="text-[11px] font-bold text-indigo-900 tracking-tight">Đang quét định vị...</span>
                                  </div>
                                ) : resolvedPreview && resolvedPreview.success ? (
                                  <div className="w-full h-9.5 rounded-xl bg-gradient-to-b from-slate-100/90 via-slate-50/80 to-slate-100/90 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-slate-200/70 p-1 flex items-center shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03),0_1px_0_rgba(255,255,255,0.8)]">
                                    {/* Tactile Monospace Coordinate Chip (Full Width, No Ping, No Chuẩn hóa/Chuẩn xác badge) */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (resolvedPreview?.latitude && resolvedPreview?.longitude) {
                                          const mapShareText = `https://maps.google.com/?q=${resolvedPreview.latitude.toFixed(6)},${resolvedPreview.longitude.toFixed(6)}`;
                                          navigator.clipboard.writeText(mapShareText);
                                          setSuccessMsg("Đã sao chép liên kết vị trí bản đồ!");
                                          setCopiedCoord(true);
                                          setTimeout(() => {
                                            setSuccessMsg((prev) => (prev === "Đã sao chép liên kết vị trí bản đồ!" ? "" : prev));
                                            setCopiedCoord(false);
                                          }, 1200);
                                        }
                                      }}
                                      title="Bấm vào để sao chép liên kết vị trí bản đồ"
                                      className="w-full h-full px-2.5 rounded-lg bg-gradient-to-b from-white via-white/95 to-slate-50 hover:to-white border-t border-t-white border-b border-b-slate-200/90 border-x border-x-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-between gap-1.5 min-w-0 cursor-pointer group/geo select-none transition-all active:scale-[0.98]"
                                    >
                                      {/* Solid Beacon Dot (animate-ping removed) */}
                                      <span className="size-1.5 rounded-full bg-emerald-500 shadow-xs shrink-0" />

                                      {/* Coordinate Value */}
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
                                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 group-hover/geo:text-indigo-600 transition-colors shrink-0">
                                          GPS
                                        </span>
                                        <span className="font-mono text-[11px] font-bold text-slate-700 tracking-tight truncate group-hover/geo:text-indigo-600 transition-colors">
                                          {copiedCoord ? "Đã sao chép!" : `${resolvedPreview.latitude.toFixed(4)}, ${resolvedPreview.longitude.toFixed(4)}`}
                                        </span>
                                      </div>

                                      {/* Micro Copy Feedback */}
                                      {copiedCoord ? (
                                        <Check className="size-3 text-emerald-600 shrink-0 animate-in zoom-in" />
                                      ) : (
                                        <Copy className="size-2.5 text-slate-400 group-hover/geo:text-indigo-600 shrink-0 transition-colors" />
                                      )}
                                    </button>
                                  </div>
                                ) : resolvedPreview && !resolvedPreview.success ? (
                                  <div className="w-full h-9.5 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/60 border-t border-t-white border-b border-b-amber-300/70 border-x border-x-amber-200/80 px-2.5 flex items-center justify-between gap-1.5 shadow-[inset_0_1px_2px_rgba(245,158,11,0.05)]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                                      <span className="text-[11px] font-bold text-amber-800 truncate">Không tìm thấy tọa độ</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleManualResolveAddress}
                                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 shrink-0 cursor-pointer"
                                    >
                                      Thử lại
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-full h-9.5 rounded-xl bg-slate-100/60 border border-slate-200/70 border-dashed px-3 flex items-center gap-2 text-slate-400 select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                                    <MapPin className="size-3.5 text-slate-400/80 shrink-0" />
                                    <span className="text-[11px] font-medium text-slate-500 truncate">Tọa độ GPS tự động cập nhật</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM SECTION: Full-Height Clean Interactive Map Viewport (MINIMAL EYE BLUR SAVER with Bevel) */}
                        <div className="flex-1 min-h-[360px] rounded-2xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-slate-200 bg-slate-100 overflow-hidden relative shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] flex">
                          
                          {/* Map Viewport Area */}
                          <div className="w-full h-full relative bg-slate-100 flex items-center justify-center overflow-hidden flex-1 [transform:translateZ(0)] isolate">
                            {resolvedPreview?.success && resolvedPreview.latitude && resolvedPreview.longitude ? (
                              <>
                                {/* Direct crisp live map iframe without blur filter, scaling, or transition lag */}
                                <iframe
                                  key={mapKey}
                                  title="Live Map Preview"
                                  src={`https://maps.google.com/maps?q=${resolvedPreview.latitude},${resolvedPreview.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                                  className={`w-full h-full border-0 absolute inset-0 ${
                                    isMapActive 
                                      ? "opacity-100 pointer-events-auto" 
                                      : "opacity-40 pointer-events-none"
                                  }`}
                                />
                                {/* Performance Saver Overlay: Single Minimal Eye Button with 3D Bevel */}
                                {!isMapActive && (
                                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/20 p-4">
                                    <button
                                      type="button"
                                      onClick={() => setIsMapActive(true)}
                                      className="w-14 h-14 rounded-full bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-white hover:to-white/85 text-indigo-600 shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,1)] hover:scale-110 active:scale-95 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 flex items-center justify-center transition-all cursor-pointer group"
                                      title="Bật hiển thị bản đồ tương tác"
                                    >
                                      <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                )}

                                {/* Floating Location Action Bar when Map is Active (No Name, Recenter Icon + Google Maps Button) */}
                                {isMapActive && (
                                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-gradient-to-b from-white/95 via-white/90 to-white/80 backdrop-blur-md p-1 rounded-xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_4px_14px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] animate-in fade-in duration-200">
                                    {/* Button 1: Recenter map to target address (Icon Only) */}
                                    <button
                                      type="button"
                                      onClick={() => setMapKey(prev => prev + 1)}
                                      className="w-6.5 h-6.5 bg-gradient-to-b from-indigo-50 via-indigo-50/80 to-indigo-100/60 hover:from-indigo-100 text-indigo-700 rounded-lg border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(99,102,241,0.06)]"
                                      title="Trỏ lại tâm vị trí"
                                    >
                                      <LocateFixed className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>

                                    {/* Button 2: Open in Google Maps */}
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${resolvedPreview.latitude},${resolvedPreview.longitude}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-white text-slate-700 text-[10.5px] font-bold rounded-lg border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                      title="Mở vị trí này trên Google Maps"
                                    >
                                      <span>Google Maps</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                  </div>
                                )}
                              </>
                            ) : isResolvingAddress ? (
                              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
                                <div className="relative">
                                  <div className="w-14 h-14 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
                                  <Compass className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-800">Đang quét định vị bản đồ...</p>
                                  <p className="text-[11px] text-slate-500">Hệ thống đang kết nối OpenStreetMap Geocoding API</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center z-10 max-w-sm">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-indigo-50 to-indigo-100/70 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 text-indigo-600 flex items-center justify-center shadow-[0_2px_6px_rgba(99,102,241,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
                                  <LucideMap className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-800">Chưa có vị trí trên bản đồ</p>
                                  <p className="text-xs text-slate-500">Nhập địa chỉ ở trên để hiển thị bản đồ toàn cảnh.</p>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </motion.form>
                    ) : (
                      /* DEFAULT VIEW: Header + 2-Column Grid of Addresses */
                      <>
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-bold text-slate-700">{addresses.length} địa chỉ nhận hàng đã lưu</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(true);
                              setEditingAddressSku(null);
                              setIsMapActive(true);
                              setNewAddressForm({
                                recipientName: user?.fullName || "",
                                phone: user?.phoneNumber || "",
                                address: "",
                                type: "office",
                                isDefault: false
                              });
                              setErrorMsg("");
                              setSuccessMsg("");
                            }}
                            className="px-4 py-2 bg-gradient-to-b from-indigo-50/90 via-indigo-50/70 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-150 border-t border-t-white border-b border-b-indigo-200/80 border-x border-x-indigo-100/80 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_6px_-1px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm địa chỉ mới</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr) => {
                            const isOffice = addr.type === "office";
                            return (
                              <div
                                key={addr.sku}
                                className={`relative p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                                  addr.isDefault 
                                    ? "bg-gradient-to-b from-white via-indigo-50/25 to-indigo-50/45 border-t border-t-white border-b border-b-indigo-300/80 border-x border-x-indigo-200/70 shadow-[0_4px_16px_-2px_rgba(79,70,229,0.08),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-indigo-500/15" 
                                    : "bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 hover:from-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)]"
                                }`}
                              >
                                {addr.isDefault && (
                                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/70 to-transparent" />
                                )}

                                <div className="space-y-3">
                                  {/* Header: Name, Type Badge & Default Status */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border-t border-t-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)] transition-transform group-hover:scale-105 ${
                                        isOffice 
                                          ? "bg-gradient-to-b from-indigo-100 to-indigo-200/60 text-indigo-700 border-b border-b-indigo-300/60 border-x border-x-indigo-200/50" 
                                          : "bg-gradient-to-b from-violet-100 to-violet-200/60 text-violet-700 border-b border-b-violet-300/60 border-x border-x-violet-200/50"
                                      }`}>
                                        {isOffice ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
                                            {addr.recipientName}
                                          </h4>
                                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border-t border-t-white border-b border-x shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] ${
                                            isOffice 
                                              ? "bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-700 border-b-indigo-200 border-x-indigo-100" 
                                              : "bg-gradient-to-b from-violet-50 to-violet-100/70 text-violet-700 border-b-violet-200 border-x-violet-100"
                                          }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOffice ? "bg-indigo-500" : "bg-violet-500"}`} />
                                            {isOffice ? "Văn phòng" : "Nhà riêng"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {addr.isDefault && (
                                      <span className="inline-flex items-center gap-1 text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-gradient-to-b from-indigo-50 to-indigo-100/80 text-indigo-700 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(99,102,241,0.08)] shrink-0 tracking-wider">
                                        <Check className="w-3 h-3 stroke-[2.5]" /> Mặc định
                                      </span>
                                    )}
                                  </div>

                                  {/* Contact & GPS Metadata */}
                                  <div className="flex items-center flex-wrap gap-2 text-xs">
                                    <div className="inline-flex items-center gap-1.5 font-mono text-slate-700 bg-gradient-to-b from-slate-50 to-slate-100/80 px-2.5 py-1 rounded-lg border-t border-t-white border-b border-b-slate-200/80 border-x border-x-slate-100 text-[11px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.03)]">
                                      <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                                      <span>{addr.phoneNumber}</span>
                                    </div>

                                    {addr.latitude && addr.longitude && (
                                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-gradient-to-b from-emerald-50 to-emerald-100/70 px-2.5 py-1 rounded-lg border-t border-t-white border-b border-b-emerald-200 border-x border-x-emerald-100 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,185,129,0.06)]">
                                        <Compass className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>{addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Detailed Address Box */}
                                  <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-gradient-to-b from-white/95 via-slate-50/80 to-slate-100/60 p-2.5 rounded-xl border-t border-t-white border-b border-b-slate-200/80 border-x border-x-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.03)]">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 font-medium leading-snug break-words flex-1">
                                      {addr.address}
                                    </span>
                                  </div>
                                </div>

                                {/* Footer Action Bar */}
                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                                  {!addr.isDefault ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAddress(addr.sku)}
                                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1 py-1 active:scale-95"
                                    >
                                      <span>Đặt làm mặc định</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1.5 py-1">
                                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Địa chỉ giao hàng chính</span>
                                    </span>
                                  )}
                                  
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditAddress(addr)}
                                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50 rounded-lg transition-all cursor-pointer border hover:border-indigo-200/70 active:scale-95"
                                      title="Chỉnh sửa địa chỉ"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAddress(addr.sku)}
                                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-gradient-to-b hover:from-white hover:to-rose-50 rounded-lg transition-all cursor-pointer border hover:border-rose-200/70 active:scale-95"
                                      title="Xóa địa chỉ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}



                {/* TAB 5: System Settings, API Gateway & Active Sessions */}
                {activeModalTab === "sessions" && (
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    
                    {/* 1. API Gateway & Network Ping Probe Control Card (Bevel Glassmorphism) */}
                    <div className="p-4 sm:p-5 bg-gradient-to-b from-white via-white/95 to-slate-50/80 border-t border-t-white border-b border-b-slate-300/80 border-x border-x-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-slate-900/5 text-left space-y-3.5 shrink-0 relative overflow-hidden">
                      {/* Ambient corner glow */}
                      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                      {/* Header with Title, Status Badge & Ping Probe Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] border-t border-t-white/30">
                            <Server className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 leading-tight">
                                API Gateway & Kết Nối Hệ Thống
                              </h4>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                TLS 1.3 • Bearer
                              </span>
                            </div>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                              Cấu hình phân giải Endpoint máy chủ và giám sát đường truyền
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                          {/* Live Status Badge */}
                          {isPinging ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/90 px-2.5 py-1 rounded-xl shadow-sm">
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                              Đang đo độ trễ...
                            </span>
                          ) : pingResult ? (
                            pingResult.success ? (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border shadow-sm ${
                                  pingResult.latencyMs < 100
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/90"
                                    : pingResult.latencyMs <= 300
                                    ? "bg-amber-50 text-amber-700 border-amber-200/90"
                                    : "bg-rose-50 text-rose-700 border-rose-200/90"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    pingResult.latencyMs < 100
                                      ? "bg-emerald-500 animate-pulse"
                                      : pingResult.latencyMs <= 300
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                />
                                {pingResult.latencyMs} ms
                                <span className="text-[10px] font-normal opacity-75 hidden sm:inline">
                                  ({pingResult.latencyMs < 100 ? "Tuyệt vời" : pingResult.latencyMs <= 300 ? "Bình thường" : "Độ trễ cao"})
                                </span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/90 px-2.5 py-1 rounded-xl shadow-sm"
                                title={pingResult.error || "Không thể kết nối"}
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                Không thể kết nối
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-xl">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Sẵn sàng
                            </span>
                          )}

                          {/* Ping Probe Trigger Button */}
                          <button
                            type="button"
                            onClick={() => handlePingTest()}
                            disabled={isPinging}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-b from-white via-slate-50 to-slate-100 border-t border-t-white border-b border-b-slate-300 border-x border-x-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Đo độ trễ tới Endpoint qua API /api/health"
                          >
                            <Activity className={`w-3.5 h-3.5 text-indigo-500 ${isPinging ? "animate-spin" : ""}`} />
                            <span>{isPinging ? "Đang ping..." : "Kiểm tra Ping"}</span>
                          </button>

                          {/* URL Configuration Drawer Trigger Button (ADR-002 & USER_UPDATE_FEATURES_SPEC.md 4.2) */}
                          <button
                            type="button"
                            onClick={() => setIsEndpointDrawerOpen(prev => !prev)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border active:scale-95 ${
                              isEndpointDrawerOpen
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-inner"
                                : "bg-gradient-to-b from-white via-slate-50 to-slate-100 border-t border-t-white border-b border-b-slate-300 border-x border-x-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
                            }`}
                            title="Mở rộng khung tùy chỉnh URL Endpoint máy chủ"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{isEndpointDrawerOpen ? "Đóng cấu hình" : "Cấu hình URL"}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isEndpointDrawerOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Active Gateway URL Indicator */}
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs relative z-10">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            Endpoint Đang Kích Hoạt:
                          </span>
                          <span className="font-mono text-indigo-700 font-semibold truncate select-all" title={apiEndpointUrl}>
                            {apiEndpointUrl}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-medium text-slate-400 shrink-0 hidden sm:inline">
                          Mặc định: http://localhost:8080
                        </span>
                      </div>

                      {/* Endpoint Customization Controls & Presets Drawer (Collapsible) */}
                      <AnimatePresence initial={false}>
                        {isEndpointDrawerOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-2.5 relative z-10 overflow-hidden pt-1"
                          >
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <Wifi className="w-4 h-4" />
                                </div>
                                <input
                                  type="text"
                                  value={customInputUrl}
                                  onChange={(e) => {
                                    setCustomInputUrl(e.target.value);
                                    if (endpointValidationError) setEndpointValidationError("");
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleApplyEndpoint();
                                    }
                                  }}
                                  placeholder="http://localhost:8080 hoặc https://api.yourdomain.com"
                                  className={`w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border rounded-xl shadow-inner focus:outline-none focus:ring-2 transition-all ${
                                    endpointValidationError
                                      ? "border-rose-400 focus:ring-rose-500/20 text-rose-700"
                                      : "border-slate-200/90 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-800"
                                  }`}
                                />
                              </div>

                              {/* Apply & Reset Buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={handleApplyEndpoint}
                                  disabled={isPinging}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 border-t border-t-white/30 border-b border-b-indigo-900/40 border-x border-x-indigo-600/50 shadow-[0_2px_8px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Áp dụng Endpoint</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={handleResetEndpoint}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
                                  title="Khôi phục URL về mặc định hệ thống"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="hidden sm:inline">Khôi phục mặc định</span>
                                </button>
                              </div>
                            </div>

                            {endpointValidationError && (
                              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{endpointValidationError}</span>
                              </div>
                            )}

                            {/* 1-Click Presets */}
                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Cài đặt nhanh (1-Click):
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePresetSelect("http://localhost:8080")}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer active:scale-95 border ${
                                  customInputUrl.trim() === "http://localhost:8080"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <Server className="w-3 h-3 text-indigo-500" />
                                Spring Boot Local (:8080)
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePresetSelect("http://localhost:3000")}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer active:scale-95 border ${
                                  customInputUrl.trim() === "http://localhost:3000"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <Code2 className="w-3 h-3 text-sky-500" />
                                Express BFF (:3000)
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>


                    {/* 2. Subtle, Low-Profile Telemetry Metadata Bar */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50/90 border border-slate-200/70 rounded-xl text-xs text-slate-500 select-none shrink-0">
                      <div className="flex items-center gap-3.5 flex-wrap min-w-0">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          <span>{deviceSessions.length} phiên đang kết nối</span>
                        </span>
                        <span className="text-slate-300 font-mono">•</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>TLS 1.3 • Redis Sync</span>
                        </span>
                        <span className="text-slate-300 font-mono">•</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>Việt Nam (VN)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadDeviceSessions()}
                          disabled={isSessionsLoading}
                          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          title="Làm mới danh sách phiên"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSessionsLoading ? "animate-spin text-indigo-600" : ""}`} />
                          <span className="hidden sm:inline">Làm mới</span>
                        </button>
                        {deviceSessions.some(s => !s.isCurrent) && (
                          <button
                            type="button"
                            onClick={handleTerminateAllOtherSessions}
                            disabled={sessionActionLoading === "others"}
                            className="text-[11.5px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 disabled:opacity-50"
                          >
                            {sessionActionLoading === "others" ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Đăng xuất tất cả khác</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Loading Skeleton */}
                    {isSessionsLoading && deviceSessions.length === 0 ? (
                      <div className="space-y-3 py-2">
                        <div className="p-4.5 rounded-2xl bg-white/70 border border-slate-200/60 animate-pulse space-y-3">
                          <div className="h-5 bg-slate-200/60 rounded w-1/3" />
                          <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="h-8 bg-slate-100/80 rounded-xl" />
                            <div className="h-8 bg-slate-100/80 rounded-xl" />
                            <div className="h-8 bg-slate-100/80 rounded-xl" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 2. Current Session Hero Card */}
                        {(() => {
                          const currentSession = deviceSessions.find(s => s.isCurrent) || deviceSessions[0];
                          if (!currentSession) return null;
                          const isMobile = currentSession.clientType?.toUpperCase() === "MOBILE";
                          const isTablet = currentSession.clientType?.toUpperCase() === "TABLET";

                          return (
                            <div className="p-4 sm:p-4.5 bg-gradient-to-b from-white via-white/98 to-emerald-50/20 border-t border-t-white border-b border-b-emerald-200/80 border-x border-x-emerald-100/70 rounded-2xl shadow-[0_4px_16px_-4px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-emerald-500/15 text-left space-y-2.5 shrink-0 relative overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-emerald-100/80">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] border-t border-t-white/30">
                                    {isTablet ? <Laptop className="w-5 h-5 stroke-[2.2]" /> : (isMobile ? <Smartphone className="w-5 h-5 stroke-[2.2]" /> : <Laptop className="w-5 h-5 stroke-[2.2]" />)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                                        {currentSession.deviceName}
                                      </h4>
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-gradient-to-b from-emerald-50 to-emerald-100 border-t border-t-white border-b border-b-emerald-200 border-x border-x-emerald-100 px-2 py-0.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        HOẠT ĐỘNG NGAY BÂY GIỜ
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      {currentSession.deviceDetail}
                                    </p>
                                  </div>
                                </div>

                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                                  Thiết bị hiện tại
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-xs">
                                <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/60 font-mono text-[11px] text-slate-600 flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">IP: <strong>{currentSession.ip}</strong></span>
                                </div>
                                <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{currentSession.location}</span>
                                </div>
                                <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">Cập nhật: {currentSession.lastActive}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Secondary Connected Devices List */}
                        <div className="space-y-2 text-left shrink-0">
                          <div className="flex items-center justify-between px-1">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                              Các thiết bị khác đã liên kết ({deviceSessions.filter(s => !s.isCurrent).length})
                            </h4>
                          </div>

                          {deviceSessions.filter(s => !s.isCurrent).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {deviceSessions.filter(s => !s.isCurrent).map((session) => {
                                const isTablet = session.clientType?.toUpperCase() === "TABLET";
                                const isMobile = session.clientType?.toUpperCase() === "MOBILE";
                                const isDeleting = sessionActionLoading === session.id;

                                return (
                                  <div
                                    key={session.id}
                                    className="p-3.5 bg-gradient-to-b from-white via-white/95 to-slate-50/70 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 rounded-2xl shadow-[0_2px_8px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] hover:border-slate-300 transition-all flex flex-col justify-between gap-2.5 text-left group"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-t border-t-white ${
                                          isTablet
                                            ? "bg-gradient-to-b from-sky-50 to-sky-100/80 text-sky-700 border-b border-b-sky-200 border-x border-x-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                                            : (isMobile 
                                              ? "bg-gradient-to-b from-indigo-50 to-indigo-100/80 text-indigo-700 border-b border-b-indigo-200 border-x border-x-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                                              : "bg-gradient-to-b from-slate-50 to-slate-100/80 text-slate-700 border-b border-b-slate-200 border-x border-x-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]")
                                        }`}>
                                          {isTablet ? <Laptop className="w-4.5 h-4.5" /> : (isMobile ? <Smartphone className="w-4.5 h-4.5" /> : <Laptop className="w-4.5 h-4.5" />)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-slate-900 truncate leading-tight">
                                            {session.deviceName}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                            {session.deviceDetail}
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleTerminateSession(session.id)}
                                        disabled={isDeleting}
                                        className="h-7 px-2.5 text-[10.5px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 rounded-lg border border-rose-200/80 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs shrink-0 disabled:opacity-50"
                                        title="Đăng xuất khỏi thiết bị này"
                                      >
                                        {isDeleting ? (
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3" />
                                        )}
                                        <span>Đăng xuất</span>
                                      </button>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-0.5">
                                      <p className="font-mono truncate">IP: {session.ip} • {session.location}</p>
                                      <p className="text-slate-400">Hoạt động: {session.lastActive}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-slate-200/90 bg-white/70 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs">
                                <ShieldCheck className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">Không có thiết bị phụ nào khác đang kết nối</p>
                                <p className="text-[10.5px] text-slate-400 mt-0.5 font-mono">Tài khoản chỉ đang đăng nhập duy nhất trên thiết bị hiện tại.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* 4. Bottom Orange Tinted Security Banner with Dynamic Animated Logo */}
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white/95 border-t border-t-white border-b border-b-orange-200/80 border-x border-x-orange-100/80 rounded-2xl flex items-center gap-3.5 text-left shadow-[0_2px_8px_-2px_rgba(255,77,36,0.08),inset_0_1px_0_rgba(255,255,255,1)] relative overflow-hidden mt-auto shrink-0">
                      {/* Ambient orange aura glow */}
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FF4D24]/[0.05] via-amber-500/[0.02] to-transparent" />

                      {/* Dynamic Morphing Security Logo */}
                      <div className="relative z-10 w-10 h-10 rounded-2xl bg-gradient-to-b from-orange-50 to-orange-100/80 border-t border-t-white border-b border-b-orange-200/80 border-x border-x-orange-100 flex items-center justify-center text-[#FF4D24] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(255,77,36,0.15)] shrink-0">
                        <SecurityDynamicMorphIcon />
                      </div>

                      <div className="relative z-10 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-sans font-black text-xs sm:text-[13px] text-slate-900 tracking-tight leading-none">
                            Bảo mật phiên phân tán đa nền tảng
                          </h5>
                          <span className="text-[9px] font-extrabold font-mono px-1.5 py-0.2 rounded-full bg-orange-500/10 text-[#FF4D24] border border-orange-200/70 uppercase">
                            Bảo mật
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          Khi bạn chọn đăng xuất thiết bị, toàn bộ token xác thực trên Redis Gateway BFF sẽ bị thu hồi ngay lập tức.
                        </p>
                      </div>
                    </div>

                  </div>
                )}

                {/* 6. TAB: BOOKMARKS (Phụ kiện mua cùng đã lưu) */}
                {activeModalTab === "bookmarks" && (
                  <div className="space-y-4">
                    {/* Loading Skeleton */}
                    {isBookmarksLoading && userBookmarks.length === 0 && (
                      <div className="space-y-3 py-2">
                        {[1, 2].map((k) => (
                          <div key={k} className="p-5 rounded-2xl bg-white/70 border border-slate-200/60 animate-pulse space-y-3">
                            <div className="h-5 bg-slate-200/70 rounded-md w-1/3" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="h-16 bg-slate-100 rounded-xl" />
                              <div className="h-16 bg-slate-100 rounded-xl" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {!isBookmarksLoading && userBookmarks.length === 0 && (
                      <Bevel variant="card" className="py-12 px-5 text-center flex flex-col items-center justify-center gap-3.5 rounded-2xl">
                        <div className="size-16 rounded-2xl bg-gradient-to-b from-indigo-50 to-indigo-100/70 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 text-indigo-700 flex items-center justify-center shadow-[0_4px_16px_rgba(79,70,229,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                          <Bookmark className="size-8 stroke-[1.75]" />
                        </div>
                        <div className="max-w-md">
                          <h4 className="text-sm font-bold text-slate-800">Chưa có gói phụ kiện nào được lưu</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Khi bạn chọn phụ kiện tại mục <strong className="text-slate-700">"Phụ kiện mua cùng"</strong> ở trang sản phẩm, hệ thống sẽ lưu an toàn trong 1 giờ hoặc 7 ngày để bạn có thể thanh toán combo bất cứ lúc nào.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountsCenterOpen(false);
                            onNavigate("product");
                          }}
                          className="mt-1 px-5 h-10 text-xs font-bold rounded-xl text-white bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border-t border-t-indigo-300/70 border-b border-b-indigo-950 border-x border-x-indigo-500 shadow-[0_3px_12px_rgba(79,70,229,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                        >
                          <ShoppingBag className="size-4" />
                          <span>Khám phá sản phẩm ngay</span>
                        </button>
                      </Bevel>
                    )}

                    {/* Bookmarks List (các bookmark mới nhất luôn xếp ở trên) */}
                    {userBookmarks.length > 0 && (
                      <div className="space-y-4">
                        {sortBookmarksNewestFirst(userBookmarks).map((bookmark) => {
                          const is7Days = (bookmark.ttlSecondsRemaining || 0) > 3600;
                          const hoursLeft = Math.max(1, Math.floor((bookmark.ttlSecondsRemaining || 0) / 3600));
                          const daysLeft = Math.floor(hoursLeft / 24);
                          const isPackageLoading = bookmarkActionLoading === bookmark.mainSku || bookmarkActionLoading === `checkout::${bookmark.mainSku}`;
                          const isExtending = bookmarkActionLoading === `extend::${bookmark.mainSku}`;
                          const isGenericSku = !bookmark.mainSku || bookmark.mainSku.toLowerCase() === "bookmarks";
                          const isFromOrder = bookmark.mainSku.startsWith("ATTR-") || bookmark.mainSku.startsWith("ORDER-") || bookmark.mainSku.startsWith("bm-") || (bookmark.items && bookmark.items.some(i => i.sku === bookmark.mainSku));
                          const friendlyTitle = getFriendlyMainSkuName(bookmark.mainSku, bookmark.items);

                          return (
                            <Bevel
                              key={bookmark.mainSku}
                              variant="card"
                              className="p-4 sm:p-5 rounded-2xl space-y-4 text-left relative overflow-hidden"
                            >
                              {/* Card Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/70">
                                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                  <span className="size-8 rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100/70 border-t border-t-white border-b border-b-indigo-200 border-x border-x-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                                    <Package className="size-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                                        {bookmark.mainSku === "ORDER-BOOKMARK" || isFromOrder ? (
                                          bookmark.items.length === 1 ? (
                                            <>Sản phẩm đã lưu: <span className="text-indigo-600">{bookmark.items[0]?.productName || friendlyTitle}</span></>
                                          ) : (
                                            <>Gói sản phẩm đơn hàng: <span className="text-indigo-600">{bookmark.items.length} sản phẩm</span></>
                                          )
                                        ) : !isGenericSku ? (
                                          <>Phụ kiện mua cùng: <span className="text-indigo-600">{friendlyTitle}</span></>
                                        ) : (
                                          "Gói sản phẩm & phụ kiện đã lưu"
                                        )}
                                      </h3>
                                      {!isGenericSku && (
                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80">
                                          {bookmark.mainSku}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {bookmark.mainSku === "ORDER-BOOKMARK" || isFromOrder
                                        ? `Đã lưu từ đơn hàng • Bao gồm ${bookmark.totalItems || bookmark.items.length} món sản phẩm.`
                                        : `Bao gồm ${bookmark.totalItems || bookmark.items.length} món phụ kiện mua kèm.`}
                                    </p>
                                  </div>
                                </div>

                                {/* Badges & Actions */}
                                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs border ${
                                    is7Days
                                      ? "bg-emerald-50/90 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50/90 text-amber-700 border-amber-200"
                                  }`}>
                                    {is7Days ? <ShieldCheck className="size-3.5 text-emerald-600" /> : <Clock className="size-3.5 text-amber-600 animate-pulse" />}
                                    <span>{is7Days ? `Còn ${daysLeft > 0 ? `${daysLeft} ngày` : `${hoursLeft} giờ`}` : `Lưu tạm (${hoursLeft}h)`}</span>
                                  </span>

                                  {!is7Days && (
                                    <button
                                      type="button"
                                      onClick={() => handleExtendBookmarkPackage(bookmark.mainSku)}
                                      disabled={isExtending}
                                      className="h-7 px-3 text-[10.5px] font-bold text-indigo-700 bg-gradient-to-b from-indigo-50/90 via-indigo-50/70 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-150 border-t border-t-white border-b border-b-indigo-200/80 border-x border-x-indigo-100/80 rounded-lg shadow-[0_1.5px_4px_rgba(99,102,241,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-95 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                    >
                                      {isExtending ? <RefreshCw className="size-3 animate-spin mr-1" /> : <Sparkles className="size-3 text-indigo-600 mr-1" />}
                                      <span>Gia hạn 7 ngày</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Accessories Structured Table / List */}
                              <div className="divide-y divide-slate-100 bg-white/70 rounded-xl border border-slate-200/70 overflow-hidden shadow-2xs">
                                {(bookmark.items || [])
                                  .slice()
                                  .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
                                  .map((item, idx) => {
                                  const isItemDeleting = bookmarkActionLoading === `${bookmark.mainSku}::${item.sku}`;

                                  return (
                                    <div
                                      key={item.sku || idx}
                                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                                    >
                                      {/* Thumbnail & Title */}
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="size-12 sm:size-14 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 bg-white shadow-2xs p-0.5">
                                          <img
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            className="w-full h-full object-cover rounded-lg"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=200&auto=format&fit=crop";
                                            }}
                                          />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.productName}>
                                              {item.productName}
                                            </p>
                                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                              {item.sku}
                                            </span>
                                          </div>

                                          {(item.attributesTitle || item.color || item.size) && (
                                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                              {item.color && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50/80 text-[#FF4D24] border border-orange-200/60">
                                                  Màu: {item.color}
                                                </span>
                                              )}
                                              {item.size && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/70">
                                                  Size: {item.size}
                                                </span>
                                              )}
                                              {!item.color && !item.size && item.attributesTitle && (
                                                <span className="text-[11px] text-slate-500 truncate font-medium">
                                                  {item.attributesTitle}
                                                </span>
                                              )}
                                              {item.addedAt && (
                                                <span className="text-[9.5px] text-slate-400 font-mono">
                                                  • {new Date(item.addedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Price Breakdown & Delete Item Action */}
                                      <div className="flex items-center gap-3 shrink-0 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs sm:text-sm font-black font-mono text-slate-900">
                                            {Math.round(item.salePrice).toLocaleString("vi-VN")}đ
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            Thành tiền: <strong className="text-slate-700 font-bold">{Math.round(item.subTotal || item.salePrice * item.quantity).toLocaleString("vi-VN")}đ</strong>
                                          </span>
                                        </div>

                                        {/* Individual Item Deletion */}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveBookmarkItem(bookmark.mainSku, item.sku, item.productName)}
                                          disabled={isItemDeleting}
                                          title="Xóa phụ kiện này"
                                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                                        >
                                          {isItemDeleting ? <RefreshCw className="size-3.5 animate-spin text-indigo-500" /> : <Trash2 className="size-3.5" />}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Card Footer: Financial Breakdown & Smooth Tactile Action Buttons */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs text-slate-500 font-medium">Tổng thanh toán:</span>
                                    <span className="text-base sm:text-lg font-black font-mono text-indigo-700">
                                      {Math.round(bookmark.totalSalePrice).toLocaleString("vi-VN")}đ
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons with layered tactile shadow & smooth curves */}
                                <div className="flex items-center gap-2.5 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleClearBookmarkPackage(bookmark.mainSku)}
                                    disabled={isPackageLoading}
                                    className="h-9 px-4 text-xs font-semibold text-slate-600 hover:text-indigo-700 bg-gradient-to-b from-white/95 via-white/85 to-white/70 hover:from-indigo-50/80 hover:to-indigo-100/60 rounded-xl border-t border-t-white border-b border-b-slate-300/70 hover:border-b-indigo-300 border-x border-x-white/70 hover:border-x-indigo-200 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_2px_8px_-1px_rgba(99,102,241,0.15)] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  >
                                    {bookmarkActionLoading === bookmark.mainSku ? (
                                      <RefreshCw className="size-3.5 animate-spin text-indigo-500" />
                                    ) : (
                                      <Trash2 className="size-3.5" />
                                    )}
                                    <span>Xóa gói</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCheckoutBookmarkPackage(bookmark)}
                                    disabled={isPackageLoading}
                                    className="h-9 px-4.5 text-xs font-bold text-white rounded-xl bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border-t border-t-indigo-300/70 border-b border-b-indigo-950 border-x border-x-indigo-500 shadow-[0_4px_16px_rgba(79,70,229,0.35),0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_22px_rgba(79,70,229,0.45),0_3px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] hover:brightness-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {bookmarkActionLoading === `checkout::${bookmark.mainSku}` ? (
                                      <RefreshCw className="size-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <ShoppingCart className="size-3.5" />
                                        <span>Thêm vào giỏ & Mua ngay</span>
                                        <ArrowRight className="size-3.5" />
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </Bevel>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
