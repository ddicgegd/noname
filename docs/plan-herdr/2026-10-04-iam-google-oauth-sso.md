# IAM Google OAuth2 SSO Implementation Plan

## Wave 1: Tích hợp luồng Google SSO vào #login, #register và Tiếp nhận Callback

### Task 1: Client Google SSO Trigger và Xử lý Callback Ticket
- Pair: worker-1 <-> censor-1
- Scope: Standard
- Target Service: Frontend Horizon Mobile
- Files:
  - Modify: `src/services/authService.ts`
  - Modify: `src/components/RegisterPage.tsx`
  - Modify: `src/App.tsx`
  - Modify: `src/components/EmailActionResponsePage.tsx`
- Interfaces:
  - Consumes:
    - `GET /api/auth/oauth2/authorize/google` (Redirect đến Google Accounts)
    - `POST /api/auth/oauth2/token` với body `{"ticket": "..."}` trả về `OAuth2TokenResponse`
  - Produces:
    - Gắn `window.location.href = backendUrl + "/api/auth/oauth2/authorize/google"` khi click Google ở `#login` và `#register`.
    - Trạm tiếp nhận URL `/auth/callback?ticket=...` tại `App.tsx` & `EmailActionResponsePage.tsx`.
    - Tự động hoán đổi ticket qua `exchangeOAuth2Ticket(ticket)`, lưu session và redirect người dùng.
- Acceptance Criteria (TDD):
  - 1. `authService.ts` cung cấp hàm `exchangeOAuth2Ticket(ticket: string)` gọi endpoint `POST /api/auth/oauth2/token`.
  - 2. `RegisterPage.tsx` kích hoạt redirect sang `/api/auth/oauth2/authorize/google` khi nhấn nút Google ở cả `#login` và `#register`.
  - 3. `App.tsx` định tuyến chính xác URL `/auth/callback?ticket=...` vào `EmailActionResponsePage`, không redirect sang 404.
  - 4. `EmailActionResponsePage.tsx` nhận diện ticket, thực hiện silent token exchange, hiển thị trạng thái loading chuyển tiếp và cập nhật session.
  - 5. Trạng thái lỗi (ticket hết hạn hoặc không hợp lệ) hiển thị thông báo lỗi rõ ràng và nút quay về `#login`.
  - 6. Chạy `npm run lint` (`tsc --noEmit`) thành công 100% không có lỗi type.
