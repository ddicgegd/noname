# Order GraphQL API & Endpoint Configuration Specification (`ORDER_GRAPHQL_API.md`)

## 1. Giới thiệu & Mục tiêu (Objective)
Tài liệu đặc tả chuẩn hóa giao thức **GraphQL Gateway** cho phân hệ Quản lý Đơn hàng (**Order Management**) và kiến trúc xử lý dữ liệu, hệ màu sắc nhận diện UI (Design System & Color Tokens) tại route `/m` (`ProfilePage`).

Hệ thống cho phép:
- Truy vấn danh sách đơn hàng của người dùng hiện tại (`myOrdersList`) kèm phân trang và lọc theo trạng thái (`OrderStatus`).
- Truy vấn chi tiết đơn hàng theo mã đơn (`myOrderDetail`).
- Đồng bộ hành trình đơn hàng (Timeline Tracking), hóa đơn, trạng thái thanh toán & giao vận trực tiếp tại `/m`.
- Xử lý hệ thống màu sắc nhận diện chuẩn hóa (Status Semantic Colors, Bevel Glassmorphism, Dynamic Timeline Glow) tương thích hoàn toàn với Design System hiện tại của Horizon.

---

## 2. GraphQL Schema Đặc Tả Cho Order

### 2.1. Enumerations & Data Types
```graphql
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELLED
  WAITING_PAYMENT
  REFUNDED
}

enum PaymentMethod {
  COD
  VNPAY
  MOMO
  BANK_TRANSFER
  CREDIT_CARD
  PAYPAL
}

enum ShippingMethod {
  DELIVERY
  PICKUP
}

type VariantOption {
  name: String!
  value: String!
}

type OrderItemDto {
  attributesSku: String!
  productName: String
  quantity: Int!
  unitPrice: Float!
  salePrice: Float
  costPrice: Float
  discountAmount: Float
  discountPercentage: Float
  subtotal: Float!
  taxAmount: Float
  notes: String
  imageUrl: String
  variantOptions: [VariantOption]
}

type FirstItemPreview {
  attributesSku: String
  productName: String
  thumbnailUrl: String
  quantity: Int
  price: Float
}

type OrderSummaryItem {
  orderNumber: String!
  currentStatus: String!
  totalAmount: Float!
  itemCount: Int!
  createdAt: String
  firstItemPreview: FirstItemPreview
}

type PagingDto {
  pageNumber: Int!
  pageSize: Int!
  totalElements: Int!
  totalPages: Int!
}

type MyOrderListDataDto {
  contents: [OrderSummaryItem!]!
  paging: PagingDto!
}

type CustomerInfo {
  fullName: String
  phone: String
  shippingAddress: String
}

type OrderStatusHistoryItem {
  status: String!
  timestamp: String!
}

type OrderDto {
  orderNumber: String!
  orderSessionId: String
  status: [String!]
  currentStatus: String!
  currentStatusDescription: String
  shippingMethod: String
  paymentMethod: String
  addressSku: String
  receiverName: String
  receiverPhone: String
  shippingAddress: String
  subtotal: Float!
  shippingFee: Float
  discountAmount: Float
  productDiscountAmount: Float
  shippingDiscountAmount: Float
  discountCodes: [String!]
  totalAmount: Float!
  customerNotes: String
  bankCode: String
  language: String
  createdAt: String
  customerInfo: CustomerInfo
  orderItems: [OrderItemDto!]!
  statusHistory: [OrderStatusHistoryItem!]
}
```

### 2.2. Query & Mutation Gateway
```graphql
type Query {
  # Lấy danh sách đơn hàng của người dùng hiện tại
  myOrdersList(
    status: OrderStatus
    page: Int
    size: Int
    sortBy: String
    sortDirection: String
  ): MyOrderListResponse!

  # Lấy chi tiết đơn hàng theo orderNumber
  myOrderDetail(
    orderNumber: String!
  ): MyOrderDetailResponse!
}

type Mutation {
  createOrder(input: CreateOrderInput!): CreateOrderResponse!
}
```

---

## 3. Kiến trúc Tích Hợp & Cấu Hình Endpoint tại `/m` (Profile Portal)

### 3.1. Phân tầng kiến trúc (Architectural Layering)
```
  [ /m UI - ProfilePage ]
        │  ▲
        │  │ (React State / Local Cache / Color Tokens Engine)
        ▼  │
  [ orderService.ts ]
        │  ▲
        │  │ (POST /graphql)
        ▼  │
  [ GraphQL Gateway (server.ts /graphql) ]
        │  ▲
        │  │ (Bearer Token / Reverse Proxy)
        ▼  │
  [ Backend Microservices / Spring Boot ERP ]
```

### 3.2. Đề xuất cấu hình endpoint tại `/m`

1. **Dual-Mode Data Fetching (Hybrid Cache-First + Network-First)**:
   - Khi truy cập `/m`, tải trước dữ liệu `orders` từ cache cục bộ (local storage / memory cache) để đảm bảo First Contentful Paint tức thì (0ms latency).
   - Ngay lập tức kích hoạt GraphQL query `myOrdersList` với Bearer token của user để fetch dữ liệu đơn hàng thực tế từ gateway `/graphql`.
   - Tự động map và hợp nhất (merge) dữ liệu từ server vào state của `ProfilePage`, đồng thời cập nhật timestamp và cache.

2. **Tab Lọc Trạng Thái Đơn Hàng (Smart Status Filter Pills)**:
   - Bộ lọc trạng thái trực tiếp trên `/m`: `Tất cả`, `Chờ thanh toán (WAITING_PAYMENT)`, `Đang xử lý (PROCESSING)`, `Đang giao (SHIPPED)`, `Đã giao (DELIVERED/COMPLETED)`, `Đã hủy (CANCELLED)`.
   - Khi chọn tab, gọi `myOrdersList(status: $status, page: 0, size: 20)` và hiển thị skeleton loader mượt mà.

3. **Chi Tiết Đơn Hàng Động (Dynamic Master-Detail Drawer/Timeline)**:
   - Khi click vào 1 đơn hàng trong danh sách bên trái, gọi query `myOrderDetail(orderNumber: $orderNumber)` để lấy thông tin chi tiết đầy đủ (`orderItems`, `statusHistory`, `shippingAddress`, `customerInfo`, `paymentMethod`).
   - Khung chi tiết bên phải (Timeline & Order Receipt) hiển thị chính xác tracking steps, địa chỉ nhận hàng, phương thức thanh toán và các item SKU thực tế.

4. **Realtime Polling / Webhook Sync (Auto Refetch on Active Orders)**:
   - Đối với các đơn hàng có trạng thái `PENDING`, `WAITING_PAYMENT` hoặc `SHIPPED`, kích hoạt cơ chế Smart Interval Polling (mỗi 15s-30s khi tab `/m` đang active) hoặc lắng nghe WebSocket push để cập nhật trạng thái đơn hàng theo thời gian thực.

5. **Graceful Fallback & Resilient Mock Bridge**:
   - Nếu gateway chưa có dữ liệu hoặc token hết hạn/guest, tự động fallback về mock data đã được format chuẩn hóa tương thích 100% với DTO của GraphQL Schema, tránh bất kỳ lỗi crash UI hoặc vỡ layout nào.

---

## 4. Hệ Thống Xử Lý Màu Sắc UI (UI Color Matrix & Visual Language)

Dựa trên ngữ cảnh UI thực tế của dự án (`Bevel 3D Glassmorphism`, `Brand Accent #FF4D24`, `Slate/Zinc Clean Foundation`), phân hệ `/m` được cấu hình bảng mã màu ngữ nghĩa (Semantic Color Tokens) chuyên biệt:

### 4.1. Bảng màu Trạng thái Đơn hàng (Order Status Semantic Matrix)

| Trạng thái Order (`OrderStatus`) | Tone Màu Chủ Đạo | Lớp Viền Kính & Nền Nổi Khối (Bevel Badge Class) | Chấm Tín Hiệu (Pill Dot & Glow) |
|---|---|---|---|
| **`WAITING_PAYMENT` / `PENDING`** (Chờ thanh toán) | **Amber / Warm Gold** | `bg-gradient-to-b from-amber-50 to-amber-100/80 border-t-white border-b-amber-300/80 border-x-amber-200/80 text-amber-800 shadow-[0_1px_2px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]` | `bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]` |
| **`CONFIRMED` / `PROCESSING`** (Đang chuẩn bị hàng) | **Indigo / Electric Violet** | `bg-gradient-to-b from-indigo-50 via-indigo-50/80 to-indigo-100/60 border-t-white border-b-indigo-200/80 border-x-indigo-100/80 text-indigo-700 shadow-[0_1px_2px_rgba(99,102,241,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]` | `bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]` |
| **`SHIPPED`** (Đang giao hàng) | **Sky / Azure Blue** | `bg-gradient-to-b from-sky-50 to-sky-100/80 border-t-white border-b-sky-300/80 border-x-sky-200/70 text-sky-800 shadow-[0_1px_2px_rgba(14,165,233,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]` | `bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]` |
| **`DELIVERED` / `COMPLETED`** (Giao thành công) | **Emerald / Fresh Mint** | `bg-gradient-to-b from-emerald-50 to-emerald-100/80 border-t-white border-b-emerald-300/80 border-x-emerald-200/80 text-emerald-800 shadow-[0_1px_2px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]` | `bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]` |
| **`CANCELLED` / `REFUNDED`** (Đã hủy / Hoàn tiền) | **Rose / Red Coral** | `bg-gradient-to-b from-rose-50 to-red-100/60 border-t-white border-b-red-200 border-x-red-100 text-rose-700 shadow-[0_1px_2px_rgba(244,63,94,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]` | `bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]` |

### 4.2. Xử lý Màu sắc Tương tác & Trạng Thái Chọn (Selection & Interactive Chemistry)
- **Active Order Card**:
  - Khi một item đơn hàng được chọn: áp dụng viền bevel nổi khối mạnh mẽ với đường phân cách cam thương hiệu `#FF4D24` (`border-l-2 border-l-[#FF4D24]`), kết hợp đổ bóng `shadow-[0_8px_24px_-4px_rgba(255,77,36,0.12),inset_0_1px_0_rgba(255,255,255,1)]` và nền `bg-gradient-to-r from-orange-50/40 via-white to-white`.
- **Timeline Step Connection**:
  - **Completed Step**: Icon tròn nền Emerald/Indigo với bóng `shadow-[0_2px_6px_rgba(16,185,129,0.3)]`, thanh nối (connecting line) dạng dải chuyển sắc `from-emerald-400 to-indigo-400`.
  - **Active/Current Step**: Icon tròn có vòng phát sáng Pulse (`ring-4 ring-indigo-100 text-indigo-600 bg-white border-2 border-indigo-600`).
  - **Upcoming Step**: Icon xám Slate nhẹ `bg-slate-100 text-slate-400 border border-slate-200`, thanh nối mờ `bg-slate-200`.

### 4.3. Định dạng Thẻ Hội Viên & Rank Badge
- **Hội viên Horizon (Member)**: Thẻ cam thương hiệu `#FF4D24` (`text-[#FF4D24] bg-gradient-to-b from-rose-50 to-red-100/60`).
- **Hạng Đồng (Bronze)**: Ánh đồng đất `text-orange-900 bg-gradient-to-b from-orange-50 to-amber-100/70`.
- **Hạng Bạc (Silver)**: Ánh kim loại Slate mờ `text-slate-700 bg-gradient-to-b from-slate-50 to-slate-100/80`.
- **Hạng Vàng (Gold)**: Vàng kim sang trọng `text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100/80`.
- **Hạng Bạch Kim (Platinum/Diamond)**: Xanh băng ánh lam `text-sky-700 bg-gradient-to-b from-sky-50 to-sky-100/80`.
