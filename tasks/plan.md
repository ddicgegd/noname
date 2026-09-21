# Implementation Plan: Loại Bỏ Mock UI, Đồng Bộ Endpoints & Màu Sắc Đơn Hàng Tại `/m`

## Objective
Thực thi tinh gọn việc loại bỏ dữ liệu & giao diện Mock UI tại trang `/m`, kết nối endpoint GraphQL Gateway lấy dữ liệu thật, chuẩn hóa bảng màu trạng thái cho Card Order & Timeline Status Tree, và sửa lỗi ẩn Navbar không mong muốn tại `/m`.

## Proposed Changes

### 1. Sửa GraphQL Schema trong Backend Gateway (`server.ts`)
- Chuyển trường `status` trong query `myOrdersList` từ `GraphQLNonNull(OrderStatusEnum)` thành `OrderStatusEnum` (optional) để hỗ trợ truy vấn tất cả đơn hàng (tab ALL).
- Kiểm tra và xác thực endpoint bằng lệnh test (curl/npx tsx) đảm bảo trả về dữ liệu đúng định dạng DTO.

### 2. Loại bỏ Mock UI & Đồng Bộ Loading Dữ Liệu Thật (`src/components/ProfilePage.tsx`)
- Xóa bỏ logic gieo dữ liệu giả (`seed mock orders`, `horizon_orders_seed_v5`, `HZ-7711-R`,...) trong `loadProfileAndOrders`.
- Khởi tạo danh sách đơn hàng từ cache thực tế hoặc gọi trực tiếp `syncOrdersFromGraphQL()` khi component mount / đổi tab.
- Thêm giao diện Skeleton Loading / Shimmer Loader khi đang đồng bộ và Empty State lịch sự chuẩn Bevel khi chưa có đơn hàng.

### 3. Đồng Bộ Hệ Thống Màu Sắc Tag & Status Tree Timeline
- Đồng bộ hàm giải mã màu và thẻ trạng thái `getOrderStatusTheme` từ `src/lib/orderStatusTheme.ts` vào toàn bộ:
  - Header Tag trên Order Card (badge background, text color, dot glow, border accent).
  - Các mốc trạng thái (Delivery Steps) trong Hành trình giao hàng (Status Tree):
    - Mốc đang xử lý (`active`): Glow ambient tương ứng (Amber/Indigo/Sky/Emerald).
    - Đường line kết nối giữa các mốc đã hoàn thành (`completed`): Gradient chuẩn theo trạng thái đơn hàng.
    - Mốc hoàn tất (`isOrderDelivered`): Icon Check xanh Emerald Bevel.
    - Mốc chờ thực hiện: Màu slate trung tính làm mờ tinh tế.

### 4. Điều Chỉnh Hiển Thị Navbar (`src/components/Navbar.tsx`)
- Loại bỏ `/m`, `/profile`, `/account` khỏi danh sách `isAccountPage` thuộc chế độ auto-hide trong `Navbar.tsx` để Navbar luôn hiển thị cố định, ổn định trên đầu trang `/m`.

## Verification Strategy
- **Backend Test**: Chạy `curl` kiểm tra `myOrdersList` với status và không có status.
- **Frontend Test**: Chạy `npx tsc --noEmit` xác thực toàn bộ TypeScript type safety.
- **Visual Inspection**: Kiểm tra giao diện `/m`, chuyển đổi các tab trạng thái (Tất cả, Chờ thanh toán, Đang xử lý, Đang giao, Đã giao, Đã hủy) và kiểm tra màu sắc tương ứng.
