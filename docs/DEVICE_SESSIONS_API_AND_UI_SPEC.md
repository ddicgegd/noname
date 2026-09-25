# ĐẶC TẢ KỸ THUẬT: HỆ THỐNG QUẢN LÝ PHIÊN THIẾT BỊ (SESSION MANAGEMENT) & TÍCH HỢP GIAO DIỆN

> **Phiên bản:** 1.0.0  
> **Phân hệ áp dụng:** Cổng tài khoản `/m` & Backend Gateway/BFF Redis Session Store  
> **Trạng thái:** Sẵn sàng triển khai  

---

## 1. TỔNG QUAN KIẾN TRÚC & PHÂN BỐ DỮ LIỆU (SYSTEM ARCHITECTURE)

Hệ thống quản lý phiên đăng nhập phân tán (Distributed Session Management) sử dụng mô hình kết hợp giữa **JWT Access Token** (Stateless Verification) và **Redis Session Store** (Stateful Revocation & Telemetry).

```
Client (Web / Mobile / Tablet)
         │
         ▼  (Bearer AccessToken / SessionId)
 ┌────────────────────────────────────────────────────────┐
 │   API Gateway / BFF (Express / Spring Cloud Gateway)   │
 └───────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
 ┌───────────────────┐        ┌───────────────────┐
 │   Redis Cluster   │        │ PostgreSQL DB     │
 │  (Session Store)  │        │ (User & Roles)    │
 └───────────────────┘        └───────────────────┘
```

### 1.1. Luồng cấp phát và quản lý Token:
1. Khi người dùng xác thực thành công (Login / Register / OAuth2):
   - **`AccessToken`** (JWT ~15 phút): Mang payload định danh (`userId`, `roles`, `rank`, `sessionId`), ký số bí mật, được kiểm tra cục bộ tại Gateway để đảm bảo hiệu năng $\le 5\text{ms}$.
   - **`RefreshToken`** (Opaque Token ~30 ngày): Lưu trong Redis Cluster gắn liền với metadata thiết bị của phiên đăng nhập.
2. Thông tin phân tích phần cứng và mạng được Gateway phân giải tự động từ HTTP Request Headers:
   - **User-Agent:** Phân giải trình duyệt (Chrome, Safari, Firefox), hệ điều hành (macOS, iOS, Windows, Android) và loại thiết bị (`DESKTOP`, `MOBILE`, `TABLET`).
   - **X-Forwarded-For / Client IP:** Xác định địa chỉ IP và tra cứu vị trí địa lý (GeoIP: Thành phố, Quốc gia).

---

## 2. THIẾT KẾ DỮ LIỆU REDIS (REDIS SCHEMA SPECIFICATION)

### 2.1. Cấu trúc Key & Kiểu dữ liệu:

```redis
# 1. Danh sách tất cả session ID đang hoạt động của một người dùng
user:sessions:{userId}                 -> SET [sessionId_1, sessionId_2, sessionId_3]

# 2. Hash metadata chi tiết của từng session (TTL = 30 ngày / 2,592,000s)
session:{sessionId}                   -> HASH {
                                           "userId": "usr_99812",
                                           "refreshTokenHash": "sha256_hash_value...",
                                           "clientType": "DESKTOP" | "MOBILE" | "TABLET",
                                           "deviceName": "Chrome 134 • macOS Sequoia",
                                           "deviceDetail": "Chrome 134.0.0.0 • macOS 15.3.1",
                                           "ipAddress": "118.69.182.10",
                                           "location": "TP. Hồ Chí Minh, Việt Nam",
                                           "createdAt": "2026-09-21T08:30:00Z",
                                           "lastActiveAt": "2026-09-25T14:15:00Z"
                                         }
```

---

## 3. ĐẶC TẢ CHI TIẾT REST ENDPOINTS

### 3.1. `GET /api/v1/auth/sessions` — Lấy danh sách phiên đang hoạt động
- **Mục đích:** Truy xuất tất cả các phiên đăng nhập hợp lệ của người dùng hiện tại từ Redis.
- **Headers yêu cầu:**
  - `Authorization: Bearer <AccessToken>`
- **Logic xử lý Backend:**
  1. Trích xuất `userId` và `sessionId` hiện tại từ claims của `AccessToken`.
  2. Lấy danh sách `sessionIds` từ `user:sessions:{userId}`.
  3. Đọc dữ liệu Hash `session:{sessionId}` tương ứng qua `MGET` / `Pipeline`.
  4. Gán cờ `isCurrent: true` cho session trùng khớp với request hiện tại.

#### Response mẫu (200 OK):
```json
{
  "status": {
    "code": 200,
    "message": "Truy xuất danh sách phiên thiết bị thành công"
  },
  "data": {
    "totalActive": 3,
    "currentSessionId": "sess_web_a1b2c3d4",
    "sessions": [
      {
        "id": "sess_web_a1b2c3d4",
        "deviceName": "Trình duyệt Web (Phiên hiện tại)",
        "clientType": "DESKTOP",
        "deviceDetail": "Chrome 134 • macOS Sequoia",
        "ip": "118.69.182.10",
        "location": "TP. Hồ Chí Minh, Việt Nam",
        "lastActive": "Vừa xong",
        "lastActiveAt": "2026-09-25T14:30:00Z",
        "isCurrent": true
      },
      {
        "id": "sess_ios_e5f6g7h8",
        "deviceName": "Horizon Mobile App v2.4 (iOS)",
        "clientType": "MOBILE",
        "deviceDetail": "iPhone 15 Pro • iOS 18.3",
        "ip": "14.241.221.84",
        "location": "TP. Hồ Chí Minh, Việt Nam",
        "lastActive": "2 giờ trước",
        "lastActiveAt": "2026-09-25T12:15:00Z",
        "isCurrent": false
      },
      {
        "id": "sess_pad_i9j0k1l2",
        "deviceName": "iPad Pro 11\" M4 (Safari)",
        "clientType": "TABLET",
        "deviceDetail": "iPadOS 18.2 • Safari Mobile",
        "ip": "115.79.208.45",
        "location": "Hà Nội, Việt Nam",
        "lastActive": "1 ngày trước",
        "lastActiveAt": "2026-09-24T09:00:00Z",
        "isCurrent": false
      }
    ]
  }
}
```

---

### 3.2. `DELETE /api/v1/auth/sessions/{sessionId}` — Thu hồi phiên của một thiết bị cụ thể
- **Mục đích:** Người dùng chủ động đăng xuất khỏi một thiết bị cụ thể từ xa.
- **Headers yêu cầu:**
  - `Authorization: Bearer <AccessToken>`
- **Logic xử lý Backend:**
  1. Kiểm tra session mục tiêu có thuộc về `userId` đang thực hiện request không (chống IDOR).
  2. Xóa `session:{sessionId}` khỏi Redis.
  3. Xóa `sessionId` khỏi tập `user:sessions:{userId}`.
  4. Khi thiết bị bị hủy thực hiện request tiếp theo hoặc cố gắng refresh token $\rightarrow$ Gateway trả về `401 Unauthorized`.

#### Response mẫu (200 OK):
```json
{
  "status": {
    "code": 200,
    "message": "Đã thu hồi phiên thiết bị thành công"
  },
  "data": {
    "terminatedSessionId": "sess_ios_e5f6g7h8",
    "remainingActive": 2
  }
}
```

---

### 3.3. `DELETE /api/v1/auth/sessions/others` — Đăng xuất khỏi tất cả các thiết bị khác
- **Mục đích:** Đăng xuất an toàn hàng loạt, chỉ duy trì phiên làm việc trên máy đang thao tác.
- **Headers yêu cầu:**
  - `Authorization: Bearer <AccessToken>`
- **Logic xử lý Backend:**
  1. Trích xuất `currentSessionId` từ claims token.
  2. Lấy tất cả `sessionIds` trong `user:sessions:{userId}`.
  3. Xóa toàn bộ keys `session:{id}` ngoại trừ `session:{currentSessionId}`.
  4. Cập nhật `user:sessions:{userId}` chỉ còn chứa `currentSessionId`.

#### Response mẫu (200 OK):
```json
{
  "status": {
    "code": 200,
    "message": "Đã đăng xuất khỏi tất cả các thiết bị khác thành công"
  },
  "data": {
    "terminatedCount": 2,
    "remainingActive": 1
  }
}
```

---

## 4. THIẾT KẾ GIAO DIỆN TÍCH HỢP (UI/UX DESIGN INTEGRATION)

### 4.1. Sơ đồ bố cục phân hệ `/m` (Accounts Center):

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ TRUNG TÂM TÀI KHOẢN (ACCOUNTS CENTER)                                                    ✕  │
├───────────────────────────────┬─────────────────────────────────────────────────────────────┤
│  [Avt] Ngô Ngọc Định          │  Thiết bị & Phiên hoạt động                                 │
│  👑 HỘI VIÊN HORIZON          │                                                             │
│                               │  ┌───────────────────────────────────────────────────────┐  │
│  👤 Hồ sơ cá nhân             │  │ 💻 3 phiên đang kết nối • 🛡️ TLS 1.3 • 🌐 VN   [Xóa tất cả]│  │
│  🛡️ Mật khẩu & Bảo mật        │  └───────────────────────────────────────────────────────┘  │
│  📍 Sổ địa chỉ nhận hàng   2  │                                                             │
│  💳 Thẻ & Phương thức      3  │  ┌───────────────────────────────────────────────────────┐  │
│  💻 Thiết bị & Phiên   ●      │  │ 💻 Trình duyệt Web (Phiên hiện tại)  ● HOẠT ĐỘNG      │  │
│  🔖 Phụ kiện đã lưu        0  │  │    IP: 118.69.182.10 • TP. HCM • Vừa xong  [Hiện tại] │  │
│                               │  └───────────────────────────────────────────────────────┘  │
│                               │                                                             │
│                               │  CÁC THIẾT BỊ KHÁC ĐÃ LIÊN KẾT (2)                          │
│                               │  ┌───────────────────────────┐ ┌───────────────────────────┐│
│                               │  │ 📱 iPhone 15 Pro          │ │ 💻 iPad Pro 11" M4        ││
│                               │  │    IP: 14.241... [Đăng xuất]│ │    IP: 115.79...[Đăng xuất]││
│                               │  └───────────────────────────┘ └───────────────────────────┘│
│                               │                                                             │
│                               │  ┌───────────────────────────────────────────────────────┐  │
│                               │  │ ✨ Bảo mật phiên phân tán  [BẢO MẬT]                  │  │
│                               │  │    (Dynamic MorphIcon • Ám cam ấm Bevel ở đáy)        │  │
│  ✕ Đóng trung tâm tài khoản   │  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 4.2. Chi tiết 4 phân vùng giao diện:

1. **Thanh thông số trạng thái viễn trắc (Top Low-Profile Status Bar)**:
   - Thay thế các khối hộp lớn bằng thanh trạng thái ngang thanh lịch: `3 phiên đang kết nối • TLS 1.3 • Redis Sync • Việt Nam (VN)`.
   - Nút hành động nhanh `Đăng xuất tất cả khác` nằm gọn gàng bên phải.
2. **Thẻ nổi bật Phiên hiện tại (Current Session Hero Card)**:
   - Viền nổi ngọc lục bảo (Emerald), nhãn pulse `● HOẠT ĐỘNG NGAY BÂY GIỜ` và 3 cột thông số mạng (`IP Address`, `Vị trí`, `Cập nhật`).
3. **Lưới Bento các thiết bị khác (Connected Devices Bento Grid)**:
   - Mỗi thiết bị phụ có nút `Đăng xuất` (`Trash2`) độc lập dạng Soft Rose Bevel.
4. **Banner Bảo mật đáy khung (Bottom Orange Aura Banner)**:
   - Nằm sát đáy (`mt-auto`), tone màu cam ấm đồng bộ với bảng mẹo điều hướng (*Tutorial Banner*).
   - Biểu tượng động chuyển hình `SecurityDynamicMorphIcon` xoay chuyển liên tục qua các trạng thái an ninh:
     $$\text{Khiên xác thực (ShieldCheck)} \longrightarrow \text{Tia sáng (Sparkles)} \longrightarrow \text{Ổ khóa mã hóa (Lock)} \longrightarrow \text{Lá chắn (Shield)}$$

---

## 5. KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION ROADMAP)

| Giai đoạn | Nhiệm vụ chính | Kết quả đầu ra |
|---|---|---|
| **Phase 1: Backend & Redis Store** | Viết `SessionService` & API REST endpoints trên Spring Boot/Express | Hoàn thành 3 endpoints `GET /sessions`, `DELETE /sessions/{id}`, `DELETE /sessions/others` |
| **Phase 2: Frontend Service Integration** | Tạo `src/services/sessionService.ts` và gắn vào `ProfilePage.tsx` | Thay thế mock state bằng live data từ Gateway |
| **Phase 3: Realtime Session Invalidation** | Tích hợp cơ chế tự động đăng xuất qua SSE / WebSocket khi phiên bị thu hồi | Thiết bị bị đăng xuất lập tức hiển thị thông báo và chuyển hướng an toàn |
