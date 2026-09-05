# BÁO CÁO KHẢO SÁT KIẾN TRÚC BACKEND, API PROXY, MOCK DATA VÀ HEALTH CHECK

> **Dự án:** `/home/ddicgegd/Projects/noname`  
> **Người thực hiện:** Explorer (Subagent Survey Backend)  
> **Ngày thực hiện:** 2026-09-04  
> **Mục tiêu:** Khảo sát hiện trạng API routes, proxying, mock fallback, health check, build setup và đề xuất kiến trúc tích hợp hệ thống Core Banking & Financial Ledger (Apache Fineract) theo `ORIGINAL_REQUEST.md` và `FINERACT_DESIGN_SPEC.md`.

---

## 1. TỔNG QUAN HIỆN TRẠNG KIẾN TRÚC & HẠ TẦNG DỰ ÁN

### 1.1. Bản chất Stack công nghệ (Phát hiện cốt lõi)
Mặc dù câu hỏi khảo sát ban đầu đặt giả định dự án có thể là Next.js (`src/app/api/...`), **kết quả kiểm tra thực tế khẳng định dự án KHÔNG DÙNG Next.js**.

- **Frontend:** React 19 (`react@^19.0.1`, `react-dom@^19.0.1`) Single Page Application (SPA) xây dựng trên nền **Vite 6** (`vite@^6.2.3`).
- **Styling & UI:** Tailwind CSS v4 (`@tailwindcss/vite@^4.1.14`), Motion (`motion@^12.23.24`), Radix/Base-UI primitives (`@base-ui/react`), Lucide React (`lucide-react@^0.546.0`), Recharts (`recharts@^3.9.2`), Shadcn UI.
- **Backend & Web Server:** Máy chủ tùy chỉnh chạy **Express 4** (`express@^4.21.2`, tệp nguồn `server.ts`).
- **Data Protocols:** Hỗ trợ song song REST API và GraphQL Gateway (`graphql@^16.14.2`, `graphql-http@^1.22.4`).
- **Runtime Execution:**
  - Ở môi trường Dev (`npm run dev`): Khởi chạy qua `tsx server.ts`. Express nhúng Vite dưới dạng middleware (`createViteServer({ server: { middlewareMode: true }, appType: "spa" })`).
  - Ở môi trường Prod (`npm run build && npm start`): Vite đóng gói SPA vào thư mục `dist/`, esbuild bundle `server.ts` thành `dist/server.cjs`. Máy chủ Express phục vụ tĩnh `dist/` kèm fallback `index.html`.

### 1.2. Cấu hình Package & Scripts (`package.json`)
```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "prestart": "npm run build",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "NODE_ENV=production node dist/server.cjs",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  }
}
```

---

## 2. KHẢO SÁT CHI TIẾT ENDPOINTS VÀ API PROXYING

### 2.1. Điểm cuối Health Check (`/api/health`)
- **Tệp nguồn:** `server.ts` (Dòng 33–35)
- **Đoạn mã triển khai:**
  ```typescript
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy and running" });
  });
  ```
- **Hành vi & Phản hồi:** Trả về JSON `{ "status": "ok", "message": "Server is healthy and running" }` với HTTP Status 200 OK.
- **Kiểm chứng thực tế:** Lệnh `curl -s http://localhost:3000/api/health` thực thi trả về ngay kết quả:
  ```json
  {"status":"ok","message":"Server is healthy and running"}
  ```
- **Yêu cầu nghiêm ngặt từ AGENTS.md:** Mọi tác vụ trước khi kết thúc turn đều bắt buộc đảm bảo dev server khởi động trên cổng 3000 và `curl -s http://localhost:3000/api/health` trả về status `"ok"`.

### 2.2. Điểm cuối API Proxy đa năng (`/api/proxy`)
- **Tệp nguồn:** `server.ts` (Dòng 1580–1669)
- **Cơ chế hoạt động:**
  1. Nhận URL đích từ header `x-target-url` hoặc query parameter `?url=...`.
  2. Sao chép và lọc các headers nguy hiểm gây xung đột HTTP (loại bỏ `host`, `connection`, `content-length`, `accept-encoding`, `origin`, `referer`).
  3. Đính kèm body request nếu method là `POST`, `PUT`, `PATCH`, `DELETE`.
  4. Thực hiện `fetch(targetUrl, { method, headers, body })` từ phía Node.js server. Cơ chế này loại bỏ hoàn toàn hạn chế Browser CORS và Mixed-Content (HTTP vs HTTPS).
  5. Thiết lập các header CORS phản hồi (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: *`, `Access-Control-Allow-Methods: *`).
  6. Trả lại status code và payload từ target response. Nếu không thể kết nối tới target (ví dụ: máy chủ backend tắt), trả về HTTP 502 Bad Gateway:
     ```json
     {
       "error": "Bad Gateway",
       "message": "Máy chủ Node.js không thể kết nối tới URL: <targetUrl>...",
       "details": "<error.message>"
     }
     ```
- **Xử lý CORS Preflight:** `app.options("/api/proxy")` trả về HTTP 204 No Content.

### 2.3. Các phương thức gọi API từ phía Client
Trong thư mục `src/`, các luồng gọi dữ liệu được tổ chức theo 3 hướng:
1. **Qua hàm trợ giúp tập trung `src/lib/api.ts` (`apiRequest`, `unifiedFetch`):**
   - `getApiBaseUrl()` đọc từ `import.meta.env.VITE_API_BASE_URL` (mặc định: `http://localhost:8080`).
   - `unifiedFetch` tự động đính kèm `Authorization: Bearer <accessToken>`.
   - Có cơ chế tự động đánh chặn HTTP 401 và gọi `executeRefreshToken()` với mutex singleton promise.
2. **Gọi trực tiếp qua `/api/proxy`:**
   - Được áp dụng trong `src/components/AuthReportDashboard.tsx` (Dòng 532):
     ```typescript
     const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/auth/me`;
     const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
     const res = await fetch(proxyUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
     ```
3. **Gọi qua GraphQL Gateway (`/graphql`):**
   - Sử dụng cho giỏ hàng, thông tin tài khoản, danh mục sản phẩm và đơn hàng (`src/services/orderService.ts`, `src/services/merchandiseService.ts`, `src/services/cartService.ts`).

---

## 3. KHẢO SÁT CƠ CHẾ MOCK FALLBACK HIỆN TẠI

### 3.1. Server-Side Mock Fallback (`server.ts`)
Bên trong hàm `callApiGateway(apiPath, options, context)` của `server.ts` (Dòng 245–301):
- Thử kết nối tới Backend thực (`http://localhost:8080`).
- Nếu kết nối thất bại (backend sập hoặc chưa bật), hàm bắt lỗi mạng và tự động chuyển sang `mockRestApiCall(apiPath, method, body, queryParams)` (Dòng 106–242).
- Cung cấp dữ liệu giả lập cho `/api/auth/me`, `/api/auth/recover-account`, `/api/auth/validate-reset-token`, `/api/orders`, `/api/merchandise`.

### 3.2. Client-Side Mock Fallback trong `/auth-report`
Tại `src/components/AuthReportDashboard.tsx`:
- Quản lý nhật ký kiểm toán (Audit Logs) và trạng thái Redis session qua `localStorage` (sử dụng các key trong `src/lib/storageKeys.ts`).
- Nếu chưa có dữ liệu, hàm `initMockLogs()` tự động sinh dữ liệu mẫu để giao diện không bị rỗng.
- Cung cấp công cụ giải mã JWT tại chỗ và chẩn đoán kết nối mạng/CORS.

---

## 4. PHÂN TÍCH RÀNG BUỘC KỸ THUẬT APACHE FINERACT (THEO `FINERACT_DESIGN_SPEC.md`)

Tài liệu `FINERACT_DESIGN_SPEC.md` xác lập các quy chuẩn cốt lõi:

| Phân hệ | Endpoint ERP / Upstream Fineract | Bất biến & Quy tắc nghiệp vụ bắt buộc |
| :--- | :--- | :--- |
| **Clients** | `GET /api/v1/erp/clients`<br>`GET /api/v1/erp/clients/{id}`<br>`POST /api/v1/erp/clients` | - Admin xem toàn bộ (`GET /clients`), Customer xem theo chính mình (`GET /clients?externalId={userId}`).<br>- Payload kích hoạt: `dateFormat: "dd MMMM yyyy"`, `locale: "en"`, `officeId: 1`, `legalFormId: 1`. |
| **Loan Products** | `GET /api/v1/erp/loan-products`<br>(Upstream: `GET /loanproducts`) | Danh mục gói tín dụng (ERP-LN01: 1M - 50M VND, lãi suất định kỳ, số kỳ trả góp). |
| **Loan State Machine** | `GET /api/v1/erp/loans`<br>`POST /api/v1/erp/loans`<br>`POST /loans/{id}/approve`<br>`POST /loans/{id}/disburse`<br>`POST /loans/{id}/reject`<br>`POST /loans/{id}/withdraw`<br>`POST /loans/{id}/repayments` | - Trạng thái: `100: PENDING_APPROVAL` → `200: APPROVED` → `300: ACTIVE` → `600: OBLIGATIONS_MET` (hoặc `500: REJECTED`, `400: WITHDRAWN`).<br>- Không được disburse khi chưa approve. Không được repay khi chưa active.<br>- Bảng lịch trả nợ `repaymentSchedule` gồm các kỳ; khi tất toán số dư nợ về 0 chuyển sang `600`. |
| **General Ledger** | `GET /api/v1/erp/journalentries`<br>`POST /api/v1/erp/journalentries` | - Bất biến kế toán kép: $\sum \text{Debit} \equiv \sum \text{Credit}$. Khác nhau lập tức chặn trước khi gửi.<br>- Ma trận GL Account Resolver:<br>  + COD Sale: Nợ Cash (1), Có Sales Revenue (2)<br>  + Non-COD Sale: Nợ Bank (4), Có Sales Revenue (2)<br>  + COD Refund: Nợ Sales Returns (3), Có Cash (1)<br>  + Non-COD Refund: Nợ Sales Returns (3), Có Bank (4) |
| **Kafka EDA Events** | Lắng nghe `order-topic`<br>Consumer Group: `fineract-order-group` | - `ORDER_STATUS_CHANGED` + `newStatus: "PROCESSING"` → Tạo bút toán `SALE-{orderNumber}`.<br>- `ORDER_STATUS_CHANGED` + `newStatus: "REFUNDED"` → Tạo bút toán `REFUND-{orderNumber}`.<br>- Các status khác (`DELIVERED`, `CANCELLED`, `COMPLETED`) bị bỏ qua. |
| **Error Format** | HTTP 4xx/5xx Exception | Trích xuất JSON `fineractResponse` chứa: `developerMessage`, `defaultUserMessage`, `userMessageGlobalisationCode`, `parameterName`. |

---

## 5. ĐỀ XUẤT KIẾN TRÚC TÍCH HỢP CHO DỰ ÁN

Để đáp ứng đầy đủ yêu cầu R1–R6 của `ORIGINAL_REQUEST.md`, không phụ thuộc bắt buộc vào việc máy chủ Fineract cục bộ (`https://localhost:8443`) phải đang chạy, kiến trúc tối ưu nhất là **Hybrid Client-Side Service + Stateful In-Memory/LocalStorage Mock Engine + Live Proxy Route**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        /auth-report (React Page Component)                             │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    Header: [Live API Proxy  ⮂  Mock Data Fallback] Toggle        │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │                                            │
│                                           ▼                                            │
│                             [src/services/fineractService.ts]                          │
│                                           │                                            │
│                     ┌─────────────────────┴─────────────────────┐                      │
│                     │ (Mode == "live")                          │ (Mode == "mock")     │
│                     ▼                                           ▼                      │
│          [src/lib/api.ts /proxy]                    [src/lib/fineractMockStore.ts]     │
│                     │                                           │                      │
│    (Node.js Express Server /api/proxy)             - In-memory & LocalStorage Store    │
│                     │                              - State Machine (100->200->300->600)│
│                     ▼                              - GL Double-Entry Invariant Guard   │
│     Backend ERP (http://localhost:8080)            - GL Account Resolver Matrix        │
│                     OR                             - Kafka Event Simulator Engine      │
│     Fineract Core (https://localhost:8443)         - Stateful CRUD Operations          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1. Cấu trúc mô-đun đề xuất
1. **`src/types/fineract.ts`**:
   - Định nghĩa toàn bộ interfaces & enums: `FineractClient`, `LoanProduct`, `LoanAccount`, `LoanRepaymentPeriod`, `JournalEntry`, `GlAccountResolver`, `KafkaOrderEvent`, `FineractErrorResponse`.
2. **`src/lib/fineractMockStore.ts`**:
   - Quản lý toàn bộ state mô phỏng: danh sách khách hàng, danh mục sản phẩm vay, hồ sơ khoản vay với lịch trả nợ động, sổ cái hạch toán kép, lịch sử sự kiện Kafka.
   - Lưu trữ đồng bộ vào `localStorage` (`STORAGE_KEYS.FINERACT_MOCK_STATE`) để duy trì dữ liệu khi F5 refresh trang.
   - Chứa logic state machine chuyển trạng thái vay (Approve, Disburse, Reject, Withdraw, Repay).
   - Chứa logic hạch toán tự động khi simulator Kafka phát sinh sự kiện `PROCESSING` hoặc `REFUNDED`.
3. **`src/lib/fineractErrorExtractor.ts`**:
   - Bộ trích xuất và chuẩn hóa lỗi chuyên biệt cho Fineract.
   - Giải mã chuỗi JSON `fineractResponse` để lấy `developerMessage`, `defaultUserMessage`, `userMessageGlobalisationCode` hiển thị lên Toast và modal Error Inspector.
4. **`src/services/fineractService.ts`**:
   - Cung cấp API thống nhất cho UI:
     - `getClients(role, userId)`
     - `getClientDetail(id)`
     - `createClient(data)`
     - `getLoanProducts()`
     - `getLoans()`
     - `getLoanDetail(id)`
     - `createLoan(data)`
     - `approveLoan(id, date)`
     - `disburseLoan(id, date)`
     - `rejectLoan(id, date)`
     - `withdrawLoan(id, date)`
     - `repayLoan(id, amount, date)`
     - `getJournalEntries()`
     - `createJournalEntry(data)`
     - `simulateKafkaEvent(event)`
     - `getSystemMetrics()`
   - Tự động kiểm tra cờ `isLiveMode` (hoặc cấu hình) để quyết định gọi qua `/api/proxy` hay gọi `fineractMockStore`.
5. **Giao diện người dùng trong `src/components/AuthReportDashboard.tsx` & `src/components/fineract/`**:
   - Thêm Tab mới `"fineract"` vào danh sách tab của `AuthReportDashboard.tsx` (`activeTab === "fineract"`).
   - Các Sub-view bên trong:
     - **Overview (`FineractOverview.tsx`)**: 4 KPI cards (Total Outstanding Principal, Cash & Bank Balances, Client Count, Gateway & Kafka Health), đồ thị phân bổ dư nợ, toggle Live/Mock.
     - **Clients (`FineractClients.tsx`)**: Bảng khách hàng, lọc Admin vs Customer, Drawer chi tiết khách hàng, Modal tạo khách hàng mới kèm form validation.
     - **Loans & Products (`FineractLoans.tsx`)**: Danh mục gói vay, danh sách khoản vay kèm State Badges, Modal chi tiết kèm interactive Repayment Schedule, các nút chuyển trạng thái (Approve, Disburse, Repay...) kèm modal xác nhận và date picker.
     - **General Ledger (`FineractLedger.tsx`)**: Bảng bút toán kế toán kép, sơ đồ GL Account Resolver Matrix, form ghi bút toán thủ công với kiểm tra thời gian thực $\sum \text{Debit} == \sum \text{Credit}$ (khóa nút Submit nếu không cân bằng).
     - **Kafka EDA Monitor (`FineractKafkaMonitor.tsx`)**: Bảng hiển thị luồng sự kiện `order-topic`, bộ phát giả lập sự kiện (phát event `PROCESSING` sinh `SALE-{orderId}` hoặc `REFUNDED` sinh `REFUND-{orderId}`), hiển thị ngay sự thay đổi trong sổ cái.
     - **Toast Feedback & Error Inspector**: Toast thông báo thành công/thất bại, modal hiển thị chi tiết JSON khi có lỗi từ Fineract.

---

## 6. KIỂM THỬ VÀ ĐÁNH GIÁ ĐỘ TƯƠNG THÍCH BUILD

1. **Kiểm tra lệnh Build (`npm run build`):**
   - Lệnh `npm run build` thực hiện `vite build` và `esbuild server.ts`.
   - Kết quả: **Thành công 100%** trong ~4.2 giây với 0 lỗi cú pháp hoặc đóng gói.
2. **Kiểm tra TypeScript (`npm run lint` - `tsc --noEmit`):**
   - Phát hiện 3 cảnh báo kiểu dữ liệu cũ trong `src/components/OrderPage.tsx` (`availableColors`, `availableSizes`, `discount` trên `CartItem`). Những cảnh báo này nằm ở component bán hàng hiện hữu, không ảnh hưởng đến build của Vite và không liên quan đến phân hệ `/auth-report` hay backend. Khi phát triển phân hệ Fineract, toàn bộ kiểu dữ liệu mới sẽ được type-check chặt chẽ để không phát sinh bất kỳ lỗi mới nào.
3. **Kiểm tra Health Check (`/api/health`):**
   - Đã kiểm tra qua `curl -s http://localhost:3000/api/health`, máy chủ đang phản hồi chuẩn `{ "status": "ok", "message": "Server is healthy and running" }`.

---

## 7. KẾT LUẬN & ĐỀ NGHỊ HÀNH ĐỘNG TIẾP THEO

1. Dự án sử dụng Vite + Express (không phải Next.js), do đó kiến trúc proxy `/api/proxy` và mock store client-side là giải pháp sạch sẽ, tốc độ cao và hoàn toàn độc lập với các dịch vụ bên thứ ba.
2. Thiết kế Mock Store toàn diện với State Machine chuẩn Fineract sẽ giúp UI dashboard tại `/auth-report` hoạt động đầy đủ tính năng ngay cả khi không có kết nối internet hoặc backend Spring Boot/Fineract chưa khởi động.
3. Chuyển giao đầy đủ tài liệu này và `handoff.md` cho orchestrator và các agent triển khai tiếp theo.
