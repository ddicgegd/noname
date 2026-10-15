# Quy Tắc Nghiệp Vụ Chuẩn Hóa (Business Rules)

Tài liệu này xác lập các quy tắc nghiệp vụ bắt buộc tuân thủ xuyên suốt quá trình thực thi sáng kiến tích hợp API gói thuê bao. Mọi task thực thi phải trích dẫn trực tiếp mã định danh (Rule ID) của quy tắc tương ứng.

---

### BR-SUB-01: Quy Tắc Đồng Bộ Mã Gói Cước Theo Chu Kỳ (PlanCode Alignment)
- **Quy tắc**: Mã gói cước (`planCode`) truyền lên backend bắt buộc phải khớp 100% với danh mục gói cước đã được seed trong cơ sở dữ liệu backend Oracle (`subscription_plans`).
- **Ánh xạ chuẩn**:
  - Gói Bạc chu kỳ 3 tháng: Mã bắt buộc là `SILVER_3M` (Giá: 320.000₫, chu kỳ: 3 tháng, rank: `SILVER`).
  - Gói Vàng chu kỳ 6 tháng: Mã bắt buộc là `GOLD_6M` (Giá: 590.000₫, chu kỳ: 6 tháng, rank: `GOLD`).
  - Gói Bạch Kim chu kỳ 12 tháng (1 năm): Mã bắt buộc là `PLATINUM_12M` (Giá: 990.000₫, chu kỳ: 12 tháng, rank: `PLATINUM`).
- **Hành vi nghiêm cấm**: Nghiêm cấm gửi các mã hardcoded không tồn tại trong DB như `ANH_KIM`, `MA_THUAT` hoặc gửi mã chu kỳ này nhưng nhét chu kỳ khác vào trường `note`.
- **Nguồn chứng cứ**: [`V22__seed_default_subscription_plans.sql`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/src/main/resources/db/migration/V22__seed_default_subscription_plans.sql#L6-L135).

---

### BR-SUB-02: Phân Định Bản Chất Dòng Tiền & Sổ Cái Fineract (Payment Flow Separation)
- **Quy tắc**:
  1. **Google Pay (Định kỳ MIT)**: Khởi tạo gói ở trạng thái `TRIALING` (30 ngày dùng thử 0 VND), nâng hạng user. **Tuyệt đối không** sinh bút toán hạch toán trên Apache Fineract trong giai đoạn này. Bút toán doanh thu chỉ được ghi nhận khi phát lệnh gia hạn sau 30 ngày (`/api/v1/subscriptions/{id}/renew`).
  2. **MoMo / VNPay / Thẻ tín dụng (Mua 1 lần)**: Khởi tạo gói ở trạng thái `ACTIVE` ngay lập tức, nâng hạng user và tự động sinh ngay bút toán kế toán kép vào sổ cái Apache Fineract (`POST /journalentries`: Nợ TK 4 Bank / Có TK 2 Revenue).
- **Hành vi trên giao diện**: Nút bấm CTA phải phản ánh chính xác bản chất này:
  - Khi chọn Google Pay: Hiển thị nhãn dùng thử miễn phí và thông tin tự động gia hạn.
  - Khi chọn MoMo/VNPay/Thẻ: Hiển thị nhãn thanh toán trực tiếp kèm số tiền thực tế.
- **Nguồn chứng cứ**: [`google-pay-web-and-fineract-subscription.md`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/docs/specs/google-pay-web-and-fineract-subscription.md#L35-L61).

---

### BR-SUB-03: Bảo Mật Phiên Làm Việc & Token Xác Thực (Session & Token Integrity)
- **Quy tắc**:
  - Mọi request thanh toán bắt buộc phải gắn kèm JWT Bearer Token hợp lệ của người dùng đang đăng nhập thông qua `getUnifiedAccessToken()`.
  - Nếu người dùng chưa đăng nhập (khách vãng lai): Khi nhấn nút CTA thanh toán, hệ thống **không được** âm thầm gán giao dịch cho user test mặc định, mà phải hiển thị modal đăng nhập/đăng ký hoặc kích hoạt popup Google OAuth2 (`/api/auth/oauth2/authorize/google`).
- **Hành vi nghiêm cấm**: Nghiêm cấm hardcode token kiểm thử `TEST_USER_ACCESS_TOKEN` trong mã nguồn sản phẩm.
- **Nguồn chứng cứ**: [`SubscriptionController.java`](file:///C:/Users/ddicg/orca/erp_springboot-experiment/src/main/java/com/ddicg/erp/modules/subscription/controller/SubscriptionController.java#L42-L43).

---

### BR-SUB-04: Hạn Mức Không Gian Vật Lý & Trải Nghiệm Thị Giác (Physical Layout Budget & Zero-Scrollbar)
- **Quy tắc**:
  - Khung chứa chính của thẻ thanh toán có kích thước vật lý cố định `767x413px`.
  - Chiều cao khả dụng cột phải sau trừ padding (`p-4 sm:p-5.5` = `44px`) là xấp xỉ `369px`.
  - Toàn bộ các thành phần cột phải (Segmented Control + 4 thẻ phương thức thanh toán + Nút CTA kích hoạt) bắt buộc phải nằm gọn bên trong chiều cao `369px`.
  - Không được làm xuất hiện thanh cuộn dọc ngoài ý muốn trên modal dialog ở màn hình desktop.
- **Thông số kỹ thuật định mức**:
  - Segmented control: Chiều cao chuẩn `36px` - `40px`, `mb-2.5 sm:mb-3`.
  - 4 Thẻ phương thức: `min-h-[48px] sm:min-h-[50px]`, khoảng cách `gap-2 sm:gap-2.5`, padding trong `py-2 sm:py-2.5`.
  - Nút bấm CTA: Chiều cao chuẩn `h-11 sm:h-12` (`44px` - `48px`), `w-full rounded-2xl font-bold font-sans text-sm`.
- **Nguồn chứng cứ**: Dữ liệu DOM thực tế từ trình duyệt (`div.p-4.sm:p-5.5`, `767x413px`).

---

### BR-SUB-05: Chuẩn Hóa Thông Báo Lỗi Người Dùng (Deterministic Error Normalization)
- **Quy tắc**:
  - Mọi lỗi phát sinh từ kết nối mạng, mã lỗi HTTP status (400, 404, 500) hoặc phản hồi backend bắt buộc phải được bọc qua bộ xử lý `getAppErrorMessage()` từ [`AppErrorNotice.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/ui/AppErrorNotice.tsx).
  - Tuyệt đối không để lộ URL kỹ thuật (localhost, port 8080, endpoint, stack traces) ra giao diện người dùng.
- **Nguồn chứng cứ**: [`GLOSSARY.md`](file:///C:/Users/ddicg/orca/noname/GLOSSARY.md) mục `AppErrorNotice & Deterministic Error Resolver`.
