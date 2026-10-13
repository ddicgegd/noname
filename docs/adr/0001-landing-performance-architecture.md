# ADR 0001 - Kiến Trúc Tối Ưu Hiệu Năng Trang Chủ: Code-Splitting & Viewport Gating

- **Trạng thái**: Accepted
- **Ngày quyết định**: 2026-10-13

## Bối cảnh & Vấn đề (Context)
Trang chủ (`/`) gặp hiện tượng giật lag, đơ con trỏ chuột và nghẽn CPU/GPU nghiêm trọng ngay khi vừa tải trang. Qua điều tra thực nghiệm, nguyên nhân là:
1. Bundle nguyên khối (Monolithic 2.5MB JS) do import tĩnh tất cả các trang con (`ProductPage`, `ProfilePage`, `OrderPage`, `RegisterPage`...) kéo theo các thư viện nặng (`recharts`, `lottie-web`).
2. Toàn bộ cây DOM gồm 4 section nặng được render đồng thời tại `t = 0`, kích hoạt cùng lúc 5 vòng lặp `requestAnimationFrame` (Canvas particles, Physics thú bông, 2 thẻ 3D HoloCard) và hàng chục lớp `backdrop-filter: blur(20px)` trên video 1080p và 32 thẻ Marquee.

## Quyết định (Decision)
Chúng tôi quyết định áp dụng mô hình kiến trúc:
1. **Route-level Code Splitting**: Dùng `React.lazy()` và `<Suspense>` trong [App.tsx](file:///C:/Users/ddicg/orca/noname/src/App.tsx) cho tất cả các trang con ngoài Landing.
2. **Viewport Gating (IntersectionObserver)**: Trì hoãn việc mount DOM và khởi chạy vòng lặp rAF của các section dưới fold (`FeatureOne`, `ShowcaseSection`, `PricingSection`) cho đến khi người dùng cuộn gần tới vị trí hiển thị (threshold ~250px).
3. **Bypass React Re-render trong Animation Loop**: Trong `SpotlightSection`, thay thế việc gọi `setSmoothCoords` (React State) trong vòng lặp rAF bằng việc cập nhật trực tiếp biến CSS (`--spot-x`, `--spot-y`) trên phần tử DOM.
4. **Khử rò rỉ bộ nhớ**: Thêm lệnh hủy `cancelAnimationFrame` trong cleanup của `Particles.tsx`.

## Các lựa chọn đã xem xét & Lý do loại bỏ (Considered Options)
- **Phương án A: Tháo bỏ hoàn toàn các hiệu ứng đồ họa (HoloCard, ClawCaptcha, Particles, Marquee)**:
  - *Lý do loại bỏ*: Đây là các nét đặc trưng nhận diện thương hiệu cao cấp (Cyber-Industrial / High-end FinTech) đã được thiết kế và phê duyệt. Việc loại bỏ sẽ làm suy giảm thẩm mỹ sản phẩm.
- **Phương án B: Chuyển đổi toàn bộ sang Server-Side Rendering (Next.js)**:
  - *Lý do loại bỏ*: Dự án hiện là Vite + Express/GraphQL Client-Side Hydrated SPA. Chi phí kiến trúc và rủi ro hồi quy (regression) khi chuyển framework là quá lớn và không khả thi trong phạm vi hiện tại.

## Hệ quả & Đánh đổi (Consequences)
- **Lợi ích**:
  - Initial JS bundle tải ở trang chủ giảm ~90% (từ 2.5MB xuống dưới ~250KB).
  - Main thread không bị block lúc khởi động, FPS duy trì ổn định 60/120fps.
  - Bộ nhớ RAM và GPU fill-rate giảm mạnh, không còn tình trạng quạt tản nhiệt hú.
- **Ràng buộc / Đánh đổi**:
  - Khi chuyển trang lần đầu (ví dụ nhấn vào /p hoặc /o), người dùng sẽ thấy thanh tải nhỏ (Fallback loader) trong ~100-200ms trước khi mã trang đó nạp xong.
  - Khi cuộn nhanh xuống đáy trang, các section nặng cần một khoảng trễ nhỏ (~50ms) để mount, đòi hỏi placeholder kích thước chuẩn để tránh Layout Shift (CLS).
