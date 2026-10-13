# Unified Application Error Handling Specification

## 1. Mục tiêu & Nguyên tắc cốt lõi
- **Tuyệt đối không rò rỉ chi tiết kỹ thuật ra UI**: Nghiêm cấm hiển thị hostname (`localhost:8080`, cổng port, IP), từ khóa kiến trúc (`backend`, `Spring Boot`, `Core Banking`, `GraphQL Gateway`, `WebSocket Gateway`), hoặc raw stack trace/error codes ra giao diện người dùng cuối.
- **Chuẩn hóa thông điệp**: Mọi sự cố kết nối, lỗi mạng, lỗi máy chủ nội bộ (HTTP 500, 502, 503, 504, `Failed to fetch`, `ECONNREFUSED`) đều hiển thị thông điệp đồng nhất:
  > **"Lỗi hệ thống. Vui lòng thử lại sau."**
- **Deterministic Resolution (Không dùng `||` fallback hay Regex bóc tách chuỗi)**: Mọi tầng UI và Service phân giải lỗi qua `resolveAppError(error)` / `getAppErrorMessage(error)` từ `src/components/ui/AppErrorNotice.tsx`.

## 2. Bảng mã lỗi chuẩn (`APP_ERROR_MAP`)
| Mã lỗi | HTTP Status | Tiêu đề | Thông báo hiển thị |
| :--- | :--- | :--- | :--- |
| `NETWORK_OFFLINE` | 0 | Lỗi hệ thống | Lỗi hệ thống. Vui lòng thử lại sau. |
| `UNAUTHORIZED` | 401 | Hết phiên đăng nhập | Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại. |
| `FORBIDDEN` | 403 | Không có quyền truy cập | Bạn không có quyền thực hiện thao tác này. |
| `BAD_REQUEST` | 400 | Yêu cầu không hợp lệ | Thông tin không hợp lệ. Vui lòng kiểm tra lại. |
| `NOT_FOUND` | 404 | Không tìm thấy dữ liệu | Dữ liệu yêu cầu không tồn tại. |
| `CONFLICT` | 409 | Dữ liệu bị trùng lặp | Dữ liệu đã tồn tại trên hệ thống. |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi hệ thống | Lỗi hệ thống. Vui lòng thử lại sau. |
| `SERVICE_UNAVAILABLE` | 503 | Lỗi hệ thống | Lỗi hệ thống. Vui lòng thử lại sau. |
| `UNKNOWN_ERROR` | N/A | Lỗi hệ thống | Lỗi hệ thống. Vui lòng thử lại sau. |

## 3. Danh sách tệp đã chuẩn hóa
1. **Component dùng chung**:
   - `src/components/ui/AppErrorNotice.tsx` (Component hiển thị Banner/Card/Inline + Error Resolver)
2. **Bộ trích xuất và tương thích**:
   - `src/lib/responseExtractor.ts` (`sanitizeErrorMessage` ủy quyền `getAppErrorMessage`)
   - `src/lib/api.ts` (Loại bỏ URL Spring Boot khỏi default error và console.warn)
   - `src/lib/fineractErrorExtractor.ts` (Loại bỏ `HTTP 500`, `Core Banking` khỏi tiêu đề)
3. **Các trang UI người dùng**:
   - `src/components/RegisterPage.tsx`
   - `src/components/ProfilePage.tsx`
   - `src/components/OrderPage.tsx`
   - `src/components/EmailActionResponsePage.tsx`
   - `src/components/HoloCardPaymentSheet.tsx`
4. **Các Service tầng Client & Gateway**:
   - `src/services/addressService.ts`
   - `src/services/cartService.ts`
   - `src/services/orderService.ts`
   - `src/services/sessionService.ts`
   - `src/services/subscriptionService.ts`
   - `src/services/merchandiseService.ts`
   - `src/services/websocketService.ts`
   - `server.ts` (GraphQL resolver & REST proxy 500/502/503 responses)
