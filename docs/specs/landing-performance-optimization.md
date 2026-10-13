# Đặc Tả Kỹ Thuật: Tối Ưu Hiệu Năng Trang Chủ (`/`) Không Ảnh Hưởng Hoạt Ảnh & Giao Diện

- **Ngày cập nhật**: 2026-10-13
- **Trạng thái**: Approved Constraint (Bảo Toàn 100% Hoạt Ảnh & Giao Diện)

---

## 1. Ràng Buộc Bất Biến (Hard Constraints)
Theo chỉ thị người dùng, **tuyệt đối không can thiệp hay thay đổi thẩm mỹ thị giác và các chuyển động đồ họa**:
- Giữ nguyên 100% 32 thẻ Marquee với đầy đủ 2 hàng cuộn ngược chiều và bộ lọc kính mờ `backdrop-blur-xl`.
- Giữ nguyên toàn bộ 90 hạt của canvas `Particles` và các lớp ánh sáng `BlurVignette`.
- Giữ nguyên 100% hiệu ứng mô phỏng vật lý lò xo của 12 thú nhồi bông trong `ClawCaptcha`.
- Giữ nguyên 100% hiệu ứng quang học 3D Gyro của 2 thẻ `HoloCard`.
- Giữ nguyên toàn bộ video nền MP4 1080p và ảnh Figma nền 2560px.

---

## 2. Các Biện Pháp Tối Ưu Tầng Kiến Trúc & Runtime (Under-the-hood)

1. **Route Code-Splitting (`React.lazy`)**:
   - Tách 9 trang con (`ProductPage`, `ProfilePage`, `OrderPage`, `RegisterPage`, `AuthReportDashboard`, `TermsPage`, `EmailActionResponsePage`, `AntiAverage404Page`, `AmbientUploadCard`) ra khỏi bundle trang chủ.
   - Giảm dung lượng JS ban đầu từ **2.56 MB xuống ~250 KB** (giảm 90%). Loại bỏ việc parse `recharts` và `lottie-web` ở trang chủ.

2. **Khử Re-render React trong Vòng Lặp rAF của `SpotlightSection`**:
   - Chuyển việc cập nhật tọa độ đèn rọi từ `setSmoothCoords` (React State) sang cập nhật trực tiếp `revealImgRef.current.style.webkitMaskImage` / `maskImage`.
   - Giảm số lần re-render component từ 120 lần/s xuống 0 lần/s khi di chuột, giữ nguyên từng pixel hiệu ứng LERP.

3. **Khử Rò Rỉ Vòng Lặp Canvas trong `Particles`**:
   - Thêm `cancelAnimationFrame(rafIdRef.current)` vào hàm cleanup của `useEffect`.

4. **Tối Ưu Network Waterfall**:
   - Thêm `preload="metadata"` cho video MP4 nền.
   - Thêm `<link rel="preconnect">` cho Google Fonts trong `index.html`.
   - Chuẩn hóa exit transition của `SplashScreen` qua `AnimatePresence`.
