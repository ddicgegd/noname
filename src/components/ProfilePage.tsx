import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Lock, Mail, ChevronDown, ChevronUp, CheckCircle, 
  Eye, EyeOff, AlertCircle, RefreshCw, ArrowRight, Phone,
  Shield, Check, X, Sliders, ShoppingBag, ClipboardList, Truck, Package, 
  MapPin, Clock, CreditCard, ChevronRight, HelpCircle
} from "lucide-react";
import { apiRequest } from "../lib/api";

interface ProfilePageProps {
  onNavigate: (page: "landing" | "product" | "auth" | "auth-report" | "profile" | "terms") => void;
}

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

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  // Authentication status
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("horizon_current_user");
    } catch {
      return true;
    }
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Accounts Center Modal Trigger State
  const [isAccountsCenterOpen, setIsAccountsCenterOpen] = useState<boolean>(false);

  // Error / Success Messages
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Accordion Expansions in Accounts Center Modal
  const [isUsernameChangeExpanded, setIsUsernameChangeExpanded] = useState<boolean>(false);
  const [isPasswordResetExpanded, setIsPasswordResetExpanded] = useState<boolean>(false);

  // Input states
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
      const storedProfile = localStorage.getItem("horizon_redis_profile");
      const storedUser = localStorage.getItem("horizon_current_user");

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
      const storedOrders = localStorage.getItem("horizon_user_orders");
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
        localStorage.setItem("horizon_user_orders", JSON.stringify(activeOrders));
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
      fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
          "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || ""
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
          localStorage.setItem("horizon_current_user", JSON.stringify(fetchedUser));
          
          if (storedProfile) {
            const prof = JSON.parse(storedProfile);
            localStorage.setItem("horizon_redis_profile", JSON.stringify({
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
              localStorage.setItem("horizon_current_user", JSON.stringify(fetchedUser));
              
              if (storedProfile) {
                const prof = JSON.parse(storedProfile);
                localStorage.setItem("horizon_redis_profile", JSON.stringify({
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
            localStorage.setItem("horizon_current_user", JSON.stringify(fetchedUser));
            
            if (storedProfile) {
              const prof = JSON.parse(storedProfile);
              localStorage.setItem("horizon_redis_profile", JSON.stringify({
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
    } catch (e) {
      console.error("Error loading profile:", e);
      setErrorMsg("Lỗi hệ thống khi tải thông tin tài khoản.");
      setIsLoading(false);
    }
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
      const gqlResponse = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || ""
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
        localStorage.setItem("horizon_current_user", JSON.stringify(updated));
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
          localStorage.setItem("horizon_current_user", JSON.stringify(updated));
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
      const gqlResponse = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-BFF-Gateway-Url": localStorage.getItem("horizon_api_base_url") || ""
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
      const storedLogs = localStorage.getItem("horizon_auth_audit_logs") || "[]";
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
      localStorage.setItem("horizon_auth_audit_logs", JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error("Error writing audit logs:", e);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản?")) {
      localStorage.removeItem("horizon_redis_profile");
      localStorage.removeItem("horizon_current_user");
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

      {/* POPUP ACCOUNTS CENTER MODAL (Meta-style Portal Overlay) */}
      <AnimatePresence>
        {isAccountsCenterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountsCenterOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
            />

            {/* Modal Card content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-6 sm:p-8 overflow-y-auto max-h-[85vh] space-y-6 z-10"
            >
              
              {/* Close Button top-right */}
              <button 
                onClick={() => setIsAccountsCenterOpen(false)}
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="text-left">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-inner shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111111] font-sans leading-tight">Trung tâm tài khoản</h3>
                    <p className="text-[9px] text-indigo-600 font-bold font-mono uppercase tracking-wider">Horizon Accounts Center</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Thiết lập bảo mật và cấu hình tài khoản ủy quyền Bearer Access Token an toàn.
                </p>
              </div>

              {/* Status Alert in Modal */}
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2 text-left"
                  >
                    <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Brief Info inside Modal */}
              {user && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5 text-left">
                  <span className="text-[9px] text-slate-400 font-bold font-mono uppercase">Hồ sơ đồng bộ</span>
                  <p className="text-xs font-extrabold text-slate-800 leading-none">{user.fullName || "Hội viên Horizon"}</p>
                  <p className="text-[10.5px] font-mono text-slate-400 select-all">{user.email || "N/A"}</p>
                </div>
              )}

              {/* Action 1: Username accordion */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsUsernameChangeExpanded(!isUsernameChangeExpanded);
                    setIsPasswordResetExpanded(false);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold text-slate-800">Đổi tên đăng nhập (Username)</span>
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
                      <form onSubmit={handleChangeUsername} className="p-4 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono text-left">Tên đăng nhập mới</label>
                          <input
                            type="text"
                            required
                            placeholder="Nhập username mới..."
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF4D24] text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full bg-[#FF4D24] hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-white" /> : "Cập nhật tên đăng nhập"}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action 2: Password accordion */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordResetExpanded(!isPasswordResetExpanded);
                    setIsUsernameChangeExpanded(false);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#FF4D24]" />
                    <span className="text-xs font-extrabold text-slate-800">Mật khẩu và bảo mật</span>
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
                      <form onSubmit={handleResetPassword} className="p-4 flex flex-col gap-3">
                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mật khẩu mới</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="Nhập tối thiểu 6 ký tự..."
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF4D24] text-xs pl-3.5 pr-10 py-2.5 rounded-xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
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

                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Xác nhận mật khẩu</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Nhập lại mật khẩu..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF4D24] text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white transition-all text-[#111111] font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full bg-[#FF4D24] hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-white" /> : "Xác nhận đổi mật khẩu"}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close portal button */}
              <button
                type="button"
                onClick={() => setIsAccountsCenterOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-2xl transition-all cursor-pointer"
              >
                Đóng Trung tâm tài khoản
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
