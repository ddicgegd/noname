# Bối Cảnh Thực Tế & Quyết Định Kiến Trúc (Context & Decisions)

## 1. Ngữ Cảnh Người Dùng & Yêu Cầu Cốt Lõi

Người dùng yêu cầu lập kế hoạch triển khai toàn diện với luồng nghiệp vụ 3 giai đoạn:
1. **Kiểm thử với endpoint thật trước**: Xác minh hợp đồng, mã lỗi, và tính khả dụng của các API Spring Boot ERP (:8080) và Fineract (:8443).
2. **Lên kế hoạch loại bỏ code rác hiện tại trước**: Truy quét và đào thải toàn bộ mã giả lập, token kiểm thử hardcoded, và dữ liệu cấu hình sai lệch.
3. **Cập nhật endpoint ở Frontend**: Tái cấu trúc tầng dịch vụ `subscriptionService.ts`, tích hợp nút CTA và đồng bộ gói cước trên giao diện thanh toán thẻ Hologram.

---

## 2. Dữ Liệu Thực Nghiệm Từ Hệ Thống (Observed System State)

1. **Trạng thái Mạng & Tiến trình Cổng (Network Port Audit)**:
   - Cổng `3000` (Frontend Vite HMR): Đang chạy (`PID: 16228`, phản hồi tốt).
   - Cổng `8443` (Apache Fineract Core Banking): Đang chạy (`PID: 16416`, phản hồi tốt).
   - Cổng `8080` (Spring Boot ERP Backend): Hiện tại **chưa lắng nghe** (`TcpTestSucceeded: False`). 
   - Mã nguồn backend đã được xây dựng đầy đủ tại [`SubscriptionController.java`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/src/main/java/com/ddicg/erp/modules/subscription/controller/SubscriptionController.java) và [`SubscriptionService.java`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/src/main/java/com/ddicg/erp/modules/subscription/service/SubscriptionService.java).
2. **Cấu trúc Dữ liệu trong Database Backend (Database Truth)**:
   - File migration [`V22__seed_default_subscription_plans.sql`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/src/main/resources/db/migration/V22__seed_default_subscription_plans.sql) khởi tạo 3 gói:
     - `SILVER_3M`: Gói Bạc 3 Tháng, 320.000₫, rank `SILVER`, chu kỳ 3 tháng.
     - `GOLD_6M`: Gói Vàng 6 Tháng, 590.000₫, rank `GOLD`, chu kỳ 6 tháng.
     - `PLATINUM_12M`: Gói Bạch Kim 12 Tháng, 990.000₫, rank `PLATINUM`, chu kỳ 12 tháng.
3. **Hiện Trạng Giao Diện Trình Duyệt (Browser Context Evidence)**:
   - Kích thước thẻ thanh toán modal: `767x413px`.
   - Chiều cao hữu dụng của cột phải sau trừ padding (`44px`): xấp xỉ `369px`.
   - Khiếm khuyết nghiêm trọng: JSX trong [`HoloCardPaymentSheet.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCardPaymentSheet.tsx) đang thiếu hoàn toàn nút bấm gọi hàm `handlePay()`.

---

## 3. Danh Mục Code Rác Cần Đào Thải (Dead Code Removal Inventory)

| Vị trí file | Mã rác / Khiếm khuyết | Tác hại | Giải pháp xử lý |
| :--- | :--- | :--- | :--- |
| `src/services/subscriptionService.ts:16-17` | `TEST_USER_ACCESS_TOKEN` hardcoded chuỗi JWT cố định | Rò rỉ thông tin kiểm thử, gán nhầm đơn hàng của mọi người dùng vào user ID `1` | Xóa bỏ chuỗi token test, sử dụng `getUnifiedAccessToken()`. Nếu chưa đăng nhập, kích hoạt popup đăng nhập Google OAuth2 |
| `src/components/HoloCardPaymentSheet.tsx:293` | Chuỗi token giả `"tok_gpay_wallet_" + Date.now()` | Gửi token không hợp lệ theo chuẩn Google Pay | Chuẩn bị adapter tích hợp Google Pay Web SDK (`pay.js`), bọc fallback an toàn |
| `src/components/HoloCardPaymentSheet.tsx:310` | Mã giao dịch client tự sinh `${method}_TXN_${Date.now()}` | Vi phạm nguyên tắc bảo mật và quản lý giao dịch tập trung tại Backend Gateway | Gửi request mua gói theo DTO chuẩn, giao dịch được định danh và kiểm soát bởi Backend |
| `src/components/PricingSection.tsx:16, 41` | Hardcode mã gói `ANH_KIM` (30k) và `MA_THUAT` (120k) | Gửi mã gói không tồn tại trong Oracle DB, gây lỗi `PLAN_NOT_FOUND` (HTTP 404) | Ánh xạ đồng bộ sang mã gói DB: 3 tháng -> `SILVER_3M`, 1 năm -> `PLATINUM_12M` |
| `src/components/HoloCardPaymentSheet.tsx:615-643` | Khuyết thiếu nút bấm CTA gọi `handlePay` | Người dùng chọn được phương thức nhưng không thể nhấn thanh toán | Bổ sung nút CTA 3D bevel `h-11`, đồng thời nén thẻ phương thức về `min-h-[48px]` |

---

## 4. Quyết Định Kiến Trúc (Architecture Decisions)

1. **Quyết định 1: Phân tách rõ ràng luồng Định kỳ (Google Pay MIT) và Thanh toán 1 lần (Ví/Thẻ)**:
   - Google Pay là luồng đăng ký dùng thử 30 ngày 0 VND và kích hoạt vaulting thẻ định kỳ. Không ghi nhận Fineract lúc đăng ký.
   - MoMo / VNPay / Thẻ tín dụng là luồng mua 1 lần (`purchase-onetime`), trừ tiền và kích hoạt tức thì, ghi nhận doanh thu Fineract ngay lập tức.
   - Nhãn nút CTA trên UI sẽ thay đổi tương ứng theo từng phương thức được chọn.
2. **Quyết định 2: Hạn mức Kích thước Vật lý (Physical Layout Budget) chống Scrollbar**:
   - Duy trì kích thước khung modal `767x413px` theo đúng thiết kế hiện tại.
   - Nén chiều cao 4 thẻ phương thức thanh toán từ `min-h-[64px]` xuống `min-h-[48px] sm:min-h-[50px]`, giảm `gap` từ `3` xuống `2`.
   - Đảm bảo tổng chiều cao nội dung cột phải đạt ~304px (trong hạn mức `369px`), triệt tiêu 100% thanh cuộn dọc ngoài ý muốn.
3. **Quyết định 3: Thích ứng Khởi động Backend (Backend Bootstrap Protocol)**:
   - Cung cấp script/hướng dẫn khởi động backend Spring Boot ERP (:8080) và mock contract verification khi server offline để không làm gián đoạn quy trình tích hợp frontend.
