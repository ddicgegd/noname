# TÀI LIỆU ĐẶC TẢ TÍNH NĂNG: CẬP NHẬT HỒ SƠ NGƯỜI DÙNG & TÍCH HỢP CẤU HÌNH ENDPOINT (USER UPDATE FEATURES SPEC)

> **Tài liệu**: `docs/features/USER_UPDATE_FEATURES_SPEC.md`  
> **Phiên bản**: 2.1.0  
> **Mục tiêu**: Đồng bộ toàn diện kiến trúc, hợp đồng API (API Contracts), cơ chế cấu hình Dynamic Endpoint Gateway, quy trình đồng bộ trạng thái Client-State, chức năng Đổi tên đăng nhập chuyển khung trực tiếp (In-Place Frame Morphing), và đặc tả giao diện người dùng (UI/UX) cho chức năng Quản lý & Cập nhật Hồ sơ cá nhân tại `/m`.

---

## 1. TỔNG QUAN TÍNH NĂNG (EXECUTIVE SUMMARY)

Chức năng **Cập nhật Hồ sơ người dùng** (User Profile Update & Identity Management) cho phép người dùng tùy chỉnh thông tin định danh cá nhân, ảnh đại diện (Avatar), ngày sinh, số điện thoại, giới tính, đổi tên đăng nhập (Username) ngay trong cùng khung với hoạt ảnh chuyển khung (In-Place Morphing Animation), đồng thời cung cấp tab chuyên biệt **Thiết lập & Phiên** để quản lý chẩn đoán kết nối API Gateway Endpoint (`http://localhost:8080` / `http://localhost:3000` / Cloud Production).

### 1.1. Các điểm nâng cấp chính trong phiên bản mới

| Thành phần | Phiên bản trước (Legacy) | Phiên bản mới (v2.1 - Hiện tại) |
| :--- | :--- | :--- |
| **API Contract** | Cập nhật cục bộ chỉ lưu vào `localStorage`, chưa gắn kết chặt với Backend `PUT /api/auth/me`. | Tích hợp đầy đủ `PUT /api/auth/me`, `POST /api/auth/me/avatar`, `PUT /api/auth/change-username`, và `GET /api/auth/me`. |
| **Đổi Username trực tiếp** | Bắt buộc chuyển sang tab Bảo mật, gián đoạn luồng chỉnh sửa. | **Đổi tên đăng nhập trực tiếp trong cùng khung** (In-Place Animated Frame Transition), đồng bộ thiết kế, không tạo tag mới. |
| **Cấu hình Endpoint Gateway** | Đặt chung vào form hồ sơ gây chật chội. | **Tách biệt và nâng cấp chuyên sâu vào Tab 5 "Thiết lập & Phiên"** với đầy đủ công cụ Ping Test, chẩn đoán độ trễ, và URL Switcher. |
| **Ảnh đại diện (Avatar)** | Chỉ hiển thị chữ cái đầu tên dạng text tĩnh. | Cho phép **Tải file ảnh (Upload)**, nhập **URL trực tiếp**, xem trước ngay lập tức (Instant Preview). |
| **Kiểm soát thay đổi** | Nút lưu luôn hiển thị một màu không phân biệt trạng thái. | Tự động phát hiện trạng thái sửa đổi (`isProfileDirty`), hỗ trợ nút **Đặt lại** (Reset) và nút **Lưu** xúc giác Bevel. |
| **Định dạng dữ liệu** | Giới tính dùng dropdown chuẩn đơn điệu, thiếu trường ngày sinh. | Bổ sung **Segmented Control** chọn Giới tính và Date Picker Ngày sinh chuẩn ISO 8601. |
| **Kiến trúc Proxy** | REST proxy chỉ có ở `/api/bookmarks` và `/api/orders`. | Mở rộng Express Proxy `/api/auth*` kèm cơ chế Failover Mock thông minh trong `server.ts`. |

---

## 2. KIẾN TRÚC HỆ THỐNG & LUỒNG DỮ LIỆU (SYSTEM ARCHITECTURE)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GIAO DIỆN NGƯỜI DÙNG (/m - PROFILE PAGE)              │
│  • Tab 1: Hồ sơ cá nhân (Avatar, Thông tin định danh, In-Place Rename) │
│  • Tab 5: Thiết lập & Phiên (Endpoint Gateway, Ping Latency, Sessions) │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
            (1) Direct Request              (2) Multipart Upload
             PUT /api/auth/me              POST /api/auth/me/avatar
             PUT /api/auth/change-username           │
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CENTRALIZED API CLIENT (src/lib/api.ts)            │
│  • Dynamic Endpoint Resolver (getApiBaseUrl / setApiBaseUrl)          │
│  • Automatic Token Interceptor (Bearer Token & Auto Refresh on 401)   │
│  • Smart Content-Type Switcher (JSON vs Multipart FormData)            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│  EXPRESS GATEWAY PROXY (server.ts)    │ │ SPRING BOOT BACKEND (8080)   │
│  • app.all("/api/auth*", ...)         │ │ • AuthController             │
│  • Real-time Failover to High-Fidelity│ │ • UserProfile Entity         │
│    In-Memory Mock Store               │ │ • Multipart Image Processor  │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 3. CHI TIẾT API CONTRACTS (BACKEND INTEGRATION)

### 3.1. Cập nhật thông tin hồ sơ (Update Profile)

- **Endpoint**: `PUT /api/auth/me`
- **Quyền truy cập**: **Authenticated** (`Authorization: Bearer <accessToken>`).
- **Headers**: `Content-Type: application/json`
- **Request Body (`UpdateProfileRequest`)**:
  ```json
  {
    "fullName": "Ngô Ngọc Định",
    "phoneNumber": "0971791373",
    "dateOfBirth": "1995-01-01T00:00:00Z",
    "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "gender": "MALE"
  }
  ```
- **Response thành công (`200 OK`)**:
  ```json
  {
    "status": {
      "code": 200,
      "message": "Cập nhật thông tin hồ sơ thành công"
    },
    "data": {
      "id": "1",
      "username": "horizon_admin",
      "email": "admin@horizon.net",
      "fullName": "Ngô Ngọc Định",
      "phoneNumber": "0971791373",
      "dateOfBirth": "1995-01-01T00:00:00Z",
      "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      "gender": "MALE",
      "rank": "GOLD",
      "status": "ACTIVE"
    }
  }
  ```

---

### 3.2. Đổi tên đăng nhập (Change Username - In-Frame Direct Execution)

- **Endpoint**: `PUT /api/auth/change-username`
- **Quyền truy cập**: **Authenticated** (`Authorization: Bearer <accessToken>`).
- **Request Body (`ChangeUsernameRequest`)**:
  ```json
  {
    "newUsername": "dinh_ngo_pro"
  }
  ```
- **Quy tắc kiểm thực (Validation Rules)**:
  - Độ dài: từ 3 đến 50 ký tự.
  - Viết liền, không chứa khoảng trắng (`/\s/.test(val) === false`).
- **Response thành công (`200 OK`)**:
  ```json
  {
    "status": {
      "code": 200,
      "message": "Đổi tên đăng nhập thành công. Vui lòng đăng nhập lại."
    },
    "data": "Đổi tên đăng nhập thành công!"
  }
  ```

---

### 3.3. Tải lên tệp ảnh đại diện (Upload Avatar File)

- **Endpoint**: `POST /api/auth/me/avatar`
- **Quyền truy cập**: **Authenticated** (`Authorization: Bearer <accessToken>`).
- **Headers**: `multipart/form-data` (Boundary do trình duyệt tự động sinh).
- **Request Body**:
  - `file` *(binary, required)*: Tệp ảnh định dạng JPEG, PNG, WEBP; tối đa 5MB.
- **Response thành công (`200 OK`)**:
  ```json
  {
    "status": {
      "code": 200,
      "message": "Cập nhật ảnh đại diện thành công"
    },
    "data": {
      "id": "1",
      "username": "horizon_admin",
      "email": "admin@horizon.net",
      "fullName": "Ngô Ngọc Định",
      "avatarUrl": "http://localhost:8080/api/merchandise/view-image/avatar_1_1727221234.png",
      "rank": "GOLD",
      "status": "ACTIVE"
    }
  }
  ```

---

### 3.4. Lấy thông tin hồ sơ hiện tại (Get My Profile)

- **Endpoint**: `GET /api/auth/me`
- **Quyền truy cập**: **Authenticated** (`Authorization: Bearer <accessToken>`).
- **Response thành công (`200 OK`)**:
  ```json
  {
    "status": {
      "code": 200,
      "message": "Success"
    },
    "data": {
      "id": "1",
      "username": "horizon_admin",
      "email": "admin@horizon.net",
      "fullName": "Ngô Ngọc Định",
      "phoneNumber": "0971791373",
      "dateOfBirth": "1995-01-01T00:00:00Z",
      "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      "gender": "MALE",
      "rank": "GOLD",
      "status": "ACTIVE"
    }
  }
  ```

---

## 4. ĐẶC TẢ GIAO DIỆN NGƯỜI DÙNG & HOẠT ẢNH CHUYỂN KHUNG (UI/UX & ANIMATION)

### 4.1. Đổi tên đăng nhập In-Place Morphing (Tab 1 - Hồ sơ cá nhân)
- **Trạng thái Mặc định (Frame A - Readonly View)**:
  - Hiển thị `@username` với icon `User`, nút bấm tinh gọn `Đổi tên` / `Chỉnh sửa`.
- **Trạng thái Chỉnh sửa (Frame B - Interactive Morph Frame)**:
  - Hoạt ảnh chuyển khung với `AnimatePresence` (`type: "spring", stiffness: 350, damping: 28`).
  - Khung Bevel gradient ấm nhẹ (`border-[#FF4D24]/35`).
  - Input `newUsername` với tiền tố `@`, tự động lọc khoảng trắng, hiển thị bộ đếm ký tự `x/50 ký tự` và nhãn `Hợp lệ` màu xanh ngọc khi $\ge 3$ ký tự.
  - Phím bấm `Hủy` và `Xác nhận` (gradient `#FF4D24` kèm icon loading spinner `RefreshCw`).

### 4.2. Khối Cấu hình Hệ thống & API Gateway (Tab 5 - Thiết lập & Phiên)
- **Vị trí**: Đặt trang trọng ở đầu Tab 5 ("Thiết lập & Phiên"), hoàn toàn tách biệt khỏi form thông tin cá nhân.
- **Tính năng đầy đủ**:
  - Hiển thị Active Endpoint URL và trạng thái mã hóa `TLS 1.3 / Bearer`.
  - Nút **Kiểm tra ping**: Gửi request thăm dò, đo lường độ trễ mạng thực tế (Latency ms) và hiển thị thanh trạng thái màu xanh/vàng/đỏ.
  - Nút **Cấu hình URL**: Mở rộng Drawer tùy chỉnh Base URL kèm các nút gợi ý nhanh (`Spring Boot Local 8080`, `Express BFF Gateway 3000`) và nút `Khôi phục mặc định`.

---

## 5. ĐỒNG BỘ TRẠNG THÁI TOÀN CỤC (CLIENT-STATE SYNCHRONIZATION)

Khi người dùng lưu hồ sơ, đổi tên đăng nhập hoặc thay đổi ảnh đại diện:
1. **Cập nhật React State**: `setUser(...)`, `setEditFullName(...)`, `setEditAvatarUrl(...)`.
2. **Lưu trữ đa khóa vào LocalStorage**:
   - `STORAGE_KEYS.CURRENT_USER` & `horizon_current_user`
   - `STORAGE_KEYS.USER_PROFILE` & `horizon_redis_profile`
3. **Kích hoạt Custom Storage Event**:
   ```typescript
   if (typeof window !== "undefined") {
     window.dispatchEvent(new Event("storage"));
   }
   ```
   Giúp `Navbar`, `SidebarMenu`, `CartDropdownMenu` và toàn bộ các component trên ứng dụng tự động phản ánh Họ tên, Username, Avatar và Hạng thành viên mới ngay tức thì (0ms) mà không cần tải lại trang.

---

## 6. MA TRẬN MÃ LỖI & HƯỚNG DẪN XỬ LÝ (ERROR HANDLING MATRIX)

| HTTP Status | Mã lỗi / Tình huống | Thông điệp hiển thị | Hướng xử lý trên FE |
| :--- | :--- | :--- | :--- |
| **`200 OK`** | `SUCCESS` | *"Cập nhật thông tin hồ sơ thành công!"* / *"Đổi tên đăng nhập thành công!"* | Cập nhật local state, kích hoạt event `storage`, cập nhật thời gian đồng bộ. |
| **`400 Bad Request`** | `INVALID_FORMAT` | *"Thông tin không hợp lệ. Vui lòng kiểm tra lại."* | Highlight viền đỏ trường bị lỗi và hiển thị inline helper text. |
| **`401 Unauthorized`** | `TOKEN_EXPIRED` | *"Phiên làm việc đã hết hạn..."* | Tự động kích hoạt luồng `executeRefreshToken()`. Nếu thất bại, chuyển về trang Login. |
| **`403 Forbidden`** | `ACCESS_DENIED` | *"Bạn không có quyền thực hiện thao tác này."* | Thông báo lỗi phân quyền. |
| **`409 Conflict`** | `USERNAME_EXISTS` | *"Tên đăng nhập đã tồn tại trên hệ thống."* | Thông báo lỗi trùng username và yêu cầu chọn tên khác. |
| **`413 Payload Too Large`** | `FILE_TOO_LARGE` | *"Kích thước ảnh không được vượt quá 5MB."* | Bắt lỗi trực tiếp tại Client trước khi gửi request. |
| **`500 / 502 / Offline`** | `NETWORK_ERROR` | *"Không thể kết nối đến máy chủ. Đã lưu thay đổi vào bộ nhớ cục bộ."* | Tự động lưu trữ offline vào `localStorage` để trải nghiệm người dùng không bị gián đoạn. |

---

## 7. KẾ HOẠCH XÁC MINH & BẢO ĐẢM CHẤT LƯỢNG (VERIFICATION STRATEGY)

1. **Kiểm tra biên dịch & Type Check**: Chạy `npx tsc --noEmit` đạt 0 lỗi.
2. **Kiểm tra Live Browser Rendering**:
   - Mở Accounts Center tab **Hồ sơ cá nhân**: Kiểm tra form gọn gàng, thuần thông tin cá nhân.
   - Bấm nút `Đổi tên` tại trường Username $\rightarrow$ quan sát hoạt ảnh chuyển khung mượt mà, nhập username mới $\rightarrow$ bấm `Xác nhận`.
   - Chuyển sang Tab 5 **Thiết lập & Phiên** $\rightarrow$ kiểm tra khối API Gateway & Endpoint Configuration đầy đủ, bấm `Kiểm tra ping` và thử đổi URL Endpoint.
