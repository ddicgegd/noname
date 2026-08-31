import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Lock, Mail, ChevronDown, ChevronUp, CheckCircle, 
  Eye, EyeOff, AlertCircle, RefreshCw, ArrowRight, ArrowLeft, Phone,
  Shield, Check, X, Sliders, ShoppingBag, ClipboardList, Truck, Package, 
  MapPin, Clock, CreditCard, ChevronRight, HelpCircle, Plus, Trash2, Edit3,
  Smartphone, Laptop, Globe, Key, Building2, Home, Sparkles, Wallet, ExternalLink,
  ShieldCheck, ArrowUpRight, Compass, Navigation, Terminal, Copy, Activity, Code2,
  LocateFixed, Map, Search, CheckCircle2, Layers
} from "lucide-react";
import { apiRequest, unifiedFetch, getUnifiedAccessToken } from "../lib/api";
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

interface OrderItem {
  id: string;
  name: string;
  price: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  statusText: string;
  deliverySteps: {
    title: string;
    desc: string;
    time: string;
    completed: boolean;
    active: boolean;
  }[];
  shippingAddress: string;
  carrier: string;
  trackingNumber: string;
}

interface ProfilePageProps {
  onNavigate: (page: "landing" | "product" | "auth" | "auth-report" | "profile" | "terms") => void;
}

export interface PaymentMethodItem {
  id: string;
  type: "visa" | "mastercard" | "jcb" | "momo";
  cardNumber: string;
  holderName: string;
  expiryDate: string;
  isDefault: boolean;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
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
  const [activeModalTab, setActiveModalTab] = useState<"profile" | "security" | "addresses" | "payments" | "sessions">("profile");

  // Error / Success Messages
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Profile Edit fields
  const [editFullName, setEditFullName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editGender, setEditGender] = useState<string>("male");

  // Accordion Expansions in Security tab
  const [isUsernameChangeExpanded, setIsUsernameChangeExpanded] = useState<boolean>(true);
  const [isPasswordResetExpanded, setIsPasswordResetExpanded] = useState<boolean>(false);

  // Input states
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
  const [mapLayer, setMapLayer] = useState<"mapnik" | "hot" | "transport">("mapnik");
  const [isMapActive, setIsMapActive] = useState<boolean>(false);
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

  // Saved Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [newCardForm, setNewCardForm] = useState({
    type: "visa" as "visa" | "mastercard" | "jcb" | "momo",
    cardNumber: "",
    holderName: "",
    expiryDate: "",
    cvv: "",
    isDefault: false
  });

  // Orders list and active selected order for detail tracking view
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // Scroll fades state for orders list container
  const [showTopFade, setShowTopFade] = useState<boolean>(false);
  const [showBottomFade, setShowBottomFade] = useState<boolean>(true);

  // Scroll fades state for shipping steps container
  const [showStepsTopFade, setShowStepsTopFade] = useState<boolean>(true);
  const [showStepsBottomFade, setShowStepsBottomFade] = useState<boolean>(false);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll handler to dynamically show/hide top and bottom fade indicators
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
    const maxScroll = target.scrollHeight - target.clientHeight;
    
    setShowStepsTopFade(scrollTop > 5);
    setShowStepsBottomFade(scrollTop < maxScroll - 5);
  };

  // Keep delivery steps container scrolled to the bottom on active order change
  useEffect(() => {
    // Delay slightly to allow rendering flow to complete
    const timer = setTimeout(() => {
      if (stepsContainerRef.current) {
        const container = stepsContainerRef.current;
        container.scrollTop = container.scrollHeight;
        
        // Compute correct initial fade states based on scroll heights
        const maxScroll = container.scrollHeight - container.clientHeight;
        setShowStepsTopFade(container.scrollTop > 5);
        setShowStepsBottomFade(container.scrollTop < maxScroll - 5);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedOrderId, orders]);

  // On mount, load token, validate user, and seed/load order data
  useEffect(() => {
    loadProfileAndOrders();
  }, []);

  const loadProfileAndOrders = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem("horizon_current_user");

      let currentToken = "";
      let localUser = null;

      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        currentToken = prof.accessToken || "";
        setToken(currentToken);
      }

      if (storedUser) {
        localUser = JSON.parse(storedUser);
        setUser(localUser);
      }

      // Initialize mockup order history
      const storedOrders = localStorage.getItem(STORAGE_KEYS.USER_ORDERS) || localStorage.getItem("horizon_user_orders");
      let activeOrders: OrderItem[] = [];
      if (storedOrders) {
        activeOrders = JSON.parse(storedOrders);
      }
      
      if (activeOrders.length <= 2 || !activeOrders.some(o => o.id === "HZ-7711-R")) {
        // Seed initial beautiful mock orders matching Horizon Mobile & Web products
        activeOrders = [
          {
            id: "HZ-7711-R",
            name: "Thiết bị định tuyến Router Horizon Core Lite (Bảo hành & Đổi mới)",
            price: "1,890,000 VND",
            date: "14/07/2026",
            status: "processing",
            statusText: "Đang xử lý bảo hành",
            carrier: "Viettel Post (Hỗ trợ đổi trả)",
            trackingNumber: "VT-RETURN-7711",
            shippingAddress: "Số 15 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            deliverySteps: [
              { title: "Gửi yêu cầu bảo hành", desc: "Khách hàng thông báo lỗi cổng WAN chập chờn", time: "14/07/2026 08:00", completed: true, active: false },
              { title: "Duyệt yêu cầu hỗ trợ", desc: "Kỹ thuật viên Horizon xác nhận hỗ trợ đổi mới 1-đổi-1", time: "14/07/2026 09:30", completed: true, active: false },
              { title: "Thu hồi thiết bị cũ", desc: "Nhân viên vận chuyển đã thu lại thiết bị lỗi tận nơi", time: "14/07/2026 13:00", completed: true, active: false },
              { title: "Đang trung chuyển thiết bị cũ", desc: "Thiết bị lỗi đang trên đường về trung tâm kiểm thử Hà Nội", time: "14/07/2026 16:30", completed: true, active: false },
              { title: "Tiếp nhận và kiểm thử lỗi", desc: "Kỹ thuật viên phòng LAB xác nhận lỗi IC nguồn cổng WAN", time: "Hôm nay, 08:15", completed: true, active: false },
              { title: "Xuất kho thiết bị thay thế mới", desc: "Sản phẩm Router Horizon Core Lite mới 100% nguyên seal đã được kích hoạt số serial mới", time: "Hôm nay, 10:00", completed: true, active: false },
              { title: "Bàn giao đơn vị chuyển phát", desc: "Thiết bị mới đã chuyển giao cho bưu cục Viettel Post", time: "Hôm nay, 14:00", completed: true, active: false },
              { title: "Đang vận chuyển hỏa tốc", desc: "Đơn hàng đang trên đường giao hỏa tốc đến địa chỉ của bạn", time: "Hôm nay, 15:45", completed: true, active: true },
              { title: "Dự kiến bàn giao & Hoàn tất", desc: "Khách hàng nhận hàng và đồng kiểm cùng shipper", time: "Dự kiến: Chiều tối nay", completed: false, active: false }
            ]
          },
          {
            id: "HZ-9981-A",
            name: "Thiết bị Gateway kết nối Gateway Horizon Pro V2",
            price: "2,490,000 VND",
            date: "12/07/2026",
            status: "shipped",
            statusText: "Đang vận chuyển",
            carrier: "Horizon Express (GHN)",
            trackingNumber: "HZEX91802931",
            shippingAddress: "Số 15 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            deliverySteps: [
              { title: "Đã tiếp nhận đơn hàng", desc: "Đơn hàng đã được xác nhận thành công trên hệ thống", time: "12/07/2026 14:30", completed: true, active: false },
              { title: "Đang đóng gói sản phẩm", desc: "Bộ phận kho đang kiểm tra kỹ thuật thiết bị Gateway Pro V2", time: "12/07/2026 18:20", completed: true, active: false },
              { title: "Đã bàn giao cho vận chuyển", desc: "Đơn hàng đã rời kho Tổng cục phân phối Horizon Hà Nội", time: "13/07/2026 09:15", completed: true, active: false },
              { title: "Đang trung chuyển qua trạm", desc: "Thiết bị đang được chuyển phát nhanh vào trạm trung chuyển TP. Hồ Chí Minh", time: "Hôm nay, 04:22", completed: true, active: true },
              { title: "Đang giao tới địa chỉ", desc: "Shipper sẽ liên hệ qua số điện thoại đăng ký trước khi giao", time: "Dự kiến: Ngày mai", completed: false, active: false }
            ]
          },
          {
            id: "HZ-4421-S",
            name: "Gói bản quyền Premium Cloud ERP API Enterprise (Thường niên)",
            price: "1,200,000 VND",
            date: "10/07/2026",
            status: "delivered",
            statusText: "Đã kích hoạt thành công",
            carrier: "Kích hoạt tự động (Instant Email API)",
            trackingNumber: "LIC-JWT-921820",
            shippingAddress: "Gửi trực tiếp qua Email tài khoản đăng nhập",
            deliverySteps: [
              { title: "Tạo đơn đăng ký dịch vụ", desc: "Hệ thống ghi nhận yêu cầu mua gói Enterprise", time: "10/07/2026 10:00", completed: true, active: false },
              { title: "Xác thực thanh toán qua ví", desc: "Xác nhận chuyển khoản thành công", time: "10/07/2026 10:02", completed: true, active: false },
              { title: "Cấp phát mã bản quyền khóa API", desc: "Tạo cấu trúc Token cấp phép thành viên", time: "10/07/2026 10:03", completed: true, active: false },
              { title: "Đã kích hoạt & Giao dịch hoàn tất", desc: "Hệ thống Gateway ERP cấu hình thành công quyền truy cập", time: "10/07/2026 10:03", completed: true, active: true }
            ]
          },
          {
            id: "HZ-1205-X",
            name: "Cáp sạc siêu dẫn chuyên dụng Horizon FastLink C1 (1.5m)",
            price: "350,000 VND",
            date: "08/07/2026",
            status: "delivered",
            statusText: "Đã giao hàng",
            carrier: "Viettel Post",
            trackingNumber: "VT77291032",
            shippingAddress: "Số 15 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            deliverySteps: [
              { title: "Đã tiếp nhận đơn hàng", desc: "Ghi nhận đơn hàng cáp sạc siêu dẫn", time: "08/07/2026 09:00", completed: true, active: false },
              { title: "Đóng gói & Bàn giao", desc: "Đã hoàn tất kiểm tra dòng điện của cáp", time: "08/07/2026 11:30", completed: true, active: false },
              { title: "Đã giao thành công", desc: "Người nhận ký xác nhận tại địa chỉ văn phòng", time: "09/07/2026 16:45", completed: true, active: true }
            ]
          },
          {
            id: "HZ-3094-M",
            name: "Bộ định tuyến hiệu năng cao Horizon Core Router Max",
            price: "4,890,000 VND",
            date: "05/07/2026",
            status: "delivered",
            statusText: "Đã giao hàng",
            carrier: "Horizon Express (GHN)",
            trackingNumber: "HZEX10294827",
            shippingAddress: "Số 15 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            deliverySteps: [
              { title: "Xác nhận đơn hàng", desc: "Thiết bị Core Router Max đã được duyệt", time: "05/07/2026 08:15", completed: true, active: false },
              { title: "Đang vận chuyển", desc: "Hàng rời kho tổng Đà Nẵng", time: "06/07/2026 14:00", completed: true, active: false },
              { title: "Đã giao hàng thành công", desc: "Thiết bị định tuyến đã hoàn thành lắp đặt kỹ thuật", time: "07/07/2026 11:30", completed: true, active: true }
            ]
          },
          {
            id: "HZ-8831-C",
            name: "Bộ chuyển đổi tín hiệu thông minh Horizon Gateway Nano V1",
            price: "990,000 VND",
            date: "01/07/2026",
            status: "delivered",
            statusText: "Đã giao hàng",
            carrier: "Giao Hàng Tiết Kiệm",
            trackingNumber: "GHTK8829310",
            shippingAddress: "Số 15 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            deliverySteps: [
              { title: "Tiếp nhận đơn hàng", desc: "Giao dịch đã được ghi nhận trên cổng ERP", time: "01/07/2026 14:00", completed: true, active: false },
              { title: "Đã giao thành công", desc: "Hàng đã trao tận tay khách hàng", time: "03/07/2026 10:15", completed: true, active: true }
            ]
          }
        ];
        localStorage.setItem(STORAGE_KEYS.USER_ORDERS, JSON.stringify(activeOrders));
      }
      setOrders(activeOrders);
      if (activeOrders.length > 0) {
        setSelectedOrderId(activeOrders[0].id);
      }

      // Cho phép hiển thị giao diện ngay lập tức thay vì bắt người dùng chờ API
      setIsLoading(false);

      if (!currentToken) {
        return;
      }

      // Xác thực ngầm qua GraphQL Gateway (Non-blocking background validation & fetch)
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
                  phoneNumber
                  avatarUrl
                  gender
                  rank
                  status
                  roles
                }
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
          
          if (storedProfile) {
            const prof = JSON.parse(storedProfile);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
              ...prof,
              email: fetchedUser.email || prof.email,
              userId: fetchedUser.id || prof.userId
            }));
          }
        } else {
          console.warn("GraphQL me query did not return success, trying legacy API...", meData);
          return apiRequest(`/api/auth/validate-reset-token?token=${encodeURIComponent(currentToken)}`, {
            method: "GET"
          }).then((response) => {
            const isSuccess = response && (
              response.status === "success" ||
              (response.status && typeof response.status === "object" && (
                response.status.message === "Success" ||
                response.status.message === "success" ||
                response.status.code === 200 ||
                response.status.code === "200"
              )) ||
              response.data
            );

            if (isSuccess && response.data) {
              const fetchedUser = response.data;
              setUser(fetchedUser);
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fetchedUser));
              
              if (storedProfile) {
                const prof = JSON.parse(storedProfile);
                localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
                  ...prof,
                  email: fetchedUser.email || prof.email,
                  userId: fetchedUser.id || prof.userId
                }));
              }
            }
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch profile live from GraphQL gateway in background, trying legacy API:", err);
        apiRequest(`/api/auth/validate-reset-token?token=${encodeURIComponent(currentToken)}`, {
          method: "GET"
        }).then((response) => {
          const isSuccess = response && (
            response.status === "success" ||
            (response.status && typeof response.status === "object" && (
              response.status.message === "Success" ||
              response.status.message === "success" ||
              response.status.code === 200 ||
              response.status.code === "200"
            )) ||
            response.data
          );

          if (isSuccess && response.data) {
            const fetchedUser = response.data;
            setUser(fetchedUser);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fetchedUser));
            
            if (storedProfile) {
              const prof = JSON.parse(storedProfile);
              localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
                ...prof,
                email: fetchedUser.email || prof.email,
                userId: fetchedUser.id || prof.userId
              }));
            }
          }
        }).catch((restErr) => {
          console.warn("Legacy background REST validation also failed:", restErr);
        });
      });
      // Initialize saved addresses via addressService
      try {
        const loadedAddresses = await getMyAddresses();
        setAddresses(loadedAddresses);
      } catch (addrErr) {
        console.warn("Could not load addresses:", addrErr);
      }

      // Initialize saved payment methods
      const storedPayments = localStorage.getItem(STORAGE_KEYS.USER_PAYMENT_METHODS) || localStorage.getItem("horizon_user_payment_methods");
      if (storedPayments) {
        setPaymentMethods(JSON.parse(storedPayments));
      } else {
        const initialPayments: PaymentMethodItem[] = [
          {
            id: "PAY-1",
            type: "visa",
            cardNumber: "•••• •••• •••• 8892",
            holderName: "NGO NGOC DINH",
            expiryDate: "09/29",
            isDefault: true
          },
          {
            id: "PAY-2",
            type: "mastercard",
            cardNumber: "•••• •••• •••• 4519",
            holderName: "NGO NGOC DINH",
            expiryDate: "11/28",
            isDefault: false
          },
          {
            id: "PAY-3",
            type: "momo",
            cardNumber: "0901 234 567",
            holderName: "Ví MoMo E-Wallet",
            expiryDate: "Đã liên kết",
            isDefault: false
          }
        ];
        localStorage.setItem(STORAGE_KEYS.USER_PAYMENT_METHODS, JSON.stringify(initialPayments));
        setPaymentMethods(initialPayments);
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
      setEditPhone(user.phoneNumber || "0901234567");
      setEditGender(user.gender || "male");
      if (addresses.length > 0 && !newAddressForm.recipientName) {
        setNewAddressForm(prev => ({ ...prev, recipientName: user.fullName || "", phone: user.phoneNumber || "0901234567" }));
      }
      if (paymentMethods.length > 0 && !newCardForm.holderName) {
        setNewCardForm(prev => ({ ...prev, holderName: (user.fullName || "NGO NGOC DINH").toUpperCase() }));
      }
    }
  }, [user]);

  // Handler for Profile Information Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setErrorMsg("Họ và tên không được để trống.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updatedUser = {
        ...user,
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        gender: editGender
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem("horizon_redis_profile");
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
          ...prof,
          fullName: editFullName.trim(),
          phoneNumber: editPhone.trim()
        }));
      }

      setSuccessMsg("Cập nhật thông tin hồ sơ thành công!");
      logAuditAction("UPDATE_PROFILE", "SUCCESS", "Cập nhật thông tin định danh người dùng");
    } catch (err: any) {
      setErrorMsg("Không thể cập nhật thông tin: " + (err.message || "Lỗi không xác định"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for Address Book: Save (Create or Update) Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.recipientName.trim() || !newAddressForm.phone.trim() || !newAddressForm.address.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.");
      return;
    }

    if (!resolvedPreview || !resolvedPreview.success || !resolvedPreview.latitude || !resolvedPreview.longitude) {
      setErrorMsg("Địa chỉ chưa được xác thực tọa độ hợp lệ từ hệ thống Geocoding. Vui lòng nhập địa chỉ đầy đủ 3 cấp hành chính.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
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

    setIsResolvingAddress(true);
    const timer = setTimeout(async () => {
      try {
        const res = await resolveAddress(trimmed);
        setResolvedPreview(res);
      } catch (_) {
        setResolvedPreview(null);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 1250); // Exact 1.25s debounce

    return () => clearTimeout(timer);
  }, [newAddressForm.address, isAddingAddress]);

  // Handler for active/manual Geocoding refresh on the address input
  const handleManualResolveAddress = async () => {
    const trimmed = newAddressForm.address.trim();
    if (trimmed.length < 3) return;
    setIsResolvingAddress(true);
    try {
      const res = await resolveAddress(trimmed);
      setResolvedPreview(res);
      setMapKey(prev => prev + 1);
    } catch (_) {
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
      phone: user?.phoneNumber || editPhone || "0901234567"
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

  // Handler for Payment Methods: Add Payment Method / Card
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.cardNumber.trim() || !newCardForm.holderName.trim() || !newCardForm.expiryDate.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ số thẻ, tên chủ thẻ và hạn sử dụng.");
      return;
    }

    const cleanNumber = newCardForm.cardNumber.replace(/\s+/g, "");
    const masked = cleanNumber.length >= 4 
      ? `•••• •••• •••• ${cleanNumber.slice(-4)}`
      : `•••• ${cleanNumber}`;

    const newPayment: PaymentMethodItem = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      type: newCardForm.type,
      cardNumber: masked,
      holderName: newCardForm.holderName.trim().toUpperCase(),
      expiryDate: newCardForm.expiryDate.trim(),
      isDefault: newCardForm.isDefault || paymentMethods.length === 0
    };

    let updated = [...paymentMethods];
    if (newPayment.isDefault) {
      updated = updated.map(p => ({ ...p, isDefault: false }));
    }
    updated.unshift(newPayment);

    setPaymentMethods(updated);
    localStorage.setItem(STORAGE_KEYS.USER_PAYMENT_METHODS, JSON.stringify(updated));
    setIsAddingCard(false);
    setSuccessMsg("Đã liên kết phương thức thanh toán an toàn!");
    setErrorMsg("");
    setNewCardForm({
      type: "visa",
      cardNumber: "",
      holderName: (user?.fullName || "NGO NGOC DINH").toUpperCase(),
      expiryDate: "",
      cvv: "",
      isDefault: false
    });
  };

  // Handler for Payment Methods: Set Default
  const handleSetDefaultPayment = (id: string) => {
    const updated = paymentMethods.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    setPaymentMethods(updated);
    localStorage.setItem(STORAGE_KEYS.USER_PAYMENT_METHODS, JSON.stringify(updated));
    setSuccessMsg("Đã đặt phương thức thanh toán làm mặc định!");
    setErrorMsg("");
  };

  // Handler for Payment Methods: Delete
  const handleDeletePayment = (id: string) => {
    if (paymentMethods.length <= 1) {
      setErrorMsg("Bạn cần duy trì ít nhất 1 phương thức thanh toán khả dụng.");
      return;
    }
    const updated = paymentMethods.filter(p => p.id !== id);
    if (!updated.some(p => p.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setPaymentMethods(updated);
    localStorage.setItem(STORAGE_KEYS.USER_PAYMENT_METHODS, JSON.stringify(updated));
    setSuccessMsg("Đã gỡ bỏ phương thức thanh toán.");
    setErrorMsg("");
  };

  // Handler for username modification
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUsername.trim()) {
      setErrorMsg("Tên đăng nhập mới không được để trống.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Gọi GraphQL Mutation changeUsername qua BFF Gateway
      const gqlResponse = await unifiedFetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation ChangeUsername($newUsername: String!, $token: String) {
              changeUsername(newUsername: $newUsername, token: $token) {
                status {
                  code
                  message
                }
                message
              }
            }
          `,
          variables: {
            newUsername: newUsername.trim(),
            token: token
          }
        })
      });

      const resJson = await gqlResponse.json();
      const mutationResult = resJson?.data?.changeUsername;

      if (resJson.errors && resJson.errors.length > 0) {
        throw new Error(resJson.errors[0].message || "GraphQL mutation error");
      }

      if (mutationResult?.status?.code !== 200) {
        throw new Error(mutationResult?.message || "Đổi tên đăng nhập thất bại từ Gateway.");
      }

      const successDetail = mutationResult?.message || "Tên đăng nhập đã được thay đổi thành công!";
      setSuccessMsg(successDetail);
      
      // Update local and component state
      if (user) {
        const updated = { ...user, username: newUsername.trim() };
        setUser(updated);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      }

      setNewUsername("");
      setIsUsernameChangeExpanded(false);

      // Add audit log
      logAuditAction("CHANGE_USERNAME", "SUCCESS", "Đổi tên đăng nhập thành công qua GraphQL Gateway");
    } catch (err: any) {
      console.warn("GraphQL changeUsername failed, trying legacy REST API fallback...", err);
      try {
        const response = await apiRequest(`/api/auth/change-username`, {
          method: "PUT",
          body: JSON.stringify({
            token: token,
            newUsername: newUsername.trim(),
          }),
        });

        const successDetail = response?.data || "Tên đăng nhập đã được thay đổi thành công!";
        setSuccessMsg(successDetail);
        
        if (user) {
          const updated = { ...user, username: newUsername.trim() };
          setUser(updated);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
        }

        setNewUsername("");
        setIsUsernameChangeExpanded(false);
        logAuditAction("CHANGE_USERNAME", "SUCCESS", "Đổi tên đăng nhập thành công qua REST fallback");
      } catch (fallbackErr: any) {
        console.error("REST fallback also failed:", fallbackErr);
        setErrorMsg(fallbackErr.message || "Đổi tên đăng nhập thất bại. Vui lòng thử lại.");
        logAuditAction("CHANGE_USERNAME", "FAILED", `Đổi tên đăng nhập thất bại: ${fallbackErr.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setErrorMsg("Mật khẩu mới không được để trống.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Gọi GraphQL Mutation changePassword qua BFF Gateway
      const gqlResponse = await unifiedFetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation ChangePassword($newPassword: String!, $confirmPassword: String!, $token: String) {
              changePassword(newPassword: $newPassword, confirmPassword: $confirmPassword, token: $token) {
                status {
                  code
                  message
                }
                message
              }
            }
          `,
          variables: {
            newPassword: newPassword,
            confirmPassword: confirmPassword,
            token: token
          }
        })
      });

      const resJson = await gqlResponse.json();
      const mutationResult = resJson?.data?.changePassword;

      if (resJson.errors && resJson.errors.length > 0) {
        throw new Error(resJson.errors[0].message || "GraphQL mutation error");
      }

      if (mutationResult?.status?.code !== 200) {
        throw new Error(mutationResult?.message || "Đổi mật khẩu thất bại từ Gateway.");
      }

      const successDetail = mutationResult?.message || "Mật khẩu của bạn đã được thay đổi thành công!";
      setSuccessMsg(successDetail);
      
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordResetExpanded(false);

      // Add audit log
      logAuditAction("RESET_PASSWORD", "SUCCESS", "Thay đổi mật khẩu thành công qua GraphQL Gateway");
    } catch (err: any) {
      console.warn("GraphQL changePassword failed, trying legacy REST API fallback...", err);
      try {
        let response;
        try {
          response = await apiRequest(`/api/auth/change-password`, {
            method: "PUT",
            body: JSON.stringify({
              token: token,
              newPassword: newPassword,
              confirmPassword: confirmPassword,
            }),
          });
        } catch (putErr) {
          console.warn("PUT /api/auth/change-password failed, attempting legacy POST /api/auth/reset-password fallback...", putErr);
          response = await apiRequest(`/api/auth/reset-password?code=${encodeURIComponent(token)}`, {
            method: "POST",
            body: JSON.stringify({
              newPassword: newPassword,
              confirmPassword: confirmPassword,
            }),
          });
        }

        const successDetail = response?.data || "Mật khẩu của bạn đã được thay đổi thành công!";
        setSuccessMsg(successDetail);
        
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordResetExpanded(false);
        logAuditAction("RESET_PASSWORD", "SUCCESS", "Thay đổi mật khẩu thành công qua REST fallback");
      } catch (fallbackErr: any) {
        console.error("REST fallback also failed:", fallbackErr);
        setErrorMsg(fallbackErr.message || "Thay đổi mật khẩu thất bại. Vui lòng thử lại.");
        logAuditAction("RESET_PASSWORD", "FAILED", `Thay đổi mật khẩu thất bại: ${fallbackErr.message}`);
      }
    } finally {
      setActionLoading(false);
    }
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

  // Helper to find currently selected tracking order
  const activeOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="relative pt-24 pb-4 h-screen w-full bg-[#FBFDFF] font-sans text-slate-800 flex flex-col justify-start overflow-hidden">
      
      {/* Ambient background glowing lights (Đánh ánh sáng ám mạnh mẽ hơn) */}
      <div className="absolute top-[-5%] left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-400/35 via-purple-300/25 to-[#FF4D24]/20 blur-[140px] pointer-events-none select-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute bottom-[5%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#FF4D24]/15 via-indigo-400/30 to-blue-400/25 blur-[130px] pointer-events-none select-none z-0" />
      
      <div className="relative z-10 max-w-[1760px] w-full mx-auto px-4 sm:px-10 xl:px-12 flex-1 min-h-0 flex flex-col space-y-4 pb-2">
        
        {/* Minimal Navigation Breadcrumb and top control actions (Optimized & Unified) */}
        <div className="shrink-0 flex flex-col gap-3.5 border-b border-slate-100 pb-4 select-none">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
            <span className="hover:text-black cursor-pointer transition-colors" onClick={() => onNavigate("landing")}>Trang chủ</span>
            <span>/</span>
            <span className="text-[#FF4D24] font-semibold">Cổng tài khoản</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {!isLoading && token && user ? (
              /* Unified User Info & Title when logged in */
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-[#FF4D24]/90 text-white flex items-center justify-center font-display font-black text-xl shadow-sm shrink-0 select-none border-2 border-white ring-4 ring-indigo-50">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "H"}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{user.fullName || "Hội viên Horizon"}</h1>
                    <span className="text-xs font-bold font-mono text-[#FF4D24] bg-red-50 px-2 py-0.5 rounded-md uppercase border border-red-100">Live Portal</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Tên đăng nhập: <span className="font-mono font-bold text-indigo-600">@{user.username || "username"}</span> • Email: <span className="font-semibold text-slate-600">{user.email || "N/A"}</span>
                  </p>
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
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100/40 active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Quản lý bảo mật</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading screen */}
        {isLoading ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <RefreshCw className="w-7 h-7 text-[#FF4D24] animate-spin" />
            <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase animate-pulse">
              Đang đồng bộ dữ liệu dịch vụ...
            </p>
          </div>
        ) : !token || !user ? (
          /* Empty / Not logged-in dashboard */
          <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-500 shadow-inner">
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
              className="w-full bg-[#FF4D24] hover:bg-black text-white text-xs font-bold py-3.5 rounded-2xl transition-all cursor-pointer border border-[#FF4D24] hover:border-black shadow-sm"
            >
              Đăng ký / Đăng nhập ngay ↗
            </button>
          </div>
        ) : (
          /* Main Account Center Dashboard (Focusing on Orders and Delivery Progress) */
          <div className="flex-1 min-h-0 flex flex-col text-left">
            
            {/* Core Section: Split View for Orders and Delivery Tracker */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-stretch">
              
              {/* Left Side: Order list history (Thông tin đơn hàng) */}
              <div className="lg:col-span-5 h-full flex flex-col space-y-3 min-h-0">
                <div className="shrink-0 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#FF4D24]" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Thông tin đơn hàng</h3>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-bold font-mono bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-full">{orders.length} Đơn hàng</span>
                </div>

                <div className="flex-1 min-h-0 relative overflow-hidden rounded-2xl">
                  {/* Scrollable Container with Smooth Translucent Masking */}
                  <div 
                    onScroll={handleScroll}
                    className="hide-scrollbar space-y-3.5 h-full overflow-y-auto py-1 transition-all duration-300"
                    style={{
                      maskImage: `linear-gradient(to bottom, 
                        transparent 0%, 
                        black ${showTopFade ? "15%" : "0%"}, 
                        black ${showBottomFade ? "85%" : "100%"}, 
                        transparent 100%)`,
                      WebkitMaskImage: `linear-gradient(to bottom, 
                        transparent 0%, 
                        black ${showTopFade ? "15%" : "0%"}, 
                        black ${showBottomFade ? "85%" : "100%"}, 
                        transparent 100%)`
                    }}
                  >
                    {orders.length === 0 ? (
                      <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 text-xs">
                        Chưa có lịch sử giao dịch mua hàng nào.
                      </div>
                    ) : (
                      orders.map((item) => {
                        const isSelected = item.id === selectedOrderId;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedOrderId(item.id)}
                            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                              isSelected 
                                ? "bg-white border-indigo-600 shadow-[0_10px_25px_rgba(79,70,229,0.04)] ring-2 ring-indigo-600/10" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-50">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-400 font-mono uppercase">MÃ ĐƠN: {item.id}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">Ngày mua: {item.date}</p>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                item.status === "delivered" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {item.statusText}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[30px] mb-1.5">
                              {item.name}
                            </h4>

                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-50/60">
                              <span className="text-[11px] text-slate-500">Tổng thanh toán:</span>
                              <span className="text-xs font-black text-indigo-600 font-mono">{item.price}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Live Delivery Tracking progress timeline (Quá trình vận chuyển) */}
              <div className="lg:col-span-7 h-full flex flex-col space-y-3 min-h-0">
                <div className="shrink-0 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Hành trình giao hàng</h3>
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
                      className="flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col"
                    >
                      
                      {/* Header info of selected Order */}
                      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[9.5px] font-bold text-slate-400 font-mono block">VẬN CHUYỂN BỞI</span>
                          <p className="text-xs font-black text-slate-900">{activeOrder.carrier}</p>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-bold text-slate-400 font-mono block sm:text-right">MÃ VẬN ĐƠN (TRACKING)</span>
                          <p className="text-xs font-bold font-mono text-indigo-600 select-all sm:text-right">{activeOrder.trackingNumber}</p>
                        </div>
                      </div>

                      {/* Timeline Tracker Wrapper with Scroll & Smooth Fade Masks - Auto-fills available height */}
                      <div className="flex-1 min-h-0 relative overflow-hidden">
                        <div
                          ref={stepsContainerRef}
                          onScroll={handleStepsScroll}
                          className="hide-scrollbar relative h-full overflow-y-auto py-1 pl-9 space-y-4 transition-all duration-300"
                          style={{
                            maskImage: `linear-gradient(to bottom, 
                              transparent 0%, 
                              black ${showStepsTopFade ? "15%" : "0%"}, 
                              black ${showStepsBottomFade ? "85%" : "100%"}, 
                              transparent 100%)`,
                            WebkitMaskImage: `linear-gradient(to bottom, 
                              transparent 0%, 
                              black ${showStepsTopFade ? "15%" : "0%"}, 
                              black ${showStepsBottomFade ? "85%" : "100%"}, 
                              transparent 100%)`
                          }}
                        >
                          
                          {/* Left line axis */}
                          <div className="absolute left-[16px] top-2 bottom-2 w-0.5 bg-slate-100" />

                          {activeOrder.deliverySteps.map((step, idx) => {
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.03, ease: "easeOut" }}
                                className="relative text-left"
                              >
                                
                                {/* Milestone Dot Indicator - Centered perfectly at x = 17px */}
                                <div className={`absolute left-[-19px] -translate-x-1/2 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                                  step.active 
                                    ? "bg-[#FF4D24] border-white ring-4 ring-[#FF4D24]/20 scale-125" 
                                    : step.completed 
                                      ? "bg-indigo-600 border-indigo-600" 
                                      : "bg-slate-200 border-slate-200"
                                }`} />

                                <div className="space-y-0.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <h4 className={`text-xs font-bold ${step.active ? "text-[#FF4D24] font-black" : step.completed ? "text-slate-900" : "text-slate-400"}`}>
                                      {step.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono font-medium shrink-0">
                                      {step.time}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-relaxed ${step.completed ? "text-slate-500" : "text-slate-400"}`}>
                                    {step.desc}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Shipping address details block */}
                      <div className="shrink-0 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Địa chỉ giao nhận hàng</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed pl-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          {activeOrder.shippingAddress}
                        </p>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 min-h-0 bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 text-xs flex items-center justify-center"
                    >
                      Vui lòng chọn một đơn hàng ở danh sách bên trái để theo dõi hành trình chi tiết.
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 select-none">
            
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountsCenterOpen(false)}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-md"
            />

            {/* Modal Dialog Box (Standard Accounts Center Frame max-w-6xl ~1152px, height 780px) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-6xl bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[28px] shadow-[0_32px_100px_-20px_rgba(15,23,42,0.3)] flex flex-col md:flex-row overflow-hidden max-h-[92vh] md:h-[750px] lg:h-[780px] z-10"
            >
              
              {/* LEFT COLUMN: Sidebar Navigation / Context Data View */}
              <div className="w-full md:w-80 lg:w-[320px] bg-slate-50/90 border-b md:border-b-0 md:border-r border-slate-200/70 p-4 sm:p-4.5 flex flex-col justify-between shrink-0 text-left relative overflow-hidden">
                {/* Ambient glow matching page deep indigo/violet theme in top-left */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-purple-700/8 blur-3xl pointer-events-none z-0" />
                {((activeModalTab === "addresses" && isAddingAddress) || (activeModalTab === "payments" && isAddingCard)) ? (
                  /* WHEN FORM IS OPEN: Show existing data list on the left side */
                  <div className="flex flex-col h-full relative z-10">
                    {/* Header with back button & count */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setIsAddingCard(false);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer group"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Danh sách địa chỉ</span>
                      </button>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-full">
                        {addresses.length} đã lưu
                      </span>
                    </div>

                    {/* Scrollable list of existing items (Space-optimized & Refined) */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {activeModalTab === "addresses" && addresses.map(addr => {
                        const isOffice = addr.type === "office";
                        const isCurrentlyEditing = editingAddressSku === addr.sku;
                        return (
                          <div 
                            key={addr.sku}
                            onClick={() => handleOpenEditAddress(addr)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                              isCurrentlyEditing
                                ? "bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                                : addr.isDefault 
                                  ? "bg-white border-indigo-200/90 hover:border-indigo-300 shadow-2xs" 
                                  : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isOffice ? "bg-indigo-100/80 text-indigo-700" : "bg-violet-100/80 text-violet-700"
                                }`}>
                                  {isOffice ? <Building2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-bold text-slate-900 truncate">{addr.recipientName}</span>
                              </div>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 font-bold uppercase bg-indigo-600 text-white rounded-full shrink-0">
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

                      {activeModalTab === "payments" && paymentMethods.map(card => (
                        <div 
                          key={card.id}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            card.isDefault 
                              ? "bg-slate-900 text-white border-slate-800 shadow-xs" 
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                              card.type === "visa" 
                                ? "bg-blue-600 text-white" 
                                : card.type === "mastercard" 
                                  ? "bg-red-600 text-white" 
                                  : card.type === "momo"
                                    ? "bg-pink-600 text-white"
                                    : "bg-emerald-600 text-white"
                            }`}>
                              {card.type.toUpperCase()}
                            </span>
                            {card.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 font-bold uppercase bg-white/20 text-white rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-mono font-bold tracking-wider ${card.isDefault ? "text-white" : "text-slate-800"}`}>
                            {card.cardNumber}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>{card.holderName}</span>
                            <span>{card.expiryDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom action when form is open */}
                    <div className="pt-2.5 mt-2.5 border-t border-slate-200/70 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setIsAddingCard(false);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
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
                      
                      {/* Top Branding */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Trung tâm tài khoản</h3>
                          <p className="text-[10px] text-indigo-600 font-bold font-mono uppercase tracking-wider">Horizon Accounts Center</p>
                        </div>
                      </div>

                      {/* Profile Mini Card */}
                      {user && (
                        <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-center gap-3.5 shadow-xs">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-700 to-[#FF4D24] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : "H"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-slate-900 truncate leading-tight">{user.fullName || "Hội viên Horizon"}</p>
                              <span className="text-[9px] px-1.5 py-0.2 font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">LIVE</span>
                            </div>
                            <p className="text-[10.5px] font-mono text-slate-400 truncate mt-0.5">{user.email || "N/A"}</p>
                          </div>
                        </div>
                      )}

                      {/* Navigation Tabs */}
                      <div className="space-y-1.5">
                        {[
                          { id: "profile", label: "Hồ sơ cá nhân", icon: User, desc: "Tên, email, số điện thoại" },
                          { id: "security", label: "Mật khẩu & Bảo mật", icon: ShieldCheck, desc: "Đổi mật khẩu, username" },
                          { id: "addresses", label: "Sổ địa chỉ nhận hàng", icon: MapPin, count: addresses.length, desc: "Địa chỉ giao nhận" },
                          { id: "payments", label: "Thẻ & Phương thức", icon: CreditCard, count: paymentMethods.length, desc: "Visa, Mastercard, Ví" },
                          { id: "sessions", label: "Thiết bị & Phiên", icon: Laptop, desc: "Quản lý đăng nhập" }
                        ].map(tab => {
                          const Icon = tab.icon;
                          const isActive = activeModalTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveModalTab(tab.id as any);
                                setErrorMsg("");
                                setSuccessMsg("");
                                setIsAddingAddress(false);
                                setIsAddingCard(false);
                              }}
                              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isActive
                                  ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white shadow-md shadow-indigo-600/20"
                                  : "text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-950"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                                <div className="text-left">
                                  <span className="block leading-tight">{tab.label}</span>
                                  <span className={`text-[10px] font-normal leading-none block mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>{tab.desc}</span>
                                </div>
                              </div>
                              {tab.count !== undefined && (
                                <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
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
                        className="w-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Đóng trung tâm tài khoản</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: Active Tab Content Panel (Optimized Edge-to-Edge Spacing) */}
              <div className="flex-1 bg-gradient-to-br from-slate-50/95 via-slate-50/60 to-indigo-50/20 p-3.5 sm:p-4 lg:p-4.5 overflow-y-auto flex flex-col text-left relative min-h-0">
                
                {/* Panel Header */}
                <div className="flex items-start justify-between gap-3 pb-2.5 mb-3 border-b border-slate-200/80 shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {isAddingAddress && (editingAddressSku ? "Chỉnh sửa địa chỉ nhận hàng" : "Thêm địa chỉ giao nhận mới")}
                      {isAddingCard && "Thêm phương thức thanh toán mới"}
                      {!isAddingAddress && !isAddingCard && (
                        <>
                          {activeModalTab === "profile" && "Thông tin hồ sơ cá nhân"}
                          {activeModalTab === "security" && "Mật khẩu & Thiết lập bảo mật"}
                          {activeModalTab === "addresses" && "Quản lý sổ địa chỉ giao hàng"}
                          {activeModalTab === "payments" && "Phương thức thanh toán & Quản lý thẻ"}
                          {activeModalTab === "sessions" && "Thiết bị & Phiên hoạt động"}
                        </>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {isAddingAddress && "Cập nhật thông tin chi tiết người nhận và vị trí chính xác để đồng bộ giao hàng."}
                      {isAddingCard && "Liên kết thẻ tín dụng, ghi nợ hoặc ví điện tử (danh sách hiện có hiển thị ở cột trái)"}
                      {!isAddingAddress && !isAddingCard && (
                        <>
                          {activeModalTab === "profile" && "Quản lý thông tin định danh, số điện thoại và thông tin liên lạc của tài khoản Horizon"}
                          {activeModalTab === "security" && "Cập nhật mật khẩu tài khoản và quản lý thông tin bảo vệ an toàn dịch vụ"}
                          {activeModalTab === "addresses" && "Lưu trữ các địa chỉ nhận hàng cá nhân hoặc doanh nghiệp để đặt đơn tiện lợi hơn"}
                          {activeModalTab === "payments" && "Quản lý thẻ tín dụng, ghi nợ quốc tế và các ví điện tử thanh toán bảo mật"}
                          {activeModalTab === "sessions" && "Kiểm tra các phiên đăng nhập đang hoạt động và quản lý bảo mật thiết bị kết nối"}
                        </>
                      )}
                    </p>
                  </div>
                  
                  {/* Header Actions: Only single action button during address edit */}
                  {isAddingAddress ? (
                    <div className="flex items-center shrink-0">
                      <button
                        type="submit"
                        form="address-form"
                        disabled={
                          actionLoading ||
                          isResolvingAddress ||
                          !resolvedPreview?.success ||
                          !resolvedPreview?.latitude ||
                          !resolvedPreview?.longitude ||
                          !newAddressForm.recipientName.trim() ||
                          !newAddressForm.phone.trim() ||
                          !newAddressForm.address.trim()
                        }
                        className="h-9 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm shadow-indigo-600/25 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>{editingAddressSku ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        if (isAddingCard) setIsAddingCard(false);
                        else setIsAccountsCenterOpen(false);
                      }}
                      className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-black transition-colors cursor-pointer shrink-0"
                      title={isAddingCard ? "Đóng form" : "Đóng"}
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* Floating Toast Notification (Zero Layout Shift - Zero Jank) */}
                <div className="absolute top-4 right-4 z-50 pointer-events-none flex flex-col items-end gap-2 max-w-sm w-full">
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        key="modal-error-toast"
                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="pointer-events-auto w-full p-3 bg-white/95 backdrop-blur-md border border-red-200/90 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 text-left shadow-xl shadow-red-500/10 ring-1 ring-red-500/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{errorMsg}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setErrorMsg("")}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}

                    {successMsg && (
                      <motion.div
                        key="modal-success-toast"
                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="pointer-events-auto w-full p-3 bg-white/95 backdrop-blur-md border border-emerald-200/90 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 text-left shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{successMsg}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSuccessMsg("")}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* TAB 1: Profile Information */}
                {activeModalTab === "profile" && (
                  <form onSubmit={handleSaveProfile} className="space-y-5 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Họ và tên người dùng</label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Nhập họ và tên..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Số điện thoại liên hệ</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="0901234567"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email tài khoản đăng nhập</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || "N/A"}
                          className="w-full bg-slate-100/70 border border-slate-200 text-xs px-4 py-3 rounded-2xl outline-none text-slate-500 font-mono cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Giới tính</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-semibold cursor-pointer"
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>

                    </div>

                    <div className="p-4 bg-indigo-50/40 border border-indigo-100/70 rounded-2xl flex items-center justify-between gap-4 text-left mt-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Đồng bộ đám mây tức thời</p>
                          <p className="text-[11px] text-slate-500">Mọi thay đổi hồ sơ sẽ được cập nhật đồng nhất trên các nền tảng Web & Mobile.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-7 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 hover:opacity-95 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Lưu thay đổi hồ sơ"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: Security & Passwords */}
                {activeModalTab === "security" && (
                  <div className="space-y-5 flex-1">
                    
                    {/* Username Update Section */}
                    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => setIsUsernameChangeExpanded(!isUsernameChangeExpanded)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-indigo-50/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <User className="w-5 h-5 text-indigo-600" />
                          <div>
                            <span className="text-xs font-black text-slate-800 block">Đổi tên đăng nhập (Username)</span>
                            <span className="text-[11px] text-slate-400">Tên hiện tại: @{user?.username || "username"}</span>
                          </div>
                        </div>
                        {isUsernameChangeExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      <AnimatePresence initial={false}>
                        {isUsernameChangeExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            <form onSubmit={handleChangeUsername} className="p-5 flex flex-col gap-3.5">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono text-left">Tên đăng nhập mới</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nhập username mới..."
                                  value={newUsername}
                                  onChange={(e) => setNewUsername(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 hover:opacity-95 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-all shadow-sm shadow-indigo-600/20"
                              >
                                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-white" /> : "Cập nhật tên đăng nhập"}
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password Reset Section */}
                    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => setIsPasswordResetExpanded(!isPasswordResetExpanded)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-indigo-50/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <Lock className="w-5 h-5 text-indigo-600" />
                          <div>
                            <span className="text-xs font-black text-slate-800 block">Đổi mật khẩu tài khoản</span>
                            <span className="text-[11px] text-slate-400">Khuyến nghị kết hợp chữ hoa, chữ số & ký tự đặc biệt</span>
                          </div>
                        </div>
                        {isPasswordResetExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      <AnimatePresence initial={false}>
                        {isPasswordResetExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            <form onSubmit={handleResetPassword} className="p-5 flex flex-col gap-3.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="flex flex-col gap-1.5 text-left">
                                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mật khẩu mới</label>
                                  <div className="relative">
                                    <input
                                      type={showPassword ? "text" : "password"}
                                      required
                                      placeholder="Nhập tối thiểu 6 ký tự..."
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs pl-4 pr-10 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5 text-left">
                                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Xác nhận mật khẩu</label>
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Nhập lại mật khẩu..."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-all shadow-sm shadow-indigo-600/20 mt-1"
                              >
                                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-white" /> : "Xác nhận đổi mật khẩu"}
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Security 2FA Information */}
                    <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-left">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Bảo mật Token Bearer JWT</p>
                          <p className="text-[11px] text-slate-500">Mã hóa đối xứng qua Gateway BFF an toàn 100%.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
                        HOẠT ĐỘNG
                      </span>
                    </div>

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
                            className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2.5 text-left text-xs shrink-0"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="font-bold text-rose-900">Không thể lưu địa chỉ:</p>
                              <p className="text-rose-700 text-xs leading-snug">{errorMsg}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* TOP SECTION: Expanded Input Dashboard */}
                        <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-sm shrink-0 w-full">
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
                                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all shadow-2xs placeholder:text-slate-400"
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
                                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-mono font-medium text-slate-900 outline-none transition-all shadow-2xs placeholder:text-slate-400"
                              />
                            </div>

                            {/* Address Type: Modern Segmented Control */}
                            <div className="md:col-span-3">
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">Loại địa chỉ</label>
                              <div className="h-9 p-0.5 bg-slate-100 border border-slate-200/90 rounded-xl flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => setNewAddressForm({ ...newAddressForm, type: "office" })}
                                  className={`flex-1 h-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    newAddressForm.type === "office"
                                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/60 font-extrabold"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <Building2 className="w-3 h-3" />
                                  <span>Văn phòng</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewAddressForm({ ...newAddressForm, type: "home" })}
                                  className={`flex-1 h-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    newAddressForm.type === "home"
                                      ? "bg-white text-violet-700 shadow-2xs border border-slate-200/60 font-extrabold"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <Home className="w-3 h-3" />
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
                                    ? "bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-2xs" 
                                    : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100/60"
                                }`}
                                title="Bật/Tắt làm địa chỉ giao hàng mặc định"
                              >
                                <span className="text-[11px] font-bold">
                                  {newAddressForm.isDefault ? "Mặc định" : "Thường"}
                                </span>
                                <div className={`w-7 h-4 rounded-full transition-colors relative p-0.5 flex items-center ${
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
                              {/* 65% Fixed Width Input */}
                              <div className="relative w-full sm:w-[65%] sm:basis-[65%] shrink-0">
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
                                  className="w-full h-9.5 pl-9 pr-9 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-xs font-medium text-slate-900 outline-none transition-all shadow-2xs placeholder:text-slate-400"
                                />
                                {newAddressForm.address.trim() && (
                                  <button
                                    type="button"
                                    onClick={handleManualResolveAddress}
                                    disabled={isResolvingAddress}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                                    title="Chủ động tải lại vị trí / Geocoding tọa độ"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isResolvingAddress ? "animate-spin text-indigo-600" : "text-slate-400 hover:text-indigo-600"}`} />
                                  </button>
                                )}
                              </div>

                              {/* 35% Fixed Width Geocoding Status Chip (Click to Copy & Stretched Layout) */}
                              <div className="w-full sm:w-[35%] sm:basis-[35%] shrink-0">
                                {isResolvingAddress ? (
                                  <div className="w-full h-9.5 px-3 bg-indigo-50/90 border border-indigo-200/80 rounded-xl flex items-center justify-center gap-1.5 text-xs text-indigo-700 font-medium">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                                    <span className="truncate">Đang tìm tọa độ...</span>
                                  </div>
                                ) : resolvedPreview && resolvedPreview.success ? (
                                  <div
                                    onClick={() => {
                                      if (resolvedPreview?.latitude && resolvedPreview?.longitude) {
                                        const mapShareText = `https://maps.google.com/?q=${resolvedPreview.latitude.toFixed(6)},${resolvedPreview.longitude.toFixed(6)}`;
                                        navigator.clipboard.writeText(mapShareText);
                                        setSuccessMsg("Đã sao chép liên kết vị trí bản đồ!");
                                        setTimeout(() => {
                                          setSuccessMsg((prev) => (prev === "Đã sao chép liên kết vị trí bản đồ!" ? "" : prev));
                                        }, 1000);
                                      }
                                    }}
                                    className="w-full h-9.5 px-3 bg-emerald-50/90 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-1.5 text-xs transition-all cursor-pointer shadow-2xs group select-none"
                                    title="Bấm vào để sao chép liên kết vị trí bản đồ"
                                  >
                                    <div className="flex items-center min-w-0 flex-1">
                                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100/90 group-hover:bg-emerald-200/70 px-1.5 py-0.5 rounded text-[11px] truncate flex-1 text-center">
                                        {resolvedPreview.latitude.toFixed(4)}, {resolvedPreview.longitude.toFixed(4)}
                                      </span>
                                    </div>

                                    {newAddressForm.address.trim() !== resolvedPreview.formattedAddress.trim() && (
                                      <div className="flex items-center shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNewAddressForm(prev => ({ ...prev, address: resolvedPreview.formattedAddress }));
                                          }}
                                          className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                                          title="Áp dụng định dạng địa chỉ chuẩn hóa"
                                        >
                                          <Sparkles className="w-2.5 h-2.5" />
                                          <span>Chuẩn hóa</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : resolvedPreview && !resolvedPreview.success ? (
                                  <div className="w-full h-9.5 px-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-center gap-1.5 text-xs text-amber-800 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span className="truncate">Chưa tìm thấy tọa độ</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-9.5 px-3 bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-medium">
                                    <span>Chờ nhập địa chỉ...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM SECTION: Full-Height Clean Interactive Map Viewport (MINIMAL EYE BLUR SAVER) */}
                        <div className="flex-1 min-h-[360px] rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden relative shadow-sm flex">
                          
                          {/* Map Viewport Area */}
                          <div className="w-full h-full relative bg-slate-100 flex items-center justify-center overflow-hidden flex-1">
                            {resolvedPreview?.success && resolvedPreview.latitude && resolvedPreview.longitude ? (
                              <>
                                {/* Iframe with dynamic blur effect according to performance state */}
                                <iframe
                                  key={mapKey}
                                  title="OpenStreetMap Live Preview"
                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${resolvedPreview.longitude - 0.007}%2C${resolvedPreview.latitude - 0.004}%2C${resolvedPreview.longitude + 0.007}%2C${resolvedPreview.latitude + 0.004}&layer=${mapLayer}&marker=${resolvedPreview.latitude}%2C${resolvedPreview.longitude}`}
                                  className={`w-full h-full border-0 absolute inset-0 transition-all duration-300 ${
                                    isMapActive 
                                      ? "filter-none opacity-100 scale-100 pointer-events-auto" 
                                      : "filter blur-[4px] opacity-40 scale-105 pointer-events-none"
                                  }`}
                                  loading="lazy"
                                />

                                {/* Performance Saver Overlay: Single Minimal Eye Button */}
                                {!isMapActive && (
                                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[2px] p-4">
                                    <button
                                      type="button"
                                      onClick={() => setIsMapActive(true)}
                                      className="w-14 h-14 rounded-full bg-white/95 hover:bg-white text-indigo-600 shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer group"
                                      title="Bật hiển thị bản đồ tương tác"
                                    >
                                      <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                )}

                                {/* Floating Location Action Bar when Map is Active (No Name, Recenter Icon + Google Maps Button) */}
                                {isMapActive && (
                                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 pl-2.5 rounded-xl border border-slate-200/90 shadow-md animate-in fade-in duration-200">
                                    <div className="flex items-center gap-1.5 pr-1">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      <span className="text-[11px] font-mono font-bold text-slate-700">
                                        {resolvedPreview.latitude.toFixed(4)}, {resolvedPreview.longitude.toFixed(4)}
                                      </span>
                                    </div>

                                    <div className="h-4 w-px bg-slate-200 shrink-0" />

                                    {/* Button 1: Recenter map to target address (Icon Only) */}
                                    <button
                                      type="button"
                                      onClick={() => setMapKey(prev => prev + 1)}
                                      className="w-6.5 h-6.5 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 rounded-lg border border-indigo-200/80 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                                      title="Trỏ lại tâm vị trí"
                                    >
                                      <LocateFixed className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>

                                    {/* Button 2: Open in Google Maps */}
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${resolvedPreview.latitude},${resolvedPreview.longitude}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
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
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                                  <Map className="w-7 h-7" />
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
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{addresses.length} địa chỉ nhận hàng đã lưu</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(true);
                              setEditingAddressSku(null);
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
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
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
                                className={`relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                                  addr.isDefault 
                                    ? "bg-indigo-50/30 border-indigo-200/90 shadow-sm ring-1 ring-indigo-500/10" 
                                    : "bg-white hover:bg-slate-50/50 border-slate-200/90 hover:border-slate-300 shadow-2xs"
                                }`}
                              >
                                {addr.isDefault && (
                                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/70 to-transparent" />
                                )}

                                <div className="space-y-3">
                                  {/* Header: Name, Type Badge & Default Status */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                                        isOffice 
                                          ? "bg-indigo-100/80 text-indigo-700 border border-indigo-200/50" 
                                          : "bg-violet-100/80 text-violet-700 border border-violet-200/50"
                                      }`}>
                                        {isOffice ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
                                            {addr.recipientName}
                                          </h4>
                                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                            isOffice 
                                              ? "bg-indigo-50 text-indigo-700 border-indigo-200/60" 
                                              : "bg-violet-50 text-violet-700 border-violet-200/60"
                                          }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOffice ? "bg-indigo-500" : "bg-violet-500"}`} />
                                            {isOffice ? "Văn phòng" : "Nhà riêng"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {addr.isDefault && (
                                      <span className="inline-flex items-center gap-1 text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-600 text-white shadow-2xs shrink-0 tracking-wider">
                                        <Check className="w-3 h-3 stroke-[2.5]" /> Mặc định
                                      </span>
                                    )}
                                  </div>

                                  {/* Contact & GPS Metadata */}
                                  <div className="flex items-center flex-wrap gap-2 text-xs">
                                    <div className="inline-flex items-center gap-1.5 font-mono text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 text-[11px] font-medium">
                                      <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                                      <span>{addr.phoneNumber}</span>
                                    </div>

                                    {addr.latitude && addr.longitude && (
                                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-medium">
                                        <Compass className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>{addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Detailed Address Box */}
                                  <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/90">
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
                                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1 py-1"
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
                                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                      title="Chỉnh sửa địa chỉ"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAddress(addr.sku)}
                                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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

                {/* TAB 4: Payment Methods & Cards */}
                {activeModalTab === "payments" && (
                  <div className="space-y-5 flex-1">
                    {isAddingCard ? (
                      /* FULL FORM VIEW WHEN ADDING PAYMENT CARD */
                      <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleAddPaymentMethod}
                        className="p-6 bg-slate-50/70 border border-indigo-200/80 rounded-2xl space-y-4 text-left shadow-xs"
                      >
                        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-950">Liên kết phương thức thanh toán mới</p>
                            <p className="text-[11px] text-slate-500">Các phương thức đã lưu được hiển thị ở cột bên trái để bạn tiện theo dõi.</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Loại phương thức</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { type: "visa", label: "Visa" },
                              { type: "mastercard", label: "Mastercard" },
                              { type: "jcb", label: "JCB" },
                              { type: "momo", label: "Ví MoMo" }
                            ].map(item => (
                              <button
                                key={item.type}
                                type="button"
                                onClick={() => setNewCardForm({ ...newCardForm, type: item.type as any })}
                                className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center cursor-pointer transition-all ${
                                  newCardForm.type === item.type
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white border-transparent shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                              {newCardForm.type === "momo" ? "Số điện thoại MoMo *" : "Số thẻ thanh toán *"}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={newCardForm.type === "momo" ? "090xxxxxxx" : "4111 2222 3333 4444"}
                              value={newCardForm.cardNumber}
                              onChange={(e) => setNewCardForm({ ...newCardForm, cardNumber: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-600 text-xs px-3.5 py-3 rounded-xl outline-none transition-all font-mono font-bold text-slate-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tên chủ thẻ (In hoa) *</label>
                            <input
                              type="text"
                              required
                              placeholder="NGO NGOC DINH"
                              value={newCardForm.holderName}
                              onChange={(e) => setNewCardForm({ ...newCardForm, holderName: e.target.value.toUpperCase() })}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-600 text-xs px-3.5 py-3 rounded-xl outline-none transition-all font-mono font-bold uppercase text-slate-900"
                            />
                          </div>
                        </div>

                        {newCardForm.type !== "momo" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Hạn sử dụng (MM/YY) *</label>
                              <input
                                type="text"
                                required
                                placeholder="08/29"
                                value={newCardForm.expiryDate}
                                onChange={(e) => setNewCardForm({ ...newCardForm, expiryDate: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-600 text-xs px-3.5 py-3 rounded-xl outline-none transition-all font-mono font-bold text-center text-slate-900"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Mã bảo mật CVC/CVV *</label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="•••"
                                value={newCardForm.cvv}
                                onChange={(e) => setNewCardForm({ ...newCardForm, cvv: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-600 text-xs px-3.5 py-3 rounded-xl outline-none transition-all font-mono font-bold text-center text-slate-900"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/70">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newCardForm.isDefault}
                              onChange={(e) => setNewCardForm({ ...newCardForm, isDefault: e.target.checked })}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                            />
                            <span className="text-xs text-slate-700 font-semibold">Đặt làm phương thức thanh toán chính</span>
                          </label>
                          
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCard(false);
                                setErrorMsg("");
                                setSuccessMsg("");
                              }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 hover:opacity-95 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>Lưu phương thức</span>
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    ) : (
                      /* DEFAULT VIEW: Header + 2-Column Grid of Payment Cards */
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{paymentMethods.length} phương thức thanh toán</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCard(true);
                              setErrorMsg("");
                              setSuccessMsg("");
                            }}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm thẻ / Ví mới</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {paymentMethods.map((card) => (
                            <div
                              key={card.id}
                              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                card.isDefault 
                                  ? "bg-slate-900 text-white border-slate-800 shadow-lg shadow-slate-900/15" 
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono tracking-wider ${
                                    card.type === "visa" 
                                      ? "bg-blue-600 text-white" 
                                      : card.type === "mastercard" 
                                        ? "bg-red-600 text-white" 
                                        : card.type === "momo"
                                          ? "bg-pink-600 text-white"
                                          : "bg-emerald-600 text-white"
                                  }`}>
                                    {card.type.toUpperCase()}
                                  </div>
                                  {card.isDefault && (
                                    <span className="text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-white/20 text-white border border-white/30">
                                      Mặc định
                                    </span>
                                  )}
                                </div>

                                <p className={`text-sm font-mono font-bold tracking-wider ${card.isDefault ? "text-white" : "text-slate-900"}`}>
                                  {card.cardNumber}
                                </p>

                                <div className="flex items-center justify-between text-[11px] pt-1">
                                  <span className={card.isDefault ? "text-slate-300 font-mono font-medium" : "text-slate-500 font-mono"}>
                                    {card.holderName}
                                  </span>
                                  <span className={card.isDefault ? "text-slate-400 font-mono" : "text-slate-400 font-mono"}>
                                    Hạn: {card.expiryDate}
                                  </span>
                                </div>
                              </div>

                              <div className={`flex items-center justify-between pt-3 mt-3 border-t ${card.isDefault ? "border-slate-800" : "border-slate-100"}`}>
                                {!card.isDefault ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultPayment(card.id)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                  >
                                    Đặt làm mặc định
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Thẻ thanh toán chính
                                  </span>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(card.id)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                    card.isDefault 
                                      ? "text-slate-400 hover:text-red-400 hover:bg-white/10" 
                                      : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  }`}
                                  title="Xóa thẻ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 5: Active Sessions & Devices (2-Column Grid Layout) */}
                {activeModalTab === "sessions" && (
                  <div className="space-y-5 flex-1">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current device card */}
                      <div className="p-4 sm:p-5 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5 text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-900">Trình duyệt Web (Phiên hiện tại)</p>
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              HOẠT ĐỘNG
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            IP: 118.69.182.10 • TP. Hồ Chí Minh, Việt Nam
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Truy cập lần cuối: Vừa xong
                          </p>
                        </div>
                      </div>

                      {/* Secondary Mobile App device session */}
                      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3.5 text-left">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-900">Horizon Mobile App v2.4 (iOS)</p>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              iPhone 15 Pro
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            IP: 14.241.221.84 • TP. Hồ Chí Minh
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Truy cập lần cuối: 2 giờ trước
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Terminate other sessions action */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSuccessMsg("Đã đăng xuất tài khoản khỏi tất cả các thiết bị khác thành công!");
                          logAuditAction("TERMINATE_SESSIONS", "SUCCESS", "Đăng xuất các phiên thiết bị khác từ Portal");
                        }}
                        className="w-full py-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-red-200 shadow-xs"
                      >
                        Đăng xuất khỏi tất cả các thiết bị khác
                      </button>
                    </div>

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
