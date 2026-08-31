/**
 * WebSocket Service - Frontend Payment Session Real-time Gateway
 * Feature: FEATURE-WS-JWT-AUTH-30S
 * Target Service: websocket-service (Port 8667)
 */

import { getUnifiedAccessToken } from "@/lib/api";

export const DEFAULT_WS_URL = "ws://localhost:8667";

export interface PaymentWsMessage {
  orderNumber?: string;
  type?: string;
  eventType?: string;
  status?: string;
  provider?: string;
  paymentUrl?: string;
  message?: string;
  data?: Record<string, any>;
}

export interface ConnectPaymentSocketOptions {
  wsUrl?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (message: PaymentWsMessage, rawData: string) => void;
  onClose?: (event: CloseEvent, reasonText: string) => void;
  onError?: (event: Event) => void;
}

export interface PaymentSocketSession {
  socket: WebSocket;
  token: string;
  close: (code?: number, reason?: string) => void;
}

/**
 * Diễn giải mã đóng WebSocket (Close Codes) theo chuẩn của websocket-service
 */
export function getCloseCodeReason(code: number): string {
  switch (code) {
    case 1000:
      return "Đóng kết nối bình thường (Normal Closure). Giao dịch hoặc phiên làm việc đã hoàn tất.";
    case 1008:
      return "Thiếu thông tin xác thực token (Policy Violation).";
    case 4001:
      return "JWT Token không hợp lệ, hết hạn hoặc sai chữ ký bảo mật.";
    case 4008:
      return "Phiên kết nối đã đạt giới hạn thời gian sống tối đa 30 giây (Session 30s Lifetime Expired).";
    default:
      return `Đóng kết nối với mã code: ${code}`;
  }
}

/**
 * Khởi tạo kết nối WebSocket trực tiếp sử dụng Access Token của phiên đăng nhập
 */
export async function connectPaymentWebSocket(
  options?: ConnectPaymentSocketOptions
): Promise<PaymentSocketSession> {
  const {
    wsUrl = DEFAULT_WS_URL,
    onOpen,
    onMessage,
    onClose,
    onError,
  } = options || {};

  // Lấy trực tiếp access token từ phiên đăng nhập của người dùng
  const token = getUnifiedAccessToken();
  const sanitizedWsUrl = wsUrl.replace(/\/$/, "");
  const targetUrl = token
    ? `${sanitizedWsUrl}/?token=${encodeURIComponent(token)}`
    : `${sanitizedWsUrl}/`;

  console.log(`[WebSocket] Connecting to ${targetUrl}`);

  const socket = new WebSocket(targetUrl);

  socket.onopen = (event) => {
    console.log("[WebSocket] Connected successfully to payment gateway");
    if (onOpen) onOpen(event);
  };

  socket.onmessage = (event) => {
    console.log("[WebSocket] Inbound payment message received:", event.data);
    let parsed: PaymentWsMessage = {};
    try {
      if (typeof event.data === "string") {
        parsed = JSON.parse(event.data);
      }
    } catch (_) {
      parsed = { message: String(event.data) };
    }

    if (onMessage) {
      onMessage(parsed, event.data);
    }
  };

  socket.onerror = (event) => {
    console.error("[WebSocket] Connection error:", event);
    if (onError) onError(event);
  };

  socket.onclose = (event) => {
    const reasonText = getCloseCodeReason(event.code);
    console.log(`[WebSocket] Disconnected (code: ${event.code}): ${reasonText}`);
    if (onClose) onClose(event, reasonText);
  };

  return {
    socket,
    token,
    close: (code = 1000, reason = "Client initiated disconnect") => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(code, reason);
      }
    },
  };
}

export interface ExecuteAsyncOrderCreationCallbacks {
  onStatusChange?: (statusText: string) => void;
  onSessionAcquired?: (sessionId: string) => void;
  onSuccess: (result: { orderNumber: string; paymentUrl?: string; message?: string }) => void;
  onError: (errorMessage: string) => void;
}

export interface ExecuteAsyncOrderSessionHandle {
  session: PaymentSocketSession;
  cancel: () => void;
}

/**
 * Điều phối luồng Tạo Đơn Hàng Bất Đồng Bộ Đa Dịch Vụ:
 * 1. Mở WebSocket Gateway
 * 2. Nhận message đầu tiên chứa orderNumber (Session ID)
 * 3. Gửi REST API POST /api/orders kèm orderSessionId
 * 4. Chờ WebSocket bắn sự kiện kết quả cuối cùng (SUCCESS / PAYMENT_READY / FAILED / ERROR)
 * 5. Tự động đóng WebSocket (code 1000) và dọn dẹp timeout 30s
 */
export async function executeAsyncOrderCreation(
  input: import("./orderService").CreateOrderInput,
  callbacks: ExecuteAsyncOrderCreationCallbacks,
  wsUrl?: string
): Promise<ExecuteAsyncOrderSessionHandle> {
  const { createOrder } = await import("./orderService");

  let hasCompleted = false;
  let hasSubmittedOrder = false;
  let currentSessionId = input.orderSessionId || "";
  let sessionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  callbacks.onStatusChange?.("Đang kết nối cổng giao dịch WebSocket...");

  const session = await connectPaymentWebSocket({
    wsUrl,
    onOpen: () => {
      callbacks.onStatusChange?.("Đã kết nối WebSocket thành công. Đang chờ cấp mã phiên giao dịch...");
    },
    onMessage: async (msg: PaymentWsMessage) => {
      if (hasCompleted) return;

      // Bước 1: Nhận session OrderID khởi tạo từ WebSocket nếu chưa gửi API
      if (!hasSubmittedOrder && msg.orderNumber) {
        hasSubmittedOrder = true;
        currentSessionId = msg.orderNumber;
        callbacks.onSessionAcquired?.(currentSessionId);
        callbacks.onStatusChange?.(`Đã nhận mã phiên [${currentSessionId}]. Đang gửi đơn hàng tới hệ thống...`);

        try {
          const apiPayload = {
            ...input,
            orderSessionId: currentSessionId,
          };
          await createOrder(apiPayload);
          callbacks.onStatusChange?.("Đã ghi nhận đơn hàng. Đang chờ xác nhận giao dịch & thanh toán...");
        } catch (apiErr: any) {
          hasCompleted = true;
          if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
          session.close(1000, "API order creation failed");
          callbacks.onError(apiErr.message || "Không thể khởi tạo đơn hàng qua hệ thống API");
          return;
        }
      }

      // Bước 2: Nhận kết quả phản hồi cuối cùng từ hệ thống qua WebSocket
      const isSuccess =
        msg.status === "SUCCESS" ||
        msg.type === "PAYMENT_READY" ||
        msg.type === "ORDER_COMPLETED" ||
        Boolean(msg.paymentUrl);

      const isFailed = msg.status === "FAILED" || msg.type === "ERROR";

      if (isSuccess) {
        hasCompleted = true;
        if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
        session.close(1000, "Order creation completed successfully");
        callbacks.onSuccess({
          orderNumber: msg.orderNumber || currentSessionId,
          paymentUrl: msg.paymentUrl,
          message: msg.message,
        });
      } else if (isFailed) {
        hasCompleted = true;
        if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
        session.close(1000, "Order processing failed");
        callbacks.onError(msg.message || "Xử lý đơn hàng thất bại trên hệ thống");
      }
    },
    onError: () => {
      if (!hasCompleted) {
        hasCompleted = true;
        if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
        callbacks.onError("Không thể kết nối đến cổng WebSocket Gateway. Vui lòng kiểm tra lại dịch vụ.");
      }
    },
    onClose: (event, reasonText) => {
      if (!hasCompleted && event.code !== 1000) {
        hasCompleted = true;
        if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
        callbacks.onError(`Phiên WebSocket bị gián đoạn: ${reasonText}`);
      }
    },
  });

  // Thiết lập Timeout an toàn 30s (code 4008)
  sessionTimeoutTimer = setTimeout(() => {
    if (!hasCompleted) {
      hasCompleted = true;
      session.close(4008, "Session 30s Lifetime Expired");
      callbacks.onError("Hết thời gian chờ phản hồi từ hệ thống (30s). Vui lòng kiểm tra lại danh sách đơn hàng.");
    }
  }, 30000);

  return {
    session,
    cancel: () => {
      if (!hasCompleted) {
        hasCompleted = true;
        if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
        session.close(1000, "User cancelled order creation");
      }
    },
  };
}

