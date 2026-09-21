# Task Breakdown: Loại Bỏ Mock UI & Đồng Bộ Chuẩn Endpoints Tại `/m`

- [x] Task 1: Cập nhật và kiểm thử Endpoint GraphQL `myOrdersList` trong `server.ts`
  - Acceptance: Schema `myOrdersList` cho phép `status` là optional. Test bằng curl trả về 200 OK và danh sách đơn hàng.
  - Verify: Chạy lệnh `curl -s -X POST http://localhost:3000/graphql` kiểm tra trả về data chuẩn.
  - Files: `server.ts`

- [x] Task 2: Loại bỏ Auto-hide Navbar đối với tuyến `/m` trong `src/components/Navbar.tsx`
  - Acceptance: Tuyến `/m` (ProfilePage) không kích hoạt `isAutoHideMode`, Navbar hiển thị cố định rõ ràng.
  - Verify: Kiểm tra biến `isAccountPage` / `isAutoHideMode` trong `Navbar.tsx`.
  - Files: `src/components/Navbar.tsx`

- [x] Task 3: Loại bỏ hoàn toàn Mock Seeding và chuẩn hóa luồng tải dữ liệu thật trong `ProfilePage.tsx`
  - Acceptance: Xóa bỏ `SEED_VERSION_KEY`, `needsReSeed`, và mảng hardcoded mock orders. Kết nối trực tiếp `syncOrdersFromGraphQL`.
  - Verify: Kiểm tra `ProfilePage.tsx` không còn dữ liệu fake `HZ-7711-R`.
  - Files: `src/components/ProfilePage.tsx`

- [x] Task 4: Đồng bộ Bảng màu Tag (Card Order) và Status Tree (Timeline) theo `orderStatusTheme.ts`
  - Acceptance: Màu sắc trạng thái trên card đơn hàng và các nốt timeline phản ánh chuẩn xác màu Amber / Indigo / Sky / Emerald / Rose.
  - Verify: Rà soát visual mapping trong card list và `displayedSteps.map`.
  - Files: `src/components/ProfilePage.tsx`

- [x] Task 5: Kiểm tra Typecheck & Nghiệm thu toàn diện
  - Acceptance: `npx tsc --noEmit` hoàn thành không lỗi. Các yêu cầu trong prompt được thỏa mãn trọn vẹn.
  - Verify: Chạy `npx tsc --noEmit` và kiểm tra giao diện qua server.
  - Files: `src/components/ProfilePage.tsx`, `src/components/Navbar.tsx`, `server.ts`
