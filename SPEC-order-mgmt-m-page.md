# Spec: Loại Bỏ Mock UI & Đồng Bộ Chuẩn Endpoint Đơn Hàng Tại Tuyến `/m`

## Objective
Loại bỏ hoàn toàn phần Mock UI và cơ chế tự sinh dữ liệu giả (fake order seeding) trong trang Quản lý tài khoản & Đơn hàng `/m` (`ProfilePage.tsx`). Đồng bộ hệ thống màu sắc nhận diện trạng thái (Semantic Color System) cho Card Order và Status Tree Timeline dựa theo các commit gần nhất (`src/lib/orderStatusTheme.ts`), khôi phục hiển thị Navbar chuẩn (không còn ẩn tại `/m`), và kết nối trực tiếp với backend GraphQL Gateway / REST API đã qua kiểm thử.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React, Morphicons
- **Backend & Gateway**: Node.js `server.ts` (Express + GraphQL Gateway over Oracle DB / Spring Boot microservices)
- **Data Protocols**: GraphQL (`/graphql`) query `myOrdersList`, `myOrderDetail` và REST fallback (`/api/orders/my-orders/...`)

## Commands
- Dev Server: `npm run dev`
- Type Check & Lint: `npx tsc --noEmit`
- Test Endpoints: `curl -s -X POST http://localhost:3000/graphql -H "Content-Type: application/json" -d '{"query":"..."}'`

## Project Structure
- `src/components/ProfilePage.tsx`: Giao diện Trung tâm hội viên & Quản lý đơn hàng tại `/m`
- `src/components/Navbar.tsx`: Thanh điều hướng toàn cục (loại bỏ auto-hide tại `/m`)
- `src/services/orderService.ts`: Service truy vấn GraphQL `myOrdersList`, `myOrderDetail`, chuẩn hóa DTO
- `src/lib/orderStatusTheme.ts`: Bảng màu chuẩn Semantic Color System cho từng trạng thái đơn hàng
- `server.ts`: Backend Express + GraphQL Gateway

## Code Style & Architecture
- Không hardcode mảng dữ liệu mẫu `HZ-7711-R`, `HZ-5520-V`,... vào `localStorage` hay state component.
- Trạng thái tải: hiển thị Skeleton/Shimmer loader và Empty State mượt mà khi người dùng chưa có đơn hàng.
- Bảng màu thống nhất giữa Card Order và Timeline Tracker (Status Tree):
  - `WAITING_PAYMENT` / `PENDING`: Amber (`#F59E0B`)
  - `PROCESSING` / `CONFIRMED`: Indigo (`#6366F1`)
  - `SHIPPED`: Sky (`#0EA5E9`)
  - `DELIVERED` / `COMPLETED`: Emerald (`#10B981`)
  - `CANCELLED` / `REFUNDED`: Rose (`#F43F5E`)
- Navbar tại `/m` (không có modal đè) luôn hiển thị cố định (`isAutoHideMode` loại trừ `/m`).

## Testing Strategy
1. **Endpoint Verification**: Chạy script/curl kiểm tra GraphQL query `myOrdersList` với và không có biến `status` để đảm bảo gateway trả về 200 OK và đúng DTO.
2. **UI & State Verification**: Kiểm tra `/m` khi không có đơn hàng (hiển thị empty state chuẩn bevel), khi có đơn hàng (card render đúng màu sắc và status tree mapping đúng timeline).
3. **Navbar Visibility**: Kiểm tra cuộn trang và chuyển tab tại `/m`, xác nhận Navbar giữ nguyên vị trí, không bị ẩn đột ngột.

## Boundaries
- **Always do**:
  - Test endpoint trả về data mong muốn trước khi ghép nối vào UI.
  - Sử dụng bảng mã màu chuẩn từ `src/lib/orderStatusTheme.ts`.
  - Giữ nguyên hiệu ứng Bevel 3D Glassmorphism và layout hierarchy của trang.
- **Never do**:
  - Không tự ý sinh lại dữ liệu mock `seedOrders` vào `localStorage`.
  - Không khởi động lại server dev thủ công gây đứt socket RPC.
  - Không làm ảnh hưởng tới các tab khác ngoài phạm vi `/m` (như `/p`, `/o`, `/a`).

## Success Criteria
1. Đã xóa bỏ toàn bộ logic seed mock data `horizon_orders_seed_v5` và mảng mock orders trong `ProfilePage.tsx`.
2. `server.ts` hỗ trợ query `myOrdersList` không bắt buộc truyền `status` (cho phép lọc "Tất cả" - ALL).
3. Endpoint GraphQL `myOrdersList` và `myOrderDetail` được test thành công và ghép nối ổn định vào `ProfilePage.tsx`.
4. Màu sắc tag trạng thái trên Order Card và từng nốt trên Status Tree Timeline đồng bộ 100% theo `orderStatusTheme.ts`.
5. Navbar tại `/m` hiển thị liên tục, không bị ẩn khi xem profile hay đơn hàng.
6. Khi chưa có đơn hàng, hiển thị Empty State lịch sự, tinh tế, không crash.
