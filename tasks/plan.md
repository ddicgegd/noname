# Implementation Plan: Order GraphQL Integration & Color System at `/m`

## Overview
Kế hoạch triển khai tích hợp giao thức GraphQL Gateway cho phân hệ Quản lý Đơn hàng (Order Management) và hệ thống mã màu nhận diện trạng thái (Semantic Color System) trực tiếp vào giao diện Cổng hội viên `/m` (`ProfilePage`). Kế hoạch bám sát tài liệu đặc tả [docs/ORDER_GRAPHQL_API.md](docs/ORDER_GRAPHQL_API.md) và các quy tắc anti-slop, design-system của Horizon.

## Architecture Decisions
1. **Hybrid Data Strategy (Cache-First + Network Sync)**: Khởi tạo danh sách đơn hàng ngay lập tức từ local cache (0ms lag), song song gọi GraphQL query `myOrdersList` qua `/graphql` để cập nhật dữ liệu mới nhất từ server.
2. **Master-Detail Flow**: Danh sách bên trái fetch tóm tắt (`contents`), khi chọn đơn hàng sẽ nạp chi tiết từ `myOrderDetail` hoặc cache chi tiết để render Timeline & Hóa đơn.
3. **Horizon Semantic Color Engine**: Chuẩn hóa màu sắc trạng thái (Amber cho Chờ thanh toán, Indigo cho Đang xử lý, Sky cho Đang giao, Emerald cho Đã hoàn tất, Rose cho Đã hủy/Hoàn tiền) kết hợp hiệu ứng Bevel 3D Glassmorphism.
4. **Resilient Offline & Guest Fallback**: Tự động fallback dữ liệu mẫu đồng bộ 100% với DTO nếu gateway chưa kết nối backend thật hoặc người dùng ở trạng thái Guest.

## Task List

### Phase 1: Foundation & GraphQL Client Services
- [ ] **Task 1**: Chuẩn hóa & Mở rộng Service GraphQL Order (`src/services/orderService.ts`)
- [ ] **Task 2**: Xây dựng Cache Adapter & DTO Normalizer cho phân hệ Order

### Checkpoint: Foundation
- [ ] `orderService.ts` thực hiện thành công query `myOrdersList` và `myOrderDetail` qua `/graphql`.
- [ ] TypeScript build & lint sạch (`npm run lint` hoặc `tsc --noEmit`).

### Phase 2: UI Color Engine & Bevel Styling
- [ ] **Task 3**: Xây dựng Helper Bảng mã màu ngữ nghĩa (Semantic Color Tokens Matrix)
- [ ] **Task 4**: Tạo Status Filter Pills & Nâng cấp Timeline Tracking Visuals

### Checkpoint: Color & Visuals
- [ ] Các thẻ trạng thái, chấm tín hiệu (status dot) và thanh timeline hiển thị đúng bộ màu ngữ nghĩa và hiệu ứng kính mờ (Bevel Glassmorphism).

### Phase 3: Dynamic Data Integration at `/m` (ProfilePage)
- [ ] **Task 5**: Tích hợp luồng dữ liệu GraphQL Order vào `src/components/ProfilePage.tsx`
- [ ] **Task 6**: Thiết lập Smart Interval Polling & Đồng bộ hành trình đơn hàng Realtime

### Checkpoint: Complete & Verification
- [ ] Route `/m` tải dữ liệu đơn hàng mượt mà, hỗ trợ lọc theo tab trạng thái.
- [ ] Khi bấm vào đơn hàng, Timeline chi tiết cập nhật chính xác theo DTO GraphQL.
- [ ] Dev server hoạt động ổn định không lỗi console runtime.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Backend Spring Boot offline hoặc chưa có token auth | Medium | Tự động fallback về mock store có schema đồng bộ 100% với GraphQL DTO |
| Layout vỡ trên màn hình nhỏ hoặc mobile | High | Áp dụng cấu trúc Responsive Grid + Flex cuộn mượt mà, kiểm tra breakpoint `md` và `lg` |
| Quá nhiều query gây giật lag khi chuyển tab | Low | Áp dụng bộ nhớ đệm (Cache-first) theo key `status-page` trong memory |

## Open Questions
- Không có câu hỏi nghẽn; toàn bộ DTO và quy tắc UI đã được đặc tả chi tiết tại [docs/ORDER_GRAPHQL_API.md](docs/ORDER_GRAPHQL_API.md).
