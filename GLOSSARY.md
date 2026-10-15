# Synapse Digital Commerce & Fintech Platform

Hệ thống thương mại điện tử và giải pháp tài chính số tích hợp công nghệ hiển thị Cyber-Industrial và giao diện phản hồi micro-interactions.

## Thuật ngữ (Language)

**Spotlight Hero**:
Khu vực tiêu điểm mở đầu trang chủ, sử dụng cơ chế đèn rọi tương tác theo chuyển động con trỏ chuột trên nền video và đồ họa.
_Avoid_: Banner tĩnh, Hero banner thông thường.

**Viewport Gating**:
Cơ chế kiểm soát việc khởi tạo phần tử DOM và vòng lặp đồ họa dựa trên vị trí hiển thị thực tế của khung nhìn người dùng.
_Avoid_: Lazy loading thô sơ, render mù.

**Compositing Layer Overdraw**:
Hiện tượng GPU phải xử lý chồng lấn nhiều lớp hiệu ứng làm mờ và đổ bóng lên cùng một vùng điểm ảnh động.
_Avoid_: Lỗi mờ màn hình, lag CSS.

**AppErrorNotice & Deterministic Error Resolver**:
Cơ chế chuẩn hóa toàn diện thông báo lỗi ứng dụng, ánh xạ mọi lỗi kết nối, mạng, HTTP status code và ngoại lệ hệ thống về thông điệp thân thiện ("Lỗi hệ thống. Vui lòng thử lại sau."), triệt tiêu hoàn toàn việc rò rỉ URL kỹ thuật (localhost, cổng port, endpoint, Spring Boot, Core Banking, stack traces) ra giao diện người dùng cuối.
_Avoid_: Bóc tách regex thô sơ, fallback toán tử `||`, hiển thị raw `err.message` hoặc URL backend ra UI.

**Media Asset Key & Resolved Media URL**:
Quy chuẩn phân tách giữa khóa định danh tệp lưu trữ trên Object Storage (MinIO) và địa chỉ URL công khai hoàn chỉnh phục vụ render trên trình duyệt client.
_Avoid_: Đặt trực tiếp object key trần vào thuộc tính `src`, nhầm lẫn giữa filename cục bộ và public HTTP resource.

**HoloCard Payment Sheet & FLIP Morphing**:
Cơ chế chuyển cảnh biến hình (First, Last, Invert, Play) kết nối trực tiếp tọa độ thực của thẻ bảng giá trên trang vào khung nhìn modal thanh toán nổi hai cột (Deck/Sheet), kết hợp bộ phản chiếu Hologram đa chiều và điều khiển kỳ thanh toán/phương thức nạp tiền.
_Avoid_: Modal popup giật cục truyền thống, dialog đè tĩnh không ngữ cảnh.

**PlanCode & Billing Period Alignment**:
Cơ chế chuẩn hóa và đồng bộ 1:1 giữa mã gói cước, chu kỳ thanh toán người dùng lựa chọn trên giao diện và cấu hình thực thể `SubscriptionPlan` trong cơ sở dữ liệu backend, triệt tiêu tình trạng tính sai thời hạn thuê bao (`expiryTime`) hoặc gửi mã gói không tồn tại.
_Avoid_: Nhồi nhét chu kỳ vào chuỗi tự do `note`, hardcode mã gói không khớp database.

**Google Pay MIT Vaulting (Merchant-Initiated Transaction)**:
Cơ chế mã hóa và lưu trữ token thẻ từ Google Wallet vào hệ thống vault bảo mật, cấp quyền cho phía người bán (Merchant) tự động phát lệnh trừ tiền gia hạn định kỳ không cần sự hiện diện trực tiếp của người dùng.
_Avoid_: Lưu trữ thông tin thẻ thô (PAN/CVV), trừ tiền lặp lại thủ công.

**Fineract Double-Entry Balancing & Zero-Accounting**:
Nguyên tắc hạch toán kế toán kép chuẩn Core Banking (Nợ TK Tài sản Ngân hàng / Có TK Doanh thu Dịch vụ) đồng bộ với trạng thái thuê bao, đồng thời triệt tiêu hoàn toàn việc sinh bút toán doanh thu trong các giai đoạn dùng thử 0 VND (Trialing).
_Avoid_: Hạch toán doanh thu khống trong thời gian dùng thử, lệch cân đối Nợ - Có.

**OAuth2 Ticket Exchange Flow**:
Mô hình trao đổi vé ủy nhiệm ngắn hạn (Ticket) lưu trong bộ nhớ đệm (Redis) sau chuyển hướng xác thực tài khoản Google, giúp SPA frontend đổi lấy cặp JWT Token một cách nguyên tử mà không để lộ mã Authorization Code trên URL trình duyệt.
_Avoid_: Truyền trực tiếp JWT Token trên thanh địa chỉ URL, lưu trữ state không có thời hạn hết hạn.



