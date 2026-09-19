# Task List: Order GraphQL Integration & Color System at `/m`

## Phase 1: Foundation & GraphQL Client Services

### Task 1: Chuẩn hóa & Mở rộng Service GraphQL Order
**Description:** Bổ sung và chuẩn hóa các hàm fetch GraphQL trong `src/services/orderService.ts` bao gồm `fetchMyOrdersList` (hỗ trợ filter status, pagination) và `fetchMyOrderDetail` (lấy chi tiết đơn hàng, statusHistory, receiver info) tương thích với gateway `/graphql`.
**Acceptance criteria:**
- [x] `fetchMyOrdersList` hỗ trợ tham số `status`, `page`, `size` và trả về danh sách `OrderSummaryItem`.
- [x] `fetchMyOrderDetail` lấy chi tiết `OrderDto` với đầy đủ items, timeline history và thông tin vận chuyển.
- [x] Có cơ chế xử lý lỗi graceful, fallback an toàn khi GraphQL request thất bại.
**Verification:**
- [x] Type check sạch: `npm run lint`
- [x] Kiểm tra hàm hoạt động trả về đúng cấu trúc DTO.
**Dependencies:** None
**Files likely touched:**
- `src/services/orderService.ts`
**Estimated scope:** Small (1 file)

---

### Task 2: Xây dựng Cache Adapter & DTO Normalizer cho Order
**Description:** Tạo module chuẩn hóa dữ liệu (Normalizer) và Local Cache Adapter để map dữ liệu giữa GraphQL DTO với định dạng hiển thị của `ProfilePage`, đồng thời lưu trữ cache cục bộ để phục vụ chiến lược Hybrid Cache-First (0ms lag).
**Acceptance criteria:**
- [x] Hàm `normalizeOrderData` chuyển đổi chính xác các trạng thái từ Backend (`WAITING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`, `REFUNDED`) sang cấu trúc hiển thị UI.
- [x] Cung cấp hàm đọc/ghi cache đơn hàng cục bộ vào `localStorage` (`STORAGE_KEYS.USER_ORDERS`).
**Verification:**
- [x] Type check sạch: `npm run lint`
**Dependencies:** Task 1
**Files likely touched:**
- `src/services/orderService.ts`
**Estimated scope:** Small (1 file)

---

## Checkpoint 1: Foundation Complete
- [x] `orderService.ts` biên dịch không có lỗi TypeScript.
- [x] API helper queries và mapper functions sẵn sàng phục vụ cho UI.

---

## Phase 2: UI Color Engine & Bevel Styling

### Task 3: Xây dựng Helper Bảng mã màu ngữ nghĩa (Semantic Color Tokens Matrix)
**Description:** Xây dựng module helper quy định bảng mã màu Bevel 3D Glassmorphism, text color, border gradient, status dot glow theo từng trạng thái đơn hàng (`WAITING_PAYMENT`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`) và các cấp bậc hội viên.
**Acceptance criteria:**
- [x] Hàm `getOrderStatusTheme(status)` trả về toàn bộ lớp CSS cho Badge, Status Dot Glow, và Timeline Line tương ứng.
- [x] Khớp 100% với đặc tả màu sắc tại Mục 4 của `docs/ORDER_GRAPHQL_API.md`.
**Verification:**
- [x] Kiểm tra visual preview các tone màu Amber, Indigo, Sky, Emerald, Rose.
**Dependencies:** Task 2
**Files likely touched:**
- `src/lib/orderStatusTheme.ts`
**Estimated scope:** Small (1 file)

---

### Task 4: Tạo Status Filter Pills & Nâng cấp Timeline Tracking Visuals
**Description:** Thêm thanh điều hướng lọc trạng thái (Filter Pills: Tất cả, Chờ thanh toán, Đang xử lý, Đang giao hàng, Đã hoàn tất, Đã hủy) phía trên danh sách đơn hàng và làm đẹp các node Timeline Tracking theo phong cách Bevel.
**Acceptance criteria:**
- [x] Filter Pills hiển thị số lượng đơn hàng theo từng trạng thái và có hiệu ứng kính mờ khi hover/active.
- [x] Node Timeline của đơn hàng hiện tại có vòng pulse sáng, node hoàn tất có tone màu tương ứng.
**Verification:**
- [x] Kiểm tra tương tác chuyển tab bộ lọc trên giao diện.
**Dependencies:** Task 3
**Files likely touched:**
- `src/components/ProfilePage.tsx`
**Estimated scope:** Medium (1-2 files)

---

## Checkpoint 2: Color & Visuals Complete
- [x] Hệ màu sắc Bevel Glassmorphism hiển thị hài hòa, đúng chuẩn Horizon.
- [x] Filter Pills hoạt động mượt mà, phản hồi ngay lập tức.

---

## Phase 3: Dynamic Data Integration at `/m` (ProfilePage)

### Task 5: Tích hợp luồng dữ liệu GraphQL Order vào `ProfilePage.tsx`
**Description:** Kết nối `ProfilePage` với `orderService.ts` để thực hiện query `myOrdersList` khi tải trang (ưu tiên cache trước, sau đó đồng bộ mạng), tự động fetch `myOrderDetail` khi chọn đơn hàng và render toàn bộ thông tin items, tổng tiền, địa chỉ nhận hàng.
**Acceptance criteria:**
- [x] Khi vào `/m`, danh sách đơn hàng hiển thị ngay từ cache, sau đó cập nhật ngầm từ GraphQL.
- [x] Bấm chọn đơn hàng lập tức hiển thị chi tiết hóa đơn, phương thức thanh toán và danh sách SKU thực tế.
- [x] Xử lý trạng thái rỗng (Empty State) và đang tải (Skeleton Loader) mượt mà.
**Verification:**
- [x] Kiểm tra trên trình duyệt tại `http://localhost:3000/m`.
- [x] Kiểm tra chuyển đổi giữa các đơn hàng.
**Dependencies:** Task 1, 2, 3, 4
**Files likely touched:**
- `src/components/ProfilePage.tsx`
**Estimated scope:** Medium (1-2 files)

---

### Task 6: Thiết lập Smart Interval Polling & Realtime Sync
**Description:** Thêm cơ chế tự động làm mới trạng thái cho các đơn hàng chưa hoàn tất (`WAITING_PAYMENT`, `SHIPPED`) mỗi 25s khi người dùng đang active trên tab `/m`, dừng lại khi chuyển tab ẩn.
**Acceptance criteria:**
- [x] Sử dụng Page Visibility API để tạm dừng polling khi tab bị ẩn và resume ngay khi user quay lại.
- [x] Cập nhật mượt mà khi trạng thái đơn hàng thay đổi.
**Verification:**
- [x] Chạy lint `npm run lint` đạt mã thoát 0.
- [x] Kiểm tra hoạt động polling không gây re-render giật lag.
**Dependencies:** Task 5
**Files likely touched:**
- `src/components/ProfilePage.tsx`
**Estimated scope:** Small (1 file)

---

## Checkpoint 3: Feature Complete & Verification
- [x] Tất cả 6 tasks đã hoàn thành và verified.
- [x] `npm run lint` pass không lỗi.
