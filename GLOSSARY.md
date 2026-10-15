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

