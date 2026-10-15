# Đặc tả Kỹ thuật: HoloCard Payment Sheet & FLIP Morphing Dialog

- **Module**: Giao diện Thanh toán Thuê bao & Bảng giá Hologram
- **Target Components**:
  - [`HoloCardPaymentSheet.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCardPaymentSheet.tsx)
  - [`HoloCard.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCard.tsx)
  - [`PricingSection.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/PricingSection.tsx)
- **Service Integration**: [`subscriptionService.ts`](file:///C:/Users/ddicg/orca/noname/src/services/subscriptionService.ts)

---

## 1. Kiến trúc Giao diện & DOM Layout

- **Vị trí Portal**: Gắn trực tiếp vào `document.body` thông qua `createPortal`, z-index `z-[100]`.
- **Cấu trúc 2 cột thích ứng (Responsive Dual-Column Deck)**:
  - **Khung chứa chính**: `max-w-3xl`, viền bo `rounded-t-3xl sm:rounded-3xl`, hiệu ứng kính mờ `bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl`, viền bóng rọi theo màu định danh của gói (`glowColor`).
  - **Cột trái (md:col-span-5)**: Hiển thị `<HoloCard compact hideButton>` đồng bộ giá và chu kỳ thực tế, hỗ trợ con quay hồi chuyển / chuột tương tác (3D tilt, specular highlight, holographic foil layer mix-blend).
  - **Cột phải (md:col-span-7)**: Bố cục tối ưu chiều cao (`flex flex-col h-full`):
    - **Cụm trên**: Bộ chuyển chu kỳ (Segmented Control): 3 tháng vs 1 năm (tiết kiệm 20%), sliding pill với Spring physics.
    - **Boong thanh toán mở rộng toàn khung (Expanded 3D Payment Methods Deck)**:
      - Chiếm trọn không gian dọc (`flex-1 min-h-0 flex flex-col justify-between gap-2.5 sm:gap-3`), đồng bộ chiều cao cân bằng với `<HoloCard>` ở cột trái.
      - 4 thẻ phương thức dạng hàng ngang (`flex-1 min-h-[58px] sm:min-h-[64px] rounded-2xl`), tích hợp logo trực tiếp, nhãn tài khoản và Tag thời gian 3D Tactile (`#0s_Tức_thì`, `#1_Chạm`, `#3D_Secure`, `#Quét_10s`).
      - Cơ chế Chống lẹm viền (Zero-Clipping Boundary):
        - Vùng chứa boong áp dụng `overflow-visible` cùng khoảng thở `p-1 sm:p-1.5`.
        - Loại bỏ `overflow-hidden` trên từng thẻ, giúp toàn bộ viền trên, góc bo `rounded-2xl`, viền sáng `ring-1` và bóng đổ nâng khối (`y: -2px`, `scale: 1.018`) của thẻ đầu (Google Pay) hiển thị trọn vẹn 100%, không bị cắt ngang lẹm viền.
      - Đồng bộ chu kỳ thanh toán với [`HoloCard.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCard.tsx):
        - Truyền `overridePrice={displayPrice}` và `overridePeriod={displayPeriod}` trực tiếp để hiển thị giá 3 tháng hoặc 1 năm tức thì, không gây giật lag hay lệch layout.
    - **Cụm phản hồi trạng thái**: Bảng thông báo lỗi (`errorMessage`) và bảng thành công (`successInfo`) xuất hiện linh hoạt khi có sự kiện.

---

## 2. Mô hình Chuyển động FLIP Morphing

1. **Thu thập tọa độ nguồn (First)**: Nhận `originRect` (`DOMRect`) từ thẻ tương ứng trong [`PricingSection.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/PricingSection.tsx) khi kích hoạt nút chọn gói.
2. **Nghịch đảo & Bù trừ (Invert)**:
   - Tính toán độ lệch tâm `x = originCenterX - targetCenterX`, `y = originCenterY - targetCenterY`.
   - Scale tương đối: `scaleX = clamp(0.35, 1.4, origin.width / targetW)`, `scaleY = clamp(0.35, 1.4, origin.height / targetH)`.
3. **Phát chuyển động (Play)**: Spring transition (`stiffness: 340, damping: 28, mass: 0.85`).
4. **Hỗ trợ Giảm chuyển động (Accessibility)**: Tự động chuyển về hiệu ứng mờ dần nhẹ nhàng (`opacity: 0 -> 1`, `scale: 0.94 -> 1`) khi người dùng bật `prefers-reduced-motion`.

---

## 3. Quản lý Trạng thái & Vòng đời (State Machine)

```
[IDLE / CLOSED]
      │
      │ User click "Nâng cấp" trên thẻ bảng giá
      ▼
[OPENING / MORPHING]
      │
      ├── Đổi kỳ thanh toán: "quarterly" <-> "yearly" (Cập nhật tức thì overridePrice trên HoloCard)
      ├── Đổi phương thức: "gpay" | "momo" | "card" | "vnpay"
      │
      ▼ User click "Thanh toán"
[PROCESSING (isProcessing = true)]
      │
      ├── Gọi API đăng ký / thanh toán
      │
      ├── Thất bại: Ghi nhận errorMessage -> hiển thị AlertBanner
      │
      └── Thành công: Ghi nhận successInfo -> hiển thị SuccessBanner
            │
            └── Tự động đếm lùi 3.5s -> Đóng popup và dọn dẹp timers
```

---

## 4. Tích hợp Dịch vụ Backend (Spring Boot Integration)

- **Đăng ký Google Pay**: `POST /api/v1/subscriptions/google-pay/register`
  - Payload: `{ planCode: string, paymentToken: string, cardNetwork?: string, lastFour?: string }`
- **Thanh toán một lần (MoMo / Card / VNPay)**: `POST /api/v1/subscriptions/purchase-onetime`
  - Payload: `{ planCode: string, paymentMethod: PaymentMethod, transactionReference: string, note?: string }`
- **Cơ chế Token**: Tự động trích xuất Bearer token từ `getUnifiedAccessToken()`. Nếu chưa có session thực tế, hệ thống fallback tạm thời về `TEST_USER_ACCESS_TOKEN` để hỗ trợ kiểm thử trải nghiệm.

---

## 5. Rủi ro Kỹ thuật & Điểm cần Làm rõ (Grill Points)

1. **Ánh xạ Chu kỳ Thanh toán xuống Backend**: Request payload hiện tại chỉ truyền `planCode` (`ANH_KIM` / `MA_THUAT`), chu kỳ (`3 tháng` hay `1 năm`) đang chỉ nằm ở chuỗi tự do trong `note`. Cần xác nhận contract chuẩn của backend để lưu trữ chính xác thời hạn thuê bao.
2. **Cơ chế Chuyển tiếp Cổng Thanh toán Thực tế**: MoMo và VNPay hiện tạo transaction nội bộ dạng giả lập (`MOMO_TXN_...`). Cần xác định luồng đích thực: có trả về `paymentUrl` / Deep Link để chuyển hướng sang cổng ngân hàng hoặc mở QR trực tiếp hay không.
3. **Trải nghiệm Người dùng Chưa Đăng nhập (Guest Checkout)**: Khách chưa đăng nhập khi ấn thanh toán đang tự động ghi nhận vào tài khoản test. Cần cơ chế chặn và mở modal đăng nhập trước khi phát sinh giao dịch.
