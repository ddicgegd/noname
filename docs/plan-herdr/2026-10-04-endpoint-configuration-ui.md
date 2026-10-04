# Kế Hoạch Triển Khai: Cấu Hình Endpoint API Gateway Vào Giao Diện (HMAD Parallel Waves)

> **Mã kế hoạch**: `docs/plan-herdr/2026-10-04-endpoint-configuration-ui.md`  
> **Tài liệu đặc tả nguồn**: `docs/features/USER_UPDATE_FEATURES_SPEC.md` (Mục 1.1, 2, 4.2), `docs/DEVICE_SESSIONS_API_AND_UI_SPEC.md`  
> **Phân hệ thực thi**: Frontend Horizon Mobile (`src/lib/api.ts`, `src/lib/storageKeys.ts`, `src/components/ProfilePage.tsx`)  
> **Mô hình điều phối**: Herdr 1-1 Worker-Censor Pairing (Supervisor Hub-and-Spoke)

---

## TỔNG QUAN YÊU CẦU NGHIỆP VỤ (EXECUTIVE SUMMARY)

1. **Thực trạng**:
   - Hiện tại `getApiBaseUrl()` trong `src/lib/api.ts` bị cố định đọc từ biến môi trường `VITE_API_BASE_URL` hoặc mặc định `http://localhost:8080`.
   - Hàm `sanitizeLegacyStorageConfigurations()` đang tự động xóa các key cấu hình cũ để chống tunnel rác, nhưng chưa có cơ chế lưu và phân giải Endpoint tùy chỉnh một cách an toàn và chủ động.
   - Tab 5 "Thiết lập & Phiên" trong `ProfilePage.tsx` mới chỉ hiển thị danh sách phiên thiết bị (Active Sessions) và thanh telemetry tĩnh, chưa tích hợp khối quản lý API Gateway, Ping Test đo độ trễ mạng và công cụ chuyển đổi nhanh Endpoint (URL Switcher) theo đặc tả Mục 4.2 của `USER_UPDATE_FEATURES_SPEC.md`.

2. **Mục tiêu hoàn thiện**:
   - Mở rộng tầng lõi `src/lib/api.ts` với Dynamic Endpoint Resolver: hỗ trợ đọc/ghi/reset endpoint tùy chỉnh, kèm hàm `pingEndpoint()` đo lường độ trễ mạng thực tế (RTT ms).
   - Tích hợp khối giao diện **Cấu hình Hệ thống & API Gateway** nổi bật tại đầu Tab 5 ("Thiết lập & Phiên") của `ProfilePage.tsx` theo ngôn ngữ thiết kế Bevel Glassmorphism sang trọng, hỗ trợ kiểm tra ping thời gian thực, nút chuyển đổi nhanh (Preset: Local 8080, Express 3000), nhập URL tùy chỉnh và khôi phục mặc định.

---

## Wave 1: Tầng Lõi Phân Giải Dynamic Endpoint & Chẩn Đoán Ping (Core Telemetry)

### Task 1: Mở rộng Dynamic Endpoint Resolver và Bộ Đo Ping API
- Pair: worker-1 <-> censor-1
- Scope: Standard
- Target Service: Frontend Core Library (`src/lib`)
- Files:
  - Modify: `src/lib/storageKeys.ts`
  - Modify: `src/lib/api.ts`
- Interfaces:
  - Consumes:
    - `import.meta.env.VITE_API_BASE_URL`
    - `localStorage` với key `STORAGE_KEYS.CUSTOM_API_BASE_URL`
    - Endpoint probe: `HEAD` / `GET` tới `/api/health` hoặc fallback endpoint
  - Produces:
    - `STORAGE_KEYS.CUSTOM_API_BASE_URL = "custom_api_base_url"` trong `storageKeys.ts`.
    - `getApiBaseUrl(): string` (ưu tiên Custom Base URL hợp lệ từ storage, fallback về env hoặc `http://localhost:8080`).
    - `setApiBaseUrl(url: string): void` (validate cấu hình URL hợp lệ, lưu vào storage, kích hoạt `storage` event thông báo toàn hệ thống).
    - `resetApiBaseUrl(): void` (xóa cấu hình tùy chỉnh, hoàn nguyên về URL môi trường mặc định, kích hoạt event đồng bộ).
    - `pingEndpoint(targetUrl?: string): Promise<{ success: boolean; latencyMs: number; status?: number; error?: string }>` (đo RTT thời gian thực với AbortController timeout 4s).
- Acceptance Criteria (TDD):
  - 1. `getApiBaseUrl()` trả về URL hợp lệ, tự động loại bỏ trailing slash (`/`).
  - 2. `setApiBaseUrl(url)` chỉ chấp nhận URL hợp lệ có protocol `http://` hoặc `https://`, ném lỗi rõ ràng nếu URL sai định dạng.
  - 3. `resetApiBaseUrl()` khôi phục chính xác về URL mặc định của hệ thống.
  - 4. `pingEndpoint(url)` trả về kết quả đo đạc độ trễ mạng (`latencyMs`) chính xác, xử lý ngoại lệ graceful khi timeout hoặc network drop.
  - 5. `npm run lint` (`tsc --noEmit`) đạt 100% không có cảnh báo hoặc lỗi type.

---

## Wave 2: Giao Diện Quản Trị Endpoint & Tích Hợp Tab 5 (ProfilePage UI)

(Chỉ kích hoạt sau khi Wave 1 được Censor-1 thẩm định và phê duyệt thông qua)

### Task 2: Xây dựng Khối Cấu Hình API Gateway & Ping Test tại Tab 5 "Thiết lập & Phiên"
- Pair: worker-2 <-> censor-2
- Scope: Standard
- Target Service: Frontend Horizon Mobile (`src/components/ProfilePage.tsx`)
- Files:
  - Modify: `src/components/ProfilePage.tsx`
- Interfaces:
  - Consumes:
    - `getApiBaseUrl`, `setApiBaseUrl`, `resetApiBaseUrl`, `pingEndpoint` từ `src/lib/api.ts`.
    - `useToast` thông báo phản hồi thao tác.
  - Produces:
    - Thẻ điều khiển **API Gateway & Hệ thống Kết nối** đặt trang trọng ở đầu Tab 5, tách biệt hoàn toàn khỏi form hồ sơ cá nhân.
    - Hiển thị URL Endpoint đang hoạt động, giao thức bảo mật `TLS 1.3 / Bearer`, và huy hiệu trạng thái sống (Live Status: Đang kết nối / Mất kết nối / Độ trễ ms).
    - Nút **Kiểm tra ping**: Kích hoạt gửi request thăm dò, hiển thị icon spinner khi đang ping, cập nhật độ trễ thời gian thực và đổi màu chỉ báo (Xanh <100ms, Vàng 100-300ms, Đỏ >300ms/Lỗi).
    - Khung/Drawer **Cấu hình URL Endpoint**:
      + Ô nhập URL với tiền tố biểu tượng kết nối mạng.
      + Bộ phím gợi ý nhanh (1-click Preset): `Spring Boot Local (8080)`, `Express BFF Gateway (3000)`.
      + Phím **Khôi phục mặc định** và **Áp dụng Endpoint mới**.
    - Khi thay đổi Endpoint thành công: cập nhật trạng thái giao diện tức thì, hiển thị Toast thông báo và tự động kích hoạt làm mới danh sách phiên (`loadDeviceSessions`).
- Acceptance Criteria (TDD):
  - 1. Khối Cấu hình Gateway xuất hiện trang trọng ở đầu Tab 5 với đúng phong cách Bevel Glassmorphism và semantic token của Shadcn.
  - 2. Nhấn nút `Kiểm tra ping` phản hồi độ trễ chuẩn xác, không bị block UI.
  - 3. Nhấn vào các Preset (8080, 3000) tự động điền URL tương ứng vào ô cấu hình.
  - 4. Nhập URL hợp lệ và nhấn `Áp dụng` lưu thành công cấu hình, đồng bộ `getApiBaseUrl()`, reload dữ liệu phiên kết nối.
  - 5. Nhập URL sai định dạng hiển thị cảnh báo lỗi trực quan, ngăn chặn lưu URL lỗi.
  - 6. Nhấn `Khôi phục mặc định` đưa URL về trạng thái gốc của hệ thống.
  - 7. Không gây layout shift, không ảnh hưởng đến danh sách phiên bên dưới.
  - 8. Chạy `tsc --noEmit` đạt 0 lỗi.

---

## Wave 3: Thẩm Tra Tích Hợp Hệ Thống & Sign-off (Builder Integration)

(Kích hoạt sau khi toàn bộ Task Wave 1 & Wave 2 đạt trạng thái hoàn tất)

### Task 3: Multi-Service Build Verification & Runtime Health Audit
- Agent: `builder-frontend`
- Scope: Small
- Verification Commands:
  - Typecheck: `npx tsc --noEmit`
  - Hot-reload inspection: Xác nhận Vite HMR cập nhật 0ms không xảy ra runtime error.
  - Endpoint Switcher Smoke Test: Kiểm tra khả năng switch giữa `http://localhost:8080` và `http://localhost:3000`.
- Acceptance Criteria:
  - Toàn bộ source code biên dịch sạch 0 lỗi.
  - Giao diện ProfilePage Tab 5 hoạt động mượt mà, sẵn sàng bàn giao cho người dùng.
