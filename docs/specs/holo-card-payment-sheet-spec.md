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
  - **Khung chứa chính**: `max-w-3xl` (`767x413px`), viền bo `rounded-t-3xl sm:rounded-3xl`, hiệu ứng kính mờ `bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl`, viền bóng rọi theo màu định danh của gói (`glowColor`).
  - **Cột trái (`md:col-span-5 h-full`)**: Hiển thị [`HoloCard.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCard.tsx) (`compact`, `hideButton`) đồng bộ giá và chu kỳ thực tế, hỗ trợ con quay hồi chuyển / chuột tương tác (3D tilt, specular highlight, holographic foil layer mix-blend).
  - **Cột phải (`md:col-span-7 flex flex-col h-full`)**: Bố cục dọc tối ưu kiểm soát không gian (`767x413px`):
    - **Cụm trên**: Bộ chuyển chu kỳ (Segmented Control): 3 tháng vs 1 năm (tiết kiệm 20%), sliding pill với Spring physics.
    - **Boong thanh toán mở rộng toàn khung (Expanded 3D Payment Methods Deck)**:
      - 4 thẻ phương thức dạng hàng ngang (`min-h-[48px] sm:min-h-[52px] rounded-2xl`), tích hợp logo trực tiếp, nhãn tài khoản và Tag thời gian 3D Tactile (`#0s_Tức_thì`, `#1_Chạm`, `#3D_Secure`, `#Quét_10s`).
      - Cơ chế Chống lẹm viền (Zero-Clipping Boundary):
        - Vùng chứa boong áp dụng `overflow-visible` cùng khoảng thở `p-1 sm:p-1.5`.
        - Loại bỏ `overflow-hidden` trên từng thẻ, giúp toàn bộ viền trên, góc bo `rounded-2xl`, viền sáng `ring-1` và bóng đổ nâng khối (`y: -2px`, `scale: 1.018`) của thẻ đầu (Google Pay) hiển thị trọn vẹn 100%, không bị cắt ngang lẹm viền.
      - Đồng bộ chu kỳ thanh toán với [`HoloCard.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCard.tsx):
        - Truyền `overridePrice={displayPrice}` và `overridePeriod={displayPeriod}` trực tiếp để hiển thị giá 3 tháng hoặc 1 năm tức thì, không gây giật lag hay lệch layout.
    - **Nút hành động kích hoạt thanh toán (Primary Checkout CTA Button)**:
      - Nút bấm chính gắn trực tiếp vào cuối cột phải (`h-11 sm:h-12 w-full rounded-2xl font-bold font-sans text-sm shadow-md`), kích hoạt hàm `handlePay()`.
      - Hiển thị nhãn động theo phương thức và giá tiền (ví dụ: *"Thanh toán 288.000₫ qua Google Pay"*).
      - Quản lý trạng thái loading `isProcessing` (Spinner + disabled) và feedback tức thì.
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
      ▼ User click nút CTA "Thanh toán ngay"
[PROCESSING (isProcessing = true, CTA loading spinner)]
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

## 4. Tích hợp Dịch vụ Backend & Sổ cái Kiểm toán Apache Fineract

Hệ thống kết nối trực tiếp với Spring Boot ERP (:8080) và phân tách làm 2 luồng nghiệp vụ tài chính riêng biệt:

### 4.1. Luồng A: Đăng ký Gói Định kỳ Google Pay Web (Recurring MIT)
- **Endpoint**: `POST /api/v1/subscriptions/google-pay/register`
- **Quyền hạn**: `ROLE_USER` (Bắt buộc JWT Bearer Token).
- **Request Body**:
  ```json
  {
    "planCode": "PLATINUM_12M",
    "paymentToken": "encrypted_gpay_token_string",
    "cardNetwork": "VISA",
    "lastFour": "4242"
  }
  ```
- **Xử lý nghiệp vụ Backend**:
  - Tuân thủ PCI-DSS Req 3.2: Không lưu số thẻ PAN, CVV.
  - Lưu thẻ vào Vault `customer_payment_profiles` (`gateway = 'GOOGLE_PAY_INTERNAL'`), sinh `multi_use_token`.
  - Khởi tạo `UserSubscription` với trạng thái `TRIALING` (30 ngày dùng thử miễn phí), `isTrial = true`.
  - Nâng hạng tài khoản người dùng `User.rank = targetRank`.
  - **Quy tắc Zero-Accounting**: Trong giai đoạn dùng thử 0 VND, **tuyệt đối không** sinh bút toán hạch toán trên Apache Fineract.
- **Kỳ gia hạn định kỳ (Sau 30 ngày - MIT Renewal)**:
  - Trigger qua `POST /api/v1/subscriptions/{id}/renew`.
  - Hệ thống tự động trừ tiền qua `chargeRecurringMit(multiUseToken, priceAmount, 'VND')`.
  - Chuyển trạng thái gói sang `ACTIVE`, gia hạn `expiryTime`.
  - Tự động sinh bút toán kép trên Apache Fineract (`POST /journalentries`):
    - **Nợ (Debit)**: Tài khoản Tài sản Ngân hàng (`glAccountId = 4`, mã `1121` - Bank Account).
    - **Có (Credit)**: Tài khoản Doanh thu Dịch vụ (`glAccountId = 2`, mã `5111` - Sales Revenue).
    - **Số tiền**: Bằng chính xác `priceAmount` của gói. Tiền tệ: `VND`.
    - **Idempotency**: `referenceNumber = SALE-SUB-{id}-{timestamp}`.

### 4.2. Luồng B: Mua Gói Trả Tiền Một Lần (One-Time Purchase qua VNPay/MoMo/Thẻ)
- **Endpoint**: `POST /api/v1/subscriptions/purchase-onetime`
- **Quyền hạn**: `ROLE_USER`.
- **Request Body**:
  ```json
  {
    "planCode": "PLATINUM_12M",
    "paymentMethod": "VNPAY",
    "transactionReference": "VNPAY_TXN_1791928374",
    "note": "Thanh toán gói Bạch Kim 1 năm"
  }
  ```
- **Xử lý nghiệp vụ Backend**:
  - Khởi tạo gói với trạng thái `ACTIVE` ngay lập tức (`isTrial = false`).
  - Hạn dùng: `now + plan.billingPeriodMonths`.
  - Nâng hạng tài khoản người dùng `User.rank = targetRank`.
  - Tự động gọi `FineractJournalService.recordSale` hạch toán doanh thu tức thì vào sổ cái Fineract (Nợ TK 4 / Có TK 2).

### 4.3. Xác thực Phiên làm việc Google OAuth2 & Cấp Quyền
- Khởi tạo: `GET /api/auth/oauth2/authorize/google` (sinh nonce chống CSRF, lưu Redis TTL 10m + Cookie `oauth_state`).
- Tiếp nhận Callback: `GET /api/auth/oauth2/callback/google?code=...&state=...` (đối soát state, sinh vé `auth_ticket` TTL 2m lưu Redis).
- Đổi vé lấy Token: `POST /api/auth/oauth2/token` (tiêu thụ vé `auth_ticket` nguyên tử `GETANDDEL`, cấp cặp JWT Access Token và Refresh Token).

---

## 5. Rủi ro Kỹ thuật & Điểm Chất vấn Chuyên sâu (Grill Points & Recommendations)

1. **Khuyết thiếu Nút bấm Kích hoạt Thanh toán (CTA Button Defect)**:
   - **Thực tế**: Code hiện tại tại [`HoloCardPaymentSheet.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCardPaymentSheet.tsx) có logic `handlePay`, `isProcessing`, `isSuccess` nhưng JSX không hề có nút bấm nào gọi tới `handlePay()`. Người dùng chỉ có thể click chọn thẻ phương thức mà không thể hoàn tất giao dịch.
   - ➡️ **Đề xuất**: Bổ sung nút CTA chính ở chân cột phải (`h-11 sm:h-12 w-full rounded-2xl font-bold font-sans text-sm shadow-md`), gắn `onClick={handlePay}`, hiển thị nhãn động theo phương thức và giá tiền (ví dụ: *"Thanh toán 288.000₫ qua Google Pay"*), hỗ trợ loading spinner và disabled khi `isProcessing`.

2. **Ràng buộc Không gian Vật lý & Nguy cơ Thanh cuộn (Physical Layout Budget & Zero-Scrollbar)**:
   - **Thực tế từ trình duyệt**: Container DOM thực tế đo được là `767x413px`. Chiều cao hữu dụng nội dung cột phải sau trừ padding (`p-4 sm:p-5.5` tương đương `44px`) là xấp xỉ `369px`. Hiện tại 4 thẻ phương thức đang chiếm `min-h-[58px] sm:min-h-[64px]` kèm `gap-2.5 sm:gap-3` (tổng ~292px) + Segmented control (~48px) = ~340px. Nếu chèn thêm nút CTA `h-11` (~44px) mà không tối ưu lại, tổng chiều cao sẽ vọt lên ~396px (> 369px), kích hoạt thanh cuộn dọc không mong muốn (`overflow-y-auto`).
   - ➡️ **Đề xuất**: Nén 4 thẻ phương thức về `min-h-[48px] sm:min-h-[50px]`, tinh chỉnh khoảng cách thành `gap-2 sm:gap-2.5`, giữ padding thẻ `py-2 sm:py-2.5`. Tổng chiều cao của 4 thẻ sẽ giảm xuống ~216px, kết hợp Segmented Control (44px) và CTA (44px) tổng cộng ~304px, nằm an toàn trong ngưỡng `369px` và triệt tiêu hoàn toàn thanh cuộn.

3. **Bất đồng bộ Bản chất Nghiệp vụ: Định kỳ Dùng thử (Google Pay) vs Thanh toán Một lần (MoMo/VNPay)**:
   - **Thực tế Backend**: Google Pay là luồng **Recurring MIT với 30 ngày Dùng thử 0 VND** (không ghi nhận Fineract, chỉ ghi khi gia hạn sau 30 ngày). Trong khi đó MoMo, Card và VNPay là **Thanh toán 1 lần trả tiền ngay** (kích hoạt `ACTIVE` và ghi sổ Fineract ngay lập tức). Tuy nhiên trên UI hiện tại, cả 4 phương thức được xếp ngang hàng cùng 1 bảng giá (ví dụ: `288.000₫/năm`) khiến người dùng lầm tưởng phương thức nào cũng trừ tiền ngay hoặc phương thức nào cũng được dùng thử.
   - ➡️ **Đề xuất**:
     - Khi người dùng chọn Google Pay: Nút CTA hiển thị rõ ngữ cảnh: *"Dùng thử miễn phí 30 ngày với Google Pay"* (hoặc *"Bắt đầu dùng thử 7 ngày"* theo gói), kèm chú thích nhỏ: *"Tự động gia hạn 288.000₫ sau khi hết hạn dùng thử"*.
     - Khi người dùng chọn MoMo / VNPay / Thẻ: Nút CTA hiển thị: *"Thanh toán 288.000₫ qua [Phương thức]"*.

4. **Lệch pha Mã gói & Danh mục Dữ liệu giữa Frontend và Backend Database**:
   - **Thực tế Database**: Backend Oracle DB thực tế đang lưu các gói theo mã chu kỳ cố định: `PLATINUM_12M` (990.000₫/12 tháng), `GOLD_6M` (590.000₫/6 tháng), `SILVER_3M` (320.000₫/3 tháng) - xem migration `V22__seed_default_subscription_plans.sql`. Trong khi đó Frontend đang hardcode mã `ANH_KIM` (30.000₫/tháng) và `MA_THUAT` (120.000₫/tháng). Nếu gửi trực tiếp `ANH_KIM` lên endpoint `/purchase-onetime` hoặc `/google-pay/register`, backend sẽ ném ngay ngoại lệ `PLAN_NOT_FOUND` (HTTP 404).
   - ➡️ **Đề xuất**:
     - Cập nhật hàm map gói trong `PricingSection.tsx`: Đồng bộ `planCode` động theo chu kỳ được chọn:
       - Nếu chọn chu kỳ 3 tháng: Ánh xạ gửi `SILVER_3M` (hoặc `ANH_KIM_3M` nếu backend seed thêm).
       - Nếu chọn chu kỳ 1 năm: Ánh xạ gửi `PLATINUM_12M`.
     - Đảm bảo endpoint `GET /api/v1/subscriptions/plans` trả về danh sách gói thực tế để client bind động thay vì fallback dữ liệu tĩnh không tồn tại trong DB.

5. **Token Google Pay: Mô phỏng Cục bộ vs Google Pay Web SDK (`pay.js`)**:
   - **Thực tế**: Code hiện tại đang sinh token giả lập dạng chuỗi `"tok_gpay_wallet_" + Date.now()`. Backend trong giai đoạn thử nghiệm đang chấp nhận token này qua Vault `customer_payment_profiles`.
   - ➡️ **Đề xuất**:
     - Pha 1 (Hiện tại): Tiếp tục duy trì mock token để kiểm thử trơn tru trải nghiệm UI/UX và trạng thái loading/success.
     - Pha 2 (Production): Tích hợp script chính thức `https://pay.google.com/gp/p/js/pay.js`, khởi tạo `PaymentsClient` với `ENVIRONMENT_TEST` hoặc `ENVIRONMENT_PRODUCTION`, gọi `loadPaymentData` để nhận token mã hóa thực tế từ Google Wallet.

6. **Chính sách Phiên Khách vãng lai & OAuth2 Google**:
   - **Thực tế**: [`subscriptionService.ts`](file:///C:/Users/ddicg/orca/noname/src/services/subscriptionService.ts#L23-L29) đang tự động dùng `TEST_USER_ACCESS_TOKEN` khi người dùng chưa đăng nhập, dẫn tới mọi giao dịch đều gán cho User ID `1L` (`testuser01@example.com`).
   - ➡️ **Đề xuất**: Khi người dùng nhấn CTA thanh toán mà chưa có JWT token hợp lệ, mở popup điều hướng đến luồng Google OAuth2 `/api/auth/oauth2/authorize/google`, sau khi hoàn tất cấp token thì tự động kích hoạt lại lệnh thanh toán cho chính xác tài khoản người dùng đó.


